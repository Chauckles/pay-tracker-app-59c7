import { useState, useEffect } from 'react'
import { Bell, DollarSign, Clock, Save, UserCircle, Trash2, Plus, X } from 'lucide-react'
import type { Settings, User, BreakSlot } from '../lib/db'
import { requestNotificationPermission } from '../lib/notifications'

interface Props {
  settings: Settings
  users: User[]
  activeUser: User | null
  onSave: (s: Settings) => Promise<void>
  onSwitchUser: (id: string) => void
  onAddUser: (name: string) => Promise<User>
  onRemoveUser: (id: string) => Promise<void>
}

function initials(name: string) {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
}

export function SettingsPanel({ settings, users, activeUser, onSave, onSwitchUser, onAddUser, onRemoveUser }: Props) {
  const [form, setForm] = useState<Settings>(settings)
  const [saved, setSaved] = useState(false)
  const [newUserName, setNewUserName] = useState('')
  const [notifStatus, setNotifStatus] = useState<NotificationPermission>(
    'Notification' in window ? Notification.permission : 'denied'
  )
  const [newBreakTime, setNewBreakTime] = useState('')
  const [newBreakLabel, setNewBreakLabel] = useState('')
  const [newBreakDuration, setNewBreakDuration] = useState('15')

  useEffect(() => { setForm(settings) }, [settings])

  const set = <K extends keyof Settings>(key: K, val: Settings[K]) => setForm(f => ({ ...f, [key]: val }))

  const handleSave = async () => {
    await onSave(form)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleEnableNotifs = async () => {
    const granted = await requestNotificationPermission()
    setNotifStatus(granted ? 'granted' : 'denied')
    set('notificationsEnabled', granted)
  }

  const addBreak = () => {
    if (!newBreakTime || !newBreakLabel.trim()) return
    const slot: BreakSlot = {
      time: newBreakTime,
      label: newBreakLabel.trim(),
      durationMinutes: parseInt(newBreakDuration) || 15,
    }
    set('extraBreaks', [...form.extraBreaks, slot])
    setNewBreakTime('')
    setNewBreakLabel('')
    setNewBreakDuration('15')
  }

  const removeBreak = (i: number) => set('extraBreaks', form.extraBreaks.filter((_, idx) => idx !== i))

  const handleAddUser = async () => {
    if (!newUserName.trim()) return
    await onAddUser(newUserName.trim())
    setNewUserName('')
  }

  return (
    <div className="flex flex-col gap-4">

      {/* ── Users ───────────────────────────────── */}
      <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-4">
          <UserCircle className="w-4 h-4 text-sky-400" />
          <h3 className="text-slate-200 font-semibold">Users</h3>
        </div>
        <div className="flex flex-col gap-2 mb-3">
          {users.map(u => (
            <div key={u.id} className={`flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors ${u.id === activeUser?.id ? 'bg-slate-700' : 'bg-slate-700/40'}`}>
              <button onClick={() => onSwitchUser(u.id)} className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                  style={{ backgroundColor: u.color }}>{initials(u.name)}</div>
                <span className="text-sm text-white font-medium truncate">{u.name}</span>
                {u.id === activeUser?.id && <span className="text-xs text-emerald-400 ml-auto shrink-0">Active</span>}
              </button>
              {users.length > 1 && (
                <button onClick={() => onRemoveUser(u.id)} className="p-1 text-slate-500 hover:text-red-400 transition-colors shrink-0">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text" placeholder="Add user"
            value={newUserName} onChange={e => setNewUserName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAddUser()}
            className="flex-1 bg-slate-700 border border-slate-600 rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-colors"
          />
          <button onClick={handleAddUser} disabled={!newUserName.trim()}
            className="px-3 py-2.5 bg-sky-600 hover:bg-sky-500 disabled:opacity-40 text-white rounded-xl transition-colors">
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── Pay ─────────────────────────────────── */}
      <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-4">
          <DollarSign className="w-4 h-4 text-emerald-400" />
          <h3 className="text-slate-200 font-semibold">Pay Settings</h3>
        </div>
        <div className="flex flex-col gap-4">
          <div>
            <label className="text-xs text-slate-400 block mb-1.5">Hourly Rate ($)</label>
            <input type="number" min="0" step="0.25" value={form.hourlyRate}
              onChange={e => set('hourlyRate', parseFloat(e.target.value) || 0)}
              className="w-full bg-slate-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
          </div>
          <div>
            <label className="text-xs text-slate-400 block mb-1.5">Overtime after (hours/day)</label>
            <input type="number" min="0" step="0.5" value={form.overtimeThreshold}
              onChange={e => set('overtimeThreshold', parseFloat(e.target.value) || 8)}
              className="w-full bg-slate-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
          </div>
          <div>
            <label className="text-xs text-slate-400 block mb-1.5">Overtime multiplier</label>
            <input type="number" min="1" step="0.1" value={form.overtimeMultiplier}
              onChange={e => set('overtimeMultiplier', parseFloat(e.target.value) || 1.5)}
              className="w-full bg-slate-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
          </div>
        </div>
      </div>

      {/* ── Notifications & Breaks ──────────────── */}
      <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-4">
          <Bell className="w-4 h-4 text-violet-400" />
          <h3 className="text-slate-200 font-semibold">Reminders & Breaks</h3>
        </div>

        {notifStatus !== 'granted' ? (
          <div className="flex flex-col gap-3">
            <p className="text-slate-400 text-sm">Enable notifications to get reminded to clock in/out and for breaks.</p>
            {notifStatus === 'denied'
              ? <p className="text-red-400 text-xs">Notifications blocked. Enable them in your browser/OS settings.</p>
              : <button onClick={handleEnableNotifs}
                  className="flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl py-3 text-sm font-medium transition-colors">
                  <Bell className="w-4 h-4" /> Enable Notifications
                </button>
            }
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-300">Reminders enabled</span>
              <button onClick={() => set('notificationsEnabled', !form.notificationsEnabled)}
                className={`w-12 h-6 rounded-full transition-colors relative ${form.notificationsEnabled ? 'bg-violet-600' : 'bg-slate-600'}`}>
                <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${form.notificationsEnabled ? 'left-7' : 'left-1'}`} />
              </button>
            </div>

            {form.notificationsEnabled && (
              <>
                {/* Clock in/out */}
                <div className="flex flex-col gap-3">
                  <p className="text-xs text-slate-500 uppercase tracking-widest">Work Day</p>
                  <div>
                    <label className="text-xs text-slate-400 block mb-1.5 flex items-center gap-1"><Clock className="w-3 h-3" /> Clock-in reminder</label>
                    <input type="time" value={form.reminderClockIn ?? ''}
                      onChange={e => set('reminderClockIn', e.target.value || null)}
                      className="w-full bg-slate-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 block mb-1.5 flex items-center gap-1"><Clock className="w-3 h-3" /> Clock-out reminder</label>
                    <input type="time" value={form.reminderClockOut ?? ''}
                      onChange={e => set('reminderClockOut', e.target.value || null)}
                      className="w-full bg-slate-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
                  </div>
                </div>

                {/* Lunch */}
                <div className="flex flex-col gap-3">
                  <p className="text-xs text-slate-500 uppercase tracking-widest">Lunch Break</p>
                  <div>
                    <label className="text-xs text-slate-400 block mb-1.5">Preferred lunch time</label>
                    <input type="time" value={form.lunchTime ?? ''}
                      onChange={e => set('lunchTime', e.target.value || null)}
                      className="w-full bg-slate-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 block mb-1.5">Lunch duration (minutes)</label>
                    <input type="number" min="5" step="5" value={form.lunchDurationMinutes}
                      onChange={e => set('lunchDurationMinutes', parseInt(e.target.value) || 30)}
                      className="w-full bg-slate-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
                  </div>
                  <p className="text-xs text-slate-500">You'll get notified at lunch time and again when it's over.</p>
                </div>

                {/* Extra breaks */}
                <div className="flex flex-col gap-3">
                  <p className="text-xs text-slate-500 uppercase tracking-widest">Extra Breaks</p>

                  {form.extraBreaks.map((brk, i) => (
                    <div key={i} className="flex items-center gap-2 bg-slate-700/50 rounded-xl px-3 py-2.5">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white font-medium">{brk.label}</p>
                        <p className="text-xs text-slate-400">{brk.time} · {brk.durationMinutes} min</p>
                      </div>
                      <button onClick={() => removeBreak(i)} className="p-1 text-slate-500 hover:text-red-400 transition-colors">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}

                  <div className="flex flex-col gap-2 bg-slate-700/30 rounded-xl p-3">
                    <p className="text-xs text-slate-400">Add break</p>
                    <input type="text" placeholder="Break name (e.g. Morning break)"
                      value={newBreakLabel} onChange={e => setNewBreakLabel(e.target.value)}
                      className="w-full bg-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-sky-500 placeholder-slate-500" />
                    <div className="flex gap-2">
                      <input type="time" value={newBreakTime} onChange={e => setNewBreakTime(e.target.value)}
                        className="flex-1 bg-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-sky-500" />
                      <input type="number" placeholder="min" value={newBreakDuration} onChange={e => setNewBreakDuration(e.target.value)}
                        min="5" step="5"
                        className="w-20 bg-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-sky-500" />
                    </div>
                    <button onClick={addBreak} disabled={!newBreakTime || !newBreakLabel.trim()}
                      className="flex items-center justify-center gap-1 bg-sky-600 hover:bg-sky-500 disabled:opacity-40 text-white rounded-lg py-2 text-sm font-medium transition-colors">
                      <Plus className="w-3.5 h-3.5" /> Add Break
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      <button onClick={handleSave}
        className={`flex items-center justify-center gap-2 rounded-xl py-3.5 font-semibold text-sm transition-all ${
          saved ? 'bg-emerald-600 text-white' : 'bg-slate-700 hover:bg-slate-600 text-white'
        }`}>
        <Save className="w-4 h-4" />
        {saved ? 'Saved!' : 'Save Settings'}
      </button>
    </div>
  )
}
