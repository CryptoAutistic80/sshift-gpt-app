import React, { useRef, useEffect, useCallback } from 'react';
import { ScrollArea } from './scrollarea';
import { MessageBubble } from './MessageBubble';
import { StatusIndicator } from './statusIndicator';
import { Message } from '../../../app/chat/page';
import { Avatar, AvatarImage, AvatarFallback } from './avatar';
import InfiniteScroll from 'react-infinite-scroller';

interface ChatWindowProps {
  messages: Message[];
  onCopy: (text: string) => void;
  onRegenerate: (message: Message) => void;
  onEdit: (message: Message, newContent: string) => void;
  status: 'thinking' | 'tool-calling' | 'typing';
  showNoChatsMessage: boolean;
  isAssistantResponding: boolean;
  hasMoreMessages: boolean;
  onLoadMore: () => Promise<void>;
  isLoadingMore: boolean;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({ 
  messages, 
  onCopy, 
  onRegenerate, 
  onEdit,
  status,
  showNoChatsMessage,
  isAssistantResponding,
  hasMoreMessages,
  onLoadMore,
  isLoadingMore
}) => {
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const lastMessageRef = useRef<HTMLDivElement>(null);
  const [initialLoad, setInitialLoad] = React.useState(true);

  const scrollToBottom = useCallback(() => {
    if (lastMessageRef.current && initialLoad) {
      lastMessageRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [initialLoad]);

  useEffect(() => {
    if (messages.length > 0 && !isLoadingMore) {
      scrollToBottom();
    }
    if (initialLoad && messages.length > 0) {
      setInitialLoad(false);
    }
  }, [messages, isLoadingMore, scrollToBottom, initialLoad]);

  const handleLoadMore = async () => {
    if (!isLoadingMore && hasMoreMessages) {
      await onLoadMore();
    }
  };

  return (
    <div className="flex-1 overflow-hidden flex flex-col w-full max-w-7xl mx-auto relative min-h-0">
      <ScrollArea className="flex-1 min-h-0" ref={scrollAreaRef}>
        <InfiniteScroll
          pageStart={0}
          loadMore={handleLoadMore}
          hasMore={hasMoreMessages}
          loader={
            <div className="text-center py-4" key={0}>
              Loading previous messages...
            </div>
          }
          useWindow={false}
          getScrollParent={() => scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]') || null}
          isReverse={true}
          threshold={150}
        >
          <div className="w-full px-2 py-2 md:px-4 md:py-8 space-y-3 md:space-y-4">
            {messages.map((message, index) => (
              <div
                key={`${message.id}-${index}`}
                ref={index === messages.length - 1 ? lastMessageRef : null}
              >
                <MessageBubble 
                  message={message} 
                  onCopy={onCopy} 
                  onRegenerate={() => onRegenerate(message)}
                  onEdit={(editedMessage, newContent) => onEdit(editedMessage, newContent)}
                />
              </div>
            ))}
            {isAssistantResponding && (
              <div className="flex items-start space-x-2" ref={lastMessageRef}>
                {status === 'thinking' && (!messages?.length || messages[messages.length - 1]?.role === 'user') && (
                  <Avatar className="w-6 h-6 md:w-8 md:h-8 mr-2 flex-shrink-0">
                    <AvatarImage src="/images/sshift-guy.png" alt="AI Avatar" />
                    <AvatarFallback>AI</AvatarFallback>
                  </Avatar>
                )}
                <StatusIndicator status={status} className={status === 'thinking' && (!messages?.length || messages[messages.length - 1]?.role === 'user') ? "mt-1 md:mt-2" : ""} />
              </div>
            )}
          </div>
        </InfiniteScroll>
      </ScrollArea>
      {showNoChatsMessage && (
        <div className="absolute inset-0 flex items-center justify-center bg-background bg-opacity-50">
          <div className="bg-background border border-border rounded-md p-4 shadow-lg">
            <h3 className="font-semibold mb-2">No active chat</h3>
            <p>Please start a NEW CHAT to send a message</p>
          </div>
        </div>
      )}
    </div>
  );
};
