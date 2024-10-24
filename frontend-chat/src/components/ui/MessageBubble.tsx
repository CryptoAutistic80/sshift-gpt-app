import React, { useState, useRef, useEffect } from 'react';
import { Avatar, AvatarImage, AvatarFallback } from './avatar';
import { Button } from './button';
import { Copy, Volume2, RefreshCw, Edit2, Check } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { materialDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { AssistantButtonArray } from './assistantButtonArray';
import { UserButtonArray } from './userButtonArray';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  created?: number;
  model?: string;
  finish_reason?: string;
  system_fingerprint?: string;
  image?: string;
}

interface CodeBlockProps {
  language: string;
  value: string;
  onCopy: (text: string) => void;
}

const CodeBlock: React.FC<CodeBlockProps> = ({ language, value, onCopy }) => {
  return (
    <div className="relative">
      <div className="flex justify-between items-center bg-gray-800 text-white p-2 rounded-t">
        <span className="text-sm">{language}</span>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => onCopy(value)}
        >
          <Copy className="h-4 w-4" />
        </Button>
      </div>
      <SyntaxHighlighter
        language={language}
        style={materialDark}
        customStyle={{
          margin: 0,
          borderRadius: '0 0 0.5rem 0.5rem',
          padding: '1rem',
        }}
      >
        {value}
      </SyntaxHighlighter>
    </div>
  );
};

interface MessageBubbleProps {
  message: Message;
  onCopy: (text: string) => void;
  onRegenerate: (message: Message) => void;
  onEdit: (message: Message, newContent: string) => void;
}

const ImageThumbnail: React.FC<{ src: string }> = ({ src }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const imageKey = useRef(Math.random().toString(36).substring(7));

  return (
    <div className="mt-2" key={imageKey.current}>
      <img
        src={src}
        alt="Generated or Uploaded"
        className={`cursor-pointer rounded ${
          isExpanded
            ? 'max-w-full h-auto'
            : 'max-w-[200px] max-h-[200px] object-cover'
        }`}
        onClick={() => setIsExpanded(!isExpanded)}
      />
    </div>
  );
};

export function MessageBubble({ message, onCopy, onRegenerate, onEdit }: MessageBubbleProps) {
  const isUser = message.role === 'user';
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(message.content);
  const [parsedContent, setParsedContent] = useState<{ 
    text: string; 
    images?: string[] 
  }>({ text: message.content });

  useEffect(() => {
    try {
        const contentObj = JSON.parse(message.content);
        if (contentObj.final_message) {
            setParsedContent({
                text: contentObj.final_message.content,
                images: contentObj.final_message.images || [] // Handle array of images
            });
        } else {
            setParsedContent({ text: message.content });
        }
    } catch (e) {
        setParsedContent({ text: message.content });
    }
  }, [message.content]);

  const handleEditClick = () => {
    if (isEditing) {
      onEdit(message, editedContent);
      setIsEditing(false);
    } else {
      setIsEditing(true);
    }
  };

  const renderContent = () => {
    if (isUser && isEditing) {
      return (
        <textarea
          value={editedContent}
          onChange={(e) => setEditedContent(e.target.value)}
          className="w-full bg-white text-black p-2 rounded"
        />
      );
    }

    return (
      <>
        <ReactMarkdown
          components={{
            code: ({ node, inline, className, children, ...props }: any) => {
              const match = /language-(\w+)/.exec(className || '');
              return !inline && match ? (
                <CodeBlock
                  language={match[1]}
                  value={String(children).replace(/\n$/, '')}
                  onCopy={onCopy}
                />
              ) : (
                <code className={className} {...props}>
                  {children}
                </code>
              );
            },
            p: ({ children }) => <p className="mb-2">{children}</p>,
            h1: ({ children }) => (
              <h1 className="text-2xl font-bold mb-2">{children}</h1>
            ),
            h2: ({ children }) => (
              <h2 className="text-xl font-bold mb-2">{children}</h2>
            ),
            h3: ({ children }) => (
              <h3 className="text-lg font-bold mb-2">{children}</h3>
            ),
            ul: ({ children }) => (
              <ul className="list-disc pl-4 mb-2">{children}</ul>
            ),
            ol: ({ children }) => (
              <ol className="list-decimal pl-4 mb-2">{children}</ol>
            ),
            li: ({ children }) => <li className="mb-1">{children}</li>,
            img: ({ src, alt }) => <ImageThumbnail src={src || ''} />,
            a: ({ href, children }) => (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-800 hover:underline"
              >
                {children}
              </a>
            ),
          }}
          className="prose max-w-none"
        >
          {parsedContent.text}
        </ReactMarkdown>
        {/* Render all images in the array */}
        {parsedContent.images?.map((imageUrl, index) => (
          <ImageThumbnail key={`${imageUrl}-${index}`} src={imageUrl} />
        ))}
      </>
    );
  };

  return (
    <div
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}
    >
      {!isUser && (
        <Avatar className="w-8 h-8 mr-2 flex-shrink-0">
          <AvatarImage src="/images/sshift-guy.png" alt="AI Avatar" />
          <AvatarFallback>AI</AvatarFallback>
        </Avatar>
      )}
      <div
        className={`max-w-[75%] w-auto p-3 rounded-lg ${
          isUser ? 'bg-[#B7D6E9] text-black' : 'bg-gray-200 text-gray-800'
        }`}
      >
        {renderContent()}
        {!isUser && (
          <AssistantButtonArray
            onCopy={onCopy}
            onRegenerate={() => onRegenerate(message)}
            content={message.content}
          />
        )}
        {isUser && (
          <UserButtonArray
            onEdit={(newContent) => onEdit(message, newContent)}
            content={message.content}
          />
        )}
      </div>
      {isUser && (
        <Avatar className="w-8 h-8 ml-2 flex-shrink-0">
          <AvatarImage src="/images/sshift-guy-user.png" alt="User Avatar" />
          <AvatarFallback>User</AvatarFallback>
        </Avatar>
      )}
    </div>
  );
}
