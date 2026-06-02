'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Target, Plus, CheckCircle2, Clock, ShoppingBag, Zap } from 'lucide-react'
import Image from 'next/image'
import { cn } from '@/lib/utils'

interface Goal {
  id:          number
  type:        'GENERAL' | 'ITEM' | 'LEVEL'
  title:       string
  itemImage:   string | null
  description: string | null
  target:      number | null
  current:     number
  unit:        string | null
  deadline:    string | null
  completed:   boolean
}

const CYCLE_MS = 6000

function fGold(v: number) {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}kk`
  if (v >= 1_000)     return `${(v / 1_000).toFixed(0)}k`
  return String(v)
}
function fXP(v: number) {
  if (v >= 1_000_000_000) return `${(v / 1_000_000_000).toFixed(2)}B`
  if (v >= 1_000_000)     return `${(v / 1_000_000).toFixed(1)}M`
  if (v >= 1_000)         return `${(v / 1_000).toFixed(0)}k`
  return String(v)
}
function fETA(s: number) {
  if (s <= 0) return '0s'
  const d = Math.floor(s / 86400)
  const h = Math.floor((s % 86400) / 3600)
  const m = Math.floor((s % 3600) / 60)
  const parts = []
  if (d > 0) parts.push(`${d}d`)
  if (h > 0) parts.push(`${h}h`)
  if (m > 0) parts.push(`${m}m`)
  return parts.join(' ') || '<1m'
}
function tibiaXP(n: number) {
  return Math.floor((50 / 3) * (n ** 3 - 6 * n ** 2 + 17 * n - 12))
}
function xpBetween(from: number, to: number) {
  return Math.max(0, tibiaXP(to) - tibiaXP(from))
}

export default function GoalsCard() {
  const [goals,       setGoals]       = useState<Goal[]>([])
  const [goldPerHr,   setGoldPerHr]   = useState(0)
  const [xpPerHr,     setXpPerHr]     = useState(0)
  const [index,       setIndex]       = useState(0)
  const [visible,     setVisible]     = useState(true)
  const [loading,     setLoading]     = useState(true)
  const [itemImage,   setItemImage]   = useState<string | null>(null)

  useEffect(() => {
    Promise.all([
      fetch('/api/goals').then(r => r.json()),
      fetch('/api/summary?timeFilter=all').then(r => r.json()),
    ]).then(([g, s]) => {
      setGoals(Array.isArray(g) ? g : [])
      setGoldPerHr(s?.avgGoldPerHour ?? 0)
      setXpPerHr(s?.avgXpPerHour ?? 0)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (goals.length <= 1) return
    const t = setInterval(() => go(i => (i + 1) % goals.length), CYCLE_MS)
    return () => clearInterval(t)
  }, [goals.length])

  const go = (next: number | ((i: number) => number)) => {
    setVisible(false)
    setTimeout(() => { setIndex(typeof next === 'function' ? next : () => next); setVisible(true) }, 500)
  }

  const goal = goals[index]

  useEffect(() => {
    if (!goal || goal.type !== 'ITEM') { setItemImage(null); return }
    if (goal.itemImage) { setItemImage(goal.itemImage); return }
    fetch(`/api/tibia/items?names=${encodeURIComponent(goal.title)}`)
      .then(r => r.json())
      .then((d: { name: string; image: string | null }[]) => setItemImage(Array.isArray(d) ? d[0]?.image ?? null : null))
      .catch(() => setItemImage(null))
  }, [goal?.id, goal?.type, goal?.title, goal?.itemImage])

  if (loading) return <div className="h-[38px] bg-[#141414] border border-[#242424] rounded-xl animate-pulse" />

  if (goals.length === 0) return (
    <div className="flex items-center justify-between bg-[#141414] border border-[#242424] rounded-xl px-4 py-2">
      <div className="flex items-center gap-2">
        <Target className="w-4 h-4 text-gray-600" />
        <p className="text-sm text-gray-500">Nenhum objetivo definido</p>
      </div>
      <Link href="/goals" className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 text-white font-medium hover:opacity-90 transition-opacity">
        <Plus className="w-3 h-3" /> Adicionar
      </Link>
    </div>
  )

  const pct = goal?.target && goal.target > 0
    ? Math.min(100, Math.round((goal.current / goal.target) * 100))
    : null

  // ITEM ETA
  const itemEta: number | null = (() => {
    if (goal?.type !== 'ITEM' || !goal.target || goal.completed || goldPerHr <= 0) return null
    const rem = goal.target - goal.current
    return rem <= 0 ? 0 : Math.round((rem / goldPerHr) * 3600)
  })()

  // LEVEL ETA
  const levelEta: number | null = (() => {
    if (goal?.type !== 'LEVEL' || !goal.target || goal.completed || xpPerHr <= 0) return null
    const xp = xpBetween(goal.current, goal.target)
    return xp <= 0 ? 0 : Math.round((xp / xpPerHr) * 3600)
  })()

  const isSanguine = goal?.type === 'ITEM' && /sanguine/i.test(goal?.title ?? '')
  const isLevel    = goal?.type === 'LEVEL'

  const inner = (
    <div className="flex items-center gap-3 px-4 py-2 h-[52px]" style={{ opacity: visible ? 1 : 0, transition: visible ? 'opacity 600ms ease' : 'opacity 400ms ease' }}>

      {/* Icon */}
      <div className={cn(
        'w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden',
        goal.completed    ? 'bg-green-500/15' :
        goal.type === 'ITEM'  ? 'bg-[#1a1a1a] border border-[#2a2a2a]' :
        goal.type === 'LEVEL' ? 'bg-blue-500/10 border border-blue-500/20' :
        'bg-purple-500/15'
      )}>
        {goal.completed         ? <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />  :
         goal.type === 'ITEM'   ? (itemImage ? <Image src={itemImage} alt={goal.title} width={24} height={24} className="object-contain" unoptimized /> : <ShoppingBag className="w-3.5 h-3.5 text-yellow-400" />) :
         goal.type === 'LEVEL'  ? <Zap className="w-3.5 h-3.5 text-blue-400" />             :
         <Target className="w-3.5 h-3.5 text-purple-400" />
        }
      </div>

      {/* Content — mirrors GoalRow layout per type */}
      <div className="flex-1 min-w-0">

        {goal.type === 'ITEM' && goal.target ? (
          <>
            <div className="flex items-center gap-2 mb-0.5">
              <span className={cn('text-sm font-semibold truncate', goal.completed ? 'text-green-400 line-through' : 'text-white')}>{goal.title}</span>
              <span className="text-xs text-yellow-500/80 flex-shrink-0">{fGold(goal.target)} gp</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-1.5 bg-white/8 rounded-full overflow-hidden">
                <div className={cn('h-full rounded-full', goal.completed ? 'bg-green-500' : 'bg-gradient-to-r from-yellow-600 to-amber-400')} style={{ width: `${pct ?? 0}%` }} />
              </div>
              <span className="text-[10px] font-bold text-yellow-400 flex-shrink-0">{pct ?? 0}%</span>
              {itemEta !== null && (
                <div className="flex items-center gap-1 flex-shrink-0">
                  <Clock className="w-3 h-3 text-gray-500" />
                  <span className="text-[11px] text-gray-400 tabular-nums">{itemEta === 0 ? 'Pronto!' : fETA(itemEta)}</span>
                </div>
              )}
            </div>
          </>

        ) : goal.type === 'LEVEL' && goal.target ? (
          <>
            <div className="flex items-center gap-2 mb-0.5">
              <span className={cn('text-sm font-semibold truncate', goal.completed ? 'text-green-400 line-through' : 'text-white')}>{goal.title}</span>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex-1 h-1.5 bg-white/8 rounded-full overflow-hidden min-w-[60px]">
                <div className={cn('h-full rounded-full', goal.completed ? 'bg-green-500' : 'bg-gradient-to-r from-blue-500 to-purple-500')} style={{ width: `${pct ?? 0}%` }} />
              </div>
              <span className="text-[10px] font-bold text-blue-400 flex-shrink-0">{pct ?? 0}%</span>
              <span className="text-[10px] text-gray-500 flex-shrink-0">
                Lv. <span className="text-white">{goal.current}</span> → <span className="text-blue-300">{goal.target}</span>
                {' · '}{fXP(xpBetween(goal.current, goal.target))} XP
              </span>
              {levelEta !== null && (
                <div className="flex items-center gap-1 flex-shrink-0 px-1.5 py-0.5 rounded bg-blue-500/10 border border-blue-500/15">
                  <Clock className="w-2.5 h-2.5 text-blue-400/70" />
                  <span className="text-[10px] text-blue-300 font-semibold tabular-nums">{levelEta === 0 ? 'Atingido!' : fETA(levelEta)}</span>
                </div>
              )}
            </div>
          </>

        ) : (
          <div className="flex items-center gap-2">
            <span className={cn('text-sm font-semibold truncate', goal.completed ? 'text-green-400 line-through' : 'text-white')}>{goal.title}</span>
            {pct !== null && (
              <>
                <div className="flex-1 h-1.5 bg-white/8 rounded-full overflow-hidden min-w-[60px]">
                  <div className={cn('h-full rounded-full', goal.completed ? 'bg-green-500' : 'bg-gradient-to-r from-blue-500 to-purple-600')} style={{ width: `${pct}%` }} />
                </div>
                <span className="text-[10px] font-bold text-purple-400 flex-shrink-0">{pct}%</span>
              </>
            )}
          </div>
        )}
      </div>

      <Link href="/goals" className="hidden md:flex text-[10px] text-gray-600 hover:text-purple-400 transition-colors flex-shrink-0 uppercase tracking-wider whitespace-nowrap">
        Ver todos
      </Link>
    </div>
  )

  if (isSanguine) return (
    <div className="sanguine-border" style={{ borderRadius: '0.75rem' }}>
      <div className="sanguine-inner" style={{ borderRadius: 'calc(0.75rem - 1.5px)', minHeight: 52 }}>{inner}</div>
    </div>
  )

  if (isLevel && !goal.completed) return (
    <div className="level-border" style={{ borderRadius: '0.75rem' }}>
      <div className="level-inner" style={{ borderRadius: 'calc(0.75rem - 1.5px)', minHeight: 52 }}>{inner}</div>
    </div>
  )

  return (
    <div className="bg-[#141414] border border-[#242424] rounded-xl" style={{ minHeight: 52 }}>{inner}</div>
  )
}
