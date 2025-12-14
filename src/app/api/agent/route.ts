import { createAgentExecutor } from '@/lib/agent'; // Adjust path as needed
import { HumanMessage } from 'langchain';
import { NextResponse } from 'next/server';

export async function sendSSE(
    writer: WritableStreamDefaultWriter<Uint8Array>,
    encoder: TextEncoder,
    payload: Record<string, unknown>
) {
    const data = `data: ${JSON.stringify(payload)}\n\n`;
    await writer.write(encoder.encode(data));
}

export async function POST(req: Request) {
    try {
        // 1. Parse the request body
        const { message, threadId } = await req.json();

        if (!message || typeof message !== 'string') {
            return NextResponse.json({ error: 'Message is required' }, { status: 400 });
        }

        // Use threadId for conversation continuity, or generate a new one
        const conversationId =
            threadId || `thread_${Date.now()}_${Math.random().toString(36).substring(7)}`;

        // Initialize the Agent
        const agent = await createAgentExecutor();

        // Create a TransformStream for streaming
        const encoder = new TextEncoder();
        const stream = new TransformStream();
        const writer = stream.writable.getWriter();

        (async () => {
            try {
                const eventStream = await agent.streamEvents(
                    {
                        messages: [new HumanMessage(message)],
                    },
                    {
                        version: 'v2',
                        configurable: {
                            thread_id: conversationId,
                        },
                    }
                );

                let finalOutput = '';

                for await (const event of eventStream) {
                    // Handle different event types
                    if (event.event === 'on_chat_model_stream') {
                        // Stream LLM tokens
                        const content = event.data?.chunk?.content;

                        if (content) {
                            finalOutput += content;
                            await sendSSE(writer, encoder, { type: 'token', content });
                        }
                    } else if (event.event === 'on_tool_start') {
                        // Tool invocation started
                        await sendSSE(writer, encoder, {
                            type: 'tool_start',
                            tool: event.name,
                            input: event.data?.input,
                        });
                    } else if (event.event === 'on_tool_end') {
                        // Tool invocation completed
                        await sendSSE(writer, encoder, {
                            type: 'tool_end',
                            tool: event.name,
                            output: event.data?.output,
                        });
                    }
                }

                // Send final metadata
                await sendSSE(writer, encoder, { type: 'done', threadId: conversationId });
            } catch (error) {
                console.error('Agent execution error:', error);
                await sendSSE(writer, encoder, {
                    type: 'error',
                    content: error instanceof Error ? error.message : 'Unknown error',
                });
            } finally {
                await writer.close();
            }
        })();

        // Return the stream
        return new Response(stream.readable, {
            headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                Connection: 'keep-alive',
            },
        });
    } catch (error) {
        console.error('Agent execution error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
