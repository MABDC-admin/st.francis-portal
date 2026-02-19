import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface BreakoutRoom {
    name: string;
    url: string;
}

export interface ZoomSettings {
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

export const useZoomSession = (schoolId: string | null) => {
    const [settings, setSettings] = useState<ZoomSettings | null>(null);
    const [loading, setLoading] = useState(true);
    const [now, setNow] = useState(() => new Date());

    useEffect(() => {
        const interval = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(interval);
    }, []);

    const uaeTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Dubai' }));

    const fetchSettings = async () => {
        if (!schoolId) {
            setLoading(false);
            return;
        }
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

    const isInSession = (): boolean => {
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

    const getCountdown = (): string => {
        if (!settings) return '';

        const [startH, startM] = settings.schedule_start.split(':').map(Number);
        const day = uaeTime.getDay();

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

    return {
        settings,
        loading,
        uaeTime,
        inSession: isInSession(),
        countdown: getCountdown(),
        refresh: fetchSettings
    };
};
