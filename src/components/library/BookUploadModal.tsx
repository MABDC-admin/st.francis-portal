import { useState, useRef, useEffect } from 'react';
import { Upload, X, FileText, Loader2, Sparkles, ImageIcon } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { usePdfToImages, renderFirstPagePreview } from '@/hooks/usePdfToImages';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface BookUploadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const GRADE_LEVELS = Array.from({ length: 12 }, (_, i) => i + 1);

const SUBJECTS = [
  'Mathematics',
  'Science',
  'English',
  'Filipino',
  'Social Studies',
  'MAPEH',
  'TLE',
  'Values Education',
  'Other',
];

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
  const [title, setTitle] = useState('');
  const [gradeLevel, setGradeLevel] = useState<string>('');
  const [subject, setSubject] = useState<string>('');
  const [school, setSchool] = useState<string>('both');
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiDetected, setAiDetected] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { progress, processInBrowser, reset } = usePdfToImages();

  // Analyze book cover when file is selected
  const analyzeBookCover = async (pdfFile: File) => {
    setIsAnalyzing(true);
    setAiDetected(false);

    try {
      // Render first page preview
      const { dataUrl, base64 } = await renderFirstPagePreview(pdfFile, 1.5);
      setCoverPreview(dataUrl);

      // Call AI to analyze the cover
      const { data, error } = await supabase.functions.invoke('analyze-book-cover', {
        body: {
          imageBase64: base64,
          filename: pdfFile.name,
        },
      });

      if (error) {
        console.error('AI analysis error:', error);
        toast.error('Could not analyze cover automatically');
        return;
      }

      if (data?.success) {
        // Auto-fill detected values
        if (data.title && !title) {
          setTitle(data.title);
          setAiDetected(true);
        }
        if (data.subject) {
          const matchedSubject = SUBJECTS.find(
            (s) => s.toLowerCase() === data.subject.toLowerCase()
          );
          if (matchedSubject && !subject) {
            setSubject(matchedSubject);
          }
        }
        if (data.gradeLevel && !gradeLevel) {
          setGradeLevel(data.gradeLevel.toString());
        }

        if (data.title) {
          toast.success('Book title detected from cover!');
        }
      }
    } catch (err) {
      console.error('Cover analysis failed:', err);
      // Silently fail - user can still enter manually
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
      // Set filename as fallback title
      if (!title) {
        setTitle(selectedFile.name.replace('.pdf', ''));
      }
      // Analyze the cover
      await analyzeBookCover(selectedFile);
    } else {
      toast.error('Please select a PDF file');
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.type === 'application/pdf') {
      setFile(droppedFile);
      if (!title) {
        setTitle(droppedFile.name.replace('.pdf', ''));
      }
      await analyzeBookCover(droppedFile);
    } else {
      toast.error('Please drop a PDF file');
    }
  };

  const handleSubmit = async () => {
    if (!file || !title || !gradeLevel) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsUploading(true);

    try {
      // 1. Create book record
      const { data: book, error: bookError } = await supabase
        .from('books')
        .insert({
          title,
          grade_level: parseInt(gradeLevel),
          subject: subject || null,
          school: school === 'both' ? null : school,
          status: 'processing',
          page_count: 0,
        })
        .select()
        .single();

      if (bookError) throw bookError;

      const bookId = book.id;

      // 2. Upload source PDF (optional backup)
      const pdfPath = `${bookId}/source.pdf`;
      await supabase.storage
        .from('pdf-uploads')
        .upload(pdfPath, file, { upsert: true });

      await supabase
        .from('books')
        .update({ pdf_url: pdfPath })
        .eq('id', bookId);

      // 3. Process PDF to images
      const { numPages, firstPageUrl } = await processInBrowser(bookId, file);

      // 4. Mark book as ready
      await supabase
        .from('books')
        .update({
          page_count: numPages,
          status: 'ready',
          cover_url: firstPageUrl,
        })
        .eq('id', bookId);

      toast.success(`Book "${title}" uploaded successfully with ${numPages} pages`);
      handleClose();
      onSuccess();
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error.message || 'Failed to upload book');
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    if (!isUploading) {
      setTitle('');
      setGradeLevel('');
      setSubject('');
      setSchool('both');
      setFile(null);
      setCoverPreview(null);
      setIsAnalyzing(false);
      setAiDetected(false);
      reset();
      onOpenChange(false);
    }
  };

  const progressPercent =
    progress.total > 0 ? Math.round((progress.done / progress.total) * 100) : 0;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Upload New Book</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Cover Preview */}
          {coverPreview && (
            <div className="flex flex-col items-center gap-2">
              <div className="relative w-32 h-44 rounded-lg overflow-hidden border bg-muted">
                <img
                  src={coverPreview}
                  alt="Cover preview"
                  className="w-full h-full object-cover"
                />
                {isAnalyzing && (
                  <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                    <div className="flex flex-col items-center gap-1">
                      <Loader2 className="h-5 w-5 animate-spin text-primary" />
                      <span className="text-xs text-muted-foreground">Analyzing...</span>
                    </div>
                  </div>
                )}
              </div>
              {aiDetected && (
                <div className="flex items-center gap-1 text-xs text-primary">
                  <Sparkles className="h-3 w-3" />
                  <span>AI detected title</span>
                </div>
              )}
            </div>
          )}

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title" className="flex items-center gap-1">
              Title *
              {aiDetected && <Sparkles className="h-3 w-3 text-primary" />}
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter book title"
              disabled={isUploading || isAnalyzing}
            />
          </div>

          {/* Grade Level */}
          <div className="space-y-2">
            <Label>Grade Level *</Label>
            <Select
              value={gradeLevel}
              onValueChange={setGradeLevel}
              disabled={isUploading || isAnalyzing}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select grade level" />
              </SelectTrigger>
              <SelectContent>
                {GRADE_LEVELS.map((grade) => (
                  <SelectItem key={grade} value={grade.toString()}>
                    Grade {grade}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Subject */}
          <div className="space-y-2">
            <Label>Subject (Optional)</Label>
            <Select
              value={subject}
              onValueChange={setSubject}
              disabled={isUploading || isAnalyzing}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select subject" />
              </SelectTrigger>
              <SelectContent>
                {SUBJECTS.map((subj) => (
                  <SelectItem key={subj} value={subj}>
                    {subj}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* School */}
          <div className="space-y-2">
            <Label>School</Label>
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

          {/* File Upload */}
          <div className="space-y-2">
            <Label>PDF File *</Label>
            <div
              className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                file
                  ? 'border-primary bg-primary/5'
                  : 'border-muted-foreground/25 hover:border-primary/50'
              } ${isUploading ? 'pointer-events-none opacity-50' : ''}`}
              onClick={() => fileInputRef.current?.click()}
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                onChange={handleFileChange}
                className="hidden"
                disabled={isUploading}
              />
              {file ? (
                <div className="flex items-center justify-center gap-2 text-primary">
                  <FileText className="h-5 w-5" />
                  <span className="font-medium truncate max-w-[200px]">{file.name}</span>
                  {!isUploading && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setFile(null);
                        setCoverPreview(null);
                        setAiDetected(false);
                      }}
                      className="p-1 hover:bg-muted rounded"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-2 text-muted-foreground">
                  <Upload className="h-8 w-8 mx-auto" />
                  <p className="text-sm">
                    Click to upload or drag and drop a PDF
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Progress */}
          {isUploading && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {progress.status === 'rendering'
                    ? 'Processing pages...'
                    : progress.status === 'done'
                    ? 'Complete!'
                    : 'Preparing...'}
                </span>
                <span className="font-medium">
                  {progress.done}/{progress.total} pages
                </span>
              </div>
              <Progress value={progressPercent} className="h-2" />
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={isUploading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!file || !title || !gradeLevel || isUploading || isAnalyzing}
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Book
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
