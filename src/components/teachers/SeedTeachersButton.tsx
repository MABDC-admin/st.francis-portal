import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Upload } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const TEACHERS_DATA = [
  { employee_id: 'TCH-001', full_name: 'Loida B. Peteros', email: 'loida.peteros@sfxsai.com', grade_level: 'Kinder 1' },
  { employee_id: 'TCH-002', full_name: 'Apple B. Cortes', email: 'apple.cortes@sfxsai.com', grade_level: 'Grade 1' },
  { employee_id: 'TCH-003', full_name: 'Jianne B. Briones', email: 'jianne.briones@sfxsai.com', grade_level: 'Grade 1' },
  { employee_id: 'TCH-004', full_name: 'Chemlie D. Yap', email: 'chemlie.yap@sfxsai.com', grade_level: 'Grade 2' },
  { employee_id: 'TCH-005', full_name: 'Johnin Mae P. Declaro', email: 'johnin.declaro@sfxsai.com', grade_level: 'Grade 2' },
  { employee_id: 'TCH-006', full_name: 'Melody Dawn M. Bisnar', email: 'melody.bisnar@sfxsai.com', grade_level: 'Grade 3' },
  { employee_id: 'TCH-007', full_name: 'Shaylene B. Manapsal', email: 'shaylene.manapsal@sfxsai.com', grade_level: 'Grade 3' },
  { employee_id: 'TCH-008', full_name: 'Joshua B. Munez', email: 'joshua.munez@sfxsai.com', grade_level: 'Grade 4' },
  { employee_id: 'TCH-009', full_name: 'Wenna Jane L. Caiwan', email: 'wenna.caiwan@sfxsai.com', grade_level: 'Grade 4' },
  { employee_id: 'TCH-010', full_name: 'Melirose D. Cerbo', email: 'melirose.cerbo@sfxsai.com', grade_level: 'Grade 5' },
  { employee_id: 'TCH-011', full_name: 'Syrah U. Ababat', email: 'syrah.ababat@sfxsai.com', grade_level: 'Grade 5' },
  { employee_id: 'TCH-012', full_name: 'Ronalyn B. Sual', email: 'ronalyn.sual@sfxsai.com', grade_level: 'Grade 6' },
  { employee_id: 'TCH-013', full_name: 'Ria D. Corpez', email: 'ria.corpez@sfxsai.com', grade_level: 'Grade 6' },
  { employee_id: 'TCH-014', full_name: 'Casandra U. Dante', email: 'casandra.dante@sfxsai.com', grade_level: 'Grade 7' },
  { employee_id: 'TCH-015', full_name: 'Alwin Marie P. Estremos', email: 'alwin.estremos@sfxsai.com', grade_level: 'Grade 7' },
];

interface SeedTeachersButtonProps {
  onComplete: () => void;
}

export const SeedTeachersButton = ({ onComplete }: SeedTeachersButtonProps) => {
  const [isSeeding, setIsSeeding] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleSeed = async () => {
    if (!confirm('This will create 15 teacher accounts with password "123456". Continue?')) return;
    
    setIsSeeding(true);
    setProgress(0);
    let created = 0;
    let failed = 0;

    for (const teacher of TEACHERS_DATA) {
      try {
        // 1. Create auth account via edge function
        const { data, error: funcError } = await supabase.functions.invoke('create-users', {
          body: {
            action: 'create_teacher',
            email: teacher.email,
            password: '123456',
            fullName: teacher.full_name,
          },
        });

        if (funcError) {
          console.error(`Failed to create account for ${teacher.full_name}:`, funcError);
          failed++;
          setProgress(prev => prev + 1);
          continue;
        }

        const userId = data?.userId;

        // 2. Check if teacher already exists
        const { data: existing } = await supabase
          .from('teachers')
          .select('id')
          .eq('email', teacher.email)
          .maybeSingle();

        let teacherRecordId: string;

        if (existing) {
          // Update existing teacher with user_id
          await supabase
            .from('teachers')
            .update({ user_id: userId, grade_level: teacher.grade_level })
            .eq('id', existing.id);
          teacherRecordId = existing.id;
        } else {
          // 3. Insert teacher record
          const { data: teacherRecord, error: insertError } = await supabase
            .from('teachers')
            .insert({
              employee_id: teacher.employee_id,
              full_name: teacher.full_name,
              email: teacher.email,
              grade_level: teacher.grade_level,
              school: 'SFXSAI',
              user_id: userId,
            })
            .select('id')
            .single();

          if (insertError) {
            console.error(`Failed to insert teacher ${teacher.full_name}:`, insertError);
            failed++;
            setProgress(prev => prev + 1);
            continue;
          }
          teacherRecordId = teacherRecord.id;
        }

        // 4. Link credential to teacher
        if (userId && teacherRecordId) {
          await supabase
            .from('user_credentials')
            .update({ teacher_id: teacherRecordId })
            .eq('user_id', userId);
        }

        created++;
      } catch (err) {
        console.error(`Error for ${teacher.full_name}:`, err);
        failed++;
      }
      setProgress(prev => prev + 1);
    }

    setIsSeeding(false);
    toast.success(`Created ${created} teacher accounts${failed > 0 ? `, ${failed} failed` : ''}`);
    onComplete();
  };

  return (
    <Button onClick={handleSeed} disabled={isSeeding} variant="outline" size="sm">
      {isSeeding ? (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          {progress}/{TEACHERS_DATA.length}
        </>
      ) : (
        <>
          <Upload className="h-4 w-4 mr-2" />
          Seed 15 Teachers
        </>
      )}
    </Button>
  );
};
