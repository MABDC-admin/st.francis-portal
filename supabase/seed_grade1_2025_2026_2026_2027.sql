-- Seed Grade 1 learners for St. Francis Xavier Smart Academy.
-- Safe to rerun: rows are keyed by LRN and updated on conflict.
-- This version resolves school/year IDs from the target database instead of using hardcoded UUIDs.

do $$
declare
  v_school_id uuid;
  v_year_2025 uuid;
  v_year_2026 uuid;
begin
  select id
    into v_school_id
  from public.schools
  where code in ('STFXSA', 'SFXSAI')
     or name ilike '%Francis Xavier%'
  order by
    case when code in ('STFXSA', 'SFXSAI') then 0 else 1 end,
    created_at nulls last
  limit 1;

  if v_school_id is null then
    raise exception 'St. Francis school record was not found. Check public.schools for the correct code/name.';
  end if;

  select id
    into v_year_2025
  from public.academic_years
  where school_id = v_school_id
    and name in ('2025-2026', 'SY 2025-2026')
  order by is_current desc nulls last, created_at desc nulls last
  limit 1;

  select id
    into v_year_2026
  from public.academic_years
  where school_id = v_school_id
    and name in ('2026-2027', 'SY 2026-2027')
  order by is_current desc nulls last, created_at desc nulls last
  limit 1;

  if v_year_2025 is null then
    raise exception 'Academic year 2025-2026 was not found for school %. Create it first or verify its name in public.academic_years.', v_school_id;
  end if;

  if v_year_2026 is null then
    raise exception 'Academic year 2026-2027 was not found for school %. Create it first or verify its name in public.academic_years.', v_school_id;
  end if;

  insert into public.students (
    lrn,
    student_name,
    level,
    school,
    school_id,
    academic_year_id,
    birth_date,
    age,
    gender,
    mother_maiden_name,
    father_name,
    phil_address
  ) values
    -- Grade 1 / Academic Year 2025-2026
    ('25260101', 'Reyes, Ava Nicole', 'Grade 1', 'STFXSA', v_school_id, v_year_2025, '2019-01-01', 6, 'Female', 'Parent Reyes', 'Guardian Reyes', 'Conalum, Inopacan, Leyte'),
    ('25260102', 'Santos, Miguel Luis', 'Grade 1', 'STFXSA', v_school_id, v_year_2025, '2019-02-02', 6, 'Male', 'Parent Santos', 'Guardian Santos', 'Conalum, Inopacan, Leyte'),
    ('25260103', 'Cruz, Sofia Mae', 'Grade 1', 'STFXSA', v_school_id, v_year_2025, '2019-03-03', 6, 'Female', 'Parent Cruz', 'Guardian Cruz', 'Conalum, Inopacan, Leyte'),
    ('25260104', 'Garcia, Liam Angelo', 'Grade 1', 'STFXSA', v_school_id, v_year_2025, '2019-04-04', 6, 'Male', 'Parent Garcia', 'Guardian Garcia', 'Conalum, Inopacan, Leyte'),
    ('25260105', 'Dela Cruz, Zoe Andrea', 'Grade 1', 'STFXSA', v_school_id, v_year_2025, '2019-05-05', 6, 'Female', 'Parent Dela Cruz', 'Guardian Dela Cruz', 'Conalum, Inopacan, Leyte'),
    ('25260106', 'Ramos, Ethan James', 'Grade 1', 'STFXSA', v_school_id, v_year_2025, '2019-06-06', 6, 'Male', 'Parent Ramos', 'Guardian Ramos', 'Conalum, Inopacan, Leyte'),
    ('25260107', 'Mendoza, Mia Clarisse', 'Grade 1', 'STFXSA', v_school_id, v_year_2025, '2019-07-07', 6, 'Female', 'Parent Mendoza', 'Guardian Mendoza', 'Conalum, Inopacan, Leyte'),
    ('25260108', 'Torres, Noah Gabriel', 'Grade 1', 'STFXSA', v_school_id, v_year_2025, '2019-08-08', 6, 'Male', 'Parent Torres', 'Guardian Torres', 'Conalum, Inopacan, Leyte'),
    ('25260109', 'Flores, Isla Therese', 'Grade 1', 'STFXSA', v_school_id, v_year_2025, '2019-09-09', 6, 'Female', 'Parent Flores', 'Guardian Flores', 'Conalum, Inopacan, Leyte'),
    ('25260110', 'Navarro, Lucas Rafael', 'Grade 1', 'STFXSA', v_school_id, v_year_2025, '2019-10-10', 6, 'Male', 'Parent Navarro', 'Guardian Navarro', 'Conalum, Inopacan, Leyte'),

    -- Grade 1 / Academic Year 2026-2027
    ('26270101', 'Reyes, Ava Nicole', 'Grade 1', 'STFXSA', v_school_id, v_year_2026, '2019-01-01', 7, 'Female', 'Parent Reyes', 'Guardian Reyes', 'Conalum, Inopacan, Leyte'),
    ('26270102', 'Santos, Miguel Luis', 'Grade 1', 'STFXSA', v_school_id, v_year_2026, '2019-02-02', 7, 'Male', 'Parent Santos', 'Guardian Santos', 'Conalum, Inopacan, Leyte'),
    ('26270103', 'Cruz, Sofia Mae', 'Grade 1', 'STFXSA', v_school_id, v_year_2026, '2019-03-03', 7, 'Female', 'Parent Cruz', 'Guardian Cruz', 'Conalum, Inopacan, Leyte'),
    ('26270104', 'Garcia, Liam Angelo', 'Grade 1', 'STFXSA', v_school_id, v_year_2026, '2019-04-04', 7, 'Male', 'Parent Garcia', 'Guardian Garcia', 'Conalum, Inopacan, Leyte'),
    ('26270105', 'Dela Cruz, Zoe Andrea', 'Grade 1', 'STFXSA', v_school_id, v_year_2026, '2019-05-05', 7, 'Female', 'Parent Dela Cruz', 'Guardian Dela Cruz', 'Conalum, Inopacan, Leyte'),
    ('26270106', 'Ramos, Ethan James', 'Grade 1', 'STFXSA', v_school_id, v_year_2026, '2019-06-06', 7, 'Male', 'Parent Ramos', 'Guardian Ramos', 'Conalum, Inopacan, Leyte'),
    ('26270107', 'Mendoza, Mia Clarisse', 'Grade 1', 'STFXSA', v_school_id, v_year_2026, '2019-07-07', 7, 'Female', 'Parent Mendoza', 'Guardian Mendoza', 'Conalum, Inopacan, Leyte'),
    ('26270108', 'Torres, Noah Gabriel', 'Grade 1', 'STFXSA', v_school_id, v_year_2026, '2019-08-08', 7, 'Male', 'Parent Torres', 'Guardian Torres', 'Conalum, Inopacan, Leyte'),
    ('26270109', 'Flores, Isla Therese', 'Grade 1', 'STFXSA', v_school_id, v_year_2026, '2019-09-09', 7, 'Female', 'Parent Flores', 'Guardian Flores', 'Conalum, Inopacan, Leyte'),
    ('26270110', 'Navarro, Lucas Rafael', 'Grade 1', 'STFXSA', v_school_id, v_year_2026, '2019-10-10', 7, 'Male', 'Parent Navarro', 'Guardian Navarro', 'Conalum, Inopacan, Leyte')
  on conflict (lrn) do update set
    student_name = excluded.student_name,
    level = excluded.level,
    school = excluded.school,
    school_id = excluded.school_id,
    academic_year_id = excluded.academic_year_id,
    birth_date = excluded.birth_date,
    age = excluded.age,
    gender = excluded.gender,
    mother_maiden_name = excluded.mother_maiden_name,
    father_name = excluded.father_name,
    phil_address = excluded.phil_address,
    updated_at = now();
end $$;

select
  ay.name as academic_year,
  s.level,
  count(*) as learner_count
from public.students s
join public.academic_years ay on ay.id = s.academic_year_id
join public.schools sc on sc.id = s.school_id
where (sc.code in ('STFXSA', 'SFXSAI') or sc.name ilike '%Francis Xavier%')
  and s.level = 'Grade 1'
  and ay.name in ('2025-2026', 'SY 2025-2026', '2026-2027', 'SY 2026-2027')
group by ay.name, s.level
order by ay.name;
