import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Maximize,
  Minimize,
  Menu,
  LayoutGrid,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { useAnnotations } from '@/hooks/useAnnotations';
import { AnnotationToolbar } from './AnnotationToolbar';
import { useIsMobile } from '@/hooks/use-mobile';

interface BookPage {
  id: string;
  page_number: number;
  image_url: string;
  thumbnail_url: string | null;
}

interface FlipbookViewerProps {
  bookId: string;
  bookTitle: string;
  onClose: () => void;
}

export const FlipbookViewer = ({
  bookId,
  bookTitle,
  onClose,
}: FlipbookViewerProps) => {
  const [pages, setPages] = useState<BookPage[]>([]);
  const [currentSpread, setCurrentSpread] = useState(0); // For desktop: spread index (0 = pages 1-2, 1 = pages 3-4, etc.)
  const [currentPage, setCurrentPage] = useState(1); // For mobile: single page
  const [zoom, setZoom] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [showMobileThumbnails, setShowMobileThumbnails] = useState(false);
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [isJumping, setIsJumping] = useState(false);
  const [flipDirection, setFlipDirection] = useState<'left' | 'right' | null>(null);
  const [isFlipping, setIsFlipping] = useState(false);
  
  const isMobile = useIsMobile();
  const isDesktop = !isMobile && typeof window !== 'undefined' && window.innerWidth >= 1024;
  
  const thumbnailRefs = useRef<Map<number, HTMLButtonElement>>(new Map());
  const imageRef = useRef<HTMLImageElement>(null);

  const {
    annotationMode,
    setAnnotationMode,
    annotationColor,
    setAnnotationColor,
    canvasRef,
    containerRef,
    startDrawing,
    draw,
    stopDrawing,
    eraseAtPoint,
    placeSticker,
    pendingSticker,
    setPendingSticker,
    renderAnnotations,
    undo,
    redo,
    clearAnnotations,
    canUndo,
    canRedo,
  } = useAnnotations();

  // Fetch pages
  useEffect(() => {
    const fetchPages = async () => {
      const { data, error } = await supabase
        .from('book_pages')
        .select('*')
        .eq('book_id', bookId)
        .order('page_number');

      if (!error && data) {
        setPages(data);
      }
      setIsLoading(false);
    };

    fetchPages();
  }, [bookId]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowLeft':
          goToPrev();
          break;
        case 'ArrowRight':
          goToNext();
          break;
        case 'Escape':
          if (isFullscreen) {
            document.exitFullscreen?.();
          } else {
            onClose();
          }
          break;
        case '+':
        case '=':
          handleZoomIn();
          break;
        case '-':
          handleZoomOut();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentPage, pages.length, isFullscreen]);

  // Fullscreen change listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () =>
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Auto-scroll mobile thumbnails to current page
  useEffect(() => {
    if (showMobileThumbnails) {
      thumbnailRefs.current.get(currentPage)?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [showMobileThumbnails, currentPage]);

  // Jumping animation for thumbnail icon every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setIsJumping(true);
      setTimeout(() => setIsJumping(false), 500);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Re-render annotations when page or zoom changes
  useEffect(() => {
    renderAnnotations(currentPage, zoom);
  }, [currentPage, zoom, renderAnnotations]);

  // Update canvas size when image loads
  const handleImageLoad = useCallback(() => {
    if (imageRef.current) {
      setImageSize({
        width: imageRef.current.naturalWidth,
        height: imageRef.current.naturalHeight,
      });
    }
  }, []);

  // Update canvas dimensions
  useEffect(() => {
    if (canvasRef.current && imageSize.width && imageSize.height) {
      canvasRef.current.width = imageSize.width * zoom;
      canvasRef.current.height = imageSize.height * zoom;
      renderAnnotations(currentPage, zoom);
    }
  }, [imageSize, zoom, currentPage, renderAnnotations, canvasRef]);

  // Desktop spread calculation
  const totalSpreads = Math.ceil(pages.length / 2);
  const leftPageIndex = currentSpread * 2;
  const rightPageIndex = currentSpread * 2 + 1;
  const leftPage = pages[leftPageIndex];
  const rightPage = pages[rightPageIndex];

  const goToPrevSpread = useCallback(() => {
    if (currentSpread > 0 && !isFlipping) {
      setFlipDirection('left');
      setIsFlipping(true);
      setTimeout(() => {
        setCurrentSpread((s) => Math.max(0, s - 1));
        setIsFlipping(false);
        setFlipDirection(null);
      }, 300);
    }
  }, [currentSpread, isFlipping]);

  const goToNextSpread = useCallback(() => {
    if (currentSpread < totalSpreads - 1 && !isFlipping) {
      setFlipDirection('right');
      setIsFlipping(true);
      setTimeout(() => {
        setCurrentSpread((s) => Math.min(totalSpreads - 1, s + 1));
        setIsFlipping(false);
        setFlipDirection(null);
      }, 300);
    }
  }, [currentSpread, totalSpreads, isFlipping]);

  const goToPrev = useCallback(() => {
    if (isDesktop) {
      goToPrevSpread();
    } else {
      setCurrentPage((p) => Math.max(1, p - 1));
    }
  }, [isDesktop, goToPrevSpread]);

  const goToNext = useCallback(() => {
    if (isDesktop) {
      goToNextSpread();
    } else {
      setCurrentPage((p) => Math.min(pages.length, p + 1));
    }
  }, [isDesktop, goToNextSpread, pages.length]);

  const handleZoomIn = () => {
    setZoom((z) => Math.min(3, z + 0.25));
  };

  const handleZoomOut = () => {
    setZoom((z) => Math.max(0.5, z - 0.25));
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  };

  // Navigate to specific page from thumbnail
  const goToPage = (pageNumber: number) => {
    if (isDesktop) {
      const spreadIndex = Math.floor((pageNumber - 1) / 2);
      setCurrentSpread(spreadIndex);
    } else {
      setCurrentPage(pageNumber);
    }
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (annotationMode === 'sticker') {
      placeSticker(e, currentPage, zoom);
      renderAnnotations(currentPage, zoom);
    } else if (annotationMode === 'eraser') {
      eraseAtPoint(e, currentPage, zoom);
    } else {
      startDrawing(e, zoom);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (annotationMode === 'eraser' && e.buttons === 1) {
      eraseAtPoint(e, currentPage, zoom);
    } else {
      draw(e, zoom);
    }
    renderAnnotations(currentPage, zoom);
  };

  const handleMouseUp = () => {
    stopDrawing(currentPage);
    renderAnnotations(currentPage, zoom);
  };

  const currentPageData = pages[currentPage - 1];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-background flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-card">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowSidebar(!showSidebar)}
            className="lg:flex hidden"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <h2 className="font-semibold text-foreground truncate max-w-[200px] md:max-w-none">
            {bookTitle}
          </h2>
        </div>

        <div className="flex items-center gap-1">
          {/* Page indicator */}
          <span className="text-sm text-muted-foreground mr-2">
            {isDesktop ? (
              <>
                {leftPageIndex + 1}
                {rightPage ? `-${rightPageIndex + 1}` : ''} / {pages.length}
              </>
            ) : (
              <>{currentPage} / {pages.length}</>
            )}
          </span>

          {/* Zoom controls */}
          <Button variant="ghost" size="icon" onClick={handleZoomOut}>
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="text-sm w-12 text-center">
            {Math.round(zoom * 100)}%
          </span>
          <Button variant="ghost" size="icon" onClick={handleZoomIn}>
            <ZoomIn className="h-4 w-4" />
          </Button>

          {/* Fullscreen */}
          <Button variant="ghost" size="icon" onClick={toggleFullscreen}>
            {isFullscreen ? (
              <Minimize className="h-4 w-4" />
            ) : (
              <Maximize className="h-4 w-4" />
            )}
          </Button>

          {/* Close */}
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Annotation Toolbar (Desktop Only) */}
      <AnnotationToolbar
        mode={annotationMode}
        onModeChange={setAnnotationMode}
        color={annotationColor}
        onColorChange={setAnnotationColor}
        onUndo={undo}
        onRedo={redo}
        onClear={() => clearAnnotations(currentPage)}
        canUndo={canUndo}
        canRedo={canRedo}
        onStickerSelect={(sticker) => setPendingSticker(sticker)}
        pendingSticker={pendingSticker}
      />

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Thumbnail Sidebar - Desktop */}
        <AnimatePresence>
          {showSidebar && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 220, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="border-r bg-muted/30 hidden lg:block overflow-hidden"
            >
              <div className="h-full overflow-y-auto scrollbar-wide">
                <div className="p-3 space-y-3">
                  {pages.map((page) => {
                    const isInCurrentSpread = isDesktop && 
                      (page.page_number === leftPageIndex + 1 || page.page_number === rightPageIndex + 1);
                    const isCurrentMobile = !isDesktop && currentPage === page.page_number;
                    
                    return (
                      <button
                        key={page.id}
                        onClick={() => goToPage(page.page_number)}
                        className={cn(
                          'w-full rounded-lg overflow-hidden border-2 transition-colors',
                          (isInCurrentSpread || isCurrentMobile)
                            ? 'border-primary'
                            : 'border-transparent hover:border-muted-foreground/30'
                        )}
                      >
                        <img
                          src={page.thumbnail_url || page.image_url}
                          alt={`Page ${page.page_number}`}
                          className="w-full aspect-[3/4] object-cover"
                        />
                        <p className="text-xs text-center py-1.5 bg-muted/50 font-medium">
                          {page.page_number}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Page Display */}
        <div className="flex-1 relative flex items-center justify-center overflow-auto bg-muted/20">
          {isLoading ? (
            <div className="text-muted-foreground">Loading pages...</div>
          ) : isDesktop && leftPage ? (
            /* Desktop: 2-Page Spread with Flip Animation */
            <div
              className="relative flex items-center justify-center gap-1"
              style={{ transform: `scale(${zoom})`, transformOrigin: 'center center' }}
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentSpread}
                  initial={{ 
                    rotateY: flipDirection === 'right' ? -15 : flipDirection === 'left' ? 15 : 0,
                    opacity: 0.5,
                    scale: 0.95
                  }}
                  animate={{ 
                    rotateY: 0,
                    opacity: 1,
                    scale: 1
                  }}
                  exit={{ 
                    rotateY: flipDirection === 'right' ? 15 : flipDirection === 'left' ? -15 : 0,
                    opacity: 0.5,
                    scale: 0.95
                  }}
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                  className="flex items-center justify-center gap-1 perspective-1000"
                  style={{ transformStyle: 'preserve-3d' }}
                >
                  {/* Left Page */}
                  <div className="relative shadow-lg bg-white">
                    <img
                      src={leftPage.image_url}
                      alt={`Page ${leftPageIndex + 1}`}
                      className="max-h-[calc(100vh-200px)] w-auto"
                      draggable={false}
                    />
                    {/* Page curl effect */}
                    <div className="absolute inset-y-0 right-0 w-4 bg-gradient-to-l from-black/5 to-transparent pointer-events-none" />
                  </div>
                  
                  {/* Right Page */}
                  {rightPage && (
                    <div className="relative shadow-lg bg-white">
                      <img
                        src={rightPage.image_url}
                        alt={`Page ${rightPageIndex + 1}`}
                        className="max-h-[calc(100vh-200px)] w-auto"
                        draggable={false}
                      />
                      {/* Page curl effect */}
                      <div className="absolute inset-y-0 left-0 w-4 bg-gradient-to-r from-black/5 to-transparent pointer-events-none" />
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
              
              {/* Center spine shadow */}
              <div className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-2 bg-gradient-to-r from-black/10 via-black/5 to-black/10 pointer-events-none z-10" />
            </div>
          ) : currentPageData ? (
            <div
              ref={containerRef}
              className="relative transition-transform duration-200"
              style={{ transform: `scale(${zoom})`, transformOrigin: 'center center' }}
            >
              <img
                ref={imageRef}
                src={currentPageData.image_url}
                alt={`Page ${currentPage}`}
                className="max-h-[calc(100vh-180px)] w-auto shadow-lg"
                draggable={false}
                onLoad={handleImageLoad}
              />
              {/* Canvas Overlay for Annotations */}
              <canvas
                ref={canvasRef}
                className={cn(
                  'absolute inset-0 w-full h-full',
                  annotationMode !== 'none' ? (annotationMode === 'sticker' ? 'cursor-copy' : 'cursor-crosshair') : 'pointer-events-none'
                )}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
              />
            </div>
          ) : (
            <div className="text-muted-foreground">No pages available</div>
          )}

          {/* Navigation Arrows */}
          <Button
            variant="secondary"
            size="icon"
            className="absolute left-4 top-1/2 -translate-y-1/2 opacity-70 hover:opacity-100"
            onClick={goToPrev}
            disabled={isDesktop ? currentSpread <= 0 || isFlipping : currentPage <= 1}
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>

          <Button
            variant="secondary"
            size="icon"
            className="absolute right-4 top-1/2 -translate-y-1/2 opacity-70 hover:opacity-100"
            onClick={goToNext}
            disabled={isDesktop ? currentSpread >= totalSpreads - 1 || isFlipping : currentPage >= pages.length}
          >
            <ChevronRight className="h-6 w-6" />
          </Button>
        </div>
      </div>

      {/* Mobile Fullscreen Thumbnail Overlay */}
      <AnimatePresence>
        {showMobileThumbnails && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="lg:hidden fixed inset-0 z-[60] bg-background flex flex-col"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <h3 className="font-semibold">Pages</h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowMobileThumbnails(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            <ScrollArea className="flex-1">
              <div className="grid grid-cols-3 md:grid-cols-4 gap-3 p-3">
                {pages.map((page) => (
                  <button
                    key={page.id}
                    ref={(el) => {
                      if (el) thumbnailRefs.current.set(page.page_number, el);
                    }}
                    onClick={() => {
                      setCurrentPage(page.page_number);
                      setShowMobileThumbnails(false);
                    }}
                    className={cn(
                      'rounded-lg overflow-hidden border-2 transition-colors',
                      currentPage === page.page_number
                        ? 'border-primary'
                        : 'border-transparent hover:border-muted-foreground/30'
                    )}
                  >
                    <img
                      src={page.thumbnail_url || page.image_url}
                      alt={`Page ${page.page_number}`}
                      className="w-full aspect-[3/4] object-cover"
                    />
                    <p className="text-xs text-center py-1.5 bg-muted/50 font-medium">
                      {page.page_number}
                    </p>
                  </button>
                ))}
              </div>
            </ScrollArea>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Page Navigation */}
      <div className="lg:hidden flex items-center justify-center gap-4 py-3 border-t bg-card">
        <Button variant="outline" size="sm" onClick={goToPrev} disabled={currentPage <= 1}>
          <ChevronLeft className="h-4 w-4 mr-1" />
          Prev
        </Button>
        <span className="text-sm">
          {currentPage} / {pages.length}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={goToNext}
          disabled={currentPage >= pages.length}
        >
          Next
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowMobileThumbnails(true)}
          className={cn(isJumping && 'animate-bounce-subtle')}
        >
          <LayoutGrid className="h-4 w-4" />
        </Button>
      </div>
    </motion.div>
  );
};
