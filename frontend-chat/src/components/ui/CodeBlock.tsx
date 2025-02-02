import React, { useState, useRef } from 'react';
import { Button } from './button';
import { Copy, Play } from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { materialDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { RunCodeModal } from './RunCodeModal';

interface CodeBlockProps {
  language: string;
  value: string;
  onCopy: (text: string) => void;
}

export const CodeBlock: React.FC<CodeBlockProps> = ({ language, value, onCopy }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTop, setModalTop] = useState(0);
  const runButtonRef = useRef<HTMLButtonElement>(null);

  return (
    <>
      <div className="relative w-full max-w-full overflow-hidden">
        <div className="flex justify-between items-center bg-gray-800 text-white p-1.5 min-[768px]:p-2 rounded-t">
          <span className="text-[10px] min-[768px]:text-sm truncate max-w-[calc(100%-40px)]">{language}</span>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onCopy(value)}
              className="h-6 w-6 min-[768px]:h-8 min-[768px]:w-8 flex-shrink-0"
            >
              <Copy className="h-3 w-3 min-[768px]:h-4 min-[768px]:w-4" />
            </Button>
            {language.toLowerCase() === 'python' && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  if (runButtonRef.current) {
                    const rect = runButtonRef.current.getBoundingClientRect();
                    setModalTop(rect.top);
                  }
                  setIsModalOpen(true);
                }}
                title="Run Code"
                className="h-6 w-6 min-[768px]:h-8 min-[768px]:w-8 flex-shrink-0"
                ref={runButtonRef}
              >
                <Play className="h-3 w-3 min-[768px]:h-4 min-[768px]:w-4" />
              </Button>
            )}
          </div>
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
      {isModalOpen && (
        <RunCodeModal code={value} top={modalTop} onClose={() => setIsModalOpen(false)} />
      )}
    </>
  );
}; 