import type { PayPeriodStats } from '../lib/pay'
import { formatCurrency, formatHours } from '../lib/pay'
import { TrendingUp } from 'lucide-react'

interface CardProps {
  label: string
  stats: PayPeriodStats | null
  accent: string
}

function StatCard({ label, stats, accent }: CardProps) {
  if (!stats) return null
  const projected = stats.projectedEarnings > stats.totalEarnings
  return (
    <div className={`bg-slate-800/60 border border-slate-700/50 rounded-2xl p-4 flex flex-col gap-1`}>
      <p className={`text-xs font-semibold uppercase tracking-widest ${accent}`}>{label}</p>
      <p className="text-2xl font-bold text-white tabular-nums">{formatCurrency(stats.totalEarnings)}</p>
      <p className="text-slate-400 text-sm">{formatHours(stats.totalHours)} worked</p>
      {projected && stats.totalEarnings > 0 && (
        <div className="flex items-center gap-1 mt-1">
          <TrendingUp className="w-3 h-3 text-emerald-400" />
          <p className="text-emerald-400 text-xs">Projected: {formatCurrency(stats.projectedEarnings)}</p>
        </div>
      )}
    </div>
  )
}

interface Props {
  dayStats: PayPeriodStats | null
  weekStats: PayPeriodStats | null
  monthStats: PayPeriodStats | null
}

export function EarningsCards({ dayStats, weekStats, monthStats }: Props) {
  const yearEarnings = monthStats ? monthStats.totalEarnings * 12 : 0
  const weeklyTarget = weekStats?.totalHours ?? 0

  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-slate-400 text-sm font-semibold uppercase tracking-widest">Earnings</h2>
      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Today" stats={dayStats} accent="text-sky-400" />
        <StatCard label="This Week" stats={weekStats} accent="text-violet-400" />
        <StatCard label="This Month" stats={monthStats} accent="text-emerald-400" />
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-4 flex flex-col gap-1">
          <p className="text-xs font-semibold uppercase tracking-widest text-amber-400">Year Est.</p>
          <p className="text-2xl font-bold text-white tabular-nums">{formatCurrency(yearEarnings)}</p>
          <p className="text-slate-400 text-sm">Based on this month</p>
        </div>
      </div>
      {weekStats && weeklyTarget > 0 && (
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-4">
          <div className="flex justify-between items-center mb-2">
            <p className="text-sm text-slate-400">Weekly progress</p>
            <p className="text-sm font-semibold text-white">{formatHours(weekStats.totalHours)} / 40h</p>
          </div>
          <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-violet-500 to-violet-400 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, (weekStats.totalHours / 40) * 100)}%` }}
            />
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {weekStats.totalHours >= 40
              ? `${formatHours(weekStats.totalHours - 40)} overtime`
              : `${formatHours(40 - weekStats.totalHours)} remaining`}
          </p>
        </div>
      )}
    </div>
  )
}
