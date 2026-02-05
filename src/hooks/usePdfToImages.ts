import { useState, useCallback } from 'react';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import workerSrc from 'pdfjs-dist/legacy/build/pdf.worker.min.mjs?url';
import { supabase } from '@/integrations/supabase/client';

// Configure worker (bundled with the app)
pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;

export interface RenderProgress {
  total: number;
  done: number;
  status: 'idle' | 'rendering' | 'uploading' | 'done' | 'error';
  error?: string;
}

async function renderPageToBlob(
  pdf: any,
  pageNumber: number,
  scale: number
): Promise<Blob> {
  const page = await pdf.getPage(pageNumber);
  const viewport = page.getViewport({ scale });

  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d')!;
  canvas.width = Math.floor(viewport.width);
  canvas.height = Math.floor(viewport.height);

  await page.render({
    canvasContext: context,
    viewport,
  }).promise;

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        canvas.remove();
        if (blob) resolve(blob);
        else reject(new Error('Failed to create blob'));
      },
      'image/png',
      0.9
    );
  });
}

/**
 * Renders the first page of a PDF for preview and AI analysis
 */
export async function renderFirstPagePreview(
  pdfFile: File,
  scale: number = 1.5
): Promise<{ blob: Blob; dataUrl: string; base64: string }> {
  const arrayBuffer = await pdfFile.arrayBuffer();
  const pdf = await (pdfjsLib as any).getDocument({ data: arrayBuffer }).promise;
  
  const page = await pdf.getPage(1);
  const viewport = page.getViewport({ scale });

  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d')!;
  canvas.width = Math.floor(viewport.width);
  canvas.height = Math.floor(viewport.height);

  await page.render({
    canvasContext: context,
    viewport,
  }).promise;

  // Create blob
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => {
        if (b) resolve(b);
        else reject(new Error('Failed to create blob'));
      },
      'image/png',
      0.9
    );
  });

  // Create data URL for preview
  const dataUrl = canvas.toDataURL('image/png', 0.9);
  
  // Create base64 for AI analysis (same as dataUrl but cleaner extraction)
  const base64 = dataUrl;

  canvas.remove();
  pdf.destroy();

  return { blob, dataUrl, base64 };
}

export function usePdfToImages() {
  const [progress, setProgress] = useState<RenderProgress>({
    total: 0,
    done: 0,
    status: 'idle',
  });

  const processInBrowser = useCallback(
    async (
      bookId: string,
      pdfFile: File
    ): Promise<{ numPages: number; firstPageUrl: string }> => {
      try {
        // 1. Load PDF document
        const arrayBuffer = await pdfFile.arrayBuffer();
        const pdf = await (pdfjsLib as any).getDocument({ data: arrayBuffer }).promise;
        const numPages = pdf.numPages;

        setProgress({ total: numPages, done: 0, status: 'rendering' });

        // 2. Delete existing pages (for re-uploads)
        await supabase.from('book_pages').delete().eq('book_id', bookId);

        const BATCH_SIZE = 3;

        for (let i = 1; i <= numPages; i += BATCH_SIZE) {
          const batchEnd = Math.min(i + BATCH_SIZE - 1, numPages);
          const batchPromises = [];

          for (let pageNum = i; pageNum <= batchEnd; pageNum++) {
            batchPromises.push(
              (async (pNum) => {
                // 3. Render High-Res PNG (Scale 2.0)
                const pngBlob = await renderPageToBlob(pdf, pNum, 2.0);

                // 4. Render Thumbnail (Scale 0.3)
                const thumbBlob = await renderPageToBlob(pdf, pNum, 0.3);

                // 5. Upload to Storage
                const imagePath = `${bookId}/page-${pNum}.png`;
                const thumbPath = `${bookId}/thumb-${pNum}.png`;

                const [pngUpload, thumbUpload] = await Promise.all([
                  supabase.storage
                    .from('book-pages')
                    .upload(imagePath, pngBlob, {
                      contentType: 'image/png',
                      upsert: true,
                    }),
                  supabase.storage
                    .from('book-pages')
                    .upload(thumbPath, thumbBlob, {
                      contentType: 'image/png',
                      upsert: true,
                    }),
                ]);

                if (pngUpload.error) throw pngUpload.error;

                // 6. Get public URLs
                const {
                  data: { publicUrl: pngUrl },
                } = supabase.storage.from('book-pages').getPublicUrl(imagePath);

                let thumbPublicUrl: string | null = null;
                if (!thumbUpload.error) {
                  const {
                    data: { publicUrl },
                  } = supabase.storage.from('book-pages').getPublicUrl(thumbPath);
                  thumbPublicUrl = publicUrl;
                }

                // 7. Insert page record to DB
                await supabase.from('book_pages').insert({
                  book_id: bookId,
                  page_number: pNum,
                  image_url: pngUrl,
                  thumbnail_url: thumbPublicUrl,
                });

                // 8. Set first page as cover immediately
                if (pNum === 1) {
                  await supabase
                    .from('books')
                    .update({
                      cover_url: pngUrl,
                      status: numPages === 1 ? 'ready' : 'processing',
                    })
                    .eq('id', bookId);
                }

                setProgress((p) => ({
                  ...p,
                  done: p.done + 1,
                  status: p.done + 1 === numPages ? 'done' : 'rendering',
                }));
              })(pageNum)
            );
          }

          await Promise.all(batchPromises);
        }

        pdf.destroy();

        const {
          data: { publicUrl: firstPageUrl },
        } = supabase.storage.from('book-pages').getPublicUrl(`${bookId}/page-1.png`);

        return { numPages, firstPageUrl };
      } catch (error: any) {
        setProgress((p) => ({
          ...p,
          status: 'error',
          error: error.message || 'Failed to process PDF',
        }));
        throw error;
      }
    },
    []
  );

  const reset = useCallback(() => {
    setProgress({ total: 0, done: 0, status: 'idle' });
  }, []);

  return { progress, processInBrowser, reset };
}
