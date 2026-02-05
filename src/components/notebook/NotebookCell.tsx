import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Play, Trash2, GripVertical, FileText, Bot, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { CellOutput } from './CellOutput';
import { NotebookCell as NotebookCellType } from '@/hooks/useNotebooks';
import { cn } from '@/lib/utils';

interface NotebookCellProps {
  cell: NotebookCellType;
  isRunning: boolean;
  streamingOutput?: string;
  onContentChange: (content: string) => void;
  onSave: (content: string) => void;
  onTypeChange: (type: 'markdown' | 'llm') => void;
  onDelete: () => void;
  onRun: () => void;
}

export function NotebookCell({
  cell,
  isRunning,
  streamingOutput,
  onContentChange,
  onSave,
  onTypeChange,
  onDelete,
  onRun,
}: NotebookCellProps) {
  const [localContent, setLocalContent] = useState(cell.content);
  const [isFocused, setIsFocused] = useState(false);

  // Sync with external content changes
  useEffect(() => {
    setLocalContent(cell.content);
  }, [cell.content]);

  // Debounced save
  useEffect(() => {
    const timer = setTimeout(() => {
      if (localContent !== cell.content) {
        onSave(localContent);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [localContent, cell.content, onSave]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setLocalContent(value);
    onContentChange(value);
  }, [onContentChange]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Shift+Enter to run LLM cells
    if (e.key === 'Enter' && e.shiftKey && cell.cell_type === 'llm') {
      e.preventDefault();
      onRun();
    }
  }, [cell.cell_type, onRun]);

  const displayOutput = isRunning ? streamingOutput : cell.output;

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

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-7 gap-1.5">
              {cell.cell_type === 'markdown' ? (
                <>
                  <FileText className="h-3.5 w-3.5" />
                  <span className="text-xs">Markdown</span>
                </>
              ) : (
                <>
                  <Bot className="h-3.5 w-3.5" />
                  <span className="text-xs">LLM Prompt</span>
                </>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem onClick={() => onTypeChange('markdown')}>
              <FileText className="h-4 w-4 mr-2" />
              Markdown
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onTypeChange('llm')}>
              <Bot className="h-4 w-4 mr-2" />
              LLM Prompt
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="flex-1" />

        {cell.cell_type === 'llm' && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onRun}
            disabled={isRunning || !localContent.trim()}
            className="h-7 gap-1.5"
          >
            {isRunning ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Play className="h-3.5 w-3.5" />
            )}
            <span className="text-xs">Run</span>
          </Button>
        )}

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
      <div className="p-3">
        <Textarea
          value={localContent}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={
            cell.cell_type === 'markdown'
              ? 'Write markdown content...'
              : 'Enter your prompt here... (Shift+Enter to run)'
          }
          className="min-h-[80px] resize-none border-none shadow-none focus-visible:ring-0 bg-transparent"
        />
      </div>

      {/* Output (for LLM cells) */}
      {cell.cell_type === 'llm' && displayOutput && (
        <div className="border-t">
          <div className="px-3 py-2 bg-muted/30">
            <Badge variant="secondary" className="text-xs">
              {isRunning ? 'Generating...' : 'Output'}
            </Badge>
          </div>
          <div className="p-3">
            <CellOutput content={displayOutput} isStreaming={isRunning} />
          </div>
        </div>
      )}
    </motion.div>
  );
}
