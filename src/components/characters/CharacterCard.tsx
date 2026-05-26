'use client'

import { Character } from '@/types'
import { VOCATION_LABELS, VOCATION_COLORS, SEX_LABELS } from '@/lib/utils'
import Button from '@/components/ui/Button'
import { Edit2, Trash2, Shield, Globe } from 'lucide-react'

interface Props {
  character: Character & { _count?: { sessions: number } }
  onEdit: (character: Character) => void
  onDelete: (id: number) => void
}

export default function CharacterCard({ character, onEdit, onDelete }: Props) {
  const color = VOCATION_COLORS[character.vocation] ?? '#6b7280'

  return (
    <div className="bg-[#212121] border border-[#2e2e2e] rounded-xl p-4 hover:border-[#3a3a3a] transition-colors">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
            style={{ backgroundColor: color + '33', border: `2px solid ${color}` }}
          >
            {character.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h3 className="font-semibold text-white">{character.name}</h3>
            <p className="text-xs text-gray-400">{VOCATION_LABELS[character.vocation]}</p>
          </div>
        </div>
        <div className="flex gap-1">
          <Button variant="ghost" size="sm" onClick={() => onEdit(character)} className="w-8 h-8 p-0">
            <Edit2 className="w-3.5 h-3.5" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => onDelete(character.id)} className="w-8 h-8 p-0 hover:text-red-400">
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2 text-xs">
        <div className="bg-[#2a2a2a] rounded-lg p-2 text-center">
          <p className="text-gray-500 mb-0.5">Level</p>
          <p className="font-semibold text-white">{character.level}</p>
        </div>
        <div className="bg-[#2a2a2a] rounded-lg p-2 text-center">
          <p className="text-gray-500 mb-0.5 flex items-center justify-center gap-1">
            <Shield className="w-3 h-3" /> Sex
          </p>
          <p className="font-semibold text-white">{SEX_LABELS[character.sex]}</p>
        </div>
        <div className="bg-[#2a2a2a] rounded-lg p-2 text-center">
          <p className="text-gray-500 mb-0.5">Hunts</p>
          <p className="font-semibold text-white">{character._count?.sessions ?? 0}</p>
        </div>
      </div>
      {character.world && (
        <div className="mt-2 flex items-center gap-1.5 text-xs text-gray-500">
          <Globe className="w-3 h-3" />
          <span>{character.world}</span>
        </div>
      )}
    </div>
  )
}
