import backend from '../../../../src/services/backend';
import * as toolCalls from './toolCalls.js';

export function writeResponseChunk(chunk, res) {
    if (chunk.choices[0]?.delta?.content) {
        res.write(`data: ${JSON.stringify({ 
            content: chunk.choices[0].delta.content,
            type: 'content'
        })}\n\n`);
    }
}

export async function handleToolCall(chunk, currentToolCalls) {
    if (chunk.choices[0]?.delta?.tool_calls) {
        const toolCall = chunk.choices[0].delta.tool_calls[0];
        
        if (!currentToolCalls.find(call => call.index === toolCall.index)) {
            currentToolCalls.push({ 
                index: toolCall.index, 
                id: toolCall.id,
                function: {
                    name: '',
                    arguments: ''
                }
            });
        }

        const currentCall = currentToolCalls.find(call => call.index === toolCall.index);
        
        if (toolCall.function?.name) {
            currentCall.function.name = toolCall.function.name;
        }
        if (toolCall.function?.arguments) {
            currentCall.function.arguments += toolCall.function.arguments;
        }

        return true;
    }
    return false;
}

export async function processToolCalls(toolCalls, userConfig, auth) {
    const results = [];
    
    for (const call of toolCalls) {
        try {
            const args = JSON.parse(call.function.arguments);
            const result = await executeToolCall(call.function.name, args, userConfig, auth);
            
            results.push({
                role: 'tool',
                content: JSON.stringify(result),
                tool_call_id: call.id
            });
        } catch (error) {
            console.error(`Error processing tool call ${call.function.name}:`, error);
            results.push({
                role: 'tool',
                content: JSON.stringify({ error: error.message }),
                tool_call_id: call.id
            });
        }
    }
    
    return results;
}

async function executeToolCall(tool, args, userConfig, auth) {
    // Verify tool credits
    const toolsCredits = await backend.get('/user/credits', {
        params: { name: tool, type: 'Tools' },
        headers: { Authorization: `Bearer ${auth}` }
    });

    if(toolsCredits?.creditsUsed && toolsCredits.creditsUsed >= toolsConfig.credits * userConfig.duration) {
        throw new Error(`Not enough credits for tool: ${tool}`);
    }

    // Execute the tool call
    const result = await toolCalls[tool](args);

    // Update credits usage
    await backend.put('/user', {
        name: tool,
        creditType: 'Tools',
        creditsUsed: toolsCredits?.creditsUsed || 0,
    }, { headers: { Authorization: `Bearer ${auth}` } });

    return result;
}