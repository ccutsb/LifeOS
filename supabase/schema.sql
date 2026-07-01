-- ╔══════════════════════════════════════════════════════════════════════╗
-- ║  LifeOS — Esquema completo (Supabase / PostgreSQL)                     ║
-- ║  Ejecuta este archivo en:  Supabase Dashboard -> SQL Editor -> New     ║
-- ║  Es idempotente: puedes volver a correrlo sin romper nada.             ║
-- ╚══════════════════════════════════════════════════════════════════════╝

-- ── Extensiones ──────────────────────────────────────────────────────────
create extension if not exists "pgcrypto"; -- gen_random_uuid()

-- ── Utilidad: mantener updated_at ────────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ╔══════════════════════════════════════════════════════════════════════╗
-- ║  PERFIL                                                                ║
-- ╚══════════════════════════════════════════════════════════════════════╝
create table if not exists public.profiles (
  id              uuid primary key references auth.users(id) on delete cascade,
  email           text,
  display_name    text,
  timezone        text not null default 'America/Santiago',
  currency        text not null default 'CLP',
  theme           text not null default 'dark',
  points          int  not null default 0,          -- saldo de puntos (cache del ledger)
  onboarding_done boolean not null default false,
  settings        jsonb not null default '{}'::jsonb,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- Crea el perfil automáticamente al registrarse un usuario
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
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ╔══════════════════════════════════════════════════════════════════════╗
-- ║  UNIVERSIDAD                                                           ║
-- ╚══════════════════════════════════════════════════════════════════════╝
create table if not exists public.semesters (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  name       text not null,
  start_date date,
  end_date   date,
  is_active  boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.courses (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references auth.users(id) on delete cascade,
  semester_id         uuid references public.semesters(id) on delete set null,
  name                text not null,
  code                text,
  teacher             text,
  color               text not null default '#6366f1',
  credits             int,
  grade_min           numeric(3,1) not null default 1.0,
  grade_max           numeric(3,1) not null default 7.0,
  passing_grade       numeric(3,1) not null default 4.0,
  exemption_grade     numeric(3,1),               -- eximición (NULL = no exime)
  target_grade        numeric(3,1) default 5.0,
  attendance_required numeric(5,2),               -- % de asistencia mínima
  archived            boolean not null default false,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- Horario semanal de cada ramo (weekday: 0=Dom ... 6=Sáb, igual que JS getDay())
create table if not exists public.course_schedule (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  course_id  uuid not null references public.courses(id) on delete cascade,
  weekday    int  not null check (weekday between 0 and 6),
  start_time time not null,
  end_time   time not null,
  room       text,
  modality   text not null default 'presencial' check (modality in ('presencial','online','hibrido')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Evaluaciones con nota (pruebas, exámenes, trabajos calificados, etc.)
create table if not exists public.evaluations (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  course_id  uuid not null references public.courses(id) on delete cascade,
  title      text not null,
  type       text not null default 'prueba'
             check (type in ('prueba','examen','control','quiz','trabajo','laboratorio','tarea','otro')),
  due_at     timestamptz,
  weight     numeric(5,2) not null default 0,  -- ponderación en %
  grade      numeric(3,1),                     -- nota obtenida (NULL = pendiente)
  notes      text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ╔══════════════════════════════════════════════════════════════════════╗
-- ║  TAREAS (GTD + Eisenhower) — incluye "trabajos por hacer"             ║
-- ╚══════════════════════════════════════════════════════════════════════╝
create table if not exists public.tasks (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users(id) on delete cascade,
  course_id        uuid references public.courses(id) on delete set null,
  evaluation_id    uuid references public.evaluations(id) on delete set null,
  title            text not null,
  description      text,
  due_at           timestamptz,
  status           text not null default 'inbox'
                   check (status in ('inbox','pending','in_progress','done','cancelled')),
  is_important     boolean not null default false,
  is_urgent        boolean not null default false,
  -- Cuadrante Eisenhower calculado automáticamente
  quadrant text generated always as (
    case
      when is_urgent and is_important then 'do'         -- Hacer ya
      when not is_urgent and is_important then 'schedule' -- Agendar
      when is_urgent and not is_important then 'delegate' -- Delegar
      else 'eliminate'                                    -- Eliminar
    end
  ) stored,
  next_action      text,                 -- GTD: la próxima acción física concreta
  estimated_minutes int,
  energy           text check (energy in ('low','medium','high')),
  completed_at     timestamptz,
  sort_order       int not null default 0,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- ╔══════════════════════════════════════════════════════════════════════╗
-- ║  HÁBITOS (Atomic Habits)                                              ║
-- ╚══════════════════════════════════════════════════════════════════════╝
create table if not exists public.habits (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  name         text not null,
  type         text not null default 'custom'
               check (type in ('sleep','attendance','study','exercise','food','custom')),
  icon         text,
  color        text not null default '#22c55e',
  cue          text,                 -- señal / disparador
  reward       text,                 -- recompensa inmediata
  target_value numeric not null default 1,
  unit         text,                 -- ej: horas, vasos, km
  period       text not null default 'daily' check (period in ('daily','weekly')),
  weekdays     int[] not null default '{0,1,2,3,4,5,6}',
  reminder_time time,
  is_active    boolean not null default true,
  sort_order   int not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create table if not exists public.habit_logs (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  habit_id   uuid not null references public.habits(id) on delete cascade,
  log_date   date not null default current_date,
  value      numeric not null default 1,
  done       boolean not null default true,
  note       text,
  created_at timestamptz not null default now(),
  unique (habit_id, log_date)
);

-- ╔══════════════════════════════════════════════════════════════════════╗
-- ║  ENFOQUE (Pomodoro / Deep Work)                                       ║
-- ╚══════════════════════════════════════════════════════════════════════╝
create table if not exists public.focus_sessions (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  task_id         uuid references public.tasks(id) on delete set null,
  course_id       uuid references public.courses(id) on delete set null,
  kind            text not null default 'focus' check (kind in ('focus','short_break','long_break')),
  started_at      timestamptz not null default now(),
  ended_at        timestamptz,
  planned_minutes int not null default 25,
  actual_minutes  int,
  completed       boolean not null default false,
  interruptions   int not null default 0,
  created_at      timestamptz not null default now()
);

-- ╔══════════════════════════════════════════════════════════════════════╗
-- ║  RECOMPENSAS (Behavioral Design)                                      ║
-- ╚══════════════════════════════════════════════════════════════════════╝
create table if not exists public.points_ledger (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  delta      int not null,            -- +ganados / -gastados
  reason     text,
  source     text,                    -- task / habit / focus / reward
  source_id  uuid,
  created_at timestamptz not null default now()
);

create table if not exists public.rewards (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  title      text not null,
  cost       int not null default 100,
  icon       text,
  claimed    boolean not null default false,
  claimed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Aplica el delta de puntos al perfil cada vez que se inserta en el ledger
create or replace function public.apply_points()
returns trigger language plpgsql as $$
begin
  update public.profiles
     set points = points + new.delta, updated_at = now()
   where id = new.user_id;
  return new;
end;
$$;

drop trigger if exists trg_apply_points on public.points_ledger;
create trigger trg_apply_points
  after insert on public.points_ledger
  for each row execute function public.apply_points();

-- ── Gamificación server-authoritative (los puntos los otorga la BD) ───────
-- Evita doble conteo (re-marcar una tarea) y manipulación desde el cliente.
-- Tarea: +10 al completar, −10 al reabrir (solo en transición real de estado).
create or replace function public.points_on_task_status()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.status = 'done' and old.status is distinct from 'done' then
    insert into public.points_ledger (user_id, delta, reason, source, source_id)
    values (new.user_id, 10, 'Tarea completada', 'task', new.id);
  elsif old.status = 'done' and new.status is distinct from 'done' then
    insert into public.points_ledger (user_id, delta, reason, source, source_id)
    values (new.user_id, -10, 'Tarea reabierta', 'task', new.id);
  end if;
  return new;
end;
$$;

drop trigger if exists trg_points_task on public.tasks;
create trigger trg_points_task
  after update of status on public.tasks
  for each row execute function public.points_on_task_status();

-- Hábito: +5 al registrar cumplido, −5 al borrar el registro.
create or replace function public.points_on_habit_log_insert()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.done then
    insert into public.points_ledger (user_id, delta, reason, source, source_id)
    values (new.user_id, 5, 'Hábito cumplido', 'habit', new.habit_id);
  end if;
  return new;
end;
$$;

create or replace function public.points_on_habit_log_delete()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if old.done then
    insert into public.points_ledger (user_id, delta, reason, source, source_id)
    values (old.user_id, -5, 'Hábito desmarcado', 'habit', old.habit_id);
  end if;
  return old;
end;
$$;

drop trigger if exists trg_points_habit_log_ins on public.habit_logs;
create trigger trg_points_habit_log_ins
  after insert on public.habit_logs
  for each row execute function public.points_on_habit_log_insert();

drop trigger if exists trg_points_habit_log_del on public.habit_logs;
create trigger trg_points_habit_log_del
  after delete on public.habit_logs
  for each row execute function public.points_on_habit_log_delete();

-- Enfoque: +15 al completar una sesión de foco.
create or replace function public.points_on_focus_session()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.kind = 'focus' and new.completed then
    insert into public.points_ledger (user_id, delta, reason, source, source_id)
    values (new.user_id, 15, 'Pomodoro completado', 'focus', new.id);
  end if;
  return new;
end;
$$;

drop trigger if exists trg_points_focus on public.focus_sessions;
create trigger trg_points_focus
  after insert on public.focus_sessions
  for each row execute function public.points_on_focus_session();

-- ╔══════════════════════════════════════════════════════════════════════╗
-- ║  FINANZAS                                                              ║
-- ╚══════════════════════════════════════════════════════════════════════╝

-- Billeteras / cuentas (MercadoPago, Banco Ripley, Scotiabank, Pluxee beca, efectivo…)
create table if not exists public.accounts (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  name            text not null,
  kind            text not null default 'other'
                  check (kind in ('bank','wallet','cash','benefit','credit','savings','other')),
  color           text not null default '#22c55e',
  icon            text,
  initial_balance numeric(14,2) not null default 0,   -- saldo de partida al crear la cuenta
  archived        boolean not null default false,
  sort_order      int not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create table if not exists public.transactions (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  type         text not null check (type in ('income','expense')),
  amount       numeric(14,2) not null,
  category     text,
  description  text,
  occurred_on  date not null default current_date,
  account      text,                              -- (legado) nombre de cuenta en texto libre
  account_id   uuid references public.accounts(id) on delete set null,
  is_recurring boolean not null default false,
  recurrence   jsonb,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- Para bases de datos existentes: agrega la columna sin romper datos previos.
alter table public.transactions
  add column if not exists account_id uuid references public.accounts(id) on delete set null;

create table if not exists public.budgets (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  category   text not null,
  amount     numeric(14,2) not null,
  period     text not null default 'monthly' check (period in ('monthly','weekly')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.savings_goals (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users(id) on delete cascade,
  name           text not null,
  target_amount  numeric(14,2) not null,
  current_amount numeric(14,2) not null default 0,
  deadline       date,
  color          text not null default '#06b6d4',
  achieved       boolean not null default false,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create table if not exists public.savings_rules (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  goal_id    uuid references public.savings_goals(id) on delete cascade,
  kind       text not null default 'percent' check (kind in ('percent','fixed')),
  value      numeric(14,2) not null,    -- % (0-100) o monto fijo
  trigger    text not null default 'on_income' check (trigger in ('on_income','monthly')),
  is_active  boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Transferencias entre cuentas propias (una fila mueve dinero de A a B).
-- El saldo de cada cuenta se deriva, por lo que NO afecta ingresos/gastos/presupuestos.
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

-- ╔══════════════════════════════════════════════════════════════════════╗
-- ║  OBJETIVOS DE VIDA (capa superior que conecta tareas y hábitos)        ║
-- ╚══════════════════════════════════════════════════════════════════════╝
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

-- Vincular tareas y hábitos a un objetivo (opcional). Idempotente para bases existentes.
alter table public.tasks  add column if not exists goal_id uuid references public.life_goals(id) on delete set null;
alter table public.habits add column if not exists goal_id uuid references public.life_goals(id) on delete set null;

-- ╔══════════════════════════════════════════════════════════════════════╗
-- ║  CALENDARIO / RECORDATORIOS / NOTIFICACIONES                          ║
-- ╚══════════════════════════════════════════════════════════════════════╝
create table if not exists public.events (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  title      text not null,
  starts_at  timestamptz not null,
  ends_at    timestamptz,
  all_day    boolean not null default false,
  type       text not null default 'event',
  course_id  uuid references public.courses(id) on delete set null,
  location   text,
  notes      text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.reminders (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  title       text not null,
  body        text,
  remind_at   timestamptz not null,
  source_type text,                    -- task / evaluation / class / habit / event
  source_id   uuid,
  channel     text not null default 'push' check (channel in ('local','push','both')),
  sent        boolean not null default false,
  sent_at     timestamptz,
  created_at  timestamptz not null default now()
);

create table if not exists public.push_subscriptions (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  endpoint   text not null,
  p256dh     text not null,
  auth       text not null,
  user_agent text,
  created_at timestamptz not null default now(),
  unique (user_id, endpoint)
);

create table if not exists public.notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  title      text not null,
  body       text,
  type       text not null default 'info',
  read       boolean not null default false,
  action_url text,
  created_at timestamptz not null default now()
);

-- ╔══════════════════════════════════════════════════════════════════════╗
-- ║  REVISIÓN SEMANAL                                                      ║
-- ╚══════════════════════════════════════════════════════════════════════╝
create table if not exists public.weekly_reviews (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  week_start      date not null,
  went_well       text,
  went_wrong      text,
  next_priorities text,
  metrics         jsonb not null default '{}'::jsonb,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (user_id, week_start)
);

-- ╔══════════════════════════════════════════════════════════════════════╗
-- ║  ÍNDICES                                                               ║
-- ╚══════════════════════════════════════════════════════════════════════╝
create index if not exists idx_courses_user          on public.courses(user_id);
create index if not exists idx_course_schedule_user  on public.course_schedule(user_id, weekday);
create index if not exists idx_evaluations_course    on public.evaluations(course_id);
create index if not exists idx_evaluations_user_due  on public.evaluations(user_id, due_at);
create index if not exists idx_tasks_user_status     on public.tasks(user_id, status);
create index if not exists idx_tasks_user_due        on public.tasks(user_id, due_at);
create index if not exists idx_tasks_goal            on public.tasks(goal_id);
create index if not exists idx_habits_goal           on public.habits(goal_id);
create index if not exists idx_life_goals_user       on public.life_goals(user_id) where status <> 'archived';
create index if not exists idx_habit_logs_habit_date on public.habit_logs(habit_id, log_date);
create index if not exists idx_focus_user            on public.focus_sessions(user_id, started_at);
create index if not exists idx_transactions_user_date on public.transactions(user_id, occurred_on);
create index if not exists idx_transactions_account    on public.transactions(account_id);
create index if not exists idx_accounts_user           on public.accounts(user_id) where archived = false;
create index if not exists idx_transfers_user          on public.transfers(user_id, occurred_on);
create index if not exists idx_transfers_from          on public.transfers(from_account_id);
create index if not exists idx_transfers_to            on public.transfers(to_account_id);
create index if not exists idx_reminders_pending     on public.reminders(remind_at) where sent = false;
create index if not exists idx_events_user_start     on public.events(user_id, starts_at);
create index if not exists idx_notifications_user    on public.notifications(user_id, read);

-- ╔══════════════════════════════════════════════════════════════════════╗
-- ║  VISTA: resumen de notas por ramo (escala 1.0–7.0)                    ║
-- ╚══════════════════════════════════════════════════════════════════════╝
create or replace view public.course_grade_summary
with (security_invoker = true) as
select
  c.id      as course_id,
  c.user_id,
  -- Promedio ponderado SOLO de lo ya calificado
  case
    when sum(e.weight) filter (where e.grade is not null) > 0
    then round(
      sum(e.grade * e.weight) filter (where e.grade is not null)
      / sum(e.weight) filter (where e.grade is not null), 2)
  end as current_average,
  -- Puntos ya asegurados hacia la nota final (sobre 100% de ponderación)
  round(coalesce(sum(e.grade * e.weight) filter (where e.grade is not null), 0) / 100.0, 2) as secured_points,
  coalesce(sum(e.weight), 0)                                   as total_weight,
  coalesce(sum(e.weight) filter (where e.grade is not null), 0) as graded_weight,
  count(e.id)                                                  as evaluations_count,
  count(e.id) filter (where e.grade is not null)               as graded_count
from public.courses c
left join public.evaluations e on e.course_id = c.id
group by c.id, c.user_id;

-- ╔══════════════════════════════════════════════════════════════════════╗
-- ║  updated_at automático en todas las tablas que lo tienen              ║
-- ╚══════════════════════════════════════════════════════════════════════╝
do $$
declare t text;
begin
  foreach t in array array[
    'profiles','semesters','courses','course_schedule','evaluations','tasks',
    'habits','rewards','accounts','transactions','transfers','budgets','savings_goals','savings_rules',
    'life_goals','events','weekly_reviews'
  ] loop
    execute format('drop trigger if exists trg_%1$s_updated on public.%1$I;', t);
    execute format(
      'create trigger trg_%1$s_updated before update on public.%1$I
         for each row execute function public.set_updated_at();', t);
  end loop;
end $$;

-- ╔══════════════════════════════════════════════════════════════════════╗
-- ║  ROW LEVEL SECURITY — cada usuario solo ve y edita SUS datos          ║
-- ╚══════════════════════════════════════════════════════════════════════╝

-- profiles (la fila propia: id = auth.uid())
alter table public.profiles enable row level security;
drop policy if exists profiles_select on public.profiles;
drop policy if exists profiles_insert on public.profiles;
drop policy if exists profiles_update on public.profiles;
create policy profiles_select on public.profiles for select using (id = auth.uid());
create policy profiles_insert on public.profiles for insert with check (id = auth.uid());
create policy profiles_update on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());

-- Resto de tablas (dueño = user_id). Políticas idénticas generadas en bucle.
do $$
declare t text;
begin
  foreach t in array array[
    'semesters','courses','course_schedule','evaluations','tasks',
    'habits','habit_logs','focus_sessions','points_ledger','rewards',
    'accounts','transactions','transfers','budgets','savings_goals','savings_rules',
    'life_goals','events','reminders','push_subscriptions','notifications','weekly_reviews'
  ] loop
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

-- ── Fin del esquema ──────────────────────────────────────────────────────
