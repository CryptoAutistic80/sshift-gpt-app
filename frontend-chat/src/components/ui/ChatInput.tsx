import React, { useState } from 'react';
import { Textarea } from './textarea';
import { X } from 'lucide-react';
import { StopButton } from './StopButton';
import { SendButton } from './SendButton';
import { ImageUploadButton } from './ImageUploadButton';
import backend from '../../services/backend';
import { useAuth } from '../../context/AuthProvider';

interface ChatInputProps {
  onSendMessage: (message: string, imageUrls: string[]) => void;
  isGenerating?: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  isGenerating = false,
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

        const response = await backend.post('/bucket', formData, {
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
          <div className="flex gap-1 items-center mb-2">
            {uploadedImages.map((url, index) => (
              <div key={url} className="relative flex-shrink-0">
                <img
                  src={url}
                  alt={`Uploaded ${index + 1}`}
                  className="h-5 w-5 md:h-6 md:w-6 object-cover rounded-full border border-gray-300"
                />
                <button
                  className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5"
                  onClick={() => handleRemoveImage(index)}
                >
                  <X className="h-2 w-2" />
                </button>
              </div>
            ))}
          </div>
        )}
        <div className="flex gap-1.5 md:gap-2 items-end">
          <div className="flex-1 min-h-0">
            <Textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              onPaste={handlePaste}
              placeholder="Type your message here... (Ctrl+Enter to send)"
              className="resize-none"
              isExpanded={isExpanded}
              onToggleExpand={() => setIsExpanded(!isExpanded)}
            />
          </div>
          <div className="flex items-end self-end gap-1.5 md:gap-2 flex-shrink-0">
            <ImageUploadButton
              onImageSelect={setUploadedImages}
              uploadedImages={uploadedImages}
            />
            <StopButton onStop={handleStop} />
            <SendButton onClick={handleSendMessage} disabled={isGenerating} />
          </div>
        </div>
      </div>
    </div>
  );
};
