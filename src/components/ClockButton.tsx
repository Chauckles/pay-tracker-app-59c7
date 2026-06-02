import { useState } from 'react'
import { Play, Square, Loader2 } from 'lucide-react'
import type { Shift } from '../lib/db'
import { formatDuration, formatCurrency, calculatePay, shiftHours } from '../lib/pay'

interface Props {
  activeShift: Shift | undefined
  activeDuration: number
  hourlyRate: number
  onClockIn: (note?: string) => Promise<void>
  onClockOut: () => Promise<void>
}

export function ClockButton({ activeShift, activeDuration, hourlyRate, onClockIn, onClockOut }: Props) {
  const [loading, setLoading] = useState(false)
  const [note, setNote] = useState('')

  const handle = async () => {
    setLoading(true)
    try {
      if (activeShift) {
        await onClockOut()
      } else {
        await onClockIn(note.trim() || undefined)
        setNote('')
      }
    } finally {
      setLoading(false)
    }
  }

  const currentEarnings = activeShift
    ? calculatePay(shiftHours({ ...activeShift }), { id: 'settings', hourlyRate, overtimeThreshold: 8, overtimeMultiplier: 1.5, weeklyHoursTarget: 40, reminderClockIn: null, reminderClockOut: null, notificationsEnabled: false, lunchTime: null, lunchDurationMinutes: 30, extraBreaks: [] })
    : 0

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Big clock button */}
      <button
        onClick={handle}
        disabled={loading}
        className={`
          relative w-44 h-44 rounded-full flex flex-col items-center justify-center gap-2
          font-bold text-white shadow-2xl transition-all duration-200 active:scale-95
          ${activeShift
            ? 'bg-gradient-to-br from-red-500 to-red-700 shadow-red-500/30'
            : 'bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-emerald-500/30'
          }
        `}
      >
        {loading ? (
          <Loader2 className="w-10 h-10 animate-spin" />
        ) : activeShift ? (
          <>
            <Square className="w-8 h-8 fill-white" />
            <span className="text-sm font-semibold tracking-wide">CLOCK OUT</span>
          </>
        ) : (
          <>
            <Play className="w-8 h-8 fill-white" />
            <span className="text-sm font-semibold tracking-wide">CLOCK IN</span>
          </>
        )}
        {/* Pulse ring when active */}
        {activeShift && !loading && (
          <span className="absolute inset-0 rounded-full animate-ping bg-red-400 opacity-20" />
        )}
      </button>

      {/* Active shift info */}
      {activeShift && (
        <div className="text-center">
          <p className="text-4xl font-mono font-bold text-white tabular-nums">
            {formatDuration(activeDuration)}
          </p>
          <p className="text-emerald-400 text-xl font-semibold mt-1">
            {formatCurrency(currentEarnings)}
          </p>
          <p className="text-slate-500 text-sm mt-1">
            Clocked in at {new Date(activeShift.clockIn).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
          </p>
        </div>
      )}

      {/* Note input when clocked out */}
      {!activeShift && (
        <input
          type="text"
          placeholder="Shift note (optional)"
          value={note}
          onChange={e => setNote(e.target.value)}
          className="w-full max-w-xs bg-slate-800/60 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-300 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors text-center"
        />
      )}
    </div>
  )
}
