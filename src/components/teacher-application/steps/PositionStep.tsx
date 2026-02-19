import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';
import { TeacherApplicationFormValues as TeacherFormData } from '../schema';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useState } from 'react';

interface Props {
  formData: TeacherFormData;
  updateField: (field: keyof TeacherFormData, value: any) => void;
  schoolId: string;
}

const SUBJECTS = ['English', 'Mathematics', 'Science', 'Filipino', 'Social Studies', 'MAPEH', 'TLE', 'Values Education', 'Computer', 'Mother Tongue'];
const LEVELS = ['Kindergarten', 'Elementary', 'Junior High School', 'Senior High School'];

export const PositionStep = ({ formData, updateField, schoolId }: Props) => {
  const [subjectInput, setSubjectInput] = useState('');

  const { data: positions = [] } = useQuery({
    queryKey: ['teacher-positions', schoolId],
    queryFn: async () => {
      const { data } = await supabase.from('teacher_application_positions').select('*').eq('is_active', true);
      return data || [];
    },
  });

  const addSubject = (s: string) => {
    if (s && !formData.subject_specialization.includes(s)) {
      updateField('subject_specialization', [...formData.subject_specialization, s]);
    }
    setSubjectInput('');
  };

  const removeSubject = (s: string) => {
    updateField('subject_specialization', formData.subject_specialization.filter(x => x !== s));
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Position Applied For <span className="text-destructive">*</span></Label>
        {positions.length > 0 ? (
          <Select value={formData.position_applied} onValueChange={v => updateField('position_applied', v)}>
            <SelectTrigger><SelectValue placeholder="Select position" /></SelectTrigger>
            <SelectContent>
              {positions.map((p: any) => (
                <SelectItem key={p.id} value={p.title}>{p.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <Input value={formData.position_applied} onChange={e => updateField('position_applied', e.target.value)} placeholder="e.g. Kindergarten Teacher" />
        )}
      </div>
      <div className="space-y-2">
        <Label>Subject Specialization</Label>
        <div className="flex flex-wrap gap-1 mb-2">
          {formData.subject_specialization.map(s => (
            <Badge key={s} variant="secondary" className="gap-1">
              {s} <X className="h-3 w-3 cursor-pointer" onClick={() => removeSubject(s)} />
            </Badge>
          ))}
        </div>
        <Select value="" onValueChange={addSubject}>
          <SelectTrigger><SelectValue placeholder="Add subject" /></SelectTrigger>
          <SelectContent>
            {SUBJECTS.filter(s => !formData.subject_specialization.includes(s)).map(s => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Preferred Level</Label>
        <Select value={formData.preferred_level} onValueChange={v => updateField('preferred_level', v)}>
          <SelectTrigger><SelectValue placeholder="Select level" /></SelectTrigger>
          <SelectContent>
            {LEVELS.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};
