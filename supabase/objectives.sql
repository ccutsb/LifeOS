-- ╔══════════════════════════════════════════════════════════════════════╗
-- ║  Migración: Objetivos de vida (life_goals)                            ║
-- ║  Ejecútala en el SQL Editor de Supabase si ya tenías la base creada.  ║
-- ║  Es idempotente. (Si corres schema.sql actualizado, NO la necesitas.) ║
-- ╚══════════════════════════════════════════════════════════════════════╝

create extension if not exists "pgcrypto";

-- 1) Tabla de objetivos de vida (capa superior que conecta tareas y hábitos)
create table if not exists public.life_goals (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  title       text not null,
  motivation  text,                 -- el "por qué" (motivación)
  area        text not null default 'personal'
              check (area in ('academico','salud','finanzas','carrera','personal','social','otro')),
  color       text not null default '#6366f1',
  target_date date,
  status      text not null default 'active' check (status in ('active','done','archived')),
  sort_order  int not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- 2) Vincular tareas y hábitos a un objetivo (opcional)
alter table public.tasks  add column if not exists goal_id uuid references public.life_goals(id) on delete set null;
alter table public.habits add column if not exists goal_id uuid references public.life_goals(id) on delete set null;

-- 3) Índices
create index if not exists idx_life_goals_user on public.life_goals(user_id) where status <> 'archived';
create index if not exists idx_tasks_goal       on public.tasks(goal_id);
create index if not exists idx_habits_goal      on public.habits(goal_id);

-- 4) updated_at automático
drop trigger if exists trg_life_goals_updated on public.life_goals;
create trigger trg_life_goals_updated
  before update on public.life_goals
  for each row execute function public.set_updated_at();

-- 5) Row Level Security
alter table public.life_goals enable row level security;
drop policy if exists life_goals_select on public.life_goals;
drop policy if exists life_goals_insert on public.life_goals;
drop policy if exists life_goals_update on public.life_goals;
drop policy if exists life_goals_delete on public.life_goals;
create policy life_goals_select on public.life_goals for select using (user_id = auth.uid());
create policy life_goals_insert on public.life_goals for insert with check (user_id = auth.uid());
create policy life_goals_update on public.life_goals for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy life_goals_delete on public.life_goals for delete using (user_id = auth.uid());

-- ── Fin de la migración ──────────────────────────────────────────────────
