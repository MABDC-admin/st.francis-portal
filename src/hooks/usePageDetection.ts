import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface PageDetectionResult {
  pageIndex: number;
  detectedPageNumber: string | null;
  pageType: 'numbered' | 'cover' | 'blank' | 'unknown';
  confidence: number;
}

interface UsePageDetectionOptions {
  bookId: string;
  autoDetect?: boolean;
}

export function usePageDetection({ bookId, autoDetect = true }: UsePageDetectionOptions) {
  const [detectedPages, setDetectedPages] = useState<Map<number, PageDetectionResult>>(new Map());
  const [isDetecting, setIsDetecting] = useState(false);
  const [detectionProgress, setDetectionProgress] = useState(0);
  const abortController = useRef<AbortController | null>(null);
  const loadedFromDb = useRef(false);

  // Load persisted detection results from DB on mount
  useEffect(() => {
    if (!bookId || loadedFromDb.current) return;

    const loadPersistedResults = async () => {
      const { data: pages, error } = await supabase
        .from('book_pages')
        .select('id, page_number, detected_page_number, page_type, detection_confidence, detection_completed')
        .eq('book_id', bookId)
        .eq('detection_completed', true);

      if (error) {
        console.error('Failed to load persisted detection results:', error);
        return;
      }

      if (pages && pages.length > 0) {
        const map = new Map<number, PageDetectionResult>();
        for (const page of pages) {
          const pageIndex = page.page_number - 1;
          map.set(pageIndex, {
            pageIndex,
            detectedPageNumber: page.detected_page_number,
            pageType: (page.page_type as PageDetectionResult['pageType']) || 'unknown',
            confidence: page.detection_confidence || 0,
          });
        }
        setDetectedPages(map);
        loadedFromDb.current = true;
        console.log(`Loaded ${pages.length} persisted detection results for book ${bookId}`);
      }
    };

    loadPersistedResults();
  }, [bookId]);

  // Detect page number for a single page
  const detectPageNumber = useCallback(async (
    imageUrl: string,
    pageIndex: number,
    pageId?: string,
  ): Promise<PageDetectionResult | null> => {
    try {
      const { data, error } = await supabase.functions.invoke('detect-page-number', {
        body: { imageUrl, pageIndex, bookId, pageId }
      });

      if (error) {
        console.error('Page detection error:', error);
        return null;
      }

      return data as PageDetectionResult;
    } catch (err) {
      console.error('Failed to detect page number:', err);
      return null;
    }
  }, [bookId]);

  // Keep a ref in sync so the callback doesn't depend on detectedPages state
  const detectedPagesRef = useRef(detectedPages);
  useEffect(() => {
    detectedPagesRef.current = detectedPages;
  }, [detectedPages]);

  // Detect pages sequentially, skipping already-detected ones
  const detectPagesSequentially = useCallback(async (
    pages: { pageIndex: number; imageUrl: string; pageId?: string }[]
  ) => {
    if (pages.length === 0) return;

    // Filter out pages already detected (use ref to avoid dependency)
    const undetectedPages = pages.filter(p => !detectedPagesRef.current.has(p.pageIndex));
    
    if (undetectedPages.length === 0) {
      console.log('All pages already detected, skipping scan');
      return;
    }

    setIsDetecting(true);
    setDetectionProgress(0);
    abortController.current = new AbortController();

    const results = new Map<number, PageDetectionResult>();
    let completed = 0;

    for (const page of undetectedPages) {
      if (abortController.current?.signal.aborted) break;

      const result = await detectPageNumber(page.imageUrl, page.pageIndex, page.pageId);
      if (result) {
        results.set(page.pageIndex, result);
        setDetectedPages(prev => new Map(prev).set(page.pageIndex, result));
      }

      completed++;
      setDetectionProgress(Math.round((completed / undetectedPages.length) * 100));

      if (completed < undetectedPages.length) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    setIsDetecting(false);
    
    const numberedPages = Array.from(results.values()).filter(r => r.pageType === 'numbered');
    const coverPages = Array.from(results.values()).filter(r => r.pageType === 'cover');
    const blankPages = Array.from(results.values()).filter(r => r.pageType === 'blank');
    
    if (numberedPages.length > 0) {
      toast.success(`Detected ${numberedPages.length} numbered pages`, {
        description: `${coverPages.length} cover, ${blankPages.length} blank pages identified`
      });
    }

    return results;
  }, [detectPageNumber]);

  // Cancel ongoing detection
  const cancelDetection = useCallback(() => {
    abortController.current?.abort();
    setIsDetecting(false);
  }, []);

  // Get display info for a page
  const getPageDisplayInfo = useCallback((pageIndex: number): {
    displayNumber: string;
    shouldHide: boolean;
    isDetected: boolean;
    pageType: string;
  } => {
    const detection = detectedPages.get(pageIndex);
    
    if (!detection) {
      return {
        displayNumber: String(pageIndex + 1),
        shouldHide: false,
        isDetected: false,
        pageType: 'unknown'
      };
    }

    const shouldHide = detection.pageType === 'cover' || detection.pageType === 'blank';
    const displayNumber = detection.detectedPageNumber || String(pageIndex + 1);

    return {
      displayNumber,
      shouldHide,
      isDetected: true,
      pageType: detection.pageType
    };
  }, [detectedPages]);

  // Clear on unmount
  useEffect(() => {
    return () => {
      cancelDetection();
    };
  }, [cancelDetection]);

  return {
    detectedPages,
    isDetecting,
    detectionProgress,
    detectPageNumber,
    detectPagesSequentially,
    cancelDetection,
    getPageDisplayInfo,
  };
}
