-- Generación automática de recordatorios desde evaluaciones, tareas y clases.
-- Ejecuta este archivo en el SQL Editor (después de schema.sql).
-- La Edge Function `send-reminders` la invoca, y/o puedes agendarla con cron.

create or replace function public.generate_due_reminders()
returns void
language plpgsql
security definer
set search_path = public as $$
begin
  -- Evaluaciones sin nota: avisar 24 h antes
  insert into public.reminders (user_id, title, body, remind_at, source_type, source_id, channel)
  select e.user_id,
         'Evaluación pronto: ' || e.title,
         c.name,
         e.due_at - interval '24 hours',
         'evaluation', e.id, 'push'
  from public.evaluations e
  join public.courses c on c.id = e.course_id
  where e.due_at is not null
    and e.grade is null
    and e.due_at between now() and now() + interval '7 days'
    and not exists (
      select 1 from public.reminders r
      where r.source_type = 'evaluation' and r.source_id = e.id
    );

  -- Tareas activas con vencimiento: avisar 2 h antes
  insert into public.reminders (user_id, title, body, remind_at, source_type, source_id, channel)
  select t.user_id,
         'Vence pronto: ' || t.title,
         null,
         t.due_at - interval '2 hours',
         'task', t.id, 'push'
  from public.tasks t
  where t.due_at is not null
    and t.status in ('inbox', 'pending', 'in_progress')
    and t.due_at between now() and now() + interval '7 days'
    and not exists (
      select 1 from public.reminders r
      where r.source_type = 'task' and r.source_id = t.id
    );
end;
$$;

-- ── Cron (requiere extensiones pg_cron y pg_net, habilitadas en Supabase) ──
-- En el Dashboard: Database -> Extensions -> habilita "pg_cron" y "pg_net".
-- Luego ejecuta (reemplaza <PROJECT_REF> y <SERVICE_ROLE_KEY>):
--
-- 1) Generar recordatorios cada 30 minutos:
-- select cron.schedule('generar-recordatorios', '*/30 * * * *', $$ select public.generate_due_reminders(); $$);
--
-- 2) Enviar push cada 5 minutos llamando a la Edge Function:
-- select cron.schedule('enviar-recordatorios', '*/5 * * * *', $$
--   select net.http_post(
--     url := 'https://<PROJECT_REF>.functions.supabase.co/send-reminders',
--     headers := jsonb_build_object('Authorization', 'Bearer <SERVICE_ROLE_KEY>', 'Content-Type', 'application/json')
--   );
-- $$);
