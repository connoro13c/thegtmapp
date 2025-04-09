// A very simple standalone Express server with just the inspiration endpoint
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3003; // Use a different port to avoid conflicts

// Middleware
app.use(cors({
  origin: '*', // Allow all origins
  credentials: true
}));
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Fixed inspiration endpoint
app.get('/fixed-inspiration', (req, res) => {
  console.log('Fixed inspiration endpoint called');
  res.status(200).json({ 
    inspiration: 'Our best-fit customers are usually fast-growing B2C SaaS companies with 50 to 500 employees, based in North America. They use tools like Stripe and Shopify, and their main use case is reducing cart abandonment. We typically sell to heads of marketing or growth. Hardware or government orgs are usually a bad fit.'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Fixed server running on port ${PORT}`);
});