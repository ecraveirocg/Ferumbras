'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { X, Search, ChevronRight, Sparkles, Plus, BookMarked, Check, Trash2, RefreshCw, Database } from 'lucide-react'
import type { TibiaItem } from '@/app/api/tibia/items/route'
import type { ItemStats } from '@/app/api/tibia/item-stats/route'

// Module-level stats cache — persists across re-renders and hover cycles
const _statsCache = new Map<string, ItemStats | null | 'loading'>()

export type GearSlots = Record<string, string>

export interface GearPreset {
  id: string
  name: string
  slots: GearSlots
}

interface SlotDef {
  key: string
  label: string
  svg: React.ReactNode
}

const iconCls = 'w-7 h-7 text-white'

const SlotIcons: Record<string, React.ReactNode> = {
  head: (
    <svg viewBox="0 0 40 40" className={iconCls} fill="currentColor">
      <ellipse cx="20" cy="16" rx="10" ry="12" />
      <rect x="10" y="26" width="20" height="6" rx="2" />
      <rect x="8" y="30" width="24" height="3" rx="1.5" />
    </svg>
  ),
  neck: (
    <svg viewBox="0 0 40 40" className={iconCls} fill="currentColor">
      <circle cx="20" cy="18" r="8" />
      <ellipse cx="20" cy="18" rx="4" ry="4" fill="#111111" />
      <path d="M12 26 Q20 32 28 26" stroke="currentColor" strokeWidth="2" fill="none" />
    </svg>
  ),
  back: (
    <svg viewBox="0 0 40 40" className={iconCls} fill="currentColor">
      <rect x="10" y="8" width="20" height="24" rx="3" />
      <rect x="13" y="6" width="14" height="5" rx="2" />
      <rect x="17" y="8" width="6" height="18" rx="1" fill="#111111" />
      <rect x="10" y="20" width="20" height="2" fill="#111111" />
    </svg>
  ),
  left: (
    <svg viewBox="0 0 40 40" className={iconCls} fill="currentColor">
      <rect x="18" y="4" width="4" height="28" rx="2" />
      <rect x="10" y="14" width="20" height="4" rx="2" />
      <polygon points="20,4 17,10 23,10" />
    </svg>
  ),
  body: (
    <svg viewBox="0 0 40 40" className={iconCls} fill="currentColor">
      <path d="M12 8 L8 16 L12 36 L28 36 L32 16 L28 8 L24 12 L20 10 L16 12 Z" />
      <path d="M12 8 L16 12 L20 10 L24 12 L28 8" fill="#111111" strokeWidth="0" />
    </svg>
  ),
  right: (
    <svg viewBox="0 0 40 40" className={iconCls} fill="currentColor">
      <ellipse cx="20" cy="20" rx="13" ry="15" />
      <ellipse cx="20" cy="20" rx="8" ry="10" fill="#111111" />
      <rect x="18" y="5" width="4" height="6" rx="1" />
    </svg>
  ),
  ring: (
    <svg viewBox="0 0 40 40" className={iconCls} fill="currentColor">
      <ellipse cx="20" cy="22" rx="12" ry="8" />
      <ellipse cx="20" cy="22" rx="7" ry="4" fill="#111111" />
      <ellipse cx="20" cy="14" rx="5" ry="4" />
    </svg>
  ),
  legs: (
    <svg viewBox="0 0 40 40" className={iconCls} fill="currentColor">
      <path d="M12 6 L12 24 L17 36 L20 36 L20 6 Z" />
      <path d="M28 6 L28 24 L23 36 L20 36 L20 6 Z" />
      <rect x="12" y="6" width="16" height="4" rx="1" />
    </svg>
  ),
  ammo: (
    <svg viewBox="0 0 40 40" className={iconCls} fill="currentColor">
      <rect x="18" y="6" width="3" height="22" rx="1.5" />
      <polygon points="19.5,4 16,10 23,10" />
      <rect x="16" y="26" width="7" height="3" rx="1" />
      <rect x="12" y="4" width="3" height="18" rx="1.5" transform="rotate(-10 12 4)" />
      <rect x="24" y="4" width="3" height="18" rx="1.5" transform="rotate(10 24 4)" />
    </svg>
  ),
  feet: (
    <svg viewBox="0 0 40 40" className={iconCls} fill="currentColor">
      <path d="M8 20 Q8 10 16 10 L24 10 Q30 10 32 16 L32 24 L8 24 Z" />
      <rect x="8" y="24" width="24" height="6" rx="3" />
    </svg>
  ),
}

const SLOT_SUGGESTIONS: Record<string, string[]> = {
  head:  ['Demon Helmet', 'Plagueroot Armor (helm)', 'Crown of the Might', 'Depth Calcei', 'Gnome Helmet', 'Falcon Coif', 'Umbral Master Helmet'],
  neck:  ['Foxtail Amulet', 'Leviathan\'s Amulet', 'Prismatic Necklace', 'Garnet Amulet', 'Elven Amulet', 'Platinum Amulet'],
  back:  ['Miraculum', 'Umbral Master Backpack', 'Wolf Backpack', 'Dragon Backpack', 'Bear Backpack'],
  left:  ['Umbral Master Axe', 'Falcon Longsword', 'Umbral Master Slayer', 'Umbral Master Bow', 'Gnome Sword', 'Ferumbras\' Staff'],
  body:  ['Gnome Armor', 'Falcon Plate', 'Umbral Master Armor', 'Zaoan Armor', 'Royal Draken Mail', 'Cobra Axe'],
  right: ['Gnome Shield', 'Umbral Master Shield', 'Falcon Escutcheon', 'Zaoan Shield', 'Ornate Shield'],
  ring:  ['Dwarven Ring', 'Life Ring', 'Axe Ring', 'Energy Ring', 'Might Ring', 'Stone Skin Amulet'],
  legs:  ['Zaoan Legs', 'Gnome Legs', 'Falcon Greaves', 'Umbral Master Legs', 'Demonbone Armor'],
  ammo:  ['Opal Arrow', 'Onyx Arrow', 'Crystalline Arrow', 'Infernal Bolt', 'Spectral Bolt'],
  feet:  ['Gnome Boots', 'Falcon Boots', 'Umbral Master Boots', 'Zaoan Shoes', 'Soft Boots'],
}

const COMMON_IMBUEMENTS = [
  'Powerful Strike', 'Strong Strike', 'Fierce Strike',
  'Powerful Bash', 'Strong Bash', 'Fierce Bash',
  'Powerful Slash', 'Strong Slash', 'Fierce Slash',
  'Powerful Void', 'Strong Void', 'Fierce Void',
  'Powerful Lich Shroud', 'Powerful Demon Presence', 'Powerful Epiphany',
  'Powerful Swiftness', 'Powerful Vampirism', 'Powerful Dragon Hide',
  'Powerful Scorch', 'Powerful Frost', 'Powerful Venom',
  'Powerful Cloud Fabric', 'Powerful Reap',
]

const SLOT_DEFS: SlotDef[] = [
  { key: 'neck',  label: 'Amulet',      svg: SlotIcons.neck  },
  { key: 'head',  label: 'Helmet',      svg: SlotIcons.head  },
  { key: 'back',  label: 'Backpack',    svg: SlotIcons.back  },
  { key: 'left',  label: 'Left Hand',   svg: SlotIcons.left  },
  { key: 'body',  label: 'Body Armor',  svg: SlotIcons.body  },
  { key: 'right', label: 'Right Hand',  svg: SlotIcons.right },
  { key: 'ring',  label: 'Ring',        svg: SlotIcons.ring  },
  { key: 'legs',  label: 'Legs',        svg: SlotIcons.legs  },
  { key: 'ammo',  label: 'Ammunition',  svg: SlotIcons.ammo  },
  { key: 'feet',  label: 'Boots',       svg: SlotIcons.feet  },
]

const GRID_ROWS: (string | null)[][] = [
  ['neck',  'head', 'back' ],
  ['left',  'body', 'right'],
  ['ring',  'legs', 'ammo' ],
  [null,    'feet', null   ],
]

// ─── Imbuement slot combobox ──────────────────────────────────────────────────
interface ImbuSlotProps {
  label: string
  value: string
  onChange: (v: string) => void
}

function ImbuSlot({ label, value, onChange }: ImbuSlotProps) {
  const [open, setOpen]   = useState(false)
  const [query, setQuery] = useState('')
  const ref               = useRef<HTMLDivElement>(null)

  const filtered = query
    ? COMMON_IMBUEMENTS.filter(i => i.toLowerCase().includes(query.toLowerCase()))
    : COMMON_IMBUEMENTS

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const select = (v: string) => {
    onChange(v)
    setQuery('')
    setOpen(false)
  }

  const clear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange('')
    setQuery('')
  }

  return (
    <div ref={ref} className="relative flex-1">
      <button
        onClick={() => { setOpen(o => !o); setQuery('') }}
        className={cn(
          'w-full flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm text-left transition-all',
          open
            ? 'bg-[#0d0d0d] border-purple-500/60'
            : value
              ? 'bg-[#141414] border-[#3a3a3a] hover:border-[#4a4a4a]'
              : 'bg-[#111111] border-[#2a2a2a] hover:border-[#383838]'
        )}
      >
        <Sparkles className={cn('w-3.5 h-3.5 flex-shrink-0', value ? 'text-purple-400' : 'text-gray-600')} />
        <span className={cn('flex-1 truncate text-xs', value ? 'text-white' : 'text-gray-600')}>
          {value || label}
        </span>
        {value && (
          <span onClick={clear} className="text-gray-600 hover:text-red-400 transition-colors">
            <X className="w-3 h-3" />
          </span>
        )}
      </button>

      {open && (
        <div className="absolute top-full mt-1 left-0 right-0 z-50 bg-[#0d0d0d] border border-[#2e2e2e] rounded-xl shadow-2xl overflow-hidden">
          <div className="p-2 border-b border-[#1e1e1e]">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-500" />
              <input
                autoFocus
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && query.trim()) select(query.trim())
                  if (e.key === 'Escape') setOpen(false)
                }}
                placeholder="Search imbuement…"
                className="w-full bg-[#141414] border border-[#2a2a2a] text-white text-xs rounded-lg pl-7 pr-3 py-1.5 outline-none focus:border-purple-500/50 placeholder-gray-600"
              />
            </div>
          </div>
          <div className="max-h-48 overflow-y-auto">
            {filtered.map(item => (
              <button
                key={item}
                onClick={() => select(item)}
                className={cn(
                  'w-full flex items-center gap-2 px-3 py-2 text-xs text-left transition-colors',
                  value === item
                    ? 'bg-purple-500/15 text-purple-300'
                    : 'text-gray-400 hover:bg-[#1a1a1a] hover:text-white'
                )}
              >
                <Sparkles className="w-3 h-3 flex-shrink-0 opacity-50" />
                {item}
                {value === item && <span className="ml-auto text-[9px] text-purple-400">active</span>}
              </button>
            ))}
            {filtered.length === 0 && query && (
              <button
                onClick={() => select(query.trim())}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-blue-400 hover:bg-[#1a1a1a] transition-colors"
              >
                <span>Use &ldquo;{query}&rdquo;</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Item combobox (live TibiaWiki search with images) ───────────────────────
interface ItemComboProps {
  fallback: string[]
  value: string
  placeholder: string
  onCommit: (v: string, image?: string | null) => void
}

function ItemCombo({ fallback, value, placeholder, onCommit }: ItemComboProps) {
  const [open, setOpen]       = useState(false)
  const [query, setQuery]     = useState('')
  const [results, setResults] = useState<TibiaItem[]>([])
  const [loading, setLoading] = useState(false)
  const ref                   = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Debounced search — fetches names + images from TibiaWiki
  useEffect(() => {
    if (!query || query.length < 2) { setResults([]); return }
    const t = setTimeout(async () => {
      setLoading(true)
      try {
        const res  = await fetch(`/api/tibia/items?q=${encodeURIComponent(query)}`)
        const data: TibiaItem[] = await res.json()
        setResults(data)
      } catch { setResults([]) }
      finally { setLoading(false) }
    }, 320)
    return () => clearTimeout(t)
  }, [query])

  // Static fallback as TibiaItem (no image)
  const fallbackItems: TibiaItem[] = fallback.map(name => ({ name, image: null }))
  const displayList = query.length >= 2 ? results : fallbackItems

  const select = (v: string, image?: string | null) => {
    onCommit(v, image)
    setQuery('')
    setResults([])
    setOpen(false)
  }

  return (
    <div ref={ref} className="relative">
      {/* Trigger input */}
      <div
        onClick={() => setOpen(true)}
        className={cn(
          'flex items-center gap-2 px-3 py-2.5 rounded-xl border cursor-text transition-all',
          open ? 'bg-[#0d0d0d] border-blue-500' : 'bg-[#0d0d0d] border-[#2e2e2e] hover:border-[#3a3a3a]'
        )}
      >
        <Search className={cn('w-3.5 h-3.5 flex-shrink-0 transition-colors', loading ? 'text-blue-400 animate-pulse' : 'text-gray-500')} />
        <input
          value={open ? query : (value || '')}
          onChange={e => setQuery(e.target.value)}
          onFocus={() => setOpen(true)}
          onKeyDown={e => {
            if (e.key === 'Enter' && query.trim()) select(query.trim())
            if (e.key === 'Escape') setOpen(false)
          }}
          placeholder={placeholder}
          className="flex-1 bg-transparent text-white text-sm outline-none placeholder-gray-600 min-w-0"
        />
        {(open ? query : value) && (
          <button onClick={e => { e.stopPropagation(); select('') }} className="text-gray-600 hover:text-red-400 transition-colors">
            <X className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Dropdown */}
      {open && (
        <div className="absolute top-full mt-1 left-0 right-0 z-50 bg-[#0d0d0d] border border-[#2e2e2e] rounded-xl shadow-2xl overflow-hidden">
          {loading && (
            <div className="px-3 py-2 flex items-center gap-2 text-xs text-gray-500 border-b border-[#1e1e1e]">
              <Search className="w-3 h-3 animate-pulse text-blue-400" /> Searching TibiaWiki…
            </div>
          )}

          <div className="max-h-64 overflow-y-auto">
            {displayList.length > 0 ? (
              <>
                {query.length < 2 && (
                  <p className="px-3 pt-2 pb-1 text-[10px] text-gray-600 uppercase tracking-wide">Suggestions</p>
                )}
                {displayList.map(item => (
                  <button
                    key={item.name}
                    onMouseDown={e => { e.preventDefault(); select(item.name, item.image) }}
                    className={cn(
                      'w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left transition-colors',
                      value === item.name
                        ? 'bg-blue-500/15 text-blue-300'
                        : 'text-gray-400 hover:bg-[#1a1a1a] hover:text-white'
                    )}
                  >
                    {/* Item sprite */}
                    <div className="w-7 h-7 flex items-center justify-center flex-shrink-0 rounded bg-[#1a1a1a]">
                      {item.image ? (
                        <Image
                          src={item.image}
                          alt={item.name}
                          width={24}
                          height={24}
                          className="object-contain"
                          unoptimized
                        />
                      ) : (
                        <div className="w-4 h-4 rounded bg-[#2a2a2a]" />
                      )}
                    </div>
                    <span className="flex-1 truncate">{item.name}</span>
                    {value === item.name && <span className="ml-auto text-[9px] text-blue-400 flex-shrink-0">equipped</span>}
                  </button>
                ))}
              </>
            ) : query.length >= 2 && !loading ? (
              <button
                onMouseDown={e => { e.preventDefault(); select(query.trim()) }}
                className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-blue-400 hover:bg-[#1a1a1a] transition-colors"
              >
                Use &ldquo;{query}&rdquo;
              </button>
            ) : (
              <p className="px-3 py-3 text-xs text-gray-600 text-center">Type to search TibiaWiki items…</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Slot hover tooltip ───────────────────────────────────────────────────────
function TTRow({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-[10px] text-gray-500 flex-shrink-0">{label}</span>
      <span className={cn('text-[10px] font-bold tabular-nums', color)}>{value}</span>
    </div>
  )
}

interface SlotTooltipProps { name: string; image: string | null }

function SlotTooltip({ name, image }: SlotTooltipProps) {
  const [stats,   setStats]   = useState<ItemStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const cached = _statsCache.get(name)
    if (cached !== undefined && cached !== 'loading') {
      setStats(cached)
      setLoading(false)
      return
    }
    if (cached === 'loading') return  // another tooltip already fetching

    _statsCache.set(name, 'loading')
    setLoading(true)
    fetch(`/api/tibia/item-stats?name=${encodeURIComponent(name)}`)
      .then(r => r.json())
      .then((s: ItemStats | null) => { _statsCache.set(name, s); setStats(s);   setLoading(false) })
      .catch(()                    => { _statsCache.set(name, null);             setLoading(false) })
  }, [name])

  const rows: { label: string; value: string | number; color: string }[] = []
  if (stats) {
    // Core stats
    if (stats.arm    != null)             rows.push({ label: 'Armor',            value: stats.arm,               color: 'text-blue-400'   })
    if (stats.atk    != null)             rows.push({ label: 'Attack',           value: stats.atk,               color: 'text-red-400'    })
    if (stats.def    != null)             rows.push({ label: 'Defense',          value: stats.def,               color: 'text-yellow-400' })
    // ML bonuses
    if (stats.ml     && stats.ml !== 0)   rows.push({ label: 'Magic Level',      value: `+${stats.ml}`,          color: 'text-purple-400' })
    if (stats.iceml  && stats.iceml  > 0) rows.push({ label: 'Ice ML',           value: `+${stats.iceml}`,       color: 'text-cyan-400'   })
    if (stats.fireml && stats.fireml > 0) rows.push({ label: 'Fire ML',          value: `+${stats.fireml}`,      color: 'text-orange-400' })
    if (stats.earthml && stats.earthml>0) rows.push({ label: 'Earth ML',         value: `+${stats.earthml}`,     color: 'text-green-400'  })
    if (stats.energyml&&stats.energyml>0) rows.push({ label: 'Energy ML',        value: `+${stats.energyml}`,    color: 'text-yellow-300' })
    if (stats.healingml&&stats.healingml>0) rows.push({ label: 'Healing ML',     value: `+${stats.healingml}`,   color: 'text-pink-400'   })
    if (stats.holyml && stats.holyml > 0) rows.push({ label: 'Holy ML',          value: `+${stats.holyml}`,      color: 'text-amber-300'  })
    if (stats.deathml&& stats.deathml> 0) rows.push({ label: 'Death ML',         value: `+${stats.deathml}`,     color: 'text-violet-400' })
    // Speed & slots
    if (stats.speed  && stats.speed !== 0)rows.push({ label: 'Speed',            value: `+${stats.speed}`,       color: 'text-green-400'  })
    if (stats.slots  && stats.slots > 0)  rows.push({ label: 'Imbue Slots',      value: stats.slots,             color: 'text-indigo-300' })
    // Protections
    if (stats.physProt   && stats.physProt   > 0) rows.push({ label: 'Phys Prot',    value: `+${stats.physProt}%`,   color: 'text-gray-300'   })
    if (stats.fireProt   && stats.fireProt   > 0) rows.push({ label: 'Fire Prot',    value: `+${stats.fireProt}%`,   color: 'text-orange-300' })
    if (stats.iceProt    && stats.iceProt    > 0) rows.push({ label: 'Ice Prot',     value: `+${stats.iceProt}%`,    color: 'text-cyan-300'   })
    if (stats.earthProt  && stats.earthProt  > 0) rows.push({ label: 'Earth Prot',   value: `+${stats.earthProt}%`,  color: 'text-green-300'  })
    if (stats.energyProt && stats.energyProt > 0) rows.push({ label: 'Energy Prot',  value: `+${stats.energyProt}%`, color: 'text-yellow-300' })
    if (stats.holyProt   && stats.holyProt   > 0) rows.push({ label: 'Holy Prot',    value: `+${stats.holyProt}%`,   color: 'text-amber-300'  })
    if (stats.deathProt  && stats.deathProt  > 0) rows.push({ label: 'Death Prot',   value: `+${stats.deathProt}%`,  color: 'text-violet-300' })
    // Requirements
    if (stats.lvl    && stats.lvl    > 0)  rows.push({ label: 'Level Req',        value: stats.lvl,               color: 'text-gray-400'   })
    if (stats.voc    && stats.voc !== 'all') rows.push({ label: 'Vocation',        value: stats.voc,               color: 'text-orange-300' })
    if (stats.weight != null)              rows.push({ label: 'Weight',            value: `${stats.weight} oz`,    color: 'text-gray-500'   })
  }

  return (
    // Render above the slot; shift left so it centers over wider tooltip
    <div
      className="absolute bottom-[calc(100%+10px)] left-1/2 -translate-x-1/2 z-[200] w-52 pointer-events-none select-none"
    >
      {/* Card */}
      <div className="bg-[#0a0a0a] border border-[#383838] rounded-xl shadow-2xl p-3">
        {/* Item header */}
        <div className="flex items-center gap-2 mb-2 pb-2 border-b border-[#2a2a2a]">
          {image ? (
            <Image src={image} alt={name} width={22} height={22} className="object-contain flex-shrink-0" unoptimized />
          ) : (
            <div className="w-5 h-5 rounded bg-[#1e1e1e] flex-shrink-0" />
          )}
          <p className="text-[11px] font-semibold text-white leading-tight truncate">{name}</p>
        </div>

        {loading ? (
          <div className="flex items-center gap-1.5 py-1">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-ping" />
            <span className="text-[10px] text-gray-600">Loading stats…</span>
          </div>
        ) : rows.length > 0 ? (
          <div className="space-y-1">
            {rows.map(r => <TTRow key={r.label} {...r} />)}
          </div>
        ) : (
          <p className="text-[10px] text-gray-600 py-1 text-center">No stats found</p>
        )}
      </div>

      {/* Arrow pointing down */}
      <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0
        border-l-[6px] border-l-transparent
        border-r-[6px] border-r-transparent
        border-t-[6px] border-t-[#383838]" />
    </div>
  )
}

// ─── DB Sync banner ───────────────────────────────────────────────────────────
function SyncBanner() {
  const [dbCount,   setDbCount]   = useState<number | null>(null)
  const [syncing,   setSyncing]   = useState(false)
  const [progress,  setProgress]  = useState('')
  const [done,      setDone]      = useState(false)

  const [noImageCount, setNoImageCount] = useState(0)

  // Check current DB count on mount
  useEffect(() => {
    fetch('/api/tibia/sync')
      .then(r => r.json())
      .then(d => { setDbCount(d.count ?? 0); setNoImageCount(d.noImageCount ?? 0) })
      .catch(() => setDbCount(0))
  }, [])

  const startSync = useCallback(async () => {
    setSyncing(true)
    setDone(false)
    setProgress('Connecting to TibiaWiki…')

    try {
      const res = await fetch('/api/tibia/sync', { method: 'POST' })
      const reader = res.body!.getReader()
      const dec    = new TextDecoder()

      while (true) {
        const { done: streamDone, value } = await reader.read()
        if (streamDone) break

        const lines = dec.decode(value).split('\n')
        for (const line of lines) {
          if (!line.startsWith('data:')) continue
          try {
            const payload = JSON.parse(line.slice(5).trim())
            setProgress(payload.msg ?? '')
            if (payload.status === 'done') {
              setDbCount(payload.total)
              setDone(true)
              setSyncing(false)
            }
            if (payload.status === 'error') {
              setProgress(`❌ ${payload.msg}`)
              setSyncing(false)
            }
          } catch { /* skip malformed line */ }
        }
      }
    } catch (e: any) {
      setProgress(`❌ ${e.message}`)
      setSyncing(false)
    }
  }, [])

  // Already synced — show compact status (warn if images are missing)
  if (dbCount !== null && dbCount > 0 && !syncing) return (
    <div className="flex items-center gap-1.5 text-[10px] text-gray-600">
      <Database className={cn('w-3 h-3', noImageCount > 0 ? 'text-yellow-500/70' : 'text-green-500/70')} />
      <span>{dbCount.toLocaleString()} items in DB</span>
      {noImageCount > 0 && (
        <span className="text-yellow-600">· {noImageCount} sem imagem</span>
      )}
      <button
        onClick={startSync}
        className="ml-auto text-gray-600 hover:text-white transition-colors flex items-center gap-1 hover:bg-[#2a2a2a] px-1.5 py-0.5 rounded"
        title={noImageCount > 0 ? 'Re-sync to fetch missing images' : 'Re-sync items'}
      >
        <RefreshCw className="w-2.5 h-2.5" /> {noImageCount > 0 ? 'Re-sync (fix images)' : 'Resync'}
      </button>
    </div>
  )

  // Not synced yet — show prominent banner
  if (dbCount === 0 && !syncing) return (
    <div className="flex items-center gap-3 px-3 py-2.5 bg-blue-500/8 border border-blue-500/20 rounded-xl">
      <Database className="w-4 h-4 text-blue-400 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-blue-300">Download Tibia items</p>
        <p className="text-[10px] text-gray-500">Sync all items from TibiaWiki to search offline.</p>
      </div>
      <button
        onClick={startSync}
        className="flex-shrink-0 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5"
      >
        <RefreshCw className="w-3 h-3" /> Sync now
      </button>
    </div>
  )

  // Syncing — show progress
  return (
    <div className="flex items-center gap-2 px-3 py-2.5 bg-[#111] border border-[#2a2a2a] rounded-xl">
      <RefreshCw className="w-3.5 h-3.5 text-blue-400 animate-spin flex-shrink-0" />
      <p className="text-xs text-gray-400 flex-1 truncate">{progress}</p>
      {done && <Check className="w-3.5 h-3.5 text-green-400 flex-shrink-0" />}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────
interface Props {
  slots?: GearSlots
  onChange: (slots: GearSlots) => void
  presets?: GearPreset[]
  onPresetsChange?: (presets: GearPreset[]) => void
}

export default function EquipmentGrid({ slots = {}, onChange, presets = [], onPresetsChange }: Props) {
  const slotMap  = Object.fromEntries(SLOT_DEFS.map(d => [d.key, d]))
  const [selected,    setSelected]    = useState<string | null>('body')
  // name → image URL cache (persists across slot changes)
  const [imageCache,  setImageCache]  = useState<Record<string, string | null>>({})
  // slot key currently showing tooltip
  const [hoveredSlot, setHoveredSlot] = useState<string | null>(null)
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // On mount + whenever slots change, fetch images for any filled slots not yet cached
  useEffect(() => {
    const equippedNames = SLOT_DEFS
      .map(d => slots[d.key])
      .filter((n): n is string => !!n?.trim() && !(n in imageCache))
    if (!equippedNames.length) return

    const unique = Array.from(new Set(equippedNames))
    fetch(`/api/tibia/items?names=${unique.map(encodeURIComponent).join('|')}`)
      .then(r => r.json())
      .then((items: { name: string; image: string | null }[]) => {
        setImageCache(prev => {
          const next = { ...prev }
          for (const item of items) next[item.name] = item.image
          return next
        })
      })
      .catch(() => {})
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slots])

  // Preset state
  const [savingPreset, setSavingPreset] = useState(false)
  const [presetName, setPresetName]     = useState('')
  const [loadedId, setLoadedId]         = useState<string | null>(null)

  const selectSlot = (key: string) => setSelected(key)
  const clearSlot  = (key: string) => onChange({ ...slots, [key]: '' })

  // Tooltip hover with a short delay to avoid flicker on fast mouse movement
  const handleSlotEnter = (key: string) => {
    if (!slots[key]) return
    if (hoverTimer.current) clearTimeout(hoverTimer.current)
    hoverTimer.current = setTimeout(() => setHoveredSlot(key), 180)
  }
  const handleSlotLeave = () => {
    if (hoverTimer.current) clearTimeout(hoverTimer.current)
    setHoveredSlot(null)
  }

  const setItem    = (val: string, image?: string | null) => {
    if (!selected) return
    onChange({ ...slots, [selected]: val })
    // Cache the image immediately so the slot shows it right away
    if (val && image !== undefined) {
      setImageCache(prev => ({ ...prev, [val]: image ?? null }))
    }
  }

  const savePreset = () => {
    const name = presetName.trim()
    if (!name) return
    const newPreset: GearPreset = {
      id: Date.now().toString(),
      name,
      slots: { ...slots },
    }
    onPresetsChange?.([...presets, newPreset])
    setPresetName('')
    setSavingPreset(false)
  }

  const loadPreset = (preset: GearPreset) => {
    onChange({ ...preset.slots })
    setLoadedId(preset.id)
    setTimeout(() => setLoadedId(null), 1800)
  }

  const deletePreset = (id: string) => {
    onPresetsChange?.(presets.filter(p => p.id !== id))
  }

  const selectedDef = selected ? slotMap[selected] : null
  const suggestions = selected ? (SLOT_SUGGESTIONS[selected] ?? []) : []

  // Count filled slots for a preset preview
  const filledCount = (s: GearSlots) =>
    SLOT_DEFS.filter(d => s[d.key]?.trim()).length

  return (
    <div className="flex gap-4 items-start">

      {/* LEFT COLUMN — slot grid + presets */}
      <div className="flex flex-col gap-4 flex-shrink-0">

        {/* Equipment Preset card */}
        <div className="bg-[#1a1a1a] border border-[#2e2e2e] rounded-xl p-5">
          <h3 className="text-sm font-semibold text-gray-300 mb-1">Equipment Preset</h3>
          <p className="text-xs text-gray-500 mb-4">Select a slot to assign an item.</p>

          <div className="flex flex-col gap-1.5">
            {GRID_ROWS.map((row, ri) => (
              <div key={ri} className="flex gap-1.5">
                {row.map((key, ci) =>
                  key === null ? (
                    <div key={ci} className="w-[72px] h-[72px]" />
                  ) : (
                    <button
                      key={key}
                      title={slotMap[key].label}
                      onClick={() => selectSlot(key)}
                      onMouseEnter={() => handleSlotEnter(key)}
                      onMouseLeave={handleSlotLeave}
                      className={cn(
                        'w-[72px] h-[72px] flex flex-col items-center justify-center gap-1 rounded-xl transition-all relative group',
                        'border',
                        selected === key
                          ? 'bg-[#1a1f2e] border-blue-500 shadow-[0_0_12px_rgba(59,130,246,0.3)]'
                          : slots[key]
                            ? 'bg-[#141414] border-[#3a3a3a] hover:border-[#4a4a4a]'
                            : 'bg-[#111111] border-[#2a2a2a] hover:border-[#383838]'
                      )}
                    >
                      <div className={cn(
                        'transition-opacity',
                        slots[key] && imageCache[slots[key]] ? 'opacity-0' :
                        slots[key] ? 'opacity-20' :
                        selected === key ? 'opacity-60' : 'opacity-25'
                      )}>
                        {slotMap[key].svg}
                      </div>

                      {slots[key] ? (
                        <span className="absolute inset-0 flex flex-col items-center justify-center">
                          {imageCache[slots[key]] ? (
                            <>
                              <Image
                                src={imageCache[slots[key]]!}
                                alt={slots[key]}
                                width={48}
                                height={48}
                                className="object-contain w-12 h-12"
                                unoptimized
                              />
                            </>
                          ) : (
                            <span className="text-[8px] text-gray-300 text-center leading-tight line-clamp-3 px-1">{slots[key]}</span>
                          )}
                        </span>
                      ) : (
                        <span className={cn(
                          'text-[8px] leading-tight',
                          selected === key ? 'text-blue-400' : 'text-gray-600'
                        )}>
                          {slotMap[key].label}
                        </span>
                      )}

                      {slots[key] && (
                        <button
                          onClick={e => { e.stopPropagation(); clearSlot(key) }}
                          className="absolute top-0.5 right-0.5 opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-400 transition-all"
                        >
                          <X className="w-2.5 h-2.5" />
                        </button>
                      )}

                      {/* Hover stats tooltip */}
                      {hoveredSlot === key && slots[key] && (
                        <SlotTooltip
                          name={slots[key]}
                          image={imageCache[slots[key]] ?? null}
                        />
                      )}
                    </button>
                  )
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Presets card */}
        <div className="bg-[#1a1a1a] border border-[#2e2e2e] rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <BookMarked className="w-3.5 h-3.5 text-gray-400" />
              <h3 className="text-sm font-semibold text-gray-300">Presets</h3>
              {presets.length > 0 && (
                <span className="text-[10px] text-gray-600 bg-[#2a2a2a] px-1.5 py-0.5 rounded-full">
                  {presets.length}
                </span>
              )}
            </div>
            {!savingPreset && (
              <button
                onClick={() => setSavingPreset(true)}
                className="flex items-center gap-1 text-xs text-gray-500 hover:text-white transition-colors px-2 py-1 rounded-lg hover:bg-[#2a2a2a]"
              >
                <Plus className="w-3 h-3" /> Save current
              </button>
            )}
          </div>

          {/* Save preset input */}
          {savingPreset && (
            <div className="flex gap-2 mb-3">
              <input
                autoFocus
                value={presetName}
                onChange={e => setPresetName(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') savePreset()
                  if (e.key === 'Escape') { setSavingPreset(false); setPresetName('') }
                }}
                placeholder="Preset name…"
                className="flex-1 bg-[#0d0d0d] border border-[#2e2e2e] focus:border-blue-500 text-white text-xs rounded-lg px-3 py-1.5 outline-none placeholder-gray-600 transition-colors"
              />
              <button
                onClick={savePreset}
                disabled={!presetName.trim()}
                className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs rounded-lg transition-colors flex items-center gap-1"
              >
                <Check className="w-3 h-3" /> Save
              </button>
              <button
                onClick={() => { setSavingPreset(false); setPresetName('') }}
                className="px-2 py-1.5 text-gray-500 hover:text-white text-xs rounded-lg transition-colors hover:bg-[#2a2a2a]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Preset list */}
          {presets.length === 0 && !savingPreset ? (
            <p className="text-xs text-gray-600 text-center py-3">
              No presets yet — configure your gear and save it.
            </p>
          ) : (
            <div className="flex flex-col gap-1.5">
              {presets.map(preset => (
                <div
                  key={preset.id}
                  className={cn(
                    'flex items-center gap-2 px-3 py-2.5 rounded-xl border transition-all group cursor-pointer',
                    loadedId === preset.id
                      ? 'bg-green-500/10 border-green-500/40'
                      : 'bg-[#111111] border-[#2a2a2a] hover:border-[#3a3a3a] hover:bg-[#141414]'
                  )}
                  onClick={() => loadPreset(preset)}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-white truncate">{preset.name}</p>
                    <p className="text-[10px] text-gray-600">
                      {filledCount(preset.slots)}/{SLOT_DEFS.length} slots filled
                    </p>
                  </div>

                  {loadedId === preset.id ? (
                    <Check className="w-3.5 h-3.5 text-green-400 flex-shrink-0" />
                  ) : (
                    <button
                      onClick={e => { e.stopPropagation(); deletePreset(preset.id) }}
                      className="opacity-0 group-hover:opacity-100 text-gray-600 hover:text-red-400 transition-all flex-shrink-0"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* RIGHT CARD — item picker */}
      <div className="bg-[#1a1a1a] border border-[#2e2e2e] rounded-xl p-5 flex-1 min-w-0">
        {selectedDef ? (
          <div className="flex flex-col gap-4">

            {/* Slot header */}
            <div className="flex items-center gap-2 pb-3 border-b border-[#2a2a2a]">
              <div className="w-9 h-9 flex items-center justify-center rounded-lg bg-[#1a1f2e] border border-blue-500/40 flex-shrink-0">
                <div className="opacity-70 scale-75">{selectedDef.svg}</div>
              </div>
              <div>
                <p className="text-sm font-semibold text-white">{selectedDef.label}</p>
                <p className="text-[11px] text-gray-500">
                  {slots[selected!] ? 'Item equipped' : 'Empty slot'}
                </p>
              </div>
              {slots[selected!] && (
                <button
                  onClick={() => clearSlot(selected!)}
                  className="ml-auto text-gray-500 hover:text-red-400 transition-colors flex items-center gap-1 text-xs"
                >
                  <X className="w-3 h-3" /> Clear
                </button>
              )}
            </div>

            {/* Current item */}
            {slots[selected!] && (
              <div className="flex items-center gap-2 px-3 py-2 bg-[#141414] border border-[#3a3a3a] rounded-lg">
                {imageCache[slots[selected!]] ? (
                  <Image
                    src={imageCache[slots[selected!]]!}
                    alt={slots[selected!]}
                    width={28}
                    height={28}
                    className="object-contain flex-shrink-0"
                    unoptimized
                  />
                ) : (
                  <ChevronRight className="w-3 h-3 text-blue-400 flex-shrink-0" />
                )}
                <span className="text-sm text-white truncate">{slots[selected!]}</span>
              </div>
            )}

            {/* DB sync status */}
            <SyncBanner />

            {/* Item search combobox */}
            <div>
              <p className="text-[10px] text-gray-500 mb-1.5 uppercase tracking-wide">Item</p>
              <ItemCombo
                fallback={suggestions}
                value={slots[selected!] ?? ''}
                placeholder={`Search ${selectedDef.label} on TibiaWiki…`}
                onCommit={(name, image) => setItem(name, image)}
              />
            </div>

            {/* Imbuements */}
            <div>
              <p className="text-[10px] text-gray-500 mb-1.5 uppercase tracking-wide flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-purple-400" /> Imbuements
              </p>
              <div className="flex gap-2">
                <ImbuSlot
                  label="Imbuement slot 1"
                  value={slots[`${selected!}_imbu1`] ?? ''}
                  onChange={v => onChange({ ...slots, [`${selected!}_imbu1`]: v })}
                />
                <ImbuSlot
                  label="Imbuement slot 2"
                  value={slots[`${selected!}_imbu2`] ?? ''}
                  onChange={v => onChange({ ...slots, [`${selected!}_imbu2`]: v })}
                />
              </div>
            </div>

          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-600 py-12 gap-2">
            <div className="w-10 h-10 rounded-xl bg-[#141414] border border-[#2a2a2a] flex items-center justify-center opacity-40">
              <svg viewBox="0 0 40 40" className="w-6 h-6 text-white" fill="currentColor">
                <path d="M12 8 L8 16 L12 36 L28 36 L32 16 L28 8 L24 12 L20 10 L16 12 Z" />
              </svg>
            </div>
            <p className="text-sm">Select a slot on the left</p>
            <p className="text-xs text-gray-700">to assign an item to this preset</p>
          </div>
        )}
      </div>

    </div>
  )
}
