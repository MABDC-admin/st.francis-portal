/**
 * canva-api — Standardized with shared utilities
 *
 * Proxies authenticated requests to Canva API, handling token refresh automatically.
 */
import {
  handleCors,
  jsonResponse,
  errorResponse,
  createServiceClient,
  requireAuth,
} from '../_shared/response.ts';

const CANVA_API_BASE = 'https://api.canva.com/rest/v1';

async function getValidAccessToken(supabase: any, userId: string): Promise<string> {
  const { data: connection, error } = await supabase
    .from('canva_connections')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error || !connection) {
    throw new Error('No Canva connection found. Please connect your Canva account.');
  }

  // Check if token is expired or about to expire (5 min buffer)
  const expiresAt = new Date(connection.token_expires_at);
  const now = new Date();
  const fiveMinutes = 5 * 60 * 1000;

  if (expiresAt.getTime() - now.getTime() < fiveMinutes) {
    console.log('Refreshing Canva token...');
    const CANVA_CLIENT_ID = Deno.env.get('CANVA_CLIENT_ID');
    const CANVA_CLIENT_SECRET = Deno.env.get('CANVA_CLIENT_SECRET');

    const tokenResponse = await fetch('https://api.canva.com/rest/v1/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${btoa(`${CANVA_CLIENT_ID}:${CANVA_CLIENT_SECRET}`)}`,
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: connection.refresh_token,
      }),
    });

    if (!tokenResponse.ok) {
      await supabase.from('canva_connections').delete().eq('user_id', userId);
      throw new Error('Token expired. Please reconnect your Canva account.');
    }

    const tokens = await tokenResponse.json();
    const newExpiresAt = new Date(Date.now() + tokens.expires_in * 1000);

    await supabase
      .from('canva_connections')
      .update({
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token || connection.refresh_token,
        token_expires_at: newExpiresAt.toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId);

    return tokens.access_token;
  }

  return connection.access_token;
}

Deno.serve(async (req): Promise<Response> => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const CANVA_CLIENT_ID = Deno.env.get('CANVA_CLIENT_ID');
    const CANVA_CLIENT_SECRET = Deno.env.get('CANVA_CLIENT_SECRET');

    if (!CANVA_CLIENT_ID || !CANVA_CLIENT_SECRET) {
      return errorResponse('Canva credentials not configured', 500, 'CONFIG_ERROR');
    }

    const auth = await requireAuth(req);
    if ('error' in auth) return auth.error;

    const supabase = createServiceClient();
    const accessToken = await getValidAccessToken(supabase, auth.user.id);

    const url = new URL(req.url);
    const endpoint = url.searchParams.get('endpoint');

    if (!endpoint) {
      return errorResponse('Endpoint parameter required', 400, 'MISSING_ENDPOINT');
    }

    let canvaUrl = `${CANVA_API_BASE}${endpoint}`;
    const forwardParams = new URLSearchParams();
    url.searchParams.forEach((value, key) => {
      if (key !== 'endpoint') forwardParams.set(key, value);
    });
    if (forwardParams.toString()) canvaUrl += `?${forwardParams.toString()}`;

    const canvaOptions: RequestInit = {
      method: req.method,
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    };

    if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
      const body = await req.text();
      if (body) canvaOptions.body = body;
    }

    console.log(`Proxying ${req.method} request to: ${canvaUrl}`);
    const canvaResponse = await fetch(canvaUrl, canvaOptions);
    const responseData = await canvaResponse.text();
    console.log(`Canva API response status: ${canvaResponse.status}`);

    // Return canva response directly but with our CORS headers
    return new Response(responseData, {
      status: canvaResponse.status,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        'Content-Type': canvaResponse.headers.get('Content-Type') || 'application/json'
      },
    });

  } catch (error) {
    const err = error as Error;
    console.error('Canva API proxy error:', err);
    return errorResponse(err.message || 'Unknown error', 400);
  }
});
