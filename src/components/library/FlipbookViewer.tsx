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
  ScanLine,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { useAnnotations } from '@/hooks/useAnnotations';
import { usePageDetection } from '@/hooks/usePageDetection';
import { AnnotationToolbar } from './AnnotationToolbar';
import { StickerOverlay, PlacedSticker } from './StickerOverlay';
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
  initialPage?: number;
}

export const FlipbookViewer = ({
  bookId,
  bookTitle,
  onClose,
  initialPage,
}: FlipbookViewerProps) => {
  const [pages, setPages] = useState<BookPage[]>([]);
  const [currentSpread, setCurrentSpread] = useState(0); // For desktop: spread index (0 = pages 1-2, 1 = pages 3-4, etc.)
  const [currentPage, setCurrentPage] = useState(1); // For mobile: single page
  const [zoom, setZoom] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [showMobileThumbnails, setShowMobileThumbnails] = useState(false);
  const [showDesktopThumbnails, setShowDesktopThumbnails] = useState(false);
  const [viewMode, setViewMode] = useState<'single' | 'spread'>('spread');
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [isJumping, setIsJumping] = useState(false);
  const [flipDirection, setFlipDirection] = useState<'left' | 'right' | null>(null);
  const [isFlipping, setIsFlipping] = useState(false);
  const [slideDirection, setSlideDirection] = useState<'left' | 'right'>('right');
  const [placedStickers, setPlacedStickers] = useState<Map<number, PlacedSticker[]>>(new Map());
  const [containerRect, setContainerRect] = useState<DOMRect | null>(null);
  
  const isMobile = useIsMobile();
  const isDesktop = !isMobile && typeof window !== 'undefined' && window.innerWidth >= 1024;
  
  const thumbnailRefs = useRef<Map<number, HTMLButtonElement>>(new Map());
  const imageRef = useRef<HTMLImageElement>(null);
  const pageContainerRef = useRef<HTMLDivElement>(null);

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

  // Page detection hook
  const {
    detectedPages,
    isDetecting,
    detectionProgress,
    detectPagesSequentially,
    getPageDisplayInfo,
  } = usePageDetection({ bookId });

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

  // Navigate to initial page when specified (from search results)
  useEffect(() => {
    if (initialPage && pages.length > 0 && !isLoading) {
      const targetPage = Math.min(Math.max(1, initialPage), pages.length);
      setCurrentPage(targetPage);
      
      // Also set spread for desktop view
      const spreadIndex = Math.floor((targetPage - 1) / 2);
      setCurrentSpread(spreadIndex);
    }
  }, [initialPage, pages.length, isLoading]);

  // Auto-detect page numbers when pages are loaded (run once per book)
  const hasTriggeredDetection = useRef(false);
  useEffect(() => {
    if (pages.length > 0 && !hasTriggeredDetection.current) {
      hasTriggeredDetection.current = true;
      const pagesToDetect = pages.map(page => ({
        pageIndex: page.page_number - 1,
        imageUrl: page.thumbnail_url || page.image_url,
        pageId: page.id,
      }));
      
      detectPagesSequentially(pagesToDetect);
    }
  }, [pages, detectPagesSequentially]);

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
      }, 600); // Match the flip animation duration
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
      }, 600); // Match the flip animation duration
    }
  }, [currentSpread, totalSpreads, isFlipping]);

  const goToPrev = useCallback(() => {
    if (isDesktop && viewMode === 'spread') {
      goToPrevSpread();
    } else {
      setSlideDirection('left');
      setCurrentPage((p) => Math.max(1, p - 1));
    }
  }, [isDesktop, viewMode, goToPrevSpread]);

  const goToNext = useCallback(() => {
    if (isDesktop && viewMode === 'spread') {
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

  // Handle sticker placement from click
  const handleStickerPlace = useCallback((sticker: { type: 'emoji' | 'icon'; value: string }) => {
    if (!pageContainerRef.current) return;
    
    const rect = pageContainerRef.current.getBoundingClientRect();
    setContainerRect(rect);
    
    // Place sticker in center of visible area
    const centerX = (rect.width / 2) / zoom;
    const centerY = (rect.height / 2) / zoom;
    
    const newSticker: PlacedSticker = {
      id: crypto.randomUUID(),
      type: sticker.type,
      value: sticker.value,
      x: centerX - 24, // offset by half the default size
      y: centerY - 24,
      size: 48,
    };
    
    setPlacedStickers(prev => {
      const pageStickers = prev.get(currentPage) || [];
      const updated = new Map(prev);
      updated.set(currentPage, [...pageStickers, newSticker]);
      return updated;
    });
    
    setPendingSticker(null);
    setAnnotationMode('none');
  }, [currentPage, zoom, setPendingSticker, setAnnotationMode]);

  // Update sticker position or size
  const handleStickerUpdate = useCallback((id: string, updates: Partial<PlacedSticker>) => {
    setPlacedStickers(prev => {
      const pageStickers = prev.get(currentPage) || [];
      const updated = new Map(prev);
      updated.set(currentPage, pageStickers.map(s => 
        s.id === id ? { ...s, ...updates } : s
      ));
      return updated;
    });
  }, [currentPage]);

  // Remove sticker
  const handleStickerRemove = useCallback((id: string) => {
    setPlacedStickers(prev => {
      const pageStickers = prev.get(currentPage) || [];
      const updated = new Map(prev);
      updated.set(currentPage, pageStickers.filter(s => s.id !== id));
      return updated;
    });
  }, [currentPage]);

  // Update container rect when page container changes
  useEffect(() => {
    if (pageContainerRef.current) {
      setContainerRect(pageContainerRef.current.getBoundingClientRect());
    }
  }, [currentPage, zoom, viewMode]);

  // Auto-place sticker when one is selected in sticker mode
  useEffect(() => {
    if (pendingSticker && annotationMode === 'sticker') {
      handleStickerPlace(pendingSticker);
    }
  }, [pendingSticker, annotationMode, handleStickerPlace]);

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
          {/* AI Detection Status */}
          {isDetecting && (
            <div className="flex items-center gap-2 mr-4 text-sm text-muted-foreground">
              <ScanLine className="h-4 w-4 animate-pulse text-primary" />
              <span>Scanning pages...</span>
              <Progress value={detectionProgress} className="w-20 h-2" />
            </div>
          )}
          
          {/* Page indicator with detected page numbers */}
          <div className="flex items-center gap-2 mr-2">
            {isDesktop && viewMode === 'spread' ? (
              <span className="text-lg font-bold text-foreground">
                {(() => {
                  const leftInfo = getPageDisplayInfo(leftPageIndex);
                  const rightInfo = rightPage ? getPageDisplayInfo(rightPageIndex) : null;
                  const leftDisplay = leftInfo.pageType === 'cover' ? 'Cover' : 
                                      leftInfo.pageType === 'blank' ? '—' : 
                                      `Page ${leftInfo.displayNumber}`;
                  const rightDisplay = rightInfo ? (
                    rightInfo.pageType === 'cover' ? 'Cover' :
                    rightInfo.pageType === 'blank' ? '—' :
                    `Page ${rightInfo.displayNumber}`
                  ) : '';
                  return rightDisplay ? `${leftDisplay} • ${rightDisplay}` : leftDisplay;
                })()}
              </span>
            ) : (
              <span className="text-lg font-bold text-foreground">
                {(() => {
                  const info = getPageDisplayInfo(currentPage - 1);
                  return info.pageType === 'cover' ? 'Cover' :
                         info.pageType === 'blank' ? 'Blank Page' :
                         `Page ${info.displayNumber}`;
                })()}
              </span>
            )}
            <span className="text-sm text-muted-foreground">
              ({isDesktop && viewMode === 'spread' ? `${leftPageIndex + 1}${rightPage ? `-${rightPageIndex + 1}` : ''}` : currentPage} / {pages.length})
            </span>
          </div>

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
        onThumbnailsClick={() => setShowDesktopThumbnails(true)}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
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
                    const pageInfo = getPageDisplayInfo(page.page_number - 1);
                    
                    return (
                      <button
                        key={page.id}
                        onClick={() => goToPage(page.page_number)}
                        className={cn(
                          'w-full rounded-lg overflow-hidden border-2 transition-colors relative',
                          (isInCurrentSpread || isCurrentMobile)
                            ? 'border-primary'
                            : 'border-transparent hover:border-muted-foreground/30',
                          pageInfo.shouldHide && 'opacity-60'
                        )}
                      >
                        <div className="relative">
                          <img
                            src={page.thumbnail_url || page.image_url}
                            alt={`Page ${page.page_number}`}
                            className="w-full aspect-[3/4] object-cover"
                          />
                          {/* Page type badge */}
                          {pageInfo.isDetected && pageInfo.pageType !== 'numbered' && (
                            <div className={cn(
                              'absolute top-1 right-1 px-1.5 py-0.5 rounded text-[10px] font-medium',
                              pageInfo.pageType === 'cover' && 'bg-primary text-primary-foreground',
                              pageInfo.pageType === 'blank' && 'bg-muted text-muted-foreground'
                            )}>
                              {pageInfo.pageType === 'cover' ? 'Cover' : 'Blank'}
                            </div>
                          )}
                        </div>
                        <div className="py-1.5 bg-muted/50">
                          <p className={cn(
                            'text-center font-bold',
                            pageInfo.isDetected ? 'text-base' : 'text-xs'
                          )}>
                            {pageInfo.isDetected ? pageInfo.displayNumber : page.page_number}
                          </p>
                          {pageInfo.isDetected && pageInfo.pageType === 'numbered' && (
                            <p className="text-[10px] text-center text-muted-foreground">
                              (index {page.page_number})
                            </p>
                          )}
                        </div>
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
          ) : isDesktop && viewMode === 'spread' && leftPage ? (
            /* Desktop: 2-Page Spread with Heyzine-style Book Flip Animation */
            <div
              className="relative flex items-center justify-center"
              style={{ 
                transform: `scale(${zoom})`, 
                transformOrigin: 'center center',
                perspective: '2500px',
              }}
            >
              {/* Book container */}
              <div 
                className="relative flex"
                style={{ transformStyle: 'preserve-3d' }}
              >
                {/* Left Page - Static during forward flip, animates during backward flip */}
                <div 
                  className="relative bg-white shadow-xl"
                  style={{ 
                    transformStyle: 'preserve-3d',
                    zIndex: flipDirection === 'left' ? 10 : 1,
                  }}
                >
                  <img
                    src={leftPage.image_url}
                    alt={`Page ${leftPageIndex + 1}`}
                    className="max-h-[calc(100vh-200px)] w-auto block"
                    draggable={false}
                  />
                  {/* Inner shadow near spine */}
                  <div className="absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-black/8 to-transparent pointer-events-none" />
                </div>
                
                {/* Spine */}
                <div className="w-[3px] bg-gradient-to-r from-gray-400 via-gray-300 to-gray-400 self-stretch shadow-md" />
                
                {/* Right Page - Static during backward flip, animates during forward flip */}
                {rightPage && (
                  <div 
                    className="relative bg-white shadow-xl"
                    style={{ 
                      transformStyle: 'preserve-3d',
                      zIndex: flipDirection === 'right' ? 10 : 1,
                    }}
                  >
                    <img
                      src={rightPage.image_url}
                      alt={`Page ${rightPageIndex + 1}`}
                      className="max-h-[calc(100vh-200px)] w-auto block"
                      draggable={false}
                    />
                    {/* Inner shadow near spine */}
                    <div className="absolute inset-y-0 left-0 w-12 bg-gradient-to-r from-black/8 to-transparent pointer-events-none" />
                  </div>
                )}

                {/* Flipping Page Overlay - This creates the actual flip effect */}
                <AnimatePresence mode="wait">
                  {isFlipping && (
                    <motion.div
                      key={`flip-${currentSpread}-${flipDirection}`}
                      className="absolute inset-0 flex"
                      style={{ 
                        transformStyle: 'preserve-3d',
                        pointerEvents: 'none',
                      }}
                      initial={{ opacity: 1 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.05 }}
                    >
                      {/* Flipping page - positioned over right page for forward, left for backward */}
                      <motion.div
                        className="absolute bg-white shadow-2xl overflow-hidden"
                        style={{
                          width: flipDirection === 'right' 
                            ? (rightPage ? '50%' : '0') 
                            : '50%',
                          height: '100%',
                          left: flipDirection === 'right' ? '50%' : '0',
                          right: flipDirection === 'right' ? '0' : 'auto',
                          transformOrigin: flipDirection === 'right' ? 'left center' : 'right center',
                          transformStyle: 'preserve-3d',
                          backfaceVisibility: 'hidden',
                          zIndex: 20,
                        }}
                        initial={{ 
                          rotateY: 0,
                          boxShadow: '0 0 20px rgba(0,0,0,0.1)',
                        }}
                        animate={{ 
                          rotateY: flipDirection === 'right' ? -180 : 180,
                          boxShadow: '0 0 50px rgba(0,0,0,0.3)',
                        }}
                        transition={{ 
                          duration: 0.6,
                          ease: [0.645, 0.045, 0.355, 1], // Cubic bezier for realistic page flip
                        }}
                      >
                        {/* Front of flipping page */}
                        <div 
                          className="absolute inset-0 bg-white"
                          style={{ backfaceVisibility: 'hidden' }}
                        >
                          <img
                            src={flipDirection === 'right' ? rightPage?.image_url : leftPage.image_url}
                            alt="Flipping page"
                            className="w-full h-full object-cover"
                            draggable={false}
                          />
                          {/* Page shadow during flip */}
                          <motion.div 
                            className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-black/20 pointer-events-none"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.3 }}
                          />
                        </div>
                        
                        {/* Back of flipping page (shows next spread's page) */}
                        <div 
                          className="absolute inset-0 bg-white"
                          style={{ 
                            backfaceVisibility: 'hidden',
                            transform: 'rotateY(180deg)',
                          }}
                        >
                          <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                            <span className="text-gray-400 text-sm">Loading...</span>
                          </div>
                        </div>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          ) : isDesktop && viewMode === 'single' && currentPageData ? (
            /* Desktop: Single Page View with Slide Animation and Zoom Controls */
            <div className="relative flex flex-col items-center">
              {/* Zoom Controls for Single Page View */}
              <div className="absolute top-4 right-4 z-30 flex items-center gap-2 bg-card/90 backdrop-blur-sm rounded-lg p-2 shadow-lg border">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleZoomOut}>
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <span className="text-sm w-12 text-center font-medium">
                  {Math.round(zoom * 100)}%
                </span>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleZoomIn}>
                  <ZoomIn className="h-4 w-4" />
                </Button>
              </div>
              
              <AnimatePresence mode="wait" custom={slideDirection}>
                <motion.div
                  key={currentPage}
                  ref={(el) => {
                    if (containerRef) containerRef.current = el;
                    pageContainerRef.current = el;
                  }}
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
                    className="max-h-[calc(100vh-200px)] w-auto shadow-lg"
                    draggable={false}
                    onLoad={handleImageLoad}
                  />
                  {/* Canvas Overlay for Annotations */}
                  <canvas
                    ref={canvasRef}
                    className={cn(
                      'absolute inset-0 w-full h-full z-10',
                      annotationMode !== 'none' && annotationMode !== 'sticker' ? 'cursor-crosshair' : ''
                    )}
                    style={{ pointerEvents: annotationMode !== 'none' && annotationMode !== 'sticker' ? 'auto' : 'none' }}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                  />
                  
                  {/* Sticker Overlays */}
                  {(placedStickers.get(currentPage) || []).map((sticker) => (
                    <StickerOverlay
                      key={sticker.id}
                      sticker={sticker}
                      containerRect={containerRect}
                      zoom={zoom}
                      onUpdate={handleStickerUpdate}
                      onRemove={handleStickerRemove}
                    />
                  ))}
                </motion.div>
              </AnimatePresence>
            </div>
          ) : currentPageData ? (
            /* Mobile/Tablet: Single Page View with Slide Animation */
            <AnimatePresence mode="wait" custom={slideDirection}>
              <motion.div
                key={currentPage}
                ref={(el) => {
                  if (containerRef) containerRef.current = el;
                  pageContainerRef.current = el;
                }}
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
                    annotationMode !== 'none' && annotationMode !== 'sticker' ? 'cursor-crosshair' : ''
                  )}
                  style={{ pointerEvents: annotationMode !== 'none' && annotationMode !== 'sticker' ? 'auto' : 'none' }}
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                />
                
                {/* Sticker Overlays */}
                {(placedStickers.get(currentPage) || []).map((sticker) => (
                  <StickerOverlay
                    key={sticker.id}
                    sticker={sticker}
                    containerRect={containerRect}
                    zoom={zoom}
                    onUpdate={handleStickerUpdate}
                    onRemove={handleStickerRemove}
                  />
                ))}
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
            disabled={
              isDesktop && viewMode === 'spread'
                ? currentSpread <= 0 || isFlipping
                : currentPage <= 1
            }
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>

          <Button
            variant="secondary"
            size="icon"
            className="absolute right-4 top-1/2 -translate-y-1/2 opacity-70 hover:opacity-100"
            onClick={goToNext}
            disabled={
              isDesktop && viewMode === 'spread'
                ? currentSpread >= totalSpreads - 1 || isFlipping
                : currentPage >= pages.length
            }
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
                {pages.map((page) => {
                  const pageInfo = getPageDisplayInfo(page.page_number - 1);
                  
                  return (
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
                        'rounded-lg overflow-hidden border-2 transition-colors relative',
                        currentPage === page.page_number
                          ? 'border-primary'
                          : 'border-transparent hover:border-muted-foreground/30',
                        pageInfo.shouldHide && 'opacity-60'
                      )}
                    >
                      <div className="relative">
                        <img
                          src={page.thumbnail_url || page.image_url}
                          alt={`Page ${page.page_number}`}
                          className="w-full aspect-[3/4] object-cover"
                        />
                        {pageInfo.isDetected && pageInfo.pageType !== 'numbered' && (
                          <div className={cn(
                            'absolute top-1 right-1 px-1 py-0.5 rounded text-[9px] font-medium',
                            pageInfo.pageType === 'cover' && 'bg-primary text-primary-foreground',
                            pageInfo.pageType === 'blank' && 'bg-muted text-muted-foreground'
                          )}>
                            {pageInfo.pageType === 'cover' ? 'Cover' : 'Blank'}
                          </div>
                        )}
                      </div>
                      <div className="py-1.5 bg-muted/50">
                        <p className={cn(
                          'text-center font-bold',
                          pageInfo.isDetected ? 'text-sm' : 'text-xs'
                        )}>
                          {pageInfo.isDetected ? pageInfo.displayNumber : page.page_number}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </ScrollArea>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Desktop Fullscreen Thumbnail Overlay - 8 columns */}
      <AnimatePresence>
        {showDesktopThumbnails && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="hidden lg:flex fixed inset-0 z-[60] bg-background/95 backdrop-blur-sm flex-col"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h3 className="font-semibold text-lg">All Pages</h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowDesktopThumbnails(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            <ScrollArea className="flex-1">
              <div className="grid grid-cols-8 gap-4 p-6">
                {pages.map((page) => {
                  const isInCurrentSpread = viewMode === 'spread' && 
                    (page.page_number === leftPageIndex + 1 || page.page_number === rightPageIndex + 1);
                  const isCurrentSingle = viewMode === 'single' && currentPage === page.page_number;
                  const pageInfo = getPageDisplayInfo(page.page_number - 1);
                  
                  return (
                    <button
                      key={page.id}
                      onClick={() => {
                        if (viewMode === 'spread') {
                          const spreadIndex = Math.floor((page.page_number - 1) / 2);
                          setCurrentSpread(spreadIndex);
                        } else {
                          setCurrentPage(page.page_number);
                        }
                        setShowDesktopThumbnails(false);
                      }}
                      className={cn(
                        'rounded-lg overflow-hidden border-2 transition-all hover:scale-105 hover:shadow-lg relative',
                        (isInCurrentSpread || isCurrentSingle)
                          ? 'border-primary ring-2 ring-primary/20'
                          : 'border-transparent hover:border-muted-foreground/30',
                        pageInfo.shouldHide && 'opacity-60'
                      )}
                    >
                      <div className="relative">
                        <img
                          src={page.thumbnail_url || page.image_url}
                          alt={`Page ${page.page_number}`}
                          className="w-full aspect-[3/4] object-cover"
                        />
                        {pageInfo.isDetected && pageInfo.pageType !== 'numbered' && (
                          <div className={cn(
                            'absolute top-1 right-1 px-1.5 py-0.5 rounded text-[10px] font-medium',
                            pageInfo.pageType === 'cover' && 'bg-primary text-primary-foreground',
                            pageInfo.pageType === 'blank' && 'bg-muted text-muted-foreground'
                          )}>
                            {pageInfo.pageType === 'cover' ? 'Cover' : 'Blank'}
                          </div>
                        )}
                      </div>
                      <div className="py-2 bg-muted/50">
                        <p className={cn(
                          'text-center font-bold',
                          pageInfo.isDetected ? 'text-base' : 'text-xs'
                        )}>
                          {pageInfo.isDetected ? pageInfo.displayNumber : page.page_number}
                        </p>
                        {pageInfo.isDetected && pageInfo.pageType === 'numbered' && (
                          <p className="text-[10px] text-center text-muted-foreground">
                            (index {page.page_number})
                          </p>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </ScrollArea>
          </motion.div>
        )}
      </AnimatePresence>
      <div className="lg:hidden flex flex-col items-center gap-2 py-3 border-t bg-card">
        {/* Detected page number display - large and bold */}
        {(() => {
          const info = getPageDisplayInfo(currentPage - 1);
          return (
            <div className="text-center">
              <span className="text-2xl font-bold text-foreground">
                {info.pageType === 'cover' ? 'Cover' :
                 info.pageType === 'blank' ? 'Blank' :
                 `Page ${info.displayNumber}`}
              </span>
              {info.isDetected && info.pageType === 'numbered' && (
                <span className="text-xs text-muted-foreground ml-2">
                  (#{currentPage})
                </span>
              )}
            </div>
          );
        })()}
        
        {/* Navigation controls */}
        <div className="flex items-center justify-center gap-4">
          <Button variant="outline" size="sm" onClick={goToPrev} disabled={currentPage <= 1}>
            <ChevronLeft className="h-4 w-4 mr-1" />
            Prev
          </Button>
          <span className="text-sm text-muted-foreground">
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
      </div>
    </motion.div>
  );
};
