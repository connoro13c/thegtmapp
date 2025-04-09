import React from 'react';
import { Button } from '../../ui/button';

interface AccountAssignmentProps {
  wizardData: any;
  onNext: (data?: any) => void;
  onBack: () => void;
}

const AccountAssignment: React.FC<AccountAssignmentProps> = ({ wizardData, onNext, onBack }) => {
  const handleNext = () => {
    // Placeholder: In a real implementation, we would assign accounts to territories
    const assignments = []; // Placeholder for account assignments
    onNext({ assignments });
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Account Assignment</h2>
      <p className="mb-6">
        Optimize how accounts are assigned to territories based on fit, coverage, and workload balance.
      </p>
      <div className="flex justify-between mt-8">
        <Button 
          onClick={onBack}
          variant="outline"
        >
          Back
        </Button>
        <Button onClick={handleNext}>
          Next: Fit Coverage Metrics
        </Button>
      </div>
    </div>
  );
};

export default AccountAssignment;