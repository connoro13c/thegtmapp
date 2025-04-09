import React from 'react';
import { Button } from '../../ui/button';

interface EntryPointProps {
  wizardData: any;
  onNext: (data?: any) => void;
}

const EntryPoint: React.FC<EntryPointProps> = ({ wizardData, onNext }) => {
  // Function to handle beginning the trial process
  const beginTrial = async () => {
    try {
      // Make API call to start the trial
      const response = await fetch('/api/trials/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: localStorage.getItem('userId') || undefined,
          timestamp: new Date().toISOString()
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to start trial');
      }

      const data = await response.json();
      
      // Store the trial ID in localStorage for persistence
      localStorage.setItem('trialId', data.trialId);
      
      // Move to the next step with the trial data
      onNext({ trialId: data.trialId });
    } catch (error) {
      console.error('Error starting trial:', error);
      // Still advance to next step even if API fails
      onNext();
    }
  };

  return (
    <div className="text-center">
      <h2 className="text-2xl font-bold mb-4">Welcome to Your Free Trial</h2>
      <p className="mb-6">
        Get started with your GTM optimization journey. During this trial, we'll guide you 
        through setting up your ICP, scoring accounts, creating segments, 
        and optimizing your territory assignments.
      </p>
      <div className="flex flex-col space-y-4 items-center">
        <Button 
          onClick={beginTrial}
          className="px-8 py-3 text-lg"
        >
          Begin Your Trial
        </Button>
        <p className="text-sm text-gray-500">
          By starting, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
};

export default EntryPoint;