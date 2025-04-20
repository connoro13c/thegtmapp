/**
 * Split text into chunks for embedding and processing
 * @param text The text to split into chunks
 * @param chunkSize Target chunk size in characters (~300 tokens per chunk)
 * @param chunkOverlap Overlap between chunks to maintain context
 * @returns Array of text chunks
 */
export function chunkText(
  text: string,
  chunkSize = 800,
  chunkOverlap = 100
): string[] {
  if (!text || text.length === 0) {
    return [];
  }
  
  const chunks: string[] = [];
  
  // Try to split on paragraphs first
  const paragraphs = text.split(/\n\s*\n/);
  let currentChunk = '';
  
  for (const para of paragraphs) {
    // If adding this paragraph exceeds the chunk size, save current chunk and start a new one
    if (currentChunk.length + para.length + 2 > chunkSize && currentChunk.length > 0) {
      chunks.push(currentChunk);
      // Start new chunk with overlap from the end of the previous chunk
      currentChunk = `${currentChunk.substring(Math.max(0, currentChunk.length - chunkOverlap))}\n\n${para}`;
    } else {
      // Add paragraph to current chunk with proper spacing
      currentChunk += (currentChunk ? '\n\n' : '') + para;
    }
  }
  
  // Add the last chunk if it has content
  if (currentChunk.length > 0) {
    chunks.push(currentChunk);
  }
  
  return chunks;
}
