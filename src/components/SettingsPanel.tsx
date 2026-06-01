import { useState, useEffect } from 'react'
import { Bell, DollarSign, Clock, Save } from 'lucide-react'
import type { Settings } from '../lib/db'
import { requestNotificationPermission, scheduleReminders } from '../lib/notifications'

interface Props {
  settings: Settings
  onSave: (s: Settings) => Promise<void>
}

export function SettingsPanel({ settings, onSave }: Props) {
  const [form, setForm] = useState<Settings>(settings)
  const [saved, setSaved] = useState(false)
  const [notifStatus, setNotifStatus] = useState<'default' | 'granted' | 'denied'>(
    'Notification' in window ? Notification.permission as 'default' | 'granted' | 'denied' : 'denied'
  )

  useEffect(() => { setForm(settings) }, [settings])

  const set = (key: keyof Settings, val: unknown) => setForm(f => ({ ...f, [key]: val }))

  const handleSave = async () => {
    await onSave(form)
    if (form.notificationsEnabled && notifStatus === 'granted') {
      scheduleReminders(form.reminderClockIn, form.reminderClockOut)
    }
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleEnableNotifs = async () => {
    const granted = await requestNotificationPermission()
    setNotifStatus(granted ? 'granted' : 'denied')
    set('notificationsEnabled', granted)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-4">
          <DollarSign className="w-4 h-4 text-emerald-400" />
          <h3 className="text-slate-200 font-semibold">Pay Settings</h3>
        </div>
        <div className="flex flex-col gap-4">
          <div>
            <label className="text-xs text-slate-400 block mb-1.5">Hourly Rate ($)</label>
            <input
              type="number"
              min="0"
              step="0.25"
              value={form.hourlyRate}
              onChange={e => set('hourlyRate', parseFloat(e.target.value) || 0)}
              className="w-full bg-slate-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label className="text-xs text-slate-400 block mb-1.5">Overtime after (hours/day)</label>
            <input
              type="number"
              min="0"
              step="0.5"
              value={form.overtimeThreshold}
              onChange={e => set('overtimeThreshold', parseFloat(e.target.value) || 8)}
              className="w-full bg-slate-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label className="text-xs text-slate-400 block mb-1.5">Overtime rate multiplier</label>
            <input
              type="number"
              min="1"
              step="0.1"
              value={form.overtimeMultiplier}
              onChange={e => set('overtimeMultiplier', parseFloat(e.target.value) || 1.5)}
              className="w-full bg-slate-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>
      </div>

      <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-4">
          <Bell className="w-4 h-4 text-violet-400" />
          <h3 className="text-slate-200 font-semibold">Reminders</h3>
        </div>

        {notifStatus !== 'granted' ? (
          <div className="flex flex-col gap-3">
            <p className="text-slate-400 text-sm">
              Enable notifications to get reminded to clock in and out.
            </p>
            {notifStatus === 'denied' ? (
              <p className="text-red-400 text-xs">
                Notifications are blocked. Enable them in your browser settings.
              </p>
            ) : (
              <button
                onClick={handleEnableNotifs}
                className="flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl py-3 text-sm font-medium transition-colors"
              >
                <Bell className="w-4 h-4" />
                Enable Notifications
              </button>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-300">Reminders enabled</span>
              <button
                onClick={() => set('notificationsEnabled', !form.notificationsEnabled)}
                className={`w-12 h-6 rounded-full transition-colors relative ${
                  form.notificationsEnabled ? 'bg-violet-600' : 'bg-slate-600'
                }`}
              >
                <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                  form.notificationsEnabled ? 'left-7' : 'left-1'
                }`} />
              </button>
            </div>
            {form.notificationsEnabled && (
              <>
                <div>
                  <label className="text-xs text-slate-400 block mb-1.5 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Clock-in reminder
                  </label>
                  <input
                    type="time"
                    value={form.reminderClockIn ?? ''}
                    onChange={e => set('reminderClockIn', e.target.value || null)}
                    className="w-full bg-slate-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1.5 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Clock-out reminder
                  </label>
                  <input
                    type="time"
                    value={form.reminderClockOut ?? ''}
                    onChange={e => set('reminderClockOut', e.target.value || null)}
                    className="w-full bg-slate-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>
              </>
            )}
          </div>
        )}
      </div>

      <button
        onClick={handleSave}
        className={`flex items-center justify-center gap-2 rounded-xl py-3.5 font-semibold text-sm transition-all ${
          saved
            ? 'bg-emerald-600 text-white'
            : 'bg-slate-700 hover:bg-slate-600 text-white'
        }`}
      >
        <Save className="w-4 h-4" />
        {saved ? 'Saved!' : 'Save Settings'}
      </button>
    </div>
  )
}
