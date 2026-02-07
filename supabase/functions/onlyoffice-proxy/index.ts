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

    const ONLYOFFICE_URL = Deno.env.get('ONLYOFFICE_URL');
    const ONLYOFFICE_JWT_SECRET = Deno.env.get('ONLYOFFICE_JWT_SECRET');

    if (!ONLYOFFICE_URL) {
      return new Response(JSON.stringify({ error: 'OnlyOffice not configured', configured: false }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { action, documentUrl, documentTitle, documentType, callbackUrl } = await req.json();

    if (action === 'get-config') {
      // Generate document editor config
      const config = {
        document: {
          fileType: documentType || 'docx',
          title: documentTitle || 'Untitled Document',
          url: documentUrl,
          permissions: { edit: true, download: true, print: true },
        },
        editorConfig: {
          mode: 'edit',
          callbackUrl: callbackUrl || '',
          user: { id: user.id, name: user.email },
          lang: 'en',
        },
        documentServerUrl: ONLYOFFICE_URL,
      };

      // If JWT secret is set, sign the config
      if (ONLYOFFICE_JWT_SECRET) {
        // Simple JWT creation for OnlyOffice
        const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
        const payload = btoa(JSON.stringify(config));
        const encoder = new TextEncoder();
        const key = await crypto.subtle.importKey(
          'raw', encoder.encode(ONLYOFFICE_JWT_SECRET),
          { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
        );
        const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(`${header}.${payload}`));
        const signature = btoa(String.fromCharCode(...new Uint8Array(sig)))
          .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
        (config as any).token = `${header}.${payload}.${signature}`;
      }

      return new Response(JSON.stringify({ data: config, configured: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'status') {
      // Check server health
      try {
        const resp = await fetch(`${ONLYOFFICE_URL}/healthcheck`);
        const healthy = resp.ok;
        return new Response(JSON.stringify({ data: { healthy, url: ONLYOFFICE_URL }, configured: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } catch {
        return new Response(JSON.stringify({ data: { healthy: false, url: ONLYOFFICE_URL }, configured: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    return new Response(JSON.stringify({ error: 'Unknown action' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('OnlyOffice proxy error:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
