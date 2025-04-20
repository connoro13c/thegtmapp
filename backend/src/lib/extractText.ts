import * as mammoth from 'mammoth';
import * as xlsx from 'xlsx';
import pdfParse from 'pdf-parse';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';

const execPromise = promisify(exec);

// Create temp directory for file conversions if it doesn't exist
const TEMP_DIR = path.join(os.tmpdir(), 'gtm-app-conversions');
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
  console.log(`Created temp directory for file conversions: ${TEMP_DIR}`);
}

/**
 * Extract text from PowerPoint by converting it to PDF first using LibreOffice
 * @param buffer The PowerPoint file buffer
 * @param fileName The original file name (used for temp files)
 * @returns Extracted text from the presentation
 */
const extractPowerPointText = async (buffer: Buffer, fileName: string): Promise<string> => {
  try {
    // Create a unique ID for this conversion to avoid conflicts
    const uniqueId = Date.now().toString() + Math.floor(Math.random() * 10000).toString();
    const safeFileName = path.basename(fileName, path.extname(fileName))
      .replace(/[^a-zA-Z0-9]/g, '_');
    
    // Create temporary file paths
    const tempInputPath = path.join(TEMP_DIR, `${safeFileName}_${uniqueId}${path.extname(fileName)}`);
    const tempOutputDir = path.join(TEMP_DIR, `${safeFileName}_${uniqueId}_output`);
    
    // Ensure output directory exists
    if (!fs.existsSync(tempOutputDir)) {
      fs.mkdirSync(tempOutputDir, { recursive: true });
    }
    
    // Write buffer to temporary file
    fs.writeFileSync(tempInputPath, buffer);
    
    // Convert to PDF using LibreOffice
    console.log(`Converting ${fileName} to PDF using LibreOffice...`);
    try {
      // Use soffice command to convert the file to PDF
      const { stdout, stderr } = await execPromise(`soffice --headless --convert-to pdf --outdir "${tempOutputDir}" "${tempInputPath}"`);
      
      if (stderr && stderr.length > 0) {
        console.warn(`LibreOffice conversion warning: ${stderr}`);
      }
      
      // Find the generated PDF file
      const files = fs.readdirSync(tempOutputDir);
      const pdfFile = files.find(file => file.endsWith('.pdf'));
      
      if (!pdfFile) {
        throw new Error('No PDF file was generated during conversion');
      }
      
      // Read the PDF file and extract text
      const pdfPath = path.join(tempOutputDir, pdfFile);
      const pdfBuffer = fs.readFileSync(pdfPath);
      const pdfData = await pdfParse(pdfBuffer);
      
      // Check if we extracted enough content
      if (!pdfData.text || pdfData.text.length < 1000) {
        console.warn(`Warning: Extracted only ${pdfData.text?.length || 0} chars from ${fileName}, which is less than the 1000 char minimum`);
      } else {
        console.log(`Successfully extracted ${pdfData.text.length} chars from ${fileName} using LibreOffice/PDF conversion`);
      }
      
      // Clean up temporary files
      try {
        fs.unlinkSync(tempInputPath);
        fs.unlinkSync(pdfPath);
        fs.rmdirSync(tempOutputDir);
      } catch (cleanupError) {
        console.warn('Warning: Failed to clean up some temporary files', cleanupError);
      }
      
      // Format the output with original filename for context
      return `${fileName}\n\n${pdfData.text}`;
    } catch (error) {
      const conversionError = error as Error;
      console.error('LibreOffice conversion error:', conversionError);
      throw new Error(`Failed to convert PowerPoint to PDF: ${conversionError.message}`);
    }
  } catch (error) {
    console.error('Error extracting from PowerPoint:', error);
    throw error; // Re-throw to be handled by the caller
  }
};

/**
 * Extract text from binary buffer based on file type
 * @param buffer The file buffer
 * @param mimeType The MIME type of the file
 * @param fileName The name of the file
 * @returns Extracted plain text
 */
export async function extractText(
  buffer: Buffer, 
  mimeType: string, 
  fileName: string
): Promise<string> {
  try {
    console.log(`Extracting text from ${fileName} (${mimeType})`);
    
    // Handle different file types
    if (mimeType.includes('spreadsheet') || fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
      // Process Excel files
      const workbook = xlsx.read(buffer, { type: 'buffer' });
      let text = '';
      
      // Concatenate all sheets
      for (const sheet of workbook.SheetNames) {
        const worksheet = workbook.Sheets[sheet];
        const sheetText = xlsx.utils.sheet_to_txt(worksheet);
        text += `## Sheet: ${sheet}\n${sheetText}\n\n`;
      }
      
      return text;
    } 
    // Process PowerPoint files
    if (mimeType.includes('presentation') || fileName.endsWith('.pptx') || fileName.endsWith('.ppt')) {
      try {
        const text = await extractPowerPointText(buffer, fileName);
        
        // Check if we extracted enough content (unit test requirement: > 1000 chars)
        if (text.length < 1000) {
          console.warn(`Warning: Extracted only ${text.length} chars from ${fileName}, which is less than the 1000 char minimum`);
        } else {
          console.log(`Successfully extracted ${text.length} chars from ${fileName}`);
        }
        
        return text;
      } catch (error) {
        const pptError = error as Error;
        console.error('Error extracting from PowerPoint:', pptError);
        return `Error extracting text from presentation ${fileName}: ${pptError.message}`;
      }
    }
    // Process Word documents
    else if (mimeType.includes('document') || fileName.endsWith('.docx') || fileName.endsWith('.doc')) {
      try {
        const result = await mammoth.extractRawText({ buffer });
        return result.value || '';
      } catch (docError) {
        console.error('Error extracting from Word document:', docError);
        return `Error extracting text from document ${fileName}`;
      }
    }
    // Process PDF files
    else if (mimeType.includes('pdf') || fileName.endsWith('.pdf')) {
      try {
        const result = await pdfParse(buffer);
        return result.text || '';
      } catch (pdfError) {
        console.error('Error extracting from PDF:', pdfError);
        return `Error extracting text from PDF ${fileName}`;
      }
    }
    // Process plain text
    else if (mimeType.includes('text') || mimeType.includes('json')) {
      return buffer.toString('utf8');
    }
    // Unsupported file type
    else {
      return `File type ${mimeType} not supported for text extraction`;
    }
  } catch (error) {
    console.error(`Error extracting text from ${fileName}:`, error);
    return `Error processing file ${fileName}: ${error instanceof Error ? error.message : 'Unknown error'}`;
  }
}
