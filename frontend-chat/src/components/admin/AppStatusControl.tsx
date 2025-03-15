import React, { useState } from 'react';
import { Button } from '../ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../ui/alert-dialog';
import { useAppManagment } from '../../context/AppManagment';
import { toast } from '../ui/use-toast';

const AppStatusControl = () => {
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<'stop' | 'resume' | null>(null);
  const { isAdmin, isReviewer, isAppRunning, setAppRunning } = useAppManagment();

  const handleToggleClick = (action: 'stop' | 'resume') => {
    setPendingAction(action);
    setIsConfirmDialogOpen(true);
  };

  const handleConfirm = async () => {
    try {
      // In a real implementation, this would call an API to update the status
      // const response = await fetch('/api/app-status', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ isRunning: pendingAction === 'resume' }),
      // });
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Update app status in context
      setAppRunning(pendingAction === 'resume');
      
      toast({
        title: 'Success',
        description: `App has been ${pendingAction === 'stop' ? 'stopped' : 'resumed'} successfully`,
        variant: 'default',
      });
    } catch (error) {
      console.error(`Failed to ${pendingAction} app:`, error);
      toast({
        title: 'Error',
        description: `Failed to ${pendingAction} app`,
        variant: 'destructive',
      });
    } finally {
      setIsConfirmDialogOpen(false);
      setPendingAction(null);
    }
  };

  const handleCancel = () => {
    setIsConfirmDialogOpen(false);
    setPendingAction(null);
  };

  // Only render if user is admin or reviewer
  if (!isAdmin && !isReviewer) return null;

  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="flex items-center space-x-4">
        <div className={`h-3 w-3 rounded-full ${isAppRunning ? 'bg-green-500' : 'bg-red-500'}`}></div>
        <span className="font-medium">
          App Status: {isAppRunning ? 'Running' : 'Stopped'}
        </span>
      </div>
      
      <Button
        variant={isAppRunning ? "destructive" : "green"}
        onClick={() => handleToggleClick(isAppRunning ? 'stop' : 'resume')}
        className="w-full"
      >
        {isAppRunning ? 'Stop App' : 'Resume App'}
      </Button>

      <AlertDialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pendingAction === 'stop' ? 'Stop App?' : 'Resume App?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pendingAction === 'stop' 
                ? 'This will stop all app operations. Users will not be able to use the app until it is resumed.'
                : 'This will resume all app operations. Users will be able to use the app again.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancel}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirm}
              className={pendingAction === 'stop' ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}
            >
              {pendingAction === 'stop' ? 'Stop' : 'Resume'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AppStatusControl; 