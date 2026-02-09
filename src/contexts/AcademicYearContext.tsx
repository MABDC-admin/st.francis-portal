import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSchool } from '@/contexts/SchoolContext';

export interface AcademicYear {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
  school_id: string;
}

interface AcademicYearContextType {
  academicYears: AcademicYear[];
  selectedYearId: string | null;
  selectedYear: AcademicYear | null;
  setSelectedYearId: (id: string) => void;
  isLoading: boolean;
  refetch: () => Promise<void>;
}

const AcademicYearContext = createContext<AcademicYearContextType | undefined>(undefined);

export const AcademicYearProvider = ({ children }: { children: ReactNode }) => {
  const { selectedSchool } = useSchool();
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [selectedYearId, setSelectedYearIdState] = useState<string | null>(() => {
    return localStorage.getItem('selected-academic-year');
  });
  const [isLoading, setIsLoading] = useState(true);
  const [resolvedSchoolId, setResolvedSchoolId] = useState<string | null>(null);

  // Resolve school code to UUID
  useEffect(() => {
    const resolveSchool = async () => {
      const { data } = await supabase
        .from('schools')
        .select('id')
        .eq('code', selectedSchool)
        .single();
      setResolvedSchoolId(data?.id || null);
    };
    resolveSchool();
  }, [selectedSchool]);

  const fetchAcademicYears = async () => {
    if (!resolvedSchoolId) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('academic_years')
        .select('*')
        .eq('school_id', resolvedSchoolId)
        .order('start_date', { ascending: false });

      if (error) throw error;

      const years = (data || []) as AcademicYear[];
      setAcademicYears(years);

      // If no year is selected or the selected year doesn't exist in this school, select the current one
      const savedYearExists = years.some(y => y.id === selectedYearId);
      if (!selectedYearId || !savedYearExists) {
        const currentYear = years.find(y => y.is_current);
        if (currentYear) {
          setSelectedYearIdState(currentYear.id);
          localStorage.setItem('selected-academic-year', currentYear.id);
        } else if (years.length > 0) {
          setSelectedYearIdState(years[0].id);
          localStorage.setItem('selected-academic-year', years[0].id);
        }
      }
    } catch (error) {
      console.error('Error fetching academic years:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (resolvedSchoolId) {
      fetchAcademicYears();
    }
  }, [resolvedSchoolId]);

  const setSelectedYearId = (id: string) => {
    setSelectedYearIdState(id);
    localStorage.setItem('selected-academic-year', id);
  };

  const selectedYear = academicYears.find(y => y.id === selectedYearId) || null;

  return (
    <AcademicYearContext.Provider value={{ 
      academicYears,
      selectedYearId,
      selectedYear,
      setSelectedYearId,
      isLoading,
      refetch: fetchAcademicYears
    }}>
      {children}
    </AcademicYearContext.Provider>
  );
};

export const useAcademicYear = () => {
  const context = useContext(AcademicYearContext);
  if (context === undefined) {
    throw new Error('useAcademicYear must be used within an AcademicYearProvider');
  }
  return context;
};
