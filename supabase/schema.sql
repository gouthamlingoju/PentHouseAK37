-- ====================================================================
-- PentHouse AK37 - Production Database Schema, Triggers & Strict RLS
-- Target: Supabase (PostgreSQL 17+)
-- ====================================================================

create extension if not exists "uuid-ossp";

-- 1. Profiles Table (Linked to auth.users via auth_user_id)
create table if not exists public.profiles (
  id text primary key,
  auth_user_id uuid unique references auth.users(id) on delete set null,
  username text not null unique,
  name text not null,
  email text not null unique,
  upi_id text not null default '',
  phone text,
  avatar_url text,
  is_admin boolean not null default false,
  is_active boolean not null default true,
  must_change_password boolean not null default true,
  color text not null default '#6366f1',
  created_at timestamptz not null default now()
);

-- 2. Cycles Table
create table if not exists public.cycles (
  id text primary key,
  name text not null,
  month_year text not null,
  status text not null check (status in ('active', 'closed')) default 'active',
  admin_id text not null references public.profiles(id),
  started_at timestamptz not null default now(),
  closed_at timestamptz,
  created_at timestamptz not null default now()
);

-- 3. Expenses ("Paid For What")
create table if not exists public.expenses (
  id text primary key,
  cycle_id text not null references public.cycles(id) on delete cascade,
  title text not null,
  amount numeric(10,2) not null check (amount >= 0),
  category text not null check (category in ('Fixed', 'Grocery', 'Food', 'Utilities', 'Personal', 'Other')),
  is_excluded boolean not null default false,
  split_mode text not null check (split_mode in ('equal', 'excluded')) default 'equal',
  participant_ids jsonb not null default '[]'::jsonb,
  notes text,
  created_by text not null references public.profiles(id),
  created_at timestamptz not null default now()
);

-- 4. Expense Splits
create table if not exists public.expense_splits (
  id text primary key,
  expense_id text not null references public.expenses(id) on delete cascade,
  cycle_id text not null references public.cycles(id) on delete cascade,
  profile_id text not null references public.profiles(id),
  share_amount numeric(10,2) not null default 0,
  notes text
);

-- 5. Payments ("Who Paid")
create table if not exists public.payments (
  id text primary key,
  cycle_id text not null references public.cycles(id) on delete cascade,
  payer_id text not null references public.profiles(id),
  amount numeric(10,2) not null check (amount > 0),
  payment_type text not null check (payment_type in ('vendor', 'admin_treasury')),
  recipient_admin_id text references public.profiles(id),
  linked_expense_id text references public.expenses(id) on delete set null,
  vendor_name text,
  notes text,
  payment_date timestamptz not null default now(),
  created_at timestamptz not null default now()
);

-- 6. Settlements (Two-Party Consent)
create table if not exists public.settlements (
  id text primary key,
  cycle_id text not null references public.cycles(id) on delete cascade,
  from_user_id text not null references public.profiles(id),
  to_user_id text not null references public.profiles(id),
  amount numeric(10,2) not null check (amount > 0),
  status text not null check (status in ('pending', 'closed', 'rejected')) default 'pending',
  initiated_by text not null references public.profiles(id),
  confirmed_by text references public.profiles(id),
  rejected_by text references public.profiles(id),
  rejection_reason text,
  notes text,
  upi_ref text,
  created_at timestamptz not null default now(),
  confirmed_at timestamptz
);

-- ====================================================================
-- Security Helper Functions (SECURITY DEFINER)
-- ====================================================================

create or replace function public.current_profile_id()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select id from public.profiles where auth_user_id = auth.uid() limit 1;
$$;

create or replace function public.is_current_user_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where auth_user_id = auth.uid() and is_admin = true
  );
$$;

-- Protect sensitive columns during Self Profile Updation
create or replace function public.protect_profile_sensitive_columns()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Allow service_role or internal RPCs (when auth.uid() is null)
  if auth.uid() is not null and not public.is_current_user_admin() then
    if NEW.is_admin is distinct from OLD.is_admin then
      raise exception 'Only the Admin can transfer Admin privileges.';
    end if;
    if NEW.auth_user_id is distinct from OLD.auth_user_id then
      raise exception 'Cannot change auth_user_id.';
    end if;
    if NEW.username is distinct from OLD.username then
      raise exception 'Username cannot be changed directly.';
    end if;
    if NEW.email is distinct from OLD.email then
      raise exception 'Email cannot be changed directly.';
    end if;
  end if;
  return NEW;
end;
$$;

drop trigger if exists trg_protect_profile_columns on public.profiles;
create trigger trg_protect_profile_columns
  before update on public.profiles
  for each row execute function public.protect_profile_sensitive_columns();

-- Atomic Admin Role Transfer RPC
create or replace function public.transfer_admin_role(new_admin_id text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_current_user_admin() then
    raise exception 'Only the active Admin can transfer the Admin role.';
  end if;

  if not exists (select 1 from public.profiles where id = new_admin_id and is_active = true) then
    raise exception 'Target roommate does not exist or is inactive.';
  end if;

  update public.profiles set is_admin = false where is_admin = true;
  update public.profiles set is_admin = true where id = new_admin_id;
  update public.cycles set admin_id = new_admin_id where status = 'active';
end;
$$;

-- ====================================================================
-- Closed Cycle Protection Trigger
-- Blocks INSERT / UPDATE / DELETE on closed cycles
-- ====================================================================

create or replace function public.check_cycle_is_active()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target_cycle_status text;
begin
  select status into target_cycle_status
  from public.cycles
  where id = coalesce(NEW.cycle_id, OLD.cycle_id);

  if target_cycle_status = 'closed' then
    raise exception 'Cannot modify records in a closed/archived monthly cycle (strictly read-only).';
  end if;

  if TG_OP = 'DELETE' then
    return OLD;
  end if;
  return NEW;
end;
$$;

drop trigger if exists trg_prevent_closed_cycle_expense on public.expenses;
create trigger trg_prevent_closed_cycle_expense
  before insert or update or delete on public.expenses
  for each row execute function public.check_cycle_is_active();

drop trigger if exists trg_prevent_closed_cycle_splits on public.expense_splits;
create trigger trg_prevent_closed_cycle_splits
  before insert or update or delete on public.expense_splits
  for each row execute function public.check_cycle_is_active();

drop trigger if exists trg_prevent_closed_cycle_payment on public.payments;
create trigger trg_prevent_closed_cycle_payment
  before insert or update or delete on public.payments
  for each row execute function public.check_cycle_is_active();

drop trigger if exists trg_prevent_closed_cycle_settlement on public.settlements;
create trigger trg_prevent_closed_cycle_settlement
  before insert or update or delete on public.settlements
  for each row execute function public.check_cycle_is_active();

-- ====================================================================
-- Strict Row Level Security (RLS)
-- ====================================================================

alter table public.profiles enable row level security;
alter table public.cycles enable row level security;
alter table public.expenses enable row level security;
alter table public.expense_splits enable row level security;
alter table public.payments enable row level security;
alter table public.settlements enable row level security;

-- Drop old policies if re-running
drop policy if exists "Allow all authenticated users to read profiles" on public.profiles;
drop policy if exists "Users can update their own profile" on public.profiles;
drop policy if exists "Members read profiles" on public.profiles;
drop policy if exists "Users update own profile" on public.profiles;
drop policy if exists "Admin updates profiles" on public.profiles;

drop policy if exists "Allow all members to read cycles" on public.cycles;
drop policy if exists "Only admin can create or update cycles" on public.cycles;
drop policy if exists "Members read cycles" on public.cycles;
drop policy if exists "Admin insert cycles" on public.cycles;
drop policy if exists "Admin update cycles" on public.cycles;

drop policy if exists "Allow members to read expenses" on public.expenses;
drop policy if exists "Allow members to insert expenses in active cycle" on public.expenses;
drop policy if exists "Allow creator or admin to update/delete expenses" on public.expenses;
drop policy if exists "Allow creator or admin to delete expenses" on public.expenses;
drop policy if exists "Members read expenses" on public.expenses;
drop policy if exists "Members insert expenses" on public.expenses;
drop policy if exists "Creator or admin update expenses" on public.expenses;
drop policy if exists "Creator or admin delete expenses" on public.expenses;

drop policy if exists "Allow read on expense splits" on public.expense_splits;
drop policy if exists "Allow insert/modify on expense splits" on public.expense_splits;
drop policy if exists "Members read splits" on public.expense_splits;
drop policy if exists "Members insert splits" on public.expense_splits;
drop policy if exists "Members update splits" on public.expense_splits;
drop policy if exists "Members delete splits" on public.expense_splits;

drop policy if exists "Allow members to read payments" on public.payments;
drop policy if exists "Allow members to log payments" on public.payments;
drop policy if exists "Allow payer or admin to modify payment" on public.payments;
drop policy if exists "Allow payer or admin to delete payment" on public.payments;
drop policy if exists "Members read payments" on public.payments;
drop policy if exists "Members insert payments" on public.payments;
drop policy if exists "Payer or admin update payments" on public.payments;
drop policy if exists "Payer or admin delete payments" on public.payments;

drop policy if exists "Allow members to read settlements" on public.settlements;
drop policy if exists "Allow members to initiate settlements" on public.settlements;
drop policy if exists "Allow counterparty to confirm or reject settlement" on public.settlements;
drop policy if exists "Members read settlements" on public.settlements;
drop policy if exists "Members initiate settlements" on public.settlements;
drop policy if exists "Counterparty confirms or rejects settlement" on public.settlements;

-- Profiles Policies
create policy "Members read profiles"
  on public.profiles for select
  to authenticated
  using (public.current_profile_id() is not null);

create policy "Users update own profile"
  on public.profiles for update
  to authenticated
  using (auth_user_id = auth.uid() or public.is_current_user_admin())
  with check (auth_user_id = auth.uid() or public.is_current_user_admin());

-- Cycles Policies
create policy "Members read cycles"
  on public.cycles for select
  to authenticated
  using (public.current_profile_id() is not null);

create policy "Admin insert cycles"
  on public.cycles for insert
  to authenticated
  with check (public.is_current_user_admin());

create policy "Admin update cycles"
  on public.cycles for update
  to authenticated
  using (public.is_current_user_admin())
  with check (public.is_current_user_admin());

-- Expenses Policies
create policy "Members read expenses"
  on public.expenses for select
  to authenticated
  using (public.current_profile_id() is not null);

create policy "Members insert expenses"
  on public.expenses for insert
  to authenticated
  with check (public.current_profile_id() is not null);

create policy "Creator or admin update expenses"
  on public.expenses for update
  to authenticated
  using (created_by = public.current_profile_id() or public.is_current_user_admin())
  with check (created_by = public.current_profile_id() or public.is_current_user_admin());

create policy "Creator or admin delete expenses"
  on public.expenses for delete
  to authenticated
  using (created_by = public.current_profile_id() or public.is_current_user_admin());

-- Expense Splits Policies
create policy "Members read splits"
  on public.expense_splits for select
  to authenticated
  using (public.current_profile_id() is not null);

create policy "Members insert splits"
  on public.expense_splits for insert
  to authenticated
  with check (public.current_profile_id() is not null);

create policy "Members update splits"
  on public.expense_splits for update
  to authenticated
  using (public.current_profile_id() is not null);

create policy "Members delete splits"
  on public.expense_splits for delete
  to authenticated
  using (public.current_profile_id() is not null);

-- Payments Policies
create policy "Members read payments"
  on public.payments for select
  to authenticated
  using (public.current_profile_id() is not null);

create policy "Members insert payments"
  on public.payments for insert
  to authenticated
  with check (public.current_profile_id() is not null);

create policy "Payer or admin update payments"
  on public.payments for update
  to authenticated
  using (payer_id = public.current_profile_id() or public.is_current_user_admin());

create policy "Payer or admin delete payments"
  on public.payments for delete
  to authenticated
  using (payer_id = public.current_profile_id() or public.is_current_user_admin());

-- Settlements Policies (Strict Two-Party Consent!)
create policy "Members read settlements"
  on public.settlements for select
  to authenticated
  using (public.current_profile_id() is not null);

create policy "Members initiate settlements"
  on public.settlements for insert
  to authenticated
  with check (
    initiated_by = public.current_profile_id()
    and status = 'pending'
    and (
      from_user_id = public.current_profile_id()
      or to_user_id = public.current_profile_id()
      or public.is_current_user_admin()
    )
  );

create policy "Counterparty confirms or rejects settlement"
  on public.settlements for update
  to authenticated
  using (
    status = 'pending'
    and initiated_by <> public.current_profile_id()
    and (
      from_user_id = public.current_profile_id()
      or to_user_id = public.current_profile_id()
    )
  )
  with check (
    status in ('closed', 'rejected')
    and (
      (status = 'closed' and confirmed_by = public.current_profile_id())
      or (status = 'rejected' and rejected_by = public.current_profile_id())
    )
  );

-- Enable Realtime cleanly (idempotent)
do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'profiles') then
    alter publication supabase_realtime add table public.profiles;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'cycles') then
    alter publication supabase_realtime add table public.cycles;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'expenses') then
    alter publication supabase_realtime add table public.expenses;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'expense_splits') then
    alter publication supabase_realtime add table public.expense_splits;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'payments') then
    alter publication supabase_realtime add table public.payments;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'settlements') then
    alter publication supabase_realtime add table public.settlements;
  end if;
end $$;
