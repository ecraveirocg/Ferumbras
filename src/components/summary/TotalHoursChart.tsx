'use client'

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Sector } from 'recharts'
import { SpotSummary, ClassSummary, ViewTab } from '@/types'
import { CHART_COLORS, VOCATION_LABELS, formatHours } from '@/lib/utils'
import { useState } from 'react'

interface Props {
  sessionsBySpot: SpotSummary[]
  sessionsByClass: ClassSummary[]
  viewTab: ViewTab
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function ActiveSlice(props: any) {
  const {
    cx, cy,
    innerRadius, outerRadius,
    startAngle, endAngle,
    fill,
  } = props

  return (
    <g>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius - 3}
        outerRadius={outerRadius + 8}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
    </g>
  )
}

export default function TotalHoursChart({ sessionsBySpot, sessionsByClass, viewTab }: Props) {
  const [activeIndex, setActiveIndex] = useState<number | undefined>(undefined)

  const data = viewTab === 'class'
    ? sessionsByClass.map(s => ({ name: VOCATION_LABELS[s.vocation] ?? s.vocation, value: s.totalMinutes }))
    : sessionsBySpot.map(s => ({ name: s.spotName, value: s.totalMinutes }))

  const hasData = data.length > 0 && data.some(d => d.value > 0)
  const total = data.reduce((sum, d) => sum + d.value, 0)

  return (
    <div className="bg-[#1a1a1a] rounded-xl border border-[#2e2e2e] p-5">
      <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
        <span>⏱</span> Total Hours per Hunter
      </h3>
      {!hasData ? (
        <div className="flex flex-col items-center justify-center py-10 text-gray-600">
          <span className="text-3xl mb-2">🕐</span>
          <p className="text-sm">No data yet</p>
        </div>
      ) : (
        <div className="flex items-center gap-4">
          {/* Legend */}
          <div className="flex flex-col gap-2 min-w-0 flex-1">
            {data.map((entry, i) => (
              <div
                key={i}
                className="flex items-center gap-2 min-w-0 cursor-pointer group"
                onMouseEnter={() => setActiveIndex(i)}
                onMouseLeave={() => setActiveIndex(undefined)}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0 transition-transform group-hover:scale-125"
                  style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }}
                />
                <span className={`text-xs truncate transition-colors ${activeIndex === i ? 'text-white' : 'text-gray-400'}`}>
                  {entry.name}
                </span>
              </div>
            ))}
          </div>

          {/* Donut */}
          <div className="flex-shrink-0 w-48 h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={44}
                  outerRadius={76}
                  paddingAngle={2}
                  dataKey="value"
                  strokeWidth={0}
                  activeIndex={activeIndex}
                  activeShape={<ActiveSlice />}
                  onMouseEnter={(_, index) => setActiveIndex(index)}
                  onMouseLeave={() => setActiveIndex(undefined)}
                >
                  {data.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val: number) => {
                    const pct = total > 0 ? ((val / total) * 100).toFixed(1) : '0'
                    return [`${formatHours(val)} · ${pct}%`, 'Hours']
                  }}
                  contentStyle={{ backgroundColor: '#1e1e1e', border: '1px solid #333', borderRadius: 8 }}
                  labelStyle={{ color: '#9ca3af' }}
                  itemStyle={{ color: 'white' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  )
}
