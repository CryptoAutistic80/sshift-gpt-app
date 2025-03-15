'use client';
import { useState, useEffect } from 'react';
import { LabeledInput } from '../../src/components/ui/labeled-input';
import { Button } from '../../src/components/ui/button';
import { Switch } from '../../src/components/ui/switch';
import { Label } from '../../src/components/ui/label';
import { toast } from '../../src/components/ui/use-toast';
import { useAppManagment } from '../../src/context/AppManagment';

export const FreeTrialConfig = () => {
  const [credits, setCredits] = useState<number>(100);
  const [duration, setDuration] = useState<number>(7);
  const [enabled, setEnabled] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { isAdmin } = useAppManagment();

  // Mock function to simulate fetching current settings
  useEffect(() => {
    // In a real implementation, this would fetch the current settings from the backend
    const fetchSettings = async () => {
      try {
        // Mock data - replace with actual API call
        const mockSettings = {
          credits: 100,
          duration: 7,
          enabled: true
        };
        
        setCredits(mockSettings.credits);
        setDuration(mockSettings.duration);
        setEnabled(mockSettings.enabled);
      } catch (error) {
        console.error('Error fetching free trial settings:', error);
        toast({
          title: 'Error fetching settings',
          description: 'Could not load free trial settings',
          variant: 'destructive',
        });
      }
    };

    fetchSettings();
  }, []);

  const handleSaveSettings = async () => {
    if (!isAdmin) return;
    
    setIsLoading(true);
    try {
      // Mock API call - replace with actual implementation
      // await api.updateFreeTrialSettings({ credits, duration, enabled });
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      toast({
        title: 'Settings Updated',
        description: 'Free trial settings have been updated successfully',
        variant: 'default',
      });
    } catch (error) {
      console.error('Error updating free trial settings:', error);
      toast({
        title: 'Error',
        description: 'Could not update free trial settings',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <LabeledInput
          id="free-trial-credits"
          label="Available Credits"
          tooltip="Number of credits available for free trial accounts"
          required={true}
          value={credits}
          onChange={(e) => setCredits(Number(e.target.value))}
          type="number"
          min={1}
        />
        
        <LabeledInput
          id="free-trial-duration"
          label="Trial Duration (days)"
          tooltip="Duration of the free trial in days"
          required={true}
          value={duration}
          onChange={(e) => setDuration(Number(e.target.value))}
          type="number"
          min={1}
        />
        
        <div className="flex items-center space-x-2">
          <Switch 
            id="free-trial-enabled"
            checked={enabled}
            onCheckedChange={setEnabled}
          />
          <Label htmlFor="free-trial-enabled">Enable Free Trial Accounts</Label>
        </div>
      </div>
      
      <Button
        className="w-full"
        variant="green"
        onClick={handleSaveSettings}
        disabled={isLoading}
      >
        {isLoading ? 'Saving...' : 'Save Settings'}
      </Button>
    </div>
  );
}; 