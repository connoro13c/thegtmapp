import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// Import step components
import EntryPoint from './steps/EntryPoint';
import ICPDefinition from './steps/ICPDefinition';
import AccountScoring from './steps/AccountScoring';
import SegmentationGenerator from './steps/SegmentationGenerator';
import TerritoryHealth from './steps/TerritoryHealth';
import AccountAssignment from './steps/AccountAssignment';
import FitCoverage from './steps/FitCoverage';
import WizardComplete from './steps/WizardComplete';

// Step progress indicator
import WizardProgress from './WizardProgress';

const WizardContainer: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);
  const [wizardData, setWizardData] = useState<any>({
    icpPath: null,
    icpDefinition: {},
    accounts: [],
    scoredAccounts: [],
    segments: [],
    territories: [],
    assignments: [],
    metrics: {}
  });

  // List of all steps in the wizard
  const steps = [
    { id: 'entry', label: 'Get Started' },
    { id: 'icp', label: 'ICP Definition' },
    { id: 'scoring', label: 'Account Scoring' },
    { id: 'segmentation', label: 'Segmentation' },
    { id: 'territory', label: 'Territory Health' },
    { id: 'assignment', label: 'Account Assignment' },
    { id: 'metrics', label: 'Fit Coverage Metrics' },
    { id: 'complete', label: 'Complete' }
  ];

  // Try to load existing trial data on component mount
  useEffect(() => {
    const loadExistingTrial = async () => {
      setLoading(true);
      try {
        // First check for trialId in localStorage
        const storedTrialId = localStorage.getItem('trialId');
        const userId = localStorage.getItem('userId');
        
        if (!storedTrialId && !userId) {
          // No existing trial found, show entry point
          setLoading(false);
          return;
        }
        
        let trialId = storedTrialId;
        
        // If we have userId but no trialId, try to find an active trial
        if (!trialId && userId) {
          try {
            const userTrialResponse = await fetch(`/api/trials/user/${userId}`);
            if (userTrialResponse.ok) {
              const userTrialData = await userTrialResponse.json();
              trialId = userTrialData.id;
              localStorage.setItem('trialId', trialId);
            }
          } catch (error) {
            console.error('Error fetching user trial:', error);
          }
        }
        
        if (!trialId) {
          setLoading(false);
          return;
        }
        
        // Fetch trial data if we have a trialId
        const response = await fetch(`/api/trials/${trialId}`);
        if (!response.ok) {
          throw new Error('Failed to load trial data');
        }
        
        const trialData = await response.json();
        
        // Update wizard state with trial data
        const newWizardData = {
          ...wizardData,
          trialId: trialData.id,
          icpDefinition: trialData.icpDefinition || {},
          accounts: trialData.accountsData?.accounts || [],
          scoredAccounts: trialData.accountsData?.scoredAccounts || [],
          segments: trialData.segmentsData?.segments || [],
          territories: trialData.territoriesData?.territories || [],
          assignments: trialData.territoriesData?.assignments || [],
          metrics: trialData.metricsData || {}
        };
        
        setWizardData(newWizardData);
        
        // Set the current step if it was saved
        if (typeof trialData.currentStep === 'number') {
          setCurrentStep(trialData.currentStep);
        }
      } catch (error) {
        console.error('Error loading trial data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadExistingTrial();
  }, []);

  // Save the current trial state to the backend
  const saveTrialState = async (updatedData: any, step: number) => {
    try {
      const { trialId } = updatedData;
      
      if (!trialId) {
        console.error('No trial ID to save state');
        return;
      }
      
      // Organize data for backend
      const stateData = {
        currentStep: step,
        icpDefinition: updatedData.icpDefinition,
        accountsData: {
          accounts: updatedData.accounts || [],
          scoredAccounts: updatedData.scoredAccounts || []
        },
        segmentsData: {
          segments: updatedData.segments || []
        },
        territoriesData: {
          territories: updatedData.territories || [],
          assignments: updatedData.assignments || []
        },
        metricsData: updatedData.metrics || {}
      };
      
      // Save to backend
      await fetch(`/api/trials/${trialId}/state`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(stateData)
      });
      
    } catch (error) {
      console.error('Error saving trial state:', error);
    }
  };

  // Handle advancing to next step
  const nextStep = (stepData: any = {}) => {
    // Update data from current step
    const updatedData = { ...wizardData, ...stepData };
    setWizardData(updatedData);
    
    // Move to next step
    const nextStepIndex = currentStep < steps.length - 1 ? currentStep + 1 : currentStep;
    setCurrentStep(nextStepIndex);
    
    // Save to backend
    saveTrialState(updatedData, nextStepIndex);
  };

  // Handle going back to previous step
  const prevStep = () => {
    if (currentStep > 0) {
      const prevStepIndex = currentStep - 1;
      setCurrentStep(prevStepIndex);
      
      // Save current step to backend
      saveTrialState(wizardData, prevStepIndex);
    }
  };

  // Handle skipping to a specific step
  const goToStep = (index: number) => {
    if (index >= 0 && index < steps.length) {
      setCurrentStep(index);
      
      // Save current step to backend
      saveTrialState(wizardData, index);
    }
  };

  // Finish wizard and navigate to dashboard
  const completeWizard = async () => {
    // Final save of wizard data
    await saveTrialState(wizardData, steps.length - 1);
    
    // Navigate to dashboard
    navigate('/dashboard');
  };

  // Render the current step
  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return <EntryPoint wizardData={wizardData} onNext={nextStep} />;
      case 1:
        return <ICPDefinition wizardData={wizardData} onNext={nextStep} onBack={prevStep} />;
      case 2:
        return <AccountScoring wizardData={wizardData} onNext={nextStep} onBack={prevStep} />;
      case 3:
        return <SegmentationGenerator wizardData={wizardData} onNext={nextStep} onBack={prevStep} />;
      case 4:
        return <TerritoryHealth wizardData={wizardData} onNext={nextStep} onBack={prevStep} />;
      case 5:
        return <AccountAssignment wizardData={wizardData} onNext={nextStep} onBack={prevStep} />;
      case 6:
        return <FitCoverage wizardData={wizardData} onNext={nextStep} onBack={prevStep} />;
      case 7:
        return <WizardComplete wizardData={wizardData} onComplete={completeWizard} onBack={prevStep} />;
      default:
        return <EntryPoint wizardData={wizardData} onNext={nextStep} />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background-offset flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p>Loading trial data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background-offset">
      <div className="container mx-auto px-4 py-10">
        <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
          {/* Progress indicator */}
          <WizardProgress steps={steps} currentStep={currentStep} onStepClick={goToStep} />
          
          {/* Step content */}
          <div className="p-8">
            {renderStep()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WizardContainer;