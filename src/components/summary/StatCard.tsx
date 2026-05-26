'use client'

import { cn } from '@/lib/utils'

interface StatCardProps {
  label: string
  value: string
  icon?: string
  color?: 'yellow' | 'blue' | 'green' | 'gray' | 'red'
}

const colorMap: Record<string, string> = {
  yellow: 'bg-yellow-900/30 text-yellow-400',
  blue: 'bg-blue-900/30 text-blue-400',
  green: 'bg-green-900/30 text-green-400',
  gray: 'bg-gray-800 text-gray-400',
  red: 'bg-red-900/30 text-red-400',
}

export default function StatCard({ label, value, icon, color = 'blue' }: StatCardProps) {
  return (
    <div className="bg-[#212121] border border-[#2e2e2e] rounded-xl p-5 flex items-center gap-4">
      {icon && (
        <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0', colorMap[color])}>
          {icon}
        </div>
      )}
      <div className="min-w-0">
        <p className="text-sm text-gray-400 truncate">{label}</p>
        <p className="text-2xl font-bold text-white mt-0.5 truncate">{value}</p>
      </div>
    </div>
  )
}
