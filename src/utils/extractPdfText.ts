import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import workerSrc from 'pdfjs-dist/legacy/build/pdf.worker.min.mjs?url';

// Configure worker (bundled with the app to avoid CDN/version/CORS issues)
pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;

export interface ExtractedPdfResult {
  text: string;
  pageCount: number;
  filename: string;
}

export interface ExtractionProgress {
  currentPage: number;
  totalPages: number;
}

const MAX_PAGES = 50;
const MAX_CHARS = 100000;

export async function extractPdfText(
  file: File,
  onProgress?: (progress: ExtractionProgress) => void
): Promise<ExtractedPdfResult> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  
  const totalPages = Math.min(pdf.numPages, MAX_PAGES);
  let extractedText = '';
  
  for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
    if (onProgress) {
      onProgress({ currentPage: pageNum, totalPages });
    }
    
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();
    
    const pageText = textContent.items
      .map((item: any) => item.str)
      .join(' ');
    
    extractedText += `\n--- Page ${pageNum} ---\n${pageText}\n`;
    
    // Stop if we've exceeded the character limit
    if (extractedText.length > MAX_CHARS) {
      extractedText = extractedText.substring(0, MAX_CHARS);
      extractedText += '\n\n[Text truncated due to length limits]';
      break;
    }
  }
  
  return {
    text: extractedText.trim(),
    pageCount: pdf.numPages,
    filename: file.name,
  };
}
