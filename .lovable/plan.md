

# Omada Configuration Update

## What Changes

Update the three Omada secrets to your new credentials and modify the edge function to handle HTTPS connections with self-signed certificates.

## New Credentials to Set

| Secret | New Value |
|--------|-----------|
| `OMADA_URL` | `https://128.140.99.247:8043` (trailing slash removed) |
| `OMADA_CLIENT_ID` | `78dbd703ef9e419d82a532df196428ed` |
| `OMADA_CLIENT_SECRET` | `c7653018c44340bb864e66cf8268858d` |

## Edge Function TLS Fix

The new URL uses HTTPS on a raw IP address, which almost certainly has a self-signed certificate. Deno's `fetch` rejects self-signed certs by default. The fix is to add a custom `fetch` wrapper or use Deno's undocumented `{ client: ... }` option -- but the simplest reliable approach for Deno Deploy (which powers backend functions) is to **try HTTPS first, and if it fails with a TLS error, fall back to HTTP on the same port**, or we can use a `NODE_TLS_REJECT_UNAUTHORIZED`-style workaround.

**However**, there is no clean way to skip TLS verification in Deno Deploy. The recommended approach is:

**Option A (Recommended)**: Change the URL to HTTP if the controller supports it on that port: `http://128.140.99.247:8043`

**Option B**: If the controller only serves HTTPS, we need to confirm whether Deno Deploy's fetch can reach it. We can test this by deploying and checking logs.

## Implementation Steps

1. Update the three secrets (`OMADA_URL`, `OMADA_CLIENT_ID`, `OMADA_CLIENT_SECRET`) with the new values
2. Deploy the edge function (no code change needed if TLS works, or switch URL to HTTP)
3. Test by calling the status endpoint and checking logs

## Files to Modify

| File | Change |
|------|--------|
| Secrets only | Update 3 secrets via the secret management tool |

If TLS fails after testing:

| File | Change |
|------|--------|
| `supabase/functions/omada-proxy/index.ts` | Add error message clarifying TLS issue, or attempt HTTP fallback |

## Testing Plan

After updating secrets, we will invoke the edge function's `status` action and inspect the logs to confirm connectivity.

