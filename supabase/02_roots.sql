-- =====================================================================
-- Mannin Roots — separate schema for the high-volume marketplace.
-- Run AFTER 01_suvai.sql. One transaction: all or nothing.
-- Then add "roots" under Project Settings → API → Exposed schemas.
-- =====================================================================
begin;

create schema roots;
grant usage on schema roots to anon, authenticated;

create type roots.region       as enum ('IN','AU');
create type roots.order_status as enum ('New','Preparing','Out for delivery','Delivered');
create type roots.rest_status  as enum ('pending','active','paused');

create table roots.restaurants (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  name_ta    text not null default '',
  cuisine    text not null check (cuisine in ('South Indian','Biryani','Traditional Meals','Millet Specials','Street Food','Healthy & Light')),
  area       text not null,
  rating     numeric(2,1) not null default 0 check (rating between 0 and 5),
  fssai      text check (fssai ~ '^[0-9]{14}$'),
  owner_name text, phone text, payout text,
  status     roots.rest_status not null default 'pending',
  created_by uuid default auth.uid(),
  created_at timestamptz not null default now()
);
create table roots.dishes (
  id            uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references roots.restaurants(id) on delete cascade,
  name          text not null,
  price_inr     int not null check (price_inr > 0),
  tags          text[] not null default '{}',
  rating        numeric(2,1) not null default 0 check (rating between 0 and 5)
);
create table roots.settings (
  id          int primary key default 1 check (id = 1),
  fee_in      int not null default 50,          -- flat ₹50 India
  fee_au      int not null default 10,          -- flat $10 Australia
  aud_per_100 numeric(6,2)                      -- null = Australian orders paused
);
insert into roots.settings default values;

create table roots.orders (
  id            uuid primary key default gen_random_uuid(),
  order_no      text not null unique,
  batch         uuid not null,                  -- one checkout = one batch, split per restaurant
  restaurant_id uuid not null references roots.restaurants(id),
  items         jsonb not null,                 -- [{dish_id,name,qty,price}] priced by the server
  item_total    numeric(10,2) not null,
  fee           numeric(10,2) not null,         -- flat fee charged once, on the first receipt
  region        roots.region not null,
  phone         text not null check (phone ~ '^[0-9]{10}$'),
  payment       text not null check (payment in ('Saved token','On delivery')),
  status        roots.order_status not null default 'New',
  created_at    timestamptz not null default now()
);
create index on roots.orders (batch);
create index on roots.orders (phone);
create index on roots.orders (restaurant_id, created_at desc);

-- failed token attempts, to stop guessing the 5-digit code
create table roots.token_attempts (phone text not null, at timestamptz not null default now());
create index on roots.token_attempts (phone, at);

-- ---------- guards ----------
-- Managers can submit restaurants, but only Owner/Admin make them live.
create or replace function roots.guard_restaurant() returns trigger
language plpgsql security definer set search_path = roots, public as $$
begin
  if not public.has_role('owner','admin') then
    if tg_op = 'INSERT' then new.status := 'pending';
    elsif new.status is distinct from old.status and not (old.status = 'active' and new.status = 'paused') and not (old.status = 'paused' and new.status = 'active') then
      raise exception 'Only Owner or Admin can approve restaurants';
    end if;
  end if;
  return new;
end $$;
create trigger restaurants_guard before insert or update on roots.restaurants for each row execute function roots.guard_restaurant();

-- Orders only move forward: New → Preparing → Out for delivery → Delivered. Nothing else is editable.
create or replace function roots.guard_order() returns trigger language plpgsql as $$
begin
  if (to_jsonb(new) - 'status') is distinct from (to_jsonb(old) - 'status') then raise exception 'Order details cannot be edited'; end if;
  if new.status::text is distinct from case old.status when 'New' then 'Preparing' when 'Preparing' then 'Out for delivery' when 'Out for delivery' then 'Delivered' end then
    raise exception 'Invalid status change % → %', old.status, new.status;
  end if;
  return new;
end $$;
create trigger orders_guard before update on roots.orders for each row execute function roots.guard_order();

-- ---------- checkout (the only way to create orders) ----------
-- Prices, fee, the 3-restaurant limit and the payment token are all checked here, never trusted from the browser.
-- NOTE: the 5-minute SMS code is not verified server-side yet — that needs an SMS provider (not approved).
-- Returns {"batch": uuid, "orders": [order numbers]} or {"error": "..."}.
-- Errors are returned (not raised) so a failed-token attempt is still recorded for the lockout.
create or replace function roots.place_order(p_phone text, p_region roots.region, p_items jsonb, p_token text default null)
returns jsonb
language plpgsql security definer set search_path = roots, public, extensions, pg_temp as $$
declare
  s roots.settings; v_batch uuid := gen_random_uuid(); v_prefix text := 'M' || to_char(now() at time zone 'Asia/Kolkata', 'YYMMDDHH24MISS');
  v_registered boolean; v_hash text; v_rest uuid; v_items jsonb; v_total numeric; v_fee numeric; n int := 0; v_nos text[] := '{}'; v_no text;
begin
  if p_phone is null or p_phone !~ '^[0-9]{10}$' then return jsonb_build_object('error', 'Invalid phone number'); end if;
  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then return jsonb_build_object('error', 'Cart is empty'); end if;
  select * into s from roots.settings where id = 1;
  if p_region = 'AU' and s.aud_per_100 is null then return jsonb_build_object('error', 'Australian ordering is paused until prices are set'); end if;

  drop table if exists cart;
  create temp table cart on commit drop as
    select d.id as dish_id, d.name as dish_name, d.restaurant_id as rest_id, d.price_inr,
           least(greatest(coalesce((i->>'qty')::int, 1), 1), 20) as qty
    from jsonb_array_elements(p_items) i
    join roots.dishes d on d.id = (i->>'dish_id')::uuid
    join roots.restaurants r on r.id = d.restaurant_id and r.status = 'active';
  if (select count(*) from cart) <> jsonb_array_length(p_items) then return jsonb_build_object('error', 'Some dishes are no longer available'); end if;
  if (select count(distinct rest_id) from cart) > 3 then return jsonb_build_object('error', 'A cart can hold dishes from at most 3 restaurants'); end if;

  select p.pay_token_hash into v_hash from public.profiles p where p.status = 'active' and (p.phone = p_phone or p.phone2 = p_phone) limit 1;
  v_registered := found;
  if v_registered then
    if (select count(*) from roots.token_attempts t where t.phone = p_phone and t.at > now() - interval '1 hour') >= 5 then
      return jsonb_build_object('error', 'Too many wrong codes. Try again in an hour.');
    end if;
    if v_hash is null or p_token is null or crypt(p_token, v_hash) <> v_hash then
      insert into roots.token_attempts(phone) values (p_phone);
      return jsonb_build_object('error', 'Payment token does not match');
    end if;
  end if;

  for v_rest in select distinct rest_id from cart order by 1 loop
    n := n + 1;
    v_no := v_prefix || '-' || chr(64 + n);
    select jsonb_agg(jsonb_build_object('dish_id', c.dish_id, 'name', c.dish_name, 'qty', c.qty,
             'price', case when p_region = 'IN' then c.price_inr else round(c.price_inr * s.aud_per_100 / 50) / 2 end)),
           sum(c.qty * case when p_region = 'IN' then c.price_inr else round(c.price_inr * s.aud_per_100 / 50) / 2 end)
      into v_items, v_total from cart c where c.rest_id = v_rest;
    v_fee := case when n = 1 then (case when p_region = 'IN' then s.fee_in else s.fee_au end) else 0 end;
    insert into roots.orders(order_no, batch, restaurant_id, items, item_total, fee, region, phone, payment)
      values (v_no, v_batch, v_rest, v_items, v_total, v_fee, p_region, p_phone,
              case when v_registered then 'Saved token' else 'On delivery' end);
    v_nos := v_nos || v_no;
  end loop;

  insert into public.notifications(roles, text, link)
    values ('{kitchen,rider,manager}', 'New Mannin Roots order ' || v_prefix || ': ' || n || ' kitchen receipt(s)', '#/roots/orders');
  return jsonb_build_object('batch', v_batch, 'orders', to_jsonb(v_nos));
end $$;
grant execute on function roots.place_order(text, roots.region, jsonb, text) to anon, authenticated;

-- Guests read back only the orders from their own checkout (batch ids are random and unguessable).
create or replace function roots.my_orders(p_batches uuid[]) returns setof roots.orders
language sql stable security definer set search_path = roots as $$
  select * from roots.orders where batch = any(p_batches) order by created_at desc
$$;
grant execute on function roots.my_orders(uuid[]) to anon, authenticated;

-- ---------- row-level security ----------
alter table roots.restaurants    enable row level security;
alter table roots.dishes         enable row level security;
alter table roots.settings       enable row level security;
alter table roots.orders         enable row level security;
alter table roots.token_attempts enable row level security;   -- no policies: nobody reads it directly

grant select on roots.restaurants, roots.dishes, roots.settings to anon, authenticated;
grant insert, update on roots.restaurants, roots.dishes to authenticated;
grant update on roots.settings to authenticated;
grant select, update on roots.orders to authenticated;

create policy rest_public  on roots.restaurants for select using (status = 'active');
create policy rest_staff   on roots.restaurants for select using (public.has_role('owner','admin','manager'));
create policy rest_submit  on roots.restaurants for insert with check (public.has_role('owner','admin','manager'));
create policy rest_update  on roots.restaurants for update using (public.has_role('owner','admin','manager'));

create policy dish_public  on roots.dishes for select using (exists (select 1 from roots.restaurants r where r.id = restaurant_id and r.status = 'active'));
create policy dish_staff   on roots.dishes for select using (public.has_role('owner','admin','manager'));
create policy dish_write   on roots.dishes for insert with check (public.has_role('owner','admin','manager'));
create policy dish_update  on roots.dishes for update using (public.has_role('owner','admin','manager'));

create policy rset_read    on roots.settings for select using (true);
create policy rset_write   on roots.settings for update using (public.has_role('owner','admin'));

-- staff see every receipt; customers see orders placed from their saved numbers
create policy ord_staff    on roots.orders for select using (public.has_role('owner','admin','manager','kitchen','rider'));
create policy ord_mine     on roots.orders for select using (phone in (select unnest(array[p.phone, p.phone2]) from public.profiles p where p.id = auth.uid()));
create policy ord_progress on roots.orders for update using (public.has_role('owner','admin','manager','kitchen','rider'));

commit;
