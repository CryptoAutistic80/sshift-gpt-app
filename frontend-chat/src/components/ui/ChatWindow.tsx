import React, { useRef, useEffect, useState } from 'react';
import { MessageBubble } from './MessageBubble';
import { StatusIndicator } from './statusIndicator';
import { Avatar, AvatarImage, AvatarFallback } from './avatar';
import InfiniteScroll from 'react-infinite-scroller';
import { Loader2 } from 'lucide-react';
import { IMessage } from '@helpers';

interface ChatWindowProps {
  messages: IMessage[];
  onCopy: (text: string) => void;
  onRegenerate: (message: IMessage) => void;
  onEdit: (message: IMessage, newContent: string) => void;
  status: 'thinking' | 'tool-calling' | 'typing';
  showNoChatsMessage: boolean;
  isAssistantResponding: boolean;
  currentChatId?: string;
  onLoadMore: (page: number) => Promise<void>;
  hasMore: boolean;
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
  onLoadMore,
  hasMore,
  isLoadingMore,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const lastMessageRef = useRef<HTMLDivElement>(null);
  const [initialLoad, setInitialLoad] = useState(true);
  const [shouldEnableInfiniteScroll, setShouldEnableInfiniteScroll] =
    useState(false);
  const isLoadingOlderMessages = useRef(false);
  const [isAutoScroll, setIsAutoScroll] = useState(true);

  // Handle scroll events to detect when user scrolls away from bottom
  const handleScroll = () => {
    if (scrollContainerRef.current && !isLoadingOlderMessages.current) {
      const { scrollTop, scrollHeight, clientHeight } =
        scrollContainerRef.current;
      // If user is within 100px of the bottom, enable auto-scroll
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
      setIsAutoScroll(isNearBottom);
    }
  };

  // Initial scroll position setup
  useEffect(() => {
    if (scrollContainerRef.current && initialLoad && messages.length > 0) {
      const container = scrollContainerRef.current;
      container.scrollTop = container.scrollHeight;
      setInitialLoad(false);

      // Enable infinite scroll after initial load
      const enableScrollTimer = setTimeout(() => {
        setShouldEnableInfiniteScroll(true);
      }, 1000);

      return () => clearTimeout(enableScrollTimer);
    }
  }, [messages, initialLoad]);

  // Auto-scroll effect
  useEffect(() => {
    if (
      isAutoScroll &&
      !isLoadingOlderMessages.current &&
      scrollContainerRef.current
    ) {
      scrollContainerRef.current.scrollTop =
        scrollContainerRef.current.scrollHeight;
    }
  }, [messages, isAutoScroll]);

  const handleLoadMore = async (page: number) => {
    if (!isLoadingMore && hasMore) {
      isLoadingOlderMessages.current = true;
      await onLoadMore(page);
      isLoadingOlderMessages.current = false;
    }
  };

  return (
    <div className="flex-1 overflow-hidden flex flex-col w-full max-w-[1920px] mx-auto relative min-h-0">
      {/* Left Panel */}
      <div className="fixed left-0 top-[73px] bottom-0 w-[max(0px,calc((100%-1920px)/2*0.75))] bg-transparent hidden md:block">
        {/* Your left panel content here */}
      </div>

      {/* Right Panel */}
      <div className="fixed right-0 top-[73px] bottom-0 w-[max(0px,calc((100%-1920px)/2*0.75))] bg-transparent hidden md:block">
        {/* Your right panel content here */}
      </div>

      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto scrollbar-hide bg-gray-50/50 shadow-[inset_6px_0_8px_-6px_rgba(0,0,0,0.15),inset_-6px_0_8px_-6px_rgba(0,0,0,0.15)] border border-gray-200/50"
        style={{
          height: 'calc(100vh - 180px)',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          WebkitOverflowScrolling: 'touch'
        }}
        onScroll={handleScroll}
      >
        <style jsx global>{`
          .scrollbar-hide::-webkit-scrollbar {
            display: none;
          }
          .scrollbar-hide {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
        `}</style>
        <InfiniteScroll
          pageStart={1}
          loadMore={handleLoadMore}
          hasMore={hasMore}
          loader={
            <div className="flex justify-center items-center py-4" key={0}>
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          }
          useWindow={false}
          getScrollParent={() => scrollContainerRef.current}
          isReverse={true}
          threshold={100}
          initialLoad={false}
        >
          <div className="w-full space-y-3 md:space-y-4 bg-transparent px-4 pt-4">
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
                {status === 'thinking' &&
                  (!messages?.length ||
                    messages[messages.length - 1]?.role === 'user') && (
                    <Avatar className="w-6 h-6 md:w-8 md:h-8 mr-2 flex-shrink-0">
                      <AvatarImage
                        src="/images/sshift-guy.png"
                        alt="AI Avatar"
                      />
                      <AvatarFallback>AI</AvatarFallback>
                    </Avatar>
                  )}
                <StatusIndicator
                  status={status}
                  className={
                    status === 'thinking' &&
                    (!messages?.length ||
                      messages[messages.length - 1]?.role === 'user')
                      ? 'mt-1 md:mt-2'
                      : ''
                  }
                />
              </div>
            )}
          </div>
        </InfiniteScroll>
      </div>
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
