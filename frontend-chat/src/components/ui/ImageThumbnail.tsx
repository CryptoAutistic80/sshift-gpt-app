import React, { useState } from 'react';
import { Download, Pencil } from 'lucide-react';
import backend from '../../services/backend';
import { useAuth } from '../../context/AuthProvider';
import { ImageEditModal } from './ImageEditModal';

interface ImageThumbnailProps {
  src: string;
  onClick: () => void;
  isExpanded?: boolean;
  isAssistantMessage?: boolean;
}

export const ImageThumbnail: React.FC<ImageThumbnailProps> = ({
  src,
  onClick,
  isExpanded,
  isAssistantMessage,
}) => {
  const { jwt, walletAddress } = useAuth();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const downloadImage = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    try {
      // Extract filename from URL
      let filename;
      try {
        const urlObj = new URL(src);
        const segments = urlObj.pathname.split('/');
        const bucketIndex = segments.findIndex(seg => seg === 'sshift-gpt-bucket');
        if (bucketIndex < 0 || bucketIndex === segments.length - 1) {
          throw new Error('Cannot extract filename');
        }
        filename = segments.slice(bucketIndex + 1).join('/');
        console.log('Extracted filename:', filename);
      } catch (err) {
        console.error('Error extracting filename', err);
        filename = 'image.png';
      }

      // Get the base URL from the backend service
      const baseUrl = backend.defaults.baseURL;
      if (!baseUrl) {
        console.error('Backend API URL is not defined');
        alert('Server configuration error. Please contact support.');
        return;
      }

      // Construct the full API URL, ensuring no double slashes
      const apiUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
      // Remove /chat-api since it's already in the baseUrl, and ensure we're using the correct bucket route
      const downloadUrl = `${apiUrl}/bucket/download/${encodeURIComponent(filename)}`;
      console.log('Download URL:', downloadUrl);

      // Get authentication token
      let token = jwt;
      if (!token) {
        const stored = window.localStorage.getItem('jwt');
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed)) {
              // if walletAddress is available, try to find token for that account
              if (walletAddress) {
                const userTokenObj = parsed.find((entry: { account: string; token: string; }) => entry.account === walletAddress);
                if (userTokenObj) {
                  token = userTokenObj.token;
                }
              }
              // Fallback to the first token in the array if none found for this wallet
              if (!token && parsed.length > 0) {
                token = parsed[0].token;
              }
            }
          } catch (err) {
            console.error('Error parsing token from localStorage:', err);
          }
        }
      }

      if (!token) {
        throw new Error('No authentication token found');
      }

      // Fetch the image
      const response = await fetch(downloadUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        mode: 'cors'
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Download failed:', errorText);
        throw new Error(`Download failed: ${response.status} ${errorText}`);
      }
      
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const displayFilename = filename.split('/').pop() || 'image.png';

      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

      if (isMobile) {
        // Try Web Share API first
        if (navigator.canShare && navigator.canShare({ files: [] })) {
          try {
            const file = new File([blob], displayFilename, { type: blob.type });
            await navigator.share({
              files: [file],
              title: 'Image',
              text: 'Image from SShift',
            });
            URL.revokeObjectURL(url);
            return;
          } catch (err) {
            console.warn('Share failed, falling back to new-tab:', err);
          }
        }

        // Mobile fallback: open image in new tab
        const newTab = window.open(url, '_blank');
        if (!newTab) {
          alert('Please allow pop-ups or manually save the image by long-pressing on it.');
        }
        // Don't revoke URL immediately as the new tab needs it
        setTimeout(() => URL.revokeObjectURL(url), 60000); // Revoke after 1 minute
        return;
      }

      // Desktop devices
      if ('showSaveFilePicker' in window) {
        console.log('Using File System Access API');
        const options = {
          suggestedName: displayFilename,
          types: [
            {
              description: 'Image file',
              accept: { 'image/png': ['.png'] },
            },
          ],
        };
        try {
          // @ts-ignore: showSaveFilePicker may not be defined in all TS environments
          const handle = await window.showSaveFilePicker(options);
          const writable = await handle.createWritable();
          await writable.write(blob);
          await writable.close();
          URL.revokeObjectURL(url);
          console.log('File saved successfully using File System Access API');
          return;
        } catch (err) {
          // Check if this is a user abort error (user canceled the save dialog)
          if (err instanceof Error && 
              (err.name === 'AbortError' || err.message.includes('user aborted') || err.message.includes('cancel'))) {
            console.log('User canceled the save dialog');
            URL.revokeObjectURL(url);
            return; // Exit gracefully without showing an error
          }
          
          console.error('Error using File System Access API:', err);
          // Fall through to traditional download method
        }
      }
      
      // Traditional download method for desktop
      const a = document.createElement('a');
      a.href = url;
      a.download = displayFilename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      console.log('Traditional download initiated');

    } catch (error) {
      console.error('Error during download:', error);
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      if (isMobile) {
        alert('Could not download image. Try taking a screenshot or opening the image in a new tab.');
      } else {
        alert('Failed to download image. Please try again.');
      }
    }
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditModalOpen(true);
  };

  return (
    <>
      <div className="cursor-pointer relative" onClick={onClick}>
        <img
          src={src}
          alt="Generated or Uploaded"
          className={`rounded ${
            isAssistantMessage
              ? isExpanded
                ? 'max-w-full w-full h-auto max-h-[80vh] object-contain'
                : 'max-w-[100px] max-h-[100px] object-cover'
              : 'max-w-[100px] max-h-[100px] object-cover'
          } transition-all duration-200`}
        />
        {isAssistantMessage && isExpanded && (
          <div className="absolute bottom-2 right-2 flex gap-2">
            <div
              className="p-1.5 bg-black/40 hover:bg-black/60 backdrop-blur-sm transition-colors rounded shadow-md"
              onClick={handleEdit}
            >
              <Pencil className="h-5 w-5 text-white" />
            </div>
            <div
              className="p-1.5 bg-black/40 hover:bg-black/60 backdrop-blur-sm transition-colors rounded shadow-md"
              onClick={downloadImage}
            >
              <Download className="h-5 w-5 text-white" />
            </div>
          </div>
        )}
      </div>
      <ImageEditModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        imageUrl={src}
      />
    </>
  );
}; 