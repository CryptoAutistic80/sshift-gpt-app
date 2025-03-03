import React from 'react';
import { Button } from './button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './select';
import { ArrowLeft } from 'lucide-react';
import UserLoginStatus from './UserLoginStatus';

interface ChatHeaderProps {
  selectedModel: string;
  onModelChange: (value: string) => void;
  onNewChat: () => void;
  onNavigateToDashboard: () => void;
  currentChatModel: string | null;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  selectedModel,
  onModelChange,
  onNewChat,
  onNavigateToDashboard,
  currentChatModel,
}) => {
  return (
    <div className="flex items-center justify-between p-2 min-[1010px]:p-4 border-b border-border h-[60px] min-[1010px]:h-[73px] w-full">
      <div className="flex items-center gap-2 min-[1010px]:gap-4 md:pl-0 pl-10">
        <Button
          onClick={onNavigateToDashboard}
          variant="ghost"
          size="sm"
          className="min-[1010px]:hidden flex items-center gap-1.5 text-gray-800"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="text-sm font-medium min-[435px]:inline hidden">Dash</span>
        </Button>
        <Button
          onClick={onNavigateToDashboard}
          variant="ghost"
          size="sm"
          className="hidden min-[1010px]:flex items-center space-x-2 text-gray-800 font-semibold"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Dashboard</span>
        </Button>
        <Select value={currentChatModel || selectedModel} onValueChange={onModelChange}>
          <SelectTrigger className="w-[130px] min-[1010px]:w-[180px] bg-white shadow-[0_4px_8px_-1px_rgba(0,0,0,0.2)] border-gray-100 hover:border-blue-200 focus:ring-2 focus:ring-blue-100 focus:border-blue-200 transition-all">
            <SelectValue placeholder="Select model" />
          </SelectTrigger>
          <SelectContent className="bg-white shadow-[0_4px_8px_-1px_rgba(0,0,0,0.2)] border-gray-100">
            <SelectItem value="gpt-4o-mini">GPT-4o-mini</SelectItem>
            <SelectItem value="gpt-4o">GPT-4o</SelectItem>
            <SelectItem value="o3-mini">O3-mini</SelectItem>
          </SelectContent>
        </Select>
        <Button 
          onClick={onNewChat} 
          variant="outline"
          className="h-9 px-4 whitespace-nowrap bg-blue-50 border-blue-100 hover:bg-blue-100 hover:border-blue-200 shadow-[0_4px_8px_-1px_rgba(0,0,0,0.2)] transition-colors"
        >
          <span className="hidden min-[390px]:inline text-blue-600">New Chat</span>
          <span className="min-[390px]:hidden text-blue-600">New</span>
        </Button>
      </div>
      <UserLoginStatus />
    </div>
  );
};
