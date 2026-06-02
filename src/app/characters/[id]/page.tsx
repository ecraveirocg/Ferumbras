'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Character, HuntSession } from '@/types'
import { VOCATION_LABELS, VOCATION_COLORS, formatGoldShort, formatHours } from '@/lib/utils'
import Image from 'next/image'
import { ArrowLeft, Sword, FlaskConical, BookOpen, Clock, Globe, User, Sparkles, MapPin } from 'lucide-react'
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

const VOCATION_GIF: Record<string, string> = {
  ELITE_KNIGHT:    '/EK.gif',
  ROYAL_PALADIN:   '/RP.gif',
  MASTER_SORCERER: '/MS.gif',
  ELDER_DRUID:     '/ED.gif',
  EXALTED_MONK:    '/EM.gif',
}

const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
  { key: 'equipment', label: 'Equipment',       icon: <Sword        className="w-4 h-4" /> },
  { key: 'runes',     label: 'Proficiência',    icon: <BookOpen     className="w-4 h-4" /> },
  { key: 'pots',      label: 'Wheel of Destiny',icon: <FlaskConical className="w-4 h-4" /> },
  { key: 'sessions',  label: 'Sessions',        icon: <Clock        className="w-4 h-4" /> },
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
    <div className="p-6 max-w-screen-xl mx-auto space-y-4">
      <div className="h-48 bg-[#1a1a1a] rounded-2xl animate-pulse" />
      <div className="h-96 bg-[#1a1a1a] rounded-2xl animate-pulse" />
    </div>
  )

  if (!character) return (
    <div className="p-6 text-gray-400">Character not found.</div>
  )

  const color     = VOCATION_COLORS[character.vocation] ?? '#6b7280'
  const vocLabel  = VOCATION_LABELS[character.vocation]
  const gifSrc    = VOCATION_GIF[character.vocation]

  return (
    <div className="max-w-screen-xl mx-auto">

      {/* ── Hero banner ───────────────────────────────────────── */}
      <div
        className="relative overflow-hidden rounded-none md:rounded-b-2xl mb-6"
        style={{ background: `linear-gradient(135deg, #0d0d0d 0%, ${color}18 100%)` }}
      >
        {/* Glow blob */}
        <div
          className="absolute -top-16 -right-16 w-64 h-64 rounded-full blur-3xl opacity-20 pointer-events-none"
          style={{ backgroundColor: color }}
        />

        <div className="relative px-6 pt-5 pb-6">
          {/* Back button */}
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-white transition-colors mb-5 group"
          >
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
            Back
          </button>

          <div className="flex items-end gap-6">
            {/* Avatar */}
            <div
              className="relative flex-shrink-0 w-20 h-20 rounded-2xl flex items-center justify-center"
              style={{
                background: `radial-gradient(circle at 60% 40%, ${color}30, ${color}08)`,
                border: `1.5px solid ${color}50`,
                boxShadow: `0 0 24px ${color}25`,
              }}
            >
              <Image
                src={gifSrc}
                alt={vocLabel}
                width={52}
                height={52}
                className="object-contain drop-shadow-lg"
                unoptimized
              />
              {saving && (
                <span className="absolute -top-1.5 -right-1.5 w-3 h-3 rounded-full bg-blue-500 animate-pulse border-2 border-[#0d0d0d]" />
              )}
            </div>

            {/* Name + meta */}
            <div className="flex-1 min-w-0 pb-1">
              <h1 className="text-2xl font-bold text-white tracking-tight leading-none mb-2">
                {character.name}
              </h1>
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full"
                  style={{ background: `${color}20`, color, border: `1px solid ${color}40` }}
                >
                  <Sparkles className="w-3 h-3" />
                  {vocLabel}
                </span>
                <span className="inline-flex items-center gap-1 text-xs text-gray-400 bg-white/5 border border-white/10 px-2.5 py-1 rounded-full">
                  <User className="w-3 h-3" /> Lv. {character.level}
                </span>
                {character.world && (
                  <span className="inline-flex items-center gap-1 text-xs text-gray-400 bg-white/5 border border-white/10 px-2.5 py-1 rounded-full">
                    <Globe className="w-3 h-3" /> {character.world}
                  </span>
                )}
                <span className="inline-flex items-center gap-1 text-xs text-gray-500 bg-white/5 border border-white/10 px-2.5 py-1 rounded-full">
                  {character.sex === 'MALE' ? '♂' : '♀'} {character.sex === 'MALE' ? 'Male' : 'Female'}
                </span>
              </div>
            </div>

            {/* Quick stats */}
            <div className="hidden lg:flex items-center gap-4 pb-1 flex-shrink-0">
              {[
                { label: 'Sessions', value: character.sessions.length },
                { label: 'Runes',    value: gear.runes.length },
                { label: 'Pots',     value: gear.pots.length },
              ].map(({ label, value }) => (
                <div key={label} className="text-center">
                  <p className="text-lg font-bold text-white">{value}</p>
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tab bar pinned to bottom of hero */}
        <div
          className="flex border-t"
          style={{ borderColor: `${color}20` }}
        >
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-all relative',
                tab === t.key ? 'text-white' : 'text-gray-500 hover:text-gray-300'
              )}
            >
              {t.icon}
              <span className="hidden sm:inline">{t.label}</span>
              {tab === t.key && (
                <span
                  className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full"
                  style={{ backgroundColor: color }}
                />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── Content ───────────────────────────────────────────── */}
      <div className="px-6 pb-8">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_272px] gap-6">

          {/* Left: tab content */}
          <div>
            {tab === 'equipment' && (
              <EquipmentGrid
                slots={gear.slots}
                onChange={slots => saveGear({ slots })}
                presets={gear.presets}
                onPresetsChange={presets => saveGear({ presets })}
              />
            )}

            {(tab === 'runes' || tab === 'pots') && (
              <div className="bg-[#141414] border border-[#242424] rounded-2xl p-6">
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
              </div>
            )}

            {tab === 'sessions' && (
              <div className="bg-[#141414] border border-[#242424] rounded-2xl p-6">
                <h3 className="text-sm font-semibold text-gray-200 mb-4">Hunt Sessions</h3>
                {character.sessions.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-14 text-gray-600 gap-2">
                    <Clock className="w-8 h-8 text-gray-700" />
                    <p className="text-sm text-gray-500">No sessions recorded yet</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {character.sessions.map(s => (
                      <div
                        key={s.id}
                        className="flex items-center gap-4 p-4 rounded-xl bg-[#1a1a1a] border border-[#242424] hover:border-[#333] transition-colors"
                      >
                        <div className="w-9 h-9 rounded-lg bg-[#212121] border border-[#2e2e2e] flex items-center justify-center flex-shrink-0">
                          <MapPin className="w-4 h-4 text-blue-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-white">{s.spot.name}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(s.startedAt).toLocaleDateString('pt-BR')} · {formatHours(s.duration)}
                          </p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-sm font-bold text-yellow-400">{formatGoldShort(s.goldEarned)}</p>
                          <p className="text-xs text-gray-500">{formatGoldShort(s.xpGained)} XP</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right sidebar */}
          <div className="space-y-4">
            {/* Equipment stats — only on equipment tab */}
            {tab === 'equipment' && (
              <EquipmentStats slots={gear.slots} />
            )}
          </div>

        </div>
      </div>
    </div>
  )
}
