import React, { useState } from 'react';
import { Button } from './button';
import { Copy, Volume2, RefreshCw } from 'lucide-react';

interface AssistantButtonArrayProps {
  onCopy: (text: string) => void;
  onRegenerate: () => void;
  content: string;
}

export function AssistantButtonArray({ onCopy, onRegenerate, content }: AssistantButtonArrayProps) {
  const [copied, setCopied] = useState(false);
  const [audioClicked, setAudioClicked] = useState(false);

  const handleCopy = () => {
    onCopy(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAudioClick = () => {
    setAudioClicked(true);
    setTimeout(() => setAudioClicked(false), 2000);
  };

  return (
    <div className="relative flex space-x-2 mt-2">
      <Button
        variant="ghost"
        size="icon"
        className="active:bg-gray-300 hover:scale-105 transition-transform duration-150 active:scale-95"
        onClick={handleCopy}
      >
        <Copy className="h-4 w-4" />
      </Button>
      {copied && (
        <span className="absolute top-8 left-0 text-xs text-gray-500 bg-white p-1 rounded">
          Copied
        </span>
      )}
      <Button
        variant="ghost"
        size="icon"
        className="active:bg-gray-300 hover:scale-105 transition-transform duration-150 active:scale-95"
        onClick={onRegenerate}
      >
        <RefreshCw className="h-4 w-4" />
      </Button>
      <div className="relative">
        <Button 
          variant="ghost" 
          size="icon" 
          className="active:bg-gray-300 hover:scale-105 transition-transform duration-150 active:scale-95"
          onClick={handleAudioClick}
        >
          <Volume2 className="h-4 w-4" />
        </Button>
        {audioClicked && (
          <span className="absolute top-8 left-1/2 transform -translate-x-1/2 text-xs text-gray-500 bg-white p-1 rounded whitespace-nowrap">
            Coming soon
          </span>
        )}
      </div>
    </div>
  );
}
