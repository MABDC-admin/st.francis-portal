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

// Base64URL encode for PKCE (RFC 4648)
function base64URLEncode(buffer: Uint8Array): string {
  return btoa(String.fromCharCode(...buffer))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

// Generate code verifier for PKCE (96 bytes as per Canva example)
function generateCodeVerifier(): string {
  const array = new Uint8Array(96);
  crypto.getRandomValues(array);
  return base64URLEncode(array);
}

// Generate code challenge from verifier (SHA-256 hash, base64url encoded)
async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return base64URLEncode(new Uint8Array(digest));
}

// Generate high-entropy state key
function generateStateKey(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return base64URLEncode(array);
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    if (!CANVA_CLIENT_ID || !CANVA_CLIENT_SECRET) {
      throw new Error('Canva credentials not configured');
    }

    const url = new URL(req.url);
    const action = url.searchParams.get('action');

    // Get user from auth header
    const authHeader = req.headers.get('authorization');
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    let userId: string | null = null;
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user }, error } = await supabase.auth.getUser(token);
      if (!error && user) {
        userId = user.id;
      }
    }

    // ACTION: authorize - Start OAuth flow
    if (action === 'authorize') {
      if (!userId) {
        throw new Error('Authentication required');
      }

      const redirectUri = url.searchParams.get('redirect_uri');
      if (!redirectUri) {
        throw new Error('redirect_uri is required');
      }

      // Generate PKCE values (96 bytes for code_verifier as per Canva docs)
      const codeVerifier = generateCodeVerifier();
      const codeChallenge = await generateCodeChallenge(codeVerifier);
      
      // Generate high-entropy state key (NOT storing code_verifier in state)
      const stateKey = generateStateKey();

      // Store code_verifier securely in database (not in URL/state)
      const { error: insertError } = await supabase
        .from('canva_oauth_states')
        .insert({
          state_key: stateKey,
          user_id: userId,
          code_verifier: codeVerifier,
          redirect_uri: redirectUri,
        });

      if (insertError) {
        console.error('Failed to store OAuth state:', insertError);
        throw new Error('Failed to initialize OAuth flow');
      }

      // Build Canva authorization URL per Canva's specification
      const canvaAuthUrl = new URL('https://www.canva.com/api/oauth/authorize');
      canvaAuthUrl.searchParams.set('code_challenge_method', 'S256'); // Must be uppercase S256
      canvaAuthUrl.searchParams.set('response_type', 'code');
      canvaAuthUrl.searchParams.set('client_id', CANVA_CLIENT_ID);
      canvaAuthUrl.searchParams.set('redirect_uri', redirectUri);
      canvaAuthUrl.searchParams.set('code_challenge', codeChallenge);
      canvaAuthUrl.searchParams.set('scope', 'design:content:read design:meta:read design:content:write folder:read asset:read asset:write profile:read');
      canvaAuthUrl.searchParams.set('state', stateKey); // Only the state key, not sensitive data

      console.log('Generated auth URL with state:', stateKey);

      return new Response(JSON.stringify({
        authUrl: canvaAuthUrl.toString(),
        state: stateKey
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ACTION: callback - Handle OAuth callback
    if (action === 'callback') {
      const code = url.searchParams.get('code');
      const state = url.searchParams.get('state');

      if (!code || !state) {
        throw new Error('Missing code or state parameter');
      }

      // Retrieve code_verifier from database using state key
      const { data: stateData, error: fetchError } = await supabase
        .from('canva_oauth_states')
        .select('*')
        .eq('state_key', state)
        .single();

      if (fetchError || !stateData) {
        console.error('Failed to retrieve OAuth state:', fetchError);
        throw new Error('Invalid or expired state parameter');
      }

      // Check if state has expired
      if (new Date(stateData.expires_at) < new Date()) {
        // Clean up expired state
        await supabase.from('canva_oauth_states').delete().eq('state_key', state);
        throw new Error('OAuth state has expired. Please try again.');
      }

      const { user_id: stateUserId, code_verifier: codeVerifier, redirect_uri: redirectUri } = stateData;

      // Delete the state record (one-time use)
      await supabase.from('canva_oauth_states').delete().eq('state_key', state);

      console.log('Exchanging code for tokens with verifier length:', codeVerifier.length);

      // Exchange code for tokens
      const tokenResponse = await fetch('https://api.canva.com/rest/v1/oauth/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${btoa(`${CANVA_CLIENT_ID}:${CANVA_CLIENT_SECRET}`)}`,
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code,
          redirect_uri: redirectUri,
          code_verifier: codeVerifier,
        }),
      });

      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text();
        console.error('Token exchange failed:', errorText);
        throw new Error(`Token exchange failed: ${tokenResponse.status}`);
      }

      const tokens = await tokenResponse.json();

      // Get user profile from Canva
      let canvaUserId = null;
      try {
        const profileResponse = await fetch('https://api.canva.com/rest/v1/users/me', {
          headers: {
            'Authorization': `Bearer ${tokens.access_token}`,
          },
        });
        if (profileResponse.ok) {
          const profile = await profileResponse.json();
          canvaUserId = profile.user?.id;
        }
      } catch (e) {
        console.log('Could not fetch Canva profile:', e);
      }

      // Store tokens in database
      const expiresAt = new Date(Date.now() + tokens.expires_in * 1000);
      
      const { error: upsertError } = await supabase
        .from('canva_connections')
        .upsert({
          user_id: stateUserId,
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          token_expires_at: expiresAt.toISOString(),
          canva_user_id: canvaUserId,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id'
        });

      if (upsertError) {
        console.error('Failed to store tokens:', upsertError);
        throw new Error('Failed to store connection');
      }

      return new Response(JSON.stringify({ 
        success: true,
        message: 'Canva account connected successfully'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ACTION: refresh - Refresh access token
    if (action === 'refresh' && req.method === 'POST') {
      if (!userId) {
        throw new Error('Authentication required');
      }

      // Get current tokens
      const { data: connection, error: fetchError } = await supabase
        .from('canva_connections')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (fetchError || !connection) {
        throw new Error('No Canva connection found');
      }

      // Refresh the token
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
        // Token might be invalid, delete the connection
        await supabase.from('canva_connections').delete().eq('user_id', userId);
        throw new Error('Token refresh failed - please reconnect');
      }

      const tokens = await tokenResponse.json();
      const expiresAt = new Date(Date.now() + tokens.expires_in * 1000);

      // Update tokens
      await supabase
        .from('canva_connections')
        .update({
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token || connection.refresh_token,
          token_expires_at: expiresAt.toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId);

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ACTION: status - Check connection status
    if (action === 'status') {
      if (!userId) {
        return new Response(JSON.stringify({ connected: false }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { data: connection } = await supabase
        .from('canva_connections')
        .select('canva_user_id, token_expires_at')
        .eq('user_id', userId)
        .single();

      const isExpired = connection?.token_expires_at 
        ? new Date(connection.token_expires_at) < new Date() 
        : true;

      return new Response(JSON.stringify({ 
        connected: !!connection,
        canvaUserId: connection?.canva_user_id,
        needsRefresh: isExpired
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ACTION: disconnect - Remove Canva connection
    if (req.method === 'DELETE') {
      if (!userId) {
        throw new Error('Authentication required');
      }

      await supabase
        .from('canva_connections')
        .delete()
        .eq('user_id', userId);

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    throw new Error('Invalid action');
  } catch (error) {
    console.error('Canva auth error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
