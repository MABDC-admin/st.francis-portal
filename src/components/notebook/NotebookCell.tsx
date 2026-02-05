import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Play, Trash2, GripVertical, FileText, Bot, Loader2, Download, Presentation } from 'lucide-react';
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
import { PdfUploadZone } from './PdfUploadZone';
import { PresentationCell } from './PresentationCell';
import { NotebookCell as NotebookCellType } from '@/hooks/useNotebooks';
import { ExtractedPdfResult } from '@/utils/extractPdfText';
import { exportNotebookToPdf } from '@/utils/notebookPdfExport';
import { cn } from '@/lib/utils';

interface PdfInfo {
  filename: string;
  pageCount: number;
  extractedText: string;
}

interface NotebookCellProps {
  cell: NotebookCellType;
  isRunning: boolean;
  streamingOutput?: string;
  onContentChange: (content: string) => void;
  onSave: (content: string) => void;
  onTypeChange: (type: 'markdown' | 'llm' | 'presentation') => void;
  onDelete: () => void;
  onRun: (pdfText?: string, pdfFilename?: string) => void;
  onRunPresentation?: (topic: string, slideCount: number, style: string) => void;
  onSavePresentation?: (content: string, slideCount: number, style: string) => void;
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
  onRunPresentation,
  onSavePresentation,
}: NotebookCellProps) {
  const [localContent, setLocalContent] = useState(cell.content);
  const [isFocused, setIsFocused] = useState(false);
  const [pdfInfo, setPdfInfo] = useState<PdfInfo | null>(() => {
    // Initialize from cell data if available
    if (cell.pdf_filename && cell.pdf_page_count && cell.pdf_extracted_text) {
      return {
        filename: cell.pdf_filename,
        pageCount: cell.pdf_page_count,
        extractedText: cell.pdf_extracted_text,
      };
    }
    return null;
  });

  // Sync with external content changes
  useEffect(() => {
    setLocalContent(cell.content);
  }, [cell.content]);

  // Sync PDF info from cell data
  useEffect(() => {
    if (cell.pdf_filename && cell.pdf_page_count && cell.pdf_extracted_text) {
      setPdfInfo({
        filename: cell.pdf_filename,
        pageCount: cell.pdf_page_count,
        extractedText: cell.pdf_extracted_text,
      });
    }
  }, [cell.pdf_filename, cell.pdf_page_count, cell.pdf_extracted_text]);

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
      onRun(pdfInfo?.extractedText, pdfInfo?.filename);
    }
  }, [cell.cell_type, onRun, pdfInfo]);

  const handlePdfExtracted = useCallback((result: ExtractedPdfResult | null) => {
    if (result) {
      setPdfInfo({
        filename: result.filename,
        pageCount: result.pageCount,
        extractedText: result.text,
      });
    } else {
      setPdfInfo(null);
    }
  }, []);

  const handleRun = useCallback(() => {
    onRun(pdfInfo?.extractedText, pdfInfo?.filename);
  }, [onRun, pdfInfo]);

  const handleDownloadPdf = useCallback(() => {
    const outputContent = isRunning ? streamingOutput : cell.output;
    if (!outputContent) return;

    const filename = pdfInfo?.filename 
      ? `summary-${pdfInfo.filename.replace('.pdf', '')}.pdf`
      : `notebook-output-${Date.now()}.pdf`;

    exportNotebookToPdf({
      title: pdfInfo?.filename ? `Summary: ${pdfInfo.filename}` : 'Notebook Output',
      content: outputContent,
      filename,
    });
  }, [cell.output, streamingOutput, isRunning, pdfInfo]);

  const displayOutput = isRunning ? streamingOutput : cell.output;
  const canDownload = !isRunning && !!cell.output;

  // Render PresentationCell for presentation type
  if (cell.cell_type === 'presentation') {
    return (
      <PresentationCell
        cell={cell}
        isRunning={isRunning}
        streamingOutput={streamingOutput}
        onContentChange={onContentChange}
        onSave={(content, slideCount, style) => {
          if (onSavePresentation) {
            onSavePresentation(content, slideCount, style);
          }
        }}
        onDelete={onDelete}
        onRun={(topic, slideCount, style) => {
          if (onRunPresentation) {
            onRunPresentation(topic, slideCount, style);
          }
        }}
      />
    );
  }

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
              ) : cell.cell_type === 'llm' ? (
                <>
                  <Bot className="h-3.5 w-3.5" />
                  <span className="text-xs">LLM Prompt</span>
                </>
              ) : (
                <>
                  <Presentation className="h-3.5 w-3.5" />
                  <span className="text-xs">Presentation</span>
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
            <DropdownMenuItem onClick={() => onTypeChange('presentation')}>
              <Presentation className="h-4 w-4 mr-2" />
              Presentation
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="flex-1" />

        {cell.cell_type === 'llm' && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRun}
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
      <div className="p-3 space-y-3">
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

        {/* PDF Upload Zone for LLM cells */}
        {cell.cell_type === 'llm' && (
          <PdfUploadZone
            onPdfExtracted={handlePdfExtracted}
            pdfInfo={pdfInfo ? { filename: pdfInfo.filename, pageCount: pdfInfo.pageCount } : null}
            disabled={isRunning}
          />
        )}
      </div>

      {/* Output (for LLM cells) */}
      {cell.cell_type === 'llm' && displayOutput && (
        <div className="border-t">
          <div className="px-3 py-2 bg-muted/30 flex items-center justify-between">
            <Badge variant="secondary" className="text-xs">
              {isRunning ? 'Generating...' : 'Output'}
            </Badge>
            {canDownload && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDownloadPdf}
                className="h-7 gap-1.5 text-muted-foreground hover:text-foreground"
              >
                <Download className="h-3.5 w-3.5" />
                <span className="text-xs">Download PDF</span>
              </Button>
            )}
          </div>
          <div className="p-3">
            <CellOutput content={displayOutput} isStreaming={isRunning} />
          </div>
        </div>
      )}
    </motion.div>
  );
}
