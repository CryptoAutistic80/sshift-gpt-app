import React, { useRef, useEffect, useState } from 'react';
import { ScrollArea } from './scrollarea';
import { MessageBubble } from './MessageBubble';
import { StatusIndicator } from './statusIndicator';
import { Message } from '../../../app/chat/page';
import { Avatar, AvatarImage, AvatarFallback } from './avatar';
import InfiniteScroll from 'react-infinite-scroll-component';

interface ChatWindowProps {
  messages: Message[];
  onCopy: (text: string) => void;
  onRegenerate: (message: Message) => void;
  onEdit: (message: Message, newContent: string) => void;
  status: 'thinking' | 'tool-calling' | 'typing';
  showNoChatsMessage: boolean;
  isAssistantResponding: boolean;
  currentChatId: string | null;
  onLoadMore: () => Promise<void>;
  hasMore: boolean;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({ 
  messages, 
  onCopy, 
  onRegenerate, 
  onEdit,
  status,
  showNoChatsMessage,
  isAssistantResponding,
  currentChatId,
  onLoadMore,
  hasMore
}) => {
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const lastMessageRef = useRef<HTMLDivElement>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [isLoadingOld, setIsLoadingOld] = useState(false);
  const prevMessagesRef = useRef<Message[]>(messages);

  const scrollToBottom = () => {
    if (lastMessageRef.current) {
      lastMessageRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  useEffect(() => {
    // Check if messages were added to the end (new) or beginning (old)
    const isNewMessage = messages.length > 0 && 
      prevMessagesRef.current.length > 0 && 
      messages[messages.length - 1]?.id !== prevMessagesRef.current[prevMessagesRef.current.length - 1]?.id;

    // Only scroll if we have new messages or the assistant is responding
    if ((isNewMessage && !isLoadingOld) || isAssistantResponding) {
      scrollToBottom();
    }
    
    prevMessagesRef.current = messages;
  }, [messages, isAssistantResponding, isLoadingOld]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const element = e.currentTarget;
    const isBottom = Math.abs(element.scrollHeight - element.scrollTop - element.clientHeight) < 1;
    setIsAtBottom(isBottom);
  };

  const handleLoadMore = async () => {
    setIsLoadingOld(true);
    await onLoadMore();
    setIsLoadingOld(false);
  };

  return (
    <div className="flex-1 overflow-hidden flex flex-col w-full max-w-7xl mx-auto relative min-h-0">
      <div 
        id="scrollableDiv"
        className="flex-1 min-h-0 overflow-auto flex flex-col"
        onScroll={handleScroll}
      >
        {hasMore && (
          <div className="text-center py-4 cursor-pointer hover:text-blue-500" onClick={handleLoadMore}>
            Load older messages...
          </div>
        )}
        <InfiniteScroll
          dataLength={messages.length}
          next={handleLoadMore}
          hasMore={false}
          loader={null}
          scrollableTarget="scrollableDiv"
          className="flex flex-col justify-end"
          inverse={false}
        >
          <div className="w-full px-2 py-2 md:px-4 md:py-8 space-y-3 md:space-y-4">
            {!isAtBottom && !hasMore && (
              <div className="text-center py-4 text-sm text-muted-foreground">
                Beginning of conversation
              </div>
            )}
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
