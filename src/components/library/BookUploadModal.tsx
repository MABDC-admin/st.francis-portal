import { useState, useRef } from 'react';
import { Upload, X, FileText, Loader2 } from 'lucide-react';
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
import { usePdfToImages } from '@/hooks/usePdfToImages';
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
  { value: '', label: 'Both Schools' },
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
  const [school, setSchool] = useState<string>('');
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { progress, processInBrowser, reset } = usePdfToImages();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
      if (!title) {
        setTitle(selectedFile.name.replace('.pdf', ''));
      }
    } else {
      toast.error('Please select a PDF file');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.type === 'application/pdf') {
      setFile(droppedFile);
      if (!title) {
        setTitle(droppedFile.name.replace('.pdf', ''));
      }
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
          school: school || null,
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
      setSchool('');
      setFile(null);
      reset();
      onOpenChange(false);
    }
  };

  const progressPercent =
    progress.total > 0 ? Math.round((progress.done / progress.total) * 100) : 0;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upload New Book</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter book title"
              disabled={isUploading}
            />
          </div>

          {/* Grade Level */}
          <div className="space-y-2">
            <Label>Grade Level *</Label>
            <Select
              value={gradeLevel}
              onValueChange={setGradeLevel}
              disabled={isUploading}
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
              disabled={isUploading}
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
                  <SelectItem key={s.value || 'both'} value={s.value}>
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
                  <span className="font-medium">{file.name}</span>
                  {!isUploading && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setFile(null);
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
              disabled={!file || !title || !gradeLevel || isUploading}
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
