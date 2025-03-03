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
    let filename;
    try {
      console.log('Source URL:', src);
      const urlObj = new URL(src);
      const segments = urlObj.pathname.split('/');
      console.log('URL segments:', segments);
      const bucketIndex = segments.findIndex(seg => seg === 'sshift-gpt-bucket');
      console.log('Bucket index:', bucketIndex);
      if (bucketIndex < 0 || bucketIndex === segments.length - 1) {
        throw new Error('Cannot extract filename');
      }
      filename = segments.slice(bucketIndex + 1).join('/');
      console.log('Extracted filename:', filename);
    } catch (err) {
      console.error('Error extracting filename', err);
      return;
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

    try {
      console.log('Initiating download request...');

      let token = jwt;
      console.log('Token from AuthContext:', token ? 'Token exists' : 'No token found in context');

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

      console.log('Final token being used:', token ? 'Token exists' : 'No token found');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(downloadUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        mode: 'cors'
      });
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Download failed:', errorText);
        throw new Error(`Download failed: ${response.status} ${errorText}`);
      }
      
      const blob = await response.blob();
      console.log('Blob received:', blob.type, blob.size);

      if ('showSaveFilePicker' in window) {
        console.log('Using File System Access API');
        const options = {
          suggestedName: filename.split('/').pop(),
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
          console.log('File saved successfully using File System Access API');
        } catch (err) {
          console.error('Error using File System Access API:', err);
          // Fallback to traditional download if user cancels File System Access API
          throw err;
        }
      } else {
        console.log('Using traditional download method');
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename.split('/').pop() || 'download.png';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        console.log('Traditional download initiated');
      }
    } catch (error) {
      console.error('Error during download:', error);
      // You might want to show an error message to the user here
      alert('Failed to download image. Please try again.');
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