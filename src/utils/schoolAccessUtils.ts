/**
 * School Access and Audit Utilities
 * 
 * Helper functions for user-school access management, audit logging,
 * and data export tracking.
 */

import { supabase } from '@/integrations/supabase/client';

// ============================================================================
// Types
// ============================================================================

export interface UserSchoolAccess {
    id: string;
    user_id: string;
    school_id: string;
    role: 'admin' | 'registrar' | 'teacher' | 'viewer';
    granted_by?: string;
    granted_at: string;
    is_active: boolean;
}

export interface SchoolAccessLog {
    id: string;
    user_id: string;
    school_id: string;
    academic_year_id?: string | null;
    action: string;
    table_name: string;
    record_id?: string | null;
    ip_address?: unknown;
    user_agent?: string | null;
    success: boolean | null;
    error_message?: string | null;
    created_at: string | null;
}

export interface SchoolSwitchLog {
    id: string;
    user_id: string;
    from_school_id?: string | null;
    to_school_id?: string | null;
    from_academic_year_id?: string | null;
    to_academic_year_id?: string | null;
    session_id?: string | null;
    ip_address?: unknown;
    switched_at: string | null;
}

export interface DataExport {
    id: string;
    user_id: string;
    school_id?: string | null;
    academic_year_id?: string | null;
    export_type: string;
    table_name: string;
    record_count?: number | null;
    file_name?: string | null;
    file_size_bytes?: number | null;
    exported_at: string | null;
}

export interface UserSchool {
    school_id: string;
    school_name: string;
    school_code: string;
    user_role: string;
}

// ============================================================================
// User-School Access Functions
// ============================================================================

/**
 * Check if current user has access to a specific school
 */
export async function checkSchoolAccess(schoolId: string): Promise<boolean> {
    const { data: session } = await supabase.auth.getSession();
    if (!session?.session?.user) return false;

    const { data, error } = await supabase.rpc('user_has_school_access', {
        p_user_id: session.session.user.id,
        p_school_id: schoolId,
    });

    return !error && data === true;
}

/**
 * Get all schools accessible to the current user
 */
export async function getUserSchools(): Promise<UserSchool[]> {
    const { data: session } = await supabase.auth.getSession();
    if (!session?.session?.user) return [];

    const { data, error } = await supabase.rpc('get_user_schools', {
        p_user_id: session.session.user.id,
    });

    if (error) {
        // Error fetching user schools - return empty array
        return [];
    }

    return data || [];
}

/**
 * Grant school access to a user
 */
export async function grantSchoolAccess(
    userId: string,
    schoolId: string,
    role: UserSchoolAccess['role']
): Promise<{ success: boolean; error?: string }> {
    const { data: session } = await supabase.auth.getSession();
    if (!session?.session?.user) {
        return { success: false, error: 'Not authenticated' };
    }

    const { error } = await supabase.from('user_school_access').insert({
        user_id: userId,
        school_id: schoolId,
        role,
        granted_by: session.session.user.id,
    });

    if (error) {
        return { success: false, error: error.message };
    }

    return { success: true };
}

/**
 * Revoke school access from a user
 */
export async function revokeSchoolAccess(
    userId: string,
    schoolId: string
): Promise<{ success: boolean; error?: string }> {
    const { error } = await supabase
        .from('user_school_access')
        .update({ is_active: false })
        .eq('user_id', userId)
        .eq('school_id', schoolId);

    if (error) {
        return { success: false, error: error.message };
    }

    return { success: true };
}

// ============================================================================
// Audit Logging Functions
// ============================================================================

/**
 * Log a school data access event
 */
export async function logSchoolAccess(params: {
    schoolId: string;
    academicYearId?: string;
    action: SchoolAccessLog['action'];
    tableName: string;
    recordId?: string;
    success?: boolean;
    errorMessage?: string;
}): Promise<string | null> {
    const { data: session } = await supabase.auth.getSession();
    if (!session?.session?.user) return null;

    const { data, error } = await supabase.rpc('log_school_access', {
        p_user_id: session.session.user.id,
        p_school_id: params.schoolId,
        p_academic_year_id: params.academicYearId || '',
        p_action: params.action,
        p_table_name: params.tableName,
        p_record_id: params.recordId || '',
        p_success: params.success ?? true,
        p_error_message: params.errorMessage || '',
    });

    if (error) {
        // Error logging school access
        return null;
    }

    return data;
}

/**
 * Get access logs for a school
 */
export async function getSchoolAccessLogs(
    schoolId: string,
    limit: number = 100
): Promise<SchoolAccessLog[]> {
    const { data, error } = await supabase
        .from('school_access_logs')
        .select('*')
        .eq('school_id', schoolId)
        .order('created_at', { ascending: false })
        .limit(limit);

    if (error) {
        // Error fetching access logs
        return [];
    }

    return (data || []) as any;
}

// ============================================================================
// School Switching Functions
// ============================================================================

/**
 * Log a school switch event
 */
export async function logSchoolSwitch(params: {
    fromSchoolId?: string;
    toSchoolId?: string;
    fromAcademicYearId?: string;
    toAcademicYearId?: string;
    sessionId?: string;
}): Promise<void> {
    const { data: session } = await supabase.auth.getSession();
    if (!session?.session?.user) return;

    await supabase.from('school_switch_log').insert({
        user_id: session.session.user.id,
        from_school_id: params.fromSchoolId || null,
        to_school_id: params.toSchoolId || null,
        from_academic_year_id: params.fromAcademicYearId || null,
        to_academic_year_id: params.toAcademicYearId || null,
        session_id: params.sessionId || null,
    });
}

/**
 * Get user's school switch history
 */
export async function getSchoolSwitchHistory(
    limit: number = 50
): Promise<SchoolSwitchLog[]> {
    const { data: session } = await supabase.auth.getSession();
    if (!session?.session?.user) return [];

    const { data, error } = await supabase
        .from('school_switch_log')
        .select('*')
        .eq('user_id', session.session.user.id)
        .order('switched_at', { ascending: false })
        .limit(limit);

    if (error) {
        // Error fetching switch history
        return [];
    }

    return data || [];
}

// ============================================================================
// Data Export Functions
// ============================================================================

/**
 * Log a data export event
 */
export async function logDataExport(params: {
    schoolId?: string;
    academicYearId?: string;
    exportType: DataExport['export_type'];
    tableName: string;
    recordCount?: number;
    fileName?: string;
    fileSizeBytes?: number;
}): Promise<string | null> {
    const { data: session } = await supabase.auth.getSession();
    if (!session?.session?.user) return null;

    const { data, error } = await supabase
        .from('data_exports')
        .insert({
            user_id: session.session.user.id,
            school_id: params.schoolId || null,
            academic_year_id: params.academicYearId || null,
            export_type: params.exportType,
            table_name: params.tableName,
            record_count: params.recordCount || null,
            file_name: params.fileName || null,
            file_size_bytes: params.fileSizeBytes || null,
        })
        .select('id')
        .single();

    if (error) {
        console.error('Error logging data export:', error);
        return null;
    }

    return data?.id || null;
}

/**
 * Get user's export history
 */
export async function getExportHistory(
    limit: number = 50
): Promise<DataExport[]> {
    const { data: session } = await supabase.auth.getSession();
    if (!session?.session?.user) return [];

    const { data, error } = await supabase
        .from('data_exports')
        .select('*')
        .eq('user_id', session.session.user.id)
        .order('exported_at', { ascending: false })
        .limit(limit);

    if (error) {
        // Error fetching export history
        return [];
    }

    return data || [];
}

/**
 * Get export statistics for a school
 */
export async function getSchoolExportStats(schoolId: string): Promise<{
    totalExports: number;
    exportsByType: Record<string, number>;
    exportsByTable: Record<string, number>;
}> {
    const { data, error } = await supabase
        .from('data_exports')
        .select('export_type, table_name')
        .eq('school_id', schoolId);

    if (error || !data) {
        return {
            totalExports: 0,
            exportsByType: {},
            exportsByTable: {},
        };
    }

    const exportsByType: Record<string, number> = {};
    const exportsByTable: Record<string, number> = {};

    data.forEach((exp: { export_type: string; table_name: string }) => {
        exportsByType[exp.export_type] = (exportsByType[exp.export_type] || 0) + 1;
        exportsByTable[exp.table_name] = (exportsByTable[exp.table_name] || 0) + 1;
    });

    return {
        totalExports: data.length,
        exportsByType,
        exportsByTable,
    };
}

// ============================================================================
// Wrapper for Query Builder with Automatic Logging
// ============================================================================

/**
 * Enhanced query builder that automatically logs access
 */
export class AuditedSchoolYearQueryBuilder<T> {
    private tableName: string;
    private schoolId: string;
    private academicYearId: string;

    constructor(tableName: string, schoolId: string, academicYearId: string) {
        this.tableName = tableName;
        this.schoolId = schoolId;
        this.academicYearId = academicYearId;
    }

    async select(columns: string = '*') {
        // Log the SELECT operation
        await logSchoolAccess({
            schoolId: this.schoolId,
            academicYearId: this.academicYearId,
            action: 'SELECT',
            tableName: this.tableName,
        });

        return (supabase
            .from(this.tableName as any)
            .select(columns) as any)
            .eq('school_id', this.schoolId)
            .eq('academic_year_id', this.academicYearId);
    }

    async insert(data: Partial<T> | Partial<T>[]) {
        const baseData = {
            school_id: this.schoolId,
            academic_year_id: this.academicYearId,
        };

        const dataWithContext = Array.isArray(data)
            ? data.map((item) => ({ ...baseData, ...item }))
            : { ...baseData, ...data };

        const result = await (supabase.from(this.tableName as any) as any).insert(dataWithContext).select();

        // Log the INSERT operation
        await logSchoolAccess({
            schoolId: this.schoolId,
            academicYearId: this.academicYearId,
            action: 'INSERT',
            tableName: this.tableName,
            success: !result.error,
            errorMessage: result.error?.message,
        });

        return result;
    }

    async update(data: Partial<T>) {
        const result = await (supabase
            .from(this.tableName as any)
            .update(data) as any)
            .eq('school_id', this.schoolId)
            .eq('academic_year_id', this.academicYearId);

        // Log the UPDATE operation
        await logSchoolAccess({
            schoolId: this.schoolId,
            academicYearId: this.academicYearId,
            action: 'UPDATE',
            tableName: this.tableName,
            success: !result.error,
            errorMessage: result.error?.message,
        });

        return result;
    }

    async delete() {
        const result = await (supabase
            .from(this.tableName as any)
            .delete() as any)
            .eq('school_id', this.schoolId)
            .eq('academic_year_id', this.academicYearId);

        // Log the DELETE operation
        await logSchoolAccess({
            schoolId: this.schoolId,
            academicYearId: this.academicYearId,
            action: 'DELETE',
            tableName: this.tableName,
            success: !result.error,
            errorMessage: result.error?.message,
        });

        return result;
    }
}
