import { Message } from '@/types/chat';
import { Spinner } from '../ui/spinner';
import { Streamdown } from 'streamdown';
import { cn } from '@/lib/utils';

interface ConversationListProps {
    conversation: Message[];
    loading: boolean;
}

export default function ConversationList({ conversation, loading }: ConversationListProps) {
    return (
        <div className="flex flex-col space-y-4">
            {conversation.map((msg, index) => (
                <div
                    key={index}
                    className={cn(
                        'px-6 py-4 rounded-lg ',
                        // User message styling
                        msg.role === 'assistant' ? 'border' : 'bg-yellow-200 shadow-lg'
                    )}
                >
                    <div className="max-w-3xl ">
                        {loading && !msg.content ? (
                            <div className="flex items-center gap-x-2">
                                <Spinner /> Thinking...
                            </div>
                        ) : msg.role === 'assistant' ? (
                            <Streamdown isAnimating={loading} parseIncompleteMarkdown={true}>
                                {msg.content}
                            </Streamdown>
                        ) : (
                            <p className="whitespace-pre-wrap">{msg.content}</p>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
}

function MessageBubble({ message, isStreaming }: { message: String; isStreaming: boolean }) {
    return;
}
