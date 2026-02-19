import { useState, useCallback, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Move, Maximize2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface PlacedSticker {
  id: string;
  type: 'emoji' | 'icon';
  value: string;
  x: number;
  y: number;
  size: number;
}

interface StickerOverlayProps {
  sticker: PlacedSticker;
  containerRect: DOMRect | null;
  zoom: number;
  onUpdate: (id: string, updates: Partial<PlacedSticker>) => void;
  onRemove: (id: string) => void;
}

export function StickerOverlay({
  sticker,
  containerRect,
  zoom,
  onUpdate,
  onRemove,
}: StickerOverlayProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [isSelected, setIsSelected] = useState(false);
  const stickerRef = useRef<HTMLDivElement>(null);
  const dragStart = useRef({ x: 0, y: 0, stickerX: 0, stickerY: 0 });
  const resizeStart = useRef({ x: 0, y: 0, size: 0 });

  // Handle click outside to deselect
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (stickerRef.current && !stickerRef.current.contains(e.target as Node)) {
        setIsSelected(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setIsSelected(true);
    setIsDragging(true);
    dragStart.current = {
      x: e.clientX,
      y: e.clientY,
      stickerX: sticker.x,
      stickerY: sticker.y,
    };
  }, [sticker.x, sticker.y]);

  const handleResizeMouseDown = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setIsResizing(true);
    resizeStart.current = {
      x: e.clientX,
      y: e.clientY,
      size: sticker.size,
    };
  }, [sticker.size]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging && containerRect) {
        const deltaX = (e.clientX - dragStart.current.x) / zoom;
        const deltaY = (e.clientY - dragStart.current.y) / zoom;
        
        const newX = Math.max(0, Math.min(containerRect.width / zoom - sticker.size, dragStart.current.stickerX + deltaX));
        const newY = Math.max(0, Math.min(containerRect.height / zoom - sticker.size, dragStart.current.stickerY + deltaY));
        
        onUpdate(sticker.id, { x: newX, y: newY });
      }
      
      if (isResizing) {
        const delta = Math.max(e.clientX - resizeStart.current.x, e.clientY - resizeStart.current.y) / zoom;
        const newSize = Math.max(24, Math.min(200, resizeStart.current.size + delta));
        onUpdate(sticker.id, { size: newSize });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
    };

    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, isResizing, containerRect, zoom, sticker.id, sticker.size, onUpdate]);

  return (
    <motion.div
      ref={stickerRef}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      className={cn(
        'absolute cursor-move select-none',
        isSelected && 'ring-2 ring-primary ring-offset-2 rounded-lg',
        (isDragging || isResizing) && 'z-50'
      )}
      style={{
        left: sticker.x * zoom,
        top: sticker.y * zoom,
        width: sticker.size * zoom,
        height: sticker.size * zoom,
      }}
      onMouseDown={handleMouseDown}
      onClick={(e) => {
        e.stopPropagation();
        setIsSelected(true);
      }}
    >
      {/* Sticker content */}
      {sticker.type === 'emoji' ? (
        <span 
          className="block w-full h-full flex items-center justify-center"
          style={{ fontSize: sticker.size * zoom * 0.8 }}
        >
          {sticker.value}
        </span>
      ) : (
        <img
          src={sticker.value}
          alt="Sticker"
          className="w-full h-full object-contain pointer-events-none"
          draggable={false}
        />
      )}

      {/* Controls - only show when selected */}
      {isSelected && (
        <>
          {/* Remove button */}
          <button
            className="absolute -top-2 -right-2 w-5 h-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center shadow-md hover:scale-110 transition-transform z-10"
            onClick={(e) => {
              e.stopPropagation();
              onRemove(sticker.id);
            }}
          >
            <X className="w-3 h-3" />
          </button>

          {/* Resize handle */}
          <div
            className="absolute -bottom-1 -right-1 w-4 h-4 bg-primary rounded-full cursor-se-resize flex items-center justify-center shadow-md hover:scale-110 transition-transform z-10"
            onMouseDown={handleResizeMouseDown}
          >
            <Maximize2 className="w-2.5 h-2.5 text-primary-foreground" />
          </div>

          {/* Move indicator */}
          <div className="absolute -top-2 -left-2 w-5 h-5 bg-secondary rounded-full flex items-center justify-center shadow-md z-10">
            <Move className="w-3 h-3 text-secondary-foreground" />
          </div>
        </>
      )}
    </motion.div>
  );
}
