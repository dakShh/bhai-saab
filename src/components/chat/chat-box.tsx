'use client';

import { useState } from 'react';

// Utils imports
import { cn } from '@/lib/utils';

// Type imports
import { Message } from '@/types/chat';

// Icon imports
import { Send } from 'lucide-react';

// Component imports
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';

export default function ChatBox() {
    const [userInput, setUserInput] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);
    const [conversation, setConversation] = useState<Message[]>([
        { role: 'assistant', content: 'Hello! How can I assist you today?' },
    ]);

    // I have added comments here to explain the onSubmit function in detail for better understanding.
    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!userInput.trim()) return; // Prevent sending empty messages
        const userMessage: Message = { role: 'user', content: userInput };

        // Update UI immediately with user message
        setConversation((prev) => [...prev, userMessage]);
        setUserInput('');
        setLoading(true);

        // Add an empty assistant message that we'll update as chunks arrive
        const assistantMessageIndex = conversation.length + 1;
        setConversation((prev) => [...prev, { role: 'assistant', content: '' }]);

        try {
            // Send the conversation to the backend API
            const response = await fetch('/api/chat/stream', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    messages: [...conversation, userMessage] as Message[],
                }),
            });

            if (!response.body) throw new Error('No response body');

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let accumulatedContent = '';

            while (true) {
                const { done, value } = await reader.read();
                // console.log('{ done, value }');
                if (done) break;

                // Decode the chunk
                const chunk = decoder.decode(value);
                const lines = chunk.split('\n');
                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const data = line.slice(6);

                        if (data === '[DONE]') {
                            break;
                        }

                        try {
                            const parsed = JSON.parse(data);
                            if (parsed.content) {
                                accumulatedContent += parsed.content;

                                // Update the assistant message in real-time
                                setConversation((prev) => {
                                    const updated = [...prev];
                                    updated[assistantMessageIndex] = {
                                        role: 'assistant',
                                        content: accumulatedContent,
                                    };
                                    return updated;
                                });
                            }
                        } catch (error) {
                            console.error('Error parsing stream data:', error);
                        }
                    }
                }
            }
        } catch (error) {
            // Handle errors gracefully
            console.error('Error during chat request:', error);
            setConversation((prev) => {
                const updated = [...prev];
                updated[assistantMessageIndex] = {
                    role: 'assistant',
                    content: 'Sorry, something went wrong. Please try again.',
                };
                return updated;
            });
        } finally {
            // Reset loading state
            setLoading(false);
        }
    };

    function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
        setUserInput(e.target.value);
    }
    return (
        <div className="max-w-5xl h-[90vh] mx-auto flex flex-col">
            <div className="text-xl font-bold py-6 ">AI Personal Assistant - Bhai Saab</div>
            <div className=" overflow-y-auto mb-6">
                <div className="flex flex-col space-y-4">
                    {conversation.map((msg, index) => (
                        <div
                            key={index}
                            className={cn(
                                'px-6 py-4 rounded-lg shadow-lg',
                                // User message styling
                                msg.role === 'assistant' ? 'bg-neutral-500 text-white' : 'bg-yellow-200'
                            )}
                        >
                            {}
                            <div className="max-w-3xl whitespace-pre-wrap">
                                {loading && !msg.content ? (
                                    <div className="flex items-center gap-x-2">
                                        <Spinner /> Thinking...
                                    </div>
                                ) : (
                                    msg.content
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <form
                className={cn('border rounded-2xl shadow-xl', 'flex gap-2', 'mt-auto py-2 px-4')}
                onSubmit={onSubmit}
            >
                <Input
                    placeholder="Check my schedule for today.."
                    className="border-0 shadow-none focus-visible:ring-0"
                    name="userInput"
                    value={userInput}
                    onChange={handleChange}
                    autoComplete="off"
                />
                <Button className="text-white" disabled={loading} type="submit">
                    {loading ? <Spinner /> : <Send />}{' '}
                </Button>
            </form>
        </div>
    );
}
