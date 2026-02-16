import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { TeacherFormData } from '../TeacherApplicationForm';

interface Props {
  formData: TeacherFormData;
  updateField: (field: keyof TeacherFormData, value: any) => void;
}

export const AdditionalQuestionsStep = ({ formData, updateField }: Props) => {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Why do you want to join our school?</Label>
        <Textarea value={formData.why_join} onChange={e => updateField('why_join', e.target.value)} placeholder="Share your motivation..." rows={3} />
      </div>
      <div className="space-y-2">
        <Label>Teaching Philosophy</Label>
        <Textarea value={formData.teaching_philosophy} onChange={e => updateField('teaching_philosophy', e.target.value)} placeholder="Describe your teaching philosophy..." rows={3} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Expected Salary</Label>
          <Input value={formData.expected_salary} onChange={e => updateField('expected_salary', e.target.value)} placeholder="e.g. ₱25,000 - ₱30,000" />
        </div>
        <div className="space-y-2">
          <Label>Available Start Date</Label>
          <Input type="date" value={formData.available_start_date} onChange={e => updateField('available_start_date', e.target.value)} />
        </div>
      </div>
    </div>
  );
};
