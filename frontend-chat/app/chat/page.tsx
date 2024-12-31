'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid'; // Add this import
import { ChatSidebar } from '../../src/components/ui/ChatSidebar';
import { ChatHeader } from '../../src/components/ui/ChatHeader';
import { ChatWindow } from '../../src/components/ui/ChatWindow';
import { ChatInput } from '../../src/components/ui/ChatInput';
import backend from '../../src/services/backend';

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
  createdAt: number;
  lastUpdated: number;
  model: string; // Add this line
}

export default function ChatPage() {
  const router = useRouter();
  const [selectedModel, setSelectedModel] = useState('gpt-4o-mini');
  const [chats, setChats] = useState<Chat[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [isWaiting, setIsWaiting] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [showNoChatsMessage, setShowNoChatsMessage] = useState(false);
  const [status, setStatus] = useState<'thinking' | 'tool-calling' | 'typing'>(
    'thinking'
  );
  const [isAssistantResponding, setIsAssistantResponding] = useState(false);

  const lastMessageRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (lastMessageRef.current) {
      lastMessageRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleNewChat = () => {
    const currentTime = Date.now();
    const newChat: Chat = {
      id: uuidv4(),
      title: `New Chat ${chats.length + 1}`,
      messages: [],
      createdAt: currentTime,
      lastUpdated: currentTime,
      model: 'gpt-4o-mini', // Set default model for new chats
    };
    setChats([...chats, newChat]);
    setCurrentChatId(newChat.id);
    setSelectedModel('gpt-4o-mini'); // Reset selected model for new chats
  };

  const handleChatSelect = (chatId: string) => {
    setCurrentChatId(chatId);
    const selectedChat = chats.find((chat) => chat.id === chatId);
    if (selectedChat) {
      setSelectedModel(selectedChat.model);
    }
    setChats((prevChats) =>
      prevChats.map((chat) =>
        chat.id === chatId ? { ...chat, lastUpdated: Date.now() } : chat
      )
    );
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
    setIsWaiting(true);
    setIsTyping(false);
    setIsAssistantResponding(true);

    if (inputMessage.trim() || selectedImages.length > 0) {
      const userMessage: Message = {
        id: Date.now().toString(),
        role: 'user',
        content: inputMessage,
        images: selectedImages,
      };

      // Prepare the content array for the API request
      const contentArray = [
        ...selectedImages.map(imageUrl => ({
          type: 'image_url',
          image_url: { url: imageUrl, detail: 'high' }
        })),
        { type: 'text', text: inputMessage }
      ];

      const formattedMessage = {
        role: 'user',
        content: contentArray
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

      try {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            auth: localStorage.getItem('jwt') as string,
            messages: [
              ...(chats.find((chat) => chat.id === currentChatId)?.messages || []).map(msg => {
                if (msg.role === 'user' && msg.images) {
                  return {
                    role: msg.role,
                    content: [
                      ...msg.images.map(imageUrl => ({
                        type: 'image_url',
                        image_url: { url: imageUrl, detail: 'high' }
                      })),
                      { type: 'text', text: msg.content }
                    ]
                  };
                }
                return {
                  role: msg.role,
                  content: msg.content
                };
              }),
              formattedMessage,
            ],
            model: selectedModel,
          }),
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
                      parsedData.tool_response.result.image_url
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
                    images: parsedData.final_message.images || assistantMessage.images
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

      // Format messages for the API request
      const formattedMessages = messagesUpToLastUser.map(msg => {
        if (msg.role === 'user' && msg.images && msg.images.length > 0) {
          return {
            role: msg.role,
            content: [
              ...msg.images.map(imageUrl => ({
                type: 'image_url',
                image_url: { url: imageUrl, detail: 'high' }
              })),
              { type: 'text', text: msg.content }
            ]
          };
        }
        return {
          role: msg.role,
          content: msg.content
        };
      });

      // Call the API with formatted messages
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          auth: localStorage.getItem('jwt') as string,
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

      setIsWaiting(false);
      setIsTyping(true);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n').filter(line => line.trim() !== '');

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
                    parsedData.tool_response.result.image_url
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
                  images: parsedData.final_message.images || newAssistantMessage.images
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
      setChats(prevChats =>
        prevChats.map(chat => {
          if (chat.id === currentChatId) {
            const updatedMessages = chat.messages.slice(0, messageIndex);
            return {
              ...chat,
              messages: [...updatedMessages, newAssistantMessage],
              lastUpdated: Date.now()
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
    (async () => {
      const chatResponse = await backend.get('/history', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('jwt')}`,
        },
      });

      const savedChats = chatResponse.data;
      if (savedChats) {
        const updatedChats = savedChats.chats.map((chat: Chat) => ({
          ...chat,
          createdAt: chat.createdAt || Date.now(),
          lastUpdated: chat.lastUpdated || Date.now(),
        }));
        setChats(updatedChats);
        if (updatedChats.length > 0) {
          setCurrentChatId(updatedChats[0].id);
        } else {
          handleNewChat();
        }
      } else {
        handleNewChat();
      }
    })();
  }, []);

  useEffect(() => {
    if (!chats?.length) return;

    const syncChats = async () => {
      try {
        await backend.put('/history', [...chats], {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('jwt')}`,
          },
        });
      } catch (error) {
        console.error('Error syncing chats with database:', error);
      }
    };

    // Debounce the sync operation
    const timeoutId = setTimeout(syncChats, 1000);

    return () => clearTimeout(timeoutId);
  }, [chats]);

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
      setIsAssistantResponding(true); // Add this line
      regenerateConversation(updatedMessages).finally(() => {
        setIsWaiting(false);
        setIsTyping(false);
        setStatus('thinking');
        setIsAssistantResponding(false); // Add this line
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
        },
        body: JSON.stringify({
          auth: localStorage.getItem('jwt') as string,
          messages: messagesUpToEdit.map(msg => {
            if (msg.role === 'user' && msg.images) {
              return {
                role: msg.role,
                content: [
                  ...msg.images.map(imageUrl => ({
                    type: 'image_url',
                    image_url: { url: imageUrl, detail: 'high' }
                  })),
                  { type: 'text', text: msg.content }
                ]
              };
            }
            return {
              role: msg.role,
              content: msg.content
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
              } else if (parsedData.tool_response) {
                if (parsedData.tool_response.name === 'generateImage') {
                  newAssistantMessage.images = [
                    ...(newAssistantMessage.images || []),
                    parsedData.tool_response.result.image_url
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
      await backend.put('/history', [], {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('jwt')}`,
        },
      });
      console.log('All chats cleared from database');
    } catch (error) {
      console.error('Error clearing chats from database:', error);
      // Optionally, you could show an error message to the user here
    }
  };

  async function handleStream(response: Response, messageId: string) {
    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    try {
        while (reader) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
                if (line.trim() === '') continue;
                if (line === 'data: [DONE]') continue;

                try {
                    const data = JSON.parse(line.replace('data: ', ''));
                    
                    if (data.content) {
                        // Update the message content in your state
                        setChats(prev => prev.map(chat => ({
                            ...chat,
                            messages: chat.messages.map(msg => 
                                msg.id === messageId 
                                    ? { ...msg, content: msg.content + data.content }
                                    : msg
                            )
                        })));
                    }
                    
                    if (data.tool_call) {
                        // Handle tool call indication
                        setChats(prev => prev.map(chat => ({
                            ...chat,
                            messages: chat.messages.map(msg =>
                                msg.id === messageId
                                    ? { ...msg, isProcessingTool: true }
                                    : msg
                            )
                        })));
                    }

                    if (data.final_message) {
                        // Handle final message
                        setChats(prev => prev.map(chat => ({
                            ...chat,
                            messages: chat.messages.map(msg =>
                                msg.id === messageId
                                    ? { 
                                        ...msg, 
                                        content: data.final_message.content,
                                        images: data.final_message.images,
                                        isProcessingTool: false
                                    }
                                    : msg
                            )
                        })));
                    }

                    if (data.error) {
                        throw new Error(data.error);
                    }
                } catch (e) {
                    console.error('Error parsing stream:', e);
                }
            }
        }
    } catch (error) {
        console.error('Stream reading error:', error);
        throw error;
    } finally {
        reader?.releaseLock();
    }
  }

  return (
    <div className="flex h-screen bg-background">
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
      />

      <div className="flex flex-col flex-1">
        <ChatHeader
          selectedModel={selectedModel}
          onModelChange={handleModelChange}
          onNewChat={handleNewChat}
          onNavigateToDashboard={() => router.push('/dashboard')}
          currentChatModel={currentChat?.model || null}
        />

        <div className="flex-1 overflow-hidden flex flex-col">
          <ChatWindow
            messages={currentChat?.messages || []}
            onCopy={(text: string) => navigator.clipboard.writeText(text)}
            onRegenerate={handleRegenerateMessage}
            onEdit={handleEdit}
            status={status}
            showNoChatsMessage={showNoChatsMessage}
            isAssistantResponding={isAssistantResponding} // Pass the new state here
          />
          <ChatInput onSendMessage={handleSendMessage} />
        </div>
      </div>
    </div>
  );
}
