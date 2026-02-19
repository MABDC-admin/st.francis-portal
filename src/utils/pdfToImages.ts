import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import workerSrc from 'pdfjs-dist/legacy/build/pdf.worker.min.mjs?url';

// Configure worker (bundled with the app to avoid CDN/version/CORS issues)
pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;

export interface PageImage {
  pageNumber: number;
  blob: Blob;
  dataUrl: string;
}

export interface PdfConversionProgress {
  currentPage: number;
  totalPages: number;
}

/**
 * Helper: Check if file is a PDF
 */
export const isPdfFile = (file: File): boolean => {
  return file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
};

/**
 * Helper: Create object URL for blob preview
 */
export const createBlobPreviewUrl = (blob: Blob): string => {
  return URL.createObjectURL(blob);
};

/**
 * Renders a single PDF page to a WebP blob (4x scale for high-res)
 */
async function renderPageToBlob(
  pdf: any, 
  pageNumber: number,
  scale: number = 4
): Promise<Blob> {
  const page = await pdf.getPage(pageNumber);
  const viewport = page.getViewport({ scale });
  
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d')!;
  canvas.width = viewport.width;
  canvas.height = viewport.height;

  await page.render({ 
    canvasContext: context, 
    viewport 
  }).promise;

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        canvas.remove();
        if (blob) resolve(blob);
        else reject(new Error('Failed to create blob'));
      }, 
      'image/webp', 
      0.90
    );
  });
}

/**
 * Extracts all PDF pages as JPEG images
 * Uses legacy build for better browser compatibility
 */
export async function extractPdfPagesAsImages(
  file: File, 
  maxPages: number = 50,
  onProgress?: (progress: PdfConversionProgress) => void
): Promise<PageImage[]> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await (pdfjsLib as any).getDocument({ data: arrayBuffer }).promise;
  const pageImages: PageImage[] = [];
  const totalPages = Math.min(pdf.numPages, maxPages);

  for (let i = 1; i <= totalPages; i++) {
    onProgress?.({ currentPage: i, totalPages });
    
    const blob = await renderPageToBlob(pdf, i);
    const dataUrl = createBlobPreviewUrl(blob);

    pageImages.push({
      pageNumber: i,
      blob,
      dataUrl
    });
  }

  return pageImages;
}

// Keep backward compatibility alias
export const convertPdfToImages = extractPdfPagesAsImages;

/**
 * Creates a thumbnail from a PDF page (smaller scale for preview)
 */
export async function createPdfThumbnail(
  file: File,
  pageNumber: number = 1,
  scale: number = 1
): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await (pdfjsLib as any).getDocument({ data: arrayBuffer }).promise;
  
  if (pageNumber > pdf.numPages) {
    throw new Error(`Page ${pageNumber} does not exist`);
  }

  const blob = await renderPageToBlob(pdf, pageNumber, scale);
  return createBlobPreviewUrl(blob);
}
