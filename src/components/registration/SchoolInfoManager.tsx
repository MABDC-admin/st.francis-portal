import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSchool } from '@/contexts/SchoolContext';
import { getSchoolId } from '@/utils/schoolIdMap';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Plus, Trash2, Save } from 'lucide-react';

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
    facility_photos: [] as string[],
    visit_slots_config: {
      morning: '9:00 AM - 12:00 PM',
      afternoon: '1:00 PM - 4:00 PM',
      max_per_slot: 5,
    },
  });
  const [newPhotoUrl, setNewPhotoUrl] = useState('');

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
        facility_photos: Array.isArray(schoolInfo.facility_photos) ? schoolInfo.facility_photos : [],
        visit_slots_config: schoolInfo.visit_slots_config || {
          morning: '9:00 AM - 12:00 PM',
          afternoon: '1:00 PM - 4:00 PM',
          max_per_slot: 5,
        },
      });
    }
  }, [schoolInfo]);

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

  const addPhoto = () => {
    if (newPhotoUrl.trim()) {
      setForm(prev => ({ ...prev, facility_photos: [...prev.facility_photos, newPhotoUrl.trim()] }));
      setNewPhotoUrl('');
    }
  };

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
        <div className="space-y-2 md:col-span-2">
          <Label>Map Embed URL</Label>
          <Input value={form.map_embed_url} onChange={e => setForm(p => ({ ...p, map_embed_url: e.target.value }))} placeholder="https://www.google.com/maps/embed?..." />
        </div>
      </div>

      <div className="space-y-3">
        <Label>Facility Photos</Label>
        <div className="flex gap-2">
          <Input value={newPhotoUrl} onChange={e => setNewPhotoUrl(e.target.value)} placeholder="Paste image URL" className="flex-1" />
          <Button type="button" size="sm" onClick={addPhoto} disabled={!newPhotoUrl.trim()}><Plus className="h-4 w-4" /></Button>
        </div>
        {form.facility_photos.map((url, i) => (
          <div key={i} className="flex items-center gap-2 bg-muted/50 p-2 rounded-lg">
            <img src={url} alt="" className="h-10 w-16 object-cover rounded" />
            <span className="text-xs text-muted-foreground truncate flex-1">{url}</span>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => removePhoto(i)}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
          </div>
        ))}
      </div>

      <div className="space-y-3">
        <Label>Visit Slot Configuration</Label>
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
