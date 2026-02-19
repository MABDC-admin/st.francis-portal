
## Fix: "Rendered more hooks than during the previous render" in Index.tsx

### Root Cause

React's Rules of Hooks require that **all hooks are called unconditionally and in the same order on every render**. In `src/pages/Index.tsx`, two early returns exist at lines 216–226:

```typescript
// Line 216
if (loading) {
  return ( <div>...</div> );
}

// Line 224
if (!user) {
  return null;
}

// Line 229 — ❌ HOOK CALLED AFTER EARLY RETURN
const { totalStudents, maleCount, femaleCount, levels } = useMemo(() => ({
  totalStudents: students.length,
  ...
}), [students]);
```

On the first render, when `loading` is true, React runs all hooks up to line 216 and stops. On the next render, when `loading` is false and `user` exists, React tries to run the `useMemo` at line 229 — but it wasn't called on the previous render. This count mismatch is exactly what causes the crash.

### Fix

Move the `useMemo` (and any other logic that runs after the early returns) to **before** the early returns. The `students` array is already available before line 216 (from `useStudents()` at line 211), so the `useMemo` can safely be relocated to run unconditionally.

**Before (broken order):**
```
line 211: const { data: students } = useStudents();       ← hook OK
line 216: if (loading) return ...                         ← EARLY RETURN #1
line 224: if (!user) return null                          ← EARLY RETURN #2
line 229: const stats = useMemo(...)                      ← ❌ HOOK AFTER RETURNS
```

**After (fixed order):**
```
line 211: const { data: students } = useStudents();       ← hook OK
line 213: const stats = useMemo(...)                      ← ✓ HOOK BEFORE RETURNS
line 217: if (loading) return ...                         ← early return (now safe)
line 225: if (!user) return null                          ← early return (now safe)
```

### Files to Modify

- `src/pages/Index.tsx` — Move the `useMemo` block (lines 229–234) to before the `if (loading)` check at line 216.

### Technical Detail

No logic changes are needed — only the **order** of statements within the component function changes. The `useMemo` depends only on `students` which is already declared at line 211, so moving it earlier is fully safe with no side effects.
