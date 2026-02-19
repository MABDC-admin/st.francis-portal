import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { TeacherApplicationFormValues as TeacherFormData } from '../schema';
import { supabase } from '@/integrations/supabase/client';
import { useState } from 'react';
import { Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  formData: TeacherFormData;
  updateField: (field: keyof TeacherFormData, value: any) => void;
  schoolId: string;
}

export const PrcLicenseStep = ({ formData, updateField }: Props) => {
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 30 * 1024 * 1024) {
      toast.error('File must be under 30MB');
      return;
    }
    setUploading(true);
    try {
      const path = `${crypto.randomUUID()}/${file.name}`;
      const { error } = await supabase.storage.from('teacher-applications').upload(path, file);
      if (error) throw error;
      updateField('prc_license_url', path);
    } catch (err: any) {
      alert(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Switch checked={formData.has_prc_license} onCheckedChange={v => updateField('has_prc_license', v)} />
        <Label>I have a PRC License (LPT)</Label>
      </div>
      {formData.has_prc_license && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-4 border-l-2 border-primary/20">
          <div className="space-y-2">
            <Label>PRC License Number</Label>
            <Input value={formData.prc_license_number} onChange={e => updateField('prc_license_number', e.target.value)} placeholder="License Number" />
          </div>
          <div className="space-y-2">
            <Label>Expiration Date</Label>
            <Input type="date" value={formData.prc_expiration_date} onChange={e => updateField('prc_expiration_date', e.target.value)} />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>PRC License Copy</Label>
            {formData.prc_license_url ? (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground truncate">{formData.prc_license_url.split('/').pop()}</span>
                <Button variant="ghost" size="icon" onClick={() => updateField('prc_license_url', '')}><X className="h-4 w-4" /></Button>
              </div>
            ) : (
              <label className="flex items-center gap-2 cursor-pointer text-sm text-primary hover:underline">
                <Upload className="h-4 w-4" /> {uploading ? 'Uploading...' : 'Upload PRC License'}
                <input type="file" accept="image/*,.pdf" className="hidden" onChange={handleUpload} disabled={uploading} />
              </label>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
