'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { MapPin, Search, Plus, Check, Loader2, Globe } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Spot {
  id: number
  name: string
  _count?: { sessions: number }
}

interface Props {
  value: number | null
  onChange: (spotId: number, spotName: string) => void
  error?: string
}

export default function SpotSearchInput({ value, onChange, error }: Props) {
  const [query, setQuery]               = useState('')
  const [localSpots, setLocalSpots]     = useState<Spot[]>([])
  const [wikiSpots, setWikiSpots]       = useState<string[]>([])
  const [open, setOpen]                 = useState(false)
  const [selectedName, setSelectedName] = useState('')
  const [creating, setCreating]         = useState(false)
  const [loadingWiki, setLoadingWiki]   = useState(false)

  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef     = useRef<HTMLInputElement>(null)
  const wikiTimer    = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Load local spots once
  useEffect(() => {
    fetch('/api/spots')
      .then((r) => r.json())
      .then((d) => setLocalSpots(Array.isArray(d) ? d : []))
      .catch(() => {})
  }, [])

  // Resolve selected name from value
  useEffect(() => {
    if (!value) return
    const found = localSpots.find((s) => s.id === value)
    if (found) setSelectedName(found.name)
  }, [value, localSpots])

  // Debounced wiki search
  useEffect(() => {
    if (wikiTimer.current) clearTimeout(wikiTimer.current)
    if (query.length < 2) { setWikiSpots([]); return }

    setLoadingWiki(true)
    wikiTimer.current = setTimeout(() => {
      fetch(`/api/tibia/hunting-spots?q=${encodeURIComponent(query)}&limit=20`)
        .then((r) => r.json())
        .then((d) => setWikiSpots(Array.isArray(d) ? d : []))
        .catch(() => setWikiSpots([]))
        .finally(() => setLoadingWiki(false))
    }, 300)

    return () => { if (wikiTimer.current) clearTimeout(wikiTimer.current) }
  }, [query])

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
        setQuery('')
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const openDropdown = useCallback(() => {
    setOpen(true)
    setTimeout(() => inputRef.current?.focus(), 50)
  }, [])

  const localNames = new Set(localSpots.map((s) => s.name.toLowerCase()))
  const filteredLocal = localSpots.filter((s) =>
    !query || s.name.toLowerCase().includes(query.toLowerCase())
  )
  // Wiki spots not already local
  const freshWiki = wikiSpots.filter((n) => !localNames.has(n.toLowerCase()))

  const selectLocal = (spot: Spot) => {
    setSelectedName(spot.name)
    setQuery('')
    setOpen(false)
    onChange(spot.id, spot.name)
  }

  const selectWiki = async (name: string) => {
    setCreating(true)
    setOpen(false)
    setQuery('')
    try {
      // Check if it was added in the meantime
      const existing = localSpots.find((s) => s.name.toLowerCase() === name.toLowerCase())
      if (existing) { selectLocal(existing); return }

      const res = await fetch('/api/spots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      })
      if (res.ok) {
        const spot: Spot = await res.json()
        setLocalSpots((prev) => [...prev, spot].sort((a, b) => a.name.localeCompare(b.name)))
        setSelectedName(name)
        onChange(spot.id, name)
      }
    } finally {
      setCreating(false)
    }
  }

  const hasResults = filteredLocal.length > 0 || freshWiki.length > 0

  return (
    <div ref={containerRef} className="relative">
      <label className="text-sm font-medium text-gray-300 mb-1.5 block">Spot</label>

      {/* Trigger */}
      <button
        type="button"
        onClick={openDropdown}
        disabled={creating}
        className={cn(
          'w-full flex items-center gap-2 rounded-lg border bg-[#333333] px-3 py-2 text-sm text-left transition-colors',
          error
            ? 'border-red-500 focus:ring-red-500/20'
            : open
            ? 'border-blue-500 ring-2 ring-blue-500/20'
            : 'border-[#3a3a3a] hover:border-[#555555]',
          creating && 'opacity-60 pointer-events-none'
        )}
      >
        {creating ? (
          <Loader2 className="w-4 h-4 text-blue-400 animate-spin flex-shrink-0" />
        ) : (
          <MapPin className="w-4 h-4 text-gray-500 flex-shrink-0" />
        )}
        <span className={cn('flex-1 truncate', selectedName ? 'text-white' : 'text-gray-500')}>
          {creating ? 'Adicionando spot...' : selectedName || 'Buscar spot de hunt...'}
        </span>
        <Search className="w-3.5 h-3.5 text-gray-600 flex-shrink-0" />
      </button>
      {error && <p className="text-xs text-red-400 mt-1">{error}</p>}

      {/* Dropdown */}
      {open && (
        <div className="absolute top-full left-0 right-0 mt-1.5 bg-[#1a1a1a] border border-[#2e2e2e] rounded-xl shadow-2xl shadow-black/60 z-50 overflow-hidden">
          {/* Search input */}
          <div className="px-3 pt-3 pb-2 border-b border-[#242424]">
            <div className="flex items-center gap-2 bg-[#242424] rounded-lg px-3 py-1.5">
              <Search className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Digite para buscar..."
                className="flex-1 bg-transparent text-sm text-white placeholder-gray-500 outline-none"
              />
              {loadingWiki && <Loader2 className="w-3 h-3 text-blue-400 animate-spin flex-shrink-0" />}
            </div>
          </div>

          <div className="max-h-64 overflow-y-auto">
            {/* Local spots */}
            {filteredLocal.length > 0 && (
              <div>
                <div className="px-3 pt-2.5 pb-1 flex items-center gap-1.5">
                  <MapPin className="w-3 h-3 text-blue-400/70" />
                  <span className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Meus Spots</span>
                </div>
                {filteredLocal.map((spot) => (
                  <button
                    key={spot.id}
                    type="button"
                    onClick={() => selectLocal(spot)}
                    className="w-full flex items-center gap-3 px-3 py-2 text-sm text-left hover:bg-white/5 transition-colors group"
                  >
                    <MapPin className="w-3.5 h-3.5 text-blue-400/60 flex-shrink-0 group-hover:text-blue-400 transition-colors" />
                    <span className="flex-1 text-white truncate">{spot.name}</span>
                    {spot._count && (
                      <span className="text-[10px] text-gray-600 flex-shrink-0">
                        {spot._count.sessions} {spot._count.sessions === 1 ? 'hunt' : 'hunts'}
                      </span>
                    )}
                    {spot.id === value && <Check className="w-3.5 h-3.5 text-green-400 flex-shrink-0" />}
                  </button>
                ))}
              </div>
            )}

            {/* Wiki suggestions */}
            {freshWiki.length > 0 && (
              <div>
                {filteredLocal.length > 0 && <div className="border-t border-[#242424] mx-3 my-1" />}
                <div className="px-3 pt-1 pb-1 flex items-center gap-1.5">
                  <Globe className="w-3 h-3 text-green-400/70" />
                  <span className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">TibiaWiki</span>
                  <span className="text-[9px] text-gray-600 ml-auto">Clique para adicionar</span>
                </div>
                {freshWiki.map((name) => (
                  <button
                    key={name}
                    type="button"
                    onClick={() => selectWiki(name)}
                    className="w-full flex items-center gap-3 px-3 py-2 text-sm text-left hover:bg-green-500/5 transition-colors group"
                  >
                    <Plus className="w-3.5 h-3.5 text-green-400/60 flex-shrink-0 group-hover:text-green-400 transition-colors" />
                    <span className="flex-1 text-gray-300 truncate group-hover:text-white transition-colors">{name}</span>
                    <span className="text-[10px] text-green-500/50 group-hover:text-green-400 transition-colors flex-shrink-0">+ Add</span>
                  </button>
                ))}
              </div>
            )}

            {/* Empty state */}
            {!hasResults && (
              <div className="px-4 py-8 text-center">
                {query.length < 2 ? (
                  <>
                    <MapPin className="w-6 h-6 text-gray-700 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">Digite 2+ letras para buscar</p>
                    <p className="text-xs text-gray-700 mt-0.5">Busca nos seus spots e no TibiaWiki</p>
                  </>
                ) : (
                  <>
                    <p className="text-sm text-gray-600">Nenhum spot encontrado</p>
                    <p className="text-xs text-gray-700 mt-0.5">Tente outro nome</p>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-3 py-2 border-t border-[#242424] bg-[#161616]">
            <p className="text-[10px] text-gray-700 text-center">
              Spots do TibiaWiki são adicionados automaticamente à sua lista
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
