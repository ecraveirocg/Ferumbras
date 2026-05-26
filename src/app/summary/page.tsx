'use client'

import { useState, useEffect } from 'react'
import { SummaryData, TimeFilter, ViewTab } from '@/types'
import StatCard from '@/components/summary/StatCard'
import TotalHoursChart from '@/components/summary/TotalHoursChart'
import TotalSilverChart from '@/components/summary/TotalSilverChart'
import SilverPerHourChart from '@/components/summary/SilverPerHourChart'
import RecentSessions from '@/components/summary/RecentSessions'
import Button from '@/components/ui/Button'
import Link from 'next/link'
import { Plus, Filter } from 'lucide-react'
import { formatSilver, formatHoursDecimal } from '@/lib/utils'
import { cn } from '@/lib/utils'

const TIME_FILTERS: { label: string; value: TimeFilter }[] = [
  { label: 'All', value: 'all' },
  { label: 'Past 7 Days', value: '7d' },
  { label: 'Past 30 Days', value: '30d' },
  { label: 'Past 90 Days', value: '90d' },
]

const VIEW_TABS: { label: string; value: ViewTab }[] = [
  { label: 'Spot', value: 'spot' },
  { label: 'Class', value: 'class' },
  { label: 'Overtime', value: 'overtime' },
]

export default function SummaryPage() {
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all')
  const [viewTab, setViewTab] = useState<ViewTab>('spot')
  const [data, setData] = useState<SummaryData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/summary?timeFilter=${timeFilter}`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [timeFilter])

  return (
    <div className="p-6 max-w-screen-xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-white">Summary</h1>
          <p className="text-sm text-gray-500 mt-0.5">Analyze your grinding performance across spots and classes</p>
        </div>
        <div className="flex items-center gap-2">
          {/* View tabs */}
          <div className="flex items-center bg-[#212121] border border-[#2e2e2e] rounded-lg p-0.5">
            {VIEW_TABS.map(tab => (
              <button
                key={tab.value}
                onClick={() => setViewTab(tab.value)}
                className={cn(
                  'px-4 py-1.5 text-sm rounded-md transition-all',
                  viewTab === tab.value
                    ? 'bg-blue-600 text-white font-medium'
                    : 'text-gray-400 hover:text-white'
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <Button variant="ghost" size="sm" className="w-9 h-9 p-0">
            <Filter className="w-4 h-4" />
          </Button>
          <Link href="/sessions/new">
            <Button variant="success" size="sm">
              <Plus className="w-4 h-4" />
              Add
            </Button>
          </Link>
        </div>
      </div>

      {/* Time filters */}
      <div className="flex gap-2 mb-6">
        {TIME_FILTERS.map(f => (
          <button
            key={f.value}
            onClick={() => setTimeFilter(f.value)}
            className={cn(
              'px-4 py-1.5 text-sm rounded-lg border transition-all',
              timeFilter === f.value
                ? 'bg-blue-600 border-blue-600 text-white font-medium'
                : 'border-[#2e2e2e] bg-[#212121] text-gray-400 hover:text-white hover:border-[#3a3a3a]'
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <StatCard
          label="Total Silver Earned"
          value={loading ? '—' : formatSilver(data?.totalSilver ?? 0)}
          icon="🪙"
          color="yellow"
        />
        <StatCard
          label="Average Silver an Hour"
          value={loading ? '—' : formatSilver(data?.avgSilverPerHour ?? 0) + '/h'}
          icon="⚡"
          color="blue"
        />
        <StatCard
          label="Total Hours Grinded"
          value={loading ? '—' : formatHoursDecimal(data ? data.totalHours * 60 : 0) + 'h'}
          icon="⏱"
          color="gray"
        />
      </div>

      {/* Charts grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <TotalHoursChart
          sessionsBySpot={data?.sessionsBySpot ?? []}
          sessionsByClass={data?.sessionsByClass ?? []}
          viewTab={viewTab}
        />
        <TotalSilverChart
          sessionsBySpot={data?.sessionsBySpot ?? []}
          sessionsByClass={data?.sessionsByClass ?? []}
          sessionsByDate={data?.sessionsByDate ?? []}
          viewTab={viewTab}
        />
        <SilverPerHourChart
          sessionsBySpot={data?.sessionsBySpot ?? []}
          sessionsByClass={data?.sessionsByClass ?? []}
          sessionsByDate={data?.sessionsByDate ?? []}
          viewTab={viewTab}
        />
        <RecentSessions sessions={data?.recentSessions ?? []} />
      </div>
    </div>
  )
}
