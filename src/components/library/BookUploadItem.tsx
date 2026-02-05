import { useState, useEffect } from 'react';
import { X, Loader2, Sparkles, AlertCircle, Check } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { renderFirstPagePreview } from '@/hooks/usePdfToImages';
import { supabase } from '@/integrations/supabase/client';

export interface BookUploadData {
  id: string;
  file: File;
  title: string;
  gradeLevel: string;
  subject: string;
  coverPreview: string | null;
  coverBase64: string | null;
  status: 'pending' | 'analyzing' | 'ready' | 'uploading' | 'done' | 'error';
  error?: string;
  aiDetected: boolean;
  progress?: { done: number; total: number };
}

interface BookUploadItemProps {
  book: BookUploadData;
  onUpdate: (id: string, updates: Partial<BookUploadData>) => void;
  onRemove: (id: string) => void;
  disabled?: boolean;
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

export const BookUploadItem = ({
  book,
  onUpdate,
  onRemove,
  disabled = false,
}: BookUploadItemProps) => {
  useEffect(() => {
    if (book.status === 'pending' && !book.coverPreview) {
      analyzeBook();
    }
  }, [book.id]);

  const analyzeBook = async () => {
    onUpdate(book.id, { status: 'analyzing' });

    try {
      // Render first page preview
      const { dataUrl, base64 } = await renderFirstPagePreview(book.file, 1.5);
      onUpdate(book.id, { coverPreview: dataUrl, coverBase64: base64 });

      // Call AI to analyze the cover
      const { data, error } = await supabase.functions.invoke('analyze-book-cover', {
        body: {
          imageBase64: base64,
          filename: book.file.name,
        },
      });

      if (error) {
        console.error('AI analysis error:', error);
        onUpdate(book.id, { status: 'ready' });
        return;
      }

      if (data?.success) {
        const updates: Partial<BookUploadData> = { status: 'ready', aiDetected: false };
        
        if (data.title) {
          updates.title = data.title;
          updates.aiDetected = true;
        }
        if (data.subject) {
          const matchedSubject = SUBJECTS.find(
            (s) => s.toLowerCase() === data.subject.toLowerCase()
          );
          if (matchedSubject) {
            updates.subject = matchedSubject;
          }
        }
        if (data.gradeLevel) {
          updates.gradeLevel = data.gradeLevel.toString();
        }

        onUpdate(book.id, updates);
      } else {
        onUpdate(book.id, { status: 'ready' });
      }
    } catch (err) {
      console.error('Cover analysis failed:', err);
      onUpdate(book.id, { status: 'ready' });
    }
  };

  const isEditable = !disabled && book.status !== 'uploading' && book.status !== 'done';

  return (
    <div className={`border rounded-lg p-3 space-y-3 ${
      book.status === 'error' ? 'border-destructive bg-destructive/5' :
      book.status === 'done' ? 'border-green-500 bg-green-500/5' :
      'border-border'
    }`}>
      <div className="flex gap-3">
        {/* Cover Preview */}
        <div className="relative w-16 h-22 flex-shrink-0 rounded overflow-hidden border bg-muted">
          {book.coverPreview ? (
            <img
              src={book.coverPreview}
              alt="Cover"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          )}
          {book.status === 'analyzing' && (
            <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
            </div>
          )}
          {book.status === 'done' && (
            <div className="absolute inset-0 bg-primary/80 flex items-center justify-center">
              <Check className="h-5 w-5 text-primary-foreground" />
            </div>
          )}
        </div>

        {/* Book Details */}
        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground truncate">{book.file.name}</p>
              {book.aiDetected && book.status !== 'uploading' && book.status !== 'done' && (
                <Badge variant="secondary" className="mt-1 gap-1 text-xs">
                  <Sparkles className="h-3 w-3" />
                  AI detected
                </Badge>
              )}
            </div>
            {isEditable && (
              <button
                onClick={() => onRemove(book.id)}
                className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Title Input */}
          <Input
            value={book.title}
            onChange={(e) => onUpdate(book.id, { title: e.target.value })}
            placeholder="Book title"
            className="h-8 text-sm"
            disabled={!isEditable}
          />

          {/* Grade & Subject Row */}
          <div className="flex gap-2">
            <Select
              value={book.gradeLevel}
              onValueChange={(v) => onUpdate(book.id, { gradeLevel: v })}
              disabled={!isEditable}
            >
              <SelectTrigger className="h-8 text-xs flex-1">
                <SelectValue placeholder="Grade" />
              </SelectTrigger>
              <SelectContent>
                {GRADE_LEVELS.map((grade) => (
                  <SelectItem key={grade} value={grade.toString()}>
                    Grade {grade}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={book.subject}
              onValueChange={(v) => onUpdate(book.id, { subject: v })}
              disabled={!isEditable}
            >
              <SelectTrigger className="h-8 text-xs flex-1">
                <SelectValue placeholder="Subject" />
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

          {/* Status / Progress */}
          {book.status === 'uploading' && book.progress && (
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Processing pages...
                </span>
                <span>{book.progress.done}/{book.progress.total}</span>
              </div>
              <Progress 
                value={(book.progress.done / book.progress.total) * 100} 
                className="h-1.5" 
              />
            </div>
          )}
          {book.status === 'error' && (
            <div className="flex items-center gap-1 text-xs text-destructive">
              <AlertCircle className="h-3 w-3" />
              <span>{book.error || 'Upload failed'}</span>
            </div>
          )}
          {book.status === 'done' && (
            <div className="flex items-center gap-1 text-xs text-primary">
              <Check className="h-3 w-3" />
              <span>Uploaded successfully</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
