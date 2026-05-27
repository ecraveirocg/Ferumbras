'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Character, HuntSession } from '@/types'
import { VOCATION_LABELS, VOCATION_COLORS, formatGoldShort, formatHours } from '@/lib/utils'
import Image from 'next/image'
import { ArrowLeft, Sword, FlaskConical, BookOpen, Clock } from 'lucide-react'
import EquipmentGrid, { GearSlots, GearPreset } from '@/components/characters/EquipmentGrid'
import EquipmentStats from '@/components/characters/EquipmentStats'
import RunesPanel from '@/components/characters/RunesPanel'
import PotsPanel from '@/components/characters/PotsPanel'
import { cn } from '@/lib/utils'

type Tab = 'equipment' | 'runes' | 'pots' | 'sessions'

interface CharacterDetail extends Character {
  sessions: (HuntSession & { spot: { name: string } })[]
}

interface GearData {
  slots: GearSlots
  runes: string[]
  pots: { name: string; qty: number }[]
  presets: GearPreset[]
}

const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
  { key: 'equipment', label: 'Equipment',   icon: <Sword className="w-4 h-4" /> },
  { key: 'runes',     label: 'Runes',       icon: <BookOpen className="w-4 h-4" /> },
  { key: 'pots',      label: 'Consumables', icon: <FlaskConical className="w-4 h-4" /> },
  { key: 'sessions',  label: 'Sessions',    icon: <Clock className="w-4 h-4" /> },
]

export default function CharacterDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const [character, setCharacter] = useState<CharacterDetail | null>(null)
  const [gear, setGear]           = useState<GearData>({ slots: {}, runes: [], pots: [], presets: [] })
  const [tab, setTab]             = useState<Tab>('equipment')
  const [loading, setLoading]     = useState(true)
  const [saving, setSaving]       = useState(false)

  useEffect(() => {
    Promise.all([
      fetch(`/api/characters/${id}`).then(r => r.json()),
      fetch(`/api/characters/${id}/gear`).then(r => r.json()).catch(() => ({})),
    ]).then(([char, g]) => {
      setCharacter(char)
      setGear({
        slots:   g?.slots   ?? {},
        runes:   g?.runes   ?? [],
        pots:    g?.pots    ?? [],
        presets: g?.presets ?? [],
      })
      setLoading(false)
    })
  }, [id])

  const saveGear = useCallback(async (next: Partial<GearData>) => {
    setSaving(true)
    const updated = { ...gear, ...next }
    await fetch(`/api/characters/${id}/gear`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated),
    })
    setGear(updated)
    setSaving(false)
  }, [gear, id])

  if (loading) return (
    <div className="p-6 max-w-screen-xl mx-auto">
      <div className="h-8 w-40 bg-[#2a2a2a] rounded animate-pulse mb-6" />
      <div className="h-96 bg-[#1a1a1a] rounded-xl animate-pulse" />
    </div>
  )

  if (!character) return (
    <div className="p-6 text-gray-400">Character not found.</div>
  )

  const color = VOCATION_COLORS[character.vocation] ?? '#6b7280'
  const totalGold = character.sessions.reduce((s, h) => s + h.goldEarned, 0)
  const totalXp   = character.sessions.reduce((s, h) => s + h.xpGained, 0)
  const totalMin  = character.sessions.reduce((s, h) => s + h.duration, 0)

  return (
    <div className="p-6 max-w-screen-xl mx-auto">
      {/* Back + header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => router.back()}
          className="w-9 h-9 flex items-center justify-center rounded-lg bg-[#1a1a1a] border border-[#2e2e2e] hover:border-[#3a3a3a] text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0"
          style={{ backgroundColor: color + '22', border: `2px solid ${color}` }}
        >
          <Image
            src={`/${character.vocation === 'ELITE_KNIGHT' ? 'EK' : character.vocation === 'ROYAL_PALADIN' ? 'RP' : character.vocation === 'MASTER_SORCERER' ? 'MS' : character.vocation === 'ELDER_DRUID' ? 'ED' : 'EM'}.gif`}
            alt={character.vocation}
            width={32}
            height={32}
            className="object-contain"
            unoptimized
          />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">{character.name}</h1>
        </div>
        {saving && <span className="ml-auto text-xs text-gray-500 animate-pulse">Saving…</span>}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6">
        {/* Left: tabs + content */}
        <div>
          {/* Tab bar */}
          <div className="flex gap-1 bg-[#141414] border border-[#2e2e2e] rounded-xl p-1 mb-4 w-fit">
            {TABS.map(t => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-all',
                  tab === t.key
                    ? 'bg-[#2a2a2a] text-white font-medium'
                    : 'text-gray-500 hover:text-gray-300'
                )}
              >
                {t.icon} {t.label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          {tab === 'equipment' ? (
            <EquipmentGrid
              slots={gear.slots}
              onChange={slots => saveGear({ slots })}
              presets={gear.presets}
              onPresetsChange={presets => saveGear({ presets })}
            />
          ) : (
            <div className="bg-[#1a1a1a] border border-[#2e2e2e] rounded-xl p-5">
              {tab === 'runes' && (
                <RunesPanel
                  runes={gear.runes}
                  onChange={runes => saveGear({ runes })}
                />
              )}
              {tab === 'pots' && (
                <PotsPanel
                  pots={gear.pots}
                  onChange={pots => saveGear({ pots })}
                />
              )}
              {tab === 'sessions' && (
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-gray-300 mb-3">Hunt Sessions</h3>
                  {character.sessions.length === 0 ? (
                    <p className="text-sm text-gray-600 py-6 text-center">No sessions yet</p>
                  ) : character.sessions.map(s => (
                    <div key={s.id} className="flex items-center justify-between p-3 bg-[#111] rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-white">{s.spot.name}</p>
                        <p className="text-xs text-gray-500">{new Date(s.startedAt).toLocaleDateString('pt-BR')} · {formatHours(s.duration)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-yellow-400">{formatGoldShort(s.goldEarned)}</p>
                        <p className="text-xs text-gray-500">{formatGoldShort(s.xpGained)} XP</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right: stats — offset to align with item picker card when on equipment tab */}
        <div
          className="space-y-4 self-start"
          style={{ marginTop: tab === 'equipment' ? 60 : 0 }}
        >
          {/* Character card — top */}
          <div className="bg-[#1a1a1a] border border-[#2e2e2e] rounded-xl p-4">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Character</h3>
            <div className="space-y-2">
              {[
                { label: 'Level',    value: String(character.level) },
                { label: 'Vocation', value: VOCATION_LABELS[character.vocation] },
                { label: 'Sex',      value: character.sex === 'MALE' ? '♂ Male' : '♀ Female' },
                { label: 'World',    value: character.world || '—' },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between py-1.5 border-b border-[#2a2a2a] last:border-0">
                  <span className="text-xs text-gray-400">{label}</span>
                  <span className="text-sm font-semibold text-white">{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Overview card — below */}
          <div className="bg-[#1a1a1a] border border-[#2e2e2e] rounded-xl p-4">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Overview</h3>
            <div className="space-y-2">
              {[
                { label: 'Total Sessions', value: String(character.sessions.length) },
                { label: 'Total Gold',     value: formatGoldShort(totalGold) },
                { label: 'Total XP',       value: formatGoldShort(totalXp) },
                { label: 'Time Hunted',    value: formatHours(totalMin) },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between py-1.5 border-b border-[#2a2a2a] last:border-0">
                  <span className="text-xs text-gray-400">{label}</span>
                  <span className="text-sm font-semibold text-white">{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Equipment Stats card — only on equipment tab */}
          {tab === 'equipment' && (
            <EquipmentStats slots={gear.slots} />
          )}
        </div>
      </div>
    </div>
  )
}
