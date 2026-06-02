'use client'

import { useState, useEffect, type ReactNode } from 'react'
import { Target, Plus, Trash2, CheckCircle2, Circle, Clock, Pencil, X, ShoppingBag, TrendingUp, Zap } from 'lucide-react'
import type React from 'react'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import Button from '@/components/ui/Button'
import ItemSearch from '@/components/ui/ItemSearch'

type GoalType = 'GENERAL' | 'ITEM' | 'LEVEL'

interface Goal {
  id:          number
  type:        GoalType
  title:       string
  itemImage:   string | null
  description: string | null
  target:      number | null
  current:     number
  unit:        string | null
  deadline:    string | null
  completed:   boolean
}

type LevelSubtype = 'personagem' | 'skill'

interface FormState {
  type:         GoalType
  levelSubtype: LevelSubtype
  title:        string
  itemImage:    string | null
  description:  string
  target:       string
  current:      string
  unit:         string
  deadline:     string
}

const TIBIA_SKILLS = [
  'Sword Fighting', 'Axe Fighting', 'Club Fighting',
  'Distance Fighting', 'Shielding', 'Fist Fighting',
  'Magic Level', 'Fishing',
]

const EMPTY: FormState = { type: 'GENERAL', levelSubtype: 'personagem', title: '', itemImage: null, description: '', target: '', current: '0', unit: '', deadline: '' }

// Tibia official XP formula: total XP to reach level n
function tibiaXP(level: number): number {
  return Math.floor((50 / 3) * (level ** 3 - 6 * level ** 2 + 17 * level - 12))
}
function xpBetween(from: number, to: number): number {
  return Math.max(0, tibiaXP(to) - tibiaXP(from))
}
function formatXP(v: number): string {
  if (v >= 1_000_000_000) return `${(v / 1_000_000_000).toFixed(2)}B`
  if (v >= 1_000_000)     return `${(v / 1_000_000).toFixed(1)}M`
  if (v >= 1_000)         return `${(v / 1_000).toFixed(0)}k`
  return v.toLocaleString()
}

function formatGold(v: number) {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(2)}kk`
  if (v >= 1_000)     return `${(v / 1_000).toFixed(1)}k`
  return v.toLocaleString()
}

function formatETA(totalSeconds: number) {
  if (totalSeconds <= 0) return 'Pronto!'
  const d = Math.floor(totalSeconds / 86400)
  const h = Math.floor((totalSeconds % 86400) / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  const s = Math.floor(totalSeconds % 60)
  const parts: string[] = []
  if (d > 0) parts.push(`${d} dia${d !== 1 ? 's' : ''}`)
  if (h > 0) parts.push(`${h}h`)
  if (m > 0) parts.push(`${m}m`)
  if (s > 0 && d === 0) parts.push(`${s}s`)
  return parts.join(' ') || '0s'
}

export default function GoalsPage() {
  const [goals,        setGoals]        = useState<Goal[]>([])
  const [avgGoldPerHr, setAvgGoldPerHr] = useState(0)
  const [avgXpPerHr,   setAvgXpPerHr]   = useState(0)
  const [loading,      setLoading]      = useState(true)
  const [saving,       setSaving]       = useState(false)
  const [showForm,     setShowForm]     = useState(false)
  const [editId,       setEditId]       = useState<number | null>(null)
  const [form,         setForm]         = useState<FormState>(EMPTY)

  const fetchAll = () => {
    Promise.all([
      fetch('/api/goals').then(r => r.json()),
      fetch('/api/summary?timeFilter=all').then(r => r.json()),
    ]).then(([g, s]) => {
      setGoals(Array.isArray(g) ? g : [])
      setAvgGoldPerHr(s?.avgGoldPerHour ?? 0)
      setAvgXpPerHr(s?.avgXpPerHour ?? 0)
      setLoading(false)
    }).catch(() => setLoading(false))
  }

  useEffect(() => { fetchAll() }, [])

  const openCreate = () => { setForm(EMPTY); setEditId(null); setShowForm(true) }
  const openEdit   = (g: Goal) => {
    setForm({
      type:         g.type,
      levelSubtype: g.unit === 'skill' ? 'skill' : 'personagem',
      title:        g.title,
      itemImage:    g.itemImage ?? null,
      description:  g.description ?? '',
      target:      g.target != null ? String(g.target) : '',
      current:     String(g.current),
      unit:        g.unit ?? '',
      deadline:    g.deadline ? g.deadline.slice(0, 10) : '',
    })
    setEditId(g.id)
    setShowForm(true)
  }
  const closeForm = () => { setShowForm(false); setEditId(null); setForm(EMPTY) }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (form.type === 'ITEM' && !form.title.trim()) return
    setSaving(true)
    const body = {
      type:        form.type,
      title:       form.title,
      itemImage:   form.itemImage ?? undefined,
      description: form.description || undefined,
      target:      form.target ? Number(form.target) : undefined,
      current:     Number(form.current),
      unit:        form.type === 'ITEM'  ? 'gold'
                 : form.type === 'LEVEL' ? form.levelSubtype
                 : (form.unit || undefined),
      title:       form.type === 'LEVEL'
                 ? form.levelSubtype === 'skill'
                   ? `${form.description || 'Skill'} → nível ${form.target}`
                   : `Alcançar level ${form.target}`
                 : form.title,
      description: form.type === 'LEVEL' && form.levelSubtype === 'skill'
                 ? form.description
                 : (form.description || undefined),
      deadline:    form.deadline || undefined,
    }
    const url    = editId ? `/api/goals/${editId}` : '/api/goals'
    const method = editId ? 'PUT' : 'POST'
    await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    setSaving(false)
    closeForm()
    fetchAll()
  }

  const toggle = async (g: Goal) => {
    await fetch(`/api/goals/${g.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ completed: !g.completed }) })
    fetchAll()
  }

  const updateCurrent = async (g: Goal, val: number) => {
    await fetch(`/api/goals/${g.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ current: Math.max(0, val) }) })
    fetchAll()
  }

  const remove = async (id: number) => {
    if (!confirm('Remover este objetivo?')) return
    await fetch(`/api/goals/${id}`, { method: 'DELETE' })
    fetchAll()
  }

  const active    = goals.filter(g => !g.completed)
  const completed = goals.filter(g => g.completed)

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-white">Objetivos</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Acompanhe suas metas de hunt
            {avgGoldPerHr > 0 && <span className="ml-2 text-yellow-500/70">· {formatGold(avgGoldPerHr)} gp/h</span>}
          {avgXpPerHr   > 0 && <span className="ml-1 text-blue-400/60">· {formatXP(avgXpPerHr)} xp/h</span>}
          </p>
        </div>
        <Button variant="success" onClick={openCreate}><Plus className="w-4 h-4" /> Novo</Button>
      </div>

      {/* Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={closeForm} />
          <div className="relative bg-[#141414] border border-[#242424] rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-[#1e1e1e]">
              <h2 className="text-base font-bold text-white">{editId ? 'Editar Objetivo' : 'Novo Objetivo'}</h2>
              <button onClick={closeForm} className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-500 hover:text-white hover:bg-white/8 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
              {/* Type selector */}
              <div>
                <label className="text-xs text-gray-400 mb-2 block">Tipo</label>
                <div className="grid grid-cols-3 gap-2">
                  {([
                    { value: 'GENERAL', label: 'Geral',  icon: Target,      desc: 'Meta com progresso livre'  },
                    { value: 'ITEM',    label: 'Item',    icon: ShoppingBag, desc: 'Comprar um item específico' },
                    { value: 'LEVEL',   label: 'Level',   icon: Zap,         desc: 'Alcançar um level alvo'    },
                  ] as const).map(({ value, label, icon: Icon, desc }) => (
                    <button
                      key={value} type="button"
                      onClick={() => setForm(f => ({ ...f, type: value }))}
                      className={cn(
                        'flex flex-col items-start gap-1 p-3 rounded-xl border text-left transition-all',
                        form.type === value
                          ? 'border-purple-500 bg-purple-500/10'
                          : 'border-[#2e2e2e] bg-[#0d0d0d] hover:border-[#3a3a3a]'
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <Icon className={cn('w-4 h-4', form.type === value ? 'text-purple-400' : 'text-gray-500')} />
                        <span className={cn('text-sm font-semibold', form.type === value ? 'text-white' : 'text-gray-400')}>{label}</span>
                      </div>
                      <p className="text-[10px] text-gray-600">{desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Title / Item name */}
              <div>
                <label className="text-xs text-gray-400 mb-1.5 block">
                  {form.type === 'ITEM' ? 'Item *' : 'Título *'}
                </label>

                {form.type === 'ITEM' ? (
                  <div>
                    {form.title ? (
                      <div className="flex items-center gap-2 px-3 py-2 bg-[#0d0d0d] border border-[#2e2e2e] rounded-xl">
                        {form.itemImage
                          ? <Image src={form.itemImage} alt={form.title} width={28} height={28} className="object-contain flex-shrink-0" unoptimized />
                          : <div className="w-7 h-7 rounded bg-[#1e1e1e] flex-shrink-0" />
                        }
                        <span className="text-sm text-white font-medium flex-1 truncate">{form.title}</span>
                        <button
                          type="button"
                          onClick={() => setForm(f => ({ ...f, title: '', itemImage: null }))}
                          className="text-gray-600 hover:text-red-400 transition-colors"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <ItemSearch
                        value=""
                        placeholder="Buscar item (ex: Sanguine Rod)…"
                        onCommit={(name, image) => setForm(f => ({ ...f, title: name, itemImage: image }))}
                      />
                    )}
                  </div>
                ) : (
                  <input
                    required value={form.title}
                    onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                    placeholder="Ex: Fazer 100h de hunt"
                    className="w-full bg-[#0d0d0d] border border-[#2e2e2e] focus:border-purple-500 text-white text-sm rounded-xl px-3 py-2 outline-none placeholder-gray-600 transition-colors"
                  />
                )}
              </div>

              {form.type === 'LEVEL' ? (
                /* LEVEL fields */
                <>
                  {/* Sub-type selector */}
                  <div>
                    <label className="text-xs text-gray-400 mb-2 block">Sub-tipo</label>
                    <div className="grid grid-cols-2 gap-2">
                      {([
                        { value: 'personagem', label: 'Personagem', desc: 'Alcançar um nível' },
                        { value: 'skill',      label: 'Skill',      desc: 'Evoluir uma skill' },
                      ] as const).map(({ value, label, desc }) => (
                        <button
                          key={value} type="button"
                          onClick={() => setForm(f => ({ ...f, levelSubtype: value, current: '0', target: '', description: '' }))}
                          className={cn(
                            'flex flex-col items-start gap-0.5 p-3 rounded-xl border text-left transition-all',
                            form.levelSubtype === value
                              ? 'border-blue-500 bg-blue-500/10'
                              : 'border-[#2e2e2e] bg-[#0d0d0d] hover:border-[#3a3a3a]'
                          )}
                        >
                          <span className={cn('text-sm font-semibold', form.levelSubtype === value ? 'text-white' : 'text-gray-400')}>{label}</span>
                          <span className="text-[10px] text-gray-600">{desc}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Skill selector */}
                  {form.levelSubtype === 'skill' && (
                    <div>
                      <label className="text-xs text-gray-400 mb-1.5 block">Skill *</label>
                      <select
                        required value={form.description}
                        onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                        className="w-full bg-[#0d0d0d] border border-[#2e2e2e] focus:border-blue-500 text-white text-sm rounded-xl px-3 py-2 outline-none transition-colors"
                      >
                        <option value="">Selecionar skill...</option>
                        {TIBIA_SKILLS.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-gray-400 mb-1.5 block">
                        {form.levelSubtype === 'skill' ? 'Skill atual *' : 'Level atual *'}
                      </label>
                      <input
                        required type="number" min={0} max={9999} value={form.current}
                        onChange={e => setForm(f => ({ ...f, current: e.target.value }))}
                        placeholder={form.levelSubtype === 'skill' ? 'Ex: 80' : 'Ex: 350'}
                        className="w-full bg-[#0d0d0d] border border-[#2e2e2e] focus:border-blue-500 text-white text-sm rounded-xl px-3 py-2 outline-none placeholder-gray-600 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 mb-1.5 block">
                        {form.levelSubtype === 'skill' ? 'Skill alvo *' : 'Level alvo *'}
                      </label>
                      <input
                        required type="number" min={1} max={9999} value={form.target}
                        onChange={e => setForm(f => ({ ...f, target: e.target.value }))}
                        placeholder={form.levelSubtype === 'skill' ? 'Ex: 100' : 'Ex: 500'}
                        className="w-full bg-[#0d0d0d] border border-[#2e2e2e] focus:border-blue-500 text-white text-sm rounded-xl px-3 py-2 outline-none placeholder-gray-600 transition-colors"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 mb-1.5 block">Prazo desejado (opcional)</label>
                    <input type="date" value={form.deadline}
                      onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))}
                      className="w-full bg-[#0d0d0d] border border-[#2e2e2e] focus:border-blue-500 text-white text-sm rounded-xl px-3 py-2 outline-none transition-colors"
                    />
                  </div>
                </>
              ) : form.type === 'ITEM' ? (
                /* ITEM fields */
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-gray-400 mb-1.5 block">Preço (gold) *</label>
                    <input
                      required type="number" min={1} value={form.target}
                      onChange={e => setForm(f => ({ ...f, target: e.target.value }))}
                      placeholder="Ex: 50000000"
                      className="w-full bg-[#0d0d0d] border border-[#2e2e2e] focus:border-purple-500 text-white text-sm rounded-xl px-3 py-2 outline-none placeholder-gray-600 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 mb-1.5 block">Gold já guardado</label>
                    <input
                      type="number" min={0} value={form.current}
                      onChange={e => setForm(f => ({ ...f, current: e.target.value }))}
                      placeholder="0"
                      className="w-full bg-[#0d0d0d] border border-[#2e2e2e] focus:border-purple-500 text-white text-sm rounded-xl px-3 py-2 outline-none placeholder-gray-600 transition-colors"
                    />
                  </div>
                </div>
              ) : (
                /* GENERAL fields */
                <>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs text-gray-400 mb-1.5 block">Meta</label>
                      <input type="number" min={0} value={form.target}
                        onChange={e => setForm(f => ({ ...f, target: e.target.value }))}
                        placeholder="100"
                        className="w-full bg-[#0d0d0d] border border-[#2e2e2e] focus:border-purple-500 text-white text-sm rounded-xl px-3 py-2 outline-none placeholder-gray-600 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 mb-1.5 block">Atual</label>
                      <input type="number" min={0} value={form.current}
                        onChange={e => setForm(f => ({ ...f, current: e.target.value }))}
                        placeholder="0"
                        className="w-full bg-[#0d0d0d] border border-[#2e2e2e] focus:border-purple-500 text-white text-sm rounded-xl px-3 py-2 outline-none placeholder-gray-600 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 mb-1.5 block">Unidade</label>
                      <input value={form.unit}
                        onChange={e => setForm(f => ({ ...f, unit: e.target.value }))}
                        placeholder="horas..."
                        className="w-full bg-[#0d0d0d] border border-[#2e2e2e] focus:border-purple-500 text-white text-sm rounded-xl px-3 py-2 outline-none placeholder-gray-600 transition-colors"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 mb-1.5 block">Prazo</label>
                    <input type="date" value={form.deadline}
                      onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))}
                      className="w-full bg-[#0d0d0d] border border-[#2e2e2e] focus:border-purple-500 text-white text-sm rounded-xl px-3 py-2 outline-none transition-colors"
                    />
                  </div>
                </>
              )}

              {/* ETA preview for ITEM */}
              {form.type === 'ITEM' && form.target && avgGoldPerHr > 0 && (
                <div className="flex items-center gap-2 px-3 py-2 bg-yellow-500/8 border border-yellow-500/20 rounded-xl">
                  <TrendingUp className="w-3.5 h-3.5 text-yellow-500/70 flex-shrink-0" />
                  <p className="text-xs text-yellow-400/80">
                    Na sua média de <span className="font-semibold">{formatGold(avgGoldPerHr)} gp/h</span>,
                    faltam aproximadamente{' '}
                    <span className="font-semibold text-yellow-300">
                      {formatETA(Math.round(
                        (Math.max(0, Number(form.target) - Number(form.current || 0)) / avgGoldPerHr) * 3600
                      ))}
                    </span>
                  </p>
                </div>
              )}

              {/* ETA preview for LEVEL personagem */}
              {form.type === 'LEVEL' && form.levelSubtype === 'personagem' && form.target && form.current && Number(form.target) > Number(form.current) && avgXpPerHr > 0 && (
                <div className="flex items-center gap-2 px-3 py-2 bg-blue-500/8 border border-blue-500/20 rounded-xl">
                  <Zap className="w-3.5 h-3.5 text-blue-400/70 flex-shrink-0" />
                  <p className="text-xs text-blue-300/80">
                    XP necessária: <span className="font-semibold text-white">{formatXP(xpBetween(Number(form.current), Number(form.target)))}</span>
                    {' · '}Na sua média de <span className="font-semibold">{formatXP(avgXpPerHr)} xp/h</span>, estimativa de{' '}
                    <span className="font-semibold text-blue-200">
                      {formatETA(Math.round((xpBetween(Number(form.current), Number(form.target)) / avgXpPerHr) * 3600))}
                    </span>
                  </p>
                </div>
              )}

              <div className="flex gap-3 pt-1">
                <Button type="button" variant="ghost" onClick={closeForm} className="flex-1">Cancelar</Button>
                <button type="submit" disabled={saving}
                  className="flex-1 py-2 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 text-white text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {saving ? 'Salvando…' : editId ? 'Salvar' : 'Criar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading && <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-20 bg-[#141414] rounded-2xl animate-pulse" />)}</div>}

      {!loading && active.length === 0 && completed.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-gray-600 gap-3">
          <div className="w-14 h-14 rounded-2xl bg-[#141414] border border-[#242424] flex items-center justify-center">
            <Target className="w-7 h-7 text-gray-700" />
          </div>
          <p className="text-gray-400 font-medium">Nenhum objetivo ainda</p>
          <p className="text-sm">Defina metas para manter o foco nos seus hunts</p>
          <Button variant="success" onClick={openCreate}><Plus className="w-4 h-4" /> Criar primeiro objetivo</Button>
        </div>
      )}

      {!loading && (() => {
        const sections: { type: GoalType; label: string; icon: ReactNode; color: string }[] = [
          { type: 'ITEM',    label: 'Compra de Item',  icon: <ShoppingBag className="w-3.5 h-3.5" />, color: 'text-yellow-400 border-yellow-500/30 bg-yellow-500/8'  },
          { type: 'LEVEL',   label: 'Upar',            icon: <Zap          className="w-3.5 h-3.5" />, color: 'text-blue-400   border-blue-500/30   bg-blue-500/8'    },
          { type: 'GENERAL', label: 'Geral',           icon: <Target       className="w-3.5 h-3.5" />, color: 'text-purple-400 border-purple-500/30 bg-purple-500/8'  },
        ]
        const activeByType  = sections.map(s => ({ ...s, goals: active.filter(g => g.type === s.type) })).filter(s => s.goals.length > 0)
        const completedList = completed

        return (
          <>
            {activeByType.map(section => (
              <div key={section.type} className="mb-6">
                <div className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-semibold mb-3', section.color)}>
                  {section.icon}
                  {section.label}
                  <span className="ml-0.5 opacity-60">({section.goals.length})</span>
                </div>
                <div className="space-y-3">
                  {section.goals.map(g => (
                    <GoalRow key={g.id} goal={g} avgGoldPerHr={avgGoldPerHr} avgXpPerHr={avgXpPerHr}
                      onToggle={toggle} onEdit={openEdit} onDelete={remove} onUpdateCurrent={updateCurrent}
                    />
                  ))}
                </div>
              </div>
            ))}

            {completedList.length > 0 && (
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-semibold mb-3 text-green-400 border-green-500/30 bg-green-500/8">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Concluídos
                  <span className="ml-0.5 opacity-60">({completedList.length})</span>
                </div>
                <div className="space-y-2 opacity-60">
                  {completedList.map(g => (
                    <GoalRow key={g.id} goal={g} avgGoldPerHr={avgGoldPerHr} avgXpPerHr={avgXpPerHr}
                      onToggle={toggle} onEdit={openEdit} onDelete={remove} onUpdateCurrent={updateCurrent}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )
      })()}
    </div>
  )
}

function GoalRow({ goal, avgGoldPerHr, avgXpPerHr, onToggle, onEdit, onDelete, onUpdateCurrent }: {
  goal:            Goal
  avgGoldPerHr:    number
  avgXpPerHr:      number
  onToggle:        (g: Goal) => void
  onEdit:          (g: Goal) => void
  onDelete:        (id: number) => void
  onUpdateCurrent: (g: Goal, v: number) => void
}) {
  const [editingCurrent, setEditingCurrent] = useState(false)
  const [inputVal,       setInputVal]       = useState('')
  const [resolvedImage,  setResolvedImage]  = useState<string | null>(goal.itemImage)

  useEffect(() => {
    if (goal.type !== 'ITEM' || goal.itemImage || !goal.title) return
    fetch(`/api/tibia/items?names=${encodeURIComponent(goal.title)}`)
      .then(r => r.json())
      .then((data: { name: string; image: string | null }[]) => {
        const img = Array.isArray(data) ? data[0]?.image ?? null : null
        setResolvedImage(img)
      })
      .catch(() => {})
  }, [goal.type, goal.itemImage, goal.title])

  const pct = goal.target && goal.target > 0
    ? Math.min(100, Math.round((goal.current / goal.target) * 100))
    : null

  const etaSec: number | null = (() => {
    if (goal.type !== 'ITEM' || !goal.target || goal.completed || avgGoldPerHr <= 0) return null
    const rem = goal.target - goal.current
    return rem <= 0 ? 0 : Math.round((rem / avgGoldPerHr) * 3600)
  })()

  const isItem    = goal.type === 'ITEM'
  const isLevel   = goal.type === 'LEVEL'
  const isSanguine = isItem && /sanguine/i.test(goal.title)

  const levelEtaSec: number | null = (() => {
    if (!isLevel || !goal.target || goal.completed || avgXpPerHr <= 0) return null
    const xpNeeded = xpBetween(goal.current, goal.target)
    return xpNeeded <= 0 ? 0 : Math.round((xpNeeded / avgXpPerHr) * 3600)
  })()

  const cardContent = (
      <div className="flex items-start gap-3 p-4">
        <button onClick={() => onToggle(goal)} className="mt-0.5 flex-shrink-0">
          {goal.completed
            ? <CheckCircle2 className="w-5 h-5 text-green-400" />
            : <Circle className={cn('w-5 h-5 transition-colors', isItem ? 'text-yellow-700 hover:text-yellow-400' : isLevel ? 'text-blue-800 hover:text-blue-400' : 'text-gray-600 hover:text-purple-400')} />
          }
        </button>

        {/* Level icon */}
        {isLevel && (
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex flex-col items-center justify-center flex-shrink-0">
            <Zap className="w-4 h-4 text-blue-400" />
            {goal.unit === 'skill' && (
              <span className="text-[7px] text-blue-400/60 font-semibold uppercase tracking-wide mt-0.5">skill</span>
            )}
          </div>
        )}

        {/* Item image */}
        {isItem && (
          <div className="w-10 h-10 rounded-xl bg-[#1a1a1a] border border-[#2a2a2a] flex items-center justify-center flex-shrink-0 overflow-hidden">
            {resolvedImage
              ? <Image src={resolvedImage} alt={goal.title} width={32} height={32} className="object-contain" unoptimized />
              : <ShoppingBag className="w-4 h-4 text-yellow-600/50" />
            }
          </div>
        )}

        <div className="flex-1 min-w-0">
          {/* Title row */}
          <div className="flex items-center gap-2 mb-2">
            {!isItem && <Target className="w-3.5 h-3.5 text-purple-500/60 flex-shrink-0" />}
            <p className={cn('text-sm font-semibold', goal.completed ? 'text-gray-500 line-through' : 'text-white')}>
              {goal.title}
            </p>
            {isItem && goal.target && (
              <span className="text-xs text-yellow-500/70 font-medium">{formatGold(goal.target)} gp</span>
            )}
          </div>

          {/* Progress */}
          {pct !== null && (
            <div className="mb-2">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-500">
                  {isItem
                    ? `${formatGold(goal.current)} / ${formatGold(goal.target!)} gp`
                    : `${goal.current}${goal.unit ? ` ${goal.unit}` : ''} / ${goal.target}${goal.unit ? ` ${goal.unit}` : ''}`
                  }
                </span>
                <span className={cn('text-xs font-bold', isItem ? 'text-yellow-400' : 'text-purple-400')}>{pct}%</span>
              </div>
              <div className="h-2 bg-white/8 rounded-full overflow-hidden">
                <div
                  className={cn('h-full rounded-full transition-all duration-500',
                    goal.completed ? 'bg-green-500' : isItem ? 'bg-gradient-to-r from-yellow-600 to-amber-400' : 'bg-gradient-to-r from-blue-500 to-purple-600'
                  )}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          )}

          {/* ETA for LEVEL */}
          {isLevel && !goal.completed && goal.target && (
            <div className="flex flex-wrap items-center gap-3 mt-1">
              <div className="flex items-center gap-2 text-xs text-gray-500 flex-wrap">
                {goal.unit === 'skill' ? (
                  <>
                    {goal.description && <span className="text-blue-300/80 font-medium">{goal.description}</span>}
                    <span className="text-gray-700">·</span>
                    <span><span className="text-white font-semibold">{goal.current}</span> → <span className="text-blue-300 font-semibold">{goal.target}</span></span>
                  </>
                ) : (
                  <>
                    <span>Lv. <span className="text-white font-semibold">{goal.current}</span></span>
                    <span className="text-gray-700">→</span>
                    <span>Lv. <span className="text-blue-300 font-semibold">{goal.target}</span></span>
                    <span className="text-gray-700">·</span>
                    <span>{formatXP(xpBetween(goal.current, goal.target))} XP</span>
                  </>
                )}
              </div>
              {goal.unit !== 'skill' && levelEtaSec !== null ? (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-500/8 border border-blue-500/15">
                  <Clock className="w-3 h-3 text-blue-400/70" />
                  <span className="text-xs text-blue-300 font-semibold tabular-nums">
                    {levelEtaSec === 0 ? '🎉 Level atingido!' : formatETA(levelEtaSec)}
                  </span>
                  <span className="text-[10px] text-blue-600">estimado</span>
                </div>
              ) : goal.unit !== 'skill' && avgXpPerHr === 0 ? (
                <span className="text-xs text-gray-600">Faça hunts para calcular a estimativa</span>
              ) : null}
              {/* Atualizar level */}
              {editingCurrent ? (
                <div className="flex items-center gap-1">
                  <input autoFocus type="number" min={1} value={inputVal}
                    onChange={e => setInputVal(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') { onUpdateCurrent(goal, Number(inputVal)); setEditingCurrent(false) }
                      if (e.key === 'Escape') setEditingCurrent(false)
                    }}
                    className="w-20 bg-[#0d0d0d] border border-blue-500 text-white text-xs rounded-lg px-2 py-1 outline-none"
                  />
                  <button onClick={() => { onUpdateCurrent(goal, Number(inputVal)); setEditingCurrent(false) }} className="text-xs text-green-400 px-1">✓</button>
                  <button onClick={() => setEditingCurrent(false)} className="text-xs text-gray-500 px-1">✕</button>
                </div>
              ) : (
                <button onClick={() => { setInputVal(String(goal.current)); setEditingCurrent(true) }}
                  className="text-xs text-gray-600 hover:text-white transition-colors underline underline-offset-2">
                  Atualizar level
                </button>
              )}
            </div>
          )}

          {/* ETA for ITEM */}
          {isItem && !goal.completed && (
            <div className="flex items-center gap-4 flex-wrap">
              {etaSec !== null ? (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-yellow-500/8 border border-yellow-500/15">
                  <Clock className="w-3 h-3 text-yellow-500/70" />
                  <span className="text-xs text-yellow-300 font-semibold tabular-nums">
                    {etaSec === 0 ? '🎉 Pronto para comprar!' : formatETA(etaSec)}
                  </span>
                  <span className="text-[10px] text-yellow-600">estimado</span>
                </div>
              ) : avgGoldPerHr === 0 ? (
                <span className="text-xs text-gray-600">Faça hunts para calcular a estimativa</span>
              ) : null}

              {/* Update current gold */}
              {!goal.completed && (
                editingCurrent ? (
                  <div className="flex items-center gap-1">
                    <input
                      autoFocus type="number" min={0}
                      value={inputVal}
                      onChange={e => setInputVal(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') { onUpdateCurrent(goal, Number(inputVal)); setEditingCurrent(false) }
                        if (e.key === 'Escape') setEditingCurrent(false)
                      }}
                      className="w-28 bg-[#0d0d0d] border border-purple-500 text-white text-xs rounded-lg px-2 py-1 outline-none"
                    />
                    <button onClick={() => { onUpdateCurrent(goal, Number(inputVal)); setEditingCurrent(false) }}
                      className="text-xs text-green-400 hover:text-green-300 px-1">✓</button>
                    <button onClick={() => setEditingCurrent(false)}
                      className="text-xs text-gray-500 hover:text-white px-1">✕</button>
                  </div>
                ) : (
                  <button
                    onClick={() => { setInputVal(String(goal.current)); setEditingCurrent(true) }}
                    className="text-xs text-gray-600 hover:text-white transition-colors underline underline-offset-2"
                  >
                    Atualizar gold guardado
                  </button>
                )
              )}
            </div>
          )}

          {!isItem && goal.description && (
            <p className="text-xs text-gray-500 mt-1">{goal.description}</p>
          )}
        </div>

        <div className="flex items-center gap-1 flex-shrink-0 mt-0.5">
          <button onClick={() => onEdit(goal)} className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-600 hover:text-white hover:bg-white/8 transition-colors">
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => onDelete(goal.id)} className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-600 hover:text-red-400 hover:bg-red-400/10 transition-colors">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
  )

  if (isSanguine) return (
    <div className="sanguine-border">
      <div className="sanguine-inner">{cardContent}</div>
    </div>
  )

  if (isLevel && !goal.completed) return (
    <div className="level-border">
      <div className="level-inner">{cardContent}</div>
    </div>
  )

  return (
    <div className={cn(
      'rounded-2xl border transition-all',
      goal.completed ? 'bg-[#141414] border-green-500/20' : isItem ? 'bg-[#141414] border-yellow-500/10 hover:border-yellow-500/20' : 'bg-[#141414] border-[#242424] hover:border-[#2e2e2e]'
    )}>
      {cardContent}
    </div>
  )
}
