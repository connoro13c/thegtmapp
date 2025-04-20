import { ChromaClient } from 'chromadb';
import type { Collection } from 'chromadb';

// Constants for ChromaDB configuration
const CHROMA_SERVER_URL = 'http://localhost:8000';
const CONNECTION_TIMEOUT_MS = 5000; // 5 seconds timeout for connection attempts

// Global Chroma client instance
let client: ChromaClient | null = null;
let collection: Collection | null = null;
let isConnected = false;

/**
 * Initialize the ChromaDB vector store
 * @param collectionName Name of the collection to use
 * @returns The initialized collection
 */
export async function initVectorStore(collectionName = 'gtm_documents'): Promise<Collection> {
  try {
    if (!client || !isConnected) {
      console.log('Initializing ChromaDB client');
      // Use the standalone ChromaDB server
      const chromaUrl = CHROMA_SERVER_URL;
      
      try {
        // Create a new client with the specified URL
        client = new ChromaClient({
          path: chromaUrl
        });
        
        // Verify connection by making a simple API call with timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), CONNECTION_TIMEOUT_MS);
        
        try {
          // Simple ping to check if server is available
          await client.heartbeat();
          clearTimeout(timeoutId);
          isConnected = true;
          console.log(`ChromaDB client successfully connected to ${chromaUrl}`);
        } catch (pingError) {
          clearTimeout(timeoutId);
          throw new Error(`Failed to connect to ChromaDB server: ${pingError instanceof Error ? pingError.message : 'Unknown error'}`);
        }
      } catch (connectionError) {
        console.error('ChromaDB connection error:', connectionError);
        throw new Error(`Failed to initialize ChromaDB client: ${connectionError instanceof Error ? connectionError.message : 'Unknown error'}`);
      }
    }
    
    if (!collection) {
      // Check if collection exists, if not create it
      try {
        collection = await client.getCollection({ 
          name: collectionName,
          embeddingFunction: {
            generate: async (texts: string[]): Promise<number[][]> => {
              // This is a placeholder - we're using OpenAI for actual embeddings
              // But ChromaDB requires this interface
              return texts.map(() => []);
            }
          }
        });
        console.log(`Using existing collection: ${collectionName}`);
      } catch (error) {
        console.log(`Creating new collection: ${collectionName}`);
        collection = await client.createCollection({ 
          name: collectionName,
          embeddingFunction: {
            generate: async (texts: string[]): Promise<number[][]> => {
              // This is a placeholder - we're using OpenAI for actual embeddings
              return texts.map(() => []);
            }
          }
        });
      }
    }
    
    return collection;
  } catch (error) {
    console.error('Error initializing vector store:', error);
    throw error;
  }
}
