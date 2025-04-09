// Direct OpenAI integration for the frontend
// Calls backend API endpoint to avoid exposing API keys in frontend code

// Use environment variable or default to localhost for API URL
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002';

export async function generateIcpInspiration(): Promise<string> {
  try {
    // Use backend endpoint with proper URL path
    // Add cache-busting query parameter
    const response = await fetch(`${API_BASE_URL}/ai-inspiration?t=${Date.now()}`);
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('API returned inspiration:', data.inspiration);
    return data.inspiration;
  } catch (error) {
    // Better error logging with more context
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[ICP Inspiration API Error] ${errorMessage}`);
    
    // Fallback static inspiration in case of API failure
    return 'Our best-fit customers are usually fast-growing B2C SaaS companies with 50 to 500 employees, based in North America. They use tools like Stripe and Shopify, and their main use case is reducing cart abandonment. We typically sell to heads of marketing or growth. Hardware or government orgs are usually a bad fit.';
  }
}