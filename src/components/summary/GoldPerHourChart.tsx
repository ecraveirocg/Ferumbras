'use client'

import { SpotSummary, ClassSummary, DateSummary, ViewTab } from '@/types'
import { CHART_COLORS, VOCATION_LABELS, formatGoldShort } from '@/lib/utils'

interface Props {
  sessionsBySpot: SpotSummary[]
  sessionsByClass: ClassSummary[]
  sessionsByDate: DateSummary[]
  viewTab: ViewTab
}

export default function GoldPerHourChart({ sessionsBySpot, sessionsByClass, sessionsByDate, viewTab }: Props) {
  let data: { name: string; value: number }[] = []

  if (viewTab === 'overtime') {
    data = sessionsByDate.map(s => ({ name: s.date.slice(5), value: s.goldPerHour }))
  } else if (viewTab === 'class') {
    data = sessionsByClass.map(s => ({ name: VOCATION_LABELS[s.vocation] ?? s.vocation, value: s.goldPerHour }))
  } else {
    data = sessionsBySpot.map(s => ({ name: s.spotName, value: s.goldPerHour }))
  }

  data.sort((a, b) => b.value - a.value)

  const hasData = data.length > 0 && data.some(d => d.value > 0)
  const max = hasData ? Math.max(...data.map(d => d.value)) : 1

  return (
    <div className="bg-[#1a1a1a] rounded-xl border border-[#2e2e2e] p-4 flex flex-col flex-1">
      <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
        <span>⚡</span> Gold an Hour per Hunt
      </h3>

      {!hasData ? (
        <div className="flex flex-col items-center justify-center py-10 text-gray-600">
          <span className="text-3xl mb-2">⚡</span>
          <p className="text-sm">No data yet</p>
        </div>
      ) : (
        <div className="flex flex-col gap-1.5">
          {data.map((entry, i) => {
            const pct = max > 0 ? (entry.value / max) * 100 : 0
            const color = CHART_COLORS[i % CHART_COLORS.length]
            return (
              <div key={i} className="flex items-center gap-2">
                <span className="text-[11px] text-gray-400 w-24 flex-shrink-0 truncate text-right">
                  {entry.name}
                </span>
                <div className="flex-1 h-3.5 bg-[#111] rounded overflow-hidden">
                  <div
                    className="h-full rounded transition-all duration-500"
                    style={{ width: `${pct}%`, backgroundColor: color }}
                  />
                </div>
                <span className="text-[11px] font-semibold text-gray-300 w-14 flex-shrink-0">
                  {formatGoldShort(entry.value)}/h
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
