import React from 'react';
import { cn } from '../../lib/utils';

interface StatusIndicatorProps {
  status: 'thinking' | 'tool-calling' | 'typing';
  className?: string;
}

export function StatusIndicator({ status, className }: StatusIndicatorProps) {
  const statusText = {
    thinking: 'Thinking',
    'tool-calling': 'Tool calling',
    typing: 'Typing'
  };

  return (
    <div className={cn('flex items-center space-x-2 text-gray-500', className)}>
      <span className="font-medium animate-pulse">
        {statusText[status]}
      </span>
      <span className="flex space-x-1">
        <span className="animate-bounce">.</span>
        <span className="animate-bounce animation-delay-200">.</span>
        <span className="animate-bounce animation-delay-400">.</span>
      </span>
    </div>
  );
}
