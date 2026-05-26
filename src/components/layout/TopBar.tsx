'use client'

import { cn } from '@/lib/utils'
import type { TimeFilter } from '@/types'

interface TopBarProps {
  title: string
  filter?: TimeFilter
  onFilterChange?: (filter: TimeFilter) => void
  children?: React.ReactNode
}

const timeFilters: { value: TimeFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: '7d', label: 'Past 7 Days' },
  { value: '30d', label: 'Past 30 Days' },
  { value: '90d', label: 'Past 90 Days' },
]

export default function TopBar({ title, filter, onFilterChange, children }: TopBarProps) {
  return (
    <div className="sticky top-0 z-10 bg-[#1a1a1a]/90 backdrop-blur-sm border-b border-[#2a2a2a] px-6 py-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h1 className="text-xl font-bold text-white">{title}</h1>
        <div className="flex items-center gap-3 flex-wrap">
          {filter !== undefined && onFilterChange && (
            <div className="flex items-center gap-1 bg-[#212121] border border-[#2a2a2a] rounded-lg p-1">
              {timeFilters.map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => onFilterChange(value)}
                  className={cn(
                    'px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-150',
                    filter === value
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-gray-400 hover:text-white hover:bg-[#333333]'
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
          {children}
        </div>
      </div>
    </div>
  )
}
