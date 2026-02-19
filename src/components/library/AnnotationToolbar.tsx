import { useState } from 'react';
import {
  Pencil,
  Highlighter,
  Square,
  Circle,
  MoveRight,
  Eraser,
  Undo2,
  Redo2,
  Trash2,
  Sparkles,
  LayoutGrid,
  Image,
  Columns2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { AnnotationType, ANNOTATION_COLORS } from '@/hooks/useAnnotations';
import { StickerPicker, StickerData } from './StickerPicker';
import { cn } from '@/lib/utils';

interface AnnotationToolbarProps {
  mode: AnnotationType;
  onModeChange: (mode: AnnotationType) => void;
  color: string;
  onColorChange: (color: string) => void;
  onUndo: () => void;
  onRedo: () => void;
  onClear: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onStickerSelect?: (sticker: StickerData) => void;
  pendingSticker?: { type: 'emoji' | 'icon'; value: string } | null;
  onThumbnailsClick?: () => void;
  viewMode?: 'single' | 'spread';
  onViewModeChange?: (mode: 'single' | 'spread') => void;
}

const tools = [
  { value: 'pencil', icon: Pencil, label: 'Pencil' },
  { value: 'highlighter', icon: Highlighter, label: 'Highlighter' },
  { value: 'rect', icon: Square, label: 'Rectangle' },
  { value: 'circle', icon: Circle, label: 'Circle' },
  { value: 'arrow', icon: MoveRight, label: 'Arrow' },
  { value: 'eraser', icon: Eraser, label: 'Eraser' },
] as const;

export function AnnotationToolbar({
  mode,
  onModeChange,
  color,
  onColorChange,
  onUndo,
  onRedo,
  onClear,
  canUndo,
  canRedo,
  onStickerSelect,
  pendingSticker,
  onThumbnailsClick,
  viewMode = 'spread',
  onViewModeChange,
}: AnnotationToolbarProps) {
  const handleStickerSelect = (sticker: StickerData) => {
    onStickerSelect?.(sticker);
    onModeChange('sticker');
  };

  return (
    <div className="hidden lg:flex items-center justify-between px-4 py-2 border-b bg-card gap-4">
      {/* Left: Drawing Tools + Colors */}
      <div className="flex items-center gap-4">
        {/* Drawing Tools */}
        <TooltipProvider delayDuration={300}>
          <ToggleGroup
            type="single"
            value={mode}
            onValueChange={(val) => onModeChange((val || 'none') as AnnotationType)}
            className="gap-1"
          >
            {tools.map((tool) => (
              <Tooltip key={tool.value}>
                <TooltipTrigger asChild>
                  <ToggleGroupItem
                    value={tool.value}
                    aria-label={tool.label}
                    className="h-8 w-8 p-0"
                  >
                    <tool.icon className="h-4 w-4" />
                  </ToggleGroupItem>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p>{tool.label}</p>
                </TooltipContent>
              </Tooltip>
            ))}
          </ToggleGroup>
        </TooltipProvider>

        {/* Color Picker */}
        <div className="flex items-center gap-1 border-l pl-4">
          {ANNOTATION_COLORS.map((c) => (
            <button
              key={c}
              onClick={() => onColorChange(c)}
              className={cn(
                'h-6 w-6 rounded-full border-2 transition-transform hover:scale-110',
                color === c ? 'border-foreground scale-110' : 'border-transparent'
              )}
              style={{ backgroundColor: c }}
              aria-label={`Select color ${c}`}
            />
          ))}
        </div>
      </div>

      {/* Center: Stickers + Thumbnails + View Mode */}
      <div className="flex items-center gap-2">
        {/* Thumbnails Button */}
        <TooltipProvider delayDuration={300}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-10 px-3"
                onClick={onThumbnailsClick}
              >
                <LayoutGrid className="h-4 w-4 mr-2" />
                Thumbnails
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>View All Pages</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* Sticker Button */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              className={cn(
                'sticker-button-animated h-10 px-4 text-white font-semibold shadow-lg',
                'hover:shadow-xl transition-shadow',
                mode === 'sticker' && 'ring-2 ring-white ring-offset-2 ring-offset-background'
              )}
            >
              {pendingSticker?.type === 'emoji' ? (
                <span className="text-lg mr-2">{pendingSticker.value}</span>
              ) : (
                <Sparkles className="h-4 w-4 mr-2" />
              )}
              Stickers
            </Button>
          </PopoverTrigger>
          <PopoverContent 
            className="w-[400px] p-0" 
            align="center"
          >
            <StickerPicker 
              onSelect={handleStickerSelect} 
            />
          </PopoverContent>
        </Popover>

        {/* View Mode Toggle */}
        <TooltipProvider delayDuration={300}>
          <div className="flex items-center gap-1 border-l pl-2 ml-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={viewMode === 'single' ? 'secondary' : 'ghost'}
                  size="sm"
                  className="h-8 px-3"
                  onClick={() => onViewModeChange?.('single')}
                >
                  <Image className="h-4 w-4 mr-1.5" />
                  1 Page
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p>Single Page View</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={viewMode === 'spread' ? 'secondary' : 'ghost'}
                  size="sm"
                  className="h-8 px-3"
                  onClick={() => onViewModeChange?.('spread')}
                >
                  <Columns2 className="h-4 w-4 mr-1.5" />
                  2 Pages
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p>Two Page Spread</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </TooltipProvider>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-1">
        <TooltipProvider delayDuration={300}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={onUndo}
                disabled={!canUndo}
                className="h-8 w-8"
              >
                <Undo2 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>Undo</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={onRedo}
                disabled={!canRedo}
                className="h-8 w-8"
              >
                <Redo2 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>Redo</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClear}
                className="h-8 w-8 text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>Clear All</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
}
