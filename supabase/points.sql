-- ╔══════════════════════════════════════════════════════════════════════╗
-- ║  Migración: Gamificación server-authoritative (puntos por triggers)    ║
-- ║  Ejecútala en el SQL Editor de Supabase. Es idempotente.               ║
-- ║                                                                        ║
-- ║  Antes los puntos se insertaban desde el cliente, lo que permitía      ║
-- ║  duplicarlos (re-marcar una tarea sumaba +10 cada vez) y manipularlos. ║
-- ║  Ahora Postgres los otorga SOLO en transiciones reales de estado.      ║
-- ║  Tras correr esto, el cliente deja de insertar en points_ledger        ║
-- ║  (excepto el canje de recompensas, que es un débito explícito).        ║
-- ╚══════════════════════════════════════════════════════════════════════╝

-- Puntos por acción (deben coincidir con las constantes del front).
--   tarea completada  = +10
--   hábito cumplido   = +5
--   pomodoro completo = +15

-- ── Tareas: +10 al completar, −10 al reabrir (solo en transición real) ────
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

-- ── Hábitos: +5 al registrar cumplido, −5 al borrar el registro ──────────
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

-- ── Enfoque: +15 al completar una sesión de foco ─────────────────────────
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

-- ── Fin de la migración ──────────────────────────────────────────────────
