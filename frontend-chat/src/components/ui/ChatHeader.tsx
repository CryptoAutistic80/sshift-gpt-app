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
import UserLoginStatus from './UserLoginStatus'; // Import the new component

interface ChatHeaderProps {
  selectedModel: string;
  onModelChange: (value: string) => void;
  onNewChat: () => void;
  onNavigateToDashboard: () => void;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  selectedModel,
  onModelChange,
  onNewChat,
  onNavigateToDashboard,
}) => {
  return (
    <div className="flex items-center justify-between p-4 border-b border-border h-[73px] w-full">
      <div className="flex items-center space-x-4">
        <Button
          onClick={onNavigateToDashboard}
          variant="ghost"
          size="sm"
          className="flex items-center space-x-2 text-gray-800 font-semibold"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Dashboard</span>
        </Button>
        <Select value={selectedModel} onValueChange={onModelChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select model" />
          </SelectTrigger>
          <SelectContent className="bg-white">
            <SelectItem value="gpt-4o-mini">GPT-4o-mini</SelectItem>
            <SelectItem value="gpt-4o">GPT-4o</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={onNewChat} variant="outline">
          New Chat
        </Button>
      </div>
      <UserLoginStatus /> {/* Use the new component here */}
    </div>
  );
};
