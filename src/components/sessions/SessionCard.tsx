'use client'

import { HuntSession } from '@/types'
import { formatGold, formatHours, formatDateTime, VOCATION_LABELS } from '@/lib/utils'
import Button from '@/components/ui/Button'
import { MapPin, Clock, TrendingUp, Star, Trash2 } from 'lucide-react'

interface Props {
  session: HuntSession
  onDelete: (id: number) => void
}

export default function SessionCard({ session, onDelete }: Props) {
  const sph = session.duration > 0 ? Math.round((session.goldEarned / session.duration) * 60) : 0

  return (
    <div className="bg-[#212121] border border-[#2e2e2e] rounded-xl p-4 hover:border-[#3a3a3a] transition-colors">
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-white">{session.character.name}</h3>
            <span className="text-xs px-2 py-0.5 rounded-full bg-[#333333] text-gray-400">
              Lv. {session.character.level}
            </span>
            <span className="text-xs text-gray-500">{VOCATION_LABELS[session.character.vocation]}</span>
          </div>
          <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {session.spot.name}
            </span>
            <span>·</span>
            <span>{formatDateTime(session.startedAt)}</span>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDelete(session.id)}
          className="w-8 h-8 p-0 hover:text-red-400"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      </div>
      <div className="grid grid-cols-3 gap-2 text-xs">
        <div className="bg-[#2a2a2a] rounded-lg p-2">
          <p className="text-gray-500 flex items-center gap-1 mb-0.5">
            <Clock className="w-3 h-3" /> Duration
          </p>
          <p className="font-semibold text-white">{formatHours(session.duration)}</p>
        </div>
        <div className="bg-[#2a2a2a] rounded-lg p-2">
          <p className="text-gray-500 flex items-center gap-1 mb-0.5">
            🪙 Gold
          </p>
          <p className="font-semibold text-yellow-400">{formatGold(session.goldEarned)}</p>
        </div>
        <div className="bg-[#2a2a2a] rounded-lg p-2">
          <p className="text-gray-500 flex items-center gap-1 mb-0.5">
            <TrendingUp className="w-3 h-3" /> /Hour
          </p>
          <p className="font-semibold text-green-400">{formatGold(sph)}</p>
        </div>
      </div>
      {session.xpGained > 0 && (
        <div className="mt-2 flex items-center gap-1.5 text-xs text-gray-500">
          <Star className="w-3 h-3" />
          <span>{formatGold(session.xpGained)} XP</span>
        </div>
      )}
      {session.notes && (
        <p className="mt-2 text-xs text-gray-500 italic border-t border-[#2e2e2e] pt-2">{session.notes}</p>
      )}
    </div>
  )
}
