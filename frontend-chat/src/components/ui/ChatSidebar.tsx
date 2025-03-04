import React, { useState, useEffect } from 'react';
import { Button } from './button';
import { ScrollArea } from './scrollarea';
import { Input } from './input';
import { Pencil, Trash2, Trash, X, ChevronRight } from 'lucide-react';
import { ConfirmationModal } from './ConfirmationModal';

interface Chat {
  id: string;
  title: string;
  messages: any[];
  lastUpdated?: number;
}

interface ChatSidebarProps {
  chats: Chat[];
  currentChatId: string | null;
  onChatSelect: (chatId: string) => void;
  onDeleteChat: (chatId: string) => void;
  onRenameChat: (chatId: string, newTitle: string) => void;
  onClearAllChats: () => void;
  isOpen?: boolean;
  onClose?: () => void;
}

const COLLAPSED_CATEGORIES_KEY = 'collapsedCategories';

export const ChatSidebar: React.FC<ChatSidebarProps> = ({
  chats,
  currentChatId,
  onChatSelect,
  onDeleteChat,
  onRenameChat,
  onClearAllChats,
  isOpen = false,
  onClose,
}) => {
  const [renamingChatId, setRenamingChatId] = useState<string | null>(null);
  const [newChatTitle, setNewChatTitle] = useState('');
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [deletingChatId, setDeletingChatId] = useState<string | null>(null);
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());

  useEffect(() => {
    const savedCollapsedCategories = localStorage.getItem(COLLAPSED_CATEGORIES_KEY);
    if (savedCollapsedCategories) {
      setCollapsedCategories(new Set(JSON.parse(savedCollapsedCategories)));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(COLLAPSED_CATEGORIES_KEY, JSON.stringify(Array.from(collapsedCategories)));
  }, [collapsedCategories]);

  const toggleCategory = (category: string) => {
    setCollapsedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(category)) {
        newSet.delete(category);
      } else {
        newSet.add(category);
      }
      return newSet;
    });
  };

  const handleRenameClick = (chatId: string) => {
    setRenamingChatId(chatId);
    const chat = chats.find((c) => c.id === chatId);
    setNewChatTitle(chat?.title || '');
  };

  const handleRenameSubmit = (chatId: string) => {
    onRenameChat(chatId, newChatTitle);
    setRenamingChatId(null);
  };

  const handleClearAllChats = () => {
    setIsConfirmModalOpen(true);
  };

  const confirmClearAllChats = () => {
    onClearAllChats();
    setIsConfirmModalOpen(false);
  };

  const handleDeleteClick = (chatId: string) => {
    setDeletingChatId(chatId);
  };

  const confirmDeleteChat = () => {
    if (deletingChatId) {
      onDeleteChat(deletingChatId);
      setDeletingChatId(null);
    }
  };

  const groupChats = () => {
    // Get current timestamp and normalize to start of day
    const MS_PER_DAY = 86400000; // 24 * 60 * 60 * 1000
    const now = Date.now();
    const today = Math.floor(now / MS_PER_DAY) * MS_PER_DAY;
    const yesterday = today - MS_PER_DAY;
    const previous7Days = today - (7 * MS_PER_DAY);
    const previous30Days = today - (30 * MS_PER_DAY);
    const previous90Days = today - (90 * MS_PER_DAY);

    const chatGroups: { [key: string]: Chat[] } = {
      Today: [],
      Yesterday: [],
      'Previous 7 Days': [],
      'Previous 30 Days': [],
      'Previous 90 Days': [],
      Older: [],
    };

    // Sort chats by lastUpdated in ascending order (oldest first)
    const sortedChats = [...chats].sort((a, b) => (a.lastUpdated || 0) - (b.lastUpdated || 0));

    sortedChats.forEach((chat) => {
      // Normalize chat timestamp to start of day
      const chatDayStart = Math.floor((chat.lastUpdated || 0) / MS_PER_DAY) * MS_PER_DAY;

      if (chatDayStart === today) {
        chatGroups.Today.push(chat);
      } else if (chatDayStart === yesterday) {
        chatGroups.Yesterday.push(chat);
      } else if (chatDayStart > previous7Days && chatDayStart < yesterday) {
        chatGroups['Previous 7 Days'].push(chat);
      } else if (chatDayStart > previous30Days && chatDayStart <= previous7Days) {
        chatGroups['Previous 30 Days'].push(chat);
      } else if (chatDayStart > previous90Days && chatDayStart <= previous30Days) {
        chatGroups['Previous 90 Days'].push(chat);
      } else {
        chatGroups.Older.push(chat);
      }
    });

    // Sort each group internally by lastUpdated in descending order
    Object.values(chatGroups).forEach(group => {
      group.sort((a, b) => (b.lastUpdated || 0) - (a.lastUpdated || 0));
    });

    return chatGroups;
  };

  const chatGroups = groupChats();

  return (
    <>
      {/* Backdrop overlay for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 md:hidden" 
          onClick={onClose}
        />
      )}
      <div className={`
        fixed md:relative top-0 left-0 h-[100dvh] w-80 border-r border-border
        bg-transparent
        md:block transform transition-transform duration-300 ease-in-out z-50
        ${isOpen ? 'translate-x-0 !bg-white' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="flex flex-col h-full">
          <div className="p-4 border-b border-border h-[73px] flex items-center justify-between">
            <h2 className="text-lg font-semibold">Chat History</h2>
            <div className="flex items-center gap-2">
              <Button
                variant="destructive"
                size="sm"
                onClick={handleClearAllChats}
                className="flex items-center"
                disabled={chats.length === 0}
              >
                <Trash className="h-4 w-4 mr-2" />
                Clear All
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="md:hidden"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-4 space-y-2">
              {Object.entries(chatGroups).map(
                ([group, groupChats]) =>
                  groupChats.length > 0 && (
                    <div key={group}>
                      <button 
                        onClick={() => toggleCategory(group)}
                        className="flex items-center w-full text-base font-semibold mb-2 text-gray-700 hover:text-gray-900"
                      >
                        <ChevronRight 
                          className={`h-5 w-5 mr-1.5 transition-transform duration-200 ${
                            !collapsedCategories.has(group) ? 'rotate-90' : ''
                          }`}
                        />
                        {group}
                        <span className="ml-2 text-sm text-gray-400">
                          ({groupChats.length})
                        </span>
                      </button>
                      {!collapsedCategories.has(group) && (
                        <div className="space-y-1">
                          {groupChats.map((chat) => (
                            <div key={chat.id} className="relative group mb-1">
                              {renamingChatId === chat.id ? (
                                <form
                                  onSubmit={(e) => {
                                    e.preventDefault();
                                    handleRenameSubmit(chat.id);
                                  }}
                                  className="flex"
                                >
                                  <Input
                                    value={newChatTitle}
                                    onChange={(e) => setNewChatTitle(e.target.value)}
                                    className="w-full pr-16 text-sm"
                                    autoFocus
                                  />
                                  <Button
                                    type="submit"
                                    variant="ghost"
                                    size="sm"
                                    className="absolute right-8 top-1/2 -translate-y-1/2 text-sm"
                                  >
                                    Save
                                  </Button>
                                </form>
                              ) : (
                                <div className="flex items-center justify-between w-full">
                                  <Button
                                    variant={
                                      currentChatId === chat.id ? 'secondary' : 'ghost'
                                    }
                                    className="w-full justify-start text-left truncate pr-12 text-sm"
                                    onClick={() => onChatSelect(chat.id)}
                                  >
                                    {chat.title.length > 25 ? `${chat.title.substring(0, 25)}...` : chat.title}
                                  </Button>
                                  <div className="flex absolute right-1 top-1/2 -translate-y-1/2 md:opacity-0 md:group-hover:opacity-100 opacity-100 transition-opacity">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-6 w-6 mr-1"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleRenameClick(chat.id);
                                      }}
                                    >
                                      <Pencil className="h-3 w-3" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-6 w-6 touch-none"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteClick(chat.id);
                                      }}
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )
              )}
            </div>
          </ScrollArea>
        </div>
      </div>
      <ConfirmationModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={confirmClearAllChats}
        title="Clear All Chats"
        message="Are you sure you want to clear all chat history? This action cannot be undone."
      />
      <ConfirmationModal
        isOpen={!!deletingChatId}
        onClose={() => setDeletingChatId(null)}
        onConfirm={confirmDeleteChat}
        title="Delete Chat"
        message="Are you sure you want to delete this chat? This action cannot be undone."
      />
    </>
  );
};
