// @ts-nocheck
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

let cachedToken: { token: string; expires: number } | null = null;
let cachedOmadacId: string | null = null;

function httpFallbackUrl(baseUrl: string): string | null {
  try {
    const u = new URL(baseUrl);
    if (u.protocol === 'https:') {
      u.protocol = 'http:';
      return u.toString().replace(/\/$/, '');
    }
  } catch { /* ignore */ }
  return null;
}

async function fetchWithTlsFallback(fullUrl: string, options?: RequestInit): Promise<Response> {
  try {
    return await fetch(fullUrl, options);
  } catch (err: any) {
    const msg = String(err?.message || err);
    if (msg.includes('UnknownIssuer') || msg.includes('certificate') || msg.includes('TLS') || msg.includes('SSL')) {
      const parsed = new URL(fullUrl);
      parsed.protocol = 'http:';
      const httpUrl = parsed.toString();
      console.log('TLS failed, falling back to HTTP:', httpUrl);
      return await fetch(httpUrl, options);
    }
    throw err;
  }
}

async function getOmadacId(url: string): Promise<string> {
  if (cachedOmadacId) return cachedOmadacId;
  
  const resp = await fetchWithTlsFallback(`${url}/api/info`);
  const text = await resp.text();
  console.log('Omada /api/info response:', text);
  
  if (text.trim().startsWith('<!DOCTYPE') || text.trim().startsWith('<html')) {
    throw new Error('Omada controller returned HTML instead of JSON. Check the URL.');
  }
  
  const data = JSON.parse(text);
  if (data.errorCode !== 0) throw new Error(data.msg || 'Failed to get controller info');
  
  cachedOmadacId = data.result.omadacId;
  console.log('Got omadacId:', cachedOmadacId);
  return cachedOmadacId!;
}

async function getOmadaToken(url: string, clientId: string, clientSecret: string): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expires) return cachedToken.token;

  const omadacId = await getOmadacId(url);
  
  const tokenUrl = `${url}/openapi/authorize/token?grant_type=client_credentials&omadac_id=${omadacId}`;
  const requestBody = { client_id: clientId, client_secret: clientSecret };
  console.log('Requesting token from:', tokenUrl);
  
  const resp = await fetchWithTlsFallback(tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestBody),
  });
  
  const text = await resp.text();
  console.log('Omada token response:', text);
  
  if (text.trim().startsWith('<!DOCTYPE') || text.trim().startsWith('<html')) {
    throw new Error('Omada controller returned HTML for token request. Check the URL/port.');
  }
  
  const data = JSON.parse(text);
  if (data.errorCode !== 0) throw new Error(data.msg || 'Omada auth failed');
  
  cachedToken = { token: data.result.accessToken, expires: Date.now() + (data.result.expiresIn - 60) * 1000 };
  return cachedToken.token;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const OMADA_URL = (Deno.env.get('OMADA_URL') || '').replace(/\/$/, '');
    const OMADA_CLIENT_ID = Deno.env.get('OMADA_CLIENT_ID');
    const OMADA_CLIENT_SECRET = Deno.env.get('OMADA_CLIENT_SECRET');

    if (!OMADA_URL || !OMADA_CLIENT_ID || !OMADA_CLIENT_SECRET) {
      return new Response(JSON.stringify({ error: 'Omada not configured', configured: false }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { action, path } = await req.json();

    if (action === 'status') {
      try {
        const token = await getOmadaToken(OMADA_URL, OMADA_CLIENT_ID, OMADA_CLIENT_SECRET);
        return new Response(JSON.stringify({ data: { healthy: true, authenticated: !!token }, configured: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } catch (e) {
        console.error('Omada status check failed:', e);
        return new Response(JSON.stringify({ data: { healthy: false, error: e.message }, configured: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    if (action === 'proxy') {
      const token = await getOmadaToken(OMADA_URL, OMADA_CLIENT_ID, OMADA_CLIENT_SECRET);
      const apiPath = path || '/openapi/v1/sites';
      const resp = await fetchWithTlsFallback(`${OMADA_URL}${apiPath}`, {
        headers: { Authorization: `AccessToken=${token}`, 'Content-Type': 'application/json' },
      });
      const data = await resp.json();
      return new Response(JSON.stringify({ data, configured: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Unknown action' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('Omada proxy error:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
