import { Lock, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useYearGuard } from '@/hooks/useYearGuard';
import { useAcademicYear } from '@/contexts/AcademicYearContext';

export const YearLockedBanner = () => {
  const { isReadOnly, guardMessage, currentYear } = useYearGuard();
  const { setSelectedYearId } = useAcademicYear();

  if (!isReadOnly) return null;

  return (
    <div className="rounded-lg border border-yellow-300 bg-yellow-50 dark:border-yellow-700 dark:bg-yellow-950/30 p-4 flex flex-col sm:flex-row items-start sm:items-center gap-3">
      <Lock className="h-5 w-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5 sm:mt-0" />
      <p className="text-sm text-yellow-800 dark:text-yellow-300 flex-1">
        {guardMessage}
      </p>
      {currentYear && (
        <Button
          variant="outline"
          size="sm"
          className="border-yellow-400 text-yellow-800 hover:bg-yellow-100 dark:border-yellow-600 dark:text-yellow-300 dark:hover:bg-yellow-900/40"
          onClick={() => setSelectedYearId(currentYear.id)}
        >
          Switch to {currentYear.name}
          <ArrowRight className="h-4 w-4 ml-1" />
        </Button>
      )}
    </div>
  );
};
