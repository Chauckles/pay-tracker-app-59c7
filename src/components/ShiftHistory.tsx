import { useState } from 'react'
import { Trash2, ChevronDown, ChevronUp, Clock, Pencil, Check, X } from 'lucide-react'
import type { Shift, Settings } from '../lib/db'
import { formatCurrency, formatHours, shiftHours, calculatePay } from '../lib/pay'
import { format, isToday, isYesterday } from 'date-fns'

interface Props {
  shifts: Shift[]
  settings: Settings
  onDelete: (id: string) => void
  onEdit: (shift: Shift) => void
}

function shiftDateLabel(ts: number): string {
  const d = new Date(ts)
  if (isToday(d)) return 'Today'
  if (isYesterday(d)) return 'Yesterday'
  return format(d, 'EEE, MMM d')
}

function EditRow({ shift, onSave, onCancel }: {
  shift: Shift; onSave: (s: Shift) => void; onCancel: () => void
}) {
  const [inTime, setInTime] = useState(format(new Date(shift.clockIn), "yyyy-MM-dd'T'HH:mm"))
  const [outTime, setOutTime] = useState(shift.clockOut ? format(new Date(shift.clockOut), "yyyy-MM-dd'T'HH:mm") : '')
  const [breakMin, setBreakMin] = useState(String(shift.breakMinutes))

  const save = () => {
    onSave({
      ...shift,
      clockIn: new Date(inTime).getTime(),
      clockOut: outTime ? new Date(outTime).getTime() : undefined,
      breakMinutes: parseInt(breakMin) || 0,
    })
  }

  return (
    <div className="flex flex-col gap-2 p-3 bg-slate-700/40 rounded-xl">
      <label className="text-xs text-slate-400">Clock In</label>
      <input type="datetime-local" value={inTime} onChange={e => setInTime(e.target.value)}
        className="bg-slate-700 text-white text-sm rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-emerald-500" />
      <label className="text-xs text-slate-400">Clock Out</label>
      <input type="datetime-local" value={outTime} onChange={e => setOutTime(e.target.value)}
        className="bg-slate-700 text-white text-sm rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-emerald-500" />
      <label className="text-xs text-slate-400">Break (minutes)</label>
      <input type="number" value={breakMin} onChange={e => setBreakMin(e.target.value)} min="0"
        className="bg-slate-700 text-white text-sm rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-emerald-500" />
      <div className="flex gap-2 mt-1">
        <button onClick={save} className="flex-1 flex items-center justify-center gap-1 bg-emerald-600 text-white rounded-lg py-2 text-sm font-medium">
          <Check className="w-4 h-4" /> Save
        </button>
        <button onClick={onCancel} className="flex-1 flex items-center justify-center gap-1 bg-slate-600 text-white rounded-lg py-2 text-sm font-medium">
          <X className="w-4 h-4" /> Cancel
        </button>
      </div>
    </div>
  )
}

export function ShiftHistory({ shifts, settings, onDelete, onEdit }: Props) {
  const [expanded, setExpanded] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const sorted = [...shifts]
    .filter(s => s.clockOut)
    .sort((a, b) => b.clockIn - a.clockIn)

  const visible = expanded ? sorted : sorted.slice(0, 5)

  if (sorted.length === 0) {
    return (
      <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-6 text-center">
        <Clock className="w-8 h-8 text-slate-600 mx-auto mb-2" />
        <p className="text-slate-500 text-sm">No completed shifts yet</p>
      </div>
    )
  }

  return (
    <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl overflow-hidden">
      <div className="p-4 border-b border-slate-700/50">
        <h2 className="text-slate-400 text-sm font-semibold uppercase tracking-widest">Shift History</h2>
      </div>
      <div className="divide-y divide-slate-700/40">
        {visible.map(shift => {
          const hours = shiftHours(shift)
          const earnings = calculatePay(hours, settings)
          return (
            <div key={shift.id} className="p-4">
              {editingId === shift.id ? (
                <EditRow
                  shift={shift}
                  onSave={s => { onEdit(s); setEditingId(null) }}
                  onCancel={() => setEditingId(null)}
                />
              ) : (
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white">{shiftDateLabel(shift.clockIn)}</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {new Date(shift.clockIn).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                      {' → '}
                      {shift.clockOut
                        ? new Date(shift.clockOut).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
                        : '—'}
                    </p>
                    {shift.note && <p className="text-xs text-slate-400 mt-0.5 italic truncate">{shift.note}</p>}
                    {shift.breakMinutes > 0 && (
                      <p className="text-xs text-slate-500 mt-0.5">{shift.breakMinutes}m break</p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-emerald-400">{formatCurrency(earnings)}</p>
                    <p className="text-xs text-slate-500">{formatHours(hours)}</p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button
                      onClick={() => setEditingId(shift.id)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-sky-400 hover:bg-sky-400/10 transition-colors"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDelete(shift.id)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-400/10 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
      {sorted.length > 5 && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full p-3 flex items-center justify-center gap-1 text-slate-500 hover:text-slate-300 text-sm transition-colors border-t border-slate-700/50"
        >
          {expanded ? <><ChevronUp className="w-4 h-4" />Show less</> : <><ChevronDown className="w-4 h-4" />Show {sorted.length - 5} more</>}
        </button>
      )}
    </div>
  )
}
