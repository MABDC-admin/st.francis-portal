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
  const [slideDirection, setSlideDirection] = useState<'left' | 'right'>('right');
  const [isDragOver, setIsDragOver] = useState(false);
  
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
    placeStickerAtPosition,
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
      setSlideDirection('left');
      setCurrentPage((p) => Math.max(1, p - 1));
    }
  }, [isDesktop, goToPrevSpread]);

  const goToNext = useCallback(() => {
    if (isDesktop) {
      goToNextSpread();
    } else {
      setSlideDirection('right');
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

  // Handle drag-and-drop for stickers
  const handleDragOver = (e: React.DragEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleDragEnter = (e: React.DragEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const stickerData = e.dataTransfer.getData('application/sticker');
    if (!stickerData) return;
    
    try {
      const sticker = JSON.parse(stickerData) as { type: 'emoji' | 'icon'; value: string };
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      
      const x = (e.clientX - rect.left) * scaleX;
      const y = (e.clientY - rect.top) * scaleY;
      
      placeStickerAtPosition(sticker, currentPage, x, y, zoom);
      renderAnnotations(currentPage, zoom);
    } catch (error) {
      console.error('Failed to parse sticker data:', error);
    }
  };

  // Mobile slide animation variants
  const slideVariants = {
    enter: (direction: 'left' | 'right') => ({
      x: direction === 'right' ? 100 : -100,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: 'left' | 'right') => ({
      x: direction === 'right' ? -100 : 100,
      opacity: 0,
    }),
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
            /* Desktop: 2-Page Spread with Enhanced 3D Flip Animation */
            <div
              className="relative flex items-center justify-center"
              style={{ 
                transform: `scale(${zoom})`, 
                transformOrigin: 'center center',
                perspective: '2000px',
              }}
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={currentSpread}
                  initial={{ 
                    rotateY: flipDirection === 'right' ? -90 : flipDirection === 'left' ? 90 : 0,
                    opacity: 0,
                    x: flipDirection === 'right' ? 50 : flipDirection === 'left' ? -50 : 0,
                  }}
                  animate={{ 
                    rotateY: 0,
                    opacity: 1,
                    x: 0,
                  }}
                  exit={{ 
                    rotateY: flipDirection === 'right' ? 90 : flipDirection === 'left' ? -90 : 0,
                    opacity: 0,
                    x: flipDirection === 'right' ? -50 : flipDirection === 'left' ? 50 : 0,
                  }}
                  transition={{ 
                    duration: 0.5, 
                    ease: [0.4, 0, 0.2, 1],
                  }}
                  className="flex items-center justify-center gap-0"
                  style={{ 
                    transformStyle: 'preserve-3d',
                    transformOrigin: flipDirection === 'right' ? 'left center' : 'right center',
                  }}
                >
                  {/* Left Page */}
                  <motion.div 
                    className="relative shadow-2xl bg-white"
                    style={{ 
                      transformStyle: 'preserve-3d',
                      backfaceVisibility: 'hidden',
                    }}
                    initial={{ rotateY: flipDirection === 'left' ? 45 : 0 }}
                    animate={{ rotateY: 0 }}
                    transition={{ duration: 0.4, ease: 'easeOut' }}
                  >
                    <img
                      src={leftPage.image_url}
                      alt={`Page ${leftPageIndex + 1}`}
                      className="max-h-[calc(100vh-200px)] w-auto"
                      draggable={false}
                    />
                    {/* Page curl effect - enhanced shadow */}
                    <div className="absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-black/10 via-black/5 to-transparent pointer-events-none" />
                    {/* Inner page shadow */}
                    <div className="absolute inset-0 shadow-inner pointer-events-none" />
                  </motion.div>
                  
                  {/* Center spine */}
                  <div className="w-1 bg-gradient-to-r from-black/20 via-black/30 to-black/20 self-stretch" />
                  
                  {/* Right Page */}
                  {rightPage && (
                    <motion.div 
                      className="relative shadow-2xl bg-white"
                      style={{ 
                        transformStyle: 'preserve-3d',
                        backfaceVisibility: 'hidden',
                      }}
                      initial={{ rotateY: flipDirection === 'right' ? -45 : 0 }}
                      animate={{ rotateY: 0 }}
                      transition={{ duration: 0.4, ease: 'easeOut' }}
                    >
                      <img
                        src={rightPage.image_url}
                        alt={`Page ${rightPageIndex + 1}`}
                        className="max-h-[calc(100vh-200px)] w-auto"
                        draggable={false}
                      />
                      {/* Page curl effect - enhanced shadow */}
                      <div className="absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-black/10 via-black/5 to-transparent pointer-events-none" />
                      {/* Inner page shadow */}
                      <div className="absolute inset-0 shadow-inner pointer-events-none" />
                    </motion.div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          ) : currentPageData ? (
            <AnimatePresence mode="wait" custom={slideDirection}>
              <motion.div
                key={currentPage}
                ref={containerRef}
                custom={slideDirection}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.25, ease: 'easeInOut' }}
                className="relative"
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
                    'absolute inset-0 w-full h-full z-10',
                    annotationMode !== 'none' ? (annotationMode === 'sticker' ? 'cursor-copy' : 'cursor-crosshair') : '',
                    isDragOver && 'ring-2 ring-primary ring-inset'
                  )}
                  style={{ pointerEvents: 'auto' }}
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                  onDragEnter={handleDragEnter}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                />
              </motion.div>
            </AnimatePresence>
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
