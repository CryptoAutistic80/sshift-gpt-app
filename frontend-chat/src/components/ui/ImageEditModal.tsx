import React, { useRef, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Paintbrush, Eraser, Download } from 'lucide-react';
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
  const { jwt, walletAddress } = useAuth();
  const [model, setModel] = useState<ModelType>(ModelType.V_2_TURBO);
  const [prompt, setPrompt] = useState('');
  const [brushSize, setBrushSize] = useState(20);
  const [brushMode, setBrushMode] = useState<BrushMode>(BrushMode.PAINT);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [ctx, setCtx] = useState<CanvasRenderingContext2D | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [originalDimensions, setOriginalDimensions] = useState<{ width: number; height: number } | null>(null);
  const [previewMask, setPreviewMask] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [editedImageUrl, setEditedImageUrl] = useState<string | null>(null);
  const [showOriginal, setShowOriginal] = useState(true);
  
  // Zoom functionality
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isPinching, setIsPinching] = useState(false);
  const lastDistance = useRef<number | null>(null);
  const lastPosition = useRef({ x: 0, y: 0 });
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const lastTapRef = useRef<number>(0);
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const positionStart = useRef({ x: 0, y: 0 });
  const touchStartTimeRef = useRef<number>(0);
  const touchTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isTouchIntentDetermined = useRef<boolean>(false);

  // Add effect to ensure canvas dimensions match image while preserving content during zoom
  useEffect(() => {
    if (imageLoaded && imageRef.current && canvasRef.current && ctx && scale !== 1) {
      // Get current canvas content
      const tempCanvas = document.createElement('canvas');
      const tempCtx = tempCanvas.getContext('2d');
      if (!tempCtx) return;
      
      // Set temp canvas to same dimensions as current canvas and copy content
      tempCanvas.width = canvasRef.current.width;
      tempCanvas.height = canvasRef.current.height;
      tempCtx.drawImage(canvasRef.current, 0, 0);
      
      // Update canvas style dimensions to match image
      const imgRect = imageRef.current.getBoundingClientRect();
      const canvasStyle = canvasRef.current.style;
      canvasStyle.width = `${imgRect.width}px`;
      canvasStyle.height = `${imgRect.height}px`;
      
      // Restore the content
      ctx.drawImage(tempCanvas, 0, 0);
      
      // Clean up
      tempCanvas.remove();
    }
  }, [scale]);

  // Add effect to ensure canvas position matches image position
  useEffect(() => {
    if (!imageLoaded) return;

    const image = imageRef.current;
    const canvas = canvasRef.current;
    
    if (!image || !canvas) return;

    const updateCanvasPosition = () => {
      // Check refs are still valid when callback is invoked
      if (!imageRef.current || !canvasRef.current) return;
      
      const imgRect = imageRef.current.getBoundingClientRect();
      const canvasStyle = canvasRef.current.style;
      
      // Match the canvas position and dimensions to the image
      canvasStyle.width = `${imgRect.width}px`;
      canvasStyle.height = `${imgRect.height}px`;
    };
    
    // Initial update
    updateCanvasPosition();
    
    // Update on resize
    const resizeObserver = new ResizeObserver(() => {
      // Request animation frame to ensure DOM is ready
      requestAnimationFrame(updateCanvasPosition);
    });
    
    resizeObserver.observe(image);
    
    // Cleanup function
    return () => {
      resizeObserver.disconnect();
    };
  }, [imageLoaded]);

  // Add effect to handle viewport meta tag
  useEffect(() => {
    if (isOpen) {
      // Save the current viewport meta tag content
      const viewportMeta = document.querySelector('meta[name="viewport"]');
      const originalContent = viewportMeta?.getAttribute('content');

      // Set viewport meta to prevent scaling/zooming when keyboard appears
      if (viewportMeta) {
        viewportMeta.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover');
      }

      // Prevent scrolling on body
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
      document.body.style.height = '100%';

      return () => {
        // Restore original viewport meta content
        if (viewportMeta && originalContent) {
          viewportMeta.setAttribute('content', originalContent);
        }
        // Restore body scrolling
        document.body.style.overflow = '';
        document.body.style.position = '';
        document.body.style.width = '';
        document.body.style.height = '';
      };
    }
  }, [isOpen]);

  // Helper function to stop event propagation for all touch events
  const stopTouchPropagation = (e: React.TouchEvent) => {
    e.stopPropagation();
  };

  // Helper function for coordinate conversion using the image's displayed bounds
  const getDrawingCoordinates = (clientX: number, clientY: number) => {
    if (!imageRef.current || !originalDimensions || !canvasRef.current) return { x: 0, y: 0 };
    
    // Get the image's displayed dimensions and position
    const imgRect = imageRef.current.getBoundingClientRect();
    
    // Calculate aspect ratios
    const displayRatio = imgRect.width / imgRect.height;
    const originalRatio = originalDimensions.width / originalDimensions.height;
    
    // Calculate the actual displayed image dimensions accounting for letterboxing
    let displayedWidth = imgRect.width;
    let displayedHeight = imgRect.height;
    let offsetX = 0;
    let offsetY = 0;
    
    if (displayRatio > originalRatio) {
      // Image is wider than container
      displayedWidth = imgRect.height * originalRatio;
      offsetX = (imgRect.width - displayedWidth) / 2;
    } else {
      // Image is taller than container
      displayedHeight = imgRect.width / originalRatio;
      offsetY = (imgRect.height - displayedHeight) / 2;
    }
    
    // Calculate the position relative to the actual displayed image area
    const localX = clientX - (imgRect.left + offsetX);
    const localY = clientY - (imgRect.top + offsetY);
    
    // Calculate the scaling factors based on the actual displayed dimensions
    const scaleX = originalDimensions.width / displayedWidth;
    const scaleY = originalDimensions.height / displayedHeight;
    
    // Map the coordinates to the canvas space
    const canvasX = localX * scaleX;
    const canvasY = localY * scaleY;
    
    return { x: canvasX, y: canvasY };
  };

  const updateBrushSettings = (context: CanvasRenderingContext2D) => {
    if (brushMode === BrushMode.PAINT) {
      // Use solid black for the mask - areas to edit
      context.globalCompositeOperation = 'source-over';
      context.strokeStyle = 'black';
      context.fillStyle = 'black';
    } else {
      // Use destination-out to erase (which will reveal the white background)
      context.globalCompositeOperation = 'destination-out';
      context.strokeStyle = 'black';
      context.fillStyle = 'black';
    }
    context.lineWidth = brushSize;
    context.lineCap = 'round';
    context.lineJoin = 'round';
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
      
      const handleImageLoad = () => {
        setImageLoaded(true);
        // Store original dimensions
        setOriginalDimensions({
          width: img.naturalWidth,
          height: img.naturalHeight
        });
        
        const canvas = canvasRef.current;
        if (canvas && ctx) {
          const updateCanvasDimensions = () => {
            // Get the actual displayed image dimensions
            const imgRect = img.getBoundingClientRect();
            const displayRatio = imgRect.width / imgRect.height;
            const originalRatio = img.naturalWidth / img.naturalHeight;
            
            // Set canvas to original image dimensions
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;
            
            // Clear the canvas only on initial load
            if (!imageLoaded) {
              ctx.clearRect(0, 0, canvas.width, canvas.height);
            }
            
            // Update brush settings
            updateBrushSettings(ctx);
          };
          
          // Initial update
          updateCanvasDimensions();
          
          // Add resize observer to handle dimension changes
          const resizeObserver = new ResizeObserver(() => {
            updateCanvasDimensions();
          });
          
          resizeObserver.observe(img);
          
          return () => {
            resizeObserver.disconnect();
          };
        }
      };
      
      // Handle both immediate load and async load cases
      if (img.complete) {
        handleImageLoad();
      } else {
        img.onload = handleImageLoad;
      }
    }
  }, [ctx, imageLoaded]);

  useEffect(() => {
    if (ctx) {
      // Store current composite operation and line width
      const currentComposite = ctx.globalCompositeOperation;
      const currentLineWidth = ctx.lineWidth;
      
      updateBrushSettings(ctx);
      
      // Restore the previous drawing state
      ctx.globalCompositeOperation = currentComposite;
      ctx.lineWidth = currentLineWidth;
    }
  }, [brushMode, brushSize]);

  const getScaledCoordinates = (e: React.MouseEvent<HTMLCanvasElement>) => {
    return getDrawingCoordinates(e.clientX, e.clientY);
  };

  const startDragging = (clientX: number, clientY: number) => {
    if (scale > 1) {
      setIsDragging(true);
      dragStart.current = { x: clientX, y: clientY };
      positionStart.current = { ...position };
    }
  };

  const handleDrag = (clientX: number, clientY: number) => {
    if (isDragging && scale > 1) {
      const deltaX = clientX - dragStart.current.x;
      const deltaY = clientY - dragStart.current.y;
      
      setPosition({
        x: positionStart.current.x + deltaX,
        y: positionStart.current.y + deltaY
      });
    }
  };

  const stopDragging = () => {
    setIsDragging(false);
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    e.stopPropagation();
    if (!ctx || isDragging) return;
    const { x, y } = getScaledCoordinates(e);
    
    ctx.beginPath();
    ctx.arc(x, y, brushSize / 2, 0, Math.PI * 2);
    ctx.fill();
    
    setIsDrawing(true);
    lastPosition.current = { x, y };
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    e.stopPropagation();
    if (!isDrawing || !ctx || isDragging) return;
    
    const { x, y } = getScaledCoordinates(e);
    
    // Get the distance between the current point and the last point
    const dx = x - lastPosition.current.x;
    const dy = y - lastPosition.current.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Calculate how many circles we need to draw to create a smooth line
    const stepSize = brushSize / 4;
    const numSteps = Math.max(1, Math.floor(distance / stepSize));
    
    // Draw circles along the path for a smooth stroke
    for (let i = 0; i <= numSteps; i++) {
      const pointX = lastPosition.current.x + (dx * i) / numSteps;
      const pointY = lastPosition.current.y + (dy * i) / numSteps;
      
      ctx.beginPath();
      ctx.arc(pointX, pointY, brushSize / 2, 0, Math.PI * 2);
      ctx.fill();
    }
    
    lastPosition.current = { x, y };
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

    // Fill with white background (areas to keep)
    maskCtx.fillStyle = 'white';
    maskCtx.fillRect(0, 0, maskCanvas.width, maskCanvas.height);

    // Draw the canvas content directly onto the mask
    maskCtx.drawImage(canvasRef.current, 0, 0);

    // Get the image data to ensure it's a proper binary mask
    const imageData = maskCtx.getImageData(0, 0, maskCanvas.width, maskCanvas.height);
    const data = imageData.data;

    // Ensure the mask is binary - pure black or pure white
    for (let i = 0; i < data.length; i += 4) {
      // If any of the RGB channels are dark (< 128), make it pure black (areas to edit)
      if (data[i] < 128 || data[i + 1] < 128 || data[i + 2] < 128) {
        data[i] = 0;       // R
        data[i + 1] = 0;   // G
        data[i + 2] = 0;   // B
        data[i + 3] = 255; // A (fully opaque)
      } else {
        // Otherwise make it pure white (areas to keep)
        data[i] = 255;     // R
        data[i + 1] = 255; // G
        data[i + 2] = 255; // B
        data[i + 3] = 255; // A (fully opaque)
      }
    }

    // Put the processed image data back
    maskCtx.putImageData(imageData, 0, 0);

    // For debugging - display the mask in the console
    console.log('Mask created with dimensions:', maskCanvas.width, 'x', maskCanvas.height);
    console.log('Mask colors: BLACK = areas to edit, WHITE = areas to keep');
    
    // Convert the canvas to a blob with PNG format to preserve transparency
    return new Promise((resolve) => {
      maskCanvas.toBlob((blob) => {
        resolve(blob!);
      }, 'image/png', 1.0); // Use highest quality
    });
  };

  const handleSendEdit = async () => {
    try {
      if (!jwt) {
        throw new Error('No authentication token found');
      }

      setIsProcessing(true);
      
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

      // Log the dimensions of the original image for debugging
      if (originalDimensions) {
        console.log('Original image dimensions:', originalDimensions.width, 'x', originalDimensions.height);
      }

      // Extract original filename without extension
      const originalFilename = imageUrl.split('/').pop()?.split('.')[0] || 'edited';
      
      // Generate a unique filename with timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const editedFilename = `edited-images/${originalFilename}-${timestamp}.png`;

      // Send edit request to ideogram endpoint
      const editPayload = {
        imageUrl: imageUrl,
        maskUrl: maskUrl,
        prompt: prompt || "Maintain the original image style and composition",
        model: model,
        magic_prompt_option: 'AUTO',
        num_images: 1,
        outputPath: editedFilename
      };

      console.log('Sending edit request with payload:', editPayload);

      const editResponse = await toolsApi.post('/ideogram/edit', editPayload, {
        headers: {
          'Authorization': `Bearer ${jwt}`
        }
      });

      console.log('Edit response:', editResponse.data);
      
      // Set the edited image URL and show it
      setEditedImageUrl(editResponse.data.url);
      setShowOriginal(false);
      
    } catch (error) {
      console.error('Error in edit process:', error);
      if (error instanceof Error) {
        alert(`Failed to process edit: ${error.message}`);
      } else {
        alert('Failed to process edit. Please try again.');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const togglePreviewMask = () => {
    if (!canvasRef.current || !ctx) return;
    setPreviewMask(!previewMask);
  };

  const toggleImage = () => {
    if (editedImageUrl) {
      setShowOriginal(!showOriginal);
    }
  };

  const downloadEditedImage = async () => {
    if (!editedImageUrl) return;

    try {
      // Extract filename from URL
      let filename;
      try {
        const urlObj = new URL(editedImageUrl);
        const segments = urlObj.pathname.split('/');
        const bucketIndex = segments.findIndex(seg => seg === 'sshift-gpt-bucket');
        if (bucketIndex < 0 || bucketIndex === segments.length - 1) {
          throw new Error('Cannot extract filename');
        }
        filename = segments.slice(bucketIndex + 1).join('/');
        console.log('Extracted filename:', filename);
      } catch (err) {
        console.error('Error extracting filename', err);
        filename = 'edited-image.png';
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
      const displayFilename = filename.split('/').pop() || 'edited-image.png';

      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

      if (isMobile) {
        // Try Web Share API first
        if (navigator.canShare && navigator.canShare({ files: [] })) {
          try {
            const file = new File([blob], displayFilename, { type: blob.type });
            await navigator.share({
              files: [file],
              title: 'Edited Image',
              text: 'Here is your edited image',
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
        } catch (err: any) {
          // Check if this is a user abort error (user canceled the save dialog)
          if (err.name === 'AbortError' || err.message.includes('user aborted') || err.message.includes('cancel')) {
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

  // Prevent scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      // Save the current overflow style
      const originalStyle = window.getComputedStyle(document.body).overflow;
      // Prevent scrolling on the body
      document.body.style.overflow = 'hidden';
      
      // Prevent wheel and touchmove events on body but allow in modal
      const preventDefault = (e: Event) => {
        // Only prevent if not inside the modal content that needs scrolling
        if (!(e.target as Element)?.closest('.modal-scroll-content')) {
          e.preventDefault();
        }
      };
      
      window.addEventListener('wheel', preventDefault, { passive: false });
      window.addEventListener('touchmove', preventDefault, { passive: false });
      
      // Restore original styles and remove event listeners when modal closes
      return () => {
        document.body.style.overflow = originalStyle;
        window.removeEventListener('wheel', preventDefault);
        window.removeEventListener('touchmove', preventDefault);
      };
    }
  }, [isOpen]);

  // Add touch event handlers
  const getTouchCoordinates = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!e.touches[0]) return { x: 0, y: 0 };
    return getDrawingCoordinates(e.touches[0].clientX, e.touches[0].clientY);
  };

  const startDrawingTouch = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.stopPropagation();
    if (!ctx || isProcessing || !showOriginal || isDragging) return;
    
    // Store the touch start time
    touchStartTimeRef.current = Date.now();
    isTouchIntentDetermined.current = false;
    
    // Set a timer to start drawing after a short delay
    // This gives time to detect if a second finger is placed down
    touchTimerRef.current = setTimeout(() => {
      if (e.touches.length === 1) {
        const { x, y } = getTouchCoordinates(e);
        
        ctx.beginPath();
        ctx.arc(x, y, brushSize / 2, 0, Math.PI * 2);
        ctx.fill();
        
        setIsDrawing(true);
        lastPosition.current = { x, y };
        isTouchIntentDetermined.current = true;
      }
    }, 50); // 50ms delay to detect multi-touch intent
  };

  const drawTouch = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.stopPropagation();
    
    // Clear the timer if we're moving before the timer fires
    if (touchTimerRef.current) {
      clearTimeout(touchTimerRef.current);
      touchTimerRef.current = null;
    }
    
    // Only draw if we've determined this is a drawing gesture
    if (!isDrawing && !isTouchIntentDetermined.current) {
      // If it's been more than 50ms since touch start and still only one finger, start drawing
      if (Date.now() - touchStartTimeRef.current > 50 && e.touches.length === 1 && ctx) {
        const { x, y } = getTouchCoordinates(e);
        
        ctx.beginPath();
        ctx.arc(x, y, brushSize / 2, 0, Math.PI * 2);
        ctx.fill();
        
        setIsDrawing(true);
        lastPosition.current = { x, y };
        isTouchIntentDetermined.current = true;
      }
      return;
    }
    
    if (!isDrawing || !ctx || isProcessing || !showOriginal || isDragging) return;
    
    const { x, y } = getTouchCoordinates(e);
    
    // Get the distance between the current point and the last point
    const dx = x - lastPosition.current.x;
    const dy = y - lastPosition.current.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    const stepSize = brushSize / 4;
    const numSteps = Math.max(1, Math.floor(distance / stepSize));
    
    for (let i = 0; i <= numSteps; i++) {
      const pointX = lastPosition.current.x + (dx * i) / numSteps;
      const pointY = lastPosition.current.y + (dy * i) / numSteps;
      
      ctx.beginPath();
      ctx.arc(pointX, pointY, brushSize / 2, 0, Math.PI * 2);
      ctx.fill();
    }
    
    lastPosition.current = { x, y };
  };

  const stopDrawingTouch = () => {
    if (touchTimerRef.current) {
      clearTimeout(touchTimerRef.current);
      touchTimerRef.current = null;
    }
    
    setIsDrawing(false);
    isTouchIntentDetermined.current = false;
  };

  // Reset zoom when image changes
  useEffect(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  }, [imageUrl, editedImageUrl, showOriginal]);

  // Handle pinch to zoom
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).tagName === 'CANVAS') {
      if (e.touches.length > 1) {
        // Cancel drawing intent if a second finger is placed
        if (touchTimerRef.current) {
          clearTimeout(touchTimerRef.current);
          touchTimerRef.current = null;
        }
        setIsDrawing(false);
        isTouchIntentDetermined.current = false;
      }
      
      // Let the canvas handle single-touch events
      if (e.touches.length === 1) return;
    }
    
    const now = new Date().getTime();
    const timeSince = now - lastTapRef.current;
    
    if (e.touches.length === 1 && timeSince < 300 && scale !== 1) {
      e.preventDefault();
      e.stopPropagation();
      resetZoom();
    }
    
    lastTapRef.current = now;
    
    if (e.touches.length === 2) {
      e.preventDefault();
      e.stopPropagation();
      
      // Cancel any drawing that might be in progress
      setIsDrawing(false);
      isTouchIntentDetermined.current = false;
      
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const centerX = (touch1.clientX + touch2.clientX) / 2;
      const centerY = (touch1.clientY + touch2.clientY) / 2;
      
      startDragging(centerX, centerY);
      
      setIsPinching(true);
      
      const distance = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
      );
      lastDistance.current = distance;
      lastPosition.current = { x: centerX, y: centerY };
    } else if (e.touches.length === 1 && (e.target as HTMLElement).tagName !== 'CANVAS') {
      startDragging(e.touches[0].clientX, e.touches[0].clientY);
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 2) {
      e.preventDefault();
      e.stopPropagation();
      
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const centerX = (touch1.clientX + touch2.clientX) / 2;
      const centerY = (touch1.clientY + touch2.clientY) / 2;
      
      if (isPinching) {
        const distance = Math.hypot(
          touch2.clientX - touch1.clientX,
          touch2.clientY - touch1.clientY
        );
        
        if (lastDistance.current !== null) {
          const scaleFactor = 0.01;
          const newScale = scale * (1 + scaleFactor * (distance - lastDistance.current) / 10);
          const limitedScale = Math.max(1, Math.min(5, newScale));
          const deltaX = centerX - lastPosition.current.x;
          const deltaY = centerY - lastPosition.current.y;
          
          if (limitedScale !== scale) {
            setScale(limitedScale);
            
            if (imageContainerRef.current) {
              const rect = imageContainerRef.current.getBoundingClientRect();
              const containerCenterX = rect.left + rect.width / 2;
              const containerCenterY = rect.top + rect.height / 2;
              const offsetX = centerX - containerCenterX;
              const offsetY = centerY - containerCenterY;
              
              setPosition(prev => ({
                x: prev.x + deltaX + offsetX * (limitedScale - scale) / limitedScale,
                y: prev.y + deltaY + offsetY * (limitedScale - scale) / limitedScale
              }));
            } else {
              setPosition(prev => ({
                x: prev.x + deltaX,
                y: prev.y + deltaY
              }));
            }
          }
        }
        
        lastDistance.current = Math.hypot(
          touch2.clientX - touch1.clientX,
          touch2.clientY - touch1.clientY
        );
        lastPosition.current = { x: centerX, y: centerY };
      } else if (isDragging) {
        handleDrag(e.touches[0].clientX, e.touches[0].clientY);
      }
    } else if (e.touches.length === 1) {
      if ((e.target as HTMLElement).tagName !== 'CANVAS' && isDragging) {
        handleDrag(e.touches[0].clientX, e.touches[0].clientY);
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (isPinching && e.touches.length < 2) {
      setIsPinching(false);
      lastDistance.current = null;
    }
    
    if (isDragging && e.touches.length === 0) {
      stopDragging();
    }
    
    // If we're on the canvas and all touches are removed, stop drawing
    if ((e.target as HTMLElement).tagName === 'CANVAS' && e.touches.length === 0) {
      stopDrawingTouch();
    }
  };

  const resetZoom = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
    setIsDragging(false);
    setIsPinching(false);
    lastDistance.current = null;
    
    // Update canvas position after zoom reset
    if (imageLoaded && imageRef.current && canvasRef.current) {
      const imgRect = imageRef.current.getBoundingClientRect();
      const canvasStyle = canvasRef.current.style;
      
      // Match the canvas position and dimensions to the image
      canvasStyle.width = `${imgRect.width}px`;
      canvasStyle.height = `${imgRect.height}px`;
    }
  };

  // Add mouse event handlers for dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).tagName === 'CANVAS') return;
    if (scale > 1) {
      e.preventDefault();
      startDragging(e.clientX, e.clientY);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      e.preventDefault();
      handleDrag(e.clientX, e.clientY);
    }
  };

  const handleMouseUp = () => {
    stopDragging();
  };

  // Handle input focus to prevent viewport shifting
  const handleInputFocus = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
    e.currentTarget.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  if (!isOpen) return null;

  return createPortal(
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 999999999,
        touchAction: 'none'
      }}
    >
      <div 
        className="bg-white w-full h-full flex flex-col overflow-hidden text-xs sm:text-base"
        style={{ 
          touchAction: 'none',
          maxHeight: '100vh',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <div className="flex justify-between items-center p-2 sm:p-3 sticky top-0 bg-white z-10 border-b shrink-0">
          <h2 className="text-base sm:text-xl font-semibold">Edit Image</h2>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-gray-500 hidden sm:inline-block">
              Pinch to zoom
            </span>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Mobile zoom hint */}
        <div className="text-[10px] text-gray-500 mb-1 sm:hidden text-center shrink-0">
          Pinch to zoom • Double-tap to reset
        </div>

        <div className="flex-1 min-h-0 flex flex-col">
          <div 
            ref={imageContainerRef}
            className="relative flex-1 overflow-hidden" 
            style={{ minHeight: 0 }}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onTouchCancel={handleTouchEnd}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            {isProcessing && (
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 z-10">
                <div className="bg-white p-2 rounded-lg shadow-lg">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></div>
                    <div className="w-2 h-2 rounded-full bg-blue-600 animate-pulse delay-150"></div>
                    <div className="w-2 h-2 rounded-full bg-blue-600 animate-pulse delay-300"></div>
                    <span className="text-gray-700 text-xs font-medium">Processing...</span>
                  </div>
                </div>
              </div>
            )}
            <div 
              className="relative w-full h-full flex items-center justify-center"
              style={{
                transform: `scale(${scale}) translate(${position.x / scale}px, ${position.y / scale}px)`,
                transformOrigin: 'center',
                transition: isPinching ? 'none' : 'transform 0.1s ease-out',
                willChange: 'transform'
              }}
            >
              <img
                ref={imageRef}
                src={showOriginal ? imageUrl : (editedImageUrl || imageUrl)}
                alt="Edit"
                className="w-full h-full object-contain"
                style={{ 
                  opacity: previewMask ? 0.5 : 1,
                  pointerEvents: 'none'
                }}
              />
              <canvas
                ref={canvasRef}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawingTouch}
                onTouchMove={drawTouch}
                onTouchEnd={stopDrawingTouch}
                onTouchCancel={stopDrawingTouch}
                className="absolute top-0 left-0 w-full h-full touch-none"
                style={{
                  background: 'transparent',
                  pointerEvents: imageLoaded && !isProcessing && !isPinching && scale === 1 ? 'auto' : 'none',
                  cursor: brushMode === BrushMode.PAINT ? 'crosshair' : 'cell',
                  display: showOriginal ? 'block' : 'none',
                  objectFit: 'contain',
                  objectPosition: 'center'
                }}
              />
            </div>
            {scale !== 1 && (
              <button
                onClick={resetZoom}
                className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-md backdrop-blur-sm shadow-md flex items-center gap-1"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                </svg>
                {Math.round(scale * 100)}%
              </button>
            )}
          </div>

          {editedImageUrl && (
            <div className="flex flex-wrap justify-center gap-1 my-1 sm:my-2 shrink-0">
              <button
                onClick={toggleImage}
                className="px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 transition-colors"
              >
                {showOriginal ? 'Show Edited' : 'Show Original'}
              </button>
              {!showOriginal && (
                <button
                  onClick={downloadEditedImage}
                  className="px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm bg-black/40 hover:bg-black/60 backdrop-blur-sm text-white rounded-md transition-colors flex items-center gap-1 sm:gap-2 shadow-md"
                >
                  <Download className="h-3 w-3 sm:h-4 sm:w-4" />
                  Download
                </button>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 gap-2 p-2 sm:p-3 border-t bg-white shrink-0">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Model
                </label>
                <select
                  value={model}
                  onChange={(e) => setModel(e.target.value as ModelType)}
                  onFocus={handleInputFocus}
                  className="w-full border border-gray-300 rounded-md px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                  disabled={isProcessing || !showOriginal}
                >
                  <option value={ModelType.V_2}>V2</option>
                  <option value={ModelType.V_2_TURBO}>V2 Turbo</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Prompt
                </label>
                <input
                  type="text"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onFocus={handleInputFocus}
                  placeholder="Enter prompt..."
                  className="w-full border border-gray-300 rounded-md px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                  disabled={isProcessing || !showOriginal}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-xs font-medium text-gray-700">
                  Brush Size: {brushSize}px
                </label>
                <div className="flex gap-1">
                  <button
                    onClick={() => setBrushMode(BrushMode.PAINT)}
                    className={`p-1 rounded-md flex items-center gap-1 text-xs ${
                      brushMode === BrushMode.PAINT
                        ? 'bg-blue-100 text-blue-600'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                    disabled={isProcessing || !showOriginal}
                    onTouchStart={stopTouchPropagation}
                    onTouchMove={stopTouchPropagation}
                    onTouchEnd={stopTouchPropagation}
                    onTouchCancel={stopTouchPropagation}
                  >
                    <Paintbrush className="h-3 w-3" />
                    Paint
                  </button>
                  <button
                    onClick={() => setBrushMode(BrushMode.ERASE)}
                    className={`p-1 rounded-md flex items-center gap-1 text-xs ${
                      brushMode === BrushMode.ERASE
                        ? 'bg-blue-100 text-blue-600'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                    disabled={isProcessing || !showOriginal}
                    onTouchStart={stopTouchPropagation}
                    onTouchMove={stopTouchPropagation}
                    onTouchEnd={stopTouchPropagation}
                    onTouchCancel={stopTouchPropagation}
                  >
                    <Eraser className="h-3 w-3" />
                    Erase
                  </button>
                </div>
              </div>
              <input
                type="range"
                min="1"
                max="100"
                value={brushSize}
                onChange={(e) => setBrushSize(Number(e.target.value))}
                className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                disabled={isProcessing || !showOriginal}
                onClick={(e) => e.stopPropagation()}
                onTouchStart={stopTouchPropagation}
                onTouchMove={stopTouchPropagation}
                onTouchEnd={stopTouchPropagation}
                onTouchCancel={stopTouchPropagation}
              />
            </div>

            <div className="flex justify-between gap-1 mt-1">
              <button
                onClick={clearMask}
                className="px-2 py-1 text-xs border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                disabled={isProcessing || !showOriginal}
              >
                Clear Mask
              </button>
              <button
                onClick={togglePreviewMask}
                className={`px-2 py-1 text-xs border ${previewMask ? 'bg-blue-100 border-blue-300' : 'border-gray-300'} rounded-md hover:bg-gray-50 transition-colors`}
                disabled={isProcessing || !showOriginal}
              >
                {previewMask ? 'Hide Mask' : 'Preview Mask'}
              </button>
              <button
                onClick={handleSendEdit}
                className="px-2 py-1 text-xs bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                disabled={isProcessing || !showOriginal}
              >
                {isProcessing ? 'Processing...' : 'Send Edit'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.getElementById('root') || document.body
  );
}; 