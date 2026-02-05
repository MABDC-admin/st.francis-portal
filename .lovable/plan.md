
# Fix Canva OAuth Re-login Issue

## Problem Analysis

After successfully authorizing with Canva, the user is redirected back to the app but sees the login page or gets logged out. This happens because:

1. **OAuth callback is in the wrong component**: The callback handling code is in `CanvaStudio.tsx`, but after Canva redirects back to `/`, the `CanvaStudio` component is not mounted (the Index page defaults to `activeTab='portal'`)

2. **Session lost during redirect**: When the browser navigates away to Canva and back, Supabase needs to rehydrate the session. If the callback handler tries to check the session before it's fully rehydrated, it returns `null`

3. **Callback code never executes**: Since `CanvaStudio` isn't rendered on the initial page load, the `useEffect` that handles the OAuth callback never runs

---

## Solution

Move the OAuth callback handling to a higher level (Index page or a dedicated callback handler) so it executes regardless of which tab is active.

---

## Technical Changes

### 1. Handle OAuth callback in Index.tsx

Add logic to detect Canva OAuth callback parameters (`code` and `state`) and process them at the page level:

```typescript
// In Index.tsx useEffect
useEffect(() => {
  const urlParams = new URLSearchParams(window.location.search);
  const code = urlParams.get('code');
  const state = urlParams.get('state');
  
  if (code && state) {
    // Handle Canva OAuth callback
    handleCanvaCallback(code, state);
  }
}, []);
```

### 2. Create a callback handler function

```typescript
const handleCanvaCallback = async (code: string, state: string) => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      // Wait for session to rehydrate
      toast.info('Completing Canva connection...');
      return;
    }

    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/canva-auth?action=callback&code=${encodeURIComponent(code)}&state=${encodeURIComponent(state)}`,
      {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      }
    );

    const result = await response.json();
    
    if (response.ok && result.success) {
      toast.success('Successfully connected to Canva!');
      setActiveTab('canva'); // Navigate to Canva Studio
    }
    
    // Clean URL
    window.history.replaceState({}, document.title, window.location.pathname);
  } catch (error) {
    toast.error('Failed to complete Canva connection');
    window.history.replaceState({}, document.title, window.location.pathname);
  }
};
```

### 3. Wait for session before processing callback

Use the auth loading state to ensure the session is ready:

```typescript
useEffect(() => {
  if (loading) return; // Wait for auth to complete
  
  const urlParams = new URLSearchParams(window.location.search);
  const code = urlParams.get('code');
  const state = urlParams.get('state');
  
  if (code && state && user) {
    handleCanvaCallback(code, state);
  }
}, [loading, user]);
```

### 4. Remove duplicate callback handling from CanvaStudio

The callback logic in `CanvaStudio.tsx` can be simplified since Index.tsx will handle it.

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/pages/Index.tsx` | Add OAuth callback detection and handling |
| `src/components/canva/CanvaStudio.tsx` | Remove redundant callback code, keep only status check |

---

## Flow After Fix

```text
1. User clicks "Connect with Canva"
   │
   ▼
2. Redirected to Canva for authorization
   │
   ▼
3. Canva redirects back to: /?code=xxx&state=yyy
   │
   ▼
4. Index.tsx mounts, Auth context rehydrates session
   │
   ▼
5. useEffect detects ?code & ?state params
   │
   ▼
6. Calls edge function to exchange code for tokens
   │
   ▼
7. On success: clears URL, switches to canva tab, shows toast
   │
   ▼
8. CanvaStudio loads and sees connected status
```

---

## Implementation Summary

1. Move OAuth callback handling from CanvaStudio to Index page
2. Wait for auth loading to complete before processing callback
3. Auto-navigate to Canva tab after successful connection
4. Clean up URL parameters after processing
