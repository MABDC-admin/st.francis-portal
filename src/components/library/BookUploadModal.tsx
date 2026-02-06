import { useState, useRef, useCallback } from 'react';
import { Upload, X, Loader2, FileText, Plus } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { BookUploadItem, BookUploadData } from './BookUploadItem';
import { usePdfToImages, ProgressCallback } from '@/hooks/usePdfToImages';
import { useBookIndexing } from '@/hooks/useBookIndexing';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface BookUploadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const SCHOOLS = [
  { value: 'both', label: 'Both Schools' },
  { value: 'MABDC', label: 'M.A Brain Development Center' },
  { value: 'STFXSA', label: 'St. Francis Xavier Smart Academy' },
];

export const BookUploadModal = ({
  open,
  onOpenChange,
  onSuccess,
}: BookUploadModalProps) => {
  const [books, setBooks] = useState<BookUploadData[]>([]);
  const [school, setSchool] = useState<string>('both');
  const [isUploading, setIsUploading] = useState(false);
  const [overallProgress, setOverallProgress] = useState({ current: 0, total: 0 });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { processInBrowser } = usePdfToImages();
  const { startIndexing } = useBookIndexing();

  const generateId = () => Math.random().toString(36).substring(2, 9);

  const addFiles = useCallback((files: FileList | File[]) => {
    const pdfFiles = Array.from(files).filter(
      (f) => f.type === 'application/pdf'
    );

    if (pdfFiles.length === 0) {
      toast.error('Please select PDF files only');
      return;
    }

    const newBooks: BookUploadData[] = pdfFiles.map((file) => ({
      id: generateId(),
      file,
      title: file.name.replace('.pdf', ''),
      gradeLevel: '',
      subject: '',
      coverPreview: null,
      coverBase64: null,
      status: 'pending' as const,
      aiDetected: false,
    }));

    setBooks((prev) => [...prev, ...newBooks]);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      addFiles(e.target.files);
      e.target.value = '';
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    addFiles(e.dataTransfer.files);
  };

  const updateBook = useCallback((id: string, updates: Partial<BookUploadData>) => {
    setBooks((prev) =>
      prev.map((book) => (book.id === id ? { ...book, ...updates } : book))
    );
  }, []);

  const removeBook = useCallback((id: string) => {
    setBooks((prev) => prev.filter((book) => book.id !== id));
  }, []);

  const uploadSingleBook = async (book: BookUploadData): Promise<boolean> => {
    try {
      updateBook(book.id, { status: 'uploading', progress: { done: 0, total: 0 } });

      // Create book record
      const { data: bookRecord, error: bookError } = await supabase
        .from('books')
        .insert({
          title: book.title,
          grade_level: parseInt(book.gradeLevel),
          subject: book.subject || null,
          school: school === 'both' ? null : school,
          status: 'processing',
          page_count: 0,
        })
        .select()
        .single();

      if (bookError) throw bookError;

      const bookId = bookRecord.id;

      // Upload source PDF
      const pdfPath = `${bookId}/source.pdf`;
      await supabase.storage
        .from('pdf-uploads')
        .upload(pdfPath, book.file, { upsert: true });

      await supabase.from('books').update({ pdf_url: pdfPath }).eq('id', bookId);

      // Progress callback for this specific book
      const onProgress: ProgressCallback = (progress) => {
        updateBook(book.id, { progress: { done: progress.done, total: progress.total } });
      };

      // Process PDF to images with progress tracking
      const { numPages, firstPageUrl } = await processInBrowser(bookId, book.file, onProgress);

      // Mark book as ready
      await supabase
        .from('books')
        .update({
          page_count: numPages,
          status: 'ready',
          cover_url: firstPageUrl,
          index_status: 'pending',
        })
        .eq('id', bookId);

      updateBook(book.id, { status: 'done' });
      
      // Auto-trigger AI indexing after upload completes
      toast.success(`Book uploaded! Starting AI indexing for ${book.title}...`);
      startIndexing(bookId);

      return true;
    } catch (error: any) {
      console.error('Upload error for', book.title, error);
      updateBook(book.id, { status: 'error', error: error.message || 'Upload failed' });
      return false;
    }
  };

  const handleSubmit = async () => {
    const validBooks = books.filter(
      (b) => b.status === 'ready' && b.title && b.gradeLevel
    );

    if (validBooks.length === 0) {
      toast.error('No valid books to upload. Ensure all books have title and grade level.');
      return;
    }

    setIsUploading(true);
    setOverallProgress({ current: 0, total: validBooks.length });

    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < validBooks.length; i++) {
      setOverallProgress({ current: i + 1, total: validBooks.length });
      const success = await uploadSingleBook(validBooks[i]);
      if (success) successCount++;
      else failCount++;
    }

    setIsUploading(false);

    if (successCount > 0) {
      toast.success(`${successCount} book(s) uploaded successfully`);
      onSuccess();
    }
    if (failCount > 0) {
      toast.error(`${failCount} book(s) failed to upload`);
    }

    // Remove successful uploads from the list
    setBooks((prev) => prev.filter((b) => b.status !== 'done'));

    if (books.every((b) => b.status === 'done' || b.status === 'error')) {
      if (failCount === 0) {
        handleClose();
      }
    }
  };

  const handleClose = () => {
    if (!isUploading) {
      setBooks([]);
      setSchool('both');
      setOverallProgress({ current: 0, total: 0 });
      onOpenChange(false);
    }
  };

  const readyCount = books.filter(
    (b) => b.status === 'ready' && b.title && b.gradeLevel
  ).length;
  const analyzingCount = books.filter((b) => b.status === 'analyzing').length;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Upload Books</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col gap-4">
          {/* School Selection */}
          <div className="space-y-2">
            <Label>School (applies to all books)</Label>
            <Select
              value={school}
              onValueChange={setSchool}
              disabled={isUploading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Both Schools" />
              </SelectTrigger>
              <SelectContent>
                {SCHOOLS.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Drop Zone / Add More */}
          <div
            className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${
              books.length > 0
                ? 'border-muted-foreground/25 hover:border-primary/50'
                : 'border-muted-foreground/25 hover:border-primary/50 py-8'
            } ${isUploading ? 'pointer-events-none opacity-50' : ''}`}
            onClick={() => fileInputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              multiple
              onChange={handleFileChange}
              className="hidden"
              disabled={isUploading}
            />
            {books.length === 0 ? (
              <div className="space-y-2 text-muted-foreground">
                <Upload className="h-8 w-8 mx-auto" />
                <p className="text-sm">Click to upload or drag and drop PDFs</p>
                <p className="text-xs">You can select multiple files</p>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Plus className="h-4 w-4" />
                <span>Add more PDFs</span>
              </div>
            )}
          </div>

          {/* Book List */}
          {books.length > 0 && (
            <ScrollArea className="flex-1 min-h-0 max-h-[300px]">
              <div className="space-y-3 pr-4">
                {books.map((book) => (
                  <BookUploadItem
                    key={book.id}
                    book={book}
                    onUpdate={updateBook}
                    onRemove={removeBook}
                    disabled={isUploading}
                  />
                ))}
              </div>
            </ScrollArea>
          )}

          {/* Overall Progress */}
          {isUploading && overallProgress.total > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Uploading books...</span>
                <span className="font-medium">
                  {overallProgress.current}/{overallProgress.total}
                </span>
              </div>
              <Progress
                value={(overallProgress.current / overallProgress.total) * 100}
                className="h-2"
              />
            </div>
          )}

          {/* Status Summary */}
          {books.length > 0 && !isUploading && (
            <div className="text-sm text-muted-foreground">
              {analyzingCount > 0 && (
                <span className="flex items-center gap-1">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Analyzing {analyzingCount} book(s)...
                </span>
              )}
              {analyzingCount === 0 && readyCount > 0 && (
                <span>{readyCount} book(s) ready to upload</span>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2 border-t">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={isUploading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={readyCount === 0 || isUploading || analyzingCount > 0}
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload {readyCount > 0 ? `(${readyCount})` : ''}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
