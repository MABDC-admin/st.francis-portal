

# Fix NocoDB Proxy HTML Response Error

## Problem

The NocoDB backend function crashes because it blindly calls `.json()` on the response from your NocoDB instance. Your NocoDB server is returning an HTML page (likely a login/redirect page) instead of JSON, which means either:
- The base URL needs adjusting (e.g., trailing slash issue or wrong port)
- The API token is not being accepted

## Solution

Add response validation before parsing JSON, matching the pattern already used in the TacticalRMM proxy in this project.

## Changes

### 1. Update `supabase/functions/nocodb-proxy/index.ts`

- Before parsing the NocoDB response as JSON, check the `Content-Type` header and look for HTML markers (`<!DOCTYPE`, `<html>`)
- If the response is HTML, return a descriptive 502 error with the status code, so you can debug further
- Log a preview of the unexpected response for debugging

**Before (line 48):**
```
const data = await nocoResponse.json();
```

**After:**
```
const contentType = nocoResponse.headers.get('content-type') || '';
const responseText = await nocoResponse.text();

if (!contentType.includes('application/json') || responseText.trim().startsWith('<!')) {
  console.error(`NocoDB returned non-JSON (status ${nocoResponse.status}):`, responseText.substring(0, 300));
  return new Response(JSON.stringify({
    error: `NocoDB returned non-JSON response (status ${nocoResponse.status}). Check your NOCODB_BASE_URL and NOCODB_API_TOKEN.`,
    configured: true
  }), {
    status: 502,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

const data = JSON.parse(responseText);
```

This will:
- Stop the crash immediately
- Log the first 300 characters of the HTML response so we can see what NocoDB is actually returning
- Return a clear error message to the UI instead of a generic 500

After deploying this fix, we can check the logs to see the actual HTML response and determine if the base URL or token needs adjusting.

