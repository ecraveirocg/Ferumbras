'use client'

import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { SpotSummary, ClassSummary, ViewTab } from '@/types'
import { CHART_COLORS, VOCATION_LABELS, formatHours } from '@/lib/utils'

interface Props {
  sessionsBySpot: SpotSummary[]
  sessionsByClass: ClassSummary[]
  viewTab: ViewTab
}

export default function TotalHoursChart({ sessionsBySpot, sessionsByClass, viewTab }: Props) {
  const data = viewTab === 'class'
    ? sessionsByClass.map(s => ({ name: VOCATION_LABELS[s.vocation] ?? s.vocation, value: s.totalMinutes }))
    : sessionsBySpot.map(s => ({ name: s.spotName, value: s.totalMinutes }))

  const hasData = data.length > 0 && data.some(d => d.value > 0)

  return (
    <div className="bg-[#212121] rounded-xl border border-[#2e2e2e] p-4 h-72">
      <h3 className="text-sm font-medium text-gray-300 mb-3 flex items-center gap-2">
        <span>⏱</span> Total Hours
      </h3>
      {!hasData ? (
        <div className="flex flex-col items-center justify-center h-48 text-gray-600">
          <span className="text-3xl mb-2">🕐</span>
          <p className="text-sm">No data yet</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={80}
              paddingAngle={2}
              dataKey="value"
            >
              {data.map((_, i) => (
                <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(val: number) => [formatHours(val), 'Hours']}
              contentStyle={{ backgroundColor: '#2a2a2a', border: '1px solid #3a3a3a', borderRadius: 8 }}
              labelStyle={{ color: '#9ca3af' }}
              itemStyle={{ color: 'white' }}
            />
            <Legend
              iconType="circle"
              iconSize={8}
              formatter={(value) => <span style={{ color: '#9ca3af', fontSize: 12 }}>{value}</span>}
            />
          </PieChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
