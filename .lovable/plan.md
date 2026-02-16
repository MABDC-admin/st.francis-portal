
# Teacher Application Confirmation Email

## Overview
After a teacher submits their application via the `/apply` form, a confirmation email will be sent to the applicant's email address using Resend, with `registrar@sfxsai.com` as the sender.

## 1. Update RESEND_API_KEY Secret
Update the existing `RESEND_API_KEY` secret with the new value: `re_XPCXSEF6_F3386gHhsqLUUqEcDkntbmAZ`

## 2. New Edge Function: `send-teacher-application-email`

Create `supabase/functions/send-teacher-application-email/index.ts` that:
- Accepts `{ applicantName, applicantEmail, positionApplied, schoolId }`
- Sends a branded confirmation email to the applicant from `SFXSAI Registrar <registrar@sfxsai.com>`
- Also sends a notification email to the registrar (fetched from `school_info.registrar_email`) about the new application
- Email content includes: applicant name, position applied for, and next steps

Register in `supabase/config.toml`:
```
[functions.send-teacher-application-email]
verify_jwt = false
```

## 3. Update TeacherApplicationForm.tsx

After the successful `insert` into `teacher_applications`, call the new edge function:
```
supabase.functions.invoke('send-teacher-application-email', {
  body: {
    applicantName: fullName,
    applicantEmail: formData.email,
    positionApplied: formData.position_applied,
    schoolId
  }
})
```

This is a fire-and-forget call -- the submission succeeds regardless of whether the email sends.

## 4. Also Update Existing Edge Function Sender

Update `send-registration-email/index.ts` to use `registrar@sfxsai.com` instead of `onboarding@resend.dev` for consistency across all school emails.

---

## Technical Details

| Item | Detail |
|------|--------|
| Secret | `RESEND_API_KEY` updated to new key |
| Sender | `SFXSAI Registrar <registrar@sfxsai.com>` |
| New edge function | `send-teacher-application-email` |
| Modified files | `TeacherApplicationForm.tsx`, `send-registration-email/index.ts`, `config.toml` |
| Email to applicant | Confirmation with name, position, next steps |
| Email to registrar | Notification of new teacher application |
