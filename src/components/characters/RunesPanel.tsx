'use client'

import { useState } from 'react'
import { Plus, X } from 'lucide-react'

const COMMON_RUNES = [
  'Sudden Death Rune', 'Avalanche Rune', 'Stone Shower Rune',
  'Great Fireball Rune', 'Thunderstorm Rune', 'Explosion Rune',
  'Paralyze Rune', 'Animate Dead Rune', 'Ultimate Healing Rune',
  'Strong Haste Rune', 'Magic Wall Rune', 'Wild Growth Rune',
]

interface Props {
  runes: string[]
  onChange: (runes: string[]) => void
}

export default function RunesPanel({ runes, onChange }: Props) {
  const [input, setInput] = useState('')

  const add = (name: string) => {
    const trimmed = name.trim()
    if (!trimmed || runes.includes(trimmed)) return
    onChange([...runes, trimmed])
    setInput('')
  }

  const remove = (name: string) => onChange(runes.filter(r => r !== name))

  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-300 mb-1">Rune Setup</h3>
      <p className="text-xs text-gray-500 mb-4">Configure which runes you carry on this character.</p>

      {/* Add input */}
      <div className="flex gap-2 mb-4">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') add(input) }}
          placeholder="Type rune name…"
          className="flex-1 bg-[#111] border border-[#2e2e2e] text-white text-sm rounded-lg px-3 py-2 outline-none focus:border-blue-500 placeholder-gray-600"
        />
        <button
          onClick={() => add(input)}
          className="px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded-lg transition-colors flex items-center gap-1"
        >
          <Plus className="w-4 h-4" /> Add
        </button>
      </div>

      {/* Quick picks */}
      <div className="mb-4">
        <p className="text-xs text-gray-500 mb-2">Quick add:</p>
        <div className="flex flex-wrap gap-1.5">
          {COMMON_RUNES.filter(r => !runes.includes(r)).map(r => (
            <button
              key={r}
              onClick={() => add(r)}
              className="text-xs bg-[#111] border border-[#2a2a2a] hover:border-blue-500 text-gray-400 hover:text-white px-2 py-1 rounded-lg transition-colors"
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Rune list */}
      {runes.length === 0 ? (
        <p className="text-sm text-gray-600 text-center py-6">No runes added yet</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {runes.map(r => (
            <div
              key={r}
              className="flex items-center justify-between gap-2 bg-[#111] border border-[#2a2a2a] rounded-lg px-3 py-2"
            >
              <span className="text-sm text-white truncate">📜 {r}</span>
              <button onClick={() => remove(r)} className="text-gray-500 hover:text-red-400 transition-colors flex-shrink-0">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
