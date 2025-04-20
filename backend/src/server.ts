import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { OpenAI } from 'openai';

// Routes
import accountsRouter from './routes/accounts';
import territoriesRouter from './routes/territories';
import segmentsRouter from './routes/segments';
import trialsRouter from './routes/trials';
import openaiRouter from './routes/openai';
import chatbotRoutes from './routes/chatbotRoutes';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3002;

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5173'], // Add your frontend URLs
  credentials: true
}));
app.use(express.json());

// API routes
app.use('/api/accounts', accountsRouter);
app.use('/api/territories', territoriesRouter);
app.use('/api/segments', segmentsRouter);
app.use('/api/trials', trialsRouter);
app.use('/api/openai', openaiRouter);
app.use('/api/chatbot', chatbotRoutes);

// For backward compatibility
app.use('/accounts', accountsRouter);
app.use('/territories', territoriesRouter);
app.use('/segments', segmentsRouter);
app.use('/trials', trialsRouter);
app.use('/openai', openaiRouter);

// Health check endpoint
app.get('/health', (req, res) => {
  // Return more detailed status information
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || 'development',
    services: {
      googleDrive: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL ? 'configured' : 'not configured',
      openai: process.env.OPENAI_API_KEY ? 'configured' : 'not configured'
    }
  });
});





// AI inspiration endpoint - defined directly in server.ts for reliability
// Add basic rate limiting - a simple in-memory solution
const lastRequestTime: Record<string, number> = {};
const RATE_LIMIT_WINDOW = 5000; // 5 seconds between requests from same IP

app.get('/ai-inspiration', cors(), async (req, res) => {
  try {
    // Get client IP address
    const clientIp = (req.ip || req.headers['x-forwarded-for'] || 'unknown').toString();
    
    // Basic rate limiting
    const now = Date.now();
    if (lastRequestTime[clientIp] && now - lastRequestTime[clientIp] < RATE_LIMIT_WINDOW) {
      return res.status(429).json({ error: 'Too many requests, please try again later' });
    }
    lastRequestTime[clientIp] = now;
    
    console.log('AI inspiration endpoint called');
    
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    
    // Generate inspiration with OpenAI
    // Validate API key is set
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OpenAI API key is not configured');
    }

    // Use a more specific model based on availability
    const model = process.env.OPENAI_MODEL || "gpt-3.5-turbo";
    
    const completion = await openai.chat.completions.create({
      model,
      messages: [
        {
          role: "system",
          content: `You are an AI assistant helping with generating highly diverse and creative Ideal Customer Profile (ICP) descriptions. 
          Create a truly unique description of a hypothetical B2B or B2C company's ideal customer profile.
          
          In your response, include ALL of the following elements but vary them dramatically:
          - Industry: Choose specific vertical markets or niches (e.g., 'telemedicine platforms specializing in mental health' rather than just 'healthcare')
          - Company size: Use a wide range of employee counts (20-75, 150-400, 300-1200, 1000-5000, etc.)
          - Annual revenue: Specify varied ranges ($2M-$10M, $25M-$100M, $500M+, etc.)
          - Geographic location: Be very specific (Northeastern US, Scandinavian countries, DACH region, Southeast Asian markets, etc.)
          - Tech stack: Name actual products/tools relevant to the industry (Shopify+Klaviyo, Salesforce+Marketo, HubSpot+Intercom, etc.)
          - Business model: Be specific about type (DTC e-commerce, Enterprise SaaS, Hybrid services, etc.)
          - Use cases: Describe specific problems solved, not generic benefits
          - Buyer personas: Use specific job titles (VP of Revenue Operations, Director of Digital Transformation, etc.)
          - Unique characteristics: What makes these customers particularly interesting or valuable?
          - Negative fit traits: Specific reasons why certain prospects don't benefit from the solution
          
          IMPORTANT: Your response must be dramatically different from a generic template. Vary structure, word choice, specificity, and focus each time.`
        },
        {
          role: "user",
          content: "Generate an Ideal Customer Profile for a B2B/B2C software company."
        }
      ],
      temperature: 0.7,
      max_tokens: 200,
      presence_penalty: 0.1, // Slightly favor novel words/phrases
      frequency_penalty: 0.1  // Reduce repetition
    });
    
    const inspiration = completion.choices[0].message.content?.trim();
    console.log('Generated inspiration:', inspiration);
    
    res.status(200).json({ inspiration });
  } catch (error) {
    // Enhanced error logging
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[ERROR] AI Inspiration: ${errorMessage}`);
    
    // Don't expose actual errors to client
    // Return HTTP 200 with fallback message so UI doesn't break
    res.status(200).json({ 
      inspiration: 'Our best-fit customers are usually fast-growing B2C SaaS companies with 50 to 500 employees, based in North America. They use tools like Stripe and Shopify, and their main use case is reducing cart abandonment. We typically sell to heads of marketing or growth. Hardware or government orgs are usually a bad fit.',
      source: 'fallback'
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;