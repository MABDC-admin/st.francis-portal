
# Cross-Project Integration Plan: Flipbooks API Sync

## The Challenge
The Flipbooks project (`edu-flip-library.lovable.app`) is a separate Lovable project with its own database. To integrate it here, we need to create an API bridge between the two projects.

---

## Integration Architecture

```text
┌─────────────────────────┐         ┌─────────────────────────┐
│   REGISTRAR SYSTEM      │         │   FLIPBOOKS PROJECT     │
│   (Current Project)     │         │   (edu-flip-library)    │
├─────────────────────────┤         ├─────────────────────────┤
│                         │  HTTPS  │                         │
│   Library Page  ───────────────►  │   sync-flipbooks        │
│                         │  (API)  │   Edge Function         │
│   flipbooks table ◄─────────────  │                         │
│   (cached metadata)     │  JSON   │   flipbooks table       │
│                         │         │   (source data)         │
└─────────────────────────┘         └─────────────────────────┘
```

---

## What You Need to Do in the Flipbooks Project

### Step 1: Create a Sync API Edge Function

In your **Flipbooks project**, create a new edge function called `sync-flipbooks`:

**File:** `supabase/functions/sync-flipbooks/index.ts`

```typescript
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Validate API key
    const apiKey = req.headers.get('x-api-key');
    const expectedKey = Deno.env.get('SYNC_API_KEY');
    
    if (!apiKey || apiKey !== expectedKey) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create Supabase client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch all flipbooks (adjust table/column names to match your schema)
    const { data: flipbooks, error } = await supabase
      .from('flipbooks') // or 'books' - whatever your table is named
      .select('*')
      .eq('is_active', true);

    if (error) throw error;

    return new Response(JSON.stringify({ flipbooks }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Sync error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
```

### Step 2: Add to Flipbooks config.toml

```toml
[functions.sync-flipbooks]
verify_jwt = false
```

### Step 3: Set the SYNC_API_KEY Secret

In the Flipbooks project, add a secret called `SYNC_API_KEY` with a secure random value (e.g., `flipbook-sync-key-2025-xyz123`).

---

## What I Will Implement in This Project

### Step 1: Create Import Edge Function

Create `supabase/functions/import-flipbooks/index.ts` that:
- Calls the Flipbooks project's sync-flipbooks API
- Upserts the data into our local flipbooks table
- Uses the same `SYNC_API_KEY` for authentication

### Step 2: Add Sync Button to Library Page

Add an "Import from Flipbooks" button (admin-only) that:
- Triggers the import edge function
- Shows a toast with results
- Refreshes the library grid

### Step 3: Update Library to Use Imported Data

The existing `LibraryPage.tsx` already queries our `flipbooks` table, so once imported, books will appear automatically.

---

## Required Information from You

To proceed, I need to know:

1. **What is your flipbooks table structure?**
   - Table name (e.g., `flipbooks`, `books`, `ebooks`)
   - Column names (title, cover_url, pdf_url, grade_levels, etc.)

2. **What is the public flipbook viewer URL format?**
   - Example: `https://edu-flip-library.lovable.app/flipbook/{id}`
   - This is where users go to read the book

3. **Do you want to use the same SYNC_API_KEY?**
   - I see you already have `SYNC_API_KEY` configured in this project
   - We can use the same key if you set it in Flipbooks project too

---

## Alternative: Direct Database Query (Same Supabase Account)

If both projects share the **same Supabase project/database**, we don't need an API - we can query the flipbooks table directly! 

**Are both Lovable projects connected to the same Supabase backend?** If yes, the integration is much simpler - we just query the existing flipbooks table directly.

---

## Summary of Steps

| Step | Where | Action |
|------|-------|--------|
| 1 | Flipbooks Project | Create `sync-flipbooks` edge function |
| 2 | Flipbooks Project | Add `SYNC_API_KEY` secret |
| 3 | This Project | Create `import-flipbooks` edge function |
| 4 | This Project | Add admin sync button to Library |
| 5 | Test | Click sync, verify books appear |

