'use client'

import { HuntSession } from '@/types'
import { formatGold, formatHours, formatDateTime, VOCATION_LABELS } from '@/lib/utils'
import { Clock, MapPin, TrendingUp } from 'lucide-react'

interface Props {
  sessions: HuntSession[]
}

export default function RecentSessions({ sessions }: Props) {
  return (
    <div className="bg-[#212121] rounded-xl border border-[#2e2e2e] p-4">
      <h3 className="text-sm font-medium text-gray-300 mb-4 flex items-center gap-2">
        <Clock className="w-4 h-4" /> Recent Sessions
      </h3>
      {sessions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-gray-600">
          <div className="w-12 h-12 rounded-full bg-[#2a2a2a] flex items-center justify-center mb-3">
            <Clock className="w-6 h-6 text-gray-700" />
          </div>
          <p className="text-sm">No sessions recorded yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {sessions.map(session => (
            <div
              key={session.id}
              className="flex items-center gap-3 p-3 rounded-lg bg-[#2a2a2a] hover:bg-[#333333] transition-colors"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-sm font-medium text-white truncate">{session.character.name}</span>
                  <span className="text-xs text-gray-500">·</span>
                  <span className="text-xs text-gray-400">{VOCATION_LABELS[session.character.vocation]}</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {session.spot.name}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatHours(session.duration)}
                  </span>
                  <span className="text-gray-600">{formatDateTime(session.startedAt)}</span>
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-sm font-semibold text-yellow-400">{formatGold(session.goldEarned)}</p>
                <p className="text-xs text-gray-500 flex items-center justify-end gap-1">
                  <TrendingUp className="w-3 h-3" />
                  {session.duration > 0 ? formatGold(Math.round((session.goldEarned / session.duration) * 60)) : '0'}/h
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
