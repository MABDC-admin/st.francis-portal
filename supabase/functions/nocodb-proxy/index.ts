/**
 * nocodb-proxy — Standardized with shared utilities
 *
 * Proxies authenticated requests to NocoDB API.
 */
import {
  handleCors,
  jsonResponse,
  errorResponse,
  requireAuth,
} from '../_shared/response.ts';

Deno.serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    // Auth check
    const auth = await requireAuth(req);
    if ('error' in auth) return auth.error;

    const NOCODB_BASE_URL = Deno.env.get('NOCODB_BASE_URL');
    const NOCODB_API_TOKEN = Deno.env.get('NOCODB_API_TOKEN');

    if (!NOCODB_BASE_URL || !NOCODB_API_TOKEN) {
      return jsonResponse({ configured: false }, 200);
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

    const contentType = nocoResponse.headers.get('content-type') || '';
    const responseText = await nocoResponse.text();

    if (!contentType.includes('application/json') || responseText.trim().startsWith('<!')) {
      console.error(`NocoDB returned non-JSON (status ${nocoResponse.status}):`, responseText.substring(0, 300));
      return errorResponse(
        `NocoDB returned non-JSON response (status ${nocoResponse.status}). Check your NOCODB_BASE_URL and NOCODB_API_TOKEN.`,
        502, 'PROXY_ERROR'
      );
    }

    const data = JSON.parse(responseText);
    return jsonResponse({ data, configured: true });
  } catch (error) {
    const err = error as Error;
    console.error('NocoDB proxy error:', err);
    return errorResponse(err.message || 'Internal server error', 500);
  }
});
