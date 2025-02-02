import React, { useState } from 'react';
import { Button } from './button';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { materialDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface RunCodeModalProps {
  code: string;
  top: number;
  onClose: () => void;
}

export const RunCodeModal: React.FC<RunCodeModalProps> = ({ code, top, onClose }) => {
  const [activeTab, setActiveTab] = useState<'code' | 'terminal' | 'output'>('terminal');

  // Function to extract imported packages and prepend pip install command for non-standard packages
  const prepareCode = (code: string): string => {
    const lines = code.split('\n');
    const packages = new Set<string>();
    const regex = /^\s*(import|from)\s+([^\s]+)/;
    // List of common standard library modules to exclude
    const standardModules = new Set([
      'sys', 'math', 'os', 're', 'json', 'datetime', 'time',
      'itertools', 'functools', 'collections', 'subprocess', 'threading',
      'multiprocessing', 'socket', 'struct', 'logging', 'http', 'random'
    ]);
    for (const line of lines) {
      const match = line.match(regex);
      if (match) {
        const pkg = match[2].split('.')[0];
        if (!standardModules.has(pkg)) {
          packages.add(pkg);
        }
      }
    }
    if (packages.size > 0) {
      const pipLine = `!pip install ${Array.from(packages).join(' ')}\n\n`;
      return pipLine + code;
    }
    return code;
  };

  const preparedCode = prepareCode(code);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50" onClick={onClose}>
      <div
        className="absolute left-1/2 transform -translate-x-1/2 bg-white rounded-lg shadow-lg w-11/12 max-w-4xl aspect-square flex flex-col"
        style={{ top }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-4 border-b">
          <div className="flex space-x-4">
            <button
              onClick={() => setActiveTab('code')}
              className={`${activeTab === 'code' ? 'text-blue-500 border-b-2 border-blue-500' : 'text-gray-500'} px-3 py-1`}
            >
              Code
            </button>
            <button
              onClick={() => setActiveTab('terminal')}
              className={`${activeTab === 'terminal' ? 'text-blue-500 border-b-2 border-blue-500' : 'text-gray-500'} px-3 py-1`}
            >
              Terminal
            </button>
            <button
              onClick={() => setActiveTab('output')}
              className={`${activeTab === 'output' ? 'text-blue-500 border-b-2 border-blue-500' : 'text-gray-500'} px-3 py-1`}
            >
              Output
            </button>
          </div>
          <Button onClick={onClose} variant="ghost">
            Stop
          </Button>
        </div>
        <div className="flex-1 overflow-auto p-4">
          {activeTab === 'code' && (
            <SyntaxHighlighter
              language="python"
              style={materialDark}
              customStyle={{ padding: '1rem', borderRadius: '0.375rem' }}
            >
              {preparedCode}
            </SyntaxHighlighter>
          )}
          {activeTab === 'terminal' && (
            <div className="bg-black text-green-500 font-mono p-4 rounded">
              Terminal output will appear here...
            </div>
          )}
          {activeTab === 'output' && (
            <div className="bg-gray-100 p-4 rounded">
              Output will appear here...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}; 