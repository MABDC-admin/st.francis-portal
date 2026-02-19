import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export type AuditAction =
    | 'login_attempt'
    | 'login_success'
    | 'login_failure'
    | 'logout'
    | 'impersonation_start'
    | 'impersonation_stop'
    | 'data_export'
    | 'grade_change';

export interface AuditLogEntry {
    action: AuditAction;
    status: 'success' | 'failure';
    lrn?: string;
    error_message?: string;
    details?: any;
    school?: string;
}

export const logAuditAction = async (entry: AuditLogEntry, userId?: string) => {
    try {
        let ipData = { ip: 'unknown', country: null, city: null };
        try {
            const response = await fetch('https://ipapi.co/json/');
            if (response.ok) {
                const data = await response.json();
                ipData = {
                    ip: data.ip,
                    country: data.country_code,
                    city: data.city
                };
            }
        } catch (_e) {
            // Silently fail - IP geolocation is not critical for audit logging
        }

        const { error } = await supabase.from('audit_logs').insert({
            user_id: userId,
            lrn: entry.lrn,
            action: entry.action,
            status: entry.status,
            ip_address: ipData.ip,
            country_code: ipData.country,
            city: ipData.city,
            user_agent: navigator.userAgent,
            error_message: entry.error_message,
            school: entry.school,
        });

        if (error) {
            // Log to error tracking service in production
            // console.error('Failed to save audit log:', error);
        }
    } catch (_err) {
        // Silently fail - audit logging should not break the app
    }
};

export const useAuditLog = () => {
    const { user } = useAuth();

    const logAction = (entry: AuditLogEntry) => logAuditAction(entry, user?.id);

    return { logAction };
};
