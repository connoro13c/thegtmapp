// React is imported automatically with the JSX transform in modern React
import { useState, useEffect } from 'react';
import { Button } from '../../ui/button';
import { Brain, ClipboardList, BarChart3 } from 'lucide-react';
import { generateIcpInspiration } from '../../DirectOpenAI';

interface ICPData {
  industries: string[];
  employee_range: [number, number];
  revenue_range: [number, number];
  regions: string[];
  tech_stack: string[];
  business_models: string[];
  use_cases: string[];
  buyer_personas: string[];
  other_commonalities: string[];
  bad_fit_signals: string[];
}

interface ICPDefinitionProps {
  wizardData: {
    trialId?: string;
    icpDefinition?: Partial<ICPData>;
    [key: string]: unknown;
  };
  onNext: (data: { icpDefinition: ICPData }) => void;
  onBack: () => void;
}

const defaultICPData: ICPData = {
  industries: [],
  employee_range: [0, 0],
  revenue_range: [0, 0],
  regions: [],
  tech_stack: [],
  business_models: [],
  use_cases: [],
  buyer_personas: [],
  other_commonalities: [],
  bad_fit_signals: []
};

const ICPDefinition = ({ wizardData, onNext, onBack }: ICPDefinitionProps) => {
  // Initialize from existing wizardData if available
  const [icpData, setIcpData] = useState<ICPData>(() => {
    if (wizardData.icpDefinition) {
      return {
        ...defaultICPData,
        ...wizardData.icpDefinition as Partial<ICPData>
      };
    }
    return defaultICPData;
  });
  const [inputType, setInputType] = useState<'freeform' | 'manual' | 'loaddata'>('manual');
  const [freeformInput, setFreeformInput] = useState('');
  const [completionPercentage, setCompletionPercentage] = useState(0);
  const [isGeneratingInspiration, setIsGeneratingInspiration] = useState(false);
  const [extractedFields, setExtractedFields] = useState<{
    industry: string | null;
    size: string | null;
    tools: string[] | null;
    region: string | null;
    useCase: string | null;
    buyer: string | null;
  }>({ industry: null, size: null, tools: null, region: null, useCase: null, buyer: null });

  // Calculate initial completion on component mount
  useEffect(() => {
    calculateCompletion();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateField = <K extends keyof ICPData>(field: K, value: ICPData[K]) => {
    setIcpData(prev => ({
      ...prev,
      [field]: value
    }));
    calculateCompletion();
  };

  // Generate AI inspiration for ICP
  const generateInspiration = async () => {
    try {
      // Set loading state
      setIsGeneratingInspiration(true);
      setFreeformInput('Generating inspiration...');
      
      // Generate inspiration directly
      const inspiration = await generateIcpInspiration();
      
      // Update the text field - strip any markdown or special formatting
      const cleanedInspiration = inspiration
        .replace(/\*\*/g, '') // Remove markdown bold
        .replace(/\n\n/g, '. ') // Replace double newlines with periods
        .replace(/\n/g, ' ') // Replace single newlines with spaces
        .replace(/\s+/g, ' '); // Normalize whitespace
      
      console.log('Cleaned inspiration:', cleanedInspiration);
      setFreeformInput(cleanedInspiration);
      
      // Extract common fields from the inspiration text
      // This is a simplified extraction that should be enhanced with NLP in production
      const text = inspiration.toLowerCase();
      
      // Simple extraction based on keywords
      const extractedData = {
        industry: text.includes('saas') ? 'SaaS' : 
                 text.includes('ecommerce') ? 'Ecommerce' : 
                 text.includes('fintech') ? 'FinTech' : null,
        
        size: text.includes('50 to 500') ? '50-500 employees' : 
              text.includes('100 to 1000') ? '100-1000 employees' : 
              text.includes('employees') ? text.match(/(\d+)\s+to\s+(\d+)\s+employees/)?.[0] : null,
        
        tools: [
          ...(text.includes('stripe') ? ['Stripe'] : []),
          ...(text.includes('shopify') ? ['Shopify'] : []),
          ...(text.includes('salesforce') ? ['Salesforce'] : []),
          ...(text.includes('hubspot') ? ['HubSpot'] : []),
          ...(text.includes('aws') ? ['AWS'] : []),
          ...(text.includes('azure') ? ['Azure'] : []),
          ...(text.includes('segment') ? ['Segment'] : []),
          ...(text.includes('mixpanel') ? ['Mixpanel'] : []),
          ...(text.includes('zendesk') ? ['Zendesk'] : []),
          ...(text.includes('intercom') ? ['Intercom'] : [])
        ],
        
        region: text.includes('north america') ? 'North America' : 
                text.includes('europe') ? 'Europe' : 
                text.includes('apac') ? 'APAC' : null,
        
        useCase: text.includes('cart abandonment') ? 'Reducing cart abandonment' : 
                 text.includes('customer retention') ? 'Improving customer retention' : 
                 text.includes('conversion rates') ? 'Increasing conversion rates' : null,
        
        buyer: text.includes('marketing') ? 'Heads of marketing or growth' : 
               text.includes('cto') ? 'CTOs or engineering leaders' : 
               text.includes('product') ? 'Product managers' : null
      };
      
      setExtractedFields(extractedData);
      setCompletionPercentage(70);
      // Reset loading state
      setIsGeneratingInspiration(false);
    } catch (error) {
      console.error('Error generating inspiration:', error);
      
      // Fallback to static inspiration
      const fallbackText = "Our best-fit customers are usually fast-growing B2C SaaS companies with 50 to 500 employees, based in North America. They use tools like Stripe and Shopify, and their main use case is reducing cart abandonment. We typically sell to heads of marketing or growth. Hardware or government orgs are usually a bad fit.";
      setFreeformInput(fallbackText);
      
      // Set basic extracted fields
      setExtractedFields({
        industry: 'B2C SaaS',
        size: '50-500 employees',
        tools: ['Stripe', 'Shopify'],
        region: 'North America',
        useCase: 'Reducing cart abandonment',
        buyer: 'Heads of marketing or growth'
      });
      
      setCompletionPercentage(70);
    } finally {
      // Always reset loading state
      setIsGeneratingInspiration(false);
    }
  };
  
  const handleFreeformSubmit = () => {
    // In a real implementation, this would call the backend NLP service
    // For now, we'll just show a message
    console.log('Processing freeform input:', freeformInput);
    
    // Mock extract fields from the input
    if (freeformInput.length > 0) {
      const extractedData = {
        industry: freeformInput.toLowerCase().includes('saas') ? 'B2C SaaS' : null,
        size: freeformInput.toLowerCase().includes('500') ? '50-500 employees' : null,
        tools: freeformInput.toLowerCase().includes('stripe') ? ['Stripe', 'Shopify'] : null,
        region: freeformInput.toLowerCase().includes('north america') ? 'North America' : null,
        useCase: freeformInput.toLowerCase().includes('cart abandonment') ? 'Reducing cart abandonment' : null,
        buyer: freeformInput.toLowerCase().includes('marketing') ? 'Heads of marketing or growth' : null
      };
      
      setExtractedFields(extractedData);
      setCompletionPercentage(freeformInput.length > 100 ? 70 : 30);
    }
  };

  const calculateCompletion = () => {
    // Simple completion calculation - counts non-empty fields
    const totalFields = Object.keys(icpData).length;
    const filledFields = Object.entries(icpData).filter(([_, value]) => {
      if (Array.isArray(value)) {
        return value.length > 0;
      }
      return value !== null && value !== undefined;
    }).length;
    
    setCompletionPercentage(Math.round((filledFields / totalFields) * 100));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    try {
      // Update trial with ICP definition
      if (wizardData.trialId) {
        const response = await fetch(`/api/trials/${wizardData.trialId}/icp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(icpData),
      });

        if (!response.ok) {
          throw new Error('Failed to save ICP definition');
        }
      }

      // Move to the next step with the ICP data
      onNext({ icpDefinition: icpData });
    } catch (error) {
      console.error('Error saving ICP definition:', error);
      // Still advance to next step even if API fails
      onNext({ icpDefinition: icpData });
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-6">Define Your Ideal Customer Profile</h2>
      <p className="mb-6">
        Define the characteristics of your ideal customer to help identify the best-fit accounts.
      </p>
      
      <form onSubmit={handleSubmit}>
        {/* Custom Tabs */}
        <div className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-6xl mx-auto">
            {/* Option 1: I already know my ICP */}
            <div 
              className={`cursor-pointer rounded-lg p-6 border-2 transition-all hover:shadow-md ${inputType === 'freeform' ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:border-blue-200'}`}
              onClick={() => setInputType('freeform')}
            >
              <div className="mb-3 flex justify-center">
                <div className="p-3 bg-blue-100 rounded-full">
                  <Brain className="w-10 h-10 text-blue-600" strokeWidth={1.5} /> 
                </div>
              </div>
              <h3 className="font-bold text-lg mb-2 text-center">Let me describe</h3>
              <p className="text-gray-600 mb-4">Start with your intuition and tell us who your best customers are.</p>
              <button
                type="button"
                className="w-full px-4 py-2 text-sm font-medium text-blue-600 bg-white border border-blue-600 rounded-md hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Write or speak your ICP
              </button>
            </div>

            {/* Option 2: Help me refine my ICP */}
            <div 
              className={`cursor-pointer rounded-lg p-6 border-2 transition-all hover:shadow-md ${inputType === 'manual' ? 'border-green-600 bg-green-50' : 'border-gray-200 hover:border-green-200'}`}
              onClick={() => setInputType('manual')}
            >
              <div className="mb-3 flex justify-center">
                <div className="p-3 bg-green-100 rounded-full">
                  <ClipboardList className="w-10 h-10 text-green-600" strokeWidth={1.5} />
                </div>
              </div>
              <h3 className="font-bold text-lg mb-2 text-center">Help me refine</h3>
              <p className="text-gray-600 mb-4">Answer a few guided questions and we'll build your ICP together.</p>
              <button
                type="button"
                className="w-full px-4 py-2 text-sm font-medium text-green-600 bg-white border border-green-600 rounded-md hover:bg-green-50 focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                Take the ICP survey
              </button>
            </div>

            {/* Option 3: Use data to define ICP */}
            <div 
              className={`cursor-pointer rounded-lg p-6 border-2 transition-all hover:shadow-md ${inputType === 'loaddata' ? 'border-purple-600 bg-purple-50' : 'border-gray-200 hover:border-purple-200'}`}
              onClick={() => setInputType('loaddata')}
            >
              <div className="mb-3 flex justify-center">
                <div className="p-3 bg-purple-100 rounded-full">
                  <BarChart3 className="w-10 h-10 text-purple-600" strokeWidth={1.5} />
                </div>
              </div>
              <h3 className="font-bold text-lg mb-2 text-center">Use data</h3>
              <p className="text-gray-600 mb-4">Upload a list of accounts and we'll find your best-fit traits automatically.</p>
              <button
                type="button"
                className="w-full px-4 py-2 text-sm font-medium text-purple-600 bg-white border border-purple-600 rounded-md hover:bg-purple-50 focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                Upload data
              </button>
            </div>
          </div>
        </div>
        
        {/* Tab Content */}
        <div className="rounded-xl bg-white p-3">
          {inputType === 'loaddata' && (
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">
                Upload your customer data
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-md p-6 flex flex-col items-center justify-center">
                <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                  <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <div className="mt-4 text-center">
                  <p className="text-sm text-gray-600">
                    Drag and drop your file here, or
                  </p>
                  <div className="mt-2">
                    <input
                      type="file"
                      id="file-upload"
                      name="file-upload"
                      className="sr-only"
                      accept=".csv,.xlsx,.xls"
                    />
                    <label
                      htmlFor="file-upload"
                      className="inline-flex items-center px-4 py-2 bg-blue-600 border border-transparent rounded-md font-medium text-sm text-white hover:bg-blue-700 focus:outline-none cursor-pointer"
                    >
                      Browse files
                    </label>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Supported formats: CSV, Excel
                  </p>
                </div>
              </div>
              <div className="mt-4">
                <h4 className="font-medium text-sm">What data should I include?</h4>
                <ul className="text-sm text-gray-600 mt-2 list-disc list-inside space-y-1">
                  <li>Current customer/account list with metadata</li>
                  <li>Fields like industry, size, revenue, location</li>
                  <li>Any existing scoring or tiering information</li>
                </ul>
              </div>
            </div>
          )}

          {inputType === 'freeform' && (
              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium">
                    Describe your Ideal Customer Profile
                  </label>
                  <button
                    type="button"
                    className={`px-4 py-2 text-sm font-medium text-white rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${isGeneratingInspiration ? 'bg-blue-400 cursor-wait' : 'bg-blue-600 hover:bg-blue-700'}`}
                    onClick={generateInspiration}
                    disabled={isGeneratingInspiration}
                  >
                    <span className="flex items-center">
                      {isGeneratingInspiration ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Generating...
                        </>
                      ) : (
                        <>
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                          Give me inspiration
                        </>
                      )}
                    </span>
                  </button>
                </div>
                <textarea
                  className="w-full h-32 p-2 border rounded-md"
                  placeholder="Describe who your ideal customer is. You can type or speak freely. We’ll guide and nudge you based on your response."
                  value={freeformInput}
                  onChange={(e) => setFreeformInput(e.target.value)}
                />
                <button
                  type="button"
                  className="mt-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                  onClick={handleFreeformSubmit}
                >
                  Process
                </button>
                <p className="text-sm text-gray-500 mt-2">
                  Our AI will extract structured data from your description.
                </p>
              </div>
            )}
            
            {inputType === 'manual' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Industry */}
                <div className="mb-4">
                  <label className="block text  -sm font-medium mb-2">Industry</label>
                  <select
                    multiple
                    className="w-full p-2 border rounded-md"
                    onChange={(e) => {
                      const options = Array.from(e.target.selectedOptions, option => option.value);
                      updateField('industries', options);
                    }}
                  >
                    <option value="Ecommerce">Ecommerce</option>
                    <option value="SaaS">SaaS</option>
                    <option value="FinTech">FinTech</option>
                    <option value="Healthcare">Healthcare</option>
                    <option value="Education">Education</option>
                    <option value="Manufacturing">Manufacturing</option>
                    <option value="Media">Media</option>
                    <option value="Retail">Retail</option>
                  </select>
                </div>
                
                {/* Company Size */}
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">Company Size (Employees)</label>
                  <select
                    className="w-full p-2 border rounded-md"
                    onChange={(e) => {
                      const value = e.target.value;
                      const range = value.split('-').map(Number) as [number, number];
                      updateField('employee_range', range);
                    }}
                  >
                    <option value="1-10">1-10</option>
                    <option value="11-50">11-50</option>
                    <option value="51-200">51-200</option>
                    <option value="201-500">201-500</option>
                    <option value="501-1000">501-1000</option>
                    <option value="1001-5000">1001-5000</option>
                    <option value="5001-10000">5001-10000</option>
                    <option value="10001-50000">10001-50000</option>
                  </select>
                </div>
                
                {/* Revenue Range */}
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">Annual Revenue Range</label>
                  <select
                    className="w-full p-2 border rounded-md"
                    onChange={(e) => {
                      const value = e.target.value;
                      const range = value.split('-').map(Number) as [number, number];
                      updateField('revenue_range', range);
                    }}
                  >
                    <option value="0-100000">$0 - $100K</option>
                    <option value="100001-1000000">$100K - $1M</option>
                    <option value="1000001-10000000">$1M - $10M</option>
                    <option value="10000001-50000000">$10M - $50M</option>
                    <option value="50000001-100000000">$50M - $100M</option>
                    <option value="100000001-1000000000">$100M - $1B</option>
                    <option value="1000000001-10000000000">$1B+</option>
                  </select>
                </div>
                
                {/* Regions */}
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">Regions</label>
                  <select
                    multiple
                    className="w-full p-2 border rounded-md"
                    onChange={(e) => {
                      const options = Array.from(e.target.selectedOptions, option => option.value);
                      updateField('regions', options);
                    }}
                  >
                    <option value="North America">North America</option>
                    <option value="South America">South America</option>
                    <option value="Europe">Europe</option>
                    <option value="Asia Pacific">Asia Pacific</option>
                    <option value="Middle East">Middle East</option>
                    <option value="Africa">Africa</option>
                  </select>
                </div>
                
                {/* Tech Stack */}
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">Tech Stack</label>
                  <input
                    type="text"
                    className="w-full p-2 border rounded-md"
                    placeholder="Enter technologies separated by commas"
                    onChange={(e) => {
                      const techs = e.target.value.split(',').map(t => t.trim()).filter(Boolean);
                      updateField('tech_stack', techs);
                    }}
                  />
                </div>
                
                {/* Business Model */}
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">Business Model</label>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="inline-flex items-center">
                        <input
                          type="checkbox"
                          className="form-checkbox"
                          value="B2B"
                          onChange={(e) => {
                            const newModels = [...icpData.business_models];
                            if (e.target.checked) {
                              newModels.push('B2B');
                            } else {
                              const index = newModels.indexOf('B2B');
                              if (index !== -1) newModels.splice(index, 1);
                            }
                            updateField('business_models', newModels);
                          }}
                        />
                        <span className="ml-2">B2B</span>
                      </label>
                    </div>
                    <div>
                      <label className="inline-flex items-center">
                        <input
                          type="checkbox"
                          className="form-checkbox"
                          value="B2C"
                          onChange={(e) => {
                            const newModels = [...icpData.business_models];
                            if (e.target.checked) {
                              newModels.push('B2C');
                            } else {
                              const index = newModels.indexOf('B2C');
                              if (index !== -1) newModels.splice(index, 1);
                            }
                            updateField('business_models', newModels);
                          }}
                        />
                        <span className="ml-2">B2C</span>
                      </label>
                    </div>
                    <div>
                      <label className="inline-flex items-center">
                        <input
                          type="checkbox"
                          className="form-checkbox"
                          value="SaaS"
                          onChange={(e) => {
                            const newModels = [...icpData.business_models];
                            if (e.target.checked) {
                              newModels.push('SaaS');
                            } else {
                              const index = newModels.indexOf('SaaS');
                              if (index !== -1) newModels.splice(index, 1);
                            }
                            updateField('business_models', newModels);
                          }}
                        />
                        <span className="ml-2">SaaS</span>
                      </label>
                    </div>
                    <div>
                      <label className="inline-flex items-center">
                        <input
                          type="checkbox"
                          className="form-checkbox"
                          value="Ecommerce"
                          onChange={(e) => {
                            const newModels = [...icpData.business_models];
                            if (e.target.checked) {
                              newModels.push('Ecommerce');
                            } else {
                              const index = newModels.indexOf('Ecommerce');
                              if (index !== -1) newModels.splice(index, 1);
                            }
                            updateField('business_models', newModels);
                          }}
                        />
                        <span className="ml-2">Ecommerce</span>
                      </label>
                    </div>
                  </div>
                </div>
                
                {/* Use Cases */}
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">Common Use Cases</label>
                  <textarea
                    className="w-full p-2 border rounded-md"
                    placeholder="Enter common use cases"
                    onChange={(e) => {
                      const cases = e.target.value.split(',').map(t => t.trim()).filter(Boolean);
                      updateField('use_cases', cases);
                    }}
                  />
                </div>
                
                {/* Buyer Personas */}
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">Key Buyer Personas</label>
                  <input
                    type="text"
                    className="w-full p-2 border rounded-md"
                    placeholder="Enter roles separated by commas (e.g., CTO, VP Marketing)"
                    onChange={(e) => {
                      const personas = e.target.value.split(',').map(t => t.trim()).filter(Boolean);
                      updateField('buyer_personas', personas);
                    }}
                  />
                </div>
                
                {/* Other Commonalities */}
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">Other Commonalities</label>
                  <input
                    type="text"
                    className="w-full p-2 border rounded-md"
                    placeholder="Enter other common traits"
                    onChange={(e) => {
                      const traits = e.target.value.split(',').map(t => t.trim()).filter(Boolean);
                      updateField('other_commonalities', traits);
                    }}
                  />
                </div>
                
                {/* Bad Fit Signals */}
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">Negative Fit Traits</label>
                  <input
                    type="text"
                    className="w-full p-2 border rounded-md"
                    placeholder="Enter negative fit traits"
                    onChange={(e) => {
                      const signals = e.target.value.split(',').map(t => t.trim()).filter(Boolean);
                      updateField('bad_fit_signals', signals);
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        
        {/* Optional Validation Section - Only show when we have a defined ICP */}
        {(inputType === 'manual' || inputType === 'freeform') && completionPercentage > 20 && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <h3 className="text-lg font-medium mb-2">Test ICP Against Your Data</h3>
            <p className="text-sm text-gray-600 mb-3">
              If you've uploaded account data, we can show you how many accounts match your defined ICP.
            </p>
            <button
              type="button"
              className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-50"
              onClick={() => alert('This would validate your ICP against your account data')}
            >
              Test ICP Against My Data
            </button>
          </div>
        )}
        
        {/* Navigation Buttons */}
        <div className="mt-6 flex justify-between">
          <Button 
            type="button" 
            onClick={onBack}
            variant="outline"
          >
            Back
          </Button>
          <Button type="submit">
            Next: Account Scoring
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ICPDefinition;