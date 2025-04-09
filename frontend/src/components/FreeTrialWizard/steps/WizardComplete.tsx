import React from 'react';
import { Button } from '../../ui/button';

interface WizardCompleteProps {
  wizardData: any;
  onComplete: () => void;
  onBack: () => void;
}

const WizardComplete: React.FC<WizardCompleteProps> = ({ wizardData, onComplete, onBack }) => {
  const handleConversion = async () => {
    try {
      // Update trial status to converted
      if (wizardData.trialId) {
        await fetch(`/api/trials/${wizardData.trialId}/convert`, {
          method: 'POST',
        });
      }
      
      // Redirect to dashboard
      onComplete();
    } catch (error) {
      console.error('Error converting trial:', error);
      // Still complete even if API fails
      onComplete();
    }
  };

  return (
    <div className="text-center">
      <h2 className="text-2xl font-bold mb-4">Trial Complete!</h2>
      <p className="mb-6">
        Congratulations on completing your GTM optimization trial. Here's a summary of what we've accomplished:
      </p>
      
      <div className="bg-gray-50 p-6 rounded-lg mb-8">
        <ul className="text-left space-y-2">
          <li>✅ Defined your Ideal Customer Profile</li>
          <li>✅ Scored your accounts based on ICP fit</li>
          <li>✅ Generated meaningful account segments</li>
          <li>✅ Analyzed territory health and distribution</li>
          <li>✅ Optimized account assignments</li>
          <li>✅ Generated fit & coverage metrics</li>
        </ul>
      </div>
      
      <div className="mb-8">
        <h3 className="text-xl font-semibold mb-2">Ready to unlock the full potential?</h3>
        <p>Convert your trial to a full subscription to access advanced features and ongoing optimization.</p>
      </div>
      
      <div className="flex flex-col md:flex-row justify-center space-y-4 md:space-y-0 md:space-x-4">
        <Button 
          onClick={onBack}
          variant="outline"
        >
          Back
        </Button>
        <Button 
          onClick={handleConversion}
          className="bg-green-600 hover:bg-green-700"
        >
          Convert to Full Access
        </Button>
        <Button 
          onClick={onComplete}
          variant="ghost"
        >
          Go to Dashboard
        </Button>
      </div>
    </div>
  );
};

export default WizardComplete;