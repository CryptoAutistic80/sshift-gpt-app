import { OpenAI } from 'openai';
import { handleToolCall, writeResponseChunk, processToolCalls } from './chunkHandlers.js';
import toolSchema from '../../tool_schemas/tool_schema.json';
import systemPrompt from '../../../../config/systemPrompt.json';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export async function streamResponse(res, model, messages, temperature, userConfig, auth) {
    let currentToolCalls = [];
    let assistantMessage = { content: '', images: [] };
    
    // Format messages to handle images properly
    const formattedMessages = messages.map(msg => {
        // Handle messages with images
        if (msg.role === 'user' && msg.image) {
            return {
                role: 'user',
                content: [
                    { 
                        type: 'text', 
                        text: msg.content || "Here's an image." 
                    },
                    { 
                        type: 'image_url', 
                        image_url: { 
                            url: msg.image,
                            detail: "auto"
                        } 
                    }
                ]
            };
        }
        // Handle messages that are already properly formatted for images
        if (msg.role === 'user' && Array.isArray(msg.content)) {
            return msg;
        }
        // Handle regular text messages
        return {
            role: msg.role || 'user',
            content: msg.content || ''
        };
    });

    // Add system prompt at the beginning of the messages array
    const messagesWithSystemPrompt = [
        systemPrompt,
        ...formattedMessages
    ];

    try {
        const stream = await openai.chat.completions.create({
            model: model || 'gpt-4o-mini',
            messages: messagesWithSystemPrompt,
            max_tokens: 16384,
            temperature,
            stream: true,
            tools: toolSchema,
            tool_choice: "auto",
            parallel_tool_calls: true,
        });

        res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
        });

        for await (const chunk of stream) {
            if (chunk.choices[0]?.delta?.content) {
                assistantMessage.content += chunk.choices[0].delta.content;
                writeResponseChunk(chunk, res);
                res.flush();
            }
            else if (chunk.choices[0]?.delta?.tool_calls) {
                const isToolCall = await handleToolCall(chunk, currentToolCalls);
                if (isToolCall) {
                    res.write(`data: ${JSON.stringify({ tool_call: true })}\n\n`);
                    res.flush();
                }
            }
            else if (chunk.choices[0]?.finish_reason === 'tool_calls') {
                // Add the assistant's message with tool calls to the history
                const assistantToolMessage = {
                    role: 'assistant',
                    content: assistantMessage.content,
                    tool_calls: currentToolCalls.map(call => ({
                        id: call.id,
                        type: 'function',
                        function: {
                            name: call.function.name,
                            arguments: call.function.arguments
                        }
                    }))
                };
                messagesWithSystemPrompt.push(assistantToolMessage);

                // Process tool calls and add their results to the history
                const toolResults = await processToolCalls(currentToolCalls, userConfig, auth);
                messagesWithSystemPrompt.push(...toolResults);

                // Create continuation with the updated message history
                const continuationResponse = await openai.chat.completions.create({
                    model: model || 'gpt-4o-mini',
                    messages: messagesWithSystemPrompt,
                    max_tokens: 1000,
                    temperature,
                    stream: true,
                });

                for await (const continuationChunk of continuationResponse) {
                    if (continuationChunk.choices[0]?.delta?.content) {
                        assistantMessage.content += continuationChunk.choices[0].delta.content;
                        writeResponseChunk(continuationChunk, res);
                        res.flush();
                    }
                }

                currentToolCalls = [];
            }
            else if (chunk.choices[0]?.finish_reason === 'stop') {
                if (assistantMessage.content) {
                    messagesWithSystemPrompt.push({
                        role: 'assistant',
                        content: assistantMessage.content
                    });
                }

                res.write(`data: ${JSON.stringify({ 
                    final_message: {
                        content: assistantMessage.content,
                        images: assistantMessage.images
                    }
                })}\n\n`);
                res.write('data: [DONE]\n\n');
                res.end();
                return;
            }
        }

        // Ensure we always send a final message
        if (!res.writableEnded) {
            if (assistantMessage.content) {
                messagesWithSystemPrompt.push({
                    role: 'assistant',
                    content: assistantMessage.content
                });
            }

            res.write(`data: ${JSON.stringify({ 
                final_message: {
                    content: assistantMessage.content,
                    images: assistantMessage.images
                }
            })}\n\n`);
            res.write('data: [DONE]\n\n');
            res.end();
        }

    } catch (error) {
        console.error('Error in stream response:', error);
        console.error('Current message history:', JSON.stringify(messagesWithSystemPrompt, null, 2));
        if (!res.writableEnded) {
            res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
            res.write('data: [DONE]\n\n');
            res.end();
        }
    }
} 