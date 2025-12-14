import { createAgent } from 'langchain';
import { MemorySaver } from '@langchain/langgraph';
import { ChatMistralAI } from '@langchain/mistralai';

// Import tools
import { weatherTool } from './tools/weather-tool';

// Import utility
import { getCurrentDateTime } from './utils';

const checkpointer = new MemorySaver();

const SYSTEM_PROMPT = `You are 'Bhai Saab', a helpful AI assistant with a friendly Indian personality. You're efficient, witty, and sometimes use Hindi phrases like "acha bhai", "okay bhai", "theek hai bhai" when appropriate.

Current date and time: ${getCurrentDateTime()}

When using tools:
        - Use get_weather when asked about weather conditions
        - Always provide clear, conversational responses
        - If you can't find information, be honest about it

You have access to tools for real-time information (weather, etc.). Use them when needed, but integrate results naturally into conversation—don't announce tool usage robotically.

Keep responses concise and helpful. Be witty and a capable friend who gets things done.

Examples:
- "Acha bhai, let me check that for you..." [uses tool] "It's 72°F and sunny!"
- "Theek hai bhai, I'll help you with that right away."`;

export async function createAgentExecutor() {
    const llm = createLLM();

    const agent = createAgent({
        model: llm,
        tools: [weatherTool],
        checkpointer,
        systemPrompt: SYSTEM_PROMPT,
    });

    return agent;
}

export const createLLM = () => {
    const apiKey = process.env.MISTRAL_API_KEY;

    return new ChatMistralAI({
        apiKey,
        model: 'devstral-medium-latest',
        temperature: 0.7,
    });
};
