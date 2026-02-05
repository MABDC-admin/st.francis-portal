import { useState, useEffect } from 'react';
import { Loader2, Trash2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Book {
  id: string;
  title: string;
  grade_level: number;
  subject: string | null;
  cover_url: string | null;
  page_count: number;
  status: string;
  school: string | null;
  is_active: boolean;
}

interface BookEditModalProps {
  book: Book | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const GRADE_LEVELS = Array.from({ length: 12 }, (_, i) => ({
  value: (i + 1).toString(),
  label: `Grade ${i + 1}`,
}));

const SUBJECTS = [
  'Mathematics',
  'Science',
  'English',
  'Filipino',
  'Social Studies',
  'MAPEH',
  'TLE',
  'Values Education',
  'Computer',
  'Other',
];

export const BookEditModal = ({
  book,
  open,
  onOpenChange,
  onSuccess,
}: BookEditModalProps) => {
  const [formData, setFormData] = useState({
    title: '',
    grade_level: '1',
    subject: '',
    is_active: true,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (book) {
      setFormData({
        title: book.title,
        grade_level: book.grade_level.toString(),
        subject: book.subject || '',
        is_active: book.is_active,
      });
    }
  }, [book]);

  const handleSave = async () => {
    if (!book || !formData.title.trim()) {
      toast.error('Title is required');
      return;
    }

    setIsSaving(true);
    const { error } = await supabase
      .from('books')
      .update({
        title: formData.title.trim(),
        grade_level: parseInt(formData.grade_level),
        subject: formData.subject || null,
        is_active: formData.is_active,
      })
      .eq('id', book.id);

    if (error) {
      toast.error('Failed to update book: ' + error.message);
    } else {
      toast.success('Book updated successfully');
      onSuccess();
      onOpenChange(false);
    }
    setIsSaving(false);
  };

  const handleDelete = async () => {
    if (!book) return;

    setIsDeleting(true);
    
    // First delete book pages
    await supabase.from('book_pages').delete().eq('book_id', book.id);
    
    // Then delete the book
    const { error } = await supabase.from('books').delete().eq('id', book.id);

    if (error) {
      toast.error('Failed to delete book: ' + error.message);
    } else {
      toast.success('Book deleted successfully');
      onSuccess();
      onOpenChange(false);
    }
    setIsDeleting(false);
    setShowDeleteDialog(false);
  };

  if (!book) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Book</DialogTitle>
            <DialogDescription>
              Update book details or delete it from the library.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                placeholder="Book title"
              />
            </div>

            <div className="space-y-2">
              <Label>Grade Level</Label>
              <Select
                value={formData.grade_level}
                onValueChange={(value) =>
                  setFormData({ ...formData, grade_level: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select grade" />
                </SelectTrigger>
                <SelectContent>
                  {GRADE_LEVELS.map((level) => (
                    <SelectItem key={level.value} value={level.value}>
                      {level.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Subject</Label>
              <Select
                value={formData.subject}
                onValueChange={(value) =>
                  setFormData({ ...formData, subject: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select subject" />
                </SelectTrigger>
                <SelectContent>
                  {SUBJECTS.map((subject) => (
                    <SelectItem key={subject} value={subject}>
                      {subject}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <Label>Active</Label>
                <p className="text-xs text-muted-foreground">
                  Inactive books are hidden from users
                </p>
              </div>
              <Switch
                checked={formData.is_active}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, is_active: checked })
                }
              />
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="destructive"
              onClick={() => setShowDeleteDialog(true)}
              className="sm:mr-auto"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Book</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{book.title}"? This action cannot
              be undone and will remove all pages associated with this book.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeleting}
            >
              {isDeleting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Delete Book
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
