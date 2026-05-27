'use client'

import { useState, useEffect, useMemo } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface DayData {
  date: string
  count: number
}

const MONTHS = ['jan.', 'fev.', 'mar.', 'abr.', 'mai.', 'jun.', 'jul.', 'ago.', 'set.', 'out.', 'nov.', 'dez.']
const DAY_LABELS = ['', 'Mon', '', 'Wed', '', 'Fri', 'Sat'] // index 0=Sun,1=Mon,...6=Sat

function getCellColor(count: number): string {
  if (count === 0) return '#1e2124'
  if (count === 1) return '#14532d'
  if (count === 2) return '#166534'
  if (count === 3) return '#15803d'
  return '#16a34a'
}

function buildCalendarWeeks(year: number, dataMap: Map<string, number>) {
  // Start from Jan 1, pad to previous Monday
  const jan1 = new Date(year, 0, 1)
  // getDay(): 0=Sun,1=Mon,...6=Sat. We want weeks starting on Sunday
  const startDayOfWeek = jan1.getDay() // 0-6

  const weeks: { date: string | null; count: number }[][] = []
  let week: { date: string | null; count: number }[] = []

  // Pad start
  for (let i = 0; i < startDayOfWeek; i++) {
    week.push({ date: null, count: 0 })
  }

  const dec31 = new Date(year, 11, 31)
  const cursor = new Date(jan1)

  while (cursor <= dec31) {
    const iso = cursor.toISOString().split('T')[0]
    week.push({ date: iso, count: dataMap.get(iso) ?? 0 })
    if (week.length === 7) {
      weeks.push(week)
      week = []
    }
    cursor.setDate(cursor.getDate() + 1)
  }

  // Pad end
  if (week.length > 0) {
    while (week.length < 7) week.push({ date: null, count: 0 })
    weeks.push(week)
  }

  return weeks
}

function getMonthPositions(year: number, weeks: { date: string | null; count: number }[][]) {
  const positions: { label: string; col: number }[] = []
  let lastMonth = -1

  weeks.forEach((week, col) => {
    const firstRealDay = week.find(d => d.date !== null)
    if (!firstRealDay?.date) return
    const month = new Date(firstRealDay.date).getMonth()
    if (month !== lastMonth) {
      positions.push({ label: MONTHS[month], col })
      lastMonth = month
    }
  })

  return positions
}

export default function ActivityCalendar() {
  const currentYear = new Date().getFullYear()
  const [year, setYear] = useState(currentYear)
  const [dataMap, setDataMap] = useState<Map<string, number>>(new Map())
  const [loading, setLoading] = useState(true)
  const [tooltip, setTooltip] = useState<{ text: string; x: number; y: number } | null>(null)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/calendar?year=${year}`)
      .then(r => r.json())
      .then(({ data }: { data: DayData[] }) => {
        const map = new Map<string, number>()
        for (const d of data ?? []) map.set(d.date, d.count)
        setDataMap(map)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [year])

  const weeks = useMemo(() => buildCalendarWeeks(year, dataMap), [year, dataMap])
  const monthPositions = useMemo(() => getMonthPositions(year, weeks), [year, weeks])

  const CELL = 13   // cell size px
  const GAP  = 2    // gap px
  const STEP = CELL + GAP

  const svgWidth  = weeks.length * STEP
  const svgHeight = 7 * STEP
  const labelW    = 28 // left label column width

  function handleMouseEnter(e: React.MouseEvent, day: { date: string | null; count: number }) {
    if (!day.date) return
    const rect = (e.target as SVGRectElement).getBoundingClientRect()
    const containerRect = (e.currentTarget as SVGSVGElement).closest('.calendar-container')?.getBoundingClientRect()
    const label = day.count === 0
      ? `No sessions on ${day.date}`
      : `${day.count} session${day.count > 1 ? 's' : ''} on ${day.date}`
    setTooltip({
      text: label,
      x: rect.left - (containerRect?.left ?? 0) + CELL / 2,
      y: rect.top  - (containerRect?.top  ?? 0) - 4,
    })
  }

  return (
    <div className="bg-[#1a1a1a] border border-[#2e2e2e] rounded-xl p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-white">Activity Calendar</h2>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setYear(y => y - 1)}
            className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-[#2e2e2e] text-gray-400 hover:text-white transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm font-semibold text-white w-12 text-center">{year}</span>
          <button
            onClick={() => setYear(y => y + 1)}
            disabled={year >= currentYear}
            className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-[#2e2e2e] text-gray-400 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Calendar grid */}
      <div className="calendar-container relative overflow-x-auto">
        <div className="flex gap-1 min-w-max">
          {/* Day-of-week labels */}
          <div className="flex flex-col gap-px pt-5" style={{ width: labelW }}>
            {DAY_LABELS.map((label, i) => (
              <div
                key={i}
                className="text-[10px] text-gray-500 flex items-center"
                style={{ height: STEP }}
              >
                {label}
              </div>
            ))}
          </div>

          {/* Grid */}
          <div className="relative">
            {/* Month labels */}
            <div className="flex mb-1" style={{ height: 16 }}>
              {monthPositions.map(({ label, col }, i) => (
                <span
                  key={i}
                  className="text-[10px] text-gray-500 absolute"
                  style={{ left: col * STEP }}
                >
                  {label}
                </span>
              ))}
            </div>

            {/* Cells */}
            <svg
              width={svgWidth}
              height={svgHeight}
              onMouseLeave={() => setTooltip(null)}
            >
              {weeks.map((week, col) =>
                week.map((day, row) => (
                  <rect
                    key={`${col}-${row}`}
                    x={col * STEP}
                    y={row * STEP}
                    width={CELL}
                    height={CELL}
                    rx={2}
                    fill={day.date ? getCellColor(day.count) : 'transparent'}
                    className={day.date ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}
                    onMouseEnter={e => handleMouseEnter(e, day)}
                    onMouseLeave={() => setTooltip(null)}
                  />
                ))
              )}
            </svg>

            {/* Tooltip */}
            {tooltip && (
              <div
                className="absolute z-10 pointer-events-none -translate-x-1/2 -translate-y-full bg-[#111] border border-[#333] text-white text-xs rounded px-2 py-1 whitespace-nowrap"
                style={{ left: tooltip.x, top: tooltip.y }}
              >
                {tooltip.text}
              </div>
            )}
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-1.5 mt-3 justify-end">
          <span className="text-[10px] text-gray-500">Less</span>
          {[0, 1, 2, 3, 4].map(level => (
            <div
              key={level}
              className="rounded-sm"
              style={{ width: CELL, height: CELL, backgroundColor: getCellColor(level) }}
            />
          ))}
          <span className="text-[10px] text-gray-500">More</span>
        </div>
      </div>
    </div>
  )
}
