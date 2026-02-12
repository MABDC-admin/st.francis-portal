import { Calendar, Lock, AlertTriangle } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useAcademicYear } from '@/contexts/AcademicYearContext';
import { motion, AnimatePresence } from 'framer-motion';

export const AcademicYearSelector = () => {
  const { academicYears, selectedYearId, selectedYear, setSelectedYearId, isReadOnly } = useAcademicYear();

  if (academicYears.length === 0) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <span>Academic Year:</span>
        </div>
        <Select value={selectedYearId || ''} onValueChange={setSelectedYearId}>
          <SelectTrigger className="w-[220px] h-9 bg-background">
            <SelectValue placeholder="Select year" />
          </SelectTrigger>
          <SelectContent className="bg-popover z-50">
            {academicYears.map((year) => (
              <SelectItem key={year.id} value={year.id}>
                <span className="flex items-center gap-2">
                  {year.is_archived && <Lock className="h-3 w-3 text-muted-foreground" />}
                  {year.name}
                  {year.is_current && (
                    <Badge variant="default" className="ml-1 text-[10px] px-1.5 py-0 h-4">
                      Current
                    </Badge>
                  )}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <AnimatePresence>
        {isReadOnly && selectedYear && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center gap-2 text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-md px-3 py-1.5"
          >
            <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
            <span>
              Viewing <strong>{selectedYear.name}</strong> — historical data (read-only)
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
