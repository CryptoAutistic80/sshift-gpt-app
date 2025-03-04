import { useState, useRef } from 'react';
import { Button } from './button';
import { Image as LucideImage, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthProvider';
import tools from '../../services/tools';

interface ImageUploadButtonProps {
  onImageSelect: (imageUrls: string[]) => void;
  uploadedImages: string[];
  selectedModel: string;
}

// Function to resize image if needed
const resizeImageIfNeeded = async (file: File): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.src = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(img.src);

      let { width, height } = img;
      const MAX_SIZE = 1024;

      // Check if resizing is needed
      if (width <= MAX_SIZE && height <= MAX_SIZE) {
        resolve(file);
        return;
      }

      // Calculate new dimensions
      if (width > height) {
        height = Math.round((height * MAX_SIZE) / width);
        width = MAX_SIZE;
      } else {
        width = Math.round((width * MAX_SIZE) / height);
        height = MAX_SIZE;
      }

      // Create canvas and resize
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);

      // Convert to blob
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Could not convert canvas to blob'));
          }
        },
        file.type,
        0.9
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(img.src);
      reject(new Error('Failed to load image'));
    };
  });
};

export function ImageUploadButton({
  onImageSelect,
  uploadedImages,
  selectedModel,
}: ImageUploadButtonProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const { jwt } = useAuth();

  const isDisabled = selectedModel === 'o3-mini' || isUploading || uploadedImages.length >= 4;

  const handleImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = event.target.files;
    if (!files) return;

    if (uploadedImages.length + files.length > 4) {
      alert('Maximum 4 images allowed.');
      return;
    }

    setIsUploading(true);
    const uploadedUrls: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        // Resize image if needed
        const resizedBlob = await resizeImageIfNeeded(file);
        const resizedFile = new File([resizedBlob], file.name, {
          type: file.type,
        });

        const formData = new FormData();
        formData.append('file', resizedFile);

        const response = await tools.post('/bucket', formData, {
          headers: {
            'content-type': 'multipart/form-data',
            Authorization: `Bearer ${jwt}`,
          },
        });

        const data = await response.data;
        uploadedUrls.push(data.url);
      } catch (error) {
        console.error('Error processing/uploading image:', error);
        alert(`Failed to process/upload image: ${file.name}`);
      }
    }

    setIsUploading(false);
    if (uploadedUrls.length > 0) {
      onImageSelect([...uploadedImages, ...uploadedUrls]);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleButtonClick = () => {
    if (uploadedImages.length >= 4) {
      alert('Maximum 4 images allowed.');
      return;
    }
    if (selectedModel === 'o3-mini') {
      alert('Image upload is not available with O3-mini model.');
      return;
    }
    fileInputRef.current?.click();
  };

  return (
    <>
      <input
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
        style={{ display: 'none' }}
        ref={fileInputRef}
        multiple
      />
      <Button
        variant="outline"
        size="icon-sm"
        onClick={handleButtonClick}
        disabled={isDisabled}
        className={`bg-blue-50 border-blue-100 hover:bg-blue-100 hover:border-blue-200 transition-colors ${
          selectedModel === 'o3-mini' ? 'opacity-50 cursor-not-allowed' : ''
        }`}
      >
        {isUploading ? (
          <Loader2 className="h-3.5 w-3.5 md:h-4 md:w-4 animate-spin text-blue-600" />
        ) : (
          <LucideImage className="h-3.5 w-3.5 md:h-4 md:w-4 text-blue-600" />
        )}
      </Button>
    </>
  );
}
