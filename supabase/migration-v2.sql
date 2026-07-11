-- ╔══════════════════════════════════════════════════════════════════════╗
-- ║  LifeOS 2.0 — Migración v2 (Fases 5-7): áreas, objetivos, rutinas,     ║
-- ║  recurrencia y modo de vida.                                           ║
-- ║  Ejecutar DESPUÉS de schema.sql, en el SQL Editor de Supabase.         ║
-- ║  Es idempotente: puedes correrla varias veces sin romper nada.         ║
-- ╚══════════════════════════════════════════════════════════════════════╝

create extension if not exists "pgcrypto";

-- ╔══════════════════════════════════════════════════════════════════════╗
-- ║  1. ÁREAS DE VIDA                                                      ║
-- ╚══════════════════════════════════════════════════════════════════════╝
create table if not exists public.life_areas (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  name       text not null,
  icon       text,
  color      text not null default '#6366f1',
  kind       text not null default 'custom'
             check (kind in ('university','work','home','health','finance',
                             'growth','projects','leisure','custom')),
  is_active  boolean not null default true,   -- false = área en pausa (ej. Universidad en vacaciones)
  priority   int not null default 0,          -- >0 = área prioritaria (pesa en el score)
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ╔══════════════════════════════════════════════════════════════════════╗
-- ║  2. OBJETIVOS (metas con tareas hijas)                                 ║
-- ╚══════════════════════════════════════════════════════════════════════╝
create table if not exists public.objectives (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  area_id     uuid references public.life_areas(id) on delete set null,
  title       text not null,
  description text,
  target_date date,
  status      text not null default 'active'
              check (status in ('active','paused','done','dropped')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ╔══════════════════════════════════════════════════════════════════════╗
-- ║  3. RUTINAS (checklists de mañana / noche / día de semana)             ║
-- ╚══════════════════════════════════════════════════════════════════════╝
create table if not exists public.routines (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  name         text not null,
  icon         text,
  trigger_kind text not null default 'morning'
               check (trigger_kind in ('morning','evening','weekday')),
  weekdays     int[] not null default '{0,1,2,3,4,5,6}',
  is_active    boolean not null default true,
  sort_order   int not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create table if not exists public.routine_items (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  routine_id uuid not null references public.routines(id) on delete cascade,
  title      text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.routine_logs (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  routine_item_id uuid not null references public.routine_items(id) on delete cascade,
  log_date        date not null default current_date,
  done            boolean not null default true,
  created_at      timestamptz not null default now(),
  unique (routine_item_id, log_date)
);

-- ╔══════════════════════════════════════════════════════════════════════╗
-- ║  4. COLUMNAS NUEVAS EN TABLAS EXISTENTES (aditivas)                    ║
-- ╚══════════════════════════════════════════════════════════════════════╝
alter table public.tasks
  add column if not exists area_id uuid references public.life_areas(id) on delete set null;
alter table public.tasks
  add column if not exists objective_id uuid references public.objectives(id) on delete set null;
alter table public.tasks
  add column if not exists recurrence jsonb;          -- null = tarea única (formato en docs/EVOLUTION.md)
alter table public.tasks
  add column if not exists last_completed_at timestamptz;  -- última vez hecha (recurrentes)

alter table public.courses
  add column if not exists area_id uuid references public.life_areas(id) on delete set null;

alter table public.profiles
  add column if not exists life_mode text not null default 'semestre'
  check (life_mode in ('semestre','vacaciones'));

-- ╔══════════════════════════════════════════════════════════════════════╗
-- ║  5. ÍNDICES                                                            ║
-- ╚══════════════════════════════════════════════════════════════════════╝
create index if not exists idx_life_areas_user     on public.life_areas(user_id);
create index if not exists idx_objectives_user     on public.objectives(user_id, area_id);
create index if not exists idx_routines_user       on public.routines(user_id);
create index if not exists idx_routine_items_rout  on public.routine_items(routine_id);
create index if not exists idx_routine_logs_item   on public.routine_logs(routine_item_id, log_date);
create index if not exists idx_tasks_area          on public.tasks(area_id);

-- ╔══════════════════════════════════════════════════════════════════════╗
-- ║  6. updated_at AUTOMÁTICO en tablas nuevas                             ║
-- ╚══════════════════════════════════════════════════════════════════════╝
do $$
declare t text;
begin
  foreach t in array array['life_areas','objectives','routines'] loop
    execute format('drop trigger if exists trg_%1$s_updated on public.%1$I;', t);
    execute format(
      'create trigger trg_%1$s_updated before update on public.%1$I
         for each row execute function public.set_updated_at();', t);
  end loop;
end $$;

-- ╔══════════════════════════════════════════════════════════════════════╗
-- ║  7. ROW LEVEL SECURITY en tablas nuevas                                ║
-- ╚══════════════════════════════════════════════════════════════════════╝
do $$
declare t text;
begin
  foreach t in array array['life_areas','objectives','routines','routine_items','routine_logs'] loop
    execute format('alter table public.%I enable row level security;', t);
    execute format('drop policy if exists %1$s_select on public.%1$I;', t);
    execute format('drop policy if exists %1$s_insert on public.%1$I;', t);
    execute format('drop policy if exists %1$s_update on public.%1$I;', t);
    execute format('drop policy if exists %1$s_delete on public.%1$I;', t);
    execute format('create policy %1$s_select on public.%1$I for select using (user_id = auth.uid());', t);
    execute format('create policy %1$s_insert on public.%1$I for insert with check (user_id = auth.uid());', t);
    execute format('create policy %1$s_update on public.%1$I for update using (user_id = auth.uid()) with check (user_id = auth.uid());', t);
    execute format('create policy %1$s_delete on public.%1$I for delete using (user_id = auth.uid());', t);
  end loop;
end $$;

-- ╔══════════════════════════════════════════════════════════════════════╗
-- ║  8. SEMILLA DE ÁREAS POR DEFECTO                                       ║
-- ╚══════════════════════════════════════════════════════════════════════╝
create or replace function public.seed_default_areas(uid uuid)
returns void
language plpgsql
security definer
set search_path = public as $$
begin
  insert into public.life_areas (user_id, name, icon, color, kind, sort_order)
  select uid, x.name, x.icon, x.color, x.kind, x.ord
  from (values
    ('Universidad',        '🎓', '#6366f1', 'university', 1),
    ('Trabajo',            '💼', '#06b6d4', 'work',       2),
    ('Hogar',              '🏠', '#f59e0b', 'home',       3),
    ('Salud',              '❤️', '#ef4444', 'health',     4),
    ('Finanzas',           '💰', '#22c55e', 'finance',    5),
    ('Desarrollo personal','📖', '#a855f7', 'growth',     6),
    ('Proyectos',          '💻', '#ec4899', 'projects',   7),
    ('Ocio',               '🎮', '#64748b', 'leisure',    8)
  ) as x(name, icon, color, kind, ord)
  where not exists (
    select 1 from public.life_areas a where a.user_id = uid and a.kind = x.kind
  );
end;
$$;

-- Los usuarios nuevos reciben sus áreas al registrarse (extiende handle_new_user)
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, display_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  perform public.seed_default_areas(new.id);
  return new;
end;
$$;

-- ╔══════════════════════════════════════════════════════════════════════╗
-- ║  9. BACKFILL para usuarios y datos existentes                          ║
-- ╚══════════════════════════════════════════════════════════════════════╝
-- 9a. Áreas por defecto para todos los perfiles existentes
do $$
declare p record;
begin
  for p in select id from public.profiles loop
    perform public.seed_default_areas(p.id);
  end loop;
end $$;

-- 9b. Ramos existentes -> área Universidad
update public.courses c
   set area_id = a.id
  from public.life_areas a
 where c.area_id is null
   and a.user_id = c.user_id
   and a.kind = 'university';

-- 9c. Tareas con ramo -> área Universidad
update public.tasks t
   set area_id = a.id
  from public.life_areas a
 where t.area_id is null
   and t.course_id is not null
   and a.user_id = t.user_id
   and a.kind = 'university';

-- ── Fin de la migración v2 ───────────────────────────────────────────────
