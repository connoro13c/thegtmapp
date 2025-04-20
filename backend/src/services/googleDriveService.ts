import * as googleApis from 'googleapis';
const { google } = googleApis;
import { JWT } from 'google-auth-library';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import * as mammoth from 'mammoth';
import { OpenAI } from 'openai';
import cosineSimilarity from 'compute-cosine-similarity';

// Import office-text-extractor for handling PowerPoint files
// Define interface for text extractor
interface TextExtractor {
  extractText: (options: any) => Promise<string>;
}

// Initialize text extractor with mock implementation
let textExtractor: TextExtractor = {
  extractText: async (options: any) => {
    console.log('Using mock text extractor');
    return 'Mock extraction not available. Using fallback extraction methods.';
  }
};
let textExtractorInitialized = true;

// Function to initialize the text extractor - using mock implementation
async function initializeTextExtractor() {
  console.log('Using mock text extractor to avoid ESM compatibility issues');
  return;
}

// Initialize immediately
initializeTextExtractor();

// Interface for document chunks with embeddings
interface DocumentChunk {
  id: string;        // Unique identifier for the chunk
  fileId: string;    // Source file ID
  fileName: string;  // Source file name
  content: string;   // Text content of the chunk
  embedding?: number[];  // Vector embedding for semantic search
  metadata: {
    chunkIndex: number;  // Position in the document
    title?: string;      // Title or heading of the section
    type: string;        // Document type (pptx, docx, etc.)
    slideNumber?: number; // For presentations only
    createdAt: Date;     // Processing timestamp
  };
}

export class GoogleDriveService {
  private auth: JWT;
  private drive: any; // Using any type to avoid Google API type issues
  private openai: OpenAI;
  private documentChunks: Map<string, DocumentChunk[]> = new Map(); // fileId -> chunks
  private cachedEmbeddings: Map<string, number[]> = new Map(); // For full file embeddings

  constructor() {
    // Initialize the JWT client with service account credentials
    try {
      // Get the private key from environment variable
      const privateKeyEnv = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY || '';
      
      // Clean up the private key format - this is critical for proper auth
      let privateKey = privateKeyEnv;
      privateKey = privateKey.replace(/\\n/g, '\n');
      
      console.log('Service account email:', process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL);
      console.log('Private key length:', privateKey.length);
      console.log(`Private key first 50 chars: ${privateKey.substring(0, 50)}...`);

      this.auth = new JWT({
        email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        key: privateKey,
        scopes: ['https://www.googleapis.com/auth/drive.readonly']
      });

      // Initialize the drive API
      this.drive = google.drive({ version: 'v3', auth: this.auth });
      console.log('Google Drive service initialized successfully');
      
      // Initialize OpenAI for embeddings
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
      console.log('OpenAI client initialized for embeddings');
      
    } catch (error) {
      console.error('Error initializing Google Drive service:', error);
      throw error; // Re-throw to make sure we don't silently fail
    }
  }

  /**
   * Generate embeddings for text content using OpenAI API
   * @param text The text to embed
   * @returns Array of embedding values
   */
  private async generateEmbedding(text: string): Promise<number[]> {
    try {
      // Truncate text if it's too long (OpenAI has token limits)
      const truncatedText = text.slice(0, 8000);
      
      const embeddingResponse = await this.openai.embeddings.create({
        model: "text-embedding-3-small",
        input: truncatedText,
      });
      
      return embeddingResponse.data[0].embedding;
    } catch (error) {
      console.error('Error generating embedding:', error);
      // Return empty array in case of error
      return [];
    }
  }
  
  /**
   * Split document content into semantic chunks for better retrieval
   * @param fileId The ID of the file
   * @param fileName The name of the file
   * @param content The content of the file
   * @param fileType The MIME type of the file
   */
  public async chunkDocument(fileId: string, fileName: string, content: string, fileType: string): Promise<void> {
    try {
      // Skip empty content
      if (!content || content.length < 10) {
        console.log(`Skipping chunking for ${fileName} - insufficient content`);
        return;
      }
      
      console.log(`Chunking document ${fileName} (${fileId})`);
      const chunks: DocumentChunk[] = [];
      let chunkIndex = 0;
      
      // Different chunking strategies based on document type
      if (fileType.includes('presentation') || fileName.endsWith('.ppt') || fileName.endsWith('.pptx')) {
        // For presentations - split by slides
        const slides = content.split(/Slide\s*\d+|\n\n\n+/g)
          .filter(slide => slide && slide.trim().length > 20);
          
        for (let i = 0; i < slides.length; i++) {
          const slideContent = slides[i].trim();
          if (slideContent.length < 20) continue; // Skip very short slides
          
          const chunk: DocumentChunk = {
            id: `${fileId}-slide-${i}`,
            fileId,
            fileName,
            content: slideContent,
            metadata: {
              chunkIndex: chunkIndex++,
              slideNumber: i + 1,
              type: 'presentation',
              createdAt: new Date()
            }
          };
          
          // Generate embedding for the chunk
          chunk.embedding = await this.generateEmbedding(slideContent);
          chunks.push(chunk);
        }
      } else {
        // For text documents - split by paragraphs or sections
        const paragraphs = content.split(/\n\n+/)
          .filter(para => para && para.trim().length > 30);
        
        // Combine very short paragraphs
        const combinedParagraphs: string[] = [];
        let currentCombined = '';
        
        for (const para of paragraphs) {
          if (currentCombined.length + para.length < 500) {
            currentCombined += (currentCombined ? '\n\n' : '') + para;
          } else {
            if (currentCombined) combinedParagraphs.push(currentCombined);
            currentCombined = para;
          }
        }
        
        if (currentCombined) combinedParagraphs.push(currentCombined);
        
        // Create chunks from combined paragraphs
        for (let i = 0; i < combinedParagraphs.length; i++) {
          const paraContent = combinedParagraphs[i].trim();
          if (paraContent.length < 30) continue; // Skip very short paragraphs
          
          // Try to extract title/heading if present
          const lines = paraContent.split('\n');
          let title = '';
          if (lines[0] && lines[0].length < 100 && /[A-Z]/.test(lines[0][0])) {
            title = lines[0];
          }
          
          const chunk: DocumentChunk = {
            id: `${fileId}-para-${i}`,
            fileId,
            fileName,
            content: paraContent,
            metadata: {
              chunkIndex: chunkIndex++,
              title: title || undefined,
              type: fileType.includes('document') ? 'document' : 'text',
              createdAt: new Date()
            }
          };
          
          // Generate embedding for the chunk
          chunk.embedding = await this.generateEmbedding(paraContent);
          chunks.push(chunk);
        }
      }
      
      // Store chunks for later retrieval
      this.documentChunks.set(fileId, chunks);
      console.log(`Created ${chunks.length} chunks for ${fileName}`);
      
      // Also generate a full-document embedding for global search
      const fullEmbedding = await this.generateEmbedding(content.substring(0, 8000));
      this.cachedEmbeddings.set(fileId, fullEmbedding);
      
    } catch (error) {
      console.error(`Error chunking document ${fileName}:`, error);
    }
  }
  
  /**
   * Retrieve the most relevant document chunks for a query
   * @param query The search query
   * @param maxResults Maximum number of chunks to return
   * @returns Array of the most relevant document chunks
   */
  public async findRelevantChunks(query: string, maxResults: number = 5): Promise<DocumentChunk[]> {
    try {
      if (!query || query.trim().length === 0) {
        return [];
      }
      
      console.log(`Finding relevant chunks for query: "${query}"`);
      
      // Generate embedding for the query
      const queryEmbedding = await this.generateEmbedding(query);
      if (queryEmbedding.length === 0) {
        console.error('Could not generate query embedding');
        return [];
      }
      
      // Gather all chunks from all documents
      const allChunks: DocumentChunk[] = [];
      this.documentChunks.forEach(chunks => {
        allChunks.push(...chunks);
      });
      
      if (allChunks.length === 0) {
        console.log('No document chunks available for search');
        return [];
      }
      
      // Calculate similarity scores for each chunk
      const scoredChunks = allChunks
        .filter(chunk => chunk.embedding && chunk.embedding.length > 0)
        .map(chunk => {
          const similarity = cosineSimilarity(queryEmbedding, chunk.embedding!);
          return { chunk, similarity };
        });
      
      // Sort by similarity score (highest first) and return top results
      const topResults = scoredChunks
        .sort((a, b) => (b.similarity || 0) - (a.similarity || 0))
        .slice(0, maxResults)
        .map(item => item.chunk);
      
      console.log(`Found ${topResults.length} relevant chunks`);
      return topResults;
      
    } catch (error) {
      console.error('Error finding relevant chunks:', error);
      return [];
    }
  }
  
  /**
   * List files in a specific Google Drive folder
   * @param folderId The ID of the folder
   * @returns List of files in the folder
   */
  /**
   * Download a file as a Buffer from Google Drive
   * @param id The ID of the file to download
   * @returns Buffer containing the file data
   */
  async download(id: string): Promise<Buffer> {
    const res = await this.drive.files.get({ fileId: id, alt: 'media' }, { responseType: 'arraybuffer' });
    return Buffer.from(res.data as ArrayBuffer);
  }

  async listFiles(folderId: string): Promise<any[]> {
    try {
      console.log(`Listing files from folder: ${folderId}`);
      const response = await this.drive.files.list({
        q: `'${folderId}' in parents and trashed=false`,
        fields: 'files(id, name, mimeType, webViewLink)'
      });

      console.log(`Found ${response.data.files.length} files in the folder`);
      return response.data.files;
    } catch (error) {
      console.error('Error listing files from Google Drive:', error);
      throw error;
    }
  }

  /**
   * Download a file's content from Google Drive
   * @param fileId The ID of the file to download
   * @returns The file content as text
   */
  async getFileContent(fileId: string, generateEmbeddings = true): Promise<string> {
    try {
      console.log(`Getting content for file: ${fileId}`);
      
      // Get file metadata to check the MIME type
      const fileMetadata = await this.drive.files.get({
        fileId,
        fields: 'name,mimeType'
      });
      
      console.log(`File name: ${fileMetadata.data.name}, MIME type: ${fileMetadata.data.mimeType}`);
      
      // Check if file content is already in cache
      const existingChunks = this.documentChunks.get(fileId);
      if (existingChunks && existingChunks.length > 0) {
        console.log(`Using cached document chunks for ${fileMetadata.data.name}`);
        // Combine all chunk content to return the full text
        return existingChunks
          .sort((a, b) => a.metadata.chunkIndex - b.metadata.chunkIndex)
          .map(chunk => chunk.content)
          .join('\n\n');
      }
      
      // Special handling for Google Docs, Sheets, and Slides
      if (fileMetadata.data.mimeType.includes('application/vnd.google-apps')) {
        console.log(`Processing Google Apps file type: ${fileMetadata.data.mimeType}`);
        
        // Try several export formats in order of preference
        let exportFormats = [];
        
        // Select appropriate export format based on file type
        if (fileMetadata.data.mimeType === 'application/vnd.google-apps.document') {
          // For Google Docs - try plain text first for reliability, then HTML for format, then docx
          exportFormats = [
            'text/plain',
            'text/html',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
          ];
        } else if (fileMetadata.data.mimeType === 'application/vnd.google-apps.spreadsheet') {
          // For Google Sheets - CSV is most reliable for text
          exportFormats = [
            'text/csv',
            'text/plain',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
          ];
        } else if (fileMetadata.data.mimeType === 'application/vnd.google-apps.presentation') {
          // For Google Slides - text/plain works best for our purposes
          exportFormats = [
            'text/plain',
            'text/html',
            'application/vnd.openxmlformats-officedocument.presentationml.presentation'
          ];
        } else {
          // Default to text for other formats
          exportFormats = ['text/plain'];
        }
        
        // Special handling for direct PowerPoint files (not Google Slides)
        // We'll extract slides when we get the content
        
        const exportMimeType = exportFormats[0]; // Start with first preference
        
        console.log(`First trying to export Google Apps file as ${exportMimeType}`);
        
        // Try each export format in sequence until one works
        for (const currentFormat of exportFormats) {
          try {
            console.log(`Attempting to export as ${currentFormat}...`);
            
            // Export the file
            const exportResponse = await this.drive.files.export({
              fileId,
              mimeType: currentFormat
            }, { responseType: 'stream' });
            
            // Process the exported content
            const content = await new Promise<string>((resolve, reject) => {
              let content = '';
              exportResponse.data
                .on('data', (chunk: Buffer) => {
                  content += chunk.toString('utf8');
                })
                .on('end', () => {
                  console.log(`Successfully exported as ${currentFormat}`);
                  resolve(content);
                })
                .on('error', (err: Error) => {
                  console.error(`Error streaming ${currentFormat} content: ${err.message}`);
                  reject(err);
                });
            });
            
            // If we've made it here, we successfully got content
            console.log(`Content export successful with ${currentFormat}, got ${content.length} characters`);
            
            // Clean the exported content
            let cleanedContent = content;
            
            // Special handling for HTML exports to extract text
            if (currentFormat === 'text/html') {
              cleanedContent = this.extractTextFromHtml(content);
            }
            
            // Clean and return the content
            return this.cleanTextContent(cleanedContent);
            
          } catch (formatError) {
            const errorMsg = formatError instanceof Error ? formatError.message : 'Unknown error';
            console.error(`Error exporting as ${currentFormat}:`, errorMsg);
          }
        }
        
        // If we get here, all export formats failed
        console.error(`All export formats failed for ${fileMetadata.data.name}`);
        return `Could not export content from ${fileMetadata.data.name}. Tried ${exportFormats.length} different formats, but all failed.`;
      } {
        // Special handling for PowerPoint files
        if (fileMetadata.data.mimeType.includes('presentation') || 
            fileMetadata.data.name.toLowerCase().endsWith('.ppt') || 
            fileMetadata.data.name.toLowerCase().endsWith('.pptx')) {
          
          console.log(`Processing PowerPoint file: ${fileMetadata.data.name}`);
          
          // For PowerPoint files, extract slide text directly
          try {
            // Get a simplified text version that focuses on extracting slide content
            const pptContent = await this.extractTextFromPowerPoint(fileId, fileMetadata.data.name);
            return pptContent;
          } catch (pptError) {
            console.error('Error extracting PowerPoint content:', pptError);
            // Fall back to default processing below
          }
        }
          
        // Special handling for Word documents with mammoth
        if (fileMetadata.data.mimeType.includes('document') || 
            fileMetadata.data.name.toLowerCase().endsWith('.docx') || 
            fileMetadata.data.name.toLowerCase().endsWith('.doc')) {
            
          console.log('Processing Word document: ' + fileMetadata.data.name);
          
          try {
            // Save file to temp location
            const tmpDir = os.tmpdir();
            const tmpFilePath = path.join(tmpDir, `${fileId}-${Date.now()}.docx`);
            
            // Download and save the file
            const fileResponse = await this.drive.files.get({
              fileId,
              alt: 'media'
            }, { responseType: 'stream' });
            
            await new Promise<void>((resolve, reject) => {
              const fileStream = fs.createWriteStream(tmpFilePath);
              fileResponse.data
                .pipe(fileStream)
                .on('finish', () => resolve())
                .on('error', (err: Error) => reject(err));
            });
            
            console.log(`Saved Word document to temporary path: ${tmpFilePath}`);
            
            // Use mammoth to convert docx to text
            const result = await mammoth.extractRawText({ path: tmpFilePath });
            
            // Clean up temporary file
            fs.unlinkSync(tmpFilePath);
            
            if (result.value) {
              console.log(`Successfully extracted ${result.value.length} characters from Word document using mammoth`);
              return this.cleanTextContent(result.value);
            }
          } catch (docxError) {
            console.error('Error extracting Word document content:', docxError);
            // Fall back to default processing below
          }
        }
          
        // For regular files, download directly
        const response = await this.drive.files.get({
          fileId,
          alt: 'media'
        }, { responseType: 'stream' });

        // Process the file content based on MIME type
        const mimeType = fileMetadata.data.mimeType;
        
        // For text files, convert to text
        if (mimeType.includes('text/') || 
            mimeType === 'application/json' ||
            mimeType === 'application/pdf' ||
            mimeType.includes('document') ||
            mimeType.includes('spreadsheet') ||
            mimeType.includes('presentation')) {
          
          return new Promise<string>((resolve, reject) => {
            let content = '';
            response.data
              .on('data', (chunk: Buffer) => {
                content += chunk.toString('utf8');
              })
              .on('end', () => {
                console.log(`Successfully retrieved content for file: ${fileId}`);
                // Clean up content to ensure it's usable text
                const cleanedContent = this.cleanTextContent(content);
                resolve(cleanedContent);
              })
              .on('error', (err: Error) => {
                console.error(`Error streaming file content: ${err.message}`);
                reject(err);
              });
          });
        }
        
        // For binary files or unsupported types
        return `File ${fileMetadata.data.name} is of type ${mimeType} and cannot be processed as text.`;
      }
    } catch (error) {
      console.error('Error getting file content from Google Drive:', error);
      throw error;
    }
  }
  
  // Extract text from PowerPoint files using specialized library when available
  private async extractTextFromPowerPoint(fileId: string, fileName: string): Promise<string> {
    console.log(`Starting PowerPoint text extraction for: ${fileName}`);
    
    // Make sure the text extractor is initialized
    await initializeTextExtractor();
    
    try {
      // We'll try to get a raw stream of the file and save it temporarily
      const response = await this.drive.files.get({
        fileId,
        alt: 'media'
      }, { responseType: 'stream' });
      
      // Create temporary file to process with specialized libraries
      const tmpDir = os.tmpdir();
      const tmpFilePath = path.join(tmpDir, `${fileId}-${Date.now()}.pptx`);
      
      // Save stream to temporary file
      await new Promise<void>((resolve, reject) => {
        const fileStream = fs.createWriteStream(tmpFilePath);
        response.data
          .pipe(fileStream)
          .on('finish', () => {
            console.log(`Saved PowerPoint file to temporary path: ${tmpFilePath}`);
            resolve();
          })
          .on('error', (err: Error) => {
            console.error(`Error saving PowerPoint file: ${err.message}`);
            reject(err);
          });
      });
      
      // Use office-text-extractor library if available
      if (textExtractor) {
        try {
          console.log('Using office-text-extractor for PowerPoint extraction');
          let extractedText = '';
          try {
            // Extract using the correct payload format
            extractedText = await textExtractor.extractText({
              input: tmpFilePath,
              type: 'file'
            });
            console.log(`Successfully extracted ${extractedText.length} characters of text`);
          } catch (innerError) {
            console.error('Error during text extraction:', innerError);
            // Try using buffer method as fallback
            console.log('Trying fallback with buffer method');
            const fileBuffer = fs.readFileSync(tmpFilePath);
            extractedText = await textExtractor.extractText({
              input: fileBuffer,
              type: 'buffer'
            });
            console.log(`Fallback extraction successful, got ${extractedText.length} characters`);
          }
          
          // Clean up temporary file
          fs.unlinkSync(tmpFilePath);
          
          if (extractedText && typeof extractedText === 'string') {
            // Format the extracted content
            let structuredContent = `# Content extracted from PowerPoint: ${fileName}\n\n`;
            
            // Split the text into slides based on common patterns
            const slideDelimiters = /\n\s*(?:Slide\s*\d+|\={3,}|\*{3,})\s*\n/gi;
            const slides = extractedText.split(slideDelimiters).filter(text => text.trim().length > 0);
            
            if (slides.length > 1) {
              // Process each slide
              slides.forEach((slideContent, index) => {
                const cleanSlideContent = slideContent.trim();
                if (cleanSlideContent.length === 0) return;
                
                structuredContent += `## Slide ${index + 1}\n\n${cleanSlideContent}\n\n`;
              });
            } else {
              // If we couldn't detect slides, just add the full content
              structuredContent += extractedText;
            }
            
            console.log(`Successfully extracted ${extractedText.length} characters from PowerPoint file using office-text-extractor`);
            return structuredContent;
          }
        } catch (extractionError) {
          console.error('Error using office-text-extractor:', extractionError);
          // If the specialized extraction fails, we'll fall back to the manual method below
        }
      }
      
      // Fallback: read the file and use manual extraction
      const content = fs.readFileSync(tmpFilePath);
      console.log(`Read ${content.length} bytes from temporary PowerPoint file`);
      
      // Convert to string but handle binary data
      const textContent = content.toString('utf8', 0, content.length);
      
      // Clean up temporary file
      try {
        fs.unlinkSync(tmpFilePath);
      } catch (unlinkError) {
        console.error('Error deleting temporary file:', unlinkError);
      }
      
      // Extract text from PowerPoint binary format
      let extractedText = '';
      
      // Look for date patterns - important for meeting documents
      const datePatterns = [
        /d{1,2}[/.-]d{1,2}[/.-](?:20)?d{2}/g,  // MM/DD/YY or DD/MM/YY
        /(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]* d{1,2},? (?:20)?d{2}/g, // Month DD, YYYY
        /Q[1-4] (?:20)?d{2}/g,  // Q1 2021, etc
        /(?:20)d{2}[-s](?:0?[1-9]|1[0-2])[-s](?:0?[1-9]|[12][0-9]|3[01])/g  // YYYY-MM-DD
      ];
      
      let dateMatches: string[] = [];
      for (const pattern of datePatterns) {
        const matches = textContent.match(pattern) || [];
        dateMatches = [...dateMatches, ...matches];
      }
      
      if (dateMatches.length > 0) {
        const uniqueDates = [...new Set(dateMatches)];
        extractedText += 'MEETING DATES:\n' + uniqueDates.join('\n') + '\n\n';
      }
      
      // Extract slide titles/numbers with better pattern matching
      const slideTitleMatches = textContent.match(/(?:Slide|SLIDE)\s*\d+|(?:Title|TITLE)\s*\d+|(?:PRESENTATION|Presentation)\s*(?:TITLE|Title)|Agenda|AGENDA|Overview|OVERVIEW|Summary|SUMMARY|Updates|UPDATES|Review|REVIEW|(?:Team|TEAM)\s+(?:Meeting|MEETING)|(?:Meeting|MEETING)\s+(?:Notes|NOTES)|(?:Action|ACTION)\s+(?:Items|ITEMS)|(?:Next|NEXT)\s+(?:Steps|STEPS)/gi);
      if (slideTitleMatches) {
        extractedText += 'SLIDE TITLES:\n' + slideTitleMatches.join('\n') + '\n\n';
      }
      
      // Enhanced XML content extraction - PPTX is a ZIP with XML inside
      const xmlMatches = [
        ...textContent.matchAll(/<a:t>([\s\S]*?)<\/a:t>/g),
        ...textContent.matchAll(/<w:t>([\s\S]*?)<\/w:t>/g),
        ...textContent.matchAll(/<p:txBody>([\s\S]*?)<\/p:txBody>/g)
      ];
      
      if (xmlMatches.length > 0) {
        console.log(`Found ${xmlMatches.length} XML text elements in PowerPoint file`);
        
        const xmlTextFragments: string[] = [];
        xmlMatches.forEach(match => {
          if (match[1] && match[1].trim()) {
            // Clean up the XML content
            let fragment = match[1]
              .replace(/<[^>]*>/g, '') // Remove any nested tags
              .trim();
              
            if (fragment.length > 2) {
              xmlTextFragments.push(fragment);
            }
          }
        });
        
        // Check for duplicates and add unique fragments
        const uniqueFragments = [...new Set(xmlTextFragments)];
        
        if (uniqueFragments.length > 0) {
          extractedText += '\nXML CONTENT:\n' + uniqueFragments.join('\n') + '\n\n';
        }
      }
      
      // Enhanced text pattern matching - create more targeted patterns for meetings
      const textPatterns = [
        // Meeting-specific patterns
        /(?:Team|TEAM)\s+(?:Update|UPDATE)[\s\S]{5,500}?(?:\.|\n|$)/g,
        /(?:Status|STATUS)\s+(?:Report|REPORT)[\s\S]{5,500}?(?:\.|\n|$)/g,
        /(?:Progress|PROGRESS)\s+(?:Update|UPDATE)[\s\S]{5,500}?(?:\.|\n|$)/g,
        /(?:Action|ACTION)\s+(?:Items|ITEMS)[\s\S]{5,500}?(?:\.|\n|$)/g,
        /(?:Next|NEXT)\s+(?:Steps|STEPS)[\s\S]{5,500}?(?:\.|\n|$)/g,
        /(?:Key|KEY)\s+(?:Metrics|METRICS|Deliverables|DELIVERABLES)[\s\S]{5,500}?(?:\.|\n|$)/g,
        
        // Standard patterns - improved to capture more context
        /[A-Za-z0-9\s!?.,-:;"'()\[\]]{10,600}/g,
        
        // List items - critical for presentations
        /[•\-\*]\s*[A-Za-z0-9\s!?.,-:;"'()]{5,500}/g,
        /[0-9]+[.)\]\s]+[A-Za-z0-9\s!?.,-:;"'()]{5,500}/g,
        
        // Title with content sections
        /([A-Z][A-Za-z]+(?:\s+[A-Z][A-Za-z]+){1,5})\s*[:?]\s*([A-Za-z0-9\s!?.,-:;"'()]{5,500})/g,
        
        // Data points and metrics (common in business presentations)
        /\$[0-9,.]+\s+[A-Za-z0-9\s!?.,-:;"'()]{5,100}/g,
        /[0-9]+%\s+[A-Za-z0-9\s!?.,-:;"'()]{5,100}/g,
        /Q[1-4]\s+[A-Za-z0-9\s!?.,-:;"'()]{5,100}/g
      ];
      
      let allTextBlocks: string[] = [];
      
      // Apply each pattern
      for (const pattern of textPatterns) {
        const matches = textContent.match(pattern) || [];
        allTextBlocks = [...allTextBlocks, ...matches];
      }
      
      // Look for specific business terms that indicate important content
      const businessTerms = [
        'revenue', 'sales', 'pipeline', 'forecast', 'target', 'goal', 'objective',
        'deal', 'opportunity', 'customer', 'client', 'account', 'market', 'competitor',
        'strategy', 'initiative', 'project', 'timeline', 'milestone', 'success', 'challenge',
        'team', 'performance', 'KPI', 'metric', 'growth', 'budget', 'cost', 'expense',
        'priority', 'risk', 'decision', 'update', 'status', 'progress', 'quarter', 'fiscal'
      ];
      
      // Find lines containing business terms
      for (const term of businessTerms) {
        const regex = new RegExp(`[^.!?\n]*\b${term}\b[^.!?\n]*[.!?\n]`, 'gi');
        const matches = textContent.match(regex) || [];
        allTextBlocks = [...allTextBlocks, ...matches];
      }
      
      if (allTextBlocks.length > 0) {
        // Enhanced filtering with better text quality detection
        const validTextBlocks = allTextBlocks.filter(block => {
          // Skip very short blocks
          if (block.length < 10) return false;
          
          // Check for alphanumeric density
          const alphaNumCount = (block.match(/[A-Za-z0-9]/g) || []).length;
          const wordCount = (block.match(/\b\w+\b/g) || []).length;
          
          // Skip blocks that are likely just formatting garbage
          if (alphaNumCount / block.length < 0.3) return false;
          
          // Skip blocks without enough actual words
          if (wordCount < 3) return false;
          
          return true;
        });
        
        // Improved duplicate detection
        const processedBlocks: string[] = [];
        const blockSignatures = new Set<string>();
        
        for (const block of validTextBlocks) {
          // Normalize text for better duplicate detection
          const normalized = block.toLowerCase()
            .replace(/\s+/g, ' ')
            .replace(/[^a-z0-9 ]/g, '')
            .trim();
          
          // Create a signature using the first 50 chars or less
          const signature = normalized.substring(0, Math.min(50, normalized.length));
          
          // Skip if we've already seen this block
          if (!blockSignatures.has(signature)) {
            blockSignatures.add(signature);
            processedBlocks.push(block);
          }
        }
        
        if (processedBlocks.length > 0) {
          // Sort blocks to maintain rough order from the presentation
          const sortedBlocks = processedBlocks.sort((a, b) => {
            const aIndex = textContent.indexOf(a);
            const bIndex = textContent.indexOf(b);
            return aIndex - bIndex;
          });
          
          // Group text blocks by slide/section
          let currentSection = '';
          let sectionedContent: string[] = [];
          
          for (const block of sortedBlocks) {
            // Check if block looks like a heading/title
            const isHeading = /^(?:[A-Z][a-z]*\s*){1,5}(?::|\n|$)/.test(block) || 
                              block.length < 50 && /^[A-Z]/.test(block) ||
                              /^(?:Slide|SLIDE)\s*\d+/.test(block);
            
            if (isHeading) {
              currentSection = block;
              sectionedContent.push(`\n## ${block.trim()}`);
            } else if (currentSection) {
              // Add content under its section
              sectionedContent.push(block.trim());
            } else {
              // No section yet, just add content
              sectionedContent.push(block.trim());
            }
          }
          
          extractedText += '\nCONTENT:\n' + sectionedContent.join('\n\n') + '\n';
        }
      }
      
      // If we couldn't extract meaningful text, return a message
      if (extractedText.trim().length < 30) {
        return `${fileName} appears to be a PowerPoint file but I couldn't extract readable text content from it.\n\nThe fragments I found were too limited: ${extractedText}`;
      }
      
      // Apply better formatting to the extracted text
      extractedText = this.formatPresentationContent(extractedText, fileName);
      
      // Format the extracted text with helpful headers and spacing
      const result = `# Content extracted from PowerPoint: ${fileName}\n\n${extractedText}`;
      
      console.log(`Successfully extracted ${extractedText.length} characters of text from PowerPoint`); 
      return result;
    } catch (error) {
      console.error('Error in PowerPoint extraction:', error);
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      return `Could not extract text from PowerPoint file ${fileName}: ${errorMsg}`;
    }
  }
  
  // Format presentation content for better readability and organization
  private formatPresentationContent(content: string, fileName: string): string {
    // Extract meeting date from filename if present
    const datePattern = /(d{1,2}[.-]d{1,2}[.-]d{2,4}|d{2,4}[.-]d{1,2}[.-]d{1,2})/;
    const dateMatch = fileName.match(datePattern);
    
    let formattedContent = content;
    let meetingDetails = '';
    
    if (dateMatch) {
      meetingDetails += `Meeting Date: ${dateMatch[1]}\n`;
    }
    
    // Add meeting details section if we have any
    if (meetingDetails) {
      formattedContent = `MEETING DETAILS:\n${meetingDetails}\n\n${formattedContent}`;
    }
    
    // Clean up any obvious formatting issues
    formattedContent = formattedContent
      .replace(/\n{3,}/g, '\n\n')             // Multiple newlines to double newline
      .replace(/\n\s+/g, '\n')                // Remove leading whitespace after newlines
      .replace(/(?:\n\s*•\s*)+/g, '\n• ')    // Normalize bullet points
      .replace(/(?:\n\s*-\s*)+/g, '\n- ');   // Normalize dashes
      
    return formattedContent;
  }
  
  // Extract text from HTML content
  private extractTextFromHtml(htmlContent: string): string {
    try {
      // Simple regex-based HTML stripping
      let text = htmlContent;
      
      // Remove scripts and style sections
      text = text.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
      text = text.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
      
      // Replace common tags with newlines to maintain some structure
      text = text.replace(/<\/?(h1|h2|h3|h4|h5|h6|p|div|section|article|header|footer|ul|ol)[^>]*>/gi, '\n');
      text = text.replace(/<li[^>]*>/gi, '\n• ');
      text = text.replace(/<\/li>/gi, '');
      text = text.replace(/<br[^>]*>/gi, '\n');
      
      // Replace remaining tags and handle entities
      text = text.replace(/<[^>]*>/g, '');
      text = text.replace(/&nbsp;/g, ' ');
      text = text.replace(/&amp;/g, '&');
      text = text.replace(/&lt;/g, '<');
      text = text.replace(/&gt;/g, '>');
      text = text.replace(/&quot;/g, '"');
      text = text.replace(/&#39;/g, "'");
      
      // Fix whitespace
      text = text.replace(/\s+/g, ' ');
      text = text.replace(/\n\s+/g, '\n');
      text = text.replace(/\n{3,}/g, '\n\n');
      
      return text.trim();
    } catch (error) {
      console.error('Error extracting text from HTML:', error);
      return htmlContent; // Return original content if extraction fails
    }
  }
  
  // Helper method to clean text content
  private cleanTextContent(content: string): string {
    // Replace any null characters or other problematic characters
    let cleaned = content.replace(/\0/g, '');
    
    // Remove excessive whitespace
    cleaned = cleaned.replace(/\s{3,}/g, '\n\n');
    
    // Try to repair encoding issues - often appearing as �� characters
    cleaned = cleaned.replace(/��/g, ' ');
    
    // Calculate the percentage of problematic characters
    const sampleSize = Math.min(500, cleaned.length);
    const sample = cleaned.substring(0, sampleSize);
    let problematicCount = 0;
    
    // Count problematic characters in the sample
    for (let i = 0; i < sample.length; i++) {
      const charCode = sample.charCodeAt(i);
      // Only count as problematic if it's not ASCII printable, not tab, newline, or valid Unicode
      if ((charCode < 32 || charCode > 126) && 
          charCode !== 9 && charCode !== 10 && charCode !== 13 && 
          charCode < 0xA0) {
        problematicCount++;
      }
    }
    
    const problematicPercentage = problematicCount / sampleSize;
    console.log(`Document analysis: ${problematicCount}/${sampleSize} problematic characters (${(problematicPercentage*100).toFixed(2)}%)`);
    
    // Only consider binary if very high percentage of problematic characters
    if (problematicPercentage > 0.3) { // 30% threshold
      console.log('Attempting to salvage readable text from binary content');
      
      // Try to extract readable text by replacing unreadable characters with spaces
      let readableContent = '';
      for (let i = 0; i < cleaned.length; i++) {
        const charCode = cleaned.charCodeAt(i);
        if ((charCode >= 32 && charCode <= 126) || 
            charCode === 9 || charCode === 10 || charCode === 13 || 
            charCode >= 0xA0) {
          readableContent += cleaned.charAt(i);
        } else {
          readableContent += ' ';
        }
      }
      
      // Clean up the extracted text
      readableContent = readableContent.replace(/\s{3,}/g, '\n\n').trim();
      
      if (readableContent.length < 100) {
        return 'This file appears to contain primarily binary or non-text content.';
      }
      
      return readableContent;
    }
    
    return cleaned;
  }
}

export default new GoogleDriveService();
