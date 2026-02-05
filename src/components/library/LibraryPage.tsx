import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, BookOpen, Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { BookCard } from './BookCard';
import { BookUploadModal } from './BookUploadModal';
import { FlipbookViewer } from './FlipbookViewer';
import { useSchool } from '@/contexts/SchoolContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';

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

const GRADE_LEVELS = [
  { value: 'all', label: 'All Grades' },
  ...Array.from({ length: 12 }, (_, i) => ({
    value: (i + 1).toString(),
    label: `Grade ${i + 1}`,
  })),
];

export const LibraryPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGrade, setSelectedGrade] = useState<string>('all');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  
  const { selectedSchool } = useSchool();
  const { role } = useAuth();
  const queryClient = useQueryClient();

  const isAdmin = role === 'admin';
  const isRegistrar = role === 'registrar';
  const canUpload = isAdmin || isRegistrar;

  // Fetch books from database
  const { data: books = [], isLoading } = useQuery({
    queryKey: ['books', selectedSchool],
    queryFn: async () => {
      let query = supabase
        .from('books')
        .select('*')
        .eq('is_active', true);

      // Filter by school - show books for this school or books for both (null)
      if (selectedSchool) {
        query = query.or(`school.eq.${selectedSchool},school.is.null`);
      }

      const { data, error } = await query.order('title');
      if (error) throw error;
      return data as Book[];
    },
  });

  // Filter books based on selections
  const filteredBooks = useMemo(() => {
    let result = books;

    // Apply grade filter
    if (selectedGrade && selectedGrade !== 'all') {
      result = result.filter(
        (book) => book.grade_level === parseInt(selectedGrade)
      );
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (book) =>
          book.title.toLowerCase().includes(query) ||
          book.subject?.toLowerCase().includes(query)
      );
    }

    return result;
  }, [books, selectedGrade, searchQuery]);

  const handleUploadSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['books'] });
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        {/* Header */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-foreground flex items-center gap-2">
                <BookOpen className="h-8 w-8 text-primary" />
                Library
              </h1>
              <p className="text-muted-foreground mt-1">
                Browse ebooks and learning materials
              </p>
            </div>

            {/* Upload Button (Admin/Registrar only) */}
            {canUpload && (
              <Button
                onClick={() => setShowUploadModal(true)}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                Upload Book
              </Button>
            )}
          </div>

          {/* Search and Filter Controls */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by title or subject..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={selectedGrade} onValueChange={setSelectedGrade}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by grade" />
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

          {/* Active Filters */}
          {(selectedGrade !== 'all' || searchQuery) && (
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-sm text-muted-foreground">
                Active filters:
              </span>
              {selectedGrade !== 'all' && (
                <Badge variant="secondary" className="gap-1">
                  Grade {selectedGrade}
                  <button
                    onClick={() => setSelectedGrade('all')}
                    className="ml-1 hover:text-destructive"
                  >
                    ×
                  </button>
                </Badge>
              )}
              {searchQuery && (
                <Badge variant="secondary" className="gap-1">
                  "{searchQuery}"
                  <button
                    onClick={() => setSearchQuery('')}
                    className="ml-1 hover:text-destructive"
                  >
                    ×
                  </button>
                </Badge>
              )}
            </div>
          )}
        </div>

        {/* Books Grid */}
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <div
                key={i}
                className="aspect-[3/4] rounded-lg bg-muted animate-pulse"
              />
            ))}
          </div>
        ) : filteredBooks.length > 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4"
          >
            {filteredBooks.map((book, index) => (
              <BookCard
                key={book.id}
                book={book}
                index={index}
                onClick={() => setSelectedBook(book)}
              />
            ))}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-16 text-center"
          >
            <BookOpen className="h-16 w-16 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              No books found
            </h3>
            <p className="text-muted-foreground max-w-md">
              {searchQuery || selectedGrade !== 'all'
                ? 'Try adjusting your search or filter criteria.'
                : canUpload
                ? 'Upload your first book to get started!'
                : 'There are no books available yet. Check back later!'}
            </p>
            {canUpload && !searchQuery && selectedGrade === 'all' && (
              <Button
                onClick={() => setShowUploadModal(true)}
                className="mt-4 gap-2"
              >
                <Plus className="h-4 w-4" />
                Upload First Book
              </Button>
            )}
          </motion.div>
        )}

        {/* Results Count */}
        {!isLoading && filteredBooks.length > 0 && (
          <p className="text-sm text-muted-foreground text-center">
            Showing {filteredBooks.length} of {books.length} books
          </p>
        )}
      </motion.div>

      {/* Upload Modal */}
      <BookUploadModal
        open={showUploadModal}
        onOpenChange={setShowUploadModal}
        onSuccess={handleUploadSuccess}
      />

      {/* Flipbook Viewer */}
      <AnimatePresence>
        {selectedBook && selectedBook.status === 'ready' && (
          <FlipbookViewer
            bookId={selectedBook.id}
            bookTitle={selectedBook.title}
            onClose={() => setSelectedBook(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
};
