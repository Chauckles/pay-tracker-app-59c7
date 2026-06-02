import { useState } from 'react'
import { UserPlus, Loader2, ChevronRight } from 'lucide-react'
import type { User } from '../lib/db'

interface Props {
  users: User[]
  onSelect: (id: string) => void
  onAdd: (name: string) => Promise<User>
}

function initials(name: string) {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
}

export function UserPicker({ users, onSelect, onAdd }: Props) {
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)

  const handleAdd = async () => {
    if (!name.trim()) return
    setLoading(true)
    try {
      const user = await onAdd(name)
      onSelect(user.id)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-svh bg-slate-950 flex flex-col items-center justify-center px-6 gap-8">
      <div className="text-center">
        <div className="w-20 h-20 rounded-3xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mx-auto mb-4">
          <span className="text-4xl font-bold text-emerald-400">$</span>
        </div>
        <h1 className="text-2xl font-bold text-white">PayTracker</h1>
        <p className="text-slate-400 text-sm mt-1">Who's tracking today?</p>
      </div>

      {users.length > 0 && (
        <div className="w-full max-w-sm flex flex-col gap-2">
          {users.map(user => (
            <button
              key={user.id}
              onClick={() => onSelect(user.id)}
              className="w-full flex items-center gap-3 bg-slate-800/60 border border-slate-700/50 hover:border-slate-600 rounded-2xl p-4 transition-colors"
            >
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0"
                style={{ backgroundColor: user.color }}>
                {initials(user.name)}
              </div>
              <span className="text-white font-medium flex-1 text-left">{user.name}</span>
              <ChevronRight className="w-4 h-4 text-slate-500" />
            </button>
          ))}
        </div>
      )}

      <div className="w-full max-w-sm flex flex-col gap-3">
        <p className="text-slate-500 text-xs text-center uppercase tracking-widest">
          {users.length === 0 ? 'Create your profile' : 'Add another user'}
        </p>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Your name"
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
            className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
          />
          <button
            onClick={handleAdd}
            disabled={loading || !name.trim()}
            className="px-4 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white rounded-xl transition-colors"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  )
}
