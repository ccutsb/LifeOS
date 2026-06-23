// Notificaciones locales en el dispositivo (sin servidor).
// En iOS, las notificaciones SOLO funcionan con la PWA instalada (iOS 16.4+)
// y deben mostrarse a través del registro del Service Worker, no con `new Notification()`.

export type NotifPermission = 'default' | 'granted' | 'denied' | 'unsupported'

/** ¿La app corre como PWA instalada (standalone)? Necesario en iPhone para notificar. */
export function isStandalone(): boolean {
  if (typeof window === 'undefined') return false
  // iOS expone navigator.standalone; el resto usa display-mode: standalone.
  const iosStandalone = (window.navigator as unknown as { standalone?: boolean }).standalone === true
  const mql = window.matchMedia?.('(display-mode: standalone)').matches ?? false
  return iosStandalone || mql
}

export function isIOS(): boolean {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent
  return /iPad|iPhone|iPod/.test(ua) || (ua.includes('Macintosh') && 'ontouchend' in document)
}

export function notifPermission(): NotifPermission {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported'
  return Notification.permission as NotifPermission
}

/** Pide permiso de notificaciones (debe llamarse desde un gesto del usuario). */
export async function requestNotifPermission(): Promise<NotifPermission> {
  if (!('Notification' in window)) return 'unsupported'
  try {
    return (await Notification.requestPermission()) as NotifPermission
  } catch {
    return Notification.permission as NotifPermission
  }
}

/** Muestra una notificación local YA, vía el Service Worker (compatible con iOS). */
export async function showLocalNotification(
  title: string,
  options: NotificationOptions & { url?: string } = {},
): Promise<boolean> {
  if (notifPermission() !== 'granted') return false
  const { url = '/', ...rest } = options
  try {
    const reg = await navigator.serviceWorker?.ready
    const opts: NotificationOptions = {
      icon: '/pwa-192x192.png',
      badge: '/pwa-192x192.png',
      data: { url },
      ...rest,
    }
    if (reg) {
      await reg.showNotification(title, opts)
      return true
    }
    // Fallback para navegadores de escritorio sin SW listo.
    new Notification(title, opts)
    return true
  } catch {
    return false
  }
}

/** Notificación de prueba para que el usuario confirme que todo funciona en su teléfono. */
export async function sendTestNotification(): Promise<boolean> {
  return showLocalNotification('LifeOS ✅', {
    body: '¡Listo! Las notificaciones funcionan en este dispositivo.',
    tag: 'lifeos-test',
    url: '/',
  })
}
