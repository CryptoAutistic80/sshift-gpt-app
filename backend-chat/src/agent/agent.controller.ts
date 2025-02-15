import {
  Body,
  Controller,
  Delete,
  Logger,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import {
  AdminConfigService,
  NewMessageDto,
  UserAuth,
  UserService,
} from '@nest-modules';
import { AIModel, IUserAuth } from '@helpers';
import { AgentGuard } from './agent.guard';
import { Response } from 'express-stream';
import { OpenAI } from 'openai';
import toolSchema from './tool_schema.json';
import { ChatCompletionMessageParam } from 'openai/resources';
import { AgentService } from './agent.service';
import { v4 as uuidv4 } from 'uuid';

@Controller('agent')
export class AgentController {
  private controller = new Map<string, AbortController>();
  private shouldStopStream = new Map<string, boolean>();
  private logger = new Logger(AgentController.name);

  constructor(
    private readonly userService: UserService,
    private readonly adminConfigService: AdminConfigService,
    private readonly agentService: AgentService,
    private readonly openai: OpenAI
  ) {}
  @Post()
  @UseGuards(AgentGuard)
  async newMessage(
    @Body() newMessageDto: NewMessageDto,
    @UserAuth() userAuth: IUserAuth,
    @Res() res: Response
  ) {
    const controller = new AbortController();
    this.controller.set(userAuth.address, controller);

    const reasoning = [AIModel.GPTo3Mini];
    const modelWithCallFeature = [AIModel.GPT4o, AIModel.GPT4oMini];

    const isReasoning = reasoning.includes(newMessageDto.model);
    const isParallelToolCalling = modelWithCallFeature.includes(newMessageDto.model);

    const chat = await this.userService.updateChat(
      userAuth.address,
      newMessageDto
    );

    let currentToolCalls = [];
    const assistantMessage = { content: '', images: [] };

    // Update message formatting: only ignore images for o3-mini
    const formattedMessages = chat.messages.map((msg) => {
      // For o3-mini, strip out images and only use text content
      if (isReasoning) {
        return {
          role: msg.role || 'user',
          content: msg.content || '',
        };
      }
      
      // For all other models, properly format images if present
      if (msg.role === 'user' && msg.images?.length) {
        return {
          role: 'user',
          content: [
            {
              type: 'text',
              text: msg.content || "Here's an image.",
            },
            ...msg.images.map((image) => ({
              type: 'image_url',
              image_url: {
                url: image,
                detail: 'auto',
              },
            })),
          ],
        };
      }
      
      // Handle array content (for existing vision responses)
      if (msg.role === 'user' && Array.isArray(msg.content)) {
        return msg;
      }
      
      // Default case for text-only messages
      return {
        role: msg.role || 'user',
        content: msg.content || '',
      };
    });

    const adminConfig = await this.adminConfigService.findAdminConfig();

    // Use reasoningPrompt instead of systemPrompt for o3-mini
    const systemMessageContent = isReasoning
      ? adminConfig.reasoningPrompt
      : adminConfig.systemPrompt;

    // Prepend the developer message with today's date
    const todaysDate = new Date().toLocaleDateString();
    const developerMessageContent = `Todays daye is: ${todaysDate}\n\n${
      systemMessageContent || (isReasoning ? 'Provide high reasoning.' : 'You are a helpful assistant.')
    }`;

    const messagesWithSystemPrompt = [
      {
        role: 'developer',
        content: developerMessageContent,
      },
      ...formattedMessages,
    ] as OpenAI.Chat.Completions.ChatCompletionMessageParam[];

    // Set up response headers
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    });

    try {
      const stream = await this.openai.chat.completions.create({
        model: newMessageDto.model,
        messages: messagesWithSystemPrompt,
        max_completion_tokens: isReasoning ? 30000 : 16384,
        temperature: newMessageDto.temperature,
        stream: true,
        reasoning_effort: isReasoning ? 'high' : undefined,
        tools: toolSchema as OpenAI.Chat.Completions.ChatCompletionTool[],
        tool_choice: 'auto',
        ...(isParallelToolCalling
          ? {
              parallel_tool_calls: true,
            }
          : undefined),
      });

      let shouldStopStream = this.shouldStopStream.get(userAuth.address);

      for await (const chunk of stream) {
        // Check if we should stop the stream
        if (shouldStopStream) {
          this.shouldStopStream.set(userAuth.address, false);
          // Send final message and end stream
          res.write(
            `data: ${JSON.stringify({
              final_message: {
                content: assistantMessage.content,
                images: assistantMessage.images,
              },
            })}\n\n`
          );
          res.write('data: [DONE]\n\n');
          res.end();
          return;
        }

        if (chunk.choices[0]?.delta?.content) {
          assistantMessage.content += chunk.choices[0].delta.content;
          this.writeResponseChunk(chunk, res);
        } else if (chunk.choices[0]?.delta?.tool_calls) {
          const isToolCall = await this.handleToolCall(chunk, currentToolCalls);
          if (isToolCall) {
            res.write(`data: ${JSON.stringify({ tool_call: true })}\n\n`);
          }
        } else if (chunk.choices[0]?.finish_reason === 'tool_calls') {
          const assistantToolMessage: ChatCompletionMessageParam = {
            role: 'assistant',
            content: assistantMessage.content,
            tool_calls: currentToolCalls.map((call) => ({
              id: call.id,
              type: 'function',
              function: {
                name: call.function.name,
                arguments: call.function.arguments,
              },
            })),
          };

          messagesWithSystemPrompt.push(assistantToolMessage);

          const toolResults = await this.processToolCalls(
            currentToolCalls,
            userAuth,
            controller.signal
          );
          messagesWithSystemPrompt.push(...toolResults);

          const continuationResponse = await this.openai.chat.completions.create({
            model: newMessageDto.model || 'gpt-4o-mini',
            messages: messagesWithSystemPrompt,
            max_completion_tokens: 16384,
            temperature: newMessageDto.temperature,
            stream: true,
            tools: toolSchema as OpenAI.Chat.Completions.ChatCompletionTool[],
            tool_choice: 'auto',
            ...(isParallelToolCalling
              ? {
                  parallel_tool_calls: true,
                }
              : undefined),
          });

          shouldStopStream = this.shouldStopStream.get(userAuth.address);

          for await (const continuationChunk of continuationResponse) {
            if (shouldStopStream) {
              this.shouldStopStream.set(userAuth.address, false);
              this.logger.log('Stream stopped during continuation');
              res.write(
                `data: ${JSON.stringify({
                  final_message: {
                    content: assistantMessage.content,
                    images: assistantMessage.images,
                  },
                })}\n\n`
              );
              res.write('data: [DONE]\n\n');
              res.end();
              return;
            }

            if (continuationChunk.choices[0]?.delta?.content) {
              assistantMessage.content +=
                continuationChunk.choices[0].delta.content;
              this.writeResponseChunk(continuationChunk, res);
            }
          }

          currentToolCalls = [];
        } else if (chunk.choices[0]?.finish_reason === 'stop') {
          if (assistantMessage.content) {
            messagesWithSystemPrompt.push({
              role: 'assistant',
              content: assistantMessage.content,
            });
          }

          res.write(
            `data: ${JSON.stringify({
              final_message: {
                content: assistantMessage.content,
                images: assistantMessage.images,
              },
            })}\n\n`
          );
          res.write('data: [DONE]\n\n');
          await this.userService.updateChat(userAuth.address, {
            ...newMessageDto,
            message: {
              ...assistantMessage,
              id: uuidv4(),
              role: 'assistant',
              timestamp: Date.now(),
            },
          });
          res.end();
          return;
        }
      }

      if (!res.writableEnded) {
        this.logger.log('Normal stream completion');

        res.write(
          `data: ${JSON.stringify({
            final_message: {
              content: assistantMessage.content,
              images: assistantMessage.images,
            },
          })}\n\n`
        );
        res.write('data: [DONE]\n\n');
        await this.userService.updateChat(userAuth.address, {
          ...newMessageDto,
          message: {
            ...assistantMessage,
            id: uuidv4(),
            role: 'assistant',
            timestamp: Date.now(),
          },
        });
        res.end();
      }
    } catch (error) {
      this.logger.error('Error in stream response:', error);
      if (!res.writableEnded) {
        res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
        res.write('data: [DONE]\n\n');
        res.end();
      }
    }
  }

  async handleToolCall(chunk, currentToolCalls) {
    if (chunk.choices[0]?.delta?.tool_calls) {
      const toolCall = chunk.choices[0].delta.tool_calls[0];

      if (!currentToolCalls.find((call) => call.index === toolCall.index)) {
        currentToolCalls.push({
          index: toolCall.index,
          id: toolCall.id,
          function: { name: '', arguments: '' },
        });
      }

      const currentCall = currentToolCalls.find(
        (call) => call.index === toolCall.index
      );

      if (toolCall.function) {
        if (toolCall.function.name) {
          currentCall.function.name = toolCall.function.name;
        }
        if (toolCall.function.arguments) {
          currentCall.function.arguments += toolCall.function.arguments;
        }
      }

      return true;
    }
    return false;
  }

  writeResponseChunk(chunk, res) {
    if (chunk.choices[0]?.delta?.content) {
      res.write(
        `data: ${JSON.stringify({
          content: chunk.choices[0].delta.content,
        })}\n\n`
      );
    }
  }

  async processToolCalls(
    currentToolCalls,
    userConfig: IUserAuth,
    signal: AbortSignal
  ) {
    const results = [];

    // Set global userConfig for tool calls
    global.userConfig = userConfig;

    for (const toolCall of currentToolCalls) {
      try {
        const args = JSON.parse(toolCall.function.arguments);
        const toolFunction = this.agentService[toolCall.function.name];

        if (typeof toolFunction === 'function') {
          this.logger.log(
            `Processing tool call: ${toolCall.function.name}`,
            args
          );

          let result;
          if (toolCall.function.name === 'searchNftCollection') {
            result = await toolFunction.call(
              this.agentService,
              args.collection_name,
              args.chain,
              userConfig.auth,
              signal
            );
          } else if (toolCall.function.name === 'searchTrendingNFT') {
            result = await toolFunction.call(
              this.agentService,
              args,
              userConfig.auth,
              signal
            );
          } else {
            result = await toolFunction.call(
              this.agentService,
              ...Object.values(args),
              userConfig.auth,
              signal
            );
          }

          if (result.error) {
            this.logger.error(
              `Tool call error for ${toolCall.function.name}:`,
              result.error
            );
            results.push({
              role: 'tool',
              content: JSON.stringify({
                error: true,
                message: `Tool call failed: ${result.message || 'An error occurred while processing your request. Please try rephrasing your request to avoid any potentially problematic content.'}`,
                original_request: args
              }),
              tool_call_id: toolCall.id,
            });
          } else {
            this.logger.log(
              `Tool call success for ${toolCall.function.name}:`,
              result
            );

            // Special handling for image generation results
            if (toolCall.function.name === 'generateImage') {
              // Format the result to include both URL and prompt
              const formattedResult = {
                url: result.url,
                prompt: result.prompt,
                formatted_url: `![Generated Image](${result.url})`,
              };
              results.push({
                role: 'tool',
                content: JSON.stringify(formattedResult),
                tool_call_id: toolCall.id,
              });
            } else {
              results.push({
                role: 'tool',
                content: JSON.stringify(result),
                tool_call_id: toolCall.id,
              });
            }
          }
        }
      } catch (error) {
        this.logger.error(
          `Error processing tool call ${toolCall.function.name}:`,
          error
        );
        results.push({
          role: 'tool',
          content: JSON.stringify({
            error: true,
            message: `Tool call failed: ${error.message}. Please try rephrasing your request to avoid any potentially problematic content.`,
            original_request: JSON.parse(toolCall.function.arguments)
          }),
          tool_call_id: toolCall.id,
        });
      }
    }

    // Clear global userConfig after tool calls are done
    global.userConfig = undefined;

    return results;
  }

  @Delete()
  async deleteAgent(@UserAuth() userAuth: IUserAuth) {
    const controller = this.controller.get(userAuth.address);

    controller.abort();
    this.shouldStopStream.set(userAuth.address, true);
  }
}
