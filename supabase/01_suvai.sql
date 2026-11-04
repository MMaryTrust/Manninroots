-- =====================================================================
-- Mannin Suvai — database schema + row-level security
-- Run once in Supabase → SQL Editor. Runs as one transaction:
-- if any statement fails, nothing is created.
-- Scope: only what the app already does. No storage, realtime or extras.
-- =====================================================================
begin;

create extension if not exists pgcrypto;

-- ---------- enums ----------
create type public.app_role       as enum ('owner','admin','doctorAdmin','doctor','manager','kitchen','rider','customer');
create type public.account_status as enum ('active','suspended');
create type public.customer_tier  as enum ('standard','premium','vip');
create type public.customer_status as enum ('active','cancelled','deceased');
create type public.appt_status    as enum ('Waiting','In-Session','Completed');
create type public.payment_status as enum ('pending','confirmed');
create type public.meal_slot      as enum ('Breakfast','Lunch','Dinner');

-- ---------- plans (pricing lives in the database, not the browser) ----------
create table public.plans (
  id          text primary key,
  name        text not null,
  name_ta     text not null,
  days        int  not null check (days > 0),
  daily_rate  int  not null check (daily_rate > 0),
  total       int  generated always as ((round(days * daily_rate / 100.0) * 100)::int) stored
);
insert into public.plans (id, name, name_ta, days, daily_rate) values
  ('weekly','Weekly Nourish','வாராந்திர ஊட்டம்',7,100),
  ('monthly','Monthly Balance','மாதாந்திர சமநிலை',30,90),
  ('quarterly','Quarterly Roots','காலாண்டு வேர்கள்',90,80),
  ('half','Six Months Season','ஆறு மாத பருவம்',180,75),
  ('yearly','Yearly Heritage','ஆண்டு மரபு',365,65);

-- ---------- accounts ----------
-- Passwords live only in Supabase Auth (auth.users). Never here.
create table public.profiles (
  id                   uuid primary key references auth.users(id) on delete cascade,
  name                 text not null,
  email                text not null unique,
  phone                text,
  phone2               text,
  status               public.account_status not null default 'active',
  must_change_password boolean not null default true,
  finance_admin        boolean not null default false,
  pay_token_hash       text,            -- bcrypt hash of the 5-digit Roots token
  created_at           timestamptz not null default now()
);
create table public.user_roles (
  user_id    uuid not null references public.profiles(id) on delete cascade,
  role       public.app_role not null,
  granted_by uuid references public.profiles(id),
  granted_at timestamptz not null default now(),
  primary key (user_id)                 -- one role per person
);

-- Public sign-up requests. No auth account exists until an Admin approves
-- (approval runs in the admin-users server function).
create table public.signup_requests (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (length(name) between 2 and 120),
  email       text not null check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  phone       text not null check (phone ~ '^[0-9]{10}$'),
  plan_id     text not null references public.plans(id),
  payment_ref text not null check (length(payment_ref) between 3 and 80),
  status      text not null default 'pending' check (status in ('pending','approved','rejected')),
  created_at  timestamptz not null default now()
);

-- ---------- helper functions used by policies ----------
create or replace function public.my_role() returns public.app_role
language sql stable security definer set search_path = public as $$
  select r.role from public.user_roles r join public.profiles p on p.id = r.user_id
  where r.user_id = auth.uid() and p.status = 'active'
$$;
create or replace function public.has_role(variadic roles public.app_role[]) returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(public.my_role() = any(roles), false)
$$;
create or replace function public.is_finance() returns boolean
language sql stable security definer set search_path = public as $$
  select public.has_role('owner') or exists (select 1 from public.profiles where id = auth.uid() and finance_admin and status = 'active')
$$;
create or replace function public.is_staff() returns boolean
language sql stable security definer set search_path = public as $$
  select public.has_role('owner','admin','doctorAdmin','doctor','manager','kitchen','rider')
$$;
create or replace function public.today_ist() returns date
language sql stable as $$ select (now() at time zone 'Asia/Kolkata')::date $$;

-- ---------- subscribers & family ----------
create sequence public.customer_code_seq start 1001;
create table public.customers (
  id               uuid primary key default gen_random_uuid(),
  code             text not null unique default 'MS-' || nextval('public.customer_code_seq'),
  user_id          uuid unique references public.profiles(id),
  name             text not null,
  phone            text,
  address          text not null default '',
  tier             public.customer_tier not null default 'standard',
  status           public.customer_status not null default 'active',
  nominee_name     text not null default '',
  nominee_relation text not null default '',
  nominee_phone    text not null default '',
  nominee_mobility text not null default '',
  plan_id          text not null references public.plans(id),
  plan_start       date not null default public.today_ist(),
  plan_end         date not null,
  timing           text not null default 'All three' check (timing in ('All three','Lunch & Dinner','Breakfast & Lunch')),
  profile_done     boolean not null default false,
  created_at       timestamptz not null default now()
);
create table public.care_members (
  id           uuid primary key default gen_random_uuid(),
  customer_id  uuid not null references public.customers(id) on delete cascade,
  name         text not null,
  age          int check (age between 0 and 120),
  condition    text not null default '',
  dietary_tags text[] not null default '{Pure Veg}',
  doctor_id    uuid references public.profiles(id),
  assigned_by  uuid references public.profiles(id),
  created_at   timestamptz not null default now(),
  -- subscriptions are vegetarian-only
  constraint no_nonveg check (not ('Non-Veg' = any(dietary_tags)))
);

-- helpers used inside policies; security definer so policies never recurse into each other
create or replace function public.owns_customer(cid uuid) returns boolean
language sql stable security definer set search_path = public as $
  select exists (select 1 from public.customers where id = cid and user_id = auth.uid())
$;
create or replace function public.doctor_has_customer(cid uuid) returns boolean
language sql stable security definer set search_path = public as $
  select exists (select 1 from public.care_members where customer_id = cid and doctor_id = auth.uid())
$;
create or replace function public.is_my_patient(mid uuid) returns boolean
language sql stable security definer set search_path = public as $
  select exists (select 1 from public.care_members where id = mid and doctor_id = auth.uid())
$;

-- ---------- clinical ----------
create table public.appointments (
  id             uuid primary key default gen_random_uuid(),
  customer_id    uuid not null references public.customers(id),
  member_id      uuid references public.care_members(id),
  doctor_id      uuid not null references public.profiles(id),
  scheduled_date date not null,
  scheduled_time time not null,
  duration_min   int not null default 30 check (duration_min between 5 and 240),
  status         public.appt_status not null default 'Waiting',
  notes          text not null default '',
  follow_up_of   uuid references public.appointments(id),
  created_at     timestamptz not null default now()
);
create table public.consultations (
  id         uuid primary key default gen_random_uuid(),
  member_id  uuid not null references public.care_members(id) on delete cascade,
  doctor_id  uuid not null default auth.uid() references public.profiles(id),
  note       text not null,
  tags       text[] not null default '{}',
  created_at timestamptz not null default now()
);

-- ---------- kitchen ----------
create table public.dishes (
  id        uuid primary key default gen_random_uuid(),
  name      text not null,
  name_ta   text not null default '',
  slot      public.meal_slot not null,
  gi        text not null check (gi in ('Low-GI','Medium-GI')),
  tags      text[] not null default '{Pure Veg}',
  kcal      int, protein int, carbs int, fat int,
  allergens text[] not null default '{}',
  fssai     boolean not null default true
);
create table public.weekly_planner (
  weekday text not null check (weekday in ('Mon','Tue','Wed','Thu','Fri','Sat','Sun')),
  slot    public.meal_slot not null,
  dish_id uuid not null references public.dishes(id),
  primary key (weekday, slot)
);
create table public.ratings (
  id         uuid primary key default gen_random_uuid(),
  dish_id    uuid not null references public.dishes(id) on delete cascade,
  user_id    uuid not null default auth.uid() references public.profiles(id),
  stars      int not null check (stars between 1 and 5),
  comment    text not null default '',
  created_at timestamptz not null default now()
);

-- ---------- delivery (one row per household per meal; insert-only, today only) ----------
create table public.deliveries (
  delivery_date date not null default public.today_ist(),
  customer_id   uuid not null references public.customers(id),
  slot          public.meal_slot not null,
  meals         int not null check (meals > 0),
  delivered_at  timestamptz not null default now(),
  delivered_by  uuid not null default auth.uid() references public.profiles(id),
  primary key (delivery_date, customer_id, slot)
);

-- ---------- finance ----------
create table public.payments (
  id           uuid primary key default gen_random_uuid(),
  ref          text not null,
  customer_id  uuid references public.customers(id),
  user_id      uuid references public.profiles(id),
  customer_name text not null,
  plan_id      text not null references public.plans(id),
  amount       int not null check (amount > 0),
  status       public.payment_status not null default 'pending',
  provider     text not null default 'manual-reference',
  renewal_for  uuid references public.customers(id),
  created_at   timestamptz not null default now(),
  confirmed_at timestamptz,
  confirmed_by uuid references public.profiles(id)
);
create table public.expenses (
  id         uuid primary key default gen_random_uuid(),
  category   text not null,
  amount     int not null check (amount > 0),
  note       text not null default '',
  spent_on   date not null default public.today_ist(),
  created_by uuid not null default auth.uid() references public.profiles(id)
);
create table public.audit_log (
  id     bigint generated always as identity primary key,
  at     timestamptz not null default now(),
  actor  uuid default auth.uid(),
  action text not null,
  detail text not null default ''
);

-- ---------- notifications ----------
create table public.notifications (
  id         uuid primary key default gen_random_uuid(),
  roles      public.app_role[] not null default '{}',
  user_id    uuid references public.profiles(id) on delete cascade,
  text       text not null check (length(text) <= 500),
  link       text not null default '',
  created_at timestamptz not null default now(),
  created_by uuid default auth.uid()
);
create table public.notification_reads (
  notification_id uuid references public.notifications(id) on delete cascade,
  user_id         uuid references public.profiles(id) on delete cascade default auth.uid(),
  primary key (notification_id, user_id)
);
create table public.settings (key text primary key, value jsonb not null);
insert into public.settings values ('follow_up_days', '30');

-- =====================================================================
-- Business-rule triggers (enforced in the database, not just the UI)
-- =====================================================================

create or replace function public.forbid_change() returns trigger language plpgsql as $
begin raise exception '% rows cannot be changed or deleted', tg_table_name; end $;

-- Deceased / cancelled households are permanently locked.
create or replace function public.guard_customer() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if old.status in ('deceased','cancelled') then
    raise exception 'Customer % is % and permanently locked', old.code, old.status;
  end if;
  -- customers may edit only their own household details
  if public.my_role() = 'customer' and (
       new.status is distinct from old.status or new.tier is distinct from old.tier or
       new.plan_id is distinct from old.plan_id or new.plan_end is distinct from old.plan_end or
       new.plan_start is distinct from old.plan_start or new.user_id is distinct from old.user_id or new.code is distinct from old.code) then
    raise exception 'Not allowed to change plan or status';
  end if;
  return new;
end $$;
create trigger customers_guard before update on public.customers for each row execute function public.guard_customer();
create trigger customers_no_delete before delete on public.customers for each row execute function public.forbid_change();

create or replace function public.guard_locked_child() returns trigger
language plpgsql security definer set search_path = public as $$
declare st public.customer_status;
begin
  if tg_op = 'DELETE' then
    select status into st from public.customers where id = old.customer_id;
  else
    select status into st from public.customers where id = new.customer_id;
  end if;
  if st in ('deceased','cancelled') then raise exception 'Household is locked (%)', st; end if;
  if tg_op = 'DELETE' then return old; end if;
  return new;
end $$;
create trigger members_locked before insert or update or delete on public.care_members for each row execute function public.guard_locked_child();
create trigger deliveries_locked before insert on public.deliveries for each row execute function public.guard_locked_child();
create trigger appts_locked before insert on public.appointments for each row execute function public.guard_locked_child();

-- Only Admin and Doctor Admin assign doctors; doctors may only edit their own patients' tags.
create or replace function public.guard_member() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'UPDATE' and new.doctor_id is distinct from old.doctor_id then
    if not public.has_role('admin','doctorAdmin') then raise exception 'Only Admin or Doctor Admin can assign doctors'; end if;
    new.assigned_by := auth.uid();
  end if;
  if tg_op = 'UPDATE' and public.my_role() = 'doctor' and (new.name, new.age, new.customer_id) is distinct from (old.name, old.age, old.customer_id) then
    raise exception 'Doctors may only update dietary tags and conditions';
  end if;
  if tg_op = 'INSERT' and public.my_role() = 'customer' then new.doctor_id := null; new.assigned_by := null; end if;
  return new;
end $$;
create trigger members_guard before insert or update on public.care_members for each row execute function public.guard_member();

-- Profiles: people may change only their own phone numbers; status/flags are admin-only.
create or replace function public.guard_profile() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if current_setting('mannin.trusted', true) = 'on' then return new; end if; -- set only inside the functions below
  if not public.has_role('owner','admin') and (
       new.status is distinct from old.status or new.finance_admin is distinct from old.finance_admin or
       new.email is distinct from old.email or new.must_change_password is distinct from old.must_change_password or
       new.pay_token_hash is distinct from old.pay_token_hash) then
    raise exception 'Not allowed';
  end if;
  if new.finance_admin and not public.has_role('owner') and new.finance_admin is distinct from old.finance_admin then
    raise exception 'Only the Shop Owner designates a Finance Admin';
  end if;
  return new;
end $$;
create trigger profiles_guard before update on public.profiles for each row execute function public.guard_profile();

create trigger audit_append_only before update or delete on public.audit_log for each row execute function public.forbid_change();
create trigger deliveries_append_only before update or delete on public.deliveries for each row execute function public.forbid_change();

-- Deliveries can only be recorded for today (India time): earlier days lock at midnight.
create or replace function public.guard_delivery() returns trigger language plpgsql as $$
begin
  if new.delivery_date <> public.today_ist() then raise exception 'Deliveries can only be recorded for today'; end if;
  new.delivered_by := auth.uid(); new.delivered_at := now();
  return new;
end $$;
create trigger deliveries_today before insert on public.deliveries for each row execute function public.guard_delivery();

-- Payments: amount always comes from the plans table; confirmation is finance-only and applies renewals.
create or replace function public.guard_payment() returns trigger
language plpgsql security definer set search_path = public as $$
declare p public.plans; c public.customers;
begin
  select * into p from public.plans where id = new.plan_id;
  if tg_op = 'INSERT' then
    new.amount := p.total; new.status := 'pending'; new.confirmed_at := null; new.confirmed_by := null;
    return new;
  end if;
  if new.status = 'confirmed' and old.status = 'pending' then
    -- the admin-users server function (service role) confirms the first payment when it approves a sign-up
    if not (public.is_finance() or public.has_role('admin') or coalesce(auth.jwt() ->> 'role', '') = 'service_role') then
      raise exception 'Only finance can confirm payments';
    end if;
    new.confirmed_at := now(); new.confirmed_by := coalesce(auth.uid(), new.confirmed_by);
    if new.renewal_for is not null then
      select * into c from public.customers where id = new.renewal_for;
      update public.customers set plan_id = p.id,
        plan_end = greatest(c.plan_end, public.today_ist()) + p.days
        where id = c.id;
    end if;
    insert into public.audit_log(action, detail) values ('Payment confirmed', new.ref || ' ₹' || new.amount || ' (' || new.customer_name || ')');
  elsif new is distinct from old then
    raise exception 'Payments cannot be edited';
  end if;
  return new;
end $$;
create trigger payments_guard before insert or update on public.payments for each row execute function public.guard_payment();
create trigger payments_no_delete before delete on public.payments for each row execute function public.forbid_change();

-- Completing a consultation books the follow-up automatically.
create or replace function public.auto_follow_up() returns trigger
language plpgsql security definer set search_path = public as $$
declare d int;
begin
  if new.status = 'Completed' and old.status <> 'Completed'
     and not exists (select 1 from public.appointments where follow_up_of = new.id) then
    select (value #>> '{}')::int into d from public.settings where key = 'follow_up_days';
    insert into public.appointments(customer_id, member_id, doctor_id, scheduled_date, scheduled_time, duration_min, notes, follow_up_of)
      values (new.customer_id, new.member_id, new.doctor_id, new.scheduled_date + coalesce(d, 30), new.scheduled_time, new.duration_min, 'Follow-up', new.id);
    insert into public.notifications(user_id, text, link)
      values (new.doctor_id, 'Follow-up booked for ' || (new.scheduled_date + coalesce(d, 30)), '#/app/appointments');
  end if;
  return new;
end $$;
create trigger appts_follow_up after update on public.appointments for each row execute function public.auto_follow_up();

-- Doctors may only change the status/notes of their own appointments.
create or replace function public.guard_appt() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if public.my_role() = 'doctor' and (new.doctor_id, new.scheduled_date, new.scheduled_time, new.customer_id)
       is distinct from (old.doctor_id, old.scheduled_date, old.scheduled_time, old.customer_id) then
    raise exception 'Doctors cannot reschedule; ask scheduling staff';
  end if;
  return new;
end $$;
create trigger appts_guard before update on public.appointments for each row execute function public.guard_appt();

-- Overlap check the app uses to show the collision warning.
create or replace function public.appointment_overlaps(a_id uuid) returns setof public.appointments
language sql stable security definer set search_path = public as $$
  select b.* from public.appointments a join public.appointments b
    on b.id <> a.id and b.doctor_id = a.doctor_id and b.scheduled_date = a.scheduled_date
   and b.status <> 'Completed' and a.status <> 'Completed'
   and a.scheduled_time < b.scheduled_time + make_interval(mins => b.duration_min)
   and b.scheduled_time < a.scheduled_time + make_interval(mins => a.duration_min)
  where a.id = a_id and (public.has_role('owner','admin','doctorAdmin','manager') or a.doctor_id = auth.uid())
$$;

-- Self-service: clear the must-change flag after the password was changed in Supabase Auth,
-- and set the Roots payment token (stored as a bcrypt hash only).
create or replace function public.password_changed() returns void
language plpgsql security definer set search_path = public as $
begin
  perform set_config('mannin.trusted', 'on', true);
  update public.profiles set must_change_password = false where id = auth.uid();
  perform set_config('mannin.trusted', 'off', true);
end $;
create or replace function public.set_pay_token(token text) returns void
language plpgsql security definer set search_path = public, extensions as $$
begin
  if token !~ '^[0-9]{5}$' then raise exception 'Token must be 5 digits'; end if;
  perform set_config('mannin.trusted', 'on', true);
  update public.profiles set pay_token_hash = crypt(token, gen_salt('bf')) where id = auth.uid();
  perform set_config('mannin.trusted', 'off', true);
  insert into public.audit_log(action) values ('Payment token regenerated');
end $$;

-- =====================================================================
-- Row-level security
-- =====================================================================
alter table public.plans              enable row level security;
alter table public.profiles           enable row level security;
alter table public.user_roles         enable row level security;
alter table public.signup_requests    enable row level security;
alter table public.customers          enable row level security;
alter table public.care_members       enable row level security;
alter table public.appointments       enable row level security;
alter table public.consultations      enable row level security;
alter table public.dishes             enable row level security;
alter table public.weekly_planner     enable row level security;
alter table public.ratings            enable row level security;
alter table public.deliveries         enable row level security;
alter table public.payments           enable row level security;
alter table public.expenses           enable row level security;
alter table public.audit_log          enable row level security;
alter table public.notifications      enable row level security;
alter table public.notification_reads enable row level security;
alter table public.settings           enable row level security;

-- public website: plans and menu are readable by everyone
create policy plans_read  on public.plans  for select using (true);
create policy dishes_read on public.dishes for select using (true);
create policy planner_read on public.weekly_planner for select using (true);
create policy dishes_write  on public.dishes for all using (public.has_role('owner','admin','manager','kitchen')) with check (public.has_role('owner','admin','manager','kitchen'));
create policy planner_write on public.weekly_planner for all using (public.has_role('owner','admin','manager','kitchen')) with check (public.has_role('owner','admin','manager','kitchen'));

-- sign-up: anyone may submit; only Owner/Admin may read
create policy signup_insert on public.signup_requests for insert to anon, authenticated with check (status = 'pending');
create policy signup_read   on public.signup_requests for select using (public.has_role('owner','admin'));
create policy signup_update on public.signup_requests for update using (public.has_role('owner','admin'));

-- profiles
create policy profiles_self  on public.profiles for select using (id = auth.uid());
create policy profiles_staff on public.profiles for select using (public.is_staff());
create policy profiles_update_self  on public.profiles for update using (id = auth.uid());
create policy profiles_update_admin on public.profiles for update using (public.has_role('owner','admin'));

-- roles: read own; Owner/Admin manage; only the Owner can grant Owner
create policy roles_self  on public.user_roles for select using (user_id = auth.uid());
create policy roles_staff on public.user_roles for select using (public.is_staff());
create policy roles_manage on public.user_roles for all
  using (public.has_role('owner','admin'))
  with check (public.has_role('owner','admin') and (role <> 'owner' or public.has_role('owner')));

-- customers
create policy cust_manage on public.customers for all using (public.has_role('owner','admin','manager')) with check (public.has_role('owner','admin','manager'));
create policy cust_read_care on public.customers for select using (public.has_role('doctorAdmin','kitchen','rider'));
create policy cust_read_doctor on public.customers for select using (
  public.has_role('doctor') and public.doctor_has_customer(id));
create policy cust_self_read   on public.customers for select using (user_id = auth.uid());
create policy cust_self_update on public.customers for update using (user_id = auth.uid()) with check (user_id = auth.uid());

-- family members: doctors see ONLY their assigned members
create policy mem_manage on public.care_members for all using (public.has_role('owner','admin','manager','doctorAdmin')) with check (public.has_role('owner','admin','manager','doctorAdmin'));
create policy mem_kitchen on public.care_members for select using (public.has_role('kitchen','rider'));
create policy mem_doctor_read   on public.care_members for select using (public.has_role('doctor') and doctor_id = auth.uid());
create policy mem_doctor_update on public.care_members for update using (public.has_role('doctor') and doctor_id = auth.uid()) with check (doctor_id = auth.uid());
create policy mem_self_read on public.care_members for select using (public.owns_customer(customer_id));
create policy mem_self_add  on public.care_members for insert with check (public.owns_customer(customer_id));

-- appointments
create policy appt_sched on public.appointments for all using (public.has_role('owner','admin','doctorAdmin','manager')) with check (public.has_role('owner','admin','doctorAdmin','manager'));
create policy appt_doctor_read   on public.appointments for select using (public.has_role('doctor') and doctor_id = auth.uid());
create policy appt_doctor_update on public.appointments for update using (public.has_role('doctor') and doctor_id = auth.uid());
create policy appt_self on public.appointments for select using (public.owns_customer(customer_id));

-- consultations: written by the assigned doctor (or Doctor Admin); shared with managers and kitchen
create policy consult_write on public.consultations for insert with check (
  public.has_role('doctorAdmin') or (public.has_role('doctor') and public.is_my_patient(member_id)));
create policy consult_read on public.consultations for select using (
  public.has_role('owner','admin','doctorAdmin','manager','kitchen') or (public.has_role('doctor') and doctor_id = auth.uid()));

-- ratings
create policy rating_add  on public.ratings for insert with check (public.has_role('customer') and user_id = auth.uid());
create policy rating_read on public.ratings for select using (user_id = auth.uid() or public.has_role('owner','admin','manager','kitchen'));

-- deliveries (insert-only; triggers block other days and edits)
create policy deliv_add  on public.deliveries for insert with check (public.has_role('owner','admin','manager','rider'));
create policy deliv_read on public.deliveries for select using (
  public.has_role('owner','admin','manager','rider','kitchen') or public.owns_customer(customer_id));

-- payments: Owner / Finance Admin see all; Admin sees what it must verify; customers see and request their own
create policy pay_finance on public.payments for select using (public.is_finance());
create policy pay_admin   on public.payments for select using (public.has_role('admin') and status = 'pending');
create policy pay_confirm on public.payments for update using (public.is_finance() or public.has_role('admin'));
create policy pay_self    on public.payments for select using (user_id = auth.uid());
create policy pay_request on public.payments for insert with check (
  user_id = auth.uid() and public.owns_customer(renewal_for));

-- expenses & audit: finance only (audit insert by any active user, stamped with their id)
create policy exp_finance on public.expenses for all using (public.is_finance()) with check (public.is_finance());
create policy audit_read  on public.audit_log for select using (public.is_finance());
create policy audit_write on public.audit_log for insert with check (public.my_role() is not null and actor = auth.uid());

-- notifications: addressed to me or my role
create policy note_read on public.notifications for select using (user_id = auth.uid() or public.my_role() = any(roles));
create policy note_send on public.notifications for insert with check (public.my_role() is not null and created_by = auth.uid());
create policy reads_own on public.notification_reads for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- settings
create policy settings_read  on public.settings for select using (auth.uid() is not null);
create policy settings_write on public.settings for update using (public.has_role('owner','admin'));

commit;
