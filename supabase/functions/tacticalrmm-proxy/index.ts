import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

    const TACTICALRMM_URL = Deno.env.get('TACTICALRMM_URL');
    const TACTICALRMM_API_KEY = Deno.env.get('TACTICALRMM_API_KEY');
    const TACTICALRMM_MESH_URL = Deno.env.get('TACTICALRMM_MESH_URL');

    if (!TACTICALRMM_URL || !TACTICALRMM_API_KEY) {
      return new Response(JSON.stringify({ error: 'Tactical RMM not configured', configured: false }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { action, path, method: reqMethod, body: reqBody } = await req.json();
    const apiPath = path || '/agents/';
    const httpMethod = (reqMethod || 'GET').toUpperCase();

    console.log(`TacticalRMM proxy: action=${action} method=${httpMethod} path=${apiPath}`);

    // Status check
    if (action === 'status') {
      try {
        const resp = await fetch(`${TACTICALRMM_URL}/agents/`, {
          headers: { 'X-API-KEY': TACTICALRMM_API_KEY, 'Content-Type': 'application/json' },
        });
        return new Response(JSON.stringify({ data: { healthy: resp.ok }, configured: true, meshUrl: TACTICALRMM_MESH_URL || null, rmmUrl: TACTICALRMM_URL }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } catch {
        return new Response(JSON.stringify({ data: { healthy: false }, configured: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // Build fetch options
    const fetchOptions: RequestInit = {
      method: httpMethod,
      headers: { 'X-API-KEY': TACTICALRMM_API_KEY, 'Content-Type': 'application/json' },
    };

    if (httpMethod !== 'GET' && reqBody) {
      fetchOptions.body = JSON.stringify(reqBody);
    }

    const rmmResp = await fetch(`${TACTICALRMM_URL}${apiPath}`, fetchOptions);

    const contentType = rmmResp.headers.get('content-type') || '';
    const responseText = await rmmResp.text();

    if (!contentType.includes('application/json') || responseText.trim().startsWith('<!')) {
      console.error(`TacticalRMM returned non-JSON (status ${rmmResp.status}):`, responseText.substring(0, 300));
      return new Response(JSON.stringify({ error: `TacticalRMM returned non-JSON response (status ${rmmResp.status}). Check your TACTICALRMM_URL and TACTICALRMM_API_KEY.`, configured: true }), {
        status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = JSON.parse(responseText);

    return new Response(JSON.stringify({ data, configured: true, meshUrl: TACTICALRMM_MESH_URL || null, rmmUrl: TACTICALRMM_URL }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('TacticalRMM proxy error:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
