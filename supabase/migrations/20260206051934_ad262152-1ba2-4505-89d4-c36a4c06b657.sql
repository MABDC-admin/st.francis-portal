-- =====================================================
-- COMPREHENSIVE STUDENT PORTAL DATABASE SCHEMA
-- Phase 1: Core Tables for Student Portal Enhancement
-- =====================================================

-- 1. STUDENT ATTENDANCE TABLE
-- Tracks daily attendance with school and academic year segregation
create table public.student_attendance (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references public.students(id) on delete cascade not null,
  school_id uuid references public.schools(id) not null,
  academic_year_id uuid references public.academic_years(id) not null,
  date date not null,
  status text not null check (status in ('present', 'absent', 'late', 'excused')),
  time_in time,
  time_out time,
  remarks text,
  recorded_by uuid,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(student_id, date, academic_year_id)
);

-- RLS for student_attendance
alter table public.student_attendance enable row level security;

create policy "Students view own attendance"
  on public.student_attendance for select using (
    student_id in (
      select uc.student_id from public.user_credentials uc 
      where uc.user_id = auth.uid()
    )
  );

create policy "Staff manage attendance"
  on public.student_attendance for all using (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'registrar') OR
    public.has_role(auth.uid(), 'teacher')
  );

-- 2. CLASS SCHEDULES TABLE
-- Weekly timetable by grade level and subject
create table public.class_schedules (
  id uuid primary key default gen_random_uuid(),
  school_id uuid references public.schools(id) not null,
  academic_year_id uuid references public.academic_years(id) not null,
  subject_id uuid references public.subjects(id) not null,
  grade_level text not null,
  section text,
  day_of_week int not null check (day_of_week between 0 and 6),
  start_time time not null,
  end_time time not null,
  room text,
  teacher_id uuid references public.teachers(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- RLS for class_schedules
alter table public.class_schedules enable row level security;

create policy "Anyone can view schedules"
  on public.class_schedules for select using (true);

create policy "Staff manage schedules"
  on public.class_schedules for all using (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'registrar') OR
    public.has_role(auth.uid(), 'teacher')
  );

-- 3. STUDENT ASSIGNMENTS TABLE
-- Assignments/homework by subject and grade level
create table public.student_assignments (
  id uuid primary key default gen_random_uuid(),
  school_id uuid references public.schools(id) not null,
  academic_year_id uuid references public.academic_years(id) not null,
  subject_id uuid references public.subjects(id) not null,
  grade_level text not null,
  title text not null,
  description text,
  instructions text,
  due_date timestamptz not null,
  max_score numeric,
  assignment_type text default 'homework' check (assignment_type in ('homework', 'project', 'quiz', 'essay', 'other')),
  attachments jsonb,
  created_by uuid,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- RLS for student_assignments
alter table public.student_assignments enable row level security;

create policy "Students view grade-level assignments"
  on public.student_assignments for select using (true);

create policy "Staff manage assignments"
  on public.student_assignments for all using (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'registrar') OR
    public.has_role(auth.uid(), 'teacher')
  );

-- 4. ASSIGNMENT SUBMISSIONS TABLE
-- Student submissions for assignments
create table public.assignment_submissions (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid references public.student_assignments(id) on delete cascade not null,
  student_id uuid references public.students(id) on delete cascade not null,
  submitted_at timestamptz,
  score numeric,
  feedback text,
  status text default 'pending' check (status in ('pending', 'submitted', 'late', 'graded', 'returned')),
  attachments jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(assignment_id, student_id)
);

-- RLS for assignment_submissions
alter table public.assignment_submissions enable row level security;

create policy "Students view own submissions"
  on public.assignment_submissions for select using (
    student_id in (
      select uc.student_id from public.user_credentials uc 
      where uc.user_id = auth.uid()
    )
  );

create policy "Students submit own work"
  on public.assignment_submissions for insert with check (
    student_id in (
      select uc.student_id from public.user_credentials uc 
      where uc.user_id = auth.uid()
    )
  );

create policy "Students update own submissions"
  on public.assignment_submissions for update using (
    student_id in (
      select uc.student_id from public.user_credentials uc 
      where uc.user_id = auth.uid()
    )
  );

create policy "Staff manage submissions"
  on public.assignment_submissions for all using (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'registrar') OR
    public.has_role(auth.uid(), 'teacher')
  );

-- 5. EXAM SCHEDULES TABLE
-- Exam dates and details
create table public.exam_schedules (
  id uuid primary key default gen_random_uuid(),
  school_id uuid references public.schools(id) not null,
  academic_year_id uuid references public.academic_years(id) not null,
  subject_id uuid references public.subjects(id) not null,
  grade_level text not null,
  exam_type text not null check (exam_type in ('quarterly', 'midterm', 'final', 'quiz', 'special')),
  exam_date date not null,
  start_time time,
  end_time time,
  room text,
  quarter int check (quarter between 1 and 4),
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- RLS for exam_schedules
alter table public.exam_schedules enable row level security;

create policy "Anyone can view exam schedules"
  on public.exam_schedules for select using (true);

create policy "Staff manage exam schedules"
  on public.exam_schedules for all using (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'registrar') OR
    public.has_role(auth.uid(), 'teacher')
  );

-- 6. ANNOUNCEMENTS TABLE (ENHANCED)
-- Dedicated announcements table with targeting
create table public.announcements (
  id uuid primary key default gen_random_uuid(),
  school_id uuid references public.schools(id),
  academic_year_id uuid references public.academic_years(id),
  title text not null,
  content text not null,
  target_audience text[] default array['all']::text[],
  target_grade_levels text[],
  priority text default 'normal' check (priority in ('low', 'normal', 'high', 'urgent')),
  is_pinned boolean default false,
  published_at timestamptz default now(),
  expires_at timestamptz,
  created_by uuid,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- RLS for announcements
alter table public.announcements enable row level security;

create policy "Anyone can view announcements"
  on public.announcements for select using (true);

create policy "Staff manage announcements"
  on public.announcements for all using (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'registrar')
  );

-- INDEXES for better query performance
create index idx_student_attendance_student_date on public.student_attendance(student_id, date);
create index idx_student_attendance_school_year on public.student_attendance(school_id, academic_year_id);
create index idx_class_schedules_school_grade on public.class_schedules(school_id, grade_level);
create index idx_class_schedules_day on public.class_schedules(day_of_week);
create index idx_student_assignments_school_grade on public.student_assignments(school_id, grade_level);
create index idx_student_assignments_due_date on public.student_assignments(due_date);
create index idx_assignment_submissions_student on public.assignment_submissions(student_id);
create index idx_exam_schedules_school_grade on public.exam_schedules(school_id, grade_level);
create index idx_exam_schedules_date on public.exam_schedules(exam_date);
create index idx_announcements_school on public.announcements(school_id);
create index idx_announcements_published on public.announcements(published_at);