/**
 * sync-students — Standardized with shared utilities
 *
 * Fetches students with rate limiting and API key authentication.
 */
import {
  handleCors,
  jsonResponse,
  errorResponse,
  createServiceClient,
} from '../_shared/response.ts';

// Simple in-memory rate limiter
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 100;
const RATE_WINDOW = 60 * 1000;

function checkRateLimit(ip: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_WINDOW });
    return { allowed: true, remaining: RATE_LIMIT - 1 };
  }

  if (record.count >= RATE_LIMIT) {
    return { allowed: false, remaining: 0 };
  }

  record.count++;
  return { allowed: true, remaining: RATE_LIMIT - record.count };
}

function getClientIP(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return req.headers.get('x-real-ip') || 'unknown';
}

Deno.serve(async (req) => {
  const corsResponse = handleCors(req, {
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key'
  });
  if (corsResponse) return corsResponse;

  const clientIP = getClientIP(req);
  const rateLimit = checkRateLimit(clientIP);

  if (!rateLimit.allowed) {
    return new Response(
      JSON.stringify({ success: false, error: 'Rate limit exceeded' }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'X-RateLimit-Limit': RATE_LIMIT.toString(),
          'X-RateLimit-Remaining': '0',
        }
      }
    );
  }

  try {
    const apiKey = req.headers.get('x-api-key');
    const expectedApiKey = Deno.env.get('SYNC_API_KEY');

    if (!apiKey || apiKey !== expectedApiKey) {
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized: Invalid API key' }),
        {
          status: 401,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'X-RateLimit-Remaining': rateLimit.remaining.toString(),
          }
        }
      );
    }

    let school: string | null = null;
    if (req.method === 'POST') {
      try {
        const body = await req.json();
        school = body.school || null;
      } catch {
        // No body
      }
    }

    const supabase = createServiceClient();
    let query = supabase.from('students').select('*'); // Select all fields
    if (school) query = query.eq('school', school);

    const { data: students, error } = await query;

    if (error) {
      return errorResponse('Failed to fetch students', 500);
    }

    return new Response(
      JSON.stringify({
        success: true,
        count: students?.length || 0,
        students: students || [],
        synced_at: new Date().toISOString()
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'X-RateLimit-Remaining': rateLimit.remaining.toString(),
        }
      }
    );

  } catch (error) {
    const err = error as Error;
    return errorResponse(err.message || 'Internal server error', 500);
  }
});
