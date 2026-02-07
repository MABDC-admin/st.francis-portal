

# Fix Omada Authentication Request Body

## Problem
The `omada-proxy` edge function is sending the wrong field names in the token request body.

**Current (incorrect):**
```json
{ "omadacId": "...", "secret": "..." }
```

**Required by Omada Client Credentials mode:**
```json
{ "client_id": "...", "client_secret": "..." }
```

This is why the controller returns "The Client Id Or Client Secret is Invalid" -- it cannot find the credentials under the wrong field names.

## Fix
Update `supabase/functions/omada-proxy/index.ts` line 17: change the `getOmadaToken` function body from `{ omadacId, secret }` to `{ client_id, client_secret }`.

## Technical Details

In `supabase/functions/omada-proxy/index.ts`, the `getOmadaToken` function (line 14-23) will be updated:

- Change `body: JSON.stringify({ omadacId: clientId, secret: clientSecret })` to `body: JSON.stringify({ client_id: clientId, client_secret: clientSecret })`

No other changes needed. After this fix, the proxy should authenticate successfully and the Omada dashboard will display controller data.

