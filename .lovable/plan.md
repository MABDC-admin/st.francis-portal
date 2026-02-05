

# Fix Canva OAuth Authorization URL Implementation

## Issues Found

Based on Canva's documentation, the current implementation has several critical issues:

### 1. **Code Challenge Method Case** (Critical)
- **Current**: `code_challenge_method=s256` (lowercase)
- **Required**: `code_challenge_method=S256` (uppercase S)
- Canva documentation states: "This must be set to **S256** (SHA-256)"

### 2. **State Parameter Misuse** (Critical Security Issue)
- **Current**: The `code_verifier` is being stored inside the `state` parameter
- **Canva Docs**: "The state parameter **must not** be used to store the code_verifier value"
- **Impact**: This is a security violation and could cause OAuth flow failures

### 3. **Code Verifier Length** (Potential Issue)
- **Current**: 32 bytes encoded to base64url (~43 characters)
- **Required**: "between 43 and 128 characters long"
- **Fix**: Use 96 bytes as shown in Canva's example code

### 4. **State Storage**
- **Current**: Storing user data in the state parameter (visible in URL)
- **Required**: State should be a high-entropy random string stored server-side
- **Solution**: Store code_verifier and user info in database, use state as lookup key

---

## Technical Changes

### 1. Database Schema Update
Add a table to temporarily store OAuth state during the authorization flow:

```sql
CREATE TABLE public.canva_oauth_states (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  state_key text UNIQUE NOT NULL,
  user_id uuid NOT NULL,
  code_verifier text NOT NULL,
  redirect_uri text NOT NULL,
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz DEFAULT (now() + interval '10 minutes')
);

-- Auto-cleanup expired states
CREATE INDEX idx_canva_oauth_states_expires ON canva_oauth_states(expires_at);
```

### 2. Edge Function Updates (canva-auth/index.ts)

#### a. Fix code_challenge_method
```typescript
// Change from:
canvaAuthUrl.searchParams.set('code_challenge_method', 's256');
// To:
canvaAuthUrl.searchParams.set('code_challenge_method', 'S256');
```

#### b. Fix code verifier generation
```typescript
// Change from:
const array = new Uint8Array(32);
// To (96 bytes for proper length):
const array = new Uint8Array(96);
```

#### c. Fix state handling - Store code_verifier in database, not in state
```typescript
// Generate state key
const stateKey = crypto.randomUUID();

// Store in database (not in URL)
await supabase.from('canva_oauth_states').insert({
  state_key: stateKey,
  user_id: userId,
  code_verifier: codeVerifier,
  redirect_uri: redirectUri,
});

// Use only the state key in the URL
canvaAuthUrl.searchParams.set('state', stateKey);
```

#### d. Update callback handler
```typescript
// Retrieve code_verifier from database using state key
const { data: stateData } = await supabase
  .from('canva_oauth_states')
  .select('*')
  .eq('state_key', state)
  .single();

// Delete the state after retrieval (one-time use)
await supabase.from('canva_oauth_states').delete().eq('state_key', state);
```

---

## Files to Modify

| File | Changes |
|------|---------|
| New Migration | Create `canva_oauth_states` table |
| `supabase/functions/canva-auth/index.ts` | Fix OAuth flow per Canva spec |

---

## Updated OAuth Flow

```text
1. User clicks "Connect with Canva"
   │
   ▼
2. Frontend calls: /canva-auth?action=authorize
   │
   ▼
3. Edge function:
   - Generates code_verifier (96 bytes, base64url)
   - Generates code_challenge (SHA-256 hash of verifier, base64url)
   - Generates state key (random UUID)
   - Stores {state_key, user_id, code_verifier, redirect_uri} in DB
   - Returns Canva OAuth URL with state=state_key
   │
   ▼
4. User redirected to Canva, authorizes app
   │
   ▼
5. Canva redirects back with: ?code=xxx&state=state_key
   │
   ▼
6. Frontend calls: /canva-auth?action=callback&code=xxx&state=state_key
   │
   ▼
7. Edge function:
   - Looks up state_key in DB → gets code_verifier, user_id
   - Deletes the state record (one-time use)
   - Exchanges code + code_verifier for tokens
   - Stores tokens in canva_connections table
   - Returns success
```

---

## Implementation Summary

1. **Create migration** for `canva_oauth_states` table with TTL
2. **Update edge function** with:
   - Uppercase `S256` for code_challenge_method
   - 96-byte code_verifier generation
   - Database-backed state storage
   - Proper state verification in callback
3. **Deploy updated edge function**

