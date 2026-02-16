import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2 } from 'lucide-react';
import { TeacherFormData } from '../TeacherApplicationForm';

interface Props {
  formData: TeacherFormData;
  updateField: (field: keyof TeacherFormData, value: any) => void;
}

const LEVELS = ['Bachelor', 'Master', 'Doctorate'];

export const EducationStep = ({ formData, updateField }: Props) => {
  const updateEdu = (index: number, key: string, value: string) => {
    const updated = [...formData.education];
    updated[index] = { ...updated[index], [key]: value };
    updateField('education', updated);
  };

  const addEntry = () => {
    updateField('education', [...formData.education, { level: 'Bachelor', course: '', major: '', school: '', year_graduated: '', honors: '' }]);
  };

  const removeEntry = (index: number) => {
    if (formData.education.length <= 1) return;
    updateField('education', formData.education.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6">
      {formData.education.map((edu, i) => (
        <div key={i} className="space-y-3 p-4 border rounded-lg relative">
          {formData.education.length > 1 && (
            <Button variant="ghost" size="icon" className="absolute top-2 right-2" onClick={() => removeEntry(i)}>
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Level</Label>
              <Select value={edu.level} onValueChange={v => updateEdu(i, 'level', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {LEVELS.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Course/Degree</Label>
              <Input value={edu.course} onChange={e => updateEdu(i, 'course', e.target.value)} placeholder="e.g. BSEd" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Major</Label>
              <Input value={edu.major} onChange={e => updateEdu(i, 'major', e.target.value)} placeholder="Major" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">School/University</Label>
              <Input value={edu.school} onChange={e => updateEdu(i, 'school', e.target.value)} placeholder="School name" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Year Graduated</Label>
              <Input value={edu.year_graduated} onChange={e => updateEdu(i, 'year_graduated', e.target.value)} placeholder="YYYY" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Honors/Awards</Label>
              <Input value={edu.honors} onChange={e => updateEdu(i, 'honors', e.target.value)} placeholder="e.g. Cum Laude" />
            </div>
          </div>
        </div>
      ))}
      <Button variant="outline" size="sm" onClick={addEntry}>
        <Plus className="h-4 w-4 mr-1" /> Add Education
      </Button>
    </div>
  );
};
