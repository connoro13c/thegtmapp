import React from 'react';
import { Button } from '../../ui/button';

interface TerritoryHealthProps {
  wizardData: any;
  onNext: (data?: any) => void;
  onBack: () => void;
}

const TerritoryHealth: React.FC<TerritoryHealthProps> = ({ wizardData, onNext, onBack }) => {
  const handleNext = () => {
    // Placeholder: In a real implementation, we would analyze territories
    const territories = []; // Placeholder for territory analysis
    onNext({ territories });
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Territory Health Analysis</h2>
      <p className="mb-6">
        We'll analyze your territory distribution to ensure balanced opportunities across your sales team.
      </p>
      <div className="flex justify-between mt-8">
        <Button 
          onClick={onBack}
          variant="outline"
        >
          Back
        </Button>
        <Button onClick={handleNext}>
          Next: Account Assignment
        </Button>
      </div>
    </div>
  );
};

export default TerritoryHealth;