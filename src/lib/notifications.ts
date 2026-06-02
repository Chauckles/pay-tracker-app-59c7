import type { Settings } from './db'

export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) return false
  if (Notification.permission === 'granted') return true
  const result = await Notification.requestPermission()
  return result === 'granted'
}

function timeToMs(timeStr: string): number {
  const [h, m] = timeStr.split(':').map(Number)
  const target = new Date()
  target.setHours(h, m, 0, 0)
  if (target.getTime() <= Date.now()) target.setDate(target.getDate() + 1)
  return target.getTime() - Date.now()
}

function notify(title: string, body: string) {
  if (Notification.permission === 'granted') {
    new Notification(title, {
      body,
      icon: '/pay-tracker-app-59c7/icons/icon-192.png',
      badge: '/pay-tracker-app-59c7/icons/icon-192.png',
    })
  }
}

const timers: ReturnType<typeof setTimeout>[] = []

export function clearAllReminders() {
  timers.forEach(clearTimeout)
  timers.length = 0
}

export function scheduleReminders(settings: Settings) {
  clearAllReminders()
  if (!settings.notificationsEnabled || Notification.permission !== 'granted') return

  if (settings.reminderClockIn) {
    timers.push(setTimeout(() => notify('⏰ Time to clock in!', `Your scheduled start is ${settings.reminderClockIn}. Don't forget!`), timeToMs(settings.reminderClockIn)))
  }

  if (settings.reminderClockOut) {
    timers.push(setTimeout(() => notify('🏁 Time to clock out!', `Your scheduled end is ${settings.reminderClockOut}. Did you clock out?`), timeToMs(settings.reminderClockOut)))
  }

  if (settings.lunchTime) {
    const lunchOutDelay = timeToMs(settings.lunchTime)
    timers.push(setTimeout(() => notify('🍽️ Lunch time!', `Time to clock out for your ${settings.lunchDurationMinutes}-minute lunch break.`), lunchOutDelay))

    // Lunch return reminder
    const [lh, lm] = settings.lunchTime.split(':').map(Number)
    const returnDate = new Date()
    returnDate.setHours(lh, lm + settings.lunchDurationMinutes, 0, 0)
    if (returnDate.getTime() <= Date.now()) returnDate.setDate(returnDate.getDate() + 1)
    timers.push(setTimeout(() => notify('👋 Back to work!', 'Your lunch break is over — time to clock back in.'), returnDate.getTime() - Date.now()))
  }

  for (const brk of settings.extraBreaks) {
    const delay = timeToMs(brk.time)
    timers.push(setTimeout(() => notify(`☕ Break time: ${brk.label}`, `Time for your ${brk.durationMinutes}-minute ${brk.label} break.`), delay))

    const [bh, bm] = brk.time.split(':').map(Number)
    const returnDate = new Date()
    returnDate.setHours(bh, bm + brk.durationMinutes, 0, 0)
    if (returnDate.getTime() <= Date.now()) returnDate.setDate(returnDate.getDate() + 1)
    timers.push(setTimeout(() => notify(`👋 Break over: ${brk.label}`, 'Your break is done — time to clock back in.'), returnDate.getTime() - Date.now()))
  }
}
