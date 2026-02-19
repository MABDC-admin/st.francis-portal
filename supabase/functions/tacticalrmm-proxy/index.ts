/**
 * tacticalrmm-proxy — Standardized with shared utilities
 *
 * Proxies authenticated requests to Tactical RMM API.
 * Supports status checks, agent listing, and MeshCentral take-control.
 */
import {
  handleCors,
  jsonResponse,
  errorResponse,
  requireAuth,
} from '../_shared/response.ts';

Deno.serve(async (req): Promise<Response> => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const auth = await requireAuth(req);
    if ('error' in auth) return auth.error;

    const TACTICALRMM_URL = Deno.env.get('TACTICALRMM_URL');
    const TACTICALRMM_API_KEY = Deno.env.get('TACTICALRMM_API_KEY');
    const TACTICALRMM_MESH_URL = Deno.env.get('TACTICALRMM_MESH_URL');
    const TACTICALRMM_WEB_URL = Deno.env.get('TACTICALRMM_WEB_URL');

    if (!TACTICALRMM_URL || !TACTICALRMM_API_KEY) {
      return jsonResponse({ configured: false }, 200);
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
        return jsonResponse({
          data: { healthy: resp.ok },
          configured: true,
          meshUrl: TACTICALRMM_MESH_URL || null,
          rmmUrl: TACTICALRMM_WEB_URL || null,
        });
      } catch {
        return jsonResponse({ data: { healthy: false }, configured: true });
      }
    }

    // Take Control — get authenticated MeshCentral URL
    if (action === 'takecontrol') {
      const agentId = path?.replace('/agents/', '').replace('/meshcentral/', '').replace(/\//g, '');
      if (!agentId) {
        return errorResponse('Agent ID required', 400, 'MISSING_AGENT_ID');
      }

      console.log(`TacticalRMM takecontrol: fetching MeshCentral URL for agent ${agentId}`);
      try {
        const resp = await fetch(`${TACTICALRMM_URL}/agents/${agentId}/meshcentral/`, {
          headers: { 'X-API-KEY': TACTICALRMM_API_KEY, 'Content-Type': 'application/json' },
        });
        const contentType = resp.headers.get('content-type') || '';
        const text = await resp.text();

        if (!contentType.includes('application/json') || text.trim().startsWith('<!')) {
          console.error(`TacticalRMM meshcentral returned non-JSON (status ${resp.status}):`, text.substring(0, 300));
          return errorResponse(`Failed to get MeshCentral URL (status ${resp.status})`, 502, 'PROXY_ERROR');
        }

        const meshData = JSON.parse(text);
        console.log(`TacticalRMM takecontrol: got control URL for ${meshData.hostname || agentId}`);
        return jsonResponse({ data: meshData, configured: true });
      } catch (e) {
        const err = e as Error;
        console.error('TacticalRMM takecontrol error:', err);
        return errorResponse(err.message || 'Take control failed', 500);
      }
    }

    // General proxy
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
      return errorResponse(
        `TacticalRMM returned non-JSON response (status ${rmmResp.status}). Check your TACTICALRMM_URL and TACTICALRMM_API_KEY.`,
        502, 'PROXY_ERROR'
      );
    }

    const data = JSON.parse(responseText);
    return jsonResponse({
      data,
      configured: true,
      meshUrl: TACTICALRMM_MESH_URL || null,
      rmmUrl: TACTICALRMM_WEB_URL || null,
    });
  } catch (error) {
    const err = error as Error;
    console.error('TacticalRMM proxy error:', err);
    return errorResponse(err.message || 'Internal server error', 500);
  }
});
