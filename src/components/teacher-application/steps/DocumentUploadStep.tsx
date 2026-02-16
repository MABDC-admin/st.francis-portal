import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Upload, X, FileText } from 'lucide-react';
import { TeacherApplicationFormValues as TeacherFormData } from '../schema';
import { supabase } from '@/integrations/supabase/client';
import { useState } from 'react';

interface Props {
  formData: TeacherFormData;
  updateField: (field: keyof TeacherFormData, value: any) => void;
  schoolId: string;
}

const ACCEPT = 'image/*,.pdf,.doc,.docx';

export const DocumentUploadStep = ({ formData, updateField }: Props) => {
  const [uploading, setUploading] = useState<string | null>(null);

  const handleUpload = async (field: keyof TeacherFormData, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error('File must be under 5MB'); return; }
    setUploading(field);
    try {
      const path = `${crypto.randomUUID()}/${file.name}`;
      const { error } = await supabase.storage.from('teacher-applications').upload(path, file);
      if (error) throw error;
      updateField(field, path);
      toast.success('Document uploaded');
    } catch (err: any) {
      toast.error(err.message || 'Upload failed');
    } finally {
      setUploading(null);
    }
  };

  const handleCertUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error('File must be under 5MB'); return; }
    setUploading('certificates');
    try {
      const path = `${crypto.randomUUID()}/${file.name}`;
      const { error } = await supabase.storage.from('teacher-applications').upload(path, file);
      if (error) throw error;
      updateField('certificates_url', [...formData.certificates_url, path]);
      toast.success('Certificate uploaded');
    } catch (err: any) {
      toast.error(err.message || 'Upload failed');
    } finally {
      setUploading(null);
    }
  };

  const removeCert = (index: number) => {
    updateField('certificates_url', formData.certificates_url.filter((_, i) => i !== index));
  };

  const FileField = ({ label, field, required }: { label: string; field: keyof TeacherFormData; required?: boolean }) => {
    const value = formData[field] as string;
    return (
      <div className="space-y-2">
        <Label>{label} {required && <span className="text-destructive">*</span>}</Label>
        {value ? (
          <div className="flex items-center gap-2 p-2 bg-muted rounded">
            <FileText className="h-4 w-4 text-primary" />
            <span className="text-sm text-muted-foreground truncate flex-1">{value.split('/').pop()}</span>
            <Button variant="ghost" size="icon" onClick={() => updateField(field, '')}><X className="h-4 w-4" /></Button>
          </div>
        ) : (
          <label className="flex items-center gap-2 cursor-pointer text-sm text-primary hover:underline p-2 border border-dashed rounded">
            <Upload className="h-4 w-4" /> {uploading === field ? 'Uploading...' : 'Upload'}
            <input type="file" accept={ACCEPT} className="hidden" onChange={e => handleUpload(field, e)} disabled={uploading === field} />
          </label>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">Upload required documents. Max 5MB per file.</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FileField label="Resume/CV" field="resume_url" required />
        <FileField label="Transcript of Records" field="transcript_url" required />
        <FileField label="Diploma" field="diploma_url" required />
        <FileField label="Valid ID" field="valid_id_url" required />
      </div>
      <div className="space-y-2">
        <Label>Certificates & Training Documents (Optional)</Label>
        {formData.certificates_url.map((cert, i) => (
          <div key={i} className="flex items-center gap-2 p-2 bg-muted rounded">
            <FileText className="h-4 w-4 text-primary" />
            <span className="text-sm text-muted-foreground truncate flex-1">{cert.split('/').pop()}</span>
            <Button variant="ghost" size="icon" onClick={() => removeCert(i)}><X className="h-4 w-4" /></Button>
          </div>
        ))}
        <label className="flex items-center gap-2 cursor-pointer text-sm text-primary hover:underline p-2 border border-dashed rounded w-fit">
          <Upload className="h-4 w-4" /> {uploading === 'certificates' ? 'Uploading...' : 'Add Certificate'}
          <input type="file" accept={ACCEPT} className="hidden" onChange={handleCertUpload} disabled={uploading === 'certificates'} />
        </label>
      </div>
    </div>
  );
};
