import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface SchoolSettings {
  id: string;
  school_id: string;
  name: string;
  acronym: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  logo_url: string;
  theme_id: string;
}

export const useSchoolSettings = (schoolId?: string) => {
  return useQuery({
    queryKey: ['school-settings', schoolId],
    queryFn: async (): Promise<SchoolSettings | null> => {
      let query = supabase
        .from('school_settings')
        .select('*');
      
      if (schoolId) {
        query = query.eq('school_id', schoolId);
      }
      
      const { data, error } = await query.limit(1).single();
      
      if (error) {
        console.error('Error fetching school settings:', error);
        return null;
      }
      
      return data as SchoolSettings;
    },
  });
};

export const useAllSchoolSettings = () => {
  return useQuery({
    queryKey: ['all-school-settings'],
    queryFn: async (): Promise<SchoolSettings[]> => {
      const { data, error } = await supabase
        .from('school_settings')
        .select('*')
        .order('name');
      
      if (error) {
        console.error('Error fetching all school settings:', error);
        return [];
      }
      
      return data as SchoolSettings[];
    },
  });
};
