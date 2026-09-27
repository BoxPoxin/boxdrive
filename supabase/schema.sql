-- ============================================================================
-- BOXPOX / Absolute Unit 17 — Supabase schema
-- Run this once in the Supabase SQL editor on a fresh project.
-- Tables: users, products, orders + RLS policies + stock-decrement trigger.
-- ============================================================================

-- ── Extensions ──────────────────────────────────────────────────────────────
create extension if not exists pgcrypto; -- gen_random_uuid()

-- fulfillment_status is a Postgres enum so Supabase Studio's table editor shows
-- it as a dropdown — change it there to move an order through processing →
-- shipped → completed (or cancelled).
do $$
begin
  if not exists (select 1 from pg_type where typname = 'order_fulfillment_status') then
    create type public.order_fulfillment_status as enum ('processing', 'shipped', 'completed', 'cancelled');
  end if;
end $$;

-- ── users ───────────────────────────────────────────────────────────────────
-- One row per authenticated shopper. id mirrors auth.users(id) 1:1.
-- Exactly one shipping address and one billing address per user.
create table if not exists public.users (
  id                        uuid primary key references auth.users (id) on delete cascade,
  full_name                 text not null,
  phone                     text not null,
  shipping_address          text not null default '',
  shipping_city             text not null default '',
  shipping_pincode          text not null default '',
  billing_address           text not null default '',
  billing_city              text not null default '',
  billing_pincode           text not null default '',
  billing_same_as_shipping  boolean not null default true,
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now()
);

-- Migrate installs created before billing/shipping were split out.
do $$
begin
  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'users' and column_name = 'address') then
    alter table public.users rename column address to shipping_address;
  end if;
  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'users' and column_name = 'city') then
    alter table public.users rename column city to shipping_city;
  end if;
  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'users' and column_name = 'pincode') then
    alter table public.users rename column pincode to shipping_pincode;
  end if;
end $$;

alter table public.users add column if not exists billing_address text not null default '';
alter table public.users add column if not exists billing_city text not null default '';
alter table public.users add column if not exists billing_pincode text not null default '';
alter table public.users add column if not exists billing_same_as_shipping boolean not null default true;

-- ── products ─────────────────────────────────────────────────────────────────
-- id encodes "<productId>:<edition>" e.g. "absolute-unit-17:standard".
create table if not exists public.products (
  id              text primary key,
  name            text not null,
  edition         text not null,
  price_inr       integer not null check (price_inr > 0),
  stock_quantity  integer not null default 0 check (stock_quantity >= 0),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- ── orders ───────────────────────────────────────────────────────────────────
-- One row per cart line item. `checkout_id` groups line items placed together.
create table if not exists public.orders (
  id                    uuid primary key default gen_random_uuid(),
  checkout_id           uuid not null default gen_random_uuid(),
  user_id               uuid references public.users (id) on delete set null,
  product_id            text not null references public.products (id),
  quantity              integer not null check (quantity > 0),
  unit_price_inr        integer not null check (unit_price_inr > 0),
  total_inr             integer not null check (total_inr > 0),
  currency              text not null default 'INR',
  payment_method        text not null default 'razorpay' check (payment_method in ('razorpay', 'cod')),
  payment_status        text not null default 'paid' check (payment_status in ('pending', 'paid', 'failed', 'refunded')),
  fulfillment_status    public.order_fulfillment_status not null default 'processing',
  razorpay_order_id     text,
  razorpay_payment_id   text,
  shipping_name         text not null,
  shipping_phone        text not null,
  shipping_address      text not null,
  shipping_city         text not null,
  shipping_pincode      text not null,
  created_at            timestamptz not null default now(),
  unique (razorpay_payment_id, product_id)
);

create index if not exists orders_user_id_idx on public.orders (user_id);
create index if not exists orders_checkout_id_idx on public.orders (checkout_id);

-- ── Row Level Security ───────────────────────────────────────────────────────
alter table public.users    enable row level security;
alter table public.products enable row level security;
alter table public.orders   enable row level security;

-- users: a shopper can only read/update/insert their own profile row.
-- (The insert policy is kept for completeness; in practice the row is created
-- by the `on_auth_user_created` trigger below, which runs as SECURITY DEFINER
-- and bypasses RLS — this avoids failures caused by RLS/session timing during
-- sign-up, e.g. before an email address has been confirmed.)
create policy "users_select_own" on public.users
  for select using (auth.uid() = id);

create policy "users_insert_own" on public.users
  for insert with check (auth.uid() = id);

create policy "users_update_own" on public.users
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- products: readable by anyone (storefront catalog); writes are service-role only.
create policy "products_select_all" on public.products
  for select using (true);

-- orders: a shopper can only read/insert rows tied to their own user_id.
-- The Node server writes orders with the service-role key, which bypasses RLS,
-- so guest checkouts (user_id is null) are still handled server-side.
create policy "orders_select_own" on public.orders
  for select using (auth.uid() = user_id);

create policy "orders_insert_own" on public.orders
  for insert with check (auth.uid() = user_id);

-- ── Trigger: decrement product stock whenever an order row is inserted ──────
create or replace function public.decrement_product_stock()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.products
     set stock_quantity = stock_quantity - new.quantity,
         updated_at = now()
   where id = new.product_id;

  if not found then
    raise exception 'Unknown product_id: %', new.product_id;
  end if;

  if (select stock_quantity from public.products where id = new.product_id) < 0 then
    raise exception 'Insufficient stock for product %', new.product_id;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_decrement_product_stock on public.orders;
create trigger trg_decrement_product_stock
  after insert on public.orders
  for each row execute function public.decrement_product_stock();

-- ── Trigger: auto-create the public.users profile when someone signs up ────
-- Runs as SECURITY DEFINER so it works regardless of RLS or whether the new
-- user's email is confirmed yet (there is no client session at that point).
-- Shipping details are passed in via `supabase.auth.signUp({ options: { data } })`
-- and land in `raw_user_meta_data`.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, full_name, phone, shipping_address, shipping_city, shipping_pincode)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    coalesce(new.raw_user_meta_data ->> 'phone', ''),
    coalesce(new.raw_user_meta_data ->> 'shipping_address', ''),
    coalesce(new.raw_user_meta_data ->> 'shipping_city', ''),
    coalesce(new.raw_user_meta_data ->> 'shipping_pincode', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Backfill: create profile rows for any auth.users created before this trigger
-- existed (falls back to the old 'address'/'city'/'pincode' metadata keys too).
insert into public.users (id, full_name, phone, shipping_address, shipping_city, shipping_pincode)
select
  u.id,
  coalesce(u.raw_user_meta_data ->> 'full_name', ''),
  coalesce(u.raw_user_meta_data ->> 'phone', ''),
  coalesce(u.raw_user_meta_data ->> 'shipping_address', u.raw_user_meta_data ->> 'address', ''),
  coalesce(u.raw_user_meta_data ->> 'shipping_city', u.raw_user_meta_data ->> 'city', ''),
  coalesce(u.raw_user_meta_data ->> 'shipping_pincode', u.raw_user_meta_data ->> 'pincode', '')
from auth.users u
on conflict (id) do nothing;

-- ── Order status tracking ───────────────────────────────────────────────────
-- payment_method/payment_status track how & whether the order was paid for.
-- (Enum type + these columns are already created above for fresh installs;
-- the statements below only add anything that's missing on older installs.)
alter table public.orders add column if not exists payment_method text not null default 'razorpay' check (payment_method in ('razorpay', 'cod'));
alter table public.orders add column if not exists payment_status text not null default 'paid' check (payment_status in ('pending', 'paid', 'failed', 'refunded'));
alter table public.orders add column if not exists fulfillment_status public.order_fulfillment_status not null default 'processing';

-- Migrate data out of the old combined `status` column, then drop it.
do $$
begin
  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'orders' and column_name = 'status') then
    update public.orders set payment_method = 'cod' where status = 'cod';
    update public.orders set payment_status = 'paid' where status = 'paid';
    update public.orders set payment_status = 'failed' where status = 'failed';
    update public.orders set payment_status = 'refunded' where status = 'refunded';
    alter table public.orders drop constraint if exists orders_status_check;
    alter table public.orders drop column status;
  end if;
end $$;

-- ── Seed data (matches src/lib/catalog.ts) ──────────────────────────────────
-- Absolute Unit 17 ships as a single version — no editions, no preorder.
delete from public.products
  where id = 'absolute-unit-17:backer'
    and not exists (select 1 from public.orders where product_id = 'absolute-unit-17:backer');

insert into public.products (id, name, edition, price_inr, stock_quantity)
values
  ('absolute-unit-17:standard', 'Absolute Unit 17', 'standard', 2, 10)
on conflict (id) do update set stock_quantity = excluded.stock_quantity;
