import { useState, useCallback } from 'react';
import { FileUp, File, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { extractPdfText, ExtractedPdfResult, ExtractionProgress } from '@/utils/extractPdfText';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface PdfUploadZoneProps {
  onPdfExtracted: (result: ExtractedPdfResult | null) => void;
  pdfInfo: { filename: string; pageCount: number } | null;
  disabled?: boolean;
}

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

export function PdfUploadZone({ onPdfExtracted, pdfInfo, disabled }: PdfUploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionProgress, setExtractionProgress] = useState<ExtractionProgress | null>(null);

  const handleFile = useCallback(async (file: File) => {
    if (file.type !== 'application/pdf') {
      toast.error('Please upload a PDF file');
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      toast.error('File size must be less than 50MB');
      return;
    }

    setIsExtracting(true);
    setExtractionProgress(null);

    try {
      const result = await extractPdfText(file, (progress) => {
        setExtractionProgress(progress);
      });
      onPdfExtracted(result);
      toast.success(`Extracted text from ${result.pageCount} pages`);
    } catch (error) {
      console.error('PDF extraction error:', error);
      toast.error('Failed to extract text from PDF');
      onPdfExtracted(null);
    } finally {
      setIsExtracting(false);
      setExtractionProgress(null);
    }
  }, [onPdfExtracted]);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFile(file);
    }
  }, [handleFile]);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
    // Reset input so the same file can be selected again
    e.target.value = '';
  }, [handleFile]);

  const handleRemove = useCallback(() => {
    onPdfExtracted(null);
  }, [onPdfExtracted]);

  if (isExtracting) {
    return (
      <div className="border border-dashed border-border rounded-lg p-4 bg-muted/30">
        <div className="flex items-center gap-3">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <div className="flex-1">
            <p className="text-sm font-medium">Extracting text...</p>
            {extractionProgress && (
              <>
                <p className="text-xs text-muted-foreground">
                  Page {extractionProgress.currentPage} of {extractionProgress.totalPages}
                </p>
                <Progress
                  value={(extractionProgress.currentPage / extractionProgress.totalPages) * 100}
                  className="h-1.5 mt-2"
                />
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (pdfInfo) {
    return (
      <div className="border border-border rounded-lg p-3 bg-muted/30">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <File className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{pdfInfo.filename}</p>
            <p className="text-xs text-muted-foreground">{pdfInfo.pageCount} pages</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleRemove}
            disabled={disabled}
            className="h-8 w-8 text-muted-foreground hover:text-destructive"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      className={cn(
        'border-2 border-dashed rounded-lg p-4 transition-colors cursor-pointer',
        isDragging
          ? 'border-primary bg-primary/5'
          : 'border-border hover:border-primary/50 hover:bg-muted/30',
        disabled && 'opacity-50 cursor-not-allowed'
      )}
    >
      <label className="flex flex-col items-center gap-2 cursor-pointer">
        <input
          type="file"
          accept=".pdf,application/pdf"
          onChange={handleInputChange}
          className="hidden"
          disabled={disabled}
        />
        <FileUp className="h-8 w-8 text-muted-foreground" />
        <div className="text-center">
          <p className="text-sm font-medium">Upload PDF</p>
          <p className="text-xs text-muted-foreground">Drag & drop or click to browse</p>
        </div>
      </label>
    </div>
  );
}
