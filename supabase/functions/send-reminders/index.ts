// Edge Function: envía las notificaciones push de los recordatorios vencidos.
// Despliegue:  supabase functions deploy send-reminders
// Requiere secrets: VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY (y SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY ya existen).
//
// Llama esta función con un cron cada pocos minutos (ver docs/DEPLOYMENT.md).

import webpush from 'npm:web-push@3.6.7'
import { createClient } from 'npm:@supabase/supabase-js@2'

Deno.serve(async () => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  webpush.setVapidDetails(
    'mailto:lifeos@example.com',
    Deno.env.get('VAPID_PUBLIC_KEY')!,
    Deno.env.get('VAPID_PRIVATE_KEY')!,
  )

  const nowIso = new Date().toISOString()

  // (Opcional) genera recordatorios desde evaluaciones/tareas próximas
  await supabase.rpc('generate_due_reminders')

  const { data: due } = await supabase
    .from('reminders')
    .select('*')
    .lte('remind_at', nowIso)
    .eq('sent', false)
    .limit(200)

  let sent = 0
  for (const r of due ?? []) {
    const { data: subs } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('user_id', r.user_id)

    for (const s of subs ?? []) {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          JSON.stringify({ title: r.title, body: r.body ?? '', url: '/' }),
        )
        sent++
      } catch (e) {
        // Suscripción vencida/expirada -> la eliminamos
        const status = (e as { statusCode?: number }).statusCode
        if (status === 404 || status === 410) {
          await supabase.from('push_subscriptions').delete().eq('id', s.id)
        }
      }
    }
    await supabase.from('reminders').update({ sent: true, sent_at: nowIso }).eq('id', r.id)
  }

  return new Response(JSON.stringify({ processed: due?.length ?? 0, sent }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
