import { NextResponse } from 'next/server';

// LangChain imports
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { SystemMessage } from '@langchain/core/messages';

// Type imports
import { Message } from '@/types/chat';

const systemPrompt = 'You are Bhai Saab, a helpful and friendly AI assistant.';

export async function POST(req: Request) {
    const body = await req.json();
    const messages: Message[] = body?.messages ?? [];

    if (!process.env.GOOGLE_API_KEY) {
        return NextResponse.json({ error: 'Google API key not configured' }, { status: 500 });
    }

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
        return NextResponse.json({ error: 'Messages array is required' }, { status: 400 });
    }

    // Initialize the Google Gemini model
    const llm = new ChatGoogleGenerativeAI({
        model: 'gemini-2.0-flash',
        apiKey: process.env.GOOGLE_API_KEY,
        temperature: 0.7,
    });

    const result = await llm.invoke([new SystemMessage(systemPrompt), ...messages]);

    return NextResponse.json({ reply: result.content });
}
