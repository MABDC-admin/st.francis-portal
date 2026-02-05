import { useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Play, Trash2, GripVertical, Presentation, Loader2, Download, FileText, FileType } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CellOutput } from './CellOutput';
import { NotebookCell as NotebookCellType } from '@/hooks/useNotebooks';
import { parseSlides, exportToPptx, exportToPdf, STYLE_THEMES } from '@/utils/presentationExport';
import { cn } from '@/lib/utils';

const SLIDE_COUNT_OPTIONS = [4, 6, 8, 10, 12];

const STYLE_OPTIONS = [
  { value: 'modern', label: 'Modern Minimal' },
  { value: 'corporate', label: 'Corporate Professional' },
  { value: 'creative', label: 'Creative Colorful' },
  { value: 'academic', label: 'Academic' },
  { value: 'dark', label: 'Dark Mode' },
];

interface PresentationCellProps {
  cell: NotebookCellType;
  isRunning: boolean;
  streamingOutput?: string;
  onContentChange: (content: string) => void;
  onSave: (content: string, slideCount: number, style: string) => void;
  onDelete: () => void;
  onRun: (topic: string, slideCount: number, style: string) => void;
}

export function PresentationCell({
  cell,
  isRunning,
  streamingOutput,
  onContentChange,
  onSave,
  onDelete,
  onRun,
}: PresentationCellProps) {
  const [topic, setTopic] = useState(cell.content);
  const [slideCount, setSlideCount] = useState(cell.presentation_slide_count || 8);
  const [style, setStyle] = useState(cell.presentation_style || 'modern');
  const [isFocused, setIsFocused] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Sync with external content changes
  useEffect(() => {
    setTopic(cell.content);
  }, [cell.content]);

  useEffect(() => {
    if (cell.presentation_slide_count) {
      setSlideCount(cell.presentation_slide_count);
    }
  }, [cell.presentation_slide_count]);

  useEffect(() => {
    if (cell.presentation_style) {
      setStyle(cell.presentation_style);
    }
  }, [cell.presentation_style]);

  // Debounced save
  useEffect(() => {
    const timer = setTimeout(() => {
      if (topic !== cell.content || slideCount !== cell.presentation_slide_count || style !== cell.presentation_style) {
        onSave(topic, slideCount, style);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [topic, slideCount, style, cell.content, cell.presentation_slide_count, cell.presentation_style, onSave]);

  const handleTopicChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setTopic(value);
    onContentChange(value);
  }, [onContentChange]);

  const handleRun = useCallback(() => {
    if (!topic.trim()) return;
    onRun(topic, slideCount, style);
  }, [onRun, topic, slideCount, style]);

  const handleExportPptx = useCallback(async () => {
    const output = cell.output || streamingOutput;
    if (!output) return;

    setIsExporting(true);
    try {
      const slides = parseSlides(output);
      if (slides.length === 0) {
        console.error('No slides found in output');
        return;
      }
      await exportToPptx(slides, topic || 'Presentation', style);
    } catch (error) {
      console.error('Error exporting to PPTX:', error);
    } finally {
      setIsExporting(false);
    }
  }, [cell.output, streamingOutput, topic, style]);

  const handleExportPdf = useCallback(() => {
    const output = cell.output || streamingOutput;
    if (!output) return;

    setIsExporting(true);
    try {
      const slides = parseSlides(output);
      if (slides.length === 0) {
        console.error('No slides found in output');
        return;
      }
      exportToPdf(slides, topic || 'Presentation', style);
    } catch (error) {
      console.error('Error exporting to PDF:', error);
    } finally {
      setIsExporting(false);
    }
  }, [cell.output, streamingOutput, topic, style]);

  const displayOutput = isRunning ? streamingOutput : cell.output;
  const canExport = !isRunning && !!cell.output;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={cn(
        'group relative border rounded-lg mb-3 bg-card transition-shadow',
        isFocused && 'ring-2 ring-primary/50 shadow-md'
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 border-b bg-muted/50 rounded-t-lg">
        <div className="cursor-grab opacity-0 group-hover:opacity-100 transition-opacity">
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>

        <Badge variant="secondary" className="gap-1.5">
          <Presentation className="h-3.5 w-3.5" />
          <span className="text-xs">Presentation</span>
        </Badge>

        <div className="flex-1" />

        <Button
          variant="ghost"
          size="sm"
          onClick={handleRun}
          disabled={isRunning || !topic.trim()}
          className="h-7 gap-1.5"
        >
          {isRunning ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Play className="h-3.5 w-3.5" />
          )}
          <span className="text-xs">Generate</span>
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={onDelete}
          className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Topic Input */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">Topic</label>
          <Input
            value={topic}
            onChange={handleTopicChange}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder="Enter your presentation topic... (e.g., 'Artificial Intelligence in Healthcare')"
            className="text-base"
          />
        </div>

        {/* Options Row */}
        <div className="flex flex-wrap gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Slides</label>
            <Select
              value={slideCount.toString()}
              onValueChange={(value) => setSlideCount(parseInt(value, 10))}
            >
              <SelectTrigger className="w-24">
                <SelectValue placeholder="Slides" />
              </SelectTrigger>
              <SelectContent>
                {SLIDE_COUNT_OPTIONS.map((count) => (
                  <SelectItem key={count} value={count.toString()}>
                    {count} slides
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Style</label>
            <Select value={style} onValueChange={setStyle}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Style" />
              </SelectTrigger>
              <SelectContent>
                {STYLE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Output */}
      {displayOutput && (
        <div className="border-t">
          <div className="px-3 py-2 bg-muted/30 flex items-center justify-between">
            <Badge variant="secondary" className="text-xs">
              {isRunning ? 'Generating...' : 'Preview'}
            </Badge>
            {canExport && (
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleExportPptx}
                  disabled={isExporting}
                  className="h-7 gap-1.5 text-muted-foreground hover:text-foreground"
                >
                  <FileType className="h-3.5 w-3.5" />
                  <span className="text-xs">Download PPT</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleExportPdf}
                  disabled={isExporting}
                  className="h-7 gap-1.5 text-muted-foreground hover:text-foreground"
                >
                  <FileText className="h-3.5 w-3.5" />
                  <span className="text-xs">Download PDF</span>
                </Button>
              </div>
            )}
          </div>
          <div className="p-3 max-h-[500px] overflow-y-auto">
            <CellOutput content={displayOutput} isStreaming={isRunning} />
          </div>
        </div>
      )}
    </motion.div>
  );
}
