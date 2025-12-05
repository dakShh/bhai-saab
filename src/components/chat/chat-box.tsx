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

            // Handle response from the backend
            const data = await response.json();
            const aiMessage: Message = { role: 'assistant', content: data.reply };

            // Update UI with AI response
            setConversation((prev) => [...prev, aiMessage]);
        } catch (error) {
            // Handle errors gracefully
            console.error('Error during chat request:', error);
            setConversation((prev) => [
                ...prev,
                { role: 'assistant', content: 'Sorry, something went wrong. Please try again.' },
            ]);
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
                                msg.role === 'assistant' ? 'bg-neutral-500 text-white' : 'bg-yellow-200' // User message styling
                            )}
                        >
                            <div className="max-w-3xl whitespace-pre-wrap">{msg.content}</div>
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
                />
                <Button className="text-white" disabled={loading} type="submit">
                    {loading ? <Spinner /> : <Send />}{' '}
                </Button>
            </form>
        </div>
    );
}
