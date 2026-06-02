'use client'

import { useState, useMemo } from 'react'
import { cn } from '@/lib/utils'
import Image from 'next/image'
import { Zap, ShieldCheck, Swords, Wand2, Target, Hand, Fish, FlaskConical } from 'lucide-react'

// ── Fórmula Tibia ─────────────────────────────────────────────────────────
// Base tries por tipo de skill
// BASE_TRIES para exercise weapons (magic calibrado: 3780 → druid ML120→125 c/ 3 buffs = 5 Daily weapons)
const BASE_TRIES: Record<string, number> = {
  magic: 3780, melee: 50, dist: 30, shield: 100, fist: 50,
}

// Taxa de progressão exponencial por nível (verificada empiricamente vs Rubinot Tools)
// magic = 1.0274 (o contexto tinha 1.1, que é a dificuldade por vocação, não a taxa)
const SKILL_RATE: Record<string, number> = {
  magic: 1.0278, melee: 1.1, dist: 1.1, shield: 1.1, fist: 1.1,
}

// Multiplicador de dificuldade por vocação (escala o base)
// druid/sorc magic = 1.0 (mais fácil), knight magic = 3.0 (muito mais difícil)
const VOCATION_DIFF: Record<string, Record<string, number>> = {
  knight:   { magic: 3.0,  melee: 1.0,  dist: 1.4,  shield: 1.0,  fist: 1.0  },
  paladin:  { magic: 1.4,  melee: 1.2,  dist: 1.0,  shield: 1.0,  fist: 1.2  },
  sorcerer: { magic: 1.0,  melee: 2.0,  dist: 2.0,  shield: 1.5,  fist: 1.5  },
  druid:    { magic: 1.0,  melee: 1.8,  dist: 1.8,  shield: 1.5,  fist: 1.5  },
  monk:     { magic: 1.25, melee: 1.4,  dist: 1.5,  shield: 1.15, fist: 1.0  },
}

const MANA_PER_TRY: Record<string, number> = {
  magic: 600, dist: 4.32, shield: 14.4, melee: 7.2, fist: 7.2,
}

function calcTries(vocation: string, skillType: string, level: number): number {
  const base    = BASE_TRIES[skillType] ?? 50
  const rate    = SKILL_RATE[skillType] ?? 1.1
  const vocDiff = VOCATION_DIFF[vocation]?.[skillType] ?? 1.0
  const start   = skillType === 'magic' ? 0 : 10
  const lvl     = skillType !== 'magic' && level < 10 ? 10 : level
  if (skillType !== 'magic' && lvl <= start) return 0
  if (skillType === 'magic' && lvl <= 0) return 0
  return base * vocDiff * (Math.pow(rate, lvl - start) - 1) / (rate - 1)
}

function triesBetween(vocation: string, skillType: string, from: number, to: number): number {
  return Math.max(0, calcTries(vocation, skillType, to) - calcTries(vocation, skillType, from))
}

// ── Weapons ────────────────────────────────────────────────────────────────
const WEAPONS = [
  { key: 'daily',   label: 'Daily Exercise',   charges: 45000,  gold: 31_250_000, tc: 390  },
  { key: 'lasting', label: 'Lasting Exercise',  charges: 14400,  gold: 10_000_000, tc: 190  },
  { key: 'durable', label: 'Durable Exercise',  charges: 1800,   gold:  1_250_000, tc: 80   },
  { key: 'regular', label: 'Regular Exercise',  charges: 500,    gold:    347_222, tc: 40   },
  { key: 'reward',  label: 'Reward Exercise',   charges: 5000,   gold:          0, tc: 0    },
]

// ── Vocations ──────────────────────────────────────────────────────────────
const VOCATIONS = [
  { key: 'knight',   label: 'Elite Knight',    gif: '/EK.gif', color: '#f97316' },
  { key: 'paladin',  label: 'Royal Paladin',   gif: '/RP.gif', color: '#84cc16' },
  { key: 'sorcerer', label: 'Master Sorcerer', gif: '/MS.gif', color: '#3b82f6' },
  { key: 'druid',    label: 'Elder Druid',     gif: '/ED.gif', color: '#d946ef' },
  { key: 'monk',     label: 'Exalted Monk',    gif: '/EM.gif', color: '#facc15' },
]

// ── Skills ─────────────────────────────────────────────────────────────────
const SKILLS = [
  { key: 'melee',  label: 'Melee',          icon: <Swords     className="w-4 h-4" />, skills: ['Sword Fighting', 'Axe Fighting', 'Club Fighting'] },
  { key: 'dist',   label: 'Distance',       icon: <Target     className="w-4 h-4" />, skills: ['Distance Fighting'] },
  { key: 'shield', label: 'Shielding',      icon: <ShieldCheck className="w-4 h-4" />, skills: ['Shielding'] },
  { key: 'fist',   label: 'Fist Fighting',  icon: <Hand       className="w-4 h-4" />, skills: ['Fist Fighting'] },
  { key: 'magic',  label: 'Magic Level',    icon: <Wand2      className="w-4 h-4" />, skills: ['Magic Level'] },
  { key: 'fish',   label: 'Fishing',        icon: <Fish       className="w-4 h-4" />, skills: ['Fishing'] },
]

function fmt(n: number, decimals = 0): string {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(2)}B`
  if (n >= 1_000_000)     return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000)         return `${(n / 1_000).toFixed(decimals)}k`
  return n.toLocaleString('pt-BR')
}

function ResultRow({ label, value, sub, color = 'text-white' }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-[#1e1e1e] last:border-0">
      <span className="text-sm text-gray-400">{label}</span>
      <div className="text-right">
        <span className={cn('text-sm font-bold tabular-nums', color)}>{value}</span>
        {sub && <p className="text-[10px] text-gray-600 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

export default function SkillCalcPage() {
  const [vocation,    setVocation]    = useState('knight')
  const [skillType,   setSkillType]   = useState('melee')
  const [fromLevel,   setFromLevel]   = useState(80)
  const [toLevel,     setToLevel]     = useState(120)
  const [weaponKey,    setWeaponKey]    = useState('daily')
  const [loyalty,      setLoyalty]      = useState(false)
  const [doubleEvent,  setDoubleEvent]  = useState(false)
  const [targetDummy,  setTargetDummy]  = useState(false)

  const TRIES_PER_HOUR = 2000 // ~2000/h (exercise weapon: ~1 charge/1.8s)

  const weapon = WEAPONS.find(w => w.key === weaponKey)!

  const result = useMemo(() => {
    const rawTries  = triesBetween(vocation, skillType, fromLevel, toLevel)
    const modifier  = (loyalty ? 1.1 : 1) * (doubleEvent ? 2 : 1) * (targetDummy ? 1.1 : 1)
    const netTries  = rawTries / modifier

    const weaponsNeeded  = weapon.charges > 0 ? Math.ceil(netTries / weapon.charges) : 0
    const goldCost       = weaponsNeeded * weapon.gold
    const tcCost         = weaponsNeeded * weapon.tc
    const manaPerTry     = MANA_PER_TRY[skillType] ?? 7.2
    const totalMana      = netTries * manaPerTry

    // Tempo estimado
    const totalHours     = netTries / TRIES_PER_HOUR
    const totalSecs      = Math.round(totalHours * 3600)
    const days    = Math.floor(totalSecs / 86400)
    const hours   = Math.floor((totalSecs % 86400) / 3600)
    const minutes = Math.floor((totalSecs % 3600) / 60)
    const timeStr = [
      days    > 0 ? `${days}d`   : '',
      hours   > 0 ? `${hours}h`  : '',
      minutes > 0 ? `${minutes}m`: '',
    ].filter(Boolean).join(' ') || '<1m'

    return { rawTries, netTries, modifier, weaponsNeeded, goldCost, tcCost, totalMana, timeStr, totalHours }
  }, [vocation, skillType, fromLevel, toLevel, weaponKey, loyalty, doubleEvent, targetDummy, weapon])

  const selectedVoc = VOCATIONS.find(v => v.key === vocation)!

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-white">Calculadora de Skill</h1>
        <p className="text-sm text-gray-500 mt-0.5">Calcule tries, weapons e gold para evoluir sua skill</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[1fr_300px] gap-4">

        {/* LEFT — inputs */}
        <div className="space-y-4">

          {/* Vocação */}
          <div className="bg-[#141414] border border-[#242424] rounded-2xl p-5">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Vocação</h3>
            <div className="grid grid-cols-5 gap-2">
              {VOCATIONS.map(v => (
                <button
                  key={v.key}
                  onClick={() => setVocation(v.key)}
                  className={cn(
                    'flex flex-col items-center gap-1.5 p-2.5 rounded-xl border transition-all',
                    vocation === v.key
                      ? 'border-[2px] bg-[#1e1e1e]'
                      : 'border-[#2a2a2a] bg-[#1a1a1a] hover:border-[#3a3a3a]'
                  )}
                  style={vocation === v.key ? { borderColor: v.color, boxShadow: `0 0 10px ${v.color}30` } : {}}
                >
                  <Image src={v.gif} alt={v.label} width={32} height={32} unoptimized className="object-contain" />
                  <span className="text-[9px] text-center leading-tight" style={{ color: vocation === v.key ? v.color : '#9ca3af' }}>
                    {v.label.split(' ').pop()}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Skill */}
          <div className="bg-[#141414] border border-[#242424] rounded-2xl p-5">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Skill</h3>
            <div className="grid grid-cols-3 gap-2">
              {SKILLS.map(s => (
                <button
                  key={s.key}
                  onClick={() => setSkillType(s.key)}
                  className={cn(
                    'flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm transition-all',
                    skillType === s.key
                      ? 'bg-gradient-to-r from-blue-500/20 to-purple-600/20 border-blue-500/50 text-white font-medium'
                      : 'border-[#2a2a2a] bg-[#1a1a1a] text-gray-400 hover:border-[#3a3a3a] hover:text-white'
                  )}
                >
                  {s.icon}
                  <span className="text-xs truncate">{s.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Níveis */}
          <div className="bg-[#141414] border border-[#242424] rounded-2xl p-5">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Níveis</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-500 mb-1.5 block">Skill atual</label>
                <input
                  type="number" min={0} max={9999} value={fromLevel}
                  onChange={e => setFromLevel(Number(e.target.value))}
                  className="w-full bg-[#0d0d0d] border border-[#2e2e2e] focus:border-blue-500 text-white text-sm rounded-xl px-3 py-2.5 outline-none transition-colors tabular-nums"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1.5 block">Skill alvo</label>
                <input
                  type="number" min={0} max={9999} value={toLevel}
                  onChange={e => setToLevel(Number(e.target.value))}
                  className="w-full bg-[#0d0d0d] border border-[#2e2e2e] focus:border-blue-500 text-white text-sm rounded-xl px-3 py-2.5 outline-none transition-colors tabular-nums"
                />
              </div>
            </div>

            {/* Progress preview */}
            <div className="mt-3 flex items-center gap-2">
              <div className="flex-1 h-1.5 bg-white/8 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-blue-500 to-purple-600 transition-all duration-300"
                  style={{ width: `${Math.min(100, toLevel > 0 ? (fromLevel / toLevel) * 100 : 0)}%` }}
                />
              </div>
              <span className="text-xs text-gray-500 tabular-nums">{fromLevel} → {toLevel}</span>
            </div>
          </div>

          {/* Weapon */}
          <div className="bg-[#141414] border border-[#242424] rounded-2xl p-5">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Exercise Weapon</h3>
            <div className="space-y-1.5">
              {WEAPONS.map(w => (
                <button
                  key={w.key}
                  onClick={() => setWeaponKey(w.key)}
                  className={cn(
                    'w-full flex items-center justify-between px-3 py-2.5 rounded-xl border transition-all text-left',
                    weaponKey === w.key
                      ? 'bg-gradient-to-r from-yellow-500/10 to-amber-500/10 border-yellow-500/40 text-white'
                      : 'border-[#2a2a2a] bg-[#1a1a1a] text-gray-400 hover:border-[#3a3a3a] hover:text-white'
                  )}
                >
                  <span className="text-sm font-medium">{w.label}</span>
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <span>{w.charges.toLocaleString()} charges</span>
                    {w.gold > 0 && <span className="text-yellow-500/70">{fmt(w.gold)} gp</span>}
                    {w.tc > 0   && <span className="text-blue-400/70">{w.tc} TC</span>}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Bônus */}
          <div className="bg-[#141414] border border-[#242424] rounded-2xl p-5">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Modificadores</h3>
            <div className="space-y-2">
              {[
                { key: 'loyalty',     label: 'VIP / Loyalty',       desc: 'Skill rate +10%',  value: loyalty,     set: setLoyalty     },
                { key: 'targetDummy', label: 'Exercise Dummy',       desc: 'Eficiência +10%',  value: targetDummy, set: setTargetDummy },
                { key: 'doubleEvent', label: 'Double Skill Event',   desc: 'Skill rate +100%', value: doubleEvent, set: setDoubleEvent },
              ].map(({ key, label, desc, value, set }) => (
                <button
                  key={key}
                  onClick={() => set(!value)}
                  className={cn(
                    'w-full flex items-center justify-between px-3 py-2.5 rounded-xl border transition-all',
                    value
                      ? 'bg-green-500/10 border-green-500/40 text-white'
                      : 'border-[#2a2a2a] bg-[#1a1a1a] text-gray-400 hover:border-[#3a3a3a]'
                  )}
                >
                  <div className="flex items-center gap-2">
                    <div className={cn('w-4 h-4 rounded border flex items-center justify-center transition-all', value ? 'bg-green-500 border-green-500' : 'border-gray-600')}>
                      {value && <span className="text-white text-[10px]">✓</span>}
                    </div>
                    <span className="text-sm">{label}</span>
                  </div>
                  <span className={cn('text-xs', value ? 'text-green-400' : 'text-gray-600')}>{desc}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT — resultado */}
        <div className="space-y-4">
          <div className="bg-[#141414] border border-[#242424] rounded-2xl overflow-hidden sticky top-4">
            {/* Header result */}
            <div className="px-5 py-4 border-b border-[#1e1e1e] flex items-center gap-3"
              style={{ background: `linear-gradient(135deg, ${selectedVoc.color}15, transparent)` }}
            >
              <Image src={selectedVoc.gif} alt={selectedVoc.label} width={36} height={36} unoptimized />
              <div>
                <p className="text-xs text-gray-500">Resultado</p>
                <p className="text-sm font-bold text-white">{selectedVoc.label}</p>
              </div>
              <div className="ml-auto text-right">
                <p className="text-[10px] text-gray-600">Skill</p>
                <p className="text-sm font-bold" style={{ color: selectedVoc.color }}>
                  {SKILLS.find(s => s.key === skillType)?.label}
                </p>
              </div>
            </div>

            <div className="px-5 py-2">
              <ResultRow
                label="Cargas necessárias"
                value={fmt(Math.round(result.netTries))}
                sub={loyalty || doubleEvent ? `${fmt(Math.round(result.rawTries))} sem bônus` : undefined}
                color="text-purple-300"
              />
              <ResultRow
                label="Weapons necessárias"
                value={result.weaponsNeeded.toLocaleString()}
                sub={`${weapon.charges.toLocaleString()} charges cada`}
                color="text-blue-300"
              />
              {weapon.gold > 0 && (
                <ResultRow
                  label="Custo em Gold"
                  value={`${fmt(result.goldCost)} gp`}
                  color="text-yellow-400"
                />
              )}
              {weapon.tc > 0 && (
                <ResultRow
                  label="Custo em TC"
                  value={`${result.weaponsNeeded * weapon.tc} TC`}
                  color="text-cyan-400"
                />
              )}
              <ResultRow
                label="Mana necessária"
                value={fmt(Math.round(result.totalMana))}
                color="text-pink-300"
              />
              <ResultRow
                label="Tempo estimado"
                value={result.timeStr}
                sub={`base: ~2000 charges/h`}
                color="text-emerald-300"
              />
            </div>

            {/* Modificadores ativos */}
            {(loyalty || doubleEvent || targetDummy) && (
              <div className="px-5 pb-4">
                <div className="flex flex-wrap gap-1.5 pt-2 border-t border-[#1e1e1e]">
                  {loyalty     && <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-500/10  border border-green-500/30  text-green-400">VIP +10%</span>}
                  {targetDummy && <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-400">Dummy +10%</span>}
                  {doubleEvent && <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-400">Double +100%</span>}
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400">
                    Total ×{result.modifier.toFixed(2).replace(/\.?0+$/, '')}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
