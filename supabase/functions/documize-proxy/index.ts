import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

let cachedDocumizeToken: { token: string; expires: number } | null = null;

async function getDocumizeAuth(url: string): Promise<string> {
  const apiKey = Deno.env.get('DOCUMIZE_API_KEY');
  if (apiKey) return apiKey;

  if (cachedDocumizeToken && Date.now() < cachedDocumizeToken.expires) return cachedDocumizeToken.token;

  const username = Deno.env.get('DOCUMIZE_USERNAME');
  const password = Deno.env.get('DOCUMIZE_PASSWORD');
  if (!username || !password) throw new Error('No Documize credentials configured');

  const resp = await fetch(`${url}/api/public/authenticate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`,
  });
  if (!resp.ok) throw new Error('Documize auth failed');
  const token = resp.headers.get('Janus') || '';
  cachedDocumizeToken = { token, expires: Date.now() + 3500 * 1000 };
  return token;
}

serve(async (req) => {
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

    const DOCUMIZE_URL = Deno.env.get('DOCUMIZE_URL');
    if (!DOCUMIZE_URL) {
      return new Response(JSON.stringify({ error: 'Documize not configured', configured: false }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { action, path, query } = await req.json();

    if (action === 'status') {
      try {
        const resp = await fetch(`${DOCUMIZE_URL}/api/public/meta`);
        return new Response(JSON.stringify({ data: { healthy: resp.ok, url: DOCUMIZE_URL }, configured: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } catch {
        return new Response(JSON.stringify({ data: { healthy: false, url: DOCUMIZE_URL }, configured: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    const token = await getDocumizeAuth(DOCUMIZE_URL);
    const apiPath = path || '/api/space';
    const url = query ? `${DOCUMIZE_URL}${apiPath}?${new URLSearchParams(query)}` : `${DOCUMIZE_URL}${apiPath}`;

    const resp = await fetch(url, {
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    });
    const data = await resp.json();

    return new Response(JSON.stringify({ data, configured: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Documize proxy error:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
