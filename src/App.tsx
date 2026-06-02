import { useState, useEffect } from 'react'
import { LayoutDashboard, History, FolderLock, Settings as SettingsIcon, ChevronDown } from 'lucide-react'
import { usePayTracker } from './hooks/usePayTracker'
import { ClockButton } from './components/ClockButton'
import { EarningsCards } from './components/EarningsCards'
import { WeekChart } from './components/WeekChart'
import { ShiftHistory } from './components/ShiftHistory'
import { DocumentVault } from './components/DocumentVault'
import { SettingsPanel } from './components/SettingsPanel'
import { UserPicker } from './components/UserPicker'
import { scheduleReminders } from './lib/notifications'
import { format } from 'date-fns'

type Tab = 'home' | 'history' | 'vault' | 'settings'

const TABS: { id: Tab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'home',     label: 'Home',     icon: LayoutDashboard },
  { id: 'history',  label: 'History',  icon: History },
  { id: 'vault',    label: 'Vault',    icon: FolderLock },
  { id: 'settings', label: 'Settings', icon: SettingsIcon },
]

function initials(name: string) {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
}

export default function App() {
  const [tab, setTab] = useState<Tab>('home')
  const [showUserMenu, setShowUserMenu] = useState(false)
  const tracker = usePayTracker()

  useEffect(() => {
    if (tracker.settings?.notificationsEnabled && tracker.settings) {
      scheduleReminders(tracker.settings)
    }
  }, [tracker.settings])

  // Show user picker if no users exist or no active user selected
  if (tracker.users.length === 0 || !tracker.activeUserId || !tracker.activeUser) {
    return (
      <UserPicker
        users={tracker.users}
        onSelect={tracker.switchUser}
        onAdd={tracker.addUser}
      />
    )
  }

  if (!tracker.settings) {
    return (
      <div className="flex items-center justify-center min-h-svh bg-slate-950">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const user = tracker.activeUser

  return (
    <div className="flex flex-col min-h-svh bg-slate-950" onClick={() => showUserMenu && setShowUserMenu(false)}>
      {/* Header */}
      <header className="px-4 pt-12 pb-2 flex items-center justify-between bg-slate-950 sticky top-0 z-10 border-b border-slate-800/50">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">PayTracker</h1>
          <p className="text-slate-500 text-xs">{format(new Date(), 'EEEE, MMMM d')}</p>
        </div>

        <div className="flex items-center gap-2">
          {tracker.activeShift && (
            <div className="flex items-center gap-1.5 bg-red-500/10 border border-red-500/30 rounded-full px-2.5 py-1">
              <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
              <span className="text-red-400 text-xs font-semibold">ON CLOCK</span>
            </div>
          )}

          {/* User avatar + switcher */}
          <div className="relative">
            <button
              onClick={e => { e.stopPropagation(); setShowUserMenu(m => !m) }}
              className="flex items-center gap-1.5 bg-slate-800 border border-slate-700 rounded-full pl-1 pr-2 py-1 transition-colors hover:border-slate-600"
            >
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold"
                style={{ backgroundColor: user.color }}>
                {initials(user.name)}
              </div>
              <span className="text-white text-xs font-medium max-w-[70px] truncate">{user.name}</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {showUserMenu && (
              <div className="absolute right-0 top-full mt-2 bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden shadow-xl z-50 min-w-[160px]"
                onClick={e => e.stopPropagation()}>
                {tracker.users.map(u => (
                  <button key={u.id} onClick={() => { tracker.switchUser(u.id); setShowUserMenu(false) }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-left transition-colors hover:bg-slate-700 ${u.id === user.id ? 'bg-slate-700/60' : ''}`}>
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                      style={{ backgroundColor: u.color }}>{initials(u.name)}</div>
                    <span className="text-sm text-white truncate">{u.name}</span>
                    {u.id === user.id && <span className="ml-auto w-1.5 h-1.5 bg-emerald-400 rounded-full shrink-0" />}
                  </button>
                ))}
                <div className="border-t border-slate-700">
                  <button onClick={() => { setTab('settings'); setShowUserMenu(false) }}
                    className="w-full px-3 py-2.5 text-left text-xs text-slate-400 hover:text-white hover:bg-slate-700 transition-colors">
                    Manage users →
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
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
              userId={tracker.activeUserId!}
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
              users={tracker.users}
              activeUser={tracker.activeUser}
              onSave={tracker.updateSettings}
              onSwitchUser={tracker.switchUser}
              onAddUser={tracker.addUser}
              onRemoveUser={tracker.removeUser}
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
              <button key={t.id} onClick={() => setTab(t.id)}
                className="flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-colors min-w-0">
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
