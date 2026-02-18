
## Fix All Build Errors

There are two categories of errors to fix:

---

### Category 1: TypeScript `unknown` error type in Edge Functions

In Deno (strict TypeScript), `catch (error)` binds `error` as type `unknown`, not `Error`. Accessing `.message` on `unknown` is a type error.

**Fix pattern** — cast to `Error` in every affected catch block:
```typescript
// Before
} catch (error) {
  return new Response(JSON.stringify({ error: error.message }), ...)
}

// After
} catch (error) {
  const err = error as Error;
  return new Response(JSON.stringify({ error: err.message }), ...)
}
```

**Affected edge functions (10 files):**
- `supabase/functions/create-finance-user/index.ts` — line 66
- `supabase/functions/delete-user/index.ts` — line 92
- `supabase/functions/documize-proxy/index.ts` — line 82
- `supabase/functions/generate-student-qr/index.ts` — line 95
- `supabase/functions/nocodb-proxy/index.ts` — line 69
- `supabase/functions/reset-password/index.ts` — line 136
- `supabase/functions/send-interview-invitation/index.ts` — line 103
- `supabase/functions/send-registration-email/index.ts` — line 144
- `supabase/functions/send-teacher-application-email/index.ts` — line 144
- `supabase/functions/tacticalrmm-proxy/index.ts` — lines 80, 113
- `supabase/functions/zoom-auth/index.ts` — lines 113, 114

---

### Category 2: `encodeBase64` import in `zoom-auth`

The `encodeBase64` export does not exist in `https://deno.land/std@0.168.0/encoding/base64.ts`. In older Deno std versions the function was named `encode`.

**Fix:** Replace with the correct import from a newer std version that exports `encodeBase64`:
```typescript
// Before (line 3)
import { encodeBase64 } from "https://deno.land/std@0.168.0/encoding/base64.ts";

// After
import { encodeBase64 } from "https://deno.land/std@0.224.0/encoding/base64.ts";
```

---

### Category 3: `EdgeRuntime.waitUntil` unknown name in `ocr-index-book`

`EdgeRuntime` is a Deno Deploy global but TypeScript doesn't know about it without a type declaration. The fix is to declare it:
```typescript
// Add before usage
declare const EdgeRuntime: { waitUntil: (promise: Promise<unknown>) => void };
```

---

### Category 4: `grade_level` type mismatch in frontend

The `Book` interface in `LibraryPage.tsx` declares `grade_level: number`, but the database schema has it as `TEXT`. This causes cascading errors:
- Line 190: `parseInt(selectedGrade, 10)` passed to `.eq('grade_level', ...)` — should pass the string directly
- Line 548: `BookEditModal` receives `Book` from `LibraryPage` (grade_level: number) but `BookEditModal` defines its own `Book` (grade_level: string) — mismatch

**Fix:** Change the `Book` interface in `LibraryPage.tsx` to use `grade_level: string` and remove `parseInt`:
```typescript
// LibraryPage.tsx interface
interface Book {
  grade_level: string; // was: number
  ...
}

// Line 190 fix
query = query.eq('grade_level', selectedGrade); // remove parseInt(...)
```

---

### Category 5: Missing `category` and `is_teacher_only` columns on `StudentLibraryTab.tsx`

The TypeScript types generated from the database don't yet include the new `category` and `is_teacher_only` columns (migration hasn't been applied yet). The student library tab references `book.category` and `book.is_teacher_only`.

**Fix:** Cast the book objects to `any` in the student library tab's filter and display logic temporarily until types regenerate, OR use optional chaining:
```typescript
// StudentLibraryTab.tsx - grade_level comparison (line 60)
.eq('grade_level', String(studentGrade))  // cast number to string

// Category access (lines 81, 82) - cast book to any
const book = bookData as any;
```

---

### Technical Summary

| File | Error | Fix |
|---|---|---|
| 10x edge functions | `error` is `unknown` | Cast: `const err = error as Error` |
| `zoom-auth/index.ts` | `encodeBase64` not exported | Update std import to `@0.224.0` |
| `ocr-index-book/index.ts` | `EdgeRuntime` not found | Add `declare const EdgeRuntime` |
| `LibraryPage.tsx` | `grade_level: number` vs DB `text` | Change interface to `string`, remove `parseInt` |
| `StudentLibraryTab.tsx` | `category` not in types, grade comparison | Cast grade to string, cast book to `any` |

### Files to Modify
- `supabase/functions/create-finance-user/index.ts`
- `supabase/functions/delete-user/index.ts`
- `supabase/functions/documize-proxy/index.ts`
- `supabase/functions/generate-student-qr/index.ts`
- `supabase/functions/nocodb-proxy/index.ts`
- `supabase/functions/reset-password/index.ts`
- `supabase/functions/send-interview-invitation/index.ts`
- `supabase/functions/send-registration-email/index.ts`
- `supabase/functions/send-teacher-application-email/index.ts`
- `supabase/functions/tacticalrmm-proxy/index.ts`
- `supabase/functions/zoom-auth/index.ts`
- `supabase/functions/ocr-index-book/index.ts`
- `src/components/library/LibraryPage.tsx`
- `src/components/portals/student/StudentLibraryTab.tsx`
