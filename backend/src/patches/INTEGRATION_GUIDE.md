# Integration Guide for Enhanced Document Processing

This guide outlines the steps to integrate the improved GoogleDriveService capabilities with the ChatbotService for better document handling.

## Prerequisites

1. The enhanced GoogleDriveService is already implemented with:
   - Document chunking
   - Embedding generation
   - Improved text extraction
   - Semantic search capabilities

2. Required dependencies:
   - office-text-extractor
   - mammoth
   - OpenAI SDK

## Implementation Steps

### Step 1: Backup Files

Before making changes, backup the original versions of the files:

```bash
cp backend/src/services/chatbotService.ts backend/src/services/chatbotService.ts.bak
```

### Step 2: Update ChatbotService Class Definition

Add response caching to the ChatbotService class definition:

```typescript
private responseCache: Map<string, {response: string, timestamp: Date}> = new Map();
```

### Step 3: Update loadDocumentsFromDrive Method

Modify the loadDocumentsFromDrive method to process document chunks for each file loaded:

1. Find the section where files are processed and content is added to folderContents
2. After the line `this.folderContents.set(file.name, content);`, add the document chunking code

```typescript
// Add after setting content in folderContents
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
```

### Step 4: Update processMessage Method for Semantic Search

1. Find the section in processMessage where relevantDocs is initialized and keyword matching begins
2. Replace it with the embedding-based search code:

```typescript
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

// If embedding search failed or not available, use keyword matching as fallback
if (!embeddingSearchSuccessful) {
  console.log('Falling back to keyword-based search');
  
  const queryTerms = message.toLowerCase()
    .replace(/[.,?!;:()\[\]{}'-]/g, '') // Remove punctuation
    .split(/\s+/)
    .filter(term => term.length > 2); // Filter short words
  
  console.log('Search terms:', queryTerms);
```

3. Keep the rest of the keyword matching code after this block

### Step 5: Add Response Caching

1. Find the section where the API call to OpenAI is made
2. Add caching check before the API call:

```typescript
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
```

3. After processing the response, add caching code:

```typescript
// Add before returning the response
this.responseCache.set(cacheKey, {
  response: finalResponse,
  timestamp: new Date()
});
```

### Step 6: Update System Prompt for Meeting Content

1. Find the section where the system prompt is created for meeting/presentation queries
2. Update it to better handle specific details:

```typescript
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
```

## Verification Steps

### Step 1: Verify Dependencies

Make sure all required dependencies are installed:

```bash
cd backend
npm list office-text-extractor mammoth
```

If not installed, add them:

```bash
npm install --save office-text-extractor mammoth
```

### Step 2: Check for Type Errors

Compile TypeScript to check for type errors:

```bash
cd backend
npm run build
```

Fix any type errors that appear.

### Step 3: Test Document Loading

1. Start the backend server
2. Check logs when documents are loaded from Google Drive
3. Verify that document chunking is being performed
4. Look for log messages about embedding generation

### Step 4: Test Semantic Search

1. Make a simple query about content in your documents
2. Check logs to see if embedding-based search is used
3. Verify that relevant chunks are found and scored

### Step 5: Test Response Quality

1. Ask specific questions about meeting content
2. Ask follow-up questions for more details
3. Verify that responses contain specific data points and exact figures

## Troubleshooting

### Embedding Generation Errors

If you see errors related to embedding generation:

1. Check that OpenAI API key is valid and has embeddings access
2. Verify that the text being embedded is not too large
3. Check for rate limiting issues

### Document Chunking Errors

If document chunking fails:

1. Check logs for specific error messages
2. Verify that the file content is valid and not corrupted
3. Try processing smaller files first

### Semantic Search Not Working

If semantic search fails to find relevant content:

1. Check if embeddings are being generated correctly
2. Verify that document chunks are being stored
3. Try simpler queries with exact terms from the documents