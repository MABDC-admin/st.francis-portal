import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const CANVA_CLIENT_ID = Deno.env.get('CANVA_CLIENT_ID');
const CANVA_CLIENT_SECRET = Deno.env.get('CANVA_CLIENT_SECRET');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

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
    // Refresh the token
    console.log('Refreshing Canva token...');
    
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
      // Delete invalid connection
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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    if (!CANVA_CLIENT_ID || !CANVA_CLIENT_SECRET) {
      throw new Error('Canva credentials not configured');
    }

    // Get user from auth header
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      throw new Error('Authentication required');
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error('Invalid authentication');
    }

    // Get valid access token
    const accessToken = await getValidAccessToken(supabase, user.id);

    const url = new URL(req.url);
    const endpoint = url.searchParams.get('endpoint');

    if (!endpoint) {
      throw new Error('Endpoint parameter required');
    }

    // Proxy the request to Canva API
    let canvaUrl = `${CANVA_API_BASE}${endpoint}`;
    
    // Forward query parameters (except our 'endpoint' param)
    const forwardParams = new URLSearchParams();
    url.searchParams.forEach((value, key) => {
      if (key !== 'endpoint') {
        forwardParams.set(key, value);
      }
    });
    if (forwardParams.toString()) {
      canvaUrl += `?${forwardParams.toString()}`;
    }

    const canvaOptions: RequestInit = {
      method: req.method,
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    };

    // Forward body for POST/PUT/PATCH
    if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
      const body = await req.text();
      if (body) {
        canvaOptions.body = body;
      }
    }

    console.log(`Proxying ${req.method} request to: ${canvaUrl}`);
    const canvaResponse = await fetch(canvaUrl, canvaOptions);
    
    const responseData = await canvaResponse.text();
    console.log(`Canva API response status: ${canvaResponse.status}`);

    return new Response(responseData, {
      status: canvaResponse.status,
      headers: { 
        ...corsHeaders, 
        'Content-Type': canvaResponse.headers.get('Content-Type') || 'application/json' 
      },
    });

  } catch (error) {
    console.error('Canva API proxy error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
