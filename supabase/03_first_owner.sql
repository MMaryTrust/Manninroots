-- =====================================================================
-- Make yourself the first Shop Owner (run once, after 01 and 02).
-- 1. Supabase → Authentication → Users → "Add user" → your email + a strong password
--    (tick "Auto Confirm User").
-- 2. Replace BOTH occurrences of you@example.com below with that email, then run.
-- Every other account is then created from inside the app.
-- =====================================================================
begin;

do $$
declare v_id uuid;
begin
  select id into v_id from auth.users where lower(email) = lower('you@example.com');
  if v_id is null then raise exception 'No auth user with that email. Create it under Authentication → Users first.'; end if;
  insert into public.profiles (id, name, email, must_change_password, finance_admin)
    values (v_id, 'Shop Owner', lower('you@example.com'), false, true);
  insert into public.user_roles (user_id, role) values (v_id, 'owner');
  insert into public.audit_log (actor, action, detail) values (v_id, 'First owner created', 'Bootstrap');
end $$;

commit;
