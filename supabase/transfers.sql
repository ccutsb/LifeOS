-- ╔══════════════════════════════════════════════════════════════════════╗
-- ║  Migración: Transferencias entre cuentas (transfers)                  ║
-- ║  Ejecútala en el SQL Editor de Supabase. Es idempotente.              ║
-- ║                                                                        ║
-- ║  Una transferencia mueve dinero entre DOS billeteras propias. Se       ║
-- ║  guarda como UNA sola fila: el saldo de cada cuenta se deriva          ║
-- ║  (saldo inicial + ingresos − gastos − transferencias_salida            ║
-- ║  + transferencias_entrada), así que la operación es atómica por        ║
-- ║  naturaleza: o la fila existe (mueve el dinero en ambas cuentas) o no. ║
-- ║  NO toca la tabla transactions, por lo que NO afecta los cálculos de   ║
-- ║  Ingresos, Gastos ni Presupuestos.                                     ║
-- ╚══════════════════════════════════════════════════════════════════════╝

create extension if not exists "pgcrypto";

create table if not exists public.transfers (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  from_account_id uuid not null references public.accounts(id) on delete cascade,
  to_account_id   uuid not null references public.accounts(id) on delete cascade,
  amount          numeric(14,2) not null check (amount > 0),
  description     text,
  occurred_on     date not null default current_date,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  constraint transfers_distinct_accounts check (from_account_id <> to_account_id)
);

create index if not exists idx_transfers_user on public.transfers(user_id, occurred_on);
create index if not exists idx_transfers_from on public.transfers(from_account_id);
create index if not exists idx_transfers_to   on public.transfers(to_account_id);

-- updated_at automático
drop trigger if exists trg_transfers_updated on public.transfers;
create trigger trg_transfers_updated
  before update on public.transfers
  for each row execute function public.set_updated_at();

-- Row Level Security (cada usuario solo ve y edita SUS transferencias)
alter table public.transfers enable row level security;
drop policy if exists transfers_select on public.transfers;
drop policy if exists transfers_insert on public.transfers;
drop policy if exists transfers_update on public.transfers;
drop policy if exists transfers_delete on public.transfers;
create policy transfers_select on public.transfers for select using (user_id = auth.uid());
create policy transfers_insert on public.transfers for insert with check (user_id = auth.uid());
create policy transfers_update on public.transfers for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy transfers_delete on public.transfers for delete using (user_id = auth.uid());

-- ── Fin de la migración ──────────────────────────────────────────────────
