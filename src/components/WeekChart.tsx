import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { format } from 'date-fns'

interface DataPoint {
  day: string
  hours: number
  earnings: number
}

interface Props {
  data: DataPoint[]
}

const todayDow = format(new Date(), 'EEE')

export function WeekChart({ data }: Props) {
  return (
    <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-4">
      <h2 className="text-slate-400 text-sm font-semibold uppercase tracking-widest mb-4">This Week</h2>
      <ResponsiveContainer width="100%" height={140}>
        <BarChart data={data} barSize={22} margin={{ top: 0, right: 0, left: -30, bottom: 0 }}>
          <XAxis
            dataKey="day"
            tick={{ fill: '#94a3b8', fontSize: 12 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: '#94a3b8', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={v => `$${v}`}
          />
          <Tooltip
            cursor={{ fill: 'rgba(255,255,255,0.03)' }}
            contentStyle={{
              backgroundColor: '#1e293b',
              border: '1px solid #334155',
              borderRadius: '12px',
              color: '#f1f5f9',
              fontSize: 12,
            }}
            formatter={(val) => [`$${Number(val ?? 0).toFixed(2)}`, 'Earned']}
          />
          <Bar dataKey="earnings" radius={[6, 6, 0, 0]}>
            {data.map(entry => (
              <Cell
                key={entry.day}
                fill={entry.day === todayDow ? '#8b5cf6' : '#334155'}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
