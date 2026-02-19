import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Plus, Trash2, Save, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useSchoolId } from '@/hooks/useSchoolId';
import { useAuth } from '@/contexts/AuthContext';

interface BreakoutRoom {
  name: string;
  url: string;
}

interface ZoomSettings {
  id: string;
  meeting_url: string | null;
  meeting_id: string | null;
  meeting_password: string | null;
  breakout_rooms: BreakoutRoom[];
  schedule_start: string;
  schedule_end: string;
  timezone: string;
  active_days: number[];
  is_active: boolean;
}

const DAYS = [
  { value: 0, label: 'Sun' },
  { value: 1, label: 'Mon' },
  { value: 2, label: 'Tue' },
  { value: 3, label: 'Wed' },
  { value: 4, label: 'Thu' },
  { value: 5, label: 'Fri' },
  { value: 6, label: 'Sat' },
];

interface ZoomSettingsPanelProps {
  settings: ZoomSettings | null;
  onBack: () => void;
}

export const ZoomSettingsPanel = ({ settings, onBack }: ZoomSettingsPanelProps) => {
  const { data: schoolId } = useSchoolId();
  const { user } = useAuth();

  const [meetingUrl, setMeetingUrl] = useState(settings?.meeting_url || '');
  const [meetingId, setMeetingId] = useState(settings?.meeting_id || '');
  const [meetingPassword, setMeetingPassword] = useState(settings?.meeting_password || '');
  const [breakoutRooms, setBreakoutRooms] = useState<BreakoutRoom[]>(settings?.breakout_rooms || []);
  const [scheduleStart, setScheduleStart] = useState(settings?.schedule_start?.slice(0, 5) || '07:30');
  const [scheduleEnd, setScheduleEnd] = useState(settings?.schedule_end?.slice(0, 5) || '17:30');
  const [activeDays, setActiveDays] = useState<number[]>(settings?.active_days || [1, 2, 3, 4, 5]);
  const [isActive, setIsActive] = useState(settings?.is_active ?? true);
  const [saving, setSaving] = useState(false);

  const addRoom = () => {
    setBreakoutRooms([...breakoutRooms, { name: '', url: '' }]);
  };

  const removeRoom = (idx: number) => {
    setBreakoutRooms(breakoutRooms.filter((_, i) => i !== idx));
  };

  const updateRoom = (idx: number, field: 'name' | 'url', value: string) => {
    const updated = [...breakoutRooms];
    updated[idx] = { ...updated[idx], [field]: value };
    setBreakoutRooms(updated);
  };

  const toggleDay = (day: number) => {
    setActiveDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day].sort()
    );
  };

  const handleSave = async () => {
    if (!schoolId) return;
    setSaving(true);

    const payload = {
      school_id: schoolId,
      meeting_url: meetingUrl || null,
      meeting_id: meetingId || null,
      meeting_password: meetingPassword || null,
      breakout_rooms: JSON.parse(JSON.stringify(breakoutRooms.filter(r => r.name.trim()))),
      schedule_start: scheduleStart + ':00',
      schedule_end: scheduleEnd + ':00',
      active_days: activeDays,
      is_active: isActive,
      updated_by: user?.id || null,
    };

    let error;
    if (settings?.id) {
      ({ error } = await supabase
        .from('zoom_settings')
        .update(payload)
        .eq('id', settings.id));
    } else {
      ({ error } = await supabase
        .from('zoom_settings')
        .insert(payload));
    }

    setSaving(false);

    if (error) {
      toast.error('Failed to save: ' + error.message);
    } else {
      toast.success('Zoom settings saved!');
      onBack();
    }
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3"
      >
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Zoom Settings</h1>
          <p className="text-muted-foreground mt-1">Configure your virtual classroom</p>
        </div>
      </motion.div>

      {/* Meeting Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Video className="h-5 w-5" />
            Meeting Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Meeting URL</Label>
            <Input
              value={meetingUrl}
              onChange={e => setMeetingUrl(e.target.value)}
              placeholder="https://zoom.us/j/1234567890"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Meeting ID</Label>
              <Input
                value={meetingId}
                onChange={e => setMeetingId(e.target.value)}
                placeholder="123 456 7890"
              />
            </div>
            <div className="space-y-2">
              <Label>Password</Label>
              <Input
                value={meetingPassword}
                onChange={e => setMeetingPassword(e.target.value)}
                placeholder="Enter password"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Breakout Rooms */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Breakout Rooms</CardTitle>
          <Button size="sm" variant="outline" onClick={addRoom}>
            <Plus className="h-4 w-4 mr-1" />
            Add Room
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {breakoutRooms.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              No breakout rooms configured. Click "Add Room" to add one.
            </p>
          )}
          {breakoutRooms.map((room, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <span className="text-sm font-mono text-muted-foreground w-6">{idx + 1}</span>
              <Input
                value={room.name}
                onChange={e => updateRoom(idx, 'name', e.target.value)}
                placeholder="Room name (e.g., Grade 7 - Section A)"
                className="flex-1"
              />
              <Input
                value={room.url}
                onChange={e => updateRoom(idx, 'url', e.target.value)}
                placeholder="Zoom URL for this room"
                className="flex-1"
              />
              <Button size="icon" variant="ghost" onClick={() => removeRoom(idx)}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Schedule */}
      <Card>
        <CardHeader>
          <CardTitle>Schedule</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start Time</Label>
              <Input
                type="time"
                value={scheduleStart}
                onChange={e => setScheduleStart(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>End Time</Label>
              <Input
                type="time"
                value={scheduleEnd}
                onChange={e => setScheduleEnd(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Active Days</Label>
            <div className="flex flex-wrap gap-3">
              {DAYS.map(day => (
                <label key={day.value} className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={activeDays.includes(day.value)}
                    onCheckedChange={() => toggleDay(day.value)}
                  />
                  <span className="text-sm">{day.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <div>
              <Label>Enable Virtual Classroom</Label>
              <p className="text-sm text-muted-foreground">When disabled, the dashboard shows offline status</p>
            </div>
            <Switch checked={isActive} onCheckedChange={setIsActive} />
          </div>
        </CardContent>
      </Card>

      {/* Save */}
      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={onBack}>Cancel</Button>
        <Button onClick={handleSave} disabled={saving}>
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>
    </div>
  );
};
