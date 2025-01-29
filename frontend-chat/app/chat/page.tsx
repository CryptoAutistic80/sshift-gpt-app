'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';
import { Menu } from 'lucide-react';

// Core Layout Components
import { ChatSidebar } from '../../src/components/ui/ChatSidebar';
import { ChatHeader } from '../../src/components/ui/ChatHeader';
import { ChatWindow } from '../../src/components/ui/ChatWindow';
import { ChatInput } from '../../src/components/ui/ChatInput';
import { Button } from '../../src/components/ui/button';

import backend from '../../src/services/backend';
import { useAuth } from '../../src/context/AuthProvider';
import { API_BACKEND_URL } from '../../config/env';

// Types
export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  auth?: string;
  images?: string[];
  created?: number;
  model?: string;
  finish_reason?: string;
  system_fingerprint?: string;
  timestamp: number;
}

interface Chat {
  id: string;
  title: string;
  messages: Message[];
  isRenaming?: boolean;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  createdAt?: number;
  lastUpdated?: number;
  model: string;
}

interface NewMessage {
  id: string;
  title: string;
  message: Message;
  isRenaming?: boolean;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  createdAt?: number;
  lastUpdated?: number;
  model: string;
}

export default function ChatPage() {
  const router = useRouter();
  const [selectedModel, setSelectedModel] = useState('gpt-4o-mini');
  const [chats, setChats] = useState<Chat[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [, setIsWaiting] = useState(false);
  const [, setIsTyping] = useState(false);
  const [showNoChatsMessage, setShowNoChatsMessage] = useState(false);
  const [status, setStatus] = useState<'thinking' | 'tool-calling' | 'typing'>(
    'thinking'
  );
  const [isAssistantResponding, setIsAssistantResponding] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { jwt } = useAuth();
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [isPaginating, setIsPaginating] = useState(false);

  const lastMessageRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (lastMessageRef.current) {
      lastMessageRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleNewChat = async () => {
    try {
      const currentTime = Date.now();
      const newChat: Chat = {
        id: uuidv4(),
        title: `New Chat ${chats.length + 1}`,
        messages: [],
        model: 'gpt-4o-mini', // Set default model for new chats
        createdAt: currentTime,
        lastUpdated: currentTime,
      };

      const response = await backend.post('/history', newChat, {
        headers: {
          Authorization: `Bearer ${jwt}`,
        },
      });
      setChats([...chats, response.data]);
      setCurrentChatId(response.data.id);
      setSelectedModel('gpt-4o-mini'); // Reset selected model for new chats
    } catch (error) {
      console.error('Error creating new chat:', error);
    }
  };

  const handleChatSelect = async (chatId: string) => {
    setCurrentChatId(chatId);
    const selectedChat = chats.find((chat) => chat.id === chatId);
    if (selectedChat) {
      setSelectedModel(selectedChat.model);

      // If the chat has no messages, load the initial set
      if (!selectedChat.messages || selectedChat.messages.length === 0) {
        try {
          const messagesResponse = await backend.get(
            `/history/${chatId}/messages`,
            {
              params: {
                page: 1,
                limit: 10,
              },
              headers: {
                Authorization: `Bearer ${jwt}`,
              },
            }
          );

          console.log('Chat select messages response:', messagesResponse.data);

          const { messages, total } = messagesResponse.data;
          const hasMoreMessages = messages.length === 10;

          setChats((prevChats) =>
            prevChats.map((chat) =>
              chat.id === chatId
                ? { ...chat, messages: [...messages].reverse() }
                : chat
            )
          );
          setHasMore(hasMoreMessages);
          setCurrentPage(1);
        } catch (error) {
          console.error('Error loading chat messages:', error);
        }
      }
    }
  };

  const handleModelChange = (model: string) => {
    setSelectedModel(model);
    if (currentChatId) {
      setChats((prevChats) =>
        prevChats.map((chat) =>
          chat.id === currentChatId ? { ...chat, model } : chat
        )
      );
    }
  };

  const handleSendMessage = async (
    inputMessage: string,
    selectedImages: string[]
  ) => {
    if (chats.length === 0) {
      setShowNoChatsMessage(true);
      setTimeout(() => setShowNoChatsMessage(false), 3000);
      return;
    }

    setStatus('thinking');
    setIsAssistantResponding(true);

    if (inputMessage.trim() || selectedImages.length > 0) {
      const userMessage: Message = {
        id: uuidv4(),
        role: 'user',
        content: inputMessage,
        images: selectedImages,
        timestamp: Date.now(),
      };

      setChats((prevChats) => {
        const currentTime = Date.now();
        return prevChats.map((chat) => {
          if (chat.id === currentChatId) {
            const updatedMessages = [...chat.messages, userMessage];
            const updatedTitle =
              updatedMessages.length === 1
                ? inputMessage.split(' ').slice(0, 5).join(' ') + '...'
                : chat.title;
            return {
              ...chat,
              messages: updatedMessages,
              title: updatedTitle,
              lastUpdated: currentTime,
            };
          }
          return chat;
        });
      });

      scrollToBottom();

      const chat = chats.find((chat) => chat.id === currentChatId) as Chat;

      const newMessage: NewMessage = {
        ...chat,
        model: selectedModel,
        message: userMessage,
      };

      try {
        const response = await fetch(`${API_BACKEND_URL}/agent`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${jwt}`,
          },
          body: JSON.stringify(newMessage),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        if (!response.body) throw new Error('No response body');

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let assistantMessage: Message = {
          id: Date.now().toString(),
          role: 'assistant',
          content: '',
        };

        setIsWaiting(false);
        setIsTyping(true);

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n').filter((line) => line.trim() !== '');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.substring(6);
              if (data === '[DONE]') {
                setStatus('thinking');
                break;
              }
              try {
                const parsedData = JSON.parse(data);
                if (parsedData.content) {
                  assistantMessage.content += parsedData.content;
                  updateChat(assistantMessage);
                  setStatus('typing');
                } else if (parsedData.tool_call) {
                  setStatus('tool-calling');
                } else if (parsedData.tool_response) {
                  if (parsedData.tool_response.name === 'generateImage') {
                    assistantMessage.images = [
                      ...(assistantMessage.images || []),
                      parsedData.tool_response.result.image_url,
                    ];
                    updateChat(assistantMessage);
                  } else if (parsedData.tool_response.name === 'searchWeb') {
                    assistantMessage.content += `\n\nWeb search result:\n${parsedData.tool_response.result}\n\n`;
                    updateChat(assistantMessage);
                  }
                  setStatus('typing');
                } else if (parsedData.final_message) {
                  assistantMessage = {
                    ...assistantMessage,
                    content: parsedData.final_message.content,
                    images:
                      parsedData.final_message.images ||
                      assistantMessage.images,
                  };
                  updateChat(assistantMessage);
                }
              } catch (error) {
                console.error('Error parsing JSON:', error);
              }
            }
          }
        }

        console.log('Final assistant message:', assistantMessage);
      } catch (error) {
        console.error('Error in handleSendMessage:', error);
      } finally {
        setStatus('thinking');
        setIsAssistantResponding(false);
      }
    }
  };

  const updateChat = (message: Message) => {
    setChats((prevChats) =>
      prevChats.map((chat) =>
        chat.id === currentChatId
          ? {
              ...chat,
              messages: chat.messages.some((m) => m.id === message.id)
                ? chat.messages.map((m) => (m.id === message.id ? message : m))
                : [...chat.messages, message],
            }
          : chat
      )
    );
    scrollToBottom();
  };

  const handleDeleteChat = (chatId: string) => {
    setChats((prevChats) => prevChats.filter((chat) => chat.id !== chatId));
    if (currentChatId === chatId) {
      const remainingChats = chats.filter((chat) => chat.id !== chatId);
      if (remainingChats.length > 0) {
        setCurrentChatId(remainingChats[0].id);
      } else {
        setCurrentChatId(null);
        handleNewChat(); // Create a new chat if all chats are deleted
      }
    }
  };

  const handleRegenerateMessage = async (assistantMessage: Message) => {
    if (!currentChatId) return;

    try {
      console.log('Regenerating message...');
      setStatus('thinking');
      setIsWaiting(true);
      setIsTyping(false);
      setIsAssistantResponding(true);

      const currentChat = chats.find((chat) => chat.id === currentChatId);
      if (!currentChat) return;

      // Find the index of the assistant message to regenerate
      const messageIndex = currentChat.messages.findIndex(
        (msg) => msg.id === assistantMessage.id
      );
      if (messageIndex === -1) return;

      // Get all messages up to and including the previous user message
      const messagesUpToLastUser = currentChat.messages.slice(0, messageIndex);

      // Update the chat to remove the regenerated message and all subsequent messages
      setChats((prevChats) =>
        prevChats.map((chat) =>
          chat.id === currentChatId
            ? { ...chat, messages: messagesUpToLastUser }
            : chat
        )
      );

      // Format messages for the API request
      const formattedMessages = messagesUpToLastUser.map((msg) => {
        if (msg.role === 'user' && msg.images && msg.images.length > 0) {
          return {
            role: msg.role,
            content: [
              ...msg.images.map((imageUrl) => ({
                type: 'image_url',
                image_url: { url: imageUrl, detail: 'high' },
              })),
              { type: 'text', text: msg.content },
            ],
          };
        }
        return {
          role: msg.role,
          content: msg.content,
        };
      });

      // Call the API with formatted messages
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${jwt as string}`,
        },
        body: JSON.stringify({
          messages: formattedMessages,
          model: selectedModel,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      if (!response.body) throw new Error('No response body');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let newAssistantMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: '',
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n').filter((line) => line.trim() !== '');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.substring(6);
            if (data === '[DONE]') {
              setStatus('thinking');
              break;
            }
            try {
              const parsedData = JSON.parse(data);
              if (parsedData.content) {
                newAssistantMessage.content += parsedData.content;
                updateChat(newAssistantMessage);
                setStatus('typing');
              } else if (parsedData.tool_call) {
                setStatus('tool-calling');
              } else if (parsedData.tool_response) {
                if (parsedData.tool_response.name === 'generateImage') {
                  newAssistantMessage.images = [
                    ...(newAssistantMessage.images || []),
                    parsedData.tool_response.result.image_url,
                  ];
                  updateChat(newAssistantMessage);
                } else if (parsedData.tool_response.name === 'searchWeb') {
                  newAssistantMessage.content += `\n\nWeb search result:\n${parsedData.tool_response.result}\n\n`;
                  updateChat(newAssistantMessage);
                }
                setStatus('typing');
              } else if (parsedData.final_message) {
                newAssistantMessage = {
                  ...newAssistantMessage,
                  content: parsedData.final_message.content,
                  images:
                    parsedData.final_message.images ||
                    newAssistantMessage.images,
                };
                updateChat(newAssistantMessage);
              }
            } catch (error) {
              console.error('Error parsing JSON:', error);
            }
          }
        }
      }

      // Update the chat with the regenerated message
      setChats((prevChats) =>
        prevChats.map((chat) => {
          if (chat.id === currentChatId) {
            const updatedMessages = chat.messages.slice(0, messageIndex);
            return {
              ...chat,
              messages: [...updatedMessages, newAssistantMessage],
              lastUpdated: Date.now(),
            };
          }
          return chat;
        })
      );

      console.log('Final regenerated message:', newAssistantMessage);
    } catch (error) {
      console.error('Error in handleRegenerateMessage:', error);
    } finally {
      setIsWaiting(false);
      setIsTyping(false);
      setStatus('thinking');
      setIsAssistantResponding(false);
    }
  };

  useEffect(() => {
    if (!jwt) return;

    (async () => {
      try {
        // First get the chat list
        const chatResponse = await backend.get('/history', {
          headers: {
            Authorization: `Bearer ${jwt}`,
          },
        });

        const savedChats = chatResponse.data;
        if (savedChats && savedChats.chats.length > 0) {
          // Find the most recent chat based on lastUpdated timestamp
          const mostRecentChat = savedChats.chats.reduce(
            (latest: Chat, current: Chat) =>
              (current.lastUpdated || 0) > (latest.lastUpdated || 0)
                ? current
                : latest
          );

          // Get initial messages for the most recent chat
          const messagesResponse = await backend.get(
            `/history/${mostRecentChat.id}/messages`,
            {
              params: {
                page: 1,
                limit: 10,
              },
              headers: {
                Authorization: `Bearer ${jwt}`,
              },
            }
          );

          console.log('Initial messages response:', messagesResponse.data);

          // Check if there are more messages based on the total count
          const { messages, total } = messagesResponse.data;
          const hasMoreMessages = messages.length === 10; // If we got a full page, there are likely more

          // Update the most recent chat with only the first 10 messages
          const updatedChats = savedChats.chats.map(
            (chat: Chat) =>
              chat.id === mostRecentChat.id
                ? { ...chat, messages: [...messages].reverse() }
                : { ...chat, messages: [] } // Initialize other chats with empty messages
          );

          setChats(updatedChats);
          setCurrentChatId(mostRecentChat.id);
          setSelectedModel(mostRecentChat.model || 'gpt-4o-mini');
          setHasMore(hasMoreMessages);
          setCurrentPage(1);
        } else {
          handleNewChat();
        }
      } catch (error) {
        console.error('Error loading initial chat data:', error);
        handleNewChat();
      }
    })();
  }, [jwt]);

  const currentChat = chats.find((chat) => chat.id === currentChatId);

  const handleEdit = (editedMessage: Message, newContent: string) => {
    const editedMessageIndex = currentChat?.messages.findIndex(
      (msg) => msg.id === editedMessage.id
    );
    if (
      editedMessageIndex !== undefined &&
      editedMessageIndex !== -1 &&
      currentChat
    ) {
      const updatedMessages = currentChat.messages.slice(
        0,
        editedMessageIndex + 1
      );
      updatedMessages[editedMessageIndex] = {
        ...editedMessage,
        content: newContent,
      };
      setChats((prevChats) =>
        prevChats.map((chat) =>
          chat.id === currentChatId
            ? { ...chat, messages: updatedMessages }
            : chat
        )
      );
      // Regenerate the conversation from this point forward
      setStatus('thinking');
      setIsWaiting(true);
      setIsTyping(false);
      setIsAssistantResponding(true);
      regenerateConversation(updatedMessages).finally(() => {
        setIsWaiting(false);
        setIsTyping(false);
        setStatus('thinking');
        setIsAssistantResponding(false);
      });
    }
  };

  const regenerateConversation = async (messagesUpToEdit: Message[]) => {
    if (!currentChatId) return;

    try {
      console.log('Regenerating conversation...');
      setStatus('thinking');
      setIsWaiting(true);
      setIsTyping(false);
      setIsAssistantResponding(true);

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${jwt}`,
        },
        body: JSON.stringify({
          messages: messagesUpToEdit.map((msg) => {
            if (msg.role === 'user' && msg.images) {
              return {
                role: msg.role,
                content: [
                  ...msg.images.map((imageUrl) => ({
                    type: 'image_url',
                    image_url: { url: imageUrl, detail: 'high' },
                  })),
                  { type: 'text', text: msg.content },
                ],
              };
            }
            return {
              role: msg.role,
              content: msg.content,
            };
          }),
          model: selectedModel,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body reader');

      const decoder = new TextDecoder();
      let done = false;

      const newAssistantMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: '',
      };

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        if (!value) continue;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.trim() === '') continue;
          if (line.startsWith('data: ')) {
            const data = line.substring(6).trim();
            if (data === '[DONE]') {
              console.log('Regeneration complete');
              done = true;
              break;
            }
            try {
              const parsedData = JSON.parse(data);
              console.log('Parsed data for regeneration:', parsedData);
              if (parsedData.content) {
                newAssistantMessage.content += parsedData.content;
                setStatus('typing');
              } else if (parsedData.tool_response) {
                if (parsedData.tool_response.name === 'generateImage') {
                  newAssistantMessage.images = [
                    ...(newAssistantMessage.images || []),
                    parsedData.tool_response.result.image_url,
                  ];
                  setStatus('tool-calling');
                } else if (parsedData.tool_response.name === 'searchWeb') {
                  newAssistantMessage.content += `\n\nWeb search result:\n${parsedData.tool_response.result}\n\n`;
                  setStatus('tool-calling');
                }
              } else if (parsedData.tool_call) {
                setStatus('tool-calling');
              }
              setChats((prevChats) =>
                prevChats.map((c) =>
                  c.id === currentChatId
                    ? {
                        ...c,
                        messages: [...messagesUpToEdit, newAssistantMessage],
                        lastUpdated: Date.now(),
                      }
                    : c
                )
              );
              scrollToBottom();
            } catch (error) {
              console.error('Error parsing JSON:', error);
            }
          }
        }
      }

      console.log('Final regenerated assistant message:', newAssistantMessage);
    } catch (error) {
      console.error('Error in regenerateConversation:', error);
    } finally {
      setIsWaiting(false);
      setIsTyping(false);
      setStatus('thinking');
      setIsAssistantResponding(false);
    }
  };

  const handleClearAllChats = async () => {
    setChats([]); // Clear all chats from state
    setCurrentChatId(null); // Reset current chat ID

    try {
      // Clear chats from the database
      await backend.delete('/history', {
        headers: {
          Authorization: `Bearer ${jwt}`,
        },
      });
      console.log('All chats cleared from database');
    } catch (error) {
      console.error('Error clearing chats from database:', error);
      // Optionally, you could show an error message to the user here
    }
  };

  const handleLoadMore = async (page: number) => {
    if (!currentChatId || isLoadingMore) {
      console.log(
        '[LoadMore] Skipping load - currentChatId:',
        currentChatId,
        'isLoadingMore:',
        isLoadingMore
      );
      return;
    }

    console.log(
      '[LoadMore] Starting load - page:',
      page,
      'currentChatId:',
      currentChatId
    );
    setIsLoadingMore(true);
    setIsPaginating(true);
    try {
      const nextPage = currentPage + 1;
      console.log('[LoadMore] Requesting page:', nextPage);

      const currentChat = chats.find((chat) => chat.id === currentChatId);
      console.log(
        '[LoadMore] Current chat messages count:',
        currentChat?.messages.length
      );

      const response = await backend.get(`/history/${currentChatId}/messages`, {
        params: {
          page: nextPage,
          limit: 10,
        },
        headers: {
          Authorization: `Bearer ${jwt}`,
        },
      });

      console.log('[LoadMore] Response data:', {
        messagesCount: response.data?.messages?.length,
        total: response.data?.total,
        page: response.data?.page,
        totalPages: response.data?.totalPages,
      });

      if (!response.data || !response.data.messages) {
        console.error('[LoadMore] Invalid response format:', response.data);
        setHasMore(false);
        return;
      }

      const { messages: olderMessages, total, totalPages } = response.data;

      if (olderMessages && olderMessages.length > 0) {
        console.log(
          `[LoadMore] Loaded ${olderMessages.length} messages from page ${nextPage}`
        );
        setChats((prevChats) =>
          prevChats.map((chat) => {
            if (chat.id === currentChatId) {
              const updatedMessages = [
                ...olderMessages.reverse(),
                ...chat.messages,
              ];
              console.log('[LoadMore] Messages state update:', {
                previousCount: chat.messages.length,
                newMessagesCount: olderMessages.length,
                totalAfterUpdate: updatedMessages.length,
              });
              return {
                ...chat,
                messages: updatedMessages,
              };
            }
            return chat;
          })
        );

        setCurrentPage(nextPage);
        setHasMore(nextPage < totalPages);
      } else {
        console.log('[LoadMore] No more messages to load');
        setHasMore(false);
      }
    } catch (error) {
      console.error('[LoadMore] Error loading more messages:', error);
      setHasMore(false);
    } finally {
      setIsLoadingMore(false);
      setIsPaginating(false);
    }
  };

  return (
    <div className="flex h-[100dvh] overflow-hidden bg-background">
      <ChatSidebar
        chats={chats}
        currentChatId={currentChatId}
        onChatSelect={handleChatSelect}
        onDeleteChat={handleDeleteChat}
        onRenameChat={(chatId, newTitle) => {
          setChats((prevChats) =>
            prevChats.map((chat) =>
              chat.id === chatId ? { ...chat, title: newTitle } : chat
            )
          );
        }}
        onClearAllChats={handleClearAllChats}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />
      <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
        <ChatHeader
          selectedModel={selectedModel}
          onModelChange={handleModelChange}
          onNewChat={handleNewChat}
          onNavigateToDashboard={() => router.push('/dashboard')}
          currentChatModel={currentChat?.model || null}
        />
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsSidebarOpen(true)}
          className="md:hidden absolute top-[14px] left-2 z-40"
        >
          <Menu className="h-5 w-5" />
        </Button>
        <div className="flex-1 min-h-0 flex flex-col">
          <ChatWindow
            messages={currentChat?.messages || []}
            onCopy={(text: string) => navigator.clipboard.writeText(text)}
            onRegenerate={handleRegenerateMessage}
            onEdit={handleEdit}
            status={status}
            showNoChatsMessage={showNoChatsMessage}
            isAssistantResponding={isAssistantResponding}
            currentChatId={currentChatId || undefined}
            onLoadMore={handleLoadMore}
            hasMore={hasMore}
            isLoadingMore={isLoadingMore}
          />
          <ChatInput onSendMessage={handleSendMessage} />
        </div>
      </div>
    </div>
  );
}
