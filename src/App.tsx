import { useState, useEffect } from 'react'
import { LayoutDashboard, History, FolderLock, Settings as SettingsIcon } from 'lucide-react'
import { usePayTracker } from './hooks/usePayTracker'
import { ClockButton } from './components/ClockButton'
import { EarningsCards } from './components/EarningsCards'
import { WeekChart } from './components/WeekChart'
import { ShiftHistory } from './components/ShiftHistory'
import { DocumentVault } from './components/DocumentVault'
import { SettingsPanel } from './components/SettingsPanel'
import { scheduleReminders } from './lib/notifications'
import { format } from 'date-fns'

type Tab = 'home' | 'history' | 'vault' | 'settings'

const TABS: { id: Tab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'home', label: 'Home', icon: LayoutDashboard },
  { id: 'history', label: 'History', icon: History },
  { id: 'vault', label: 'Vault', icon: FolderLock },
  { id: 'settings', label: 'Settings', icon: SettingsIcon },
]

export default function App() {
  const [tab, setTab] = useState<Tab>('home')
  const tracker = usePayTracker()

  useEffect(() => {
    if (tracker.settings?.notificationsEnabled) {
      scheduleReminders(tracker.settings.reminderClockIn, tracker.settings.reminderClockOut)
    }
  }, [tracker.settings?.notificationsEnabled])

  if (!tracker.settings) {
    return (
      <div className="flex items-center justify-center min-h-svh bg-slate-950">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-svh bg-slate-950">
      {/* Header */}
      <header className="px-5 pt-12 pb-2 flex items-center justify-between bg-slate-950 sticky top-0 z-10 border-b border-slate-800/50">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">PayTracker</h1>
          <p className="text-slate-500 text-xs">{format(new Date(), 'EEEE, MMMM d')}</p>
        </div>
        {tracker.activeShift && (
          <div className="flex items-center gap-1.5 bg-red-500/10 border border-red-500/30 rounded-full px-3 py-1">
            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            <span className="text-red-400 text-xs font-semibold">ON CLOCK</span>
          </div>
        )}
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto px-4 pb-28">
        {tab === 'home' && (
          <div className="flex flex-col gap-6 py-6">
            <div className="flex justify-center py-4">
              <ClockButton
                activeShift={tracker.activeShift}
                activeDuration={tracker.activeDuration}
                hourlyRate={tracker.settings.hourlyRate}
                onClockIn={tracker.clockIn}
                onClockOut={tracker.clockOut}
              />
            </div>
            <EarningsCards
              dayStats={tracker.dayStats}
              weekStats={tracker.weekStats}
              monthStats={tracker.monthStats}
            />
            <WeekChart data={tracker.weekChart} />
          </div>
        )}

        {tab === 'history' && (
          <div className="py-4">
            <ShiftHistory
              shifts={tracker.shifts}
              settings={tracker.settings}
              onDelete={tracker.removeShift}
              onEdit={tracker.editShift}
            />
          </div>
        )}

        {tab === 'vault' && (
          <div className="py-4">
            <DocumentVault
              documents={tracker.documents}
              onAdd={tracker.addDocument}
              onDelete={tracker.removeDocument}
            />
          </div>
        )}

        {tab === 'settings' && (
          <div className="py-4">
            <SettingsPanel
              settings={tracker.settings}
              onSave={tracker.updateSettings}
            />
          </div>
        )}
      </main>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-lg border-t border-slate-800">
        <div className="flex items-center justify-around px-2 py-2 pb-6">
          {TABS.map(t => {
            const Icon = t.icon
            const active = tab === t.id
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className="flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-colors min-w-0"
              >
                <Icon className={`w-5 h-5 transition-colors ${active ? 'text-emerald-400' : 'text-slate-500'}`} />
                <span className={`text-xs font-medium transition-colors ${active ? 'text-emerald-400' : 'text-slate-500'}`}>
                  {t.label}
                </span>
              </button>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
