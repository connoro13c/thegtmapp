import React from 'react';
import { Button } from '../../ui/button';

interface AccountScoringProps {
  wizardData: any;
  onNext: (data?: any) => void;
  onBack: () => void;
}

const AccountScoring: React.FC<AccountScoringProps> = ({ wizardData, onNext, onBack }) => {
  const handleNext = () => {
    // Placeholder: In a real implementation, we would score accounts based on ICP match
    const scoredAccounts = []; // Placeholder for scored accounts
    onNext({ scoredAccounts });
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Account Scoring</h2>
      <p className="mb-6">
        Based on your ICP definition, we'll score your accounts to identify the best-fit opportunities.
      </p>
      <div className="flex justify-between mt-8">
        <Button 
          onClick={onBack}
          variant="outline"
        >
          Back
        </Button>
        <Button onClick={handleNext}>
          Next: Segmentation
        </Button>
      </div>
    </div>
  );
};

export default AccountScoring;