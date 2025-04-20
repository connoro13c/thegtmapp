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
      ingest(defaultFolderId).catch(err => {
        console.error('Failed to ingest default documents folder:', err);
      });
    }
  }

  /**
   * Process a message from the user using vector search and LLM
   * @param message The user's message
   * @returns Bot response message
   */
  async processMessage(message: string) {
    return await answer(message);
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
