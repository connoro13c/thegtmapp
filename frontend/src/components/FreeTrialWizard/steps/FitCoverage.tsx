import React from 'react';
import { Button } from '../../ui/button';

interface FitCoverageProps {
  wizardData: any;
  onNext: (data?: any) => void;
  onBack: () => void;
}

const FitCoverage: React.FC<FitCoverageProps> = ({ wizardData, onNext, onBack }) => {
  const handleNext = () => {
    // Placeholder: In a real implementation, we would generate metrics
    const metrics = {
      fitScore: 72,
      coverageScore: 65,
      balanceScore: 80,
      overallScore: 74
    };
    onNext({ metrics });
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Fit & Coverage Metrics</h2>
      <p className="mb-6">
        Review key metrics about your GTM optimization and see potential for improvement.
      </p>
      <div className="flex justify-between mt-8">
        <Button 
          onClick={onBack}
          variant="outline"
        >
          Back
        </Button>
        <Button onClick={handleNext}>
          Complete Trial
        </Button>
      </div>
    </div>
  );
};

export default FitCoverage;