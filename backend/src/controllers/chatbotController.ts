import type { Request, Response } from 'express';
import chatbotService from '../services/chatbotService';

export class ChatbotController {
  /**
   * Connect to a Google Drive folder and load its contents
   * @param req Request with folderId in body
   * @param res Response
   */
  async connectDriveFolder(req: Request, res: Response) {
    try {
      const { folderId } = req.body;
      
      if (!folderId) {
        return res.status(400).json({ error: 'Google Drive folder ID is required' });
      }
      
      const success = await chatbotService.loadDocumentsFromDrive(folderId);
      
      if (success) {
        return res.status(200).json({ message: 'Successfully connected to Google Drive folder' });
      }
      
      return res.status(500).json({ error: 'Failed to connect to Google Drive folder' });
    } catch (error) {
      console.error('Error connecting to Google Drive folder:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Process a message from the chat bot
   * @param req Request with message in body
   * @param res Response
   */
  async processMessage(req: Request, res: Response) {
    // Setup a request timeout for long-running requests
    const TIMEOUT_MS = 180000; // 3 minutes
    let timeoutId: NodeJS.Timeout | undefined;
    
    // Create a timeout promise that will reject after the timeout period
    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(() => {
        reject(new Error('Request timeout'));
      }, TIMEOUT_MS);
    });
    
    try {
      console.log('Request body received:', JSON.stringify(req.body));
      console.log('Request headers:', JSON.stringify(req.headers, null, 2));
      
      const { message } = req.body;
      
      if (!message) {
        console.log('No message provided in request');
        return res.status(400).json({ error: 'Message is required' });
      }
      
      console.log('Processing message:', message);
      
      // Race between the actual processing and the timeout
      const response = await Promise.race([
        chatbotService.processMessage(message),
        timeoutPromise
      ]);
      
      // Clear the timeout if the processing completed successfully
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      
      // Return the structured response with text and citation sources
      return res.status(200).json(response);
    } catch (error) {
      // Clear the timeout to prevent memory leaks
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      
      console.error('Error processing message:', error);
      
      // Handle different types of errors with appropriate status codes
      const err = error as { message?: string; name?: string; statusCode?: number };
      
      if (err.message?.includes('timeout') || err.name === 'AbortError') {
        return res.status(504).json({
          error: 'The request timed out. The document context might be too large for processing.'
        });
      }
      
      if (err.message?.includes('maximum context length')) {
        return res.status(413).json({
          error: 'The document context exceeds the maximum size limit. Try asking about a specific document.'
        });
      }
      
      if (err.statusCode) {
        // Pass through status code from OpenAI if available
        return res.status(err.statusCode).json({ error: err.message || 'API error' });
      }
      
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Get the list of connected files from Google Drive
   * @param req Request
   * @param res Response
   */
  async getConnectedFiles(req: Request, res: Response) {
    try {
      const files = chatbotService.getConnectedFiles();
      return res.status(200).json({ files });
    } catch (error) {
      console.error('Error getting connected files:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
}

export default new ChatbotController();