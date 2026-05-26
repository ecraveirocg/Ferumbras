'use client'

import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, Cell } from 'recharts'
import { SpotSummary, ClassSummary, DateSummary, ViewTab } from '@/types'
import { CHART_COLORS, VOCATION_LABELS, formatSilver } from '@/lib/utils'

interface Props {
  sessionsBySpot: SpotSummary[]
  sessionsByClass: ClassSummary[]
  sessionsByDate: DateSummary[]
  viewTab: ViewTab
}

export default function TotalSilverChart({ sessionsBySpot, sessionsByClass, sessionsByDate, viewTab }: Props) {
  let data: { name: string; value: number }[] = []

  if (viewTab === 'overtime') {
    data = sessionsByDate.map(s => ({ name: s.date.slice(5), value: s.totalSilver }))
  } else if (viewTab === 'class') {
    data = sessionsByClass.map(s => ({ name: VOCATION_LABELS[s.vocation] ?? s.vocation, value: s.totalSilver }))
  } else {
    data = sessionsBySpot.map(s => ({ name: s.spotName, value: s.totalSilver }))
  }

  const hasData = data.length > 0 && data.some(d => d.value > 0)

  return (
    <div className="bg-[#212121] rounded-xl border border-[#2e2e2e] p-4 h-72">
      <h3 className="text-sm font-medium text-gray-300 mb-3 flex items-center gap-2">
        <span>🪙</span> Total Silver
      </h3>
      {!hasData ? (
        <div className="flex flex-col items-center justify-center h-48 text-gray-600">
          <span className="text-3xl mb-2">🪙</span>
          <p className="text-sm">No data yet</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={data} margin={{ top: 0, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2e2e2e" vertical={false} />
            <XAxis dataKey="name" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
            <Tooltip
              formatter={(val: number) => [formatSilver(val), 'Silver']}
              contentStyle={{ backgroundColor: '#2a2a2a', border: '1px solid #3a3a3a', borderRadius: 8 }}
              labelStyle={{ color: '#9ca3af' }}
              itemStyle={{ color: 'white' }}
              cursor={{ fill: 'rgba(255,255,255,0.05)' }}
            />
            <Bar dataKey="value" fill={CHART_COLORS[0]} radius={[4, 4, 0, 0]}>
              {data.map((_, i) => (
                <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
