import { NextResponse } from 'next/server';

// LangChain imports
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { SystemMessage } from '@langchain/core/messages';

// Type imports
import { Message } from '@/types/chat';

export const runtime = 'edge';

const SYSTEM_PROMPT = new SystemMessage(
    `You are 'Bhai Saab', a helpful AI assistant with a friendly Indian personality. You're efficient, respectful, and occasionally use common Hindi phrases naturally (like "acha", "bilkul", "theek hai").

    Keep responses concise and helpful. Address users warmly but professionally. Think of yourself as a capable assistant who gets things done without unnecessary fuss.

    Example responses:
    - "Acha, I can help you with that."
    - "Bilkul, here's what you need to know..."
    - "Let me assist you with that right away."

    Be conversational, clear, and always helpful.`
);

export async function POST(req: Request) {
    const body = await req.json();
    const messages: Message[] = body?.messages ?? [];

    if (!process.env.GOOGLE_API_KEY) {
        return NextResponse.json({ error: 'Google API key not configured' }, { status: 500 });
    }

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
        return NextResponse.json({ error: 'Messages array is required' }, { status: 400 });
    }

    const encoder = new TextEncoder();
    const stream = new TransformStream();
    const writer = stream.writable.getWriter();

    // Initialize the Google Gemini model
    const llm = new ChatGoogleGenerativeAI({
        model: 'gemini-2.0-flash', // Specify the Gemini model
        apiKey: process.env.GOOGLE_API_KEY,
        temperature: 0.7, // Adjust temperature for response creativity
    });

    (async () => {
        try {
            // Replace `llm.invoke(...)` with `llm.stream(...)`
            const streamResponse = await llm.stream([SYSTEM_PROMPT, ...messages]);

            // Iterate tokens / chunks as they arrive
            for await (const chunk of streamResponse) {
                const payload = JSON.stringify({ content: chunk.content });

                // Write as Server-Sent Events: `data: <json>\n\n`
                await writer.write(encoder.encode(`data: ${payload}\n\n`));
            }

            // Inform the client that stream finished
            await writer.write(encoder.encode('data: [DONE]\n\n'));
        } catch (error) {
            console.error('Streaming error:', error);
            const payload = JSON.stringify({ error: 'Stream failed' });
            await writer.write(encoder.encode(`data: ${payload}\n\n`));
        } finally {
            await writer.close();
        }
    })();

    return new Response(stream.readable, {
        headers: {
            'Content-Type': 'text/event-stream', // Crucial header for SSE
            'Cache-Control': 'no-cache',
            Connection: 'keep-alive',
        },
    });
}
