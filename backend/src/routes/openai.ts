import express from 'express';
import { OpenAI } from 'openai';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

// Rate limiting could be implemented here in the future
// For now, keep this simple for testing purposes

// Initialize OpenAI
const getOpenAIClient = () => {
  // Validate API key is set
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OpenAI API key is not configured');
  }
  
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
};

/**
 * General purpose OpenAI completion endpoint
 * 
 * @route POST /api/openai/completion
 * 
 * @param {Object} req.body.prompt - The text prompt to send to OpenAI (required)
 * @param {string} [req.body.model] - OpenAI model to use (defaults to env.OPENAI_MODEL or "gpt-3.5-turbo")
 * @param {number} [req.body.temperature=0.7] - Controls randomness (0-1)
 * @param {number} [req.body.max_tokens=200] - Maximum length of the response
 * 
 * @returns {Object} response - The OpenAI generated text response
 */
router.post('/completion', async (req, res) => {
  try {
    const { prompt, model = process.env.OPENAI_MODEL || "gpt-3.5-turbo", temperature = 0.7, max_tokens = 200 } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }
    
    console.log(`OpenAI completion requested using model: ${model}`);
    
    const openai = getOpenAIClient();
    
    const completion = await openai.chat.completions.create({
      model,
      messages: [
        {
          role: "user",
          content: prompt
        }
      ],
      temperature,
      max_tokens,
      presence_penalty: 0.1,
      frequency_penalty: 0.1
    });
    
    const response = completion.choices[0].message.content?.trim();
    console.log('Generated response:', response);
    
    res.status(200).json({ response });
  } catch (error) {
    // Enhanced error logging
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[ERROR] OpenAI Completion: ${errorMessage}`);
    
    // Don't expose actual errors to client
    res.status(500).json({ 
      error: 'Failed to generate response',
      message: 'There was an issue processing your request'
    });
  }
});

export default router;