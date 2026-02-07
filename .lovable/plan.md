
# Fix Remote Desktop: Use Tactical RMM "Take Control" URL

## Problem

The current "Remote Desktop" button tries to open MeshCentral (`mesh.mabdc.org`) using a `meshnode_id`, which may not always be available. The actual Tactical RMM "Take Control" feature uses a simpler, more reliable URL pattern:

```text
https://rmm.mabdc.org/takecontrol/{agent_id}
```

This URL is constructed from the RMM base URL (already configured as `TACTICALRMM_URL`) and the `agent_id` (always available for every agent).

## Changes

### 1. Update Backend Proxy (`supabase/functions/tacticalrmm-proxy/index.ts`)

- Return `rmmUrl` (the base Tactical RMM URL) alongside `meshUrl` in responses so the frontend can construct the take control link.

### 2. Update Agent Detail Sheet (`src/components/tacticalrmm/AgentDetailSheet.tsx`)

- Add a new prop `rmmUrl` for the Tactical RMM base URL.
- Replace the current MeshCentral-based "Remote Desktop" logic with:
  - **"Take Control"** button that opens `{rmmUrl}/takecontrol/{agent_id}` in a new tab. This is always available for every agent since `agent_id` is a required field.
- Keep the existing "Open MeshCentral" button as a secondary option if `meshUrl` is configured.

### 3. Update Dashboard (`src/components/tacticalrmm/TacticalRMMDashboard.tsx`)

- Capture `rmmUrl` from the proxy response and pass it to `AgentDetailSheet`.

## Files Modified

| File | Change |
|---|---|
| `supabase/functions/tacticalrmm-proxy/index.ts` | Return `rmmUrl` in API responses |
| `src/components/tacticalrmm/AgentDetailSheet.tsx` | Add "Take Control" button using `{rmmUrl}/takecontrol/{agent_id}` |
| `src/components/tacticalrmm/TacticalRMMDashboard.tsx` | Pass `rmmUrl` to the detail sheet |
