import React from 'react';
import { Button } from './button';
import { Send } from 'lucide-react';

interface SendButtonProps {
  onClick: () => void;
  disabled?: boolean;
}

export const SendButton: React.FC<SendButtonProps> = ({ onClick, disabled = false }) => {
  return (
    <Button
      variant="outline"
      size="icon-sm"
      className={`shrink-0 bg-blue-50 border-blue-100 hover:bg-blue-100 hover:border-blue-200 transition-colors ${
        disabled ? 'opacity-50 cursor-not-allowed' : ''
      }`}
      onClick={onClick}
      disabled={disabled}
    >
      <Send className="h-3.5 w-3.5 md:h-4 md:w-4 text-blue-600" />
    </Button>
  );
};
