create or replace function public.admin_system_action(
  p_action text,
  p_confirmation_text text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_is_admin boolean := false;
  v_zero_uuid uuid := '00000000-0000-0000-0000-000000000000'::uuid;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  select exists (
    select 1
    from public.user_roles
    where user_id = v_user_id
      and role = 'admin'
  )
  into v_is_admin;

  if not v_is_admin then
    raise exception 'Admin role required';
  end if;

  if p_action = 'reset_students' then
    if p_confirmation_text <> 'DELETE ALL' then
      raise exception 'Invalid confirmation text for student reset';
    end if;

    delete from public.student_assessments where id <> v_zero_uuid;
    delete from public.student_grades where id <> v_zero_uuid;
    delete from public.raw_scores where id <> v_zero_uuid;
    delete from public.student_attendance where id <> v_zero_uuid;
    delete from public.payments where id <> v_zero_uuid;
    delete from public.student_documents where id <> v_zero_uuid;
    delete from public.user_credentials where student_id is not null;
    delete from public.students where id <> v_zero_uuid;

    return jsonb_build_object(
      'success', true,
      'message', 'All learner records and related data have been deleted'
    );
  elsif p_action = 'delete_all_users' then
    if p_confirmation_text <> 'DELETE ALL USERS' then
      raise exception 'Invalid confirmation text for deleting all users';
    end if;

    delete from public.student_assessments where id <> v_zero_uuid;
    delete from public.student_grades where id <> v_zero_uuid;
    delete from public.raw_scores where id <> v_zero_uuid;
    delete from public.student_attendance where id <> v_zero_uuid;
    delete from public.payments where id <> v_zero_uuid;
    delete from public.student_documents where id <> v_zero_uuid;
    delete from public.students where id <> v_zero_uuid;

    delete from public.password_history where user_id is not null;
    delete from public.user_credentials where id <> v_zero_uuid;
    delete from public.user_roles where user_id <> v_zero_uuid;
    delete from public.user_school_access where user_id <> v_zero_uuid;
    delete from public.profiles where id <> v_zero_uuid;
    delete from auth.users where id <> v_zero_uuid;

    return jsonb_build_object(
      'success', true,
      'message', 'All user accounts, students, teachers, and staff have been deleted'
    );
  else
    raise exception 'Unsupported action: %', p_action;
  end if;
end;
$$;

revoke all on function public.admin_system_action(text, text) from public;
grant execute on function public.admin_system_action(text, text) to authenticated;
