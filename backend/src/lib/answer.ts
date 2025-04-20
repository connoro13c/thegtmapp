import { OpenAI } from 'openai';
import { vectorSearch, initVectorStore } from './vectorStore';
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
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    
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

// Type for source in the citation
export interface Source {
  id: string;
  label: string;
  url: string;
}

// Type for context in the citation
export interface Context {
  id: string;
  text: string;
}

// Type for the enhanced response format
export interface AnswerResponse {
  answer: string;
  sources: Source[];
  context: Context[];
}

/**
 * Format document chunks with metadata into a readable context string with citations
 * @param chunks Array of document chunk texts
 * @param metadatas Array of metadata for each chunk
 * @returns Object with formatted context string, sources, context details, and citation mapping
 */
function formatContextChunks(chunks: string[], metadatas: Record<string, unknown>[]): { 
  context: string; 
  sources: Source[]; 
  contextDetails: Context[];
  citationMap: Map<string, number>;
} {
  // Create citation mapping
  const citationMap = new Map<string, number>();
  const sources: Source[] = [];
  const contextDetails: Context[] = [];
  let nextCitationNum = 1;
  let context = '';
  
  function cite(chunkId: string, fileName: string, url: string, preview: string): string {
    if (!citationMap.has(chunkId)) {
      const id = String(nextCitationNum);
      citationMap.set(chunkId, nextCitationNum++);
      
      // Add to sources array
      sources.push({ 
        id, 
        label: fileName, 
        url 
      });
      
      // Add to context array
      contextDetails.push({
        id,
        text: preview
      });
    }
    
    return `[^${citationMap.get(chunkId)}]`;
  }
  
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    const metadata = metadatas[i] || {};
    const fileName = metadata.fileName as string || 'Unknown';
    const chunkId = `${fileName}:${metadata.chunkIndex ?? i}`;
    
    // Generate a URL for the source
    let url = '';
    if (metadata.fileId) {
      url = `https://drive.google.com/file/d/${metadata.fileId}/view`;
    } else {
      url = '#'; // Fallback URL
    }
    
    // Create a short preview (first 100 chars)
    const preview = chunk.trim().substring(0, 100) + (chunk.length > 100 ? '...' : '');
    
    // Add citation marker at the end of each chunk
    const citation = cite(chunkId, fileName, url, preview);
    context += `${chunk.trim()} ${citation}\n\n---\n\n`;
  }
  
  return { context, sources, contextDetails, citationMap };
}

/**
 * Generate an AI answer based on document context with citations
 * @param query User's question
 * @param context Document context to use for answering
 * @param sources Array of sources
 * @param contextDetails Array of context details
 * @returns AI-generated answer with citation information
 */
async function generateGptAnswer(query: string, context: string, sources: Source[], contextDetails: Context[]): Promise<AnswerResponse> {
  // Create prompt for GPT
  const prompt = `You are a GTM analyst.

TASK: Read the context and answer the user's question in three sections:

### Synopsis  
• 3–4 bullets, ≤ 15 words each, objective facts with inline cites [^n].

### Insights  
• 2–3 bullets explaining *why* those facts matter, without new numbers.

### Next Steps  
• 2 concrete actions a sales‑ops person should take next week.

Rules  
• Use Markdown.  
• Keep each bullet on one line.  
• End every fact bullet in the Synopsis section with an inline citation [^n] that maps to the source list.
• Do NOT create citations that are not in the context.
• If the provided context doesn't contain information to answer the question, say "I don't have enough information to answer this question based on the provided documents."

CONTEXT
-------
${context}
-------
QUESTION: ${query}`;

  // Initialize OpenAI client
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  try {
    // Call OpenAI API
    const response = await openai.chat.completions.create({
      model: 'gpt-4o', // Using GPT-4 for best quality answers
      messages: [
        { role: 'system', content: 'You are a GTM analyst that provides structured, concise, and actionable answers.' },
        { role: 'user', content: prompt }
      ],
      max_tokens: 350,
      temperature: 0.25, // Lower temperature for more focused answers
    });

    const answer = response.choices[0]?.message?.content || 'Unable to generate an answer.';

    return {
      answer,
      sources,
      context: contextDetails
    };
  } catch (error) {
    console.error('Error generating answer with OpenAI:', error);
    throw error;
  }
}

/**
 * Generate answer to user query using vector search and LLM
 * @param query User question
 * @returns AI-generated answer with citations and sources
 */
export async function answer(question: string): Promise<AnswerResponse> {
  try {
    // First, try to get results from vector search
    const { chunks, metadatas, fallbackMode } = await vectorSearch(question, 5);
    
    if (chunks.length === 0) {
      // No results found
      return {
        answer: "I couldn't find any relevant information in the documents to answer your question.",
        sources: [],
        context: []
      };
    }
    
    // Format the chunks for context
    const { context, sources, contextDetails } = formatContextChunks(chunks, metadatas);
    
    // Generate the answer
    const answer = await generateGptAnswer(question, context, sources, contextDetails);
    
    if (fallbackMode) {
      console.log('Used fallback text search mode.');
    }
    
    return answer;
  } catch (error) {
    console.error('Error in answer generation:', error);
    return {
      answer: 'Sorry, I encountered an error while trying to answer your question.',
      sources: [],
      context: []
    };
  }
}