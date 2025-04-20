import { OpenAI } from 'openai';
import * as fs from 'node:fs';
import * as path from 'node:path';
import googleDriveService from '../services/googleDriveService';
import { extractText } from './extractText';
import { chunkText } from './chunk';
import { initVectorStore } from './vectorStore';
import type { Collection } from 'chromadb';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Generate embeddings for text
 * @param text The text to embed
 * @returns The embedding vector
 */
async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: text,
    });
    return response.data[0].embedding;
  } catch (error) {
    console.error('Error generating embedding:', error);
    throw error;
  }
}

// Configuration for retry logic
const RETRY_ATTEMPTS = 3;
const RETRY_DELAY_MS = 1000;
const TEXT_CACHE_DIR = path.join(process.cwd(), 'cache', 'text');

// Ensure cache directory exists
if (!fs.existsSync(TEXT_CACHE_DIR)) {
  fs.mkdirSync(TEXT_CACHE_DIR, { recursive: true });
  console.log(`Created text cache directory: ${TEXT_CACHE_DIR}`);
}

/**
 * Helper function to retry an operation with exponential backoff
 * @param operation Function to retry
 * @param attempts Maximum number of attempts
 * @param delayMs Initial delay in milliseconds (doubles each retry)
 * @returns Result of the operation, or throws after all attempts fail
 */
async function withRetry<T>(
  operation: () => Promise<T>,
  attempts: number = RETRY_ATTEMPTS,
  delayMs: number = RETRY_DELAY_MS
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (attempts <= 1) throw error;
    
    console.log(`Operation failed, retrying in ${delayMs}ms... (${attempts-1} attempts remaining)`);
    await new Promise(resolve => setTimeout(resolve, delayMs));
    return withRetry(operation, attempts - 1, delayMs * 2);
  }
}

/**
 * Process a single file from Google Drive
 * @param fileId The Google Drive file ID
 * @param fileName The file name
 * @param mimeType The MIME type
 * @param collection The ChromaDB collection
 */
async function processFile(
  fileId: string,
  fileName: string,
  mimeType: string,
  collection: Collection
): Promise<void> {
  try {
    console.log(`Processing file: ${fileName} (${fileId})`);
    
    // Download file as buffer
    const buffer = await withRetry(() => googleDriveService.download(fileId));
    
    // Extract text from file
    const text = await withRetry(() => extractText(buffer, mimeType, fileName));
    
    if (!text || text.length < 100) {
      console.log(`Skipping ${fileName}: insufficient text extracted`);
      return;
    }
    
    // Save raw text to a local cache as fallback
    try {
      await saveToTextCache(fileId, fileName, text);
    } catch (cacheError) {
      console.error(`Error saving text to cache for ${fileName}:`, cacheError);
      // Continue even if cache fails
    }
    
    // Split text into chunks
    const chunks = chunkText(text);
    console.log(`Created ${chunks.length} chunks from ${fileName}`);
    
    // Track successful embeddings
    let successCount = 0;
    
    // Process each chunk
    for (let i = 0; i < chunks.length; i++) {
      try {
        const chunk = chunks[i];
        const chunkId = `${fileId}-chunk-${i}`;
        
        // Generate embedding for chunk - we still use retry for OpenAI API calls as those can be transient
        const embedding = await withRetry(() => generateEmbedding(chunk));
        
        // Store in ChromaDB without retry - fail fast to see real errors
        await collection.upsert({
          ids: [chunkId],
          embeddings: [embedding],
          metadatas: [{
            fileId,
            fileName,
            chunkIndex: i,
            mimeType,
            totalChunks: chunks.length
          }],
          documents: [chunk]
        });
        
        successCount++;
      } catch (chunkError) {
        console.error(`Error processing chunk ${i} of ${fileName}:`, chunkError);
        // Continue with next chunk despite error
      }
    }
    
    console.log(`Successfully processed ${fileName}: ${successCount}/${chunks.length} chunks embedded`);
  } catch (error) {
    console.error(`Error processing file ${fileName}:`, error);
  }
}

/**
 * Save extracted text to a local cache for fallback searching
 * @param fileId Google Drive file ID
 * @param fileName Original file name
 * @param text Extracted text content
 */
async function saveToTextCache(fileId: string, fileName: string, text: string): Promise<void> {
  const safeName = fileName.replace(/[^a-zA-Z0-9]/g, '_');
  const cacheFile = path.join(TEXT_CACHE_DIR, `${safeName}_${fileId}.txt`);
  
  try {
    await fs.promises.writeFile(cacheFile, text, 'utf8');
    console.log(`Cached text for ${fileName} to ${cacheFile}`);
  } catch (error) {
    console.error(`Failed to cache text for ${fileName}:`, error);
    throw error;
  }
}

/**
 * Search in the text cache for a keyword
 * @param keyword Keyword to search for
 * @returns Array of matches with fileName, fileId, and matching text
 */
export async function searchTextCache(keyword: string): Promise<Array<{ fileName: string, fileId: string, text: string }>> {
  const results = [];
  const lowercaseKeyword = keyword.toLowerCase();
  
  try {
    // Read all files in the cache directory
    const files = await fs.promises.readdir(TEXT_CACHE_DIR);
    
    for (const file of files) {
      if (file.endsWith('.txt')) {
        const filePath = path.join(TEXT_CACHE_DIR, file);
        const content = await fs.promises.readFile(filePath, 'utf8');
        
        // Check if the keyword is in the content
        if (content.toLowerCase().includes(lowercaseKeyword)) {
          // Extract fileId and fileName from the cache filename
          const fileNameMatch = file.match(/(.+)_([^_]+)\.txt$/);
          if (fileNameMatch) {
            const originalFileName = fileNameMatch[1].replace(/_/g, ' ');
            const fileId = fileNameMatch[2];
            
            // Find the specific context where the keyword appears
            const lines = content.split('\n');
            const matchingLines = lines.filter(line => 
              line.toLowerCase().includes(lowercaseKeyword)
            );
            
            // Get some context (up to 5 lines)
            const contextLines = matchingLines.slice(0, 5).join('\n');
            
            results.push({
              fileName: originalFileName,
              fileId,
              text: contextLines
            });
          }
        }
      }
    }
  } catch (error) {
    console.error('Error searching text cache:', error);
  }
  
  return results;
}

/**
 * Ingest all files from a Google Drive folder
 * @param folderId The Google Drive folder ID
 */
export async function ingest(folderId: string): Promise<void> {
  try {
    console.log(`Starting ingestion from Google Drive folder: ${folderId}`);
    
    // Initialize the vector store
    const collection = await initVectorStore();
    
    // List files in the folder
    const files = await googleDriveService.listFiles(folderId);
    console.log(`Found ${files.length} files in folder`);
    
    // Process each file
    for (const file of files) {
      // Skip folders
      if (file.mimeType === 'application/vnd.google-apps.folder') {
        continue;
      }
      
      try {
        await processFile(file.id, file.name, file.mimeType, collection);
      } catch (fileError) {
        console.error(`Error processing file ${file.name}:`, fileError);
        // Continue with next file
      }
    }
    
    console.log('Folder ingestion complete');
  } catch (error) {
    console.error('Error during folder ingestion:', error);
    throw error;
  }
}
