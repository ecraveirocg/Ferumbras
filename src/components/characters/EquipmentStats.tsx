'use client'

import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { Shield, Sword, Zap, Wind, Star, TrendingUp, Flame, Snowflake, Leaf, Bolt, Cross, Skull } from 'lucide-react'
import type { GearSlots } from './EquipmentGrid'
import type { ItemStats } from '@/app/api/tibia/item-stats/route'

const ALL_SLOTS   = ['head', 'neck', 'back', 'left', 'body', 'right', 'ring', 'legs', 'ammo', 'feet']
const ARMOR_SLOTS = ['head', 'neck', 'back', 'body', 'right', 'ring', 'legs', 'feet']

// Module-level cache
const _cache = new Map<string, ItemStats | null>()

interface Props { slots: GearSlots }

interface StatRow {
  key:     string
  icon:    React.ReactNode
  label:   string
  value:   number
  display: string
  color:   string
  section: 'core' | 'magic' | 'prot' | 'req'
}

export default function EquipmentStats({ slots }: Props) {
  const [statsMap, setStatsMap] = useState<Record<string, ItemStats | null>>({})
  const [loading,  setLoading]  = useState(false)

  const equippedNames = ALL_SLOTS
    .map(k => slots[k])
    .filter((n): n is string => !!n?.trim())

  useEffect(() => {
    if (!equippedNames.length) return

    const fromCache: Record<string, ItemStats | null> = {}
    for (const n of equippedNames) {
      if (_cache.has(n)) fromCache[n] = _cache.get(n) ?? null
    }
    if (Object.keys(fromCache).length) setStatsMap(prev => ({ ...prev, ...fromCache }))

    const pending = equippedNames.filter(n => !_cache.has(n))
    if (!pending.length) return

    setLoading(true)
    Promise.all(
      pending.map(name =>
        fetch(`/api/tibia/item-stats?name=${encodeURIComponent(name)}`)
          .then(r  => r.json())
          .then((s: ItemStats | null) => { _cache.set(name, s);    return { name, s } })
          .catch(() =>                  { _cache.set(name, null);  return { name, s: null as ItemStats | null } })
      )
    ).then(results => {
      setStatsMap(prev => {
        const next = { ...prev }
        for (const { name, s } of results) next[name] = s
        return next
      })
      setLoading(false)
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [equippedNames.join('|')])

  const get = (slot: string): ItemStats | null =>
    statsMap[slots[slot] ?? ''] ?? null

  const sumNum = (keys: string[], field: keyof ItemStats): number =>
    keys.reduce((acc, k) => {
      const v = get(k)?.[field]
      return acc + (typeof v === 'number' ? v : 0)
    }, 0)

  const maxNum = (keys: string[], field: keyof ItemStats): number =>
    Math.max(0, ...keys.map(k => {
      const v = get(k)?.[field]
      return typeof v === 'number' ? v : 0
    }))

  // ── Compute all aggregate values ─────────────────────────────────────────
  const totalArm     = sumNum(ARMOR_SLOTS, 'arm')
  const weaponAtk    = get('left')?.atk    ?? 0
  const totalDef     = (get('right')?.def ?? 0) + (get('left')?.def ?? 0)
  const totalMl      = sumNum(ALL_SLOTS, 'ml')
  const totalIceml   = sumNum(ALL_SLOTS, 'iceml')
  const totalFireml  = sumNum(ALL_SLOTS, 'fireml')
  const totalEarthml = sumNum(ALL_SLOTS, 'earthml')
  const totalEnergyml= sumNum(ALL_SLOTS, 'energyml')
  const totalHealing = sumNum(ALL_SLOTS, 'healingml')
  const totalHolyml  = sumNum(ALL_SLOTS, 'holyml')
  const totalDeathml = sumNum(ALL_SLOTS, 'deathml')
  const totalSpeed   = sumNum(ALL_SLOTS, 'speed')
  const physProt     = sumNum(ALL_SLOTS, 'physProt')
  const fireProt     = sumNum(ALL_SLOTS, 'fireProt')
  const iceProt      = sumNum(ALL_SLOTS, 'iceProt')
  const earthProt    = sumNum(ALL_SLOTS, 'earthProt')
  const energyProt   = sumNum(ALL_SLOTS, 'energyProt')
  const holyProt     = sumNum(ALL_SLOTS, 'holyProt')
  const deathProt    = sumNum(ALL_SLOTS, 'deathProt')
  const reqLevel     = maxNum(ALL_SLOTS, 'lvl')

  // ── Build visible rows (hide zeros) ──────────────────────────────────────
  const rows = ([
    // Core
    { key: 'arm',     icon: <Shield  className="w-3.5 h-3.5 text-blue-400"  />, label: 'Total Armor',  value: totalArm,      display: String(totalArm),      color: 'text-blue-300',   section: 'core'  },
    { key: 'atk',     icon: <Sword   className="w-3.5 h-3.5 text-red-400"   />, label: 'Weapon Atk',   value: weaponAtk,     display: String(weaponAtk),     color: 'text-red-300',    section: 'core'  },
    { key: 'def',     icon: <Shield  className="w-3.5 h-3.5 text-yellow-500"/>, label: 'Total Def',    value: totalDef,      display: String(totalDef),      color: 'text-yellow-300', section: 'core'  },
    // Magic
    { key: 'ml',      icon: <Zap     className="w-3.5 h-3.5 text-purple-400"/>, label: 'Magic Level',  value: totalMl,       display: `+${totalMl}`,         color: 'text-purple-300', section: 'magic' },
    { key: 'iceml',   icon: <Snowflake className="w-3.5 h-3.5 text-cyan-400"  />, label: 'Ice ML',    value: totalIceml,    display: `+${totalIceml}`,      color: 'text-cyan-300',   section: 'magic' },
    { key: 'fireml',  icon: <Flame   className="w-3.5 h-3.5 text-orange-400"/>, label: 'Fire ML',      value: totalFireml,   display: `+${totalFireml}`,     color: 'text-orange-300', section: 'magic' },
    { key: 'earthml', icon: <Leaf    className="w-3.5 h-3.5 text-green-400" />, label: 'Earth ML',     value: totalEarthml,  display: `+${totalEarthml}`,    color: 'text-green-300',  section: 'magic' },
    { key: 'energyml',icon: <Bolt    className="w-3.5 h-3.5 text-yellow-300"/>, label: 'Energy ML',    value: totalEnergyml, display: `+${totalEnergyml}`,   color: 'text-yellow-200', section: 'magic' },
    { key: 'hml',     icon: <Cross   className="w-3.5 h-3.5 text-pink-400"  />, label: 'Healing ML',   value: totalHealing,  display: `+${totalHealing}`,    color: 'text-pink-300',   section: 'magic' },
    { key: 'holyml',  icon: <Star    className="w-3.5 h-3.5 text-amber-300" />, label: 'Holy ML',      value: totalHolyml,   display: `+${totalHolyml}`,     color: 'text-amber-200',  section: 'magic' },
    { key: 'deathml', icon: <Skull   className="w-3.5 h-3.5 text-violet-400"/>, label: 'Death ML',     value: totalDeathml,  display: `+${totalDeathml}`,    color: 'text-violet-300', section: 'magic' },
    // Speed
    { key: 'speed',   icon: <Wind    className="w-3.5 h-3.5 text-green-400" />, label: 'Speed Bonus',  value: totalSpeed,    display: `+${totalSpeed}`,      color: 'text-green-300',  section: 'magic' },
    // Protections
    { key: 'physp',   icon: <Shield  className="w-3.5 h-3.5 text-gray-400"  />, label: 'Physical Prot', value: physProt,    display: `+${physProt}%`,       color: 'text-gray-300',   section: 'prot'  },
    { key: 'firep',   icon: <Flame   className="w-3.5 h-3.5 text-orange-500"/>, label: 'Fire Prot',    value: fireProt,      display: `+${fireProt}%`,       color: 'text-orange-200', section: 'prot'  },
    { key: 'icep',    icon: <Snowflake className="w-3.5 h-3.5 text-cyan-500"  />, label: 'Ice Prot',  value: iceProt,       display: `+${iceProt}%`,        color: 'text-cyan-200',   section: 'prot'  },
    { key: 'earthp',  icon: <Leaf    className="w-3.5 h-3.5 text-green-500" />, label: 'Earth Prot',   value: earthProt,     display: `+${earthProt}%`,      color: 'text-green-200',  section: 'prot'  },
    { key: 'energyp', icon: <Bolt    className="w-3.5 h-3.5 text-yellow-400"/>, label: 'Energy Prot',  value: energyProt,    display: `+${energyProt}%`,     color: 'text-yellow-200', section: 'prot'  },
    { key: 'holyp',   icon: <Star    className="w-3.5 h-3.5 text-amber-400" />, label: 'Holy Prot',    value: holyProt,      display: `+${holyProt}%`,       color: 'text-amber-200',  section: 'prot'  },
    { key: 'deathp',  icon: <Skull   className="w-3.5 h-3.5 text-violet-500"/>, label: 'Death Prot',   value: deathProt,     display: `+${deathProt}%`,      color: 'text-violet-200', section: 'prot'  },
    // Requirement
    { key: 'lvl',     icon: <TrendingUp className="w-3.5 h-3.5 text-gray-400"/>, label: 'Min Level',  value: reqLevel,      display: String(reqLevel),      color: 'text-gray-300',   section: 'req'   },
  ] as StatRow[]).filter(r => r.value > 0)

  // Group by section for headers
  const sections: { id: string; label: string; rows: StatRow[] }[] = [
    { id: 'core',  label: 'Combat',     rows: rows.filter(r => r.section === 'core')  },
    { id: 'magic', label: 'Bonuses',    rows: rows.filter(r => r.section === 'magic') },
    { id: 'prot',  label: 'Protection', rows: rows.filter(r => r.section === 'prot')  },
    { id: 'req',   label: 'Req',        rows: rows.filter(r => r.section === 'req')   },
  ].filter(s => s.rows.length > 0)

  const hasEquipped = equippedNames.length > 0
  const hasLoaded   = Object.keys(statsMap).length > 0

  return (
    <div className="bg-[#141414] border border-[#242424] rounded-2xl overflow-hidden">
      <div className="px-4 py-3 flex items-center gap-2 border-b border-[#1e1e1e] bg-[#0d0d0d]/40">
        <Star className="w-3.5 h-3.5 text-yellow-400/60" />
        <h3 className="text-xs font-semibold text-gray-300 uppercase tracking-wider">Stats</h3>
        {loading && (
          <span className="ml-auto text-[10px] text-gray-600 animate-pulse">Fetching…</span>
        )}
      </div>

      <div className="p-4">
        {!hasEquipped ? (
          <p className="text-xs text-gray-600 text-center py-4">Equip items to see stats</p>
        ) : !hasLoaded && loading ? (
          <div className="space-y-2">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="flex items-center justify-between py-1">
                <div className="h-3 w-20 bg-[#222] rounded animate-pulse" />
                <div className="h-3 w-8  bg-[#222] rounded animate-pulse" />
              </div>
            ))}
          </div>
        ) : rows.length === 0 ? (
          <p className="text-xs text-gray-600 text-center py-4">Stats not available</p>
        ) : (
          <div className="space-y-4">
            {sections.map(section => (
              <div key={section.id}>
                {sections.length > 1 && (
                  <p className="text-[9px] font-semibold text-gray-600 uppercase tracking-widest mb-2">{section.label}</p>
                )}
                <div className="space-y-0.5">
                  {section.rows.map(row => (
                    <div
                      key={row.key}
                      className="flex items-center justify-between py-2 border-b border-[#1a1a1a] last:border-0"
                    >
                      <div className="flex items-center gap-2">
                        {row.icon}
                        <span className="text-xs text-gray-400">{row.label}</span>
                      </div>
                      <span className={cn('text-sm font-bold tabular-nums', row.color)}>{row.display}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
