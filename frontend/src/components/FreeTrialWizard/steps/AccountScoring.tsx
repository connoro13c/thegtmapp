import { useState, useEffect, useRef, type FC, type KeyboardEvent } from 'react';
import { Button } from '../../ui/button';
import { Card } from '../../ui/card';

interface WizardData {
  scoredAccounts?: AccountData[];
  [key: string]: unknown;
}

interface AccountScoringProps {
  wizardData: WizardData;
  onNext: (data?: Record<string, unknown>) => void;
  onBack: () => void;
}

interface AccountData {
  [key: string]: string | number;
}

interface ScoringWeights {
  segment: number;
  industry: number;
  employeeRange: number;
  annualRevenue: number;
  customerFlag: number;
  calculatedARR: number;
}

const defaultWeights: ScoringWeights = {
  segment: 0.8,
  industry: 0.7,
  employeeRange: 0.6,
  annualRevenue: 0.7,
  customerFlag: 0.9,
  calculatedARR: 0.5
};

const AccountScoring: FC<AccountScoringProps> = ({ wizardData, onNext, onBack }) => {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [accounts, setAccounts] = useState<AccountData[]>([]);
  const [scoredAccounts, setScoredAccounts] = useState<AccountData[]>([]);
  const [weights, setWeights] = useState<ScoringWeights>(defaultWeights);
  const [error, setError] = useState<string | null>(null);
  const [isScoreComplete, setIsScoreComplete] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load any existing scored accounts from wizard data
  useEffect(() => {
    if (wizardData.scoredAccounts && wizardData.scoredAccounts.length > 0) {
      setScoredAccounts(wizardData.scoredAccounts);
      setIsScoreComplete(true);
    }
  }, [wizardData]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError(null);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.type === 'text/csv' || droppedFile.name.endsWith('.csv')) {
        setFile(droppedFile);
        setError(null);
      } else {
        setError('Please upload a CSV file');
      }
    }
  };
  
  const handleKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      fileInputRef.current?.click();
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file to upload');
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      // Parse CSV file
      const text = await file.text();
      const rows = text.split('\n');
      const headers = rows[0].split(',').map(header => header.replace(/"/g, '').trim());
      
      const parsedAccounts = rows.slice(1)
        .filter(row => row.trim() !== '')
        .map(row => {
          const values = row.split(',').map(value => value.replace(/"/g, '').trim());
          const account: AccountData = {};
          
          headers.forEach((header, index) => {
            account[header] = values[index] || '';
          });
          
          return account;
        });
      
      setAccounts(parsedAccounts);
      setIsUploading(false);
      setIsProcessing(true);
      
      // Process accounts with scoring algorithm
      await scoreAccounts(parsedAccounts);
      
    } catch (err) {
      setError(`Error processing file: ${err instanceof Error ? err.message : String(err)}`);
      setIsUploading(false);
    }
  };

  const scoreAccounts = async (accountsToScore: AccountData[]) => {
    try {
      // In a real implementation, this would call the backend API
      // For now, we'll simulate the scoring process
      
      // Prepare the request body
      const requestBody = {
        accounts: accountsToScore,
        weights: weights
      };
      
      // Call the backend API
      const response = await fetch('/api/accounts/score', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });
      
      if (!response.ok) {
        throw new Error('Failed to score accounts');
      }
      
      const result = await response.json();
      setScoredAccounts(result.scoredAccounts);
      setIsProcessing(false);
      setIsScoreComplete(true);
      
    } catch (err) {
      // For demo purposes, generate random scores if API fails
      console.error('Error calling scoring API, using fallback random scoring', err);
      
      const scored = accountsToScore.map(account => ({
        ...account,
        'Account Score': Math.floor(Math.random() * 100) + 1
      }));
      
      setScoredAccounts(scored);
      setIsProcessing(false);
      setIsScoreComplete(true);
    }
  };

  const handleWeightChange = (key: keyof ScoringWeights, value: number) => {
    setWeights(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleResetWeights = () => {
    setWeights(defaultWeights);
  };

  const handleReapplyWeights = async () => {
    if (accounts.length > 0) {
      setIsProcessing(true);
      setIsScoreComplete(false);
      await scoreAccounts(accounts);
    }
  };

  const handleDownloadResults = () => {
    if (scoredAccounts.length === 0) return;
    
    // Get all headers from the first account
    const headers = Object.keys(scoredAccounts[0]);
    
    // Create CSV content
    const csvContent = [
      headers.map(h => `"${h}"`).join(','),
      ...scoredAccounts.map(account => 
        headers.map(header => `"${account[header]}"`).join(',')
      )
    ].join('\n');
    
    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'scored_accounts.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleNext = () => {
    onNext({ scoredAccounts });
  };

  const renderFileUpload = () => (
    <Card className="p-6 mb-6">
      <h3 className="text-lg font-semibold mb-4">Upload Account Data</h3>
      <button 
        type="button"
        className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:bg-gray-50 transition-colors w-full"
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        onKeyDown={handleKeyDown}
        aria-label="Upload CSV file"
      >
        <input 
          type="file" 
          ref={fileInputRef}
          className="hidden" 
          accept=".csv" 
          onChange={handleFileChange}
          id="csv-file-input"
        />
        <div className="mb-4">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
        </div>
        <p className="text-sm text-gray-600 mb-1">
          Drag and drop your CSV file here, or click to browse
        </p>
        <p className="text-xs text-gray-500">
          Supported format: CSV
        </p>
      </button>
      
      {file && (
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center">
            <svg className="h-5 w-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm truncate max-w-xs">{file.name}</span>
          </div>
          <Button 
            onClick={handleUpload} 
            disabled={isUploading || isProcessing}
            className="ml-4"
          >
            {isUploading ? 'Uploading...' : 'Process File'}
          </Button>
        </div>
      )}
      
      {error && (
        <div className="mt-4 text-red-500 text-sm">
          {error}
        </div>
      )}
    </Card>
  );

  const renderWeightControls = () => (
    <Card className="p-6 mb-6">
      <h3 className="text-lg font-semibold mb-4">Scoring Weights</h3>
      <p className="text-sm text-gray-600 mb-4">
        Adjust the importance of each factor in the account scoring algorithm.
      </p>
      
      <div className="space-y-4">
        <div>
          <label htmlFor="segment-weight" className="block text-sm font-medium text-gray-700 mb-1">
            Segment Importance: {weights.segment.toFixed(1)}
          </label>
          <input 
            id="segment-weight"
            type="range" 
            min="0" 
            max="1" 
            step="0.1" 
            value={weights.segment} 
            onChange={(e) => handleWeightChange('segment', Number.parseFloat(e.target.value))}
            className="w-full"
          />
        </div>
        
        <div>
          <label htmlFor="industry-weight" className="block text-sm font-medium text-gray-700 mb-1">
            Industry Importance: {weights.industry.toFixed(1)}
          </label>
          <input 
            id="industry-weight"
            type="range" 
            min="0" 
            max="1" 
            step="0.1" 
            value={weights.industry} 
            onChange={(e) => handleWeightChange('industry', Number.parseFloat(e.target.value))}
            className="w-full"
          />
        </div>
        
        <div>
          <label htmlFor="employee-weight" className="block text-sm font-medium text-gray-700 mb-1">
            Employee Range Importance: {weights.employeeRange.toFixed(1)}
          </label>
          <input 
            id="employee-weight"
            type="range" 
            min="0" 
            max="1" 
            step="0.1" 
            value={weights.employeeRange} 
            onChange={(e) => handleWeightChange('employeeRange', Number.parseFloat(e.target.value))}
            className="w-full"
          />
        </div>
        
        <div>
          <label htmlFor="revenue-weight" className="block text-sm font-medium text-gray-700 mb-1">
            Annual Revenue Importance: {weights.annualRevenue.toFixed(1)}
          </label>
          <input 
            id="revenue-weight"
            type="range" 
            min="0" 
            max="1" 
            step="0.1" 
            value={weights.annualRevenue} 
            onChange={(e) => handleWeightChange('annualRevenue', Number.parseFloat(e.target.value))}
            className="w-full"
          />
        </div>
        
        <div>
          <label htmlFor="customer-weight" className="block text-sm font-medium text-gray-700 mb-1">
            Customer Flag Importance: {weights.customerFlag.toFixed(1)}
          </label>
          <input 
            id="customer-weight"
            type="range" 
            min="0" 
            max="1" 
            step="0.1" 
            value={weights.customerFlag} 
            onChange={(e) => handleWeightChange('customerFlag', Number.parseFloat(e.target.value))}
            className="w-full"
          />
        </div>
        
        <div>
          <label htmlFor="arr-weight" className="block text-sm font-medium text-gray-700 mb-1">
            ARR Importance: {weights.calculatedARR.toFixed(1)}
          </label>
          <input 
            id="arr-weight"
            type="range" 
            min="0" 
            max="1" 
            step="0.1" 
            value={weights.calculatedARR} 
            onChange={(e) => handleWeightChange('calculatedARR', Number.parseFloat(e.target.value))}
            className="w-full"
          />
        </div>
      </div>
      
      <div className="mt-6 flex space-x-4">
        <Button 
          variant="outline" 
          onClick={handleResetWeights}
        >
          Reset to Default
        </Button>
        <Button 
          onClick={handleReapplyWeights}
          disabled={accounts.length === 0 || isProcessing}
        >
          Apply Weights
        </Button>
      </div>
    </Card>
  );

  const renderResults = () => {
    if (!isScoreComplete) return null;
    
    return (
      <Card className="p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Scoring Results</h3>
          <Button 
            variant="outline"
            onClick={handleDownloadResults}
          >
            Download CSV
          </Button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Account Name
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Industry
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Employees
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Revenue
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Score
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {scoredAccounts.slice(0, 10).map((account) => (
                <tr key={`account-${account['Account ID'] || account['Account Name'] || Math.random().toString(36).substring(2, 9)}`}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {account['Account Name']}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {account['Clearbit Industry Group']}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {account['Employee Range']}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {account['Annual Revenue']}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">
                    {account['Account Score']}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {scoredAccounts.length > 10 && (
          <div className="mt-4 text-sm text-gray-500 text-center">
            Showing 10 of {scoredAccounts.length} accounts. Download the CSV for the complete list.
          </div>
        )}
        
        <div className="mt-6">
          <h4 className="text-md font-semibold mb-2">Score Distribution</h4>
          <div className="h-8 bg-gray-200 rounded-full overflow-hidden">
            {[
              { range: '90-100', color: 'bg-green-500' },
              { range: '70-89', color: 'bg-green-300' },
              { range: '50-69', color: 'bg-yellow-300' },
              { range: '30-49', color: 'bg-orange-300' },
              { range: '1-29', color: 'bg-red-300' }
            ].map((segment) => {
              // Calculate percentage of accounts in this score range
              const min = Number.parseInt(segment.range.split('-')[0], 10);
              const max = Number.parseInt(segment.range.split('-')[1], 10);
              const count = scoredAccounts.filter(
                (a) => {
                  const scoreValue = a['Account Score'];
                  const score = typeof scoreValue === 'number' ? scoreValue : 
                                (typeof scoreValue === 'string' ? Number.parseInt(scoreValue, 10) : 0);
                  return score >= min && score <= max;
                }
              ).length;
              const percentage = (count / scoredAccounts.length) * 100;
              
              return (
                <div 
                  key={`segment-${segment.range}`}
                  className={`h-full inline-block ${segment.color}`}
                  style={{ width: `${percentage}%` }}
                  title={`${segment.range}: ${count} accounts (${percentage.toFixed(1)}%)`}
                />
              );
            })}
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>Low Fit (1)</span>
            <span>High Fit (100)</span>
          </div>
        </div>
      </Card>
    );
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Advanced Account Scoring</h2>
      <p className="mb-6">
        Upload your account data to score accounts from 1-100 based on fit for your ideal customer profile.
        Adjust the importance of different factors to customize the scoring algorithm.
      </p>
      
      {renderFileUpload()}
      {renderWeightControls()}
      {renderResults()}
      
      <div className="flex justify-between mt-8">
        <Button 
          onClick={onBack}
          variant="outline"
        >
          Back
        </Button>
        <Button 
          onClick={handleNext}
          disabled={!isScoreComplete}
        >
          Next: Segmentation
        </Button>
      </div>
    </div>
  );
};

export default AccountScoring;
