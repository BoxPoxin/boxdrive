-- ============================================================================
-- BOXPOX — Migration to fix orders table + create missing user profiles
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor → New Query)
-- ============================================================================

-- ── 1. Create the fulfillment enum if it doesn't exist ─────────────────────
do $$
begin
  if not exists (select 1 from pg_type where typname = 'order_fulfillment_status') then
    create type public.order_fulfillment_status as enum ('processing', 'shipped', 'completed', 'cancelled');
  end if;
end $$;

-- ── 2. Add the new columns to orders (only if missing) ────────────────────
alter table public.orders add column if not exists payment_method text not null default 'razorpay' check (payment_method in ('razorpay', 'cod'));
alter table public.orders add column if not exists payment_status text not null default 'paid' check (payment_status in ('pending', 'paid', 'failed', 'refunded'));
alter table public.orders add column if not exists fulfillment_status public.order_fulfillment_status not null default 'processing';
alter table public.orders add column if not exists company_name text;
alter table public.orders add column if not exists gst_number text;
alter table public.orders add column if not exists shipping_email text;

alter table public.users add column if not exists company_name text;
alter table public.users add column if not exists gst_number text;

-- ── 3. Migrate data from old 'status' column → new columns, then drop it ──
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

-- ── 4. Make sure RLS policies exist on the orders table ───────────────────
alter table public.orders enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where tablename = 'orders' and policyname = 'orders_select_own') then
    create policy "orders_select_own" on public.orders for select using (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'orders' and policyname = 'orders_insert_own') then
    create policy "orders_insert_own" on public.orders for insert with check (auth.uid() = user_id);
  end if;
end $$;

-- ── 5. Re-create the stock-decrement trigger ──────────────────────────────
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

-- ── 6. Re-create the user-profile auto-creation trigger ───────────────────
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, full_name, phone, shipping_address, shipping_city, shipping_pincode, company_name, gst_number)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    coalesce(new.raw_user_meta_data ->> 'phone', ''),
    coalesce(new.raw_user_meta_data ->> 'shipping_address', ''),
    coalesce(new.raw_user_meta_data ->> 'shipping_city', ''),
    coalesce(new.raw_user_meta_data ->> 'shipping_pincode', ''),
    null,
    null
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ── 7. Backfill: create profile rows for existing auth users ──────────────
insert into public.users (id, full_name, phone, shipping_address, shipping_city, shipping_pincode, company_name, gst_number)
select
  u.id,
  coalesce(u.raw_user_meta_data ->> 'full_name', ''),
  coalesce(u.raw_user_meta_data ->> 'phone', ''),
  coalesce(u.raw_user_meta_data ->> 'shipping_address', u.raw_user_meta_data ->> 'address', ''),
  coalesce(u.raw_user_meta_data ->> 'shipping_city', u.raw_user_meta_data ->> 'city', ''),
  coalesce(u.raw_user_meta_data ->> 'shipping_pincode', u.raw_user_meta_data ->> 'pincode', ''),
  null,
  null
from auth.users u
on conflict (id) do nothing;

-- ── 8. Update seed data to match catalog.ts ───────────────────────────────
-- Remove the backer edition if it has no orders linked to it
delete from public.products
  where id = 'absolute-unit-17:backer'
    and not exists (select 1 from public.orders where product_id = 'absolute-unit-17:backer');

-- Ensure the standard edition exists
insert into public.products (id, name, edition, price_inr, stock_quantity)
values ('absolute-unit-17:standard', 'Absolute Unit 17', 'standard', 2, 10)
on conflict (id) do nothing;

-- ── Done! ─────────────────────────────────────────────────────────────────
-- After running this, refresh your website and test:
-- 1. Log in → go to Account → you should see your profile
-- 2. Place an order → go to Account → order should appear in "Past orders"
-- 3. Go to Checkout again → your address should be pre-filled
