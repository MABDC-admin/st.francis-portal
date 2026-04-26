-- 1. Add section column and index
alter table public.students add column if not exists section text;
create index if not exists idx_students_school_year_level_section
  on public.students (school_id, academic_year_id, level, section);

-- Bypass year lock for data backfill
set local app.bypass_year_lock = 'true';

-- 2. Backfill Grade 1 sections
update public.students s
set section = 'A'
from public.schools sc, public.academic_years ay
where s.school_id = sc.id
  and s.academic_year_id = ay.id
  and (sc.code in ('STFXSA', 'SFXSAI') or sc.name ilike '%Francis Xavier%')
  and ay.name in ('2025-2026', 'SY 2025-2026', '2026-2027', 'SY 2026-2027')
  and s.level = 'Grade 1'
  and (s.section is null or trim(s.section) = '');

-- 3. Ensure subject exists
insert into public.subjects (code, name, description, grade_levels, department, units, is_active)
values ('MATH-G1', 'Mathematics 1', 'Grade 1 Mathematics', array['Grade 1'], 'Elementary', 1, true)
on conflict (code) do update set
  name = excluded.name,
  description = excluded.description,
  grade_levels = excluded.grade_levels,
  department = excluded.department,
  units = excluded.units,
  is_active = true,
  updated_at = now();

-- 4. Create Teacher Apple Grade 1 classes
do $$
declare
  v_school_id uuid;
  v_year_2025 uuid;
  v_year_2026 uuid;
  v_teacher_id uuid;
  v_subject_id uuid;
begin
  perform set_config('app.bypass_year_lock', 'true', true);

  select id into v_school_id
  from public.schools
  where code in ('STFXSA', 'SFXSAI') or name ilike '%Francis Xavier%'
  limit 1;
  if v_school_id is null then raise exception 'St. Francis school not found.'; end if;

  select id into v_year_2025 from public.academic_years
  where school_id = v_school_id and name in ('2025-2026', 'SY 2025-2026') limit 1;
  select id into v_year_2026 from public.academic_years
  where school_id = v_school_id and name in ('2026-2027', 'SY 2026-2027') limit 1;
  if v_year_2025 is null then raise exception 'AY 2025-2026 not found.'; end if;
  if v_year_2026 is null then raise exception 'AY 2026-2027 not found.'; end if;

  select id into v_teacher_id from public.teachers
  where email ilike '%apple%' or full_name ilike '%apple%'
  order by updated_at desc nulls last, created_at desc nulls last
  limit 1;
  if v_teacher_id is null then raise exception 'Teacher Apple not found.'; end if;

  select id into v_subject_id from public.subjects where code = 'MATH-G1' limit 1;

  update public.teachers
  set grade_level = 'Grade 1',
      status = coalesce(status, 'active'),
      updated_at = now()
  where id = v_teacher_id;

  insert into public.sections (school_id, academic_year_id, name, grade_level, advisor_teacher_id, capacity, is_active)
  select v_school_id, year_id, 'A', 'Grade 1', v_teacher_id, 40, true
  from (values (v_year_2025), (v_year_2026)) as y(year_id)
  where not exists (
    select 1 from public.sections s
    where s.school_id = v_school_id
      and s.academic_year_id = y.year_id
      and s.grade_level = 'Grade 1'
      and s.name = 'A'
  );

  insert into public.class_schedules (school_id, academic_year_id, teacher_id, subject_id, grade_level, section, day_of_week, start_time, end_time, room)
  select v_school_id, y.year_id, v_teacher_id, v_subject_id, 'Grade 1', 'A',
         d.day_of_week, d.start_time::time, d.end_time::time, 'Grade 1 Room'
  from (values (v_year_2025), (v_year_2026)) as y(year_id)
  cross join (values (1, '10:00', '11:00'), (3, '10:00', '11:00'), (5, '10:00', '11:00')) as d(day_of_week, start_time, end_time)
  where not exists (
    select 1 from public.class_schedules cs
    where cs.school_id = v_school_id
      and cs.academic_year_id = y.year_id
      and cs.teacher_id = v_teacher_id
      and cs.subject_id = v_subject_id
      and cs.grade_level = 'Grade 1'
      and cs.section = 'A'
      and cs.day_of_week = d.day_of_week
      and cs.start_time = d.start_time::time
  );
end $$;