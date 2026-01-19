import * as pdfjs from 'pdfjs-dist';

// Configure worker - using CDN for compatibility
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

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
 * Converts a PDF file to an array of PNG images (one per page)
 * Uses client-side rendering with pdf.js and canvas
 */
export async function convertPdfToImages(
  file: File, 
  scale: number = 1.5,
  onProgress?: (progress: PdfConversionProgress) => void
): Promise<PageImage[]> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
  const pageImages: PageImage[] = [];
  const totalPages = Math.min(pdf.numPages, 50); // Limit to 50 pages max

  for (let i = 1; i <= totalPages; i++) {
    onProgress?.({ currentPage: i, totalPages });
    
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale });
    
    // Create canvas
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d')!;
    canvas.width = viewport.width;
    canvas.height = viewport.height;

    // Render page to canvas
    await page.render({ 
      canvasContext: context, 
      viewport,
      canvas
    }).promise;

    // Convert to blob
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (b) => {
          if (b) resolve(b);
          else reject(new Error('Failed to create blob'));
        }, 
        'image/png', 
        0.92
      );
    });

    pageImages.push({
      pageNumber: i,
      blob,
      dataUrl: canvas.toDataURL('image/png')
    });

    // Clean up
    canvas.remove();
  }

  return pageImages;
}

/**
 * Creates a thumbnail from a PDF page (smaller scale for preview)
 */
export async function createPdfThumbnail(
  file: File,
  pageNumber: number = 1,
  scale: number = 0.5
): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
  
  if (pageNumber > pdf.numPages) {
    throw new Error(`Page ${pageNumber} does not exist in PDF`);
  }

  const page = await pdf.getPage(pageNumber);
  const viewport = page.getViewport({ scale });
  
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d')!;
  canvas.width = viewport.width;
  canvas.height = viewport.height;

  await page.render({ 
    canvasContext: context, 
    viewport,
    canvas
  }).promise;

  const dataUrl = canvas.toDataURL('image/png', 0.8);
  canvas.remove();
  
  return dataUrl;
}
