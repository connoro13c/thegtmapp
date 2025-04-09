import React from 'react';
import { Button } from '../../ui/button';

interface SegmentationGeneratorProps {
  wizardData: any;
  onNext: (data?: any) => void;
  onBack: () => void;
}

const SegmentationGenerator: React.FC<SegmentationGeneratorProps> = ({ wizardData, onNext, onBack }) => {
  const handleNext = () => {
    // Placeholder: In a real implementation, we would generate segments
    const segments = []; // Placeholder for segments
    onNext({ segments });
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Account Segmentation</h2>
      <p className="mb-6">
        We'll help you organize your accounts into meaningful segments based on score and attributes.
      </p>
      <div className="flex justify-between mt-8">
        <Button 
          onClick={onBack}
          variant="outline"
        >
          Back
        </Button>
        <Button onClick={handleNext}>
          Next: Territory Health
        </Button>
      </div>
    </div>
  );
};

export default SegmentationGenerator;