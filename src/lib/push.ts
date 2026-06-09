import { supabase } from './supabase'
import { getUserId } from './crud'

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(base64)
  const output = new Uint8Array(new ArrayBuffer(raw.length))
  for (let i = 0; i < raw.length; i++) output[i] = raw.charCodeAt(i)
  return output
}

/**
 * Activa las notificaciones push reales:
 * pide permiso, se suscribe con la clave VAPID y guarda la suscripción en Supabase.
 * En iPhone requiere la PWA instalada en pantalla de inicio (iOS 16.4+).
 */
export async function enablePush(): Promise<{ ok: boolean; message: string }> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    return { ok: false, message: 'Tu dispositivo/navegador no soporta push' }
  }
  const vapid = import.meta.env.VITE_VAPID_PUBLIC_KEY
  if (!vapid) {
    return { ok: false, message: 'Falta configurar VITE_VAPID_PUBLIC_KEY en .env' }
  }
  const permission = await Notification.requestPermission()
  if (permission !== 'granted') {
    return { ok: false, message: 'Permiso de notificaciones denegado' }
  }
  try {
    const reg = await navigator.serviceWorker.ready
    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapid),
    })
    const json = sub.toJSON()
    const user_id = await getUserId()
    const { error } = await supabase.from('push_subscriptions').upsert(
      {
        user_id,
        endpoint: sub.endpoint,
        p256dh: json.keys?.p256dh ?? '',
        auth: json.keys?.auth ?? '',
        user_agent: navigator.userAgent,
      },
      { onConflict: 'user_id,endpoint' },
    )
    if (error) throw error
    return { ok: true, message: 'Notificaciones push activadas 🎉' }
  } catch (e) {
    return { ok: false, message: 'En iPhone, instala la PWA primero (Compartir → Añadir a inicio)' }
  }
}
