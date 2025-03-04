import { Button } from './button';
import { StopCircle } from 'lucide-react';

interface StopButtonProps {
  onStop: () => void;
}

export function StopButton({ onStop }: StopButtonProps) {
  const handleStopClick = async () => {
    try {
      const response = await fetch('/api/chat', {
        method: 'DELETE',
      });
      if (response.ok) {
        onStop();
      } else {
        console.error('Failed to stop the stream:', response.statusText);
      }
    } catch (error) {
      console.error('Error stopping the stream:', error);
    }
  };

  return (
    <Button
      variant="outline"
      size="icon-sm"
      onClick={handleStopClick}
      className="bg-red-50 border-red-100 hover:bg-red-100 hover:border-red-200 transition-colors"
    >
      <StopCircle className="h-3.5 w-3.5 md:h-4 md:w-4 text-red-600" />
    </Button>
  );
}
