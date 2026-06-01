export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) return false
  if (Notification.permission === 'granted') return true
  const result = await Notification.requestPermission()
  return result === 'granted'
}

export function scheduleLocalNotification(title: string, body: string, delayMs: number): ReturnType<typeof setTimeout> {
  return setTimeout(() => {
    if (Notification.permission === 'granted') {
      new Notification(title, { body, icon: '/pay-tracker-app-59c7/icons/icon-192.png', badge: '/pay-tracker-app-59c7/icons/icon-192.png' })
    }
  }, delayMs)
}

function timeToMs(timeStr: string): number {
  const [h, m] = timeStr.split(':').map(Number)
  const now = new Date()
  const target = new Date()
  target.setHours(h, m, 0, 0)
  if (target.getTime() <= now.getTime()) {
    target.setDate(target.getDate() + 1)
  }
  return target.getTime() - now.getTime()
}

const timers: ReturnType<typeof setTimeout>[] = []

export function clearAllReminders() {
  timers.forEach(t => clearTimeout(t))
  timers.length = 0
}

export function scheduleReminders(clockInTime: string | null, clockOutTime: string | null) {
  clearAllReminders()
  if (Notification.permission !== 'granted') return

  if (clockInTime) {
    const delay = timeToMs(clockInTime)
    const t = scheduleLocalNotification(
      '⏰ Time to clock in!',
      `Your scheduled start time is ${clockInTime}. Don't forget to clock in!`,
      delay
    )
    timers.push(t)
  }

  if (clockOutTime) {
    const delay = timeToMs(clockOutTime)
    const t = scheduleLocalNotification(
      '🏁 Time to clock out!',
      `Your scheduled end time is ${clockOutTime}. Did you clock out?`,
      delay
    )
    timers.push(t)
  }
}
