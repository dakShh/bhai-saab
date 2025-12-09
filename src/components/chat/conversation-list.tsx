// Type import
import { Message } from '@/types/chat';

// Utils import
import { cn } from '@/lib/utils';

// Component import
import { Streamdown } from 'streamdown';
import { Spinner } from '../ui/spinner';

interface ConversationListProps {
    conversation: Message[];
    loading: boolean;
}

export default function ConversationList({ conversation, loading }: ConversationListProps) {
    return (
        <div className="flex flex-col space-y-4">
            {conversation.map((msg, index) => {
                // Only the last message should show as streaming
                const isLastMessage = index === conversation.length - 1;
                const isStreaming = loading && isLastMessage;

                return (
                    <div
                        key={index}
                        className={cn(
                            'px-6 py-4 rounded-lg transition-colors',
                            msg.role === 'assistant' ? 'border border-gray-200' : 'bg-yellow-200 shadow-lg'
                        )}
                    >
                        <div className="max-w-3xl">
                            <MessageContent message={msg} isStreaming={isStreaming} />
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

const MessageContent = ({ message, isStreaming }: { message: Message; isStreaming: boolean }) => {
    if (isStreaming && !message.content) {
        return <LoadingIndicator />;
    }

    if (message.role === 'assistant') {
        return (
            <Streamdown isAnimating={isStreaming} parseIncompleteMarkdown={true}>
                {message.content}
            </Streamdown>
        );
    }

    return <p className="whitespace-pre-wrap">{message.content}</p>;
};

const LoadingIndicator = () => (
    <div className="flex items-center gap-x-2">
        <Spinner /> Thinking...
    </div>
);
