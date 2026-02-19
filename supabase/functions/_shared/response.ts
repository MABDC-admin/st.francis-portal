/**
 * Shared utilities for Supabase Edge Functions
 *
 * Provides standardized CORS headers, response helpers, auth verification,
 * and error handling. Import into any edge function to ensure consistent
 * response format and reduce boilerplate.
 *
 * Usage:
 *   import { corsHeaders, jsonResponse, errorResponse, requireAuth } from '../_shared/response.ts';
 */

// ─── CORS ────────────────────────────────────────────────────────────────────

export const corsHeaders: Record<string, string> = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers':
        'authorization, x-client-info, apikey, content-type',
};

/** Return this for preflight OPTIONS requests */
export const handleCors = (req: Request): Response | null => {
    if (req.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
    }
    return null;
};

// ─── Standard Responses ──────────────────────────────────────────────────────

/**
 * Return a successful JSON response.
 * @param data  The payload (will be wrapped in `{ data, success: true }`)
 * @param status  HTTP status code (default 200)
 */
export const jsonResponse = <T>(data: T, status = 200): Response =>
    new Response(JSON.stringify({ success: true, data }), {
        status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

/**
 * Return an error JSON response.
 * @param message  Human-readable error message
 * @param status   HTTP status code (default 500)
 * @param code     Optional machine-readable error code (e.g. 'UNAUTHORIZED')
 */
export const errorResponse = (
    message: string,
    status = 500,
    code?: string,
): Response =>
    new Response(
        JSON.stringify({
            success: false,
            error: { message, ...(code ? { code } : {}) },
        }),
        {
            status,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
    );

// ─── Auth Helpers ────────────────────────────────────────────────────────────

import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

/**
 * Create a Supabase service-role client for admin operations.
 */
export const createServiceClient = (): SupabaseClient => {
    const url = Deno.env.get('SUPABASE_URL')!;
    const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    return createClient(url, key);
};

/**
 * Verify the Authorization header and return the authenticated user.
 * Returns an error Response if auth fails, or the user object if valid.
 */
export const requireAuth = async (req: Request) => {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
        return { error: errorResponse('Missing Authorization header', 401, 'UNAUTHORIZED') };
    }

    const url = Deno.env.get('SUPABASE_URL')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    const userClient = createClient(url, anonKey, {
        global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error } = await userClient.auth.getUser();
    if (error || !user) {
        return { error: errorResponse('Invalid or expired token', 401, 'UNAUTHORIZED') };
    }

    return { user, userClient };
};

/**
 * Verify the user has one of the allowed roles.
 * Returns an error Response if the role check fails.
 */
export const requireRole = async (
    serviceClient: SupabaseClient,
    userId: string,
    allowedRoles: string[],
) => {
    const { data: roleData } = await serviceClient
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .maybeSingle();

    if (!roleData || !allowedRoles.includes(roleData.role)) {
        return {
            error: errorResponse(
                `Requires one of: ${allowedRoles.join(', ')}`,
                403,
                'FORBIDDEN',
            ),
        };
    }

    return { role: roleData.role };
};

// ─── Request Helpers ─────────────────────────────────────────────────────────

/**
 * Parse and validate required fields from the request body.
 * Returns an error Response if any field is missing.
 */
export const parseRequiredFields = async <T extends Record<string, unknown>>(
    req: Request,
    requiredFields: string[],
): Promise<{ data?: T; error?: Response }> => {
    let body: T;
    try {
        body = await req.json();
    } catch {
        return { error: errorResponse('Invalid JSON body', 400, 'BAD_REQUEST') };
    }

    const missing = requiredFields.filter(
        (field) => body[field] === undefined || body[field] === null || body[field] === '',
    );

    if (missing.length > 0) {
        return {
            error: errorResponse(
                `Missing required fields: ${missing.join(', ')}`,
                400,
                'VALIDATION_ERROR',
            ),
        };
    }

    return { data: body };
};
