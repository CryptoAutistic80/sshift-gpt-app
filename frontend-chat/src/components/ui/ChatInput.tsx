import React, { useState } from 'react';
import { Textarea } from './textarea';
import { X } from 'lucide-react';
import { StopButton } from './StopButton';
import { SendButton } from './SendButton';
import { ImageUploadButton } from './ImageUploadButton';
import backend from '../../services/backend';
import { useAuth } from '../../context/AuthProvider';
import tools from '../../services/tools';

interface ChatInputProps {
  onSendMessage: (message: string, imageUrls: string[]) => void;
  isGenerating?: boolean;
  selectedModel: string;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  isGenerating = false,
  selectedModel,
}) => {
  const [inputMessage, setInputMessage] = useState('');
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const { jwt } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleSendMessage = () => {
    if ((inputMessage.trim() || uploadedImages.length > 0) && !isGenerating) {
      onSendMessage(inputMessage, uploadedImages);
      setInputMessage('');
      setUploadedImages([]);
      setIsExpanded(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      if (!isGenerating) {
        handleSendMessage();
      }
    }
  };

  const handleRemoveImage = (indexToRemove: number) => {
    setUploadedImages(
      uploadedImages.filter((_, index) => index !== indexToRemove)
    );
  };

  const handleStop = async () => {
    try {
      await backend.delete('/agent', {
        headers: {
          Authorization: `Bearer ${jwt}`,
        },
      });
    } catch (error) {
      console.error('Error stopping the stream:', error);
    }
  };

  const handlePaste = async (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;

    if (!items || uploadedImages.length >= 4) return;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];

      if (item.type.indexOf('image') === -1) continue;

      e.preventDefault();

      if (uploadedImages.length >= 4) {
        alert('Maximum 4 images allowed.');
        return;
      }

      try {
        setUploading(true);
        const file = item.getAsFile();
        if (!file) continue;

        // Create a new filename with timestamp to avoid conflicts
        const timestamp = new Date().getTime();
        const newFile = new File(
          [file],
          `pasted-image-${timestamp}.${file.type.split('/')[1]}`,
          {
            type: file.type,
          }
        );

        const formData = new FormData();
        formData.append('file', newFile);

        const response = await tools.post('/bucket', formData, {
          headers: {
            'content-type': 'multipart/form-data',
            Authorization: `Bearer ${jwt}`,
          },
        });

        const data = await response.data;
        setUploadedImages((prev) => [...prev, data.url]);
      } catch (error) {
        console.error('Error uploading pasted image:', error);
        alert('Failed to upload pasted image');
      } finally {
        setUploading(false);
      }
    }
  };

  return (
    <div className="w-full bg-background border-t border-border flex-shrink-0">
      <div className="max-w-6xl mx-auto px-2 py-2 md:px-4 md:py-3">
        {uploadedImages.length > 0 && (
          <div className="flex gap-1.5 items-center mb-2 px-1">
            {uploadedImages.map((url, index) => (
              <div key={url} className="relative flex-shrink-0">
                <img
                  src={url}
                  alt={`Uploaded ${index + 1}`}
                  className="h-6 w-6 md:h-8 md:w-8 object-cover rounded-lg border border-gray-200 shadow-sm"
                />
                <button
                  className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 shadow-sm hover:bg-red-600 transition-colors"
                  onClick={() => handleRemoveImage(index)}
                >
                  <X className="h-2.5 w-2.5" />
                </button>
              </div>
            ))}
          </div>
        )}
        <div className="flex gap-2 md:gap-3 items-end">
          <div className="flex-1 min-h-0">
            <Textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              onPaste={handlePaste}
              placeholder="Type your message here... (Ctrl+Enter to send)"
              className="resize-none bg-white rounded-xl shadow-[0_4px_8px_-1px_rgba(0,0,0,0.2)] border border-gray-100 focus:ring-2 focus:ring-blue-100 focus:border-blue-200 transition-shadow"
              isExpanded={isExpanded}
              onToggleExpand={() => setIsExpanded(!isExpanded)}
            />
          </div>
          <div className="flex items-end self-end gap-1.5 md:gap-2 flex-shrink-0">
            <StopButton onStop={handleStop} />
            <ImageUploadButton
              onImageSelect={setUploadedImages}
              uploadedImages={uploadedImages}
              selectedModel={selectedModel}
            />
            <SendButton onClick={handleSendMessage} disabled={isGenerating} />
          </div>
        </div>
      </div>
    </div>
  );
};
