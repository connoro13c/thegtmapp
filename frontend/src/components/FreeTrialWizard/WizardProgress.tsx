import React from 'react';

interface Step {
  id: string;
  label: string;
}

interface WizardProgressProps {
  steps: Step[];
  currentStep: number;
  onStepClick?: (index: number) => void;
}

const WizardProgress: React.FC<WizardProgressProps> = ({ 
  steps, 
  currentStep, 
  onStepClick 
}) => {
  return (
    <div className="bg-gray-50 border-b">
      <div className="px-8 py-4 flex items-center overflow-x-auto">
        {steps.map((step, index) => {
          // Determine step status
          const isCompleted = index < currentStep;
          const isCurrent = index === currentStep;
          const isClickable = isCompleted && onStepClick;
          
          return (
            <React.Fragment key={step.id}>
              {/* Step indicator */}
              <div className="flex items-center">
                <button
                  disabled={!isClickable}
                  onClick={isClickable ? () => onStepClick(index) : undefined}
                  className={`
                    w-8 h-8 rounded-full flex items-center justify-center 
                    ${isCompleted ? 'bg-primary text-white' : ''}
                    ${isCurrent ? 'bg-primary-light border-2 border-primary text-primary font-bold' : ''}
                    ${!isCompleted && !isCurrent ? 'bg-gray-200 text-gray-500' : ''}
                    ${isClickable ? 'cursor-pointer hover:opacity-80' : ''}
                  `}
                >
                  {isCompleted ? '✓' : index + 1}
                </button>
                <span 
                  className={`
                    ml-2 text-sm font-medium whitespace-nowrap
                    ${isCurrent ? 'text-primary font-semibold' : ''}
                    ${isCompleted ? 'text-gray-700' : 'text-gray-500'}
                  `}
                >
                  {step.label}
                </span>
              </div>
              
              {/* Connector line */}
              {index < steps.length - 1 && (
                <div 
                  className={`
                    h-0.5 w-8 mx-2
                    ${index < currentStep ? 'bg-primary' : 'bg-gray-300'}
                  `}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

export default WizardProgress;