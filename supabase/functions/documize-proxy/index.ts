/**
 * documize-proxy — Standardized with shared utilities
 *
 * Proxies authenticated requests to Documize knowledge base API.
 * Supports API key or username/password auth with token caching.
 */
import {
  handleCors,
  jsonResponse,
  errorResponse,
  requireAuth,
} from '../_shared/response.ts';

// ─── Documize-specific auth helper (preserved) ──────────────────────────────

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

// ─── Handler ─────────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const auth = await requireAuth(req);
    if ('error' in auth) return auth.error;

    const DOCUMIZE_URL = Deno.env.get('DOCUMIZE_URL');
    if (!DOCUMIZE_URL) {
      return jsonResponse({ configured: false }, 200);
    }

    const { action, path, query } = await req.json();

    // Status check
    if (action === 'status') {
      try {
        const resp = await fetch(`${DOCUMIZE_URL}/api/public/meta`);
        return jsonResponse({ data: { healthy: resp.ok, url: DOCUMIZE_URL }, configured: true });
      } catch {
        return jsonResponse({ data: { healthy: false, url: DOCUMIZE_URL }, configured: true });
      }
    }

    // Proxy request
    const token = await getDocumizeAuth(DOCUMIZE_URL);
    const apiPath = path || '/api/space';
    const url = query ? `${DOCUMIZE_URL}${apiPath}?${new URLSearchParams(query)}` : `${DOCUMIZE_URL}${apiPath}`;

    const resp = await fetch(url, {
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    });
    const data = await resp.json();

    return jsonResponse({ data, configured: true });
  } catch (error) {
    const err = error as Error;
    console.error('Documize proxy error:', err);
    return errorResponse(err.message || 'Internal server error', 500);
  }
});
