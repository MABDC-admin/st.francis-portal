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
    // Auth check
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const NOCODB_BASE_URL = Deno.env.get('NOCODB_BASE_URL');
    const NOCODB_API_TOKEN = Deno.env.get('NOCODB_API_TOKEN');

    if (!NOCODB_BASE_URL || !NOCODB_API_TOKEN) {
      return new Response(JSON.stringify({ error: 'NocoDB not configured', configured: false }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { action, path, body } = await req.json();
    const method = action || 'GET';
    const apiPath = path || '/api/v2/meta/bases';

    console.log(`NocoDB proxy: ${method} ${apiPath}`);

    const nocoResponse = await fetch(`${NOCODB_BASE_URL}${apiPath}`, {
      method,
      headers: {
        'xc-token': NOCODB_API_TOKEN,
        'Content-Type': 'application/json',
      },
      ...(body && method !== 'GET' ? { body: JSON.stringify(body) } : {}),
    });

    const data = await nocoResponse.json();

    return new Response(JSON.stringify({ data, configured: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('NocoDB proxy error:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
