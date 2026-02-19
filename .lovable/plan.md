
## Fix All Build Errors

Three distinct issues need to be resolved.

---

### Fix 1: `Deno.serve` handler return type — 9 edge functions

Deno's TypeScript checker requires `Deno.serve` handlers to return `Promise<Response>`, not `Promise<Response | undefined>`. The error occurs because after the `handleCors` early return, the function can reach a code path with no explicit `return`, giving `undefined`.

The fix is to add an explicit fallback `return` at the end of each affected handler, or ensure every code path explicitly returns a `Response`.

**Affected files:**
- `supabase/functions/canva-api/index.ts`
- `supabase/functions/canva-auth/index.ts`
- `supabase/functions/delete-user/index.ts`
- `supabase/functions/documize-proxy/index.ts`
- `supabase/functions/generate-ai-image/index.ts`
- `supabase/functions/nocodb-proxy/index.ts`
- `supabase/functions/notebook-chat/index.ts`
- `supabase/functions/omada-proxy/index.ts`
- `supabase/functions/reset-password/index.ts`
- `supabase/functions/tacticalrmm-proxy/index.ts`

**Fix pattern** — add a final fallback return inside `Deno.serve`:
```typescript
Deno.serve(async (req): Promise<Response> => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;
  // ... rest of handler ...
});
```

Adding the explicit `: Promise<Response>` return type annotation forces TypeScript to verify all paths return a `Response`, surfacing any gaps clearly.

---

### Fix 2: `handleCors` called with 2 arguments in `sync-students`

`sync-students/index.ts` line 42 calls:
```typescript
handleCors(req, { 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key' })
```

But the shared `handleCors` utility signature is:
```typescript
export const handleCors = (req: Request): Response | null => { ... }
```

It only accepts one argument. The custom header this function needs (`x-api-key`) must be handled inline instead.

**Fix** — remove the second argument and handle the custom CORS headers for the OPTIONS response directly inside `sync-students`:
```typescript
// In sync-students/index.ts
if (req.method === 'OPTIONS') {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
    },
  });
}
```

---

### Fix 3: `ShieldCheck` missing from lucide-react import in `Auth.tsx`

`Auth.tsx` line 244 uses `<ShieldCheck className="h-3 w-3" />` but line 11 only imports:
```typescript
import { GraduationCap, Lock, User, RefreshCcw, Eye, EyeOff } from 'lucide-react';
```

**Fix** — add `ShieldCheck` to the import:
```typescript
import { GraduationCap, Lock, User, RefreshCcw, Eye, EyeOff, ShieldCheck } from 'lucide-react';
```

---

### Files to Modify

| File | Change |
|---|---|
| `supabase/functions/canva-api/index.ts` | Add `: Promise<Response>` return type |
| `supabase/functions/canva-auth/index.ts` | Add `: Promise<Response>` return type |
| `supabase/functions/delete-user/index.ts` | Add `: Promise<Response>` return type |
| `supabase/functions/documize-proxy/index.ts` | Add `: Promise<Response>` return type |
| `supabase/functions/generate-ai-image/index.ts` | Add `: Promise<Response>` return type |
| `supabase/functions/nocodb-proxy/index.ts` | Add `: Promise<Response>` return type |
| `supabase/functions/notebook-chat/index.ts` | Add `: Promise<Response>` return type |
| `supabase/functions/omada-proxy/index.ts` | Add `: Promise<Response>` return type |
| `supabase/functions/reset-password/index.ts` | Add `: Promise<Response>` return type |
| `supabase/functions/tacticalrmm-proxy/index.ts` | Add `: Promise<Response>` return type |
| `supabase/functions/sync-students/index.ts` | Remove 2nd arg from `handleCors`, inline OPTIONS response |
| `src/pages/Auth.tsx` | Add `ShieldCheck` to lucide-react import |
