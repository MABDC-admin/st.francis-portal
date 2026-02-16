import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TeacherFormData } from '../TeacherApplicationForm';
import { supabase } from '@/integrations/supabase/client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, X } from 'lucide-react';

interface Props {
  formData: TeacherFormData;
  updateField: (field: keyof TeacherFormData, value: any) => void;
  schoolId: string;
}

export const PersonalInfoStep = ({ formData, updateField, schoolId }: Props) => {
  const [uploading, setUploading] = useState(false);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { alert('File must be under 5MB'); return; }
    setUploading(true);
    try {
      const path = `${crypto.randomUUID()}/${file.name}`;
      const { error } = await supabase.storage.from('teacher-applications').upload(path, file);
      if (error) throw error;
      updateField('photo_url', path);
    } catch (err: any) {
      alert(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label>First Name <span className="text-destructive">*</span></Label>
        <Input value={formData.first_name} onChange={e => updateField('first_name', e.target.value)} placeholder="First Name" />
      </div>
      <div className="space-y-2">
        <Label>Middle Name</Label>
        <Input value={formData.middle_name} onChange={e => updateField('middle_name', e.target.value)} placeholder="Middle Name" />
      </div>
      <div className="space-y-2">
        <Label>Last Name <span className="text-destructive">*</span></Label>
        <Input value={formData.last_name} onChange={e => updateField('last_name', e.target.value)} placeholder="Last Name" />
      </div>
      <div className="space-y-2">
        <Label>Suffix</Label>
        <Select value={formData.suffix} onValueChange={v => updateField('suffix', v)}>
          <SelectTrigger><SelectValue placeholder="Select suffix" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="none">None</SelectItem>
            <SelectItem value="Jr.">Jr.</SelectItem>
            <SelectItem value="Sr.">Sr.</SelectItem>
            <SelectItem value="II">II</SelectItem>
            <SelectItem value="III">III</SelectItem>
            <SelectItem value="IV">IV</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Gender <span className="text-destructive">*</span></Label>
        <Select value={formData.gender} onValueChange={v => updateField('gender', v)}>
          <SelectTrigger><SelectValue placeholder="Select gender" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="Male">Male</SelectItem>
            <SelectItem value="Female">Female</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Date of Birth <span className="text-destructive">*</span></Label>
        <Input type="date" value={formData.date_of_birth} onChange={e => updateField('date_of_birth', e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label>Place of Birth</Label>
        <Input value={formData.place_of_birth} onChange={e => updateField('place_of_birth', e.target.value)} placeholder="Place of Birth" />
      </div>
      <div className="space-y-2">
        <Label>Civil Status <span className="text-destructive">*</span></Label>
        <Select value={formData.civil_status} onValueChange={v => updateField('civil_status', v)}>
          <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="Single">Single</SelectItem>
            <SelectItem value="Married">Married</SelectItem>
            <SelectItem value="Widowed">Widowed</SelectItem>
            <SelectItem value="Separated">Separated</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Nationality <span className="text-destructive">*</span></Label>
        <Input value={formData.nationality} onChange={e => updateField('nationality', e.target.value)} placeholder="Nationality" />
      </div>
      <div className="space-y-2 md:col-span-2">
        <Label>Profile Photo</Label>
        {formData.photo_url ? (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground truncate">{formData.photo_url.split('/').pop()}</span>
            <Button variant="ghost" size="icon" onClick={() => updateField('photo_url', '')}><X className="h-4 w-4" /></Button>
          </div>
        ) : (
          <div>
            <label className="flex items-center gap-2 cursor-pointer text-sm text-primary hover:underline">
              <Upload className="h-4 w-4" /> {uploading ? 'Uploading...' : 'Upload Photo'}
              <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} disabled={uploading} />
            </label>
          </div>
        )}
      </div>
    </div>
  );
};
