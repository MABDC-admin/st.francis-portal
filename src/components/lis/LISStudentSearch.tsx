import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, X, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { Student } from '@/types/student';
import { AnimatedStudentAvatar } from '@/components/students/AnimatedStudentAvatar';
import { cn } from '@/lib/utils';

interface LISStudentSearchProps {
  onSelectStudent: (student: Student) => void;
  selectedStudentId: string | null;
}

export const LISStudentSearch = ({ onSelectStudent, selectedStudentId }: LISStudentSearchProps) => {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(timer);
  }, [query]);

  const { data: results = [], isLoading } = useQuery({
    queryKey: ['lis-search', debouncedQuery],
    queryFn: async (): Promise<Student[]> => {
      if (!debouncedQuery.trim() || debouncedQuery.length < 2) return [];

      const searchTerm = `%${debouncedQuery}%`;
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .or(`student_name.ilike.${searchTerm},lrn.ilike.${searchTerm}`)
        .order('student_name', { ascending: true })
        .limit(20);

      if (error) throw error;
      return (data || []) as Student[];
    },
    enabled: debouncedQuery.length >= 2,
  });

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name, last name, or LRN across all schools and years..."
          className="pl-10 pr-10 h-12 text-base rounded-xl border-border bg-card shadow-sm"
        />
        {query && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
            onClick={() => setQuery('')}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {isLoading && debouncedQuery.length >= 2 && (
        <div className="flex items-center gap-2 text-muted-foreground text-sm px-1">
          <Loader2 className="h-4 w-4 animate-spin" />
          Searching...
        </div>
      )}

      <AnimatePresence>
        {results.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3"
          >
            {results.map((student, i) => (
              <motion.button
                key={student.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                onClick={() => onSelectStudent(student)}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-xl border text-left transition-all",
                  "hover:shadow-md hover:border-primary/30",
                  selectedStudentId === student.id
                    ? "border-primary bg-primary/5 shadow-sm"
                    : "border-border bg-card"
                )}
              >
                <AnimatedStudentAvatar
                  photoUrl={student.photo_url}
                  name={student.student_name}
                  size="sm"
                  enableAnimation={false}
                />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-sm text-foreground truncate">
                    {student.student_name}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    LRN: {student.lrn}
                  </p>
                  <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                      {student.level}
                    </Badge>
                    {student.school && (
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                        {student.school}
                      </Badge>
                    )}
                  </div>
                </div>
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {debouncedQuery.length >= 2 && !isLoading && results.length === 0 && (
        <p className="text-sm text-muted-foreground px-1">No students found.</p>
      )}
    </div>
  );
};
