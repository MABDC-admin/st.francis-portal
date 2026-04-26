import { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, BookOpen, Plus, Sparkles, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { BookCard } from './BookCard';
import { BookUploadModal } from './BookUploadModal';
import { BookEditModal } from './BookEditModal';
import { FlipbookViewer } from './FlipbookViewer';
import { SearchResultsView } from './SearchResultsView';
import { useSchool } from '@/contexts/SchoolContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useBookSearch } from '@/hooks/useBookSearch';
import { useBookIndexing } from '@/hooks/useBookIndexing';
import { useAcademicYear } from '@/contexts/AcademicYearContext';
import { useSchoolId } from '@/hooks/useSchoolId';
import { useTeacherProfile, useTeacherSchedule } from '@/hooks/useTeacherData';
import {
  buildLibraryGradeVariants,
  displayLibraryGradeLabel,
  gradeMatchesLibraryLevel,
} from '@/utils/libraryGradeLevel';
import { toast } from 'sonner';

interface Book {
  id: string;
  title: string;
  grade_level: string;
  subject: string | null;
  category: string;
  source: string;
  cover_url: string | null;
  page_count: number;
  status: string;
  school: string | null;
  is_active: boolean;
  is_teacher_only: boolean;
  index_status: string | null;
}

const GRADE_LEVELS = [
  { value: 'all', label: 'All Grades' },
  { value: 'Kindergarten', label: 'Kindergarten' },
  ...Array.from({ length: 12 }, (_, i) => ({
    value: `Grade ${i + 1}`,
    label: `Grade ${i + 1}`,
  })),
];

interface LibraryPageProps {
  deepLinkBookId?: string;
  deepLinkPage?: number;
}

export const LibraryPage = ({ deepLinkBookId, deepLinkPage }: LibraryPageProps = {}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGrade, setSelectedGrade] = useState<string>('all');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedBook, setSelectedBook] = useState<{ id: string; title: string; initialPage?: number } | null>(null);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [deletingBook, setDeletingBook] = useState<Book | null>(null);
  const [showInactive, setShowInactive] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);

  const { selectedSchool } = useSchool();
  const { role, user } = useAuth();
  const { selectedYearId } = useAcademicYear();
  const { data: schoolId } = useSchoolId();
  const queryClient = useQueryClient();

  const isAdmin = role === 'admin';
  const isRegistrar = role === 'registrar';
  const isStudent = role === 'student';
  const isTeacher = role === 'teacher';
  const canManage = isAdmin || isRegistrar;

  // Fetch student data when the user is a student
  const { data: studentData } = useQuery({
    queryKey: ['student-for-library', user?.id],
    queryFn: async () => {
      if (!user?.id || !isStudent) return null;

      // First get the student_id from user_credentials
      const { data: credential, error: credError } = await supabase
        .from('user_credentials')
        .select('student_id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (credError || !credential?.student_id) {
        console.warn('Could not find student credentials for library filtering');
        return null;
      }

      // Then get the student's level
      const { data: student, error: studentError } = await supabase
        .from('students')
        .select('level, school_id')
        .eq('id', credential.student_id)
        .maybeSingle();

      if (studentError || !student) {
        console.warn('Could not find student data for library filtering');
        return null;
      }

      return student;
    },
    enabled: !!user?.id && isStudent,
  });

  // Parse student grade level and auto-set filter for students
  const studentGradeLevel = useMemo(() => {
    if (!isStudent || !studentData?.level) return null;
    return displayLibraryGradeLabel(studentData.level) || null;
  }, [isStudent, studentData?.level]);

  // Auto-set grade filter for students
  useEffect(() => {
    if (isStudent && studentGradeLevel) {
      setSelectedGrade(studentGradeLevel);
    }
  }, [isStudent, studentGradeLevel]);

  const { data: teacherProfile } = useTeacherProfile(
    isTeacher ? user?.id : undefined,
    isTeacher ? user?.email : undefined,
  );
  const { data: teacherSchedules = [] } = useTeacherSchedule(
    isTeacher ? teacherProfile?.id : undefined,
    isTeacher ? schoolId : undefined,
    isTeacher ? selectedYearId : undefined,
    isTeacher ? teacherProfile?.grade_level : undefined,
  );

  const teacherGradeLevels = useMemo(() => {
    if (!isTeacher) return [];

    const scopedLevels = new Map<string, string>();
    const register = (value: string | null | undefined) => {
      const label = displayLibraryGradeLabel(value);
      if (!label) return;
      scopedLevels.set(label.toLowerCase(), label);
    };

    teacherSchedules.forEach((schedule: any) => register(schedule.grade_level));
    register(teacherProfile?.grade_level);

    return Array.from(scopedLevels.values());
  }, [isTeacher, teacherProfile?.grade_level, teacherSchedules]);

  useEffect(() => {
    if (!isTeacher) return;

    if (teacherGradeLevels.length === 1) {
      setSelectedGrade(teacherGradeLevels[0]);
      return;
    }

    if (selectedGrade !== 'all' && !teacherGradeLevels.some((level) => gradeMatchesLibraryLevel(level, selectedGrade))) {
      setSelectedGrade('all');
    }
  }, [isTeacher, selectedGrade, teacherGradeLevels]);

  const availableGradeFilters = useMemo(() => {
    if (isTeacher) {
      return teacherGradeLevels.map((level) => ({ value: level, label: level }));
    }
    return GRADE_LEVELS.filter((level) => level.value !== 'all');
  }, [isTeacher, teacherGradeLevels]);



  // Book search hook
  const {
    search,
    clearSearch,
    isSearching,
    searchResults,
    totalMatches,
    searchQuery: aiSearchQuery
  } = useBookSearch();

  // Book indexing hook
  const { getBookIndexStatus, startIndexing, isIndexing } = useBookIndexing();

  // Fetch books from database
  const { data: books = [], isLoading } = useQuery({
    queryKey: [
      'books',
      selectedSchool,
      showInactive,
      searchQuery,
      selectedGrade,
      role,
      studentGradeLevel,
      teacherGradeLevels.join('|'),
      selectedYearId,
      schoolId,
    ],
    queryFn: async () => {
      if (isStudent && !studentGradeLevel) {
        return [];
      }

      if (isTeacher && teacherGradeLevels.length === 0) {
        return [];
      }

      let query = supabase.from('books').select('*');

      // Only show active books unless admin wants to see inactive
      if (!showInactive || !canManage) {
        query = query.eq('is_active', true);
      }

      if (searchQuery.trim()) {
        query = query.ilike('title', `%${searchQuery}%`);
      }

      const gradeScope = isStudent
        ? [studentGradeLevel]
        : isTeacher
          ? (selectedGrade !== 'all' ? [selectedGrade] : teacherGradeLevels)
          : (selectedGrade !== 'all' ? [selectedGrade] : []);

      const gradeVariants = [...new Set(
        gradeScope
          .filter((grade): grade is string => !!grade)
          .flatMap((grade) => buildLibraryGradeVariants(grade)),
      )];

      if ((isStudent || isTeacher || selectedGrade !== 'all') && gradeVariants.length === 0) {
        return [];
      }

      if (gradeVariants.length === 1) {
        query = query.eq('grade_level', gradeVariants[0]);
      } else if (gradeVariants.length > 1) {
        query = query.in('grade_level', gradeVariants);
      }

      // Filter by school - show books for this school or books for both (null)
      const schoolFilters = ['school.is.null'];
      if (selectedSchool) {
        schoolFilters.unshift(`school.eq.${selectedSchool}`);
      }
      if (schoolId) {
        schoolFilters.unshift(`school.eq.${schoolId}`);
      }
      query = query.or(schoolFilters.join(','));

      if (isStudent) {
        query = query.eq('is_teacher_only', false);
      }

      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;
      return data as any as Book[];
    },
  });

  // Handle deep-link to a specific book
  const deepLinkHandled = useRef(false);
  useEffect(() => {
    if (deepLinkBookId && !deepLinkHandled.current && !isLoading) {
      deepLinkHandled.current = true;
      const book = books.find(b => b.id === deepLinkBookId);
      if (book) {
        setSelectedBook({ id: book.id, title: book.title, initialPage: deepLinkPage });
      } else {
        supabase.from('books').select('id, title').eq('id', deepLinkBookId).maybeSingle().then(({ data }) => {
          if (data) {
            setSelectedBook({ id: data.id, title: data.title, initialPage: deepLinkPage });
          } else {
            toast.error('Book not found or no longer available.');
          }
        });
      }
    }
  }, [deepLinkBookId, deepLinkPage, books, isLoading]);

  // NOTE: Auto-indexing is disabled. Indexing runs at midnight UAE via scheduled job.
  // Books with pending status will be indexed sequentially by the cron job.

  // Filter books based on selections
  const filteredBooks = useMemo(() => {
    let result = books;

    // Apply grade filter
    if (isStudent && studentGradeLevel) {
      result = result.filter((book) => gradeMatchesLibraryLevel(book.grade_level, studentGradeLevel));
    } else if (isTeacher) {
      result = selectedGrade !== 'all'
        ? result.filter((book) => gradeMatchesLibraryLevel(book.grade_level, selectedGrade))
        : result.filter((book) => teacherGradeLevels.some((level) => gradeMatchesLibraryLevel(book.grade_level, level)));
    } else if (selectedGrade && selectedGrade !== 'all') {
      result = result.filter(
        (book) => gradeMatchesLibraryLevel(book.grade_level, selectedGrade)
      );
    }

    // Apply search filter (title/subject only for basic filter)
    if (searchQuery.trim() && !showSearchResults) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (book) =>
          book.title.toLowerCase().includes(query) ||
          book.subject?.toLowerCase().includes(query)
      );
    }

    return result;
  }, [books, selectedGrade, searchQuery, showSearchResults]);

  const handleUploadSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['books'] });
  };

  const handleToggleActive = async (book: Book) => {
    const { error } = await supabase
      .from('books')
      .update({ is_active: !book.is_active })
      .eq('id', book.id);

    if (error) {
      toast.error('Failed to update book status');
    } else {
      toast.success(book.is_active ? 'Book deactivated' : 'Book activated');
      queryClient.invalidateQueries({ queryKey: ['books'] });
    }
  };

  const handleDeleteBook = async () => {
    if (!deletingBook) return;

    setIsDeleting(true);

    // First delete book page index
    await supabase.from('book_page_index').delete().eq('book_id', deletingBook.id);

    // Then delete book pages
    await supabase.from('book_pages').delete().eq('book_id', deletingBook.id);

    // Then delete the book
    const { error } = await supabase.from('books').delete().eq('id', deletingBook.id);

    if (error) {
      toast.error('Failed to delete book: ' + error.message);
    } else {
      toast.success('Book deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['books'] });
    }
    setIsDeleting(false);
    setDeletingBook(null);
  };

  const handleAISearch = async () => {
    if (!searchQuery.trim()) {
      toast.error('Please enter a search term');
      return;
    }

    setShowSearchResults(true);
    await search(searchQuery, {
      grade_level: selectedGrade !== 'all'
        ? selectedGrade
        : isStudent
          ? studentGradeLevel || undefined
          : undefined,
    });
  };

  const handleBackFromSearch = () => {
    setShowSearchResults(false);
    clearSearch();
  };

  const handleOpenBookFromSearch = (bookId: string, pageNumber: number, bookTitle: string) => {
    setSelectedBook({ id: bookId, title: bookTitle, initialPage: pageNumber });
  };

  const handleStartIndexing = async (book: Book) => {
    await startIndexing(book.id);
    queryClient.invalidateQueries({ queryKey: ['books'] });
  };

  // Show search results view
  if (showSearchResults) {
    return (
      <SearchResultsView
        query={aiSearchQuery}
        results={searchResults}
        totalMatches={totalMatches}
        isSearching={isSearching}
        onBack={handleBackFromSearch}
        onOpenBook={handleOpenBookFromSearch}
      />
    );
  }

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

            {/* Admin Controls */}
            {canManage && (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <Switch
                    id="show-inactive"
                    checked={showInactive}
                    onCheckedChange={setShowInactive}
                  />
                  <Label htmlFor="show-inactive" className="text-sm text-muted-foreground">
                    Show inactive
                  </Label>
                </div>
                <Button onClick={() => setShowUploadModal(true)}
                  className="gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Upload Book
                </Button>
              </div>
            )}
          </div>

          {/* Search and Filter Controls */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1 flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search topics, lessons, content..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && searchQuery.trim()) {
                      handleAISearch();
                    }
                  }}
                  className="pl-10"
                />
              </div>
              <Button
                variant="default"
                onClick={handleAISearch}
                disabled={!searchQuery.trim() || isSearching}
                className="gap-2 bg-gradient-to-r from-primary to-primary/80"
              >
                {isSearching ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
                AI Search
              </Button>
            </div>

            {/* Grade Filter - Hidden for students */}
            {!isStudent && (
              <Select value={selectedGrade} onValueChange={setSelectedGrade}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter by grade" />
                </SelectTrigger>
                <SelectContent>
                  {!isTeacher && (
                    <SelectItem value="all">All Grades</SelectItem>
                  )}
                  {isTeacher && teacherGradeLevels.length > 1 && (
                    <SelectItem value="all">All My Grades</SelectItem>
                  )}
                  {availableGradeFilters.map((level) => (
                    <SelectItem key={level.value} value={level.value}>
                      {level.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {/* Show current grade for students */}
            {isStudent && studentGradeLevel && (
              <Badge variant="secondary" className="h-10 px-4 flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                {studentGradeLevel} Books
              </Badge>
            )}
          </div>

          {/* Active Filters - Only show for non-students */}
          {!isStudent && (selectedGrade !== 'all' || searchQuery) && (
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-sm text-muted-foreground">
                Active filters:
              </span>
              {selectedGrade !== 'all' && (
                <Badge variant="secondary" className="gap-1">
                  {selectedGrade}
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
                onClick={() => setSelectedBook({ id: book.id, title: book.title })}
                onEdit={() => setEditingBook(book)}
                onToggleActive={() => handleToggleActive(book)}
                onDelete={() => setDeletingBook(book)}
                onStartIndexing={() => handleStartIndexing(book)}
                canManage={canManage}
                indexStatus={getBookIndexStatus(book.id)}
                isIndexing={isIndexing === book.id}
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
              {isStudent ? 'No books available for your grade level' : isTeacher ? 'No books available for your teaching levels' : 'No books found'}
            </h3>
            <p className="text-muted-foreground max-w-md">
              {isStudent
                ? 'There are no books available for your grade level yet. Check back later!'
                : isTeacher
                  ? 'No library books currently match the grade levels assigned to you.'
                : searchQuery || selectedGrade !== 'all'
                  ? 'Try adjusting your search or filter criteria.'
                  : canManage
                    ? 'Upload your first book to get started!'
                    : 'There are no books available yet. Check back later!'}
            </p>
            {canManage && !searchQuery && selectedGrade === 'all' && (
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

      {/* Edit Modal */}
      <BookEditModal
        book={editingBook}
        open={!!editingBook}
        onOpenChange={(open) => !open && setEditingBook(null)}
        onSuccess={() => queryClient.invalidateQueries({ queryKey: ['books'] })}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingBook} onOpenChange={(open) => !open && setDeletingBook(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Book</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingBook?.title}"? This action cannot
              be undone and will remove all pages associated with this book.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteBook}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeleting}
            >
              Delete Book
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Flipbook Viewer */}
      <AnimatePresence>
        {selectedBook && (
          <FlipbookViewer
            bookId={selectedBook.id}
            bookTitle={selectedBook.title}
            initialPage={selectedBook.initialPage}
            onClose={() => setSelectedBook(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
};
