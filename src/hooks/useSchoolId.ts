import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSchool } from '@/contexts/SchoolContext';

/**
 * Hook to get the database school_id for the currently selected school
 */
export const useSchoolId = () => {
  const { selectedSchool } = useSchool();
  
  return useQuery({
    queryKey: ['school-id', selectedSchool],
    queryFn: async () => {
      // Map the display name to the database code
      const schoolCode = selectedSchool; // MABDC or STFXSA
      
      const { data, error } = await supabase
        .from('schools')
        .select('id')
        .eq('code', schoolCode)
        .single();
      
      if (error) {
        // If not found by code, try by name pattern
        const { data: byName, error: nameError } = await supabase
          .from('schools')
          .select('id')
          .or(`name.ilike.%${schoolCode}%,code.ilike.%${schoolCode}%`)
          .limit(1)
          .single();
        
        if (nameError) {
          console.warn('Could not find school:', schoolCode);
          return null;
        }
        return byName?.id || null;
      }
      
      return data?.id || null;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};
