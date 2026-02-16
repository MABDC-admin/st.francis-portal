import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2 } from 'lucide-react';
import { TeacherApplicationFormValues as TeacherFormData } from '../schema';

interface Props {
  formData: TeacherFormData;
  updateField: (field: keyof TeacherFormData, value: any) => void;
}

export const ExperienceStep = ({ formData, updateField }: Props) => {
  const updateExp = (index: number, key: string, value: string) => {
    const updated = [...formData.experience];
    updated[index] = { ...updated[index], [key]: value };
    updateField('experience', updated);
  };

  const addEntry = () => {
    updateField('experience', [...formData.experience, { school: '', position: '', subjects: '', start_date: '', end_date: '', status: 'Full-time' }]);
  };

  const removeEntry = (index: number) => {
    updateField('experience', formData.experience.filter((_, i) => i !== index));
  };

  const toggleExperience = (v: boolean) => {
    updateField('has_experience', v);
    if (v && formData.experience.length === 0) {
      addEntry();
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Switch checked={formData.has_experience} onCheckedChange={toggleExperience} />
        <Label>I have teaching experience</Label>
      </div>
      {formData.has_experience && (
        <div className="space-y-4 pl-4 border-l-2 border-primary/20">
          {formData.experience.map((exp, i) => (
            <div key={i} className="space-y-3 p-4 border rounded-lg relative">
              {formData.experience.length > 1 && (
                <Button variant="ghost" size="icon" className="absolute top-2 right-2" onClick={() => removeEntry(i)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">School/Institution</Label>
                  <Input value={exp.school} onChange={e => updateExp(i, 'school', e.target.value)} placeholder="School name" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Position</Label>
                  <Input value={exp.position} onChange={e => updateExp(i, 'position', e.target.value)} placeholder="e.g. Teacher I" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Subjects Taught</Label>
                  <Input value={exp.subjects} onChange={e => updateExp(i, 'subjects', e.target.value)} placeholder="e.g. Math, Science" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Employment Status</Label>
                  <Select value={exp.status} onValueChange={v => updateExp(i, 'status', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Full-time">Full-time</SelectItem>
                      <SelectItem value="Part-time">Part-time</SelectItem>
                      <SelectItem value="Contractual">Contractual</SelectItem>
                      <SelectItem value="Substitute">Substitute</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Start Date</Label>
                  <Input type="date" value={exp.start_date} onChange={e => updateExp(i, 'start_date', e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">End Date</Label>
                  <Input type="date" value={exp.end_date} onChange={e => updateExp(i, 'end_date', e.target.value)} />
                </div>
              </div>
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={addEntry}>
            <Plus className="h-4 w-4 mr-1" /> Add Experience
          </Button>
        </div>
      )}
    </div>
  );
};
