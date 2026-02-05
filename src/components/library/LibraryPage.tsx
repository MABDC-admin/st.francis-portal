import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, BookOpen, RefreshCw } from 'lucide-react';
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
import { FlipbookCard } from './FlipbookCard';
import { useSchool } from '@/contexts/SchoolContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface Flipbook {
  id: string;
  title: string;
  description: string | null;
  cover_image_url: string | null;
  flipbook_url: string;
  grade_levels: string[];
  school: string | null;
  is_active: boolean;
}

const GRADE_LEVELS = [
  'All Levels',
  'Kinder 1',
  'Kinder 2',
  'Grade 1',
  'Grade 2',
  'Grade 3',
  'Grade 4',
  'Grade 5',
  'Grade 6',
  'Grade 7',
  'Grade 8',
  'Grade 9',
  'Grade 10',
  'Grade 11',
  'Grade 12',
];

export const LibraryPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGrade, setSelectedGrade] = useState<string>('All Levels');
  const { selectedSchool } = useSchool();
  const { role } = useAuth();
  const queryClient = useQueryClient();
  
  const isAdmin = role === 'admin';

  // Fetch flipbooks from database
  const { data: flipbooks = [], isLoading } = useQuery({
    queryKey: ['flipbooks', selectedSchool],
    queryFn: async () => {
      let query = supabase
        .from('flipbooks')
        .select('*')
        .eq('is_active', true);

      // Filter by school if applicable
      if (selectedSchool) {
        query = query.or(`school.eq.${selectedSchool},school.is.null`);
      }

      const { data, error } = await query.order('title');
      if (error) throw error;
      return data as Flipbook[];
    },
  });

  // Import flipbooks mutation
  const importMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('import-flipbooks');
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast.success(data.message || `Imported ${data.imported} flipbooks`);
      queryClient.invalidateQueries({ queryKey: ['flipbooks'] });
    },
    onError: (error: any) => {
      console.error('Import error:', error);
      toast.error(error.message || 'Failed to import flipbooks');
    },
  });

  // Filter flipbooks based on selections
  const filteredFlipbooks = useMemo(() => {
    let result = flipbooks;

    // Apply grade filter
    if (selectedGrade && selectedGrade !== 'All Levels') {
      result = result.filter(fb => 
        fb.grade_levels.some(level => 
          level.toLowerCase().includes(selectedGrade.toLowerCase())
        )
      );
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(fb =>
        fb.title.toLowerCase().includes(query) ||
        fb.description?.toLowerCase().includes(query)
      );
    }

    return result;
  }, [flipbooks, selectedGrade, searchQuery]);

  return (
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
          
          {/* Admin Sync Button */}
          {isAdmin && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => importMutation.mutate()}
              disabled={importMutation.isPending}
              className="gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${importMutation.isPending ? 'animate-spin' : ''}`} />
              {importMutation.isPending ? 'Syncing...' : 'Sync from Flipbooks'}
            </Button>
          )}
        </div>

        {/* Search and Filter Controls */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by title..."
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
                <SelectItem key={level} value={level}>
                  {level}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Active Filters */}
        {(selectedGrade !== 'All Levels' || searchQuery) && (
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-sm text-muted-foreground">Active filters:</span>
            {selectedGrade !== 'All Levels' && (
              <Badge variant="secondary" className="gap-1">
                {selectedGrade}
                <button
                  onClick={() => setSelectedGrade('All Levels')}
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

      {/* Flipbooks Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <div
              key={i}
              className="aspect-[3/4] rounded-lg bg-muted animate-pulse"
            />
          ))}
        </div>
      ) : filteredFlipbooks.length > 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4"
        >
          {filteredFlipbooks.map((flipbook, index) => (
            <FlipbookCard
              key={flipbook.id}
              flipbook={flipbook}
              index={index}
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
            No flipbooks found
          </h3>
          <p className="text-muted-foreground max-w-md">
            {searchQuery || selectedGrade !== 'All Levels'
              ? 'Try adjusting your search or filter criteria.'
              : 'There are no flipbooks available yet. Check back later!'}
          </p>
        </motion.div>
      )}

      {/* Results Count */}
      {!isLoading && filteredFlipbooks.length > 0 && (
        <p className="text-sm text-muted-foreground text-center">
          Showing {filteredFlipbooks.length} of {flipbooks.length} flipbooks
        </p>
      )}
    </motion.div>
  );
};
