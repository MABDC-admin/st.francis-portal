import { useEffect, useState } from 'react';
import { GraduationCap, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { TeacherApplicationForm } from '@/components/teacher-application/TeacherApplicationForm';

const PublicTeacherApplicationPage = () => {
  const [schoolId, setSchoolId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadDefaults = async () => {
      try {
        const { data: school, error: schoolErr } = await supabase
          .from('schools')
          .select('id, name')
          .limit(1)
          .single();
        if (schoolErr || !school) throw new Error('Unable to load school information');
        setSchoolId(school.id);
      } catch (e: any) {
        setError(e.message || 'Failed to load');
      } finally {
        setIsLoading(false);
      }
    };
    loadDefaults();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !schoolId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10 flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <h2 className="text-xl font-bold text-destructive">Application Unavailable</h2>
          <p className="text-muted-foreground">{error || 'Could not load application form.'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10">
      <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
            <GraduationCap className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="font-bold text-foreground">St. Francis Xavier Smart Academy</h1>
            <p className="text-xs text-muted-foreground">Teacher Application Form</p>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        <TeacherApplicationForm schoolId={schoolId} />
      </main>
    </div>
  );
};

export default PublicTeacherApplicationPage;
