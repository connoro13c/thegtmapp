import { useState } from 'react';
import AccountScoring from '../components/FreeTrialWizard/steps/AccountScoring';

const Test = () => {
  const [wizardData, setWizardData] = useState({
    scoredAccounts: []
  });

  const handleNext = (data?: Record<string, unknown>) => {
    console.log('Next clicked with data:', data);
    setWizardData(prev => ({ ...prev, ...data }));
  };

  const handleBack = () => {
    console.log('Back clicked');
  };

  return (
    <div className="min-h-screen bg-background-offset">
      <div className="container mx-auto px-4 py-10">
        <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="p-8">
            <h1 className="text-3xl font-bold mb-6">Account Scoring Test Page</h1>
            <p className="mb-6">
              This page allows you to test the Account Scoring component directly.
              Upload a CSV file to score accounts based on your ideal customer profile.
            </p>
            
            <AccountScoring 
              wizardData={wizardData} 
              onNext={handleNext} 
              onBack={handleBack} 
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Test;
