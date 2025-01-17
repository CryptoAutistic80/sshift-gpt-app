import React, { useState, useMemo } from 'react';
import { Avatar, AvatarImage, AvatarFallback } from './avatar';
import ReactMarkdown from 'react-markdown';
import { CodeBlock } from './CodeBlock';
import { ImageThumbnail } from './ImageThumbnail';
import { AudioPlayer } from './AudioPlayer';
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
  images?: string[];
}

interface MessageBubbleProps {
  message: Message;
  onCopy: (text: string) => void;
  onRegenerate: (message: Message) => void;
  onEdit: (message: Message, newContent: string) => void;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  onCopy,
  onRegenerate,
  onEdit,
}) => {
  const isUser = message.role === 'user';
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(message.content);
  const [parsedContent, setParsedContent] = useState<{
    text: string;
    images?: string[];
  }>({ text: message.content });
  const [expandedImage, setExpandedImage] = useState<string | null>(null);
  const [expandedThumbnailIndex, setExpandedThumbnailIndex] = useState<number | null>(null);

  // Extract audio URLs before rendering
  const audioUrls = useMemo(() => {
    const urls: string[] = [];
    const soundEffectRegex = /\[Sound Effect: (.*?)\]\((.*?\.mp3)\)/g;
    let match;
    
    // Find all sound effect matches
    while ((match = soundEffectRegex.exec(parsedContent.text)) !== null) {
      urls.push(match[2]);
    }
    
    // Find all direct .mp3 links
    const mp3LinkRegex = /\[(.*?)\]\((.*?\.mp3)\)/g;
    while ((match = mp3LinkRegex.exec(parsedContent.text)) !== null) {
      if (!urls.includes(match[2])) {
        urls.push(match[2]);
      }
    }
    
    return urls;
  }, [parsedContent.text]);

  React.useEffect(() => {
    try {
      const contentObj = JSON.parse(message.content);
      if (contentObj.final_message) {
        setParsedContent({
          text: contentObj.final_message.content,
          images: contentObj.final_message.images || [],
        });
      } else {
        setParsedContent({ text: message.content });
      }
    } catch (e) {
      setParsedContent({ text: message.content });
    }
  }, [message.content]);

  // Add useEffect to sync editedContent with message.content when edit mode changes
  React.useEffect(() => {
    if (isEditing) {
      setEditedContent(message.content);
    }
  }, [isEditing, message.content]);

  const handleEditClick = () => {
    if (isEditing) {
      onEdit(message, editedContent);
      setIsEditing(false);
    } else {
      setEditedContent(message.content); // Also set content when entering edit mode
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

    // Add code block detection for user messages
    if (isUser) {
      // First check for explicitly marked code blocks
      const markedCodeBlockRegex = /(#\[.*?\][\s\S]*?\})/g;
      
      // Also check for potential unmarked code blocks that:
      // 1. Start with common code patterns like "public fun", "function", "const", etc.
      // 2. Have consistent indentation
      // 3. End with a closing brace
      const unmarkedCodeBlockRegex = /(?:^|\n)(?:public\s+(?:fun|function)|private\s+(?:fun|function)|function|const|let|class|struct|enum|interface|impl|pub|fn|def|async|module\.exports|export|import|package|using|namespace)\s+[^\n]+(?:\{[\s\S]*?\}|\([^\)]*\)\s*\{[\s\S]*?\})/g;
      
      // Split by marked code blocks first
      let parts = parsedContent.text.split(markedCodeBlockRegex);
      
      // Process each non-code part for potential unmarked code blocks
      parts = parts.reduce((acc: string[], part: string) => {
        if (part.startsWith('#[')) {
          // This is a marked code block, keep as is
          acc.push(part);
        } else {
          // Check for unmarked code blocks
          const subParts = part.split(unmarkedCodeBlockRegex);
          const matches = part.match(unmarkedCodeBlockRegex) || [];
          
          // Interleave regular text and detected code blocks
          subParts.forEach((subPart, i) => {
            if (subPart) acc.push(subPart);
            if (matches[i]) acc.push(`#[auto]${matches[i]}`);
          });
        }
        return acc;
      }, []);
      
      return (
        <>
          {parts.map((part, index) => {
            if (part.startsWith('#[')) {
              // This is a code block, extract the language if present
              const langMatch = part.match(/#\[(.*?)\]/);
              const language = langMatch ? (langMatch[1] === 'auto' ? 'typescript' : langMatch[1]) : 'text';
              const code = part.replace(/#\[.*?\]/, '').trim();
              
              return (
                <CodeBlock
                  key={index}
                  language={language}
                  value={code}
                  onCopy={onCopy}
                />
              );
            }
            // Only render ReactMarkdown for non-empty parts
            if (part.trim()) {
              return (
                <ReactMarkdown
                  key={index}
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
                    h1: ({ children }) => <h1 className="text-base font-bold mb-2 min-[768px]:text-2xl">{children}</h1>,
                    h2: ({ children }) => <h2 className="text-sm font-bold mb-2 min-[768px]:text-xl">{children}</h2>,
                    h3: ({ children }) => <h3 className="text-sm font-bold mb-2 min-[768px]:text-lg">{children}</h3>,
                    p: ({ children }) => {
                      return <div className="mb-2 text-sm min-[768px]:text-base">{children}</div>;
                    },
                    a: ({ href, children }) => {
                      // Handle audio files by rendering the AudioPlayer component
                      if (href && href.endsWith('.mp3')) {
                        return <AudioPlayer src={href} />;
                      }
                      return (
                        <a
                          href={href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-800 hover:underline"
                        >
                          {children}
                        </a>
                      );
                    },
                    ul: ({ children }) => <ul className="list-disc pl-4 mb-2">{children}</ul>,
                    ol: ({ children }) => <ol className="list-decimal pl-4 mb-2">{children}</ol>,
                    li: ({ children }) => <li className="mb-1">{children}</li>,
                    img: ({ src, alt }) => (
                      <ImageThumbnail
                        src={src || ''}
                        onClick={() =>
                          isUser
                            ? setExpandedImage(src || '')
                            : setExpandedThumbnailIndex(expandedThumbnailIndex === 0 ? null : 0)
                        }
                        isExpanded={!isUser && expandedThumbnailIndex === 0}
                        isAssistantMessage={!isUser}
                      />
                    ),
                  }}
                  className="prose max-w-none"
                >
                  {part}
                </ReactMarkdown>
              );
            }
            return null;
          })}
        </>
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
            h1: ({ children }) => <h1 className="text-base font-bold mb-2 min-[768px]:text-2xl">{children}</h1>,
            h2: ({ children }) => <h2 className="text-sm font-bold mb-2 min-[768px]:text-xl">{children}</h2>,
            h3: ({ children }) => <h3 className="text-sm font-bold mb-2 min-[768px]:text-lg">{children}</h3>,
            p: ({ children }) => {
              return <div className="mb-2 text-sm min-[768px]:text-base">{children}</div>;
            },
            a: ({ href, children }) => {
              // Handle audio files by rendering the AudioPlayer component
              if (href && href.endsWith('.mp3')) {
                return <AudioPlayer src={href} />;
              }
              return (
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-800 hover:underline"
                >
                  {children}
                </a>
              );
            },
            ul: ({ children }) => <ul className="list-disc pl-4 mb-2">{children}</ul>,
            ol: ({ children }) => <ol className="list-decimal pl-4 mb-2">{children}</ol>,
            li: ({ children }) => <li className="mb-1">{children}</li>,
            img: ({ src, alt }) => (
              <ImageThumbnail
                src={src || ''}
                onClick={() =>
                  isUser
                    ? setExpandedImage(src || '')
                    : setExpandedThumbnailIndex(expandedThumbnailIndex === 0 ? null : 0)
                }
                isExpanded={!isUser && expandedThumbnailIndex === 0}
                isAssistantMessage={!isUser}
              />
            ),
          }}
          className="prose max-w-none"
        >
          {parsedContent.text}
        </ReactMarkdown>

        {message.images && message.images.length > 0 && (
          <div className="mt-2 flex gap-2 overflow-x-auto">
            {message.images.map((imageUrl, index) => (
              <ImageThumbnail
                key={`${imageUrl}-${index}`}
                src={imageUrl}
                onClick={() =>
                  isUser
                    ? setExpandedImage(imageUrl)
                    : setExpandedThumbnailIndex(expandedThumbnailIndex === index ? null : index)
                }
                isExpanded={!isUser && expandedThumbnailIndex === index}
                isAssistantMessage={!isUser}
              />
            ))}
          </div>
        )}

        {isUser && expandedImage && (
          <div className="mt-4">
            <img
              src={expandedImage}
              alt="Expanded view"
              className="w-full h-auto rounded cursor-pointer"
              onClick={() => setExpandedImage(null)}
            />
          </div>
        )}
      </>
    );
  };

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      {!isUser && (
        <Avatar className="w-8 h-8 mr-2 flex-shrink-0">
          <AvatarImage src="/images/sshift-guy.png" alt="AI Avatar" />
          <AvatarFallback>AI</AvatarFallback>
        </Avatar>
      )}
      <div
        className={`max-w-[75%] w-auto p-3 rounded-lg ${
          isUser ? 'bg-[#B7D6E9] text-black' : 'bg-gray-200 text-gray-800'
        } text-sm min-[768px]:text-base overflow-hidden`}
      >
        <div className="prose prose-sm max-w-none min-[768px]:prose-base !prose-h1:text-base !prose-h2:text-sm !prose-h3:text-sm !prose-p:text-sm min-[768px]:!prose-h1:text-2xl min-[768px]:!prose-h2:text-xl min-[768px]:!prose-h3:text-lg min-[768px]:!prose-p:text-base [&_code]:break-words [&_code]:whitespace-pre-wrap [&_p]:break-words [&_p]:whitespace-pre-wrap">
          {renderContent()}
        </div>

        {!isUser && (
          <AssistantButtonArray
            onCopy={onCopy}
            onRegenerate={() => onRegenerate(message)}
            content={message.content}
          />
        )}
        {isUser && (
          <UserButtonArray onEdit={(newContent) => onEdit(message, newContent)} content={message.content} />
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
};