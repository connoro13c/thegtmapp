import * as fs from 'node:fs';
import * as path from 'node:path';

// Type definition for our processed file records
export interface ProcessedFile {
  fileId: string;
  fileName: string;
  mimeType: string;
  processedAt: string;
  hash?: string; // Could be used for content hash if we want to detect file changes
}

// Path to the JSON file that will store our processed files
const PROCESSED_FILES_PATH = path.join(process.cwd(), 'cache', 'processed-files.json');

// Ensure the directory exists
const cacheDir = path.dirname(PROCESSED_FILES_PATH);
if (!fs.existsSync(cacheDir)) {
  fs.mkdirSync(cacheDir, { recursive: true });
}

/**
 * Load the list of already processed files
 * @returns Map of fileId to ProcessedFile records
 */
export function getProcessedFiles(): Map<string, ProcessedFile> {
  try {
    if (!fs.existsSync(PROCESSED_FILES_PATH)) {
      return new Map<string, ProcessedFile>();
    }
    
    const fileContent = fs.readFileSync(PROCESSED_FILES_PATH, 'utf8');
    const processedFiles = JSON.parse(fileContent) as ProcessedFile[];
    
    // Convert array to Map for faster lookups
    const fileMap = new Map<string, ProcessedFile>();
    processedFiles.forEach(file => {
      fileMap.set(file.fileId, file);
    });
    
    return fileMap;
  } catch (error) {
    console.error('Error loading processed files record:', error);
    return new Map<string, ProcessedFile>();
  }
}

/**
 * Record a file as having been processed
 * @param fileId Google Drive file ID
 * @param fileName File name
 * @param mimeType MIME type of the file
 */
export function recordProcessedFile(fileId: string, fileName: string, mimeType: string): void {
  try {
    const processedFiles = getProcessedFiles();
    
    // Add or update the file record
    processedFiles.set(fileId, {
      fileId,
      fileName,
      mimeType,
      processedAt: new Date().toISOString(),
    });
    
    // Convert Map back to array for storage
    const filesArray = Array.from(processedFiles.values());
    
    // Write to file
    fs.writeFileSync(PROCESSED_FILES_PATH, JSON.stringify(filesArray, null, 2), 'utf8');
    
  } catch (error) {
    console.error('Error recording processed file:', error);
  }
}

/**
 * Determine if a file needs to be processed
 * @param fileId Google Drive file ID
 * @returns true if the file needs processing, false if it can be skipped
 */
export function needsProcessing(fileId: string): boolean {
  const processedFiles = getProcessedFiles();
  return !processedFiles.has(fileId);
}

/**
 * Get file stats about processed files
 * @returns Statistics about processed files
 */
export function getProcessedFileStats(): { 
  totalFiles: number,
  filesByType: Record<string, number>
} {
  const processedFiles = getProcessedFiles();
  const filesByType: Record<string, number> = {};
  
  processedFiles.forEach(file => {
    const type = file.mimeType || 'unknown';
    filesByType[type] = (filesByType[type] || 0) + 1;
  });
  
  return {
    totalFiles: processedFiles.size,
    filesByType
  };
}
