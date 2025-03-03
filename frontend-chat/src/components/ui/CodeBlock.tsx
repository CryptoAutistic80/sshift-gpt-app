import React from 'react';
import { Button } from './button';
import { Copy } from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { materialDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface CodeBlockProps {
  language: string;
  value: string;
  onCopy: (text: string) => void;
}

export const CodeBlock: React.FC<CodeBlockProps> = ({ language, value, onCopy }) => {
  return (
    <div className="relative w-full max-w-full overflow-hidden">
      <div className="flex justify-between items-center bg-gray-800 text-white p-1.5 min-[768px]:p-2 rounded-t">
        <span className="text-[10px] min-[768px]:text-sm truncate max-w-[calc(100%-40px)]">{language}</span>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => onCopy(value)}
          className="h-6 w-6 min-[768px]:h-8 min-[768px]:w-8 flex-shrink-0"
        >
          <Copy className="h-3 w-3 min-[768px]:h-4 min-[768px]:w-4" />
        </Button>
      </div>
      <div className="w-full max-w-full overflow-x-auto">
        <SyntaxHighlighter
          language={language}
          style={materialDark}
          customStyle={{
            margin: 0,
            borderRadius: '0 0 0.5rem 0.5rem',
            padding: '0.5rem',
            minWidth: '0',
            width: '100%',
            wordBreak: 'break-word',
            whiteSpace: 'pre-wrap',
            fontSize: 'inherit'
          }}
          wrapLongLines={true}
          className="text-[11px] min-[768px]:text-[14px] max-w-full overflow-x-auto [&_pre]:!whitespace-pre-wrap [&_pre]:!break-words [&_code]:!whitespace-pre-wrap [&_code]:!break-words [&_code]:!break-all"
        >
          {value}
        </SyntaxHighlighter>
      </div>
    </div>
  );
}; 