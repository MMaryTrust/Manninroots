-- Mannin: plain PostgreSQL schema (no Supabase auth/RLS; access rules live in the Fastify API).
-- Stage 1 covers accounts, plans, the Suvai menu, notifications, audit and all of Mannin Roots.
-- Staff tables (customers, care, appointments, deliveries, payments, expenses) follow in stage 2.
-- Idempotent: safe to run more than once.

create table if not exists users (
  id             uuid primary key default gen_random_uuid(),
  name           text not null,
  email          text not null unique,
  phone          text check (phone ~ '^[0-9]{10}$'),
  phone2         text check (phone2 ~ '^[0-9]{10}$'),
  password_hash  text not null,
  role           text not null check (role in ('owner','admin','doctorAdmin','doctor','manager','kitchen','rider','customer')),
  status         text not null default 'active' check (status in ('active','suspended')),
  must_change    boolean not null default false,
  finance_admin  boolean not null default false,
  pay_token_hash text,                      -- 5-digit Roots payment token, bcrypt
  created_at     timestamptz not null default now()
);
create index if not exists users_phone_idx on users (phone);

create table if not exists plans (
  id       text primary key,
  name     text not null,
  name_ta  text not null default '',
  days     int  not null check (days > 0),
  rate     int  not null check (rate > 0),   -- rupees per day; total is rounded to the nearest 100
  note     text not null default '',
  note_ta  text not null default '',
  position int  not null default 0
);

create table if not exists dishes (           -- Mannin Suvai menu
  id        uuid primary key default gen_random_uuid(),
  name      text not null,
  name_ta   text not null default '',
  slot      text not null check (slot in ('Breakfast','Lunch','Dinner')),
  gi        text not null check (gi in ('Low-GI','Medium-GI')),
  tags      text[] not null default '{Pure Veg}',
  kcal int, protein int, carbs int, fat int,
  allergens text[] not null default '{}',
  fssai     boolean not null default true
);

create table if not exists notifications (
  id         uuid primary key default gen_random_uuid(),
  roles      text[] not null,
  text       text not null,
  link       text,
  created_at timestamptz not null default now()
);

create table if not exists audit_log (        -- append-only: the API never updates or deletes
  id         bigserial primary key,
  at         timestamptz not null default now(),
  actor      text not null,
  action     text not null,
  detail     text not null default ''
);

create table if not exists settings (key text primary key, value jsonb not null);

-- ---------- Mannin Roots ----------
create schema if not exists roots;

create table if not exists roots.restaurants (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  name_ta    text not null default '',
  cuisine    text not null check (cuisine in ('South Indian','Biryani','Traditional Meals','Millet Specials','Street Food','Healthy & Light')),
  area       text not null,
  rating     numeric(2,1) not null default 0 check (rating between 0 and 5),
  fssai      text check (fssai ~ '^[0-9]{14}$'),
  owner_name text, phone text, payout text,
  status     text not null default 'pending' check (status in ('pending','active','paused')),
  created_by uuid references users(id),
  created_at timestamptz not null default now()
);

create table if not exists roots.dishes (
  id            uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references roots.restaurants(id) on delete cascade,
  name          text not null,
  price_inr     int not null check (price_inr > 0),
  cuisine       text not null,
  tags          text[] not null default '{}',
  rating        numeric(2,1) not null default 0 check (rating between 0 and 5)
);
create index if not exists roots_dishes_rest_idx on roots.dishes (restaurant_id);

create table if not exists roots.settings (
  id          int primary key default 1 check (id = 1),
  fee_in      int not null default 50,        -- flat ₹50 India
  fee_au      int not null default 10,        -- flat $10 Australia
  aud_per_100 numeric(6,2)                    -- null = Australian orders paused
);
insert into roots.settings default values on conflict do nothing;

create table if not exists roots.orders (
  id            uuid primary key default gen_random_uuid(),
  order_no      text not null unique,
  batch         uuid not null,                -- one checkout = one batch, split per restaurant
  restaurant_id uuid not null references roots.restaurants(id),
  items         jsonb not null,               -- [{dish_id,name,qty,price}] priced by the server
  item_total    numeric(10,2) not null,
  fee           numeric(10,2) not null,       -- flat fee charged once, on the first receipt
  region        text not null check (region in ('IN','AU')),
  phone         text not null check (phone ~ '^[0-9]{10}$'),
  payment       text not null check (payment in ('Saved token','On delivery')),
  status        text not null default 'New' check (status in ('New','Preparing','Out for delivery','Delivered')),
  created_at    timestamptz not null default now()
);
create index if not exists roots_orders_batch_idx on roots.orders (batch);
create index if not exists roots_orders_phone_idx on roots.orders (phone);
create index if not exists roots_orders_rest_idx  on roots.orders (restaurant_id, created_at desc);

create table if not exists roots.token_attempts ( -- failed token guesses, for the lockout
  phone text not null,
  at    timestamptz not null default now()
);
create index if not exists roots_token_attempts_idx on roots.token_attempts (phone, at);

-- ---------- Stage 2: Suvai Customers & Care ----------
create table if not exists customers (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  phone         text not null unique check (phone ~ '^[0-9]{10}$'),
  email         text,
  status        text not null default 'active' check (status in ('active','paused','completed')),
  created_at    timestamptz not null default now()
);
create index if not exists customers_phone_idx on customers (phone);
create index if not exists customers_status_idx on customers (status);

create table if not exists subscriptions (
  id            uuid primary key default gen_random_uuid(),
  customer_id   uuid not null references customers(id) on delete cascade,
  plan_id       text not null references plans(id),
  start_date    date not null,
  end_date      date not null,
  status        text not null default 'active' check (status in ('active','paused','completed')),
  payment_status text not null default 'pending' check (payment_status in ('pending','paid','failed')),
  created_at    timestamptz not null default now()
);
create index if not exists subscriptions_customer_idx on subscriptions (customer_id);
create index if not exists subscriptions_status_idx on subscriptions (status);

create table if not exists appointments (
  id            uuid primary key default gen_random_uuid(),
  customer_id   uuid not null references customers(id) on delete cascade,
  doctor_id     uuid references users(id),
  appointment_date timestamptz not null,
  type          text not null check (type in ('in-person','video','phone')),
  status        text not null default 'scheduled' check (status in ('scheduled','completed','cancelled')),
  notes         text,
  created_at    timestamptz not null default now()
);
create index if not exists appointments_customer_idx on appointments (customer_id);
create index if not exists appointments_date_idx on appointments (appointment_date);
create index if not exists appointments_status_idx on appointments (status);
