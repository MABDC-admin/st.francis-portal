
# Phase 2: Email Notifications, School Showcase & Visit Scheduling

## Overview
After successful registration, send email confirmations via Resend, show an interactive school showcase dialog with map/photos/registrar info, and allow scheduling school visits.

---

## 1. Email Confirmation via Resend Edge Function

**New file: `supabase/functions/send-registration-email/index.ts`**
- Triggered after successful registration submission
- Sends confirmation email to parent email (if provided)
- Sends notification email to school administration
- Uses existing `RESEND_API_KEY` secret
- Professional HTML email template with school branding

---

## 2. School Info Database Table

**Migration: Create `school_info` table**
```sql
CREATE TABLE public.school_info (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid REFERENCES schools(id) NOT NULL,
  registrar_name text,
  registrar_photo_url text,
  registrar_phone text,
  registrar_email text,
  office_hours text,
  latitude numeric,
  longitude numeric,
  map_embed_url text,
  facility_photos jsonb DEFAULT '[]',
  visit_slots_config jsonb DEFAULT '{"morning": "9:00 AM - 12:00 PM", "afternoon": "1:00 PM - 4:00 PM", "max_per_slot": 5}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```
- RLS: Public SELECT, admin UPDATE/INSERT

**Migration: Create `school_visits` table**
```sql
CREATE TABLE public.school_visits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid REFERENCES schools(id) NOT NULL,
  registration_id uuid REFERENCES online_registrations(id),
  visitor_name text NOT NULL,
  visitor_email text,
  visitor_phone text,
  visit_date date NOT NULL,
  visit_slot text NOT NULL,
  status text DEFAULT 'scheduled',
  created_at timestamptz DEFAULT now()
);
```
- RLS: Public INSERT (for scheduling), admin SELECT/UPDATE

---

## 3. School Showcase Dialog

**New file: `src/components/registration/SchoolShowcaseDialog.tsx`**

Shown after successful submission. Contains:
- School location map (Google Maps embed or static map image)
- Photo gallery of school facilities (slider with framer-motion)
- Registrar info card (name, photo, phone with click-to-call)
- Office hours display
- "Schedule a School Visit" button → opens visit scheduler

---

## 4. Visit Scheduler

**New file: `src/components/registration/VisitScheduler.tsx`**

Interactive date/time picker:
- Calendar showing available dates (next 30 days, weekdays only)
- Morning/Afternoon slot selection
- Shows remaining capacity per slot (max 5)
- Collects visitor name and contact
- Submits to `school_visits` table
- Confirmation message after booking

---

## 5. Integration Points

- `OnlineRegistrationForm.tsx`: After successful submission, call edge function for email, then show SchoolShowcaseDialog
- `RegistrationManagement.tsx`: Add visit schedule management tab
- `supabase/config.toml`: Add function config with `verify_jwt = false`

---

## Files Summary

| Action | File |
|--------|------|
| Create | `supabase/functions/send-registration-email/index.ts` |
| Create | `src/components/registration/SchoolShowcaseDialog.tsx` |
| Create | `src/components/registration/VisitScheduler.tsx` |
| Modify | `src/components/registration/OnlineRegistrationForm.tsx` |
| Migration | Create `school_info` and `school_visits` tables |
| Config | Update `supabase/config.toml` for edge function |
