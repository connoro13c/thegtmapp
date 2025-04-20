import { OpenAI } from 'openai';
import googleDriveService from './googleDriveService';
import { ingest } from '../lib/ingestFolder';
import { answer } from '../lib/answer';

export class ChatbotService {
  private openai: OpenAI;
  
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    
    // Auto-ingest documents from the default Drive folder ID
    const defaultFolderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
    if (defaultFolderId) {
      console.log('Starting document ingestion (optimized to only process new documents)');
      // Use the improved ingest function that only processes new documents
      ingest(defaultFolderId, false).catch(err => {
        console.error('Failed to ingest default documents folder:', err);
      });
    }
  }
  
  /**
   * Force reprocessing of all documents in the connected Google Drive folder
   * @returns Success status and message
   */
  async loadDocumentsFromDrive(folderId: string) {
    try {
      // Use the folderId from the parameter, or fall back to the environment variable
      const targetFolderId = folderId || process.env.GOOGLE_DRIVE_FOLDER_ID;
      
      if (!targetFolderId) {
        return false;
      }
      
      // Force reprocessing of all documents
      await ingest(targetFolderId, true);
      return true;
    } catch (error) {
      console.error('Error loading documents from Drive:', error);
      return false;
    }
  }

  /**
   * Process a message from the user using vector search and LLM
   * @param message The user's message
   * @returns Structured response with text and citation sources
   */
  async processMessage(message: string) {
    // The answer function now returns a structured response with text and sources
    const response = await answer(message);
    
    // Return the full structured response for the frontend to handle
    return response;
  }
  
  /**
   * Get the list of files in the connected Google Drive folder
   * @returns List of files in the folder
   */
  async getConnectedFiles() {
    try {
      const defaultFolderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
      if (!defaultFolderId) {
        return { success: false, files: [], message: 'No folder ID configured' };
      }
      
      const files = await googleDriveService.listFiles(defaultFolderId);
      return { success: true, files, message: `Found ${files.length} files` };
    } catch (error) {
      console.error('Error getting connected files:', error);
      return { success: false, files: [], message: 'Error fetching files' };
    }
  }
}

export default new ChatbotService();
