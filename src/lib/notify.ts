/** Browser notifications for practice reminders. */

export type Permission = 'granted' | 'denied' | 'default' | 'unsupported'

export const notificationPermission = (): Permission =>
  typeof Notification === 'undefined' ? 'unsupported' : Notification.permission

/**
 * Phones only let websites show notifications through a service worker, so one is registered
 * once the player allows notifications. It caches nothing; it only shows reminders.
 */
const registerWorker = async (): Promise<void> => {
  if (!('serviceWorker' in navigator)) return
  try {
    await navigator.serviceWorker.register('/sw.js')
  } catch (err) {
    console.error('Could not register the notification worker', err)
  }
}

/** Asks the browser for permission. Must be called from a click. */
export const requestNotifications = async (): Promise<Permission> => {
  if (typeof Notification === 'undefined') return 'unsupported'
  try {
    const result = await Notification.requestPermission()
    if (result === 'granted') await registerWorker()
    return result
  } catch (err) {
    console.error('Notification permission request failed', err)
    return notificationPermission()
  }
}

export const showNotification = async (title: string, body: string): Promise<void> => {
  if (notificationPermission() !== 'granted') return
  const options: NotificationOptions = { body, icon: '/apple-touch-icon.png', badge: '/favicon.png', tag: 'coquest-reminder' }
  try {
    const registration = 'serviceWorker' in navigator ? await navigator.serviceWorker.getRegistration() : undefined
    if (registration) {
      await navigator.serviceWorker.ready
      await registration.showNotification(title, options)
      return
    }
    new Notification(title, options)
  } catch (err) {
    console.error('Could not show a notification', err)
  }
}
