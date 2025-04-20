import { ChromaClient, IncludeEnum } from 'chromadb';
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

/**
 * Search for relevant documents using vector similarity search
 * @param query The query text to search for
 * @param limit Maximum number of results to return
 * @returns Object with chunks, metadatas, and fallbackMode flag
 */
export async function vectorSearch(query: string, limit = 5): Promise<{ 
  chunks: string[], 
  metadatas: Record<string, unknown>[],
  fallbackMode: boolean
}> {
  try {
    // Get the ChromaDB collection
    const collection = await initVectorStore();
    
    // Import OpenAI for generating embeddings
    const { OpenAI } = await import('openai');
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    
    // Generate embedding for the query
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: query,
    });
    const queryEmbedding = response.data[0].embedding;
    
    // Perform the vector search
    const searchResult = await collection.query({
      queryEmbeddings: [queryEmbedding],
      nResults: limit,
      include: [IncludeEnum.Metadatas, IncludeEnum.Documents]
    });
    
    // Extract the results
    const chunks: string[] = [];
    const metadatas: Record<string, unknown>[] = [];
    
    if (searchResult.documents?.[0]) {
      for (let i = 0; i < searchResult.documents[0].length; i++) {
        const document = searchResult.documents[0][i];
        const metadata = searchResult.metadatas?.[0]?.[i] || {};
        
        if (typeof document === 'string') {
          chunks.push(document);
          metadatas.push(metadata as Record<string, unknown>);
        }
      }
    }
    
    return {
      chunks,
      metadatas,
      fallbackMode: false
    };
  } catch (error) {
    console.error('Error during vector search:', error);
    
    // Fallback to text cache search
    try {
      const { searchTextCache } = await import('./ingestFolder');
      const results = await searchTextCache(query);
      
      const chunks = results.map(r => r.text);
      const metadatas = results.map(r => ({ 
        fileName: r.fileName,
        fileId: r.fileId,
        chunkIndex: 0,
        totalChunks: 1
      }));
      
      if (chunks.length > 0) {
        console.log(`Found ${chunks.length} results using fallback text search`);
        return { 
          chunks,
          metadatas,
          fallbackMode: true
        };
      }
    } catch (fallbackError) {
      console.error('Fallback search failed:', fallbackError);
    }
    
    // Return empty results if everything fails
    return {
      chunks: [],
      metadatas: [],
      fallbackMode: true
    };
  }
}
