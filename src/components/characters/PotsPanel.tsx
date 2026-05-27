'use client'

import { useState } from 'react'
import { Plus, X, Minus } from 'lucide-react'

export interface Pot { name: string; qty: number }

const COMMON_POTS = [
  'Supreme Health Potion', 'Ultimate Health Potion', 'Great Health Potion',
  'Supreme Mana Potion', 'Ultimate Mana Potion', 'Great Mana Potion',
  'Supreme Spirit Potion', 'Ultimate Spirit Potion',
  'Great Spirit Potion', 'Strong Health Potion', 'Strong Mana Potion',
]

const POT_ICONS: Record<string, string> = {
  'Supreme Health Potion': '🟥', 'Ultimate Health Potion': '🟥', 'Great Health Potion': '🟥', 'Strong Health Potion': '🟥',
  'Supreme Mana Potion':   '🟦', 'Ultimate Mana Potion':   '🟦', 'Great Mana Potion':   '🟦', 'Strong Mana Potion':   '🟦',
  'Supreme Spirit Potion': '🟪', 'Ultimate Spirit Potion': '🟪', 'Great Spirit Potion': '🟪',
}

interface Props {
  pots: Pot[]
  onChange: (pots: Pot[]) => void
}

export default function PotsPanel({ pots, onChange }: Props) {
  const [input, setInput] = useState('')
  const [qty, setQty]     = useState(100)

  const add = (name: string, q = qty) => {
    const trimmed = name.trim()
    if (!trimmed) return
    const existing = pots.find(p => p.name === trimmed)
    if (existing) {
      onChange(pots.map(p => p.name === trimmed ? { ...p, qty: p.qty + q } : p))
    } else {
      onChange([...pots, { name: trimmed, qty: q }])
    }
    setInput('')
  }

  const remove = (name: string) => onChange(pots.filter(p => p.name !== name))

  const setQtyFor = (name: string, q: number) =>
    onChange(pots.map(p => p.name === name ? { ...p, qty: Math.max(0, q) } : p))

  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-300 mb-1">Consumables</h3>
      <p className="text-xs text-gray-500 mb-4">Set potions and supplies for your hunts.</p>

      {/* Add input */}
      <div className="flex gap-2 mb-4">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') add(input) }}
          placeholder="Potion name…"
          className="flex-1 bg-[#111] border border-[#2e2e2e] text-white text-sm rounded-lg px-3 py-2 outline-none focus:border-blue-500 placeholder-gray-600"
        />
        <input
          type="number"
          value={qty}
          onChange={e => setQty(Number(e.target.value))}
          min={1}
          className="w-20 bg-[#111] border border-[#2e2e2e] text-white text-sm rounded-lg px-3 py-2 outline-none focus:border-blue-500 text-center"
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
        <p className="text-xs text-gray-500 mb-2">Quick add (×100):</p>
        <div className="flex flex-wrap gap-1.5">
          {COMMON_POTS.filter(p => !pots.find(x => x.name === p)).map(p => (
            <button
              key={p}
              onClick={() => add(p, 100)}
              className="text-xs bg-[#111] border border-[#2a2a2a] hover:border-blue-500 text-gray-400 hover:text-white px-2 py-1 rounded-lg transition-colors"
            >
              {POT_ICONS[p] ?? '🧪'} {p}
            </button>
          ))}
        </div>
      </div>

      {/* Pot list */}
      {pots.length === 0 ? (
        <p className="text-sm text-gray-600 text-center py-6">No consumables added yet</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {pots.map(p => (
            <div
              key={p.name}
              className="flex items-center gap-3 bg-[#111] border border-[#2a2a2a] rounded-lg px-3 py-2"
            >
              <span className="text-lg flex-shrink-0">{POT_ICONS[p.name] ?? '🧪'}</span>
              <span className="text-sm text-white flex-1 truncate">{p.name}</span>
              <div className="flex items-center gap-1 flex-shrink-0">
                <button onClick={() => setQtyFor(p.name, p.qty - 50)} className="w-6 h-6 flex items-center justify-center rounded bg-[#1a1a1a] hover:bg-[#2a2a2a] text-gray-400">
                  <Minus className="w-3 h-3" />
                </button>
                <span className="text-sm font-semibold text-white w-10 text-center">{p.qty}</span>
                <button onClick={() => setQtyFor(p.name, p.qty + 50)} className="w-6 h-6 flex items-center justify-center rounded bg-[#1a1a1a] hover:bg-[#2a2a2a] text-gray-400">
                  <Plus className="w-3 h-3" />
                </button>
              </div>
              <button onClick={() => remove(p.name)} className="text-gray-500 hover:text-red-400 transition-colors">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
