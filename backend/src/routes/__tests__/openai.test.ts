import request from 'supertest';
import express from 'express';
import openaiRouter from '../openai';

// Mock OpenAI
jest.mock('openai', () => {
  return {
    OpenAI: jest.fn().mockImplementation(() => {
      return {
        chat: {
          completions: {
            create: jest.fn().mockResolvedValue({
              choices: [{
                message: {
                  content: 'This is a mock OpenAI response'
                }
              }]
            })
          }
        }
      };
    })
  };
});

describe('OpenAI API Routes', () => {
  let app: express.Application;

  beforeEach(() => {
    // Reset the mocks before each test
    jest.clearAllMocks();
    
    // Clear require cache to reset rate limiting state
    jest.resetModules();
    
    // We need to re-import the router after resetting modules
    const freshOpenaiRouter = require('../openai').default;
    
    app = express();
    app.use(express.json());
    app.use('/api/openai', freshOpenaiRouter);
    
    // Mock environment variables
    process.env.OPENAI_API_KEY = 'test-api-key';
  });

  describe('POST /api/openai/completion', () => {
    it('should return a response for a valid prompt', async () => {
    const response = await request(app)
    .post('/api/openai/completion')
    .send({ 
          prompt: 'Test prompt',
        model: 'gpt-4-turbo',
        temperature: 0.5,
        max_tokens: 100
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('response');
      expect(response.body.response).toBe('This is a mock OpenAI response');
    });

    it('should return 400 for missing prompt', async () => {
      // Reset mock last request time to avoid rate limiting in tests
      jest.spyOn(Date, 'now').mockImplementation(() => 0);
      
      const response = await request(app)
        .post('/api/openai/completion')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });
});