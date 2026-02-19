import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSchool } from '@/contexts/SchoolContext';
import { getSchoolId } from '@/utils/schoolIdMap';
import { toast } from 'sonner';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Trash2, Save, Upload, ImagePlus } from 'lucide-react';

const MAX_FILE_SIZE = 30 * 1024 * 1024; // 30MB
const ACCEPTED_TYPES: Record<string, string[]> = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/webp': ['.webp'],
};

export const SchoolInfoManager = () => {
  const { selectedSchool } = useSchool();
  const schoolId = getSchoolId(selectedSchool);
  const queryClient = useQueryClient();

  const [form, setForm] = useState({
    registrar_name: '',
    registrar_photo_url: '',
    registrar_phone: '',
    registrar_email: '',
    office_hours: '',
    map_embed_url: '',
    latitude: '',
    longitude: '',
    facility_photos: [] as string[],
    visit_slots_config: {
      morning: '9:00 AM - 12:00 PM',
      afternoon: '1:00 PM - 4:00 PM',
      max_per_slot: 5,
    },
  });
  const [uploading, setUploading] = useState(false);

  const { data: schoolInfo, isLoading } = useQuery({
    queryKey: ['school_info', schoolId],
    queryFn: async () => {
      if (!schoolId) return null;
      const { data } = await (supabase.from('school_info') as any)
        .select('*')
        .eq('school_id', schoolId)
        .maybeSingle();
      return data;
    },
    enabled: !!schoolId,
  });

  useEffect(() => {
    if (schoolInfo) {
      setForm({
        registrar_name: schoolInfo.registrar_name || '',
        registrar_photo_url: schoolInfo.registrar_photo_url || '',
        registrar_phone: schoolInfo.registrar_phone || '',
        registrar_email: schoolInfo.registrar_email || '',
        office_hours: schoolInfo.office_hours || '',
        map_embed_url: schoolInfo.map_embed_url || '',
        latitude: schoolInfo.latitude?.toString() || '',
        longitude: schoolInfo.longitude?.toString() || '',
        facility_photos: Array.isArray(schoolInfo.facility_photos) ? schoolInfo.facility_photos : [],
        visit_slots_config: schoolInfo.visit_slots_config || {
          morning: '9:00 AM - 12:00 PM',
          afternoon: '1:00 PM - 4:00 PM',
          max_per_slot: 5,
        },
      });
    }
  }, [schoolInfo]);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (!schoolId) return;
    setUploading(true);
    try {
      const newUrls: string[] = [];
      for (const file of acceptedFiles) {
        if (file.size > MAX_FILE_SIZE) {
          toast.error(`${file.name} exceeds 30MB limit`);
          continue;
        }
        const ext = file.name.split('.').pop();
        const path = `${schoolId}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
        const { error } = await supabase.storage.from('school-gallery').upload(path, file);
        if (error) {
          toast.error(`Failed to upload ${file.name}: ${error.message}`);
          continue;
        }
        const { data: urlData } = supabase.storage.from('school-gallery').getPublicUrl(path);
        newUrls.push(urlData.publicUrl);
      }
      if (newUrls.length > 0) {
        setForm(prev => ({ ...prev, facility_photos: [...prev.facility_photos, ...newUrls] }));
        toast.success(`${newUrls.length} photo(s) uploaded`);
      }
    } catch (err: any) {
      toast.error('Upload failed: ' + (err?.message || 'Unknown error'));
    } finally {
      setUploading(false);
    }
  }, [schoolId]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED_TYPES,
    maxSize: MAX_FILE_SIZE,
    disabled: uploading,
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!schoolId) throw new Error('No school selected');
      const payload = {
        school_id: schoolId,
        registrar_name: form.registrar_name || null,
        registrar_photo_url: form.registrar_photo_url || null,
        registrar_phone: form.registrar_phone || null,
        registrar_email: form.registrar_email || null,
        office_hours: form.office_hours || null,
        map_embed_url: form.map_embed_url || null,
        latitude: form.latitude ? parseFloat(form.latitude) : null,
        longitude: form.longitude ? parseFloat(form.longitude) : null,
        facility_photos: form.facility_photos,
        visit_slots_config: form.visit_slots_config,
        updated_at: new Date().toISOString(),
      };

      if (schoolInfo?.id) {
        const { error } = await (supabase.from('school_info') as any)
          .update(payload)
          .eq('id', schoolInfo.id);
        if (error) throw error;
      } else {
        const { error } = await (supabase.from('school_info') as any).insert([payload]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['school_info'] });
      toast.success('School info saved');
    },
    onError: (e: Error) => toast.error('Save failed: ' + e.message),
  });

  const removePhoto = (index: number) => {
    setForm(prev => ({ ...prev, facility_photos: prev.facility_photos.filter((_, i) => i !== index) }));
  };

  if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Registrar Name</Label>
          <Input value={form.registrar_name} onChange={e => setForm(p => ({ ...p, registrar_name: e.target.value }))} />
        </div>
        <div className="space-y-2">
          <Label>Registrar Photo URL</Label>
          <Input value={form.registrar_photo_url} onChange={e => setForm(p => ({ ...p, registrar_photo_url: e.target.value }))} placeholder="https://..." />
        </div>
        <div className="space-y-2">
          <Label>Phone</Label>
          <Input value={form.registrar_phone} onChange={e => setForm(p => ({ ...p, registrar_phone: e.target.value }))} />
        </div>
        <div className="space-y-2">
          <Label>Email</Label>
          <Input value={form.registrar_email} onChange={e => setForm(p => ({ ...p, registrar_email: e.target.value }))} type="email" />
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label>Office Hours</Label>
          <Input value={form.office_hours} onChange={e => setForm(p => ({ ...p, office_hours: e.target.value }))} placeholder="Mon-Fri 8:00 AM - 5:00 PM" />
        </div>
      </div>

      {/* Map / Location */}
      <div className="space-y-3">
        <Label className="text-base font-semibold">Location</Label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Latitude</Label>
            <Input value={form.latitude} onChange={e => setForm(p => ({ ...p, latitude: e.target.value }))} placeholder="e.g. 25.2048" type="number" step="any" />
          </div>
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Longitude</Label>
            <Input value={form.longitude} onChange={e => setForm(p => ({ ...p, longitude: e.target.value }))} placeholder="e.g. 55.2708" type="number" step="any" />
          </div>
        </div>
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Or paste a Google Maps Embed URL (fallback)</Label>
          <Input value={form.map_embed_url} onChange={e => setForm(p => ({ ...p, map_embed_url: e.target.value }))} placeholder="https://www.google.com/maps/embed?..." />
        </div>
      </div>

      {/* Facility Photos Upload */}
      <div className="space-y-3">
        <Label className="text-base font-semibold">Facility Photos</Label>
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'
            } ${uploading ? 'opacity-50 pointer-events-none' : ''}`}
        >
          <input {...getInputProps()} />
          {uploading ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Uploading...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <ImagePlus className="h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                {isDragActive ? 'Drop photos here...' : 'Drag & drop photos, or click to browse'}
              </p>
              <p className="text-xs text-muted-foreground">JPEG, PNG, WebP • Max 30MB each</p>
            </div>
          )}
        </div>

        {form.facility_photos.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {form.facility_photos.map((url, i) => (
              <div key={i} className="relative group rounded-lg overflow-hidden border bg-muted aspect-video">
                <img src={url} alt={`Facility ${i + 1}`} className="w-full h-full object-cover" />
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-1 right-1 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => removePhoto(i)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Visit Slot Config */}
      <div className="space-y-3">
        <Label className="text-base font-semibold">Visit Slot Configuration</Label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Morning Slot</Label>
            <Input value={form.visit_slots_config.morning} onChange={e => setForm(p => ({ ...p, visit_slots_config: { ...p.visit_slots_config, morning: e.target.value } }))} />
          </div>
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Afternoon Slot</Label>
            <Input value={form.visit_slots_config.afternoon} onChange={e => setForm(p => ({ ...p, visit_slots_config: { ...p.visit_slots_config, afternoon: e.target.value } }))} />
          </div>
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Max per Slot</Label>
            <Input type="number" value={form.visit_slots_config.max_per_slot} onChange={e => setForm(p => ({ ...p, visit_slots_config: { ...p.visit_slots_config, max_per_slot: parseInt(e.target.value) || 5 } }))} />
          </div>
        </div>
      </div>

      <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
        {saveMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
        Save School Info
      </Button>
    </div>
  );
};
