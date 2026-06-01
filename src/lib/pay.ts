import type { Shift, Settings } from './db'
import { startOfDay, startOfWeek, startOfMonth, endOfDay, endOfWeek, endOfMonth } from 'date-fns'

export function shiftDurationMs(shift: Shift): number {
  const end = shift.clockOut ?? Date.now()
  return Math.max(0, end - shift.clockIn - shift.breakMinutes * 60 * 1000)
}

export function shiftHours(shift: Shift): number {
  return shiftDurationMs(shift) / 1000 / 3600
}

export function calculatePay(hours: number, settings: Settings): number {
  const { hourlyRate, overtimeThreshold, overtimeMultiplier } = settings
  if (hours <= overtimeThreshold) return hours * hourlyRate
  const regular = overtimeThreshold * hourlyRate
  const ot = (hours - overtimeThreshold) * hourlyRate * overtimeMultiplier
  return regular + ot
}

export function shiftsEarnings(shifts: Shift[], settings: Settings): number {
  return shifts.reduce((sum, s) => sum + calculatePay(shiftHours(s), settings), 0)
}

export function localDateKey(d = new Date()): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)
}

export function formatDuration(ms: number): string {
  const totalSec = Math.floor(ms / 1000)
  const h = Math.floor(totalSec / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const s = totalSec % 60
  if (h > 0) return `${h}h ${m}m`
  return `${m}m ${s}s`
}

export function formatHours(hours: number): string {
  const h = Math.floor(hours)
  const m = Math.round((hours - h) * 60)
  if (h === 0) return `${m}m`
  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
}

export interface PayPeriodStats {
  totalHours: number
  totalEarnings: number
  projectedEarnings: number
  shifts: Shift[]
}

export function getPayStats(shifts: Shift[], settings: Settings, periodStart: Date, periodEnd: Date): PayPeriodStats {
  const periodShifts = shifts.filter(s =>
    s.clockIn >= periodStart.getTime() && s.clockIn <= periodEnd.getTime()
  )
  const totalHours = periodShifts.reduce((sum, s) => sum + shiftHours(s), 0)
  const totalEarnings = shiftsEarnings(periodShifts, settings)
  const now = new Date()
  const elapsed = now.getTime() - periodStart.getTime()
  const total = periodEnd.getTime() - periodStart.getTime()
  const projectedEarnings = elapsed > 0 && elapsed < total
    ? (totalEarnings / elapsed) * total
    : totalEarnings
  return { totalHours, totalEarnings, projectedEarnings, shifts: periodShifts }
}

export function getDayRange(d = new Date()) {
  return { start: startOfDay(d), end: endOfDay(d) }
}

export function getWeekRange(d = new Date()) {
  return { start: startOfWeek(d, { weekStartsOn: 1 }), end: endOfWeek(d, { weekStartsOn: 1 }) }
}

export function getMonthRange(d = new Date()) {
  return { start: startOfMonth(d), end: endOfMonth(d) }
}

export function buildWeeklyChartData(shifts: Shift[], settings: Settings): { day: string; hours: number; earnings: number }[] {
  const { start } = getWeekRange()
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  return days.map((day, i) => {
    const dayStart = new Date(start.getTime() + i * 86400000)
    const dayEnd = new Date(dayStart.getTime() + 86400000 - 1)
    const dayShifts = shifts.filter(s => s.clockIn >= dayStart.getTime() && s.clockIn <= dayEnd.getTime())
    const hours = dayShifts.reduce((sum, s) => sum + shiftHours(s), 0)
    return { day, hours: parseFloat(hours.toFixed(2)), earnings: parseFloat(calculatePay(hours, settings).toFixed(2)) }
  })
}
