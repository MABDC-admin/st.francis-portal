
## Fix: Add Vite `define` Fallbacks for Supabase Environment Variables

### Root Cause
The `vite.config.ts` is missing a `define` block. In the Lovable preview environment, Vite sometimes fails to inject `import.meta.env.*` variables, leaving `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` as `undefined`. The Supabase client then throws `supabaseUrl is required`, resulting in a blank white screen.

A previous version of this config had a `define` fallback block (noted in project memory), but it was removed during a recent edit to `vite.config.ts`.

### Fix
Add a `define` block back to `vite.config.ts` that hardcodes the public Supabase values as compile-time fallbacks. These are publishable/anon keys (not secrets), so it is safe to include them directly in the Vite config.

### Technical Details

**File: `vite.config.ts`**

Add a `define` field to the config:

```typescript
define: {
  'import.meta.env.VITE_SUPABASE_URL': JSON.stringify('https://wdiexrdvnckpyghvepsy.supabase.co'),
  'import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY': JSON.stringify('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndkaWV4cmR2bmNrcHlnaHZlcHN5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA3MzE5MTMsImV4cCI6MjA4NjMwNzkxM30.vZSMTVwWp7eKw2z4ZFBtEw8m7xax-Symv7sq3_p2MFE'),
},
```

This ensures that even if the platform-level env injection fails, the client will always have the correct URL and anon key at build time, preventing the blank screen crash.

**Files to modify:**
- `vite.config.ts` -- add `define` block with Supabase fallback values
