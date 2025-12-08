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
                        'px-6 py-4 rounded-lg',
                        msg.role === 'assistant' ? 'border' : 'bg-yellow-200 shadow-lg'
                    )}
                >
                    <div className="max-w-3xl">
                        <MessageContent message={msg} isStreaming={loading} />
                    </div>
                </div>
            ))}
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
