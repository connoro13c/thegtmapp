/**
 * This file contains implementation code that can be directly copied and pasted
 * into the ChatbotService.ts file to integrate with the enhanced GoogleDriveService.
 */

// ===== STEP 1: Add to class definition =====
// Add this to the ChatbotService class definition
private responseCache: Map<string, {response: string, timestamp: Date}> = new Map();

// ===== STEP 2: Modify loadDocumentsFromDrive =====
// In loadDocumentsFromDrive method, after setting content in folderContents:
if (content.length > minLength && !isErrorContent) {
  console.log(`Successfully loaded content from ${file.name}: ${content.length} characters`);
  this.folderContents.set(file.name, content);
  
  // Process document chunks for semantic search
  try {
    // Don't wait for this to complete, do it in the background
    if (typeof googleDriveService.chunkDocument === 'function') {
      googleDriveService.chunkDocument(file.id, file.name, content, file.mimeType)
        .catch(chunkError => {
          console.error(`Error chunking document ${file.name}:`, chunkError);
        });
    }
  } catch (chunkError) {
    console.error(`Error initiating chunking for ${file.name}:`, chunkError);
  }
} else {
  console.log(`Skipping file with insufficient content: ${file.name} - Content: ${content.substring(0, Math.min(100, content.length))}...`);
}

// ===== STEP 3: Update processMessage for semantic search =====
// Replace the relevantDocs initialization in processMessage

// Try to use embedding-based search first
let relevantDocs: Map<string, number> = new Map();
let embeddingSearchSuccessful = false;

try {
  // Check if we can use semantic search
  if (typeof googleDriveService.findRelevantChunks === 'function') {
    console.log('Using embedding-based semantic search');
    const topChunks = await googleDriveService.findRelevantChunks(message, 8);
    
    if (topChunks && topChunks.length > 0) {
      embeddingSearchSuccessful = true;
      console.log(`Found ${topChunks.length} relevant chunks via embeddings`);
      
      // Group by file and assign relevance scores
      topChunks.forEach((chunk, index) => {
        // Higher rank = higher score, with exponential decay
        const score = 100 * Math.pow(0.9, index);
        const currentScore = relevantDocs.get(chunk.fileName) || 0;
        relevantDocs.set(chunk.fileName, currentScore + score);
        
        console.log(`Chunk from ${chunk.fileName} (score: ${score.toFixed(2)})`);
      });
    }
  }
} catch (embeddingError) {
  console.error('Error using embedding-based search:', embeddingError);
}

// If embedding search failed or not available, use keyword matching
if (!embeddingSearchSuccessful) {
  console.log('Falling back to keyword-based search');
  
  // Continue with existing keyword matching code...
  const queryTerms = message.toLowerCase()
    .replace(/[.,?!;:()\[\]{}'-]/g, '') // Remove punctuation
    .split(/\s+/)
    .filter(term => term.length > 2); // Filter short words
  
  console.log('Search terms:', queryTerms);

  // Continue with the rest of the existing keyword matching code...

// ===== STEP 4: Add response caching =====
// Add this before final API call in processMessage

// Check cache for recent identical queries
const cacheKey = message.toLowerCase().trim();
const cachedResponse = this.responseCache.get(cacheKey);
if (cachedResponse) {
  const cacheAge = new Date().getTime() - cachedResponse.timestamp.getTime();
  // Use cache if less than 5 minutes old
  if (cacheAge < 5 * 60 * 1000) {
    console.log('Using cached response for identical query');
    return cachedResponse.response;
  }
}

// After getting response from API, add this before returning:
const responseToReturn = response.choices[0]?.message.content?.trim() || "I'm sorry, I couldn't process your request.";

// Cache the response
this.responseCache.set(cacheKey, {
  response: responseToReturn,
  timestamp: new Date()
});

return responseToReturn;

// ===== STEP 5: Update system prompt for meeting content =====
// Enhance the system prompt for meeting/presentation content

if (isMeetingOrPresentationRequest) {
  systemPrompt = `You are a helpful GTM (Go-to-Market) assistant that provides detailed information about meetings and presentations.

You have access to the following document chunks from meeting notes and presentation slides. EXTRACT and PRESENT the specific information the user is asking about:

${documentsContext}

CRITICAL INSTRUCTIONS:
1. NEVER say "I don't have that information" unless you've thoroughly checked all content.
2. For specific questions about data points, metrics, or business information, DIRECTLY provide those specific details.
3. Pay special attention to slide content that contains:
   - Numbers, percentages, and metrics
   - Dates and timelines
   - Company and product names
   - Action items and decisions
4. Structure your response with clear headings and bullet points that match how they appear in slides.
5. ALWAYS include exact figures and data mentioned - be precise with numbers.
6. CITE the source slide or meeting for all information.
7. When dealing with follow-up questions, focus on providing MORE SPECIFIC DETAILS.
8. DO NOT apologize or explain why you don't have data - focus entirely on what you can extract.
`;
}