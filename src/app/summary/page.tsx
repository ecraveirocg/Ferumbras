'use client'

import { useState, useEffect } from 'react'
import { SummaryData, TimeFilter, ViewTab } from '@/types'
import StatCard from '@/components/summary/StatCard'
import TotalHoursChart from '@/components/summary/TotalHoursChart'
import TotalGoldChart from '@/components/summary/TotalGoldChart'
import GoldPerHourChart from '@/components/summary/GoldPerHourChart'
import XpPerHourChart from '@/components/summary/XpPerHourChart'
import RecentSessions from '@/components/summary/RecentSessions'
import ActivityCalendar from '@/components/summary/ActivityCalendar'
import GoalsCard from '@/components/summary/GoalsCard'
import Button from '@/components/ui/Button'
import Link from 'next/link'
import { Plus, Filter, Swords } from 'lucide-react'
import Image from 'next/image'
import { formatHoursDecimal, formatGoldShort, formatHours } from '@/lib/utils'
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
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white font-medium'
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

      {/* Time filters + Goals inline */}
      <div className="flex items-center gap-2 mb-6">
        {TIME_FILTERS.map(f => (
          <button
            key={f.value}
            onClick={() => setTimeFilter(f.value)}
            className={cn(
              'px-4 py-1.5 text-sm rounded-lg transition-all whitespace-nowrap flex-shrink-0',
              timeFilter === f.value
                ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white font-medium'
                : 'border border-[#2e2e2e] bg-[#212121] text-gray-400 hover:text-white hover:border-[#3a3a3a]'
            )}
          >
            {f.label}
          </button>
        ))}
        <div className="flex-1 min-w-0">
          <GoalsCard />
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <StatCard
          label="Days Active"
          value={loading ? '—' : String(data?.daysActive ?? 0)}
          icon={<Image src="/diaria.gif" alt="diaria" width={44} height={44} unoptimized style={{ transform: 'translateY(-3px)' }} className="object-contain" />}
          color="green"
        />
        <StatCard
          label="Total XP"
          value={loading ? '—' : formatGoldShort(data?.totalXp ?? 0)}
          icon={<Swords className="w-5 h-5" />}
          color="red"
          sparkData={data?.sessionsByDate?.map(d => ({ value: d.totalXp ?? 0, label: d.date }))}
          sparkFormatter={(v) => formatGoldShort(v) + ' XP'}
        />
        <StatCard
          label="Total Gold"
          value={loading ? '—' : formatGoldShort(data?.totalGold ?? 0)}
          icon={<Image src="/gold_coin.gif" alt="Gold" width={20} height={20} unoptimized />}
          color="yellow"
          sparkData={data?.sessionsByDate?.map(d => ({ value: d.totalGold, label: d.date }))}
          sparkFormatter={formatGoldShort}
        />
        <StatCard
          label="Total Hours Hunting"
          value={loading ? '—' : formatHoursDecimal(data ? data.totalHours * 60 : 0) + 'h'}
          icon={<Image src="/walking.gif" alt="walking" width={44} height={44} unoptimized className="object-contain mb-3" />}
          color="blue"
          sparkData={data?.sessionsByDate?.map(d => ({ value: d.totalMinutes, label: d.date }))}
          sparkFormatter={formatHours}
        />
      </div>

      {/* Activity Calendar */}
      <div className="mb-6">
        <ActivityCalendar />
      </div>

      {/* Charts grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4 items-stretch">
        {/* Left column */}
        <div className="flex flex-col gap-4">
          <TotalHoursChart
            sessionsBySpot={data?.sessionsBySpot ?? []}
            sessionsByClass={data?.sessionsByClass ?? []}
            viewTab={viewTab}
          />
          <RecentSessions sessions={data?.recentSessions ?? []} />
        </div>
        {/* Right column */}
        <div className="flex flex-col gap-4 h-full">
          <TotalGoldChart
            sessionsBySpot={data?.sessionsBySpot ?? []}
            sessionsByClass={data?.sessionsByClass ?? []}
            sessionsByDate={data?.sessionsByDate ?? []}
            viewTab={viewTab}
          />
          <GoldPerHourChart
            sessionsBySpot={data?.sessionsBySpot ?? []}
            sessionsByClass={data?.sessionsByClass ?? []}
            sessionsByDate={data?.sessionsByDate ?? []}
            viewTab={viewTab}
          />
          <XpPerHourChart
            sessionsBySpot={data?.sessionsBySpot ?? []}
            sessionsByClass={data?.sessionsByClass ?? []}
            sessionsByDate={data?.sessionsByDate ?? []}
            viewTab={viewTab}
          />
        </div>
      </div>
    </div>
  )
}
