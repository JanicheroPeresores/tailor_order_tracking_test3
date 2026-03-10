create table if not exists public.customers (
  id text primary key,
  name text not null,
  phone text not null,
  email text not null,
  address text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.orders (
  id text primary key,
  customer_id text not null references public.customers(id) on delete cascade,
  item_type text not null,
  due_date date not null,
  status text not null check (status in ('Pending', 'In Progress', 'Ready', 'Delivered')),
  total_price numeric(12,2) not null check (total_price > 0),
  notes text not null default '',
  ready_notified_at timestamptz,
  delivered_notified_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.orders add column if not exists ready_notified_at timestamptz;
alter table public.orders add column if not exists delivered_notified_at timestamptz;

create index if not exists orders_customer_id_idx on public.orders (customer_id);
create index if not exists orders_created_at_idx on public.orders (created_at desc);
create index if not exists customers_created_at_idx on public.customers (created_at desc);
