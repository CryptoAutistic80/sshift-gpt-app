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
        if (msg.role === 'user' && msg.image) {
            return {
                role: 'user',
                content: [
                    { type: 'text', text: msg.content || "Here's an image." },
                    { 
                        type: 'image_url', 
                        image_url: { url: msg.image, detail: "auto" } 
                    }
                ]
            };
        }
        if (msg.role === 'user' && Array.isArray(msg.content)) {
            return msg;
        }
        return {
            role: msg.role || 'user',
            content: msg.content || ''
        };
    });

    const messagesWithSystemPrompt = [
        systemPrompt,
        ...formattedMessages
    ];

    try {
        console.log('Making OpenAI API call with tools:', JSON.stringify(toolSchema, null, 2));
        console.log('Messages being sent:', JSON.stringify(messagesWithSystemPrompt, null, 2));

        const stream = await openai.chat.completions.create({
            model: model || 'gpt-4o-mini',
            messages: messagesWithSystemPrompt,
            max_tokens: 8192,
            temperature,
            stream: true,
            tools: toolSchema,
            tool_choice: "auto",
            parallel_tool_calls: true,
        });

        // Set SSE headers
        res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache, no-transform',
            'Connection': 'keep-alive',
            'X-Accel-Buffering': 'no'
        });

        for await (const chunk of stream) {
            console.log('Received chunk:', JSON.stringify(chunk, null, 2));
            
            // Handle content streaming
            if (chunk.choices[0]?.delta?.content) {
                assistantMessage.content += chunk.choices[0].delta.content;
                writeResponseChunk(chunk, res);
                res.flush();
            }
            // Handle tool calls
            else if (chunk.choices[0]?.delta?.tool_calls) {
                console.log('Tool call detected:', JSON.stringify(chunk.choices[0].delta.tool_calls, null, 2));
                const isToolCall = await handleToolCall(chunk, currentToolCalls);
                if (isToolCall) {
                    console.log('Current tool calls:', JSON.stringify(currentToolCalls, null, 2));
                    res.write(`data: ${JSON.stringify({ tool_call: true })}\n\n`);
                    res.flush();
                }
            }
            // Handle tool call completion
            else if (chunk.choices[0]?.finish_reason === 'tool_calls') {
                console.log('Tool calls completed:', JSON.stringify(currentToolCalls, null, 2));
                
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
                console.log('Tool results:', JSON.stringify(toolResults, null, 2));
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