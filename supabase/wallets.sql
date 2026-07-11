-- ╔══════════════════════════════════════════════════════════════════════╗
-- ║  Migración: Billeteras / Cuentas (accounts) para Finanzas              ║
-- ║  Ejecútala en el SQL Editor de Supabase si ya tenías la base creada    ║
-- ║  con una versión anterior de schema.sql. Es idempotente.               ║
-- ║  (Si corres schema.sql actualizado completo, NO necesitas este archivo.)║
-- ╚══════════════════════════════════════════════════════════════════════╝

create extension if not exists "pgcrypto";

-- 1) Tabla de cuentas / billeteras
create table if not exists public.accounts (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  name            text not null,
  kind            text not null default 'other'
                  check (kind in ('bank','wallet','cash','benefit','credit','savings','other')),
  color           text not null default '#22c55e',
  icon            text,
  initial_balance numeric(14,2) not null default 0,
  archived        boolean not null default false,
  sort_order      int not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- 2) Vincular las transacciones a una cuenta
alter table public.transactions
  add column if not exists account_id uuid references public.accounts(id) on delete set null;

-- 3) Índices
create index if not exists idx_accounts_user        on public.accounts(user_id) where archived = false;
create index if not exists idx_transactions_account on public.transactions(account_id);

-- 4) updated_at automático
drop trigger if exists trg_accounts_updated on public.accounts;
create trigger trg_accounts_updated
  before update on public.accounts
  for each row execute function public.set_updated_at();

-- 5) Row Level Security (cada usuario solo ve y edita SUS cuentas)
alter table public.accounts enable row level security;
drop policy if exists accounts_select on public.accounts;
drop policy if exists accounts_insert on public.accounts;
drop policy if exists accounts_update on public.accounts;
drop policy if exists accounts_delete on public.accounts;
create policy accounts_select on public.accounts for select using (user_id = auth.uid());
create policy accounts_insert on public.accounts for insert with check (user_id = auth.uid());
create policy accounts_update on public.accounts for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy accounts_delete on public.accounts for delete using (user_id = auth.uid());

-- ── Fin de la migración ──────────────────────────────────────────────────
