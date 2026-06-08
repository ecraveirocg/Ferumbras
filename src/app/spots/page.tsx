'use client'

import { useState, useEffect, useRef } from 'react'
import { Spot } from '@/types'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { Plus, MapPin, Trash2, Globe, Search, Loader2, Download, Check, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SpotWithCount extends Spot {
  _count: { sessions: number }
}

export default function SpotsPage() {
  const [spots, setSpots]             = useState<SpotWithCount[]>([])
  const [loading, setLoading]         = useState(true)
  const [newName, setNewName]         = useState('')
  const [saving, setSaving]           = useState(false)
  const [error, setError]             = useState('')

  // Wiki search
  const [wikiQuery, setWikiQuery]     = useState('')
  const [wikiResults, setWikiResults] = useState<string[]>([])
  const [wikiLoading, setWikiLoading] = useState(false)
  const [importing, setImporting]     = useState<string | null>(null)
  const [importedNames, setImportedNames] = useState<Set<string>>(new Set())
  const wikiTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const fetchSpots = () => {
    fetch('/api/spots')
      .then(r => r.json())
      .then(d => { setSpots(Array.isArray(d) ? d : []); setLoading(false) })
      .catch(() => setLoading(false))
  }

  useEffect(() => { fetchSpots() }, [])

  // Sync importedNames with localSpots
  useEffect(() => {
    setImportedNames(new Set(spots.map(s => s.name.toLowerCase())))
  }, [spots])

  // Debounced wiki search
  useEffect(() => {
    if (wikiTimer.current) clearTimeout(wikiTimer.current)
    if (wikiQuery.length < 2) { setWikiResults([]); return }

    setWikiLoading(true)
    wikiTimer.current = setTimeout(() => {
      fetch(`/api/tibia/hunting-spots?q=${encodeURIComponent(wikiQuery)}&limit=30`)
        .then(r => r.json())
        .then(d => setWikiResults(Array.isArray(d) ? d : []))
        .catch(() => setWikiResults([]))
        .finally(() => setWikiLoading(false))
    }, 350)
    return () => { if (wikiTimer.current) clearTimeout(wikiTimer.current) }
  }, [wikiQuery])

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newName.trim()) return
    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/spots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName.trim() }),
      })
      if (res.ok) { setNewName(''); fetchSpots() }
      else { const d = await res.json(); setError(d.error ?? 'Failed to add spot') }
    } finally { setSaving(false) }
  }

  const handleImportWiki = async (name: string) => {
    if (importedNames.has(name.toLowerCase())) return
    setImporting(name)
    try {
      const res = await fetch('/api/spots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      })
      if (res.ok) { fetchSpots() }
    } finally { setImporting(null) }
  }

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Delete spot "${name}"?`)) return
    const res = await fetch(`/api/spots/${id}`, { method: 'DELETE' })
    if (!res.ok) { const d = await res.json(); alert(d.error ?? 'Failed to delete spot') ; return }
    fetchSpots()
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-white">Hunt Spots</h1>
        <p className="text-sm text-gray-500 mt-0.5">Gerencie seus locais de caça · Importe do TibiaWiki</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: my spots */}
        <div className="space-y-4">
          {/* Add manual */}
          <div className="bg-[#212121] border border-[#2e2e2e] rounded-xl p-4">
            <h2 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-blue-400" /> Adicionar manualmente
            </h2>
            <form onSubmit={handleAdd} className="flex gap-3">
              <div className="flex-1">
                <Input
                  placeholder="ex: Asura Palace"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  error={error}
                />
              </div>
              <Button type="submit" variant="success" loading={saving} disabled={!newName.trim()}>
                <Plus className="w-4 h-4" />
                Add
              </Button>
            </form>
          </div>

          {/* Spots list */}
          <div className="bg-[#212121] border border-[#2e2e2e] rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-[#2a2a2a] flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-300 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-blue-400" /> Meus Spots
              </h2>
              <span className="text-xs text-gray-600 bg-[#2a2a2a] px-2 py-0.5 rounded-full">
                {spots.length} spots
              </span>
            </div>

            {loading ? (
              <div className="space-y-px p-2">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-14 rounded-lg bg-[#2a2a2a] animate-pulse" />
                ))}
              </div>
            ) : spots.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-600">
                <MapPin className="w-8 h-8 text-gray-700 mb-2" />
                <p className="text-sm">Nenhum spot. Adicione ou importe do Wiki!</p>
              </div>
            ) : (
              <div className="divide-y divide-[#242424]">
                {spots.map(spot => (
                  <div
                    key={spot.id}
                    className="flex items-center justify-between px-4 py-3 hover:bg-white/3 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-[#2a2a2a] flex items-center justify-center">
                        <MapPin className="w-4 h-4 text-blue-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">{spot.name}</p>
                        <p className="text-xs text-gray-600">
                          {spot._count.sessions} {spot._count.sessions === 1 ? 'session' : 'sessions'}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(spot.id, spot.name)}
                      disabled={spot._count.sessions > 0}
                      className="w-8 h-8 p-0 hover:text-red-400 disabled:opacity-30"
                      title={spot._count.sessions > 0 ? 'Não pode deletar spot com sessions' : 'Deletar spot'}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: TibiaWiki import */}
        <div className="bg-[#212121] border border-[#2e2e2e] rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-[#2a2a2a]">
            <h2 className="text-sm font-semibold text-gray-300 flex items-center gap-2">
              <Globe className="w-4 h-4 text-green-400" /> Importar do TibiaWiki
            </h2>
            <p className="text-xs text-gray-600 mt-0.5">Todos os hunting places do jogo</p>
          </div>

          <div className="p-3">
            {/* Search */}
            <div className="flex items-center gap-2 bg-[#2a2a2a] border border-[#333] rounded-lg px-3 py-2 mb-3">
              <Search className="w-4 h-4 text-gray-500 flex-shrink-0" />
              <input
                value={wikiQuery}
                onChange={e => setWikiQuery(e.target.value)}
                placeholder="Buscar no TibiaWiki... (ex: Asura, Yalahar)"
                className="flex-1 bg-transparent text-sm text-white placeholder-gray-500 outline-none"
              />
              {wikiLoading && <Loader2 className="w-3.5 h-3.5 text-blue-400 animate-spin flex-shrink-0" />}
            </div>

            {/* Results */}
            <div className="space-y-px max-h-[420px] overflow-y-auto">
              {wikiQuery.length < 2 ? (
                <div className="flex flex-col items-center justify-center py-14 text-center px-4">
                  <Globe className="w-10 h-10 text-gray-700 mb-3" />
                  <p className="text-sm text-gray-500 font-medium">Busque qualquer hunt do Tibia</p>
                  <p className="text-xs text-gray-700 mt-1.5 leading-relaxed">
                    Todos os Hunting Places do TibiaWiki estão disponíveis.<br />
                    Digite 2+ letras para buscar e clique para importar.
                  </p>
                  <div className="flex flex-wrap gap-2 justify-center mt-4">
                    {['Asura', 'Yalahar', 'Roshamuul', 'Ferre', 'Ingol', 'Oramond'].map(ex => (
                      <button
                        key={ex}
                        onClick={() => setWikiQuery(ex)}
                        className="text-xs px-2.5 py-1 rounded-lg bg-[#2a2a2a] border border-[#333] text-gray-500 hover:text-white hover:border-[#444] transition-colors"
                      >
                        {ex}
                      </button>
                    ))}
                  </div>
                </div>
              ) : wikiResults.length === 0 && !wikiLoading ? (
                <div className="py-10 text-center">
                  <p className="text-sm text-gray-600">Nenhum resultado para "{wikiQuery}"</p>
                </div>
              ) : (
                wikiResults.map(name => {
                  const alreadyHave = importedNames.has(name.toLowerCase())
                  const isImporting = importing === name
                  return (
                    <div
                      key={name}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors',
                        alreadyHave ? 'opacity-60' : 'hover:bg-white/5 cursor-pointer'
                      )}
                      onClick={() => !alreadyHave && handleImportWiki(name)}
                    >
                      <div className={cn(
                        'w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors',
                        alreadyHave ? 'bg-green-500/15' : 'bg-[#2a2a2a] group-hover:bg-green-500/10'
                      )}>
                        {isImporting ? (
                          <Loader2 className="w-3.5 h-3.5 text-blue-400 animate-spin" />
                        ) : alreadyHave ? (
                          <Check className="w-3.5 h-3.5 text-green-400" />
                        ) : (
                          <Download className="w-3.5 h-3.5 text-gray-500" />
                        )}
                      </div>
                      <span className={cn(
                        'flex-1 text-sm truncate',
                        alreadyHave ? 'text-gray-500' : 'text-gray-300'
                      )}>
                        {name}
                      </span>
                      {alreadyHave ? (
                        <span className="text-[10px] text-green-500/70 flex-shrink-0">Na lista</span>
                      ) : (
                        <span className="text-[10px] text-gray-600 flex-shrink-0">
                          {isImporting ? 'Adicionando...' : '+ Importar'}
                        </span>
                      )}
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
