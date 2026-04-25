import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSchool } from '@/contexts/SchoolContext';
import { getSchoolId } from '@/utils/schoolIdMap';

/**
 * Hook to get the database school_id for the currently selected school
 */
export const useSchoolId = () => {
  const { selectedSchool } = useSchool();
  
  return useQuery({
    queryKey: ['school-id', selectedSchool],
    queryFn: async () => {
      const schoolCode = selectedSchool;
      const fallbackSchoolId = getSchoolId(schoolCode) || null;

      const { data, error } = await supabase
        .from('schools')
        .select('id')
        .eq('code', schoolCode)
        .maybeSingle();

      if (data?.id) {
        return data.id;
      }

      const aliasCodes = schoolCode === 'SFXSAI'
        ? ['STFXSA', 'SFXSAI']
        : [schoolCode];

      const { data: byAlias, error: aliasError } = await supabase
        .from('schools')
        .select('id, code, name')
        .in('code', aliasCodes)
        .limit(1)
        .maybeSingle();

      if (byAlias?.id) {
        return byAlias.id;
      }

      const { data: byName, error: nameError } = await supabase
        .from('schools')
        .select('id')
        .or(`name.ilike.%${schoolCode}%,code.ilike.%${schoolCode}%`)
        .limit(1)
        .maybeSingle();

      if (byName?.id) {
        return byName.id;
      }

      if (error || aliasError || nameError) {
        console.warn('Could not resolve school ID from database:', schoolCode, {
          error,
          aliasError,
          nameError,
        });
      }

      return fallbackSchoolId;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    retry: 3,
  });
};
