-- Backfill missing school-access rows for staff accounts.
-- This prevents teacher/staff portals from showing empty school-scoped data
-- when user_school_access was not created during account provisioning.

WITH default_school AS (
  SELECT id
  FROM public.schools
  WHERE is_active = true
    AND (code = 'SFXSAI' OR name ILIKE '%St. Francis Xavier Smart Academy%')
  ORDER BY CASE WHEN code = 'SFXSAI' THEN 0 ELSE 1 END, created_at DESC
  LIMIT 1
),
staff_from_roles AS (
  SELECT
    ur.user_id,
    ds.id AS school_id,
    ur.role::text AS role
  FROM public.user_roles ur
  CROSS JOIN default_school ds
  WHERE ur.role IN ('admin', 'registrar', 'finance', 'principal', 'it')
),
teachers_from_records AS (
  SELECT DISTINCT
    COALESCE(t.user_id, uc.user_id) AS user_id,
    COALESCE(
      sch.id,
      ds.id
    ) AS school_id,
    'teacher'::text AS role
  FROM public.teachers t
  LEFT JOIN public.user_credentials uc
    ON uc.teacher_id = t.id
  LEFT JOIN public.schools sch
    ON (
      t.school IS NOT NULL
      AND (
        LOWER(TRIM(sch.code)) = LOWER(TRIM(t.school))
        OR LOWER(TRIM(sch.name)) = LOWER(TRIM(t.school))
      )
    )
  CROSS JOIN default_school ds
  WHERE COALESCE(t.user_id, uc.user_id) IS NOT NULL
),
all_access_rows AS (
  SELECT * FROM staff_from_roles
  UNION
  SELECT * FROM teachers_from_records
)
INSERT INTO public.user_school_access (
  user_id,
  school_id,
  role,
  is_active,
  granted_at
)
SELECT
  aar.user_id,
  aar.school_id,
  aar.role,
  true,
  now()
FROM all_access_rows aar
WHERE aar.user_id IS NOT NULL
  AND aar.school_id IS NOT NULL
ON CONFLICT (user_id, school_id)
DO UPDATE SET
  role = EXCLUDED.role,
  is_active = true,
  granted_at = now();
