import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Video, VideoOff, Clock, Copy, ExternalLink, Settings, Users, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useSchoolId } from '@/hooks/useSchoolId';
import { useAuth } from '@/contexts/AuthContext';
import { ZoomSettingsPanel } from './ZoomSettingsPanel';

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

const useUAETime = () => {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const uaeTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Dubai' }));
  return uaeTime;
};

const isInSession = (uaeTime: Date, settings: ZoomSettings | null): boolean => {
  if (!settings?.is_active) return false;

  const day = uaeTime.getDay(); // 0=Sun, 1=Mon...
  if (!settings.active_days.includes(day)) return false;

  const [startH, startM] = settings.schedule_start.split(':').map(Number);
  const [endH, endM] = settings.schedule_end.split(':').map(Number);

  const currentMinutes = uaeTime.getHours() * 60 + uaeTime.getMinutes();
  const startMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;

  return currentMinutes >= startMinutes && currentMinutes < endMinutes;
};

const formatCountdown = (uaeTime: Date, settings: ZoomSettings | null): string => {
  if (!settings) return '';

  const [startH, startM] = settings.schedule_start.split(':').map(Number);
  const day = uaeTime.getDay();

  // If it's a weekday and before start time
  if (settings.active_days.includes(day)) {
    const currentMinutes = uaeTime.getHours() * 60 + uaeTime.getMinutes();
    const startMinutes = startH * 60 + startM;
    if (currentMinutes < startMinutes) {
      const diff = startMinutes - currentMinutes;
      const h = Math.floor(diff / 60);
      const m = diff % 60;
      return h > 0 ? `${h}h ${m}m until session starts` : `${m}m until session starts`;
    }
  }

  // Find next active day
  let daysUntil = 1;
  for (let i = 1; i <= 7; i++) {
    const nextDay = (day + i) % 7;
    if (settings.active_days.includes(nextDay)) {
      daysUntil = i;
      break;
    }
  }

  return daysUntil === 1 ? 'Next session tomorrow' : `Next session in ${daysUntil} days`;
};

export const ZoomDashboard = () => {
  const { data: schoolId, isLoading: schoolLoading } = useSchoolId();
  const { role } = useAuth();
  const uaeTime = useUAETime();
  const [settings, setSettings] = useState<ZoomSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [manualOverride, setManualOverride] = useState(false);

  const hasAdminAccess = role === 'admin' || role === 'registrar';
  const sessionActive = isInSession(uaeTime, settings) || manualOverride;

  const fetchSettings = async () => {
    if (!schoolId) { setLoading(false); return; }
    setLoading(true);
    const { data, error } = await supabase
      .from('zoom_settings')
      .select('*')
      .eq('school_id', schoolId)
      .maybeSingle();

    if (!error && data) {
      setSettings({
        ...data,
        breakout_rooms: (data.breakout_rooms as unknown as BreakoutRoom[] | null) || [],
      });
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchSettings();
  }, [schoolId]);

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleJoin = (url: string) => {
    window.open(url, '_blank');
  };

  if (schoolLoading || loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
      </div>
    );
  }

  if (!schoolId) {
    return (
      <div className="space-y-6">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Virtual Classes</h1>
          <p className="text-muted-foreground mt-1">Zoom virtual classroom dashboard</p>
        </motion.div>
        <Card className="max-w-lg mx-auto mt-12">
          <CardContent className="flex flex-col items-center py-12 gap-4">
            <VideoOff className="h-16 w-16 text-muted-foreground/40" />
            <h2 className="text-xl font-semibold text-foreground">School Not Found</h2>
            <p className="text-muted-foreground text-center">
              Could not resolve the current school. Please contact your administrator.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (showSettings && hasAdminAccess) {
    return (
      <ZoomSettingsPanel
        settings={settings}
        onBack={() => {
          setShowSettings(false);
          fetchSettings();
        }}
      />
    );
  }

  // No settings yet — prompt admin
  if (!settings) {
    return (
      <div className="space-y-6">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Virtual Classes</h1>
          <p className="text-muted-foreground mt-1">Zoom virtual classroom dashboard</p>
        </motion.div>
        <Card className="max-w-lg mx-auto mt-12">
          <CardContent className="flex flex-col items-center py-12 gap-4">
            <Video className="h-16 w-16 text-muted-foreground/40" />
            <h2 className="text-xl font-semibold text-foreground">No Meeting Configured</h2>
            <p className="text-muted-foreground text-center">
              {hasAdminAccess
                ? 'Set up your Zoom meeting link and breakout rooms to get started.'
                : 'Your administrator hasn\'t configured virtual classes yet.'}
            </p>
            {hasAdminAccess && (
              <Button onClick={() => setShowSettings(true)} className="mt-2">
                <Settings className="h-4 w-4 mr-2" />
                Configure Meeting
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  const timeStr = uaeTime.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });

  const dateStr = uaeTime.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Virtual Classes</h1>
          <p className="text-muted-foreground mt-1">Zoom virtual classroom dashboard</p>
        </div>
        <div className="flex gap-2">
          {hasAdminAccess && !sessionActive && !manualOverride && (
            <Button variant="default" onClick={() => { setManualOverride(true); toast.success('Meeting started manually – join buttons are now active'); }}>
              <Video className="h-4 w-4 mr-2" />
              Start Meeting Now
            </Button>
          )}
          {manualOverride && (
            <Button variant="destructive" onClick={() => setManualOverride(false)}>
              <VideoOff className="h-4 w-4 mr-2" />
              End Manual Session
            </Button>
          )}
          {hasAdminAccess && (
            <Button variant="outline" onClick={() => setShowSettings(true)}>
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
          )}
        </div>
      </motion.div>

      {/* Status & Clock */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card>
            <CardContent className="flex items-center gap-4 py-6">
              <div className={`p-3 rounded-full ${sessionActive ? 'bg-green-500/10' : 'bg-muted'}`}>
                {sessionActive ? (
                  <Video className="h-8 w-8 text-green-500" />
                ) : (
                  <VideoOff className="h-8 w-8 text-muted-foreground" />
                )}
              </div>
              <div>
                <Badge variant={sessionActive ? 'default' : 'secondary'} className={sessionActive ? 'bg-emerald-600 hover:bg-emerald-700' : ''}>
                  {sessionActive ? '● In Session' : '○ Offline'}
                </Badge>
                <p className="text-sm text-muted-foreground mt-1">
                  {sessionActive
                    ? `Ends at ${settings.schedule_end.slice(0, 5)}`
                    : formatCountdown(uaeTime, settings)}
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <Card>
            <CardContent className="flex items-center gap-4 py-6">
              <div className="p-3 rounded-full bg-primary/10">
                <Clock className="h-8 w-8 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold font-mono text-foreground">{timeStr}</p>
                <p className="text-sm text-muted-foreground">{dateStr} (UAE)</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Join Main Meeting */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Video className="h-5 w-5" />
              Main Meeting
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              size="lg"
              className="w-full text-lg py-6"
              disabled={!sessionActive || !settings.meeting_url}
              onClick={() => settings.meeting_url && handleJoin(settings.meeting_url)}
            >
              <ExternalLink className="h-5 w-5 mr-2" />
              {sessionActive ? 'Join Meeting' : 'Meeting Offline'}
            </Button>

            {settings.meeting_id && (
              <div className="flex flex-wrap gap-3">
                <div className="flex items-center gap-2 bg-muted rounded-lg px-3 py-2 text-sm">
                  <span className="text-muted-foreground">ID:</span>
                  <span className="font-mono font-medium text-foreground">{settings.meeting_id}</span>
                  <button onClick={() => copyToClipboard(settings.meeting_id!, 'id')} className="text-muted-foreground hover:text-foreground">
                    {copiedField === 'id' ? <CheckCircle className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4" />}
                  </button>
                </div>
                {settings.meeting_password && (
                  <div className="flex items-center gap-2 bg-muted rounded-lg px-3 py-2 text-sm">
                    <span className="text-muted-foreground">Password:</span>
                    <span className="font-mono font-medium text-foreground">{settings.meeting_password}</span>
                    <button onClick={() => copyToClipboard(settings.meeting_password!, 'pw')} className="text-muted-foreground hover:text-foreground">
                      {copiedField === 'pw' ? <CheckCircle className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4" />}
                    </button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Breakout Rooms */}
      {settings.breakout_rooms.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Breakout Rooms ({settings.breakout_rooms.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {settings.breakout_rooms.map((room, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 + idx * 0.05 }}
                  >
                    <Card className="border">
                      <CardContent className="flex items-center justify-between py-4 px-4">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <span className="text-xs font-bold text-primary">{idx + 1}</span>
                          </div>
                          <span className="font-medium text-foreground truncate">{room.name}</span>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={!sessionActive || !room.url}
                          onClick={() => handleJoin(room.url)}
                        >
                          <ExternalLink className="h-3 w-3 mr-1" />
                          Join
                        </Button>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Schedule Info */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
        <Card>
          <CardContent className="py-4">
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <span>📅 Schedule: {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].filter((_, i) => settings.active_days.includes(i)).join(', ')}</span>
              <span>⏰ {settings.schedule_start.slice(0, 5)} — {settings.schedule_end.slice(0, 5)} ({settings.timezone})</span>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};
