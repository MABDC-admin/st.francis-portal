import { useAcademicYear } from '@/contexts/AcademicYearContext';
import { toast } from 'sonner';

export const useYearGuard = () => {
  const { selectedYear, academicYears } = useAcademicYear();

  const isReadOnly = selectedYear
    ? !selectedYear.is_current || selectedYear.is_archived === true
    : false;

  const currentYear = academicYears.find(y => y.is_current);

  const guardMessage = selectedYear
    ? `You are viewing ${selectedYear.name}. This year is locked. Switch to the current year to make changes.`
    : 'No academic year selected.';

  const guardMutation = (): boolean => {
    if (isReadOnly) {
      toast.error(guardMessage);
      return false;
    }
    return true;
  };

  return { isReadOnly, guardMessage, guardMutation, currentYear };
};
