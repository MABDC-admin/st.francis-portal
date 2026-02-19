/**
 * omada-proxy — Standardized with shared utilities
 *
 * Proxies authenticated requests to Omada SDN controller API.
 * Includes TLS fallback and token caching.
 */
import {
  handleCors,
  jsonResponse,
  errorResponse,
  requireAuth,
} from '../_shared/response.ts';

// ─── Omada-specific helpers (preserved) ──────────────────────────────────────

let cachedToken: { token: string; expires: number } | null = null;
let cachedOmadacId: string | null = null;

async function fetchWithTlsFallback(fullUrl: string, options?: RequestInit): Promise<Response> {
  try {
    return await fetch(fullUrl, options);
  } catch (err: any) {
    const msg = String(err?.message || err);
    if (msg.includes('UnknownIssuer') || msg.includes('certificate') || msg.includes('TLS') || msg.includes('SSL')) {
      const parsed = new URL(fullUrl);
      parsed.protocol = 'http:';
      console.log('TLS failed, falling back to HTTP:', parsed.toString());
      return await fetch(parsed.toString(), options);
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

  console.log('Requesting token from:', tokenUrl);

  const resp = await fetchWithTlsFallback(tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ client_id: clientId, client_secret: clientSecret }),
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

// ─── Handler ─────────────────────────────────────────────────────────────────

Deno.serve(async (req): Promise<Response> => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const auth = await requireAuth(req);
    if ('error' in auth) return auth.error;

    const OMADA_URL = (Deno.env.get('OMADA_URL') || '').replace(/\/$/, '');
    const OMADA_CLIENT_ID = Deno.env.get('OMADA_CLIENT_ID');
    const OMADA_CLIENT_SECRET = Deno.env.get('OMADA_CLIENT_SECRET');

    if (!OMADA_URL || !OMADA_CLIENT_ID || !OMADA_CLIENT_SECRET) {
      return jsonResponse({ configured: false }, 200);
    }

    const { action, path } = await req.json();

    if (action === 'status') {
      try {
        const token = await getOmadaToken(OMADA_URL, OMADA_CLIENT_ID, OMADA_CLIENT_SECRET);
        return jsonResponse({ data: { healthy: true, authenticated: !!token }, configured: true });
      } catch (e: any) {
        console.error('Omada status check failed:', e);
        return jsonResponse({ data: { healthy: false, error: e.message }, configured: true });
      }
    }

    if (action === 'proxy') {
      const token = await getOmadaToken(OMADA_URL, OMADA_CLIENT_ID, OMADA_CLIENT_SECRET);
      const apiPath = path || '/openapi/v1/sites';
      const resp = await fetchWithTlsFallback(`${OMADA_URL}${apiPath}`, {
        headers: { Authorization: `AccessToken=${token}`, 'Content-Type': 'application/json' },
      });
      const data = await resp.json();
      return jsonResponse({ data, configured: true });
    }

    return errorResponse('Unknown action', 400, 'INVALID_ACTION');
  } catch (error: any) {
    console.error('Omada proxy error:', error);
    return errorResponse(error.message || 'Internal server error', 500);
  }
});
