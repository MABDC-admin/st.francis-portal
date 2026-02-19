-- ============================================================================
-- Migration: Add Missing Database Indexes (defensive)
-- ============================================================================
-- Each index is wrapped in a DO block that checks the column exists first.
-- Safe to run against any database state — skips silently on missing columns.
-- ============================================================================

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='messages' AND column_name='conversation_id') THEN
    CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON public.messages(conversation_id);
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='messages' AND column_name='sender_id') THEN
    CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON public.messages(sender_id);
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='messages' AND column_name='created_at') THEN
    CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at DESC);
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='conversation_participants' AND column_name='user_id') THEN
    CREATE INDEX IF NOT EXISTS idx_conversation_participants_user_id ON public.conversation_participants(user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='message_receipts' AND column_name='user_id') THEN
    CREATE INDEX IF NOT EXISTS idx_message_receipts_user_id ON public.message_receipts(user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='teachers' AND column_name='school_id') THEN
    CREATE INDEX IF NOT EXISTS idx_teachers_school_id ON public.teachers(school_id);
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='teachers' AND column_name='user_id') THEN
    CREATE INDEX IF NOT EXISTS idx_teachers_user_id ON public.teachers(user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='user_roles' AND column_name='user_id') THEN
    CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='user_roles' AND column_name='role') THEN
    CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles(role);
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='students' AND column_name='school_id') THEN
    CREATE INDEX IF NOT EXISTS idx_students_school_id ON public.students(school_id);
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='students' AND column_name='academic_year_id') THEN
    CREATE INDEX IF NOT EXISTS idx_students_academic_year_id ON public.students(academic_year_id);
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='student_grades' AND column_name='student_id')
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='student_grades' AND column_name='academic_year_id') THEN
    CREATE INDEX IF NOT EXISTS idx_student_grades_student_year ON public.student_grades(student_id, academic_year_id);
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='password_history' AND column_name='user_id') THEN
    CREATE INDEX IF NOT EXISTS idx_password_history_user_id ON public.password_history(user_id, created_at DESC);
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='conversations' AND column_name='created_by') THEN
    CREATE INDEX IF NOT EXISTS idx_conversations_created_by ON public.conversations(created_by);
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='conversations' AND column_name='school_id') THEN
    CREATE INDEX IF NOT EXISTS idx_conversations_school_id ON public.conversations(school_id);
  END IF;
END $$;
