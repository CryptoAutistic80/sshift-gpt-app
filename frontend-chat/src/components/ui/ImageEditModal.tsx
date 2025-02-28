import React, { useRef, useState, useEffect } from 'react';
import { X, Paintbrush, Eraser } from 'lucide-react';
import backend, { toolsApi } from '../../services/backend';
import { useAuth } from '../../context/AuthProvider';

interface ImageEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
}

enum ModelType {
  V_2 = 'V_2',
  V_2_TURBO = 'V_2_TURBO'
}

enum BrushMode {
  PAINT = 'paint',
  ERASE = 'erase'
}

export const ImageEditModal: React.FC<ImageEditModalProps> = ({
  isOpen,
  onClose,
  imageUrl,
}) => {
  const { jwt } = useAuth();
  const [model, setModel] = useState<ModelType>(ModelType.V_2);
  const [prompt, setPrompt] = useState('');
  const [brushSize, setBrushSize] = useState(20);
  const [brushMode, setBrushMode] = useState<BrushMode>(BrushMode.PAINT);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [ctx, setCtx] = useState<CanvasRenderingContext2D | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [originalDimensions, setOriginalDimensions] = useState<{ width: number; height: number } | null>(null);

  const updateBrushSettings = (context: CanvasRenderingContext2D) => {
    if (brushMode === BrushMode.PAINT) {
      context.globalCompositeOperation = 'multiply';
      context.fillStyle = 'rgba(255, 0, 0, 0.2)';
      context.strokeStyle = 'rgba(255, 0, 0, 0.2)';
    } else {
      context.globalCompositeOperation = 'destination-out';
      context.fillStyle = 'rgba(255, 255, 255, 1)';
      context.strokeStyle = 'rgba(255, 255, 255, 1)';
    }
    context.lineWidth = brushSize;
    context.lineCap = 'round';
    context.lineJoin = 'round';
    context.globalAlpha = 0.2;
  };

  useEffect(() => {
    if (isOpen && canvasRef.current) {
      const context = canvasRef.current.getContext('2d', { willReadFrequently: true });
      setCtx(context);
    }
  }, [isOpen]);

  useEffect(() => {
    if (imageRef.current) {
      const img = imageRef.current;
      img.onload = () => {
        setImageLoaded(true);
        // Store original dimensions
        setOriginalDimensions({
          width: img.naturalWidth,
          height: img.naturalHeight
        });
        if (canvasRef.current && ctx) {
          // Set canvas to original image dimensions
          canvasRef.current.width = img.naturalWidth;
          canvasRef.current.height = img.naturalHeight;
          updateBrushSettings(ctx);
        }
      };
    }
  }, [ctx, brushSize]);

  useEffect(() => {
    if (ctx) {
      updateBrushSettings(ctx);
    }
  }, [brushMode, brushSize]);

  const getScaledCoordinates = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || !originalDimensions) return { x: 0, y: 0 };
    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = originalDimensions.width / rect.width;
    const scaleY = originalDimensions.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!ctx) return;
    const { x, y } = getScaledCoordinates(e);
    
    ctx.beginPath();
    ctx.arc(x, y, brushSize / 2, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !ctx) return;
    const { x, y } = getScaledCoordinates(e);
    
    ctx.beginPath();
    ctx.arc(x, y, brushSize / 2, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!ctx) return;
    ctx.closePath();
    setIsDrawing(false);
  };

  const clearMask = () => {
    if (!ctx || !canvasRef.current) return;
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    updateBrushSettings(ctx);
  };

  const createMaskImage = async (): Promise<Blob> => {
    if (!canvasRef.current || !ctx) throw new Error('Canvas not initialized');

    // Create a new canvas for the mask
    const maskCanvas = document.createElement('canvas');
    maskCanvas.width = canvasRef.current.width;
    maskCanvas.height = canvasRef.current.height;
    const maskCtx = maskCanvas.getContext('2d')!;

    // Fill with black background
    maskCtx.fillStyle = 'black';
    maskCtx.fillRect(0, 0, maskCanvas.width, maskCanvas.height);

    // Set composite operation to copy only the red painted areas
    maskCtx.globalCompositeOperation = 'source-over';

    // Get the current canvas image data
    const imageData = ctx.getImageData(0, 0, canvasRef.current.width, canvasRef.current.height);
    const data = imageData.data;

    // Create new image data for the mask
    const maskImageData = maskCtx.createImageData(canvasRef.current.width, canvasRef.current.height);
    const maskData = maskImageData.data;

    // Convert the red semi-transparent areas to white
    for (let i = 0; i < data.length; i += 4) {
      // If there's any red (indicating a painted area)
      if (data[i] > 0) {
        // Set to white (255, 255, 255, 255)
        maskData[i] = 255;     // R
        maskData[i + 1] = 255; // G
        maskData[i + 2] = 255; // B
        maskData[i + 3] = 255; // A
      } else {
        // Set to black (0, 0, 0, 255)
        maskData[i] = 0;     // R
        maskData[i + 1] = 0; // G
        maskData[i + 2] = 0; // B
        maskData[i + 3] = 255; // A
      }
    }

    // Put the mask image data back to the mask canvas
    maskCtx.putImageData(maskImageData, 0, 0);

    // Convert the canvas to a blob
    return new Promise((resolve) => {
      maskCanvas.toBlob((blob) => {
        resolve(blob!);
      }, 'image/png');
    });
  };

  const handleSendEdit = async () => {
    try {
      if (!jwt) {
        throw new Error('No authentication token found');
      }

      // Create the mask image
      const maskBlob = await createMaskImage();
      
      // Create form data for mask upload
      const formData = new FormData();
      formData.append('file', maskBlob, 'mask.png');

      // Upload the mask to the bucket using the dedicated mask endpoint
      const maskResponse = await backend.post('/bucket/mask', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${jwt}`
        },
      });

      const maskUrl = maskResponse.data.url;
      console.log('Mask uploaded successfully:', maskUrl);

      // Send edit request to ideogram endpoint
      const editPayload = {
        imageUrl: imageUrl,
        maskUrl: maskUrl,
        prompt: prompt,
        model: model,
        magic_prompt_option: 'AUTO',
        num_images: 1
      };

      const editResponse = await toolsApi.post('/ideogram/edit', editPayload, {
        headers: {
          'Authorization': `Bearer ${jwt}`
        }
      });

      console.log('Edit response:', editResponse.data);
      
    } catch (error) {
      console.error('Error in edit process:', error);
      if (error instanceof Error) {
        alert(`Failed to process edit: ${error.message}`);
      } else {
        alert('Failed to process edit. Please try again.');
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Edit Image</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="relative w-full" style={{ maxHeight: '70vh' }}>
            <img
              ref={imageRef}
              src={imageUrl}
              alt="Edit"
              className="w-full h-auto"
            />
            <canvas
              ref={canvasRef}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              className="absolute top-0 left-0 w-full h-full"
              style={{
                background: 'transparent',
                pointerEvents: imageLoaded ? 'auto' : 'none',
                cursor: brushMode === BrushMode.PAINT ? 'crosshair' : 'cell'
              }}
            />
          </div>

          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Model
              </label>
              <select
                value={model}
                onChange={(e) => setModel(e.target.value as ModelType)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={ModelType.V_2}>V2</option>
                <option value={ModelType.V_2_TURBO}>V2 Turbo</option>
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Prompt
              </label>
              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Enter your edit prompt..."
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Brush Size: {brushSize}px
              </label>
              <input
                type="range"
                min="1"
                max="100"
                value={brushSize}
                onChange={(e) => setBrushSize(Number(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setBrushMode(BrushMode.PAINT)}
                className={`p-2 rounded-md flex items-center gap-2 ${
                  brushMode === BrushMode.PAINT
                    ? 'bg-blue-100 text-blue-600'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                <Paintbrush className="h-5 w-5" />
                Paint
              </button>
              <button
                onClick={() => setBrushMode(BrushMode.ERASE)}
                className={`p-2 rounded-md flex items-center gap-2 ${
                  brushMode === BrushMode.ERASE
                    ? 'bg-blue-100 text-blue-600'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                <Eraser className="h-5 w-5" />
                Erase
              </button>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <button
              onClick={clearMask}
              className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              Clear Mask
            </button>
            <button
              onClick={handleSendEdit}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Send Edit
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}; 