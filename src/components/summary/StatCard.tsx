'use client'

import { cn } from '@/lib/utils'
import { ReactNode } from 'react'
import { AreaChart, Area, ResponsiveContainer, Tooltip } from 'recharts'

interface SparkPoint {
  value: number
  label?: string
}

interface StatCardProps {
  label: string
  value: string
  subtitle?: string
  icon?: ReactNode
  color?: 'yellow' | 'blue' | 'green' | 'gray' | 'red'
  sparkData?: SparkPoint[]
  sparkFormatter?: (v: number) => string
}

const colorMap: Record<string, string> = {
  yellow: 'bg-yellow-500/20 text-yellow-400',
  blue:   'bg-blue-500/20 text-blue-400',
  green:  'bg-green-500/20 text-green-400',
  gray:   'bg-[#2a2a2a] text-gray-400',
  red:    'bg-red-500/20 text-red-400',
}

const sparkColorMap: Record<string, { stroke: string; fill: string; gradFrom: string }> = {
  yellow: { stroke: '#f59e0b', fill: 'url(#spark-yellow)', gradFrom: '#f59e0b' },
  blue:   { stroke: '#3b82f6', fill: 'url(#spark-blue)',   gradFrom: '#3b82f6' },
  green:  { stroke: '#22c55e', fill: 'url(#spark-green)',  gradFrom: '#22c55e' },
  gray:   { stroke: '#9ca3af', fill: 'url(#spark-gray)',   gradFrom: '#9ca3af' },
  red:    { stroke: '#ef4444', fill: 'url(#spark-red)',    gradFrom: '#ef4444' },
}

export default function StatCard({
  label, value, subtitle, icon, color = 'blue', sparkData, sparkFormatter,
}: StatCardProps) {
  const spark = sparkColorMap[color]
  const gradId = `spark-${color}`

  return (
    <div className="bg-[#1a1a1a] border border-[#2e2e2e] rounded-xl overflow-hidden relative">
      {/* Top content */}
      <div className="flex items-center justify-between px-5 pt-5 pb-3">
        <div className="min-w-0">
          <p className="text-sm text-gray-400 mb-1">{label}</p>
          <p className="text-2xl font-bold text-white">{value}</p>
          {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
        </div>
        {icon && (
          <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ml-4', colorMap[color])}>
            {icon}
          </div>
        )}
      </div>

      {/* Sparkline */}
      {sparkData && sparkData.length > 1 && (
        <div className="h-14 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={sparkData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={spark.gradFrom} stopOpacity={0.35} />
                  <stop offset="95%" stopColor={spark.gradFrom} stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="value"
                stroke={spark.stroke}
                strokeWidth={1.5}
                fill={spark.fill}
                dot={false}
                activeDot={{ r: 3, fill: spark.stroke, strokeWidth: 0 }}
              />
              {sparkFormatter && (
                <Tooltip
                  formatter={(v: number) => [sparkFormatter(v)]}
                  labelFormatter={(_, payload) => payload?.[0]?.payload?.label ?? ''}
                  contentStyle={{ backgroundColor: '#1e1e1e', border: '1px solid #333', borderRadius: 8, fontSize: 11 }}
                  itemStyle={{ color: 'white' }}
                  labelStyle={{ color: '#9ca3af' }}
                />
              )}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Bottom padding when no sparkline */}
      {(!sparkData || sparkData.length <= 1) && <div className="pb-5" />}
    </div>
  )
}
