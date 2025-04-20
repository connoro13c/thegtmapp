import { OpenAI } from 'openai';
import { initVectorStore } from './vectorStore';
import { searchTextCache } from './ingestFolder';
import type { Collection, IncludeEnum } from 'chromadb';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Generate embedding for search query
 * @param text Query text
 * @returns Embedding vector
 */
async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: text,
    });
    return response.data[0].embedding;
  } catch (error) {
    console.error('Error generating query embedding:', error);
    throw error;
  }
}

/**
 * Response structure for the answer function
 */
interface AnswerResponse {
  text: string;
  sources: {
    num: number;
    file: string;
    url: string;
    chunkId?: string;
  }[];
}

/**
 * Format document chunks with metadata into a readable context string with citations
 * @param chunks Array of document chunk texts
 * @param metadatas Array of metadata for each chunk
 * @returns Object with formatted context string and citation mapping
 */
function formatContextChunks(chunks: string[], metadatas: Record<string, unknown>[]): { context: string; citationMap: Map<string, number> } {
  let context = '';
  // Create citation mapping
  const citationMap = new Map<string, number>();
  let nextCitationNum = 1;
  
  function addCitation(meta: Record<string, unknown>): number {
    // Create a unique key for this citation
    const fileName = meta.fileName as string || 'Unknown';
    const chunkId = meta.chunkIndex !== undefined ? `${meta.chunkIndex}` : '0';
    const key = `${fileName}#${chunkId}`;
    
    if (!citationMap.has(key)) {
      citationMap.set(key, nextCitationNum++);
    }
    
    return citationMap.get(key) || 0; // Fallback to 0 if not found (should never happen)
  }
  
  for (let i = 0; i < chunks.length; i++) {
    const metadata = metadatas[i];
    // Add document information
    if (metadata?.fileName) {
      const fileName = metadata.fileName as string;
      let chunkInfo = '';
      
      if (metadata?.chunkIndex !== undefined && metadata?.totalChunks !== undefined) {
        const chunkIndex = typeof metadata.chunkIndex === 'number' 
          ? metadata.chunkIndex 
          : Number.parseInt(metadata.chunkIndex as string);
        const totalChunks = typeof metadata.totalChunks === 'number' 
          ? metadata.totalChunks 
          : Number.parseInt(metadata.totalChunks as string);
        chunkInfo = ` (Chunk ${chunkIndex + 1}/${totalChunks})`;
      }
      
      context += `DOCUMENT: ${fileName}${chunkInfo}\n\n`;
    } else {
      context += 'DOCUMENT: Unknown Source\n\n';
    }
    
    // Get citation number for this chunk
    const citationNum = addCitation(metadata);
    
    // Add document content with citation marker
    context += `${chunks[i]}\n[CITE:${citationNum}]\n\n---\n\n`;
  }
  
  return { context, citationMap };
}

/**
 * Generate an AI answer based on document context with citations
 * @param query User's question
 * @param context Document context to use for answering
 * @param citationMap Map of citation keys to citation numbers
 * @returns AI-generated answer with citation information
 */
async function generateGptAnswer(
  query: string, 
  context: string, 
  citationMap: Map<string, number>,
  metadatas: Record<string, unknown>[]
): Promise<AnswerResponse> {
  // Create prompt for GPT
  const prompt = `
You are a helpful assistant for a Go-to-Market (GTM) strategy team. You answer questions based on the provided document context from the company's materials.

Answer the question using ONLY the information from the provided document context.
If the context doesn't contain enough information to answer the question fully, acknowledge what you do know from the context and then state that you don't have complete information.

Be specific in your answers and cite your sources. You MUST use citation markers [CITE:X] when referencing information from the documents to indicate which source contains the information.

For example: "The Q1 revenue was $500,000 [CITE:1] and the target for Q2 is $750,000 [CITE:2]"

CONTEXT:
${context}

QUESTION: ${query}

ANSWER:`;

  try {
    // Call the OpenAI API to generate an answer
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.2,
      max_tokens: 1000
    });
    
    let answer = completion.choices[0].message.content || 
      "I don't have enough information to answer that question.";
      
    // Replace citation markers with superscript format
    answer = answer.replace(/\[CITE:(\d+)\]/g, '[^$1]');
    
    // Create sources array from citation map
    const sources = Array.from(citationMap.entries()).map(([key, num]) => {
      const [file, chunkId] = key.split('#');
      let url = '';
      
      // Try to find the URL in metadata if available
      const meta = metadatas.find(m => m?.fileName === file && 
                                   (m?.chunkIndex === Number(chunkId) || 
                                    m?.chunkIndex === chunkId));
      
      if (meta?.url) {
        url = meta.url as string;
      } else if (meta?.fileId) {
        // Construct Google Drive URL if fileId is available
        url = `https://drive.google.com/file/d/${meta.fileId}/view`;
      } else {
        // Default empty URL if no identifiers available
        url = '#';
      }
      
      return {
        num,
        file,
        url,
        chunkId
      };
    });
    
    return {
      text: answer,
      sources
    };
  } catch (error) {
    console.error('Error generating GPT answer:', error);
    return {
      text: "Sorry, there was an error generating an answer. Please try again later.",
      sources: []
    };
  }
}

/**
 * Extract keywords from a query for document matching
 * @param query User query
 * @returns Array of extracted keywords
 */
function extractKeywords(query: string): string[] {
  return query.toLowerCase()
    .split(/\s+/)
    .filter(word => word.length >= 3) // Skip short words
    .map(word => word.replace(/[^a-z0-9]/g, '')); // Clean up non-alphanumeric characters
}

/**
 * Try to find documents by name using keywords from the query
 * @param collection ChromaDB collection
 * @param keywords Keywords to search for in document names
 * @returns Object with chunks and their metadata if found
 */
async function findDocumentsByName(
  collection: Collection, 
  keywords: string[]
): Promise<{ chunks: string[], metadatas: Record<string, unknown>[] } | null> {
  try {
    // Get all documents from collection
    const allDocs = await collection.get();
    
    if (!allDocs.ids?.length) {
      return null;
    }
    
    // Map of document names to their chunk IDs
    const docNameToIds = new Map<string, string[]>();
    const docNameToScore = new Map<string, number>();
    
    // Extract document names from metadata
    if (allDocs.metadatas) {
      for (let i = 0; i < allDocs.metadatas.length; i++) {
        const metadata = allDocs.metadatas[i];
        if (metadata?.fileName && typeof metadata.fileName === 'string') {
          const fileName = metadata.fileName;
          
          // Add to document map
          if (!docNameToIds.has(fileName)) {
            docNameToIds.set(fileName, []);
            
            // Calculate match score
            const lowerFileName = fileName.toLowerCase();
            const score = keywords.reduce((total, keyword) => 
              total + (lowerFileName.includes(keyword) ? 1 : 0), 0);
            
            if (score > 0) {
              docNameToScore.set(fileName, score);
            }
          }
          
          // Add this chunk ID to the document
          if (allDocs.ids[i]) {
            const ids = docNameToIds.get(fileName);
            if (ids) {
              ids.push(allDocs.ids[i]);
            }
          }
        }
      }
    }
    
    // Get the top matching documents
    const matchingDocs = Array.from(docNameToScore.entries())
      .sort((a, b) => b[1] - a[1]) // Sort by score descending
      .slice(0, 3) // Take top 3
      .map(entry => entry[0]); // Get document names
    
    if (matchingDocs.length === 0) {
      return null;
    }
    
    // Collect chunks from matching documents
    const chunks: string[] = [];
    const metadatas: Record<string, unknown>[] = [];
    
    for (const docName of matchingDocs) {
      const chunkIds = docNameToIds.get(docName) || [];
      
      // Get chunks by IDs
      if (chunkIds.length > 0) {
        const docResult = await collection.get({
          ids: chunkIds,
          include: ['documents', 'metadatas'] as IncludeEnum[]
        });
        
        if (docResult.documents && docResult.metadatas) {
          for (let i = 0; i < docResult.documents.length; i++) {
            if (chunks.length < 10) { // Limit to 10 chunks total
              if (typeof docResult.documents[i] === 'string') {
                chunks.push(docResult.documents[i] as string);
                metadatas.push(docResult.metadatas[i] as Record<string, unknown>);
              }
            } else {
              break;
            }
          }
        }
      }
    }
    
    return chunks.length > 0 ? { chunks, metadatas } : null;
  } catch (error) {
    console.error('Error finding documents by name:', error);
    return null;
  }
}

/**
 * Generate answer to user query using vector search and LLM
 * @param query User question
 * @returns AI-generated answer with citations and sources
 */
export async function answer(query: string): Promise<AnswerResponse> {
  try {
    console.log(`Processing query: "${query}"`);
    
    // Get vector store collection
    const collection = await initVectorStore();
    
    // Generate embedding for query
    const queryEmbedding = await generateEmbedding(query);
    
    // Check if query is related to BAE team meetings
    const relevantIds: string[] = [];
    const baeRelated = query.toLowerCase().includes('bae') || 
                       query.toLowerCase().includes('team meeting');
    
    if (baeRelated) {
      console.log('Detected BAE or meeting related query, doing direct content matching');
      
      // Get all documents from collection to check filenames
      const allIds = await collection.get();
      console.log(`Total documents in collection: ${allIds.ids?.length || 0}`);
      
      // Look for relevant documents based on filename
      if (Array.isArray(allIds.metadatas)) {
        for (let i = 0; i < allIds.metadatas.length; i++) {
          const metadata = allIds.metadatas[i];
          if (metadata && 
              typeof metadata === 'object' && 
              metadata.fileName && 
              typeof metadata.fileName === 'string') {
            const filename = metadata.fileName.toLowerCase();
            if (filename.includes('bae') || filename.includes('team meeting')) {
              console.log(`Found relevant filename match: ${metadata.fileName}`);
              if (allIds.ids?.[i]) {
                relevantIds.push(allIds.ids[i]);
              }
            }
          }
        }
      }
      
      // Also look for keyword matches in content
      if (Array.isArray(allIds.documents)) {
        for (let i = 0; i < allIds.documents.length; i++) {
          const document = allIds.documents[i];
          if (document && typeof document === 'string') {
            const docLower = document.toLowerCase();
            if (docLower.includes('bae') || docLower.includes('team meeting')) {
              if (allIds.ids?.[i] && !relevantIds.includes(allIds.ids[i])) {
                console.log(`Found keyword match in document content for ID: ${allIds.ids[i]}`);
                relevantIds.push(allIds.ids[i]);
              }
            }
          }
        }
      }
      
      console.log(`Found ${relevantIds.length} relevant documents in total`);
    }
    
    // Store search results 
    const chunks: string[] = [];
    const metadatas: Record<string, unknown>[] = [];
    
    // Choose search strategy
    if (relevantIds.length > 0) {
      // If we found direct matches, use those
      console.log('Using direct keyword matches for search');
      const directResults = await collection.get({
        ids: relevantIds,
        include: ['documents', 'metadatas'] as IncludeEnum[]
      });
      
      // Process direct results
      if (directResults.documents && directResults.metadatas) {
        for (let i = 0; i < directResults.documents.length; i++) {
          if (typeof directResults.documents[i] === 'string') {
            chunks.push(directResults.documents[i] as string);
            metadatas.push(directResults.metadatas[i] as Record<string, unknown>);
          }
        }
      }
    } else {
      // Otherwise do a vector search
      console.log('Using vector search');
      const vectorResults = await collection.query({
        queryEmbeddings: [queryEmbedding],
        nResults: 15,
        include: ['documents', 'metadatas'] as IncludeEnum[]
      });
      
      // Process vector results which come in a nested array format
      if (vectorResults.documents?.[0] && vectorResults.metadatas?.[0]) {
        const resultDocs = vectorResults.documents[0];
        const resultMetas = vectorResults.metadatas[0];
        
        for (let i = 0; i < resultDocs.length; i++) {
          if (typeof resultDocs[i] === 'string') {
            chunks.push(resultDocs[i] as string);
            metadatas.push(resultMetas[i] as Record<string, unknown>);
          }
        }
      }
    }
    
    console.log(`Found ${chunks.length} chunks with ${metadatas.length} metadata items`);
    
    // If no chunks found in vector search, try smart fallback methods
    if (chunks.length === 0) {
      console.log('Vector search returned no results, trying smart fallback methods');
      
      // FALLBACK METHOD 1: Try to find documents by name match directly
      const keywords = extractKeywords(query);
      console.log('Trying direct document name matching with keywords:', keywords);
      
      const matchResult = await findDocumentsByName(collection, keywords);
      if (matchResult) {
        console.log(`Found ${matchResult.chunks.length} chunks from document name matching`);
        const { context, citationMap } = formatContextChunks(matchResult.chunks, matchResult.metadatas);
        return await generateGptAnswer(query, context, citationMap, matchResult.metadatas);
      }
      
      // FALLBACK METHOD 2: Try text cache with keyword search
      try {
        console.log('Trying text cache fallback search');
        const cacheResults = await searchTextCache(query);
        
        if (cacheResults.length > 0) {
          console.log(`Found ${cacheResults.length} results in text cache`);
          
          // Sort by relevance using keyword matching
          const queryKeywords = new Set(extractKeywords(query));
          const scoredResults = cacheResults.map(result => {
            let score = 0;
            const lowerText = result.text.toLowerCase();
            const lowerFileName = result.fileName.toLowerCase();
            
            // Score based on keyword matches
            for (const keyword of queryKeywords) {
              if (lowerText.includes(keyword)) score++;
              if (lowerFileName.includes(keyword)) score += 2; // Higher score for filename matches
            }
            
            return { ...result, score };
          });
          
          // Take top matches
          scoredResults.sort((a, b) => b.score - a.score);
          const topResults = scoredResults.slice(0, 3);
          
          if (topResults.some(r => r.score > 0)) {
            let context = '';
            for (const result of topResults) {
              context += `DOCUMENT: ${result.fileName}\n\n`;
              context += `${result.text}\n\n---\n\n`;
            }
            
            // Create a basic citation map for text cache results
            const citationMap = new Map<string, number>();
            const textCacheMetadatas = topResults.map((result, index) => {
              const key = `${result.fileName}#0`;
              citationMap.set(key, index + 1);
              return {
                fileName: result.fileName,
                chunkIndex: 0,
                totalChunks: 1
              };
            });
            
            return await generateGptAnswer(query, context, citationMap, textCacheMetadatas);
          }
        }
      } catch (error) {
        console.error('Error during text cache search:', error);
      }
      
      // If all fallback methods failed
      return {
        text: "I don't have enough information to answer that question. Please try asking something else or check if the documents have been properly ingested.",
        sources: []
      };
    }
    
    // Format chunks into context string and generate answer
    const { context, citationMap } = formatContextChunks(chunks, metadatas as Record<string, unknown>[]);
    return await generateGptAnswer(query, context, citationMap, metadatas as Record<string, unknown>[]);
  } catch (error) {
    console.error('Error answering query:', error);
    return {
      text: `Error processing your question: ${error instanceof Error ? error.message : 'Unknown error'}`,
      sources: []
    };
  }
}