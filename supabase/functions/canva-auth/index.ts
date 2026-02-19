/**
 * canva-auth — Standardized with shared utilities
 *
 * Handles Canva OAuth flow: authorize, callback, refresh, disconnect.
 * Uses PKCE for security.
 */
import {
  handleCors,
  jsonResponse,
  errorResponse,
  createServiceClient,
  requireAuth,
} from '../_shared/response.ts';

// ─── PKCE Helpers ────────────────────────────────────────────────────────────

function base64URLEncode(buffer: Uint8Array): string {
  return btoa(String.fromCharCode(...buffer))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function generateCodeVerifier(): string {
  const array = new Uint8Array(96);
  crypto.getRandomValues(array);
  return base64URLEncode(array);
}

async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return base64URLEncode(new Uint8Array(digest));
}

function generateStateKey(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return base64URLEncode(array);
}

// ─── Handler ─────────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const CANVA_CLIENT_ID = Deno.env.get('CANVA_CLIENT_ID');
    const CANVA_CLIENT_SECRET = Deno.env.get('CANVA_CLIENT_SECRET');

    if (!CANVA_CLIENT_ID || !CANVA_CLIENT_SECRET) {
      return errorResponse('Canva credentials not configured', 500, 'CONFIG_ERROR');
    }

    const url = new URL(req.url);
    const action = url.searchParams.get('action');
    const supabase = createServiceClient();

    // ─── ACTION: authorize ───────────────────────────────────────────────────
    if (action === 'authorize') {
      const auth = await requireAuth(req);
      if ('error' in auth) return auth.error;
      const userId = auth.user.id;

      const redirectUri = url.searchParams.get('redirect_uri');
      if (!redirectUri) return errorResponse('redirect_uri is required', 400);

      const codeVerifier = generateCodeVerifier();
      const codeChallenge = await generateCodeChallenge(codeVerifier);
      const stateKey = generateStateKey();

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
        return errorResponse('Failed to initialize OAuth flow', 500);
      }

      const canvaAuthUrl = new URL('https://www.canva.com/api/oauth/authorize');
      canvaAuthUrl.searchParams.set('code_challenge_method', 'S256');
      canvaAuthUrl.searchParams.set('response_type', 'code');
      canvaAuthUrl.searchParams.set('client_id', CANVA_CLIENT_ID);
      canvaAuthUrl.searchParams.set('redirect_uri', redirectUri);
      canvaAuthUrl.searchParams.set('code_challenge', codeChallenge);
      canvaAuthUrl.searchParams.set('scope', 'design:content:read design:content:write design:meta:read profile:read');
      canvaAuthUrl.searchParams.set('state', stateKey);

      return jsonResponse({
        authUrl: canvaAuthUrl.toString(),
        state: stateKey
      });
    }

    // ─── ACTION: callback ────────────────────────────────────────────────────
    if (action === 'callback') {
      const code = url.searchParams.get('code');
      const state = url.searchParams.get('state');

      if (!code || !state) return errorResponse('Missing code or state parameter', 400);

      const { data: stateData, error: fetchError } = await supabase
        .from('canva_oauth_states')
        .select('*')
        .eq('state_key', state)
        .single();

      if (fetchError || !stateData) return errorResponse('Invalid or expired state parameter', 400);

      if (new Date(stateData.expires_at) < new Date()) {
        await supabase.from('canva_oauth_states').delete().eq('state_key', state);
        return errorResponse('OAuth state has expired. Please try again.', 400);
      }

      const { user_id: stateUserId, code_verifier: codeVerifier, redirect_uri: redirectUri } = stateData;
      await supabase.from('canva_oauth_states').delete().eq('state_key', state);

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
        return errorResponse(`Token exchange failed: ${tokenResponse.status}`, 400);
      }

      const tokens = await tokenResponse.json();

      let canvaUserId = null;
      try {
        const profileResponse = await fetch('https://api.canva.com/rest/v1/users/me', {
          headers: { 'Authorization': `Bearer ${tokens.access_token}` },
        });
        if (profileResponse.ok) {
          const profile = await profileResponse.json();
          canvaUserId = profile.user?.id;
        }
      } catch (e) {
        console.log('Could not fetch Canva profile:', e);
      }

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
        }, { onConflict: 'user_id' });

      if (upsertError) {
        console.error('Failed to store tokens:', upsertError);
        return errorResponse('Failed to store connection', 500);
      }

      return jsonResponse({ success: true, message: 'Canva account connected successfully' });
    }

    // ─── ACTION: refresh ─────────────────────────────────────────────────────
    if (action === 'refresh' && req.method === 'POST') {
      const auth = await requireAuth(req);
      if ('error' in auth) return auth.error;
      const userId = auth.user.id;

      const { data: connection, error: fetchError } = await supabase
        .from('canva_connections')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (fetchError || !connection) return errorResponse('No Canva connection found', 404);

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
        return errorResponse('Token refresh failed - please reconnect', 400);
      }

      const tokens = await tokenResponse.json();
      const expiresAt = new Date(Date.now() + tokens.expires_in * 1000);

      await supabase
        .from('canva_connections')
        .update({
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token || connection.refresh_token,
          token_expires_at: expiresAt.toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId);

      return jsonResponse({ success: true });
    }

    // ─── ACTION: status ──────────────────────────────────────────────────────
    if (action === 'status') {
      const authHeader = req.headers.get('authorization');
      let userId = null;
      if (authHeader) {
        const token = authHeader.replace('Bearer ', '');
        const { data: { user } } = await supabase.auth.getUser(token);
        if (user) userId = user.id;
      }

      if (!userId) return jsonResponse({ connected: false });

      const { data: connection } = await supabase
        .from('canva_connections')
        .select('canva_user_id, token_expires_at')
        .eq('user_id', userId)
        .single();

      const isExpired = connection?.token_expires_at
        ? new Date(connection.token_expires_at) < new Date()
        : true;

      return jsonResponse({
        connected: !!connection,
        canvaUserId: connection?.canva_user_id,
        needsRefresh: isExpired
      });
    }

    // ─── ACTION: disconnect ──────────────────────────────────────────────────
    if (req.method === 'DELETE') {
      const auth = await requireAuth(req);
      if ('error' in auth) return auth.error;
      const userId = auth.user.id;

      await supabase.from('canva_connections').delete().eq('user_id', userId);
      return jsonResponse({ success: true });
    }

    return errorResponse('Invalid action', 400);
  } catch (error) {
    const err = error as Error;
    console.error('Canva auth error:', err);
    return errorResponse(err.message || 'Unknown error', 400);
  }
});
