import { useState, useRef, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export type AnnotationType = 'none' | 'pencil' | 'highlighter' | 'text' | 'rect' | 'circle' | 'arrow' | 'eraser' | 'sticker';

export interface Point {
  x: number;
  y: number;
}

export interface StickerData {
  type: 'emoji' | 'icon';
  value: string;
  x: number;
  y: number;
  size: number;
}

export interface Annotation {
  id: string;
  type: Exclude<AnnotationType, 'none' | 'eraser'>;
  points?: Point[];
  start?: Point;
  end?: Point;
  text?: string;
  color: string;
  strokeWidth: number;
  sticker?: StickerData;
}

export interface PageAnnotations {
  [pageNumber: number]: Annotation[];
}

export const ANNOTATION_COLORS = [
  '#EF4444', // Red
  '#F97316', // Orange
  '#EAB308', // Yellow
  '#22C55E', // Green
  '#3B82F6', // Blue
  '#8B5CF6', // Purple
  '#000000', // Black
];

export function useAnnotations(bookId?: string) {
  const { user } = useAuth();
  const [annotationMode, setAnnotationMode] = useState<AnnotationType>('none');
  const [annotationColor, setAnnotationColor] = useState(ANNOTATION_COLORS[0]);
  const [annotations, setAnnotations] = useState<PageAnnotations>({});
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPath, setCurrentPath] = useState<Point[]>([]);
  const [shapeStart, setShapeStart] = useState<Point | null>(null);
  const [shapeEnd, setShapeEnd] = useState<Point | null>(null);
  const [history, setHistory] = useState<PageAnnotations[]>([{}]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [pendingSticker, setPendingSticker] = useState<{ type: 'emoji' | 'icon'; value: string } | null>(null);
  const [loadedImages, setLoadedImages] = useState<Map<string, HTMLImageElement>>(new Map());
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const getStrokeWidth = useCallback((mode: AnnotationType) => {
    switch (mode) {
      case 'pencil': return 2;
      case 'highlighter': return 20;
      case 'rect':
      case 'circle':
      case 'arrow': return 3;
      default: return 2;
    }
  }, []);

  const saveToHistory = useCallback((newAnnotations: PageAnnotations) => {
    setHistory(prev => {
      const newHistory = prev.slice(0, historyIndex + 1);
      newHistory.push({ ...newAnnotations });
      return newHistory;
    });
    setHistoryIndex(prev => prev + 1);
  }, [historyIndex]);

  // Fetch annotations from Supabase
  useEffect(() => {
    if (!bookId || !user) return;

    const fetchAnnotations = async () => {
      try {
        const { data, error } = await (supabase.from('book_annotations' as any))
          .select('*')
          .eq('book_id', bookId)
          .eq('user_id', user.id);

        if (error) throw error;

        if (data) {
          const loadedAnnotations: PageAnnotations = {};
          (data as any[]).forEach(item => {
            if (!loadedAnnotations[item.page_number]) {
              loadedAnnotations[item.page_number] = [];
            }
            loadedAnnotations[item.page_number].push({
              ...(item.data as any),
              id: item.id, // Use DB ID
            });
          });
          setAnnotations(loadedAnnotations);
          setHistory([loadedAnnotations]);
          setHistoryIndex(0);
        }
      } catch (err: any) {
        console.error('Error fetching annotations:', err);
        // Silently fail to not block reading
      }
    };

    fetchAnnotations();
  }, [bookId, user]);

  // Persistence Helper
  const syncAnnotationsToDb = useCallback(async (pageNumber: number, pageAnns: Annotation[]) => {
    if (!bookId || !user) return;

    try {
      // Simplest way: Delete existing and re-insert for this page
      // In a more complex app, we'd use fine-grained updates, but for stickers/pencil, 
      // page-level grouping is manageable.

      // Actually, let's just use the current state to bulk save
      // For performance, we could debounce this, but let's get the core working.

      const { error: deleteError } = await (supabase.from('book_annotations' as any))
        .delete()
        .eq('book_id', bookId)
        .eq('user_id', user.id)
        .eq('page_number', pageNumber);

      if (deleteError) throw deleteError;

      if (pageAnns.length > 0) {
        const { error: insertError } = await (supabase.from('book_annotations' as any))
          .insert(
            pageAnns.map(ann => ({
              book_id: bookId,
              user_id: user.id,
              page_number: pageNumber,
              type: ann.type,
              data: ann as any
            }))
          );

        if (insertError) throw insertError;
      }
    } catch (err: any) {
      console.error('Error syncing annotations:', err);
      toast.error('Failed to save changes to cloud');
    }
  }, [bookId, user]);

  const undo = useCallback(async () => {
    if (historyIndex > 0) {
      const prevAnnotations = history[historyIndex - 1];
      setHistoryIndex(prev => prev - 1);
      setAnnotations(prevAnnotations);

      // Sync all changed pages to DB
      // For simplicity, we sync active history item
      Object.keys(prevAnnotations).forEach(page => {
        syncAnnotationsToDb(Number(page), prevAnnotations[Number(page)]);
      });
    }
  }, [historyIndex, history, syncAnnotationsToDb]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const nextAnnotations = history[historyIndex + 1];
      setHistoryIndex(prev => prev + 1);
      setAnnotations(nextAnnotations);

      Object.keys(nextAnnotations).forEach(page => {
        syncAnnotationsToDb(Number(page), nextAnnotations[Number(page)]);
      });
    }
  }, [historyIndex, history, syncAnnotationsToDb]);

  const clearAnnotations = useCallback((pageNumber: number) => {
    setAnnotations(prev => {
      const newAnnotations = { ...prev, [pageNumber]: [] };
      saveToHistory(newAnnotations);
      syncAnnotationsToDb(pageNumber, []);
      return newAnnotations;
    });
  }, [saveToHistory, syncAnnotationsToDb]);

  const getCanvasCoordinates = useCallback((e: React.MouseEvent<HTMLCanvasElement>, zoom: number): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    // Map from displayed size to internal canvas coordinates
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
      x: ((e.clientX - rect.left) * scaleX) / zoom,
      y: ((e.clientY - rect.top) * scaleY) / zoom,
    };
  }, []);

  const startDrawing = useCallback((e: React.MouseEvent<HTMLCanvasElement>, zoom: number) => {
    if (annotationMode === 'none') return;

    const point = getCanvasCoordinates(e, zoom);
    setIsDrawing(true);

    if (annotationMode === 'pencil' || annotationMode === 'highlighter') {
      setCurrentPath([point]);
    } else if (['rect', 'circle', 'arrow'].includes(annotationMode)) {
      setShapeStart(point);
      setShapeEnd(point);
    }
  }, [annotationMode, getCanvasCoordinates]);

  const draw = useCallback((e: React.MouseEvent<HTMLCanvasElement>, zoom: number) => {
    if (!isDrawing || annotationMode === 'none') return;

    const point = getCanvasCoordinates(e, zoom);

    if (annotationMode === 'pencil' || annotationMode === 'highlighter') {
      setCurrentPath(prev => [...prev, point]);
    } else if (['rect', 'circle', 'arrow'].includes(annotationMode)) {
      setShapeEnd(point);
    }
  }, [isDrawing, annotationMode, getCanvasCoordinates]);

  const stopDrawing = useCallback((pageNumber: number) => {
    if (!isDrawing || annotationMode === 'none') return;

    setIsDrawing(false);

    const newAnnotation: Annotation = {
      id: crypto.randomUUID(),
      type: annotationMode as Exclude<AnnotationType, 'none' | 'eraser'>,
      color: annotationColor,
      strokeWidth: getStrokeWidth(annotationMode),
    };

    if (annotationMode === 'pencil' || annotationMode === 'highlighter') {
      if (currentPath.length < 2) {
        setCurrentPath([]);
        return;
      }
      newAnnotation.points = [...currentPath];
    } else if (['rect', 'circle', 'arrow'].includes(annotationMode) && shapeStart && shapeEnd) {
      newAnnotation.start = shapeStart;
      newAnnotation.end = shapeEnd;
    }

    setAnnotations(prev => {
      const pageAnns = prev[pageNumber] || [];
      const updatedAnns = [...pageAnns, newAnnotation];
      const newAnnotations = { ...prev, [pageNumber]: updatedAnns };
      saveToHistory(newAnnotations);
      syncAnnotationsToDb(pageNumber, updatedAnns);
      return newAnnotations;
    });

    setCurrentPath([]);
    setShapeStart(null);
    setShapeEnd(null);
  }, [isDrawing, annotationMode, annotationColor, currentPath, shapeStart, shapeEnd, getStrokeWidth, saveToHistory]);

  const placeSticker = useCallback((e: React.MouseEvent<HTMLCanvasElement>, pageNumber: number, zoom: number) => {
    if (annotationMode !== 'sticker' || !pendingSticker) return;

    const point = getCanvasCoordinates(e, zoom);
    const stickerSize = 48; // Default sticker size

    const newAnnotation: Annotation = {
      id: crypto.randomUUID(),
      type: 'sticker',
      color: annotationColor,
      strokeWidth: 0,
      sticker: {
        type: pendingSticker.type,
        value: pendingSticker.value,
        x: point.x - stickerSize / 2,
        y: point.y - stickerSize / 2,
        size: stickerSize,
      },
    };

    // Preload icon image if needed
    if (pendingSticker.type === 'icon') {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = pendingSticker.value;
      img.onload = () => {
        setLoadedImages(prev => new Map(prev).set(pendingSticker.value, img));
      };
    }

    setAnnotations(prev => {
      const pageAnns = prev[pageNumber] || [];
      const updatedAnns = [...pageAnns, newAnnotation];
      const newAnnotations = { ...prev, [pageNumber]: updatedAnns };
      saveToHistory(newAnnotations);
      syncAnnotationsToDb(pageNumber, updatedAnns);
      return newAnnotations;
    });
  }, [annotationMode, pendingSticker, annotationColor, getCanvasCoordinates, saveToHistory]);

  // Place sticker at specific coordinates (for drag-and-drop)
  const placeStickerAtPosition = useCallback((
    sticker: { type: 'emoji' | 'icon'; value: string },
    pageNumber: number,
    x: number,
    y: number,
    zoom: number
  ) => {
    const stickerSize = 48;

    // Convert from displayed coordinates to canvas coordinates
    const canvasX = x / zoom;
    const canvasY = y / zoom;

    const newAnnotation: Annotation = {
      id: crypto.randomUUID(),
      type: 'sticker',
      color: annotationColor,
      strokeWidth: 0,
      sticker: {
        type: sticker.type,
        value: sticker.value,
        x: canvasX - stickerSize / 2,
        y: canvasY - stickerSize / 2,
        size: stickerSize,
      },
    };

    // Preload icon image if needed
    if (sticker.type === 'icon') {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = sticker.value;
      img.onload = () => {
        setLoadedImages(prev => new Map(prev).set(sticker.value, img));
      };
    }

    setAnnotations(prev => {
      const pageAnns = prev[pageNumber] || [];
      const updatedAnns = [...pageAnns, newAnnotation];
      const newAnnotations = { ...prev, [pageNumber]: updatedAnns };
      saveToHistory(newAnnotations);
      syncAnnotationsToDb(pageNumber, updatedAnns);
      return newAnnotations;
    });
  }, [annotationColor, saveToHistory]);

  const eraseAtPoint = useCallback((e: React.MouseEvent<HTMLCanvasElement>, pageNumber: number, zoom: number) => {
    if (annotationMode !== 'eraser') return;

    const point = getCanvasCoordinates(e, zoom);
    const eraseRadius = 15;

    setAnnotations(prev => {
      const pageAnns = prev[pageNumber] || [];
      const filtered = pageAnns.filter(ann => {
        // Handle sticker erasure
        if (ann.sticker) {
          const centerX = ann.sticker.x + ann.sticker.size / 2;
          const centerY = ann.sticker.y + ann.sticker.size / 2;
          return Math.sqrt(Math.pow(centerX - point.x, 2) + Math.pow(centerY - point.y, 2)) >= ann.sticker.size / 2;
        }
        if (ann.points) {
          return !ann.points.some(p =>
            Math.sqrt(Math.pow(p.x - point.x, 2) + Math.pow(p.y - point.y, 2)) < eraseRadius
          );
        }
        if (ann.start && ann.end) {
          const centerX = (ann.start.x + ann.end.x) / 2;
          const centerY = (ann.start.y + ann.end.y) / 2;
          return Math.sqrt(Math.pow(centerX - point.x, 2) + Math.pow(centerY - point.y, 2)) >= eraseRadius * 2;
        }
        return true;
      });

      if (filtered.length !== pageAnns.length) {
        const newAnnotations = { ...prev, [pageNumber]: filtered };
        saveToHistory(newAnnotations);
        syncAnnotationsToDb(pageNumber, filtered);
        return newAnnotations;
      }
      return prev;
    });
  }, [annotationMode, getCanvasCoordinates, saveToHistory]);

  const renderAnnotations = useCallback((pageNumber: number, zoom: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.scale(zoom, zoom);

    const pageAnns = annotations[pageNumber] || [];

    // Draw saved annotations
    pageAnns.forEach(ann => {
      ctx.strokeStyle = ann.color;
      ctx.fillStyle = ann.color;
      ctx.lineWidth = ann.strokeWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      if (ann.type === 'highlighter') {
        ctx.globalAlpha = 0.3;
      } else {
        ctx.globalAlpha = 1;
      }

      // Draw stickers
      if (ann.sticker) {
        ctx.globalAlpha = 1;
        if (ann.sticker.type === 'emoji') {
          ctx.font = `${ann.sticker.size}px serif`;
          ctx.textBaseline = 'top';
          ctx.fillText(ann.sticker.value, ann.sticker.x, ann.sticker.y);
        } else if (ann.sticker.type === 'icon') {
          const cachedImg = loadedImages.get(ann.sticker.value);
          if (cachedImg && cachedImg.complete) {
            ctx.drawImage(cachedImg, ann.sticker.x, ann.sticker.y, ann.sticker.size, ann.sticker.size);
          } else {
            // Load image if not cached
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.src = ann.sticker.value;
            img.onload = () => {
              setLoadedImages(prev => new Map(prev).set(ann.sticker!.value, img));
              renderAnnotations(pageNumber, zoom);
            };
          }
        }
        return;
      }

      if (ann.points && ann.points.length > 1) {
        ctx.beginPath();
        ctx.moveTo(ann.points[0].x, ann.points[0].y);
        ann.points.forEach(p => ctx.lineTo(p.x, p.y));
        ctx.stroke();
      }

      if (ann.start && ann.end) {
        if (ann.type === 'rect') {
          ctx.beginPath();
          ctx.rect(ann.start.x, ann.start.y, ann.end.x - ann.start.x, ann.end.y - ann.start.y);
          ctx.stroke();
        } else if (ann.type === 'circle') {
          const rx = Math.abs(ann.end.x - ann.start.x) / 2;
          const ry = Math.abs(ann.end.y - ann.start.y) / 2;
          const cx = ann.start.x + (ann.end.x - ann.start.x) / 2;
          const cy = ann.start.y + (ann.end.y - ann.start.y) / 2;
          ctx.beginPath();
          ctx.ellipse(cx, cy, rx, ry, 0, 0, 2 * Math.PI);
          ctx.stroke();
        } else if (ann.type === 'arrow') {
          drawArrow(ctx, ann.start, ann.end);
        }
      }
    });

    // Draw current stroke
    if (isDrawing && currentPath.length > 1) {
      ctx.strokeStyle = annotationColor;
      ctx.lineWidth = getStrokeWidth(annotationMode);
      ctx.globalAlpha = annotationMode === 'highlighter' ? 0.3 : 1;
      ctx.beginPath();
      ctx.moveTo(currentPath[0].x, currentPath[0].y);
      currentPath.forEach(p => ctx.lineTo(p.x, p.y));
      ctx.stroke();
    }

    // Draw current shape
    if (isDrawing && shapeStart && shapeEnd) {
      ctx.strokeStyle = annotationColor;
      ctx.lineWidth = getStrokeWidth(annotationMode);
      ctx.globalAlpha = 1;

      if (annotationMode === 'rect') {
        ctx.beginPath();
        ctx.rect(shapeStart.x, shapeStart.y, shapeEnd.x - shapeStart.x, shapeEnd.y - shapeStart.y);
        ctx.stroke();
      } else if (annotationMode === 'circle') {
        const rx = Math.abs(shapeEnd.x - shapeStart.x) / 2;
        const ry = Math.abs(shapeEnd.y - shapeStart.y) / 2;
        const cx = shapeStart.x + (shapeEnd.x - shapeStart.x) / 2;
        const cy = shapeStart.y + (shapeEnd.y - shapeStart.y) / 2;
        ctx.beginPath();
        ctx.ellipse(cx, cy, rx, ry, 0, 0, 2 * Math.PI);
        ctx.stroke();
      } else if (annotationMode === 'arrow') {
        drawArrow(ctx, shapeStart, shapeEnd);
      }
    }

    ctx.restore();
  }, [annotations, isDrawing, currentPath, shapeStart, shapeEnd, annotationColor, annotationMode, getStrokeWidth, loadedImages]);

  return {
    annotationMode,
    setAnnotationMode,
    annotationColor,
    setAnnotationColor,
    annotations,
    canvasRef,
    containerRef,
    isDrawing,
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
    updateAnnotation: (pageNumber: number, id: string, updates: Partial<Annotation>) => {
      setAnnotations(prev => {
        const pageAnns = prev[pageNumber] || [];
        const updatedAnns = pageAnns.map(ann =>
          ann.id === id ? { ...ann, ...updates } : ann
        );
        const newAnnotations = { ...prev, [pageNumber]: updatedAnns };
        saveToHistory(newAnnotations);
        syncAnnotationsToDb(pageNumber, updatedAnns);
        return newAnnotations;
      });
    },
    removeAnnotation: (pageNumber: number, id: string) => {
      setAnnotations(prev => {
        const pageAnns = prev[pageNumber] || [];
        const updatedAnns = pageAnns.filter(ann => ann.id !== id);
        const newAnnotations = { ...prev, [pageNumber]: updatedAnns };
        saveToHistory(newAnnotations);
        syncAnnotationsToDb(pageNumber, updatedAnns);
        return newAnnotations;
      });
    },
    canUndo: historyIndex > 0,
    canRedo: historyIndex < history.length - 1,
  };
}

function drawArrow(ctx: CanvasRenderingContext2D, start: Point, end: Point) {
  const headLen = 15;
  const angle = Math.atan2(end.y - start.y, end.x - start.x);

  ctx.beginPath();
  ctx.moveTo(start.x, start.y);
  ctx.lineTo(end.x, end.y);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(end.x, end.y);
  ctx.lineTo(
    end.x - headLen * Math.cos(angle - Math.PI / 6),
    end.y - headLen * Math.sin(angle - Math.PI / 6)
  );
  ctx.moveTo(end.x, end.y);
  ctx.lineTo(
    end.x - headLen * Math.cos(angle + Math.PI / 6),
    end.y - headLen * Math.sin(angle + Math.PI / 6)
  );
  ctx.stroke();
}
