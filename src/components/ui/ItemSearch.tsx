'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { Search, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TibiaItem { name: string; image: string | null }

interface Props {
  value:       string
  placeholder?: string
  onCommit:    (name: string, image: string | null) => void
}

export default function ItemSearch({ value, placeholder = 'Buscar item no TibiaWiki…', onCommit }: Props) {
  const [open,    setOpen]    = useState(false)
  const [query,   setQuery]   = useState('')
  const [results, setResults] = useState<TibiaItem[]>([])
  const [loading, setLoading] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  useEffect(() => {
    if (!query || query.length < 2) { setResults([]); return }
    const t = setTimeout(async () => {
      setLoading(true)
      try {
        const res  = await fetch(`/api/tibia/items?q=${encodeURIComponent(query)}`)
        const data = await res.json()
        setResults(Array.isArray(data) ? data : [])
      } catch { setResults([]) }
      finally { setLoading(false) }
    }, 320)
    return () => clearTimeout(t)
  }, [query])

  const select = (name: string, image: string | null) => {
    onCommit(name, image)
    setQuery('')
    setResults([])
    setOpen(false)
  }

  const clear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onCommit('', null)
    setQuery('')
  }

  return (
    <div ref={ref} className="relative">
      {/* Input */}
      <div
        onClick={() => setOpen(true)}
        className={cn(
          'flex items-center gap-2 px-3 py-2 rounded-xl border cursor-text transition-all',
          open
            ? 'bg-[#0d0d0d] border-purple-500'
            : 'bg-[#0d0d0d] border-[#2e2e2e] hover:border-[#3a3a3a]'
        )}
      >
        <Search className={cn('w-3.5 h-3.5 flex-shrink-0 transition-colors', loading ? 'text-purple-400 animate-pulse' : 'text-gray-500')} />
        <input
          value={open ? query : value}
          onChange={e => setQuery(e.target.value)}
          onFocus={() => setOpen(true)}
          onKeyDown={e => {
            if (e.key === 'Enter' && query.trim()) select(query.trim(), null)
            if (e.key === 'Escape') setOpen(false)
          }}
          placeholder={placeholder}
          className="flex-1 bg-transparent text-white text-sm outline-none placeholder-gray-600 min-w-0"
        />
        {(open ? query : value) && (
          <button onClick={clear} className="text-gray-600 hover:text-red-400 transition-colors flex-shrink-0">
            <X className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Dropdown */}
      {open && (
        <div className="absolute top-full mt-1 left-0 right-0 z-[200] bg-[#0d0d0d] border border-[#2e2e2e] rounded-xl shadow-2xl overflow-hidden">
          {loading && (
            <div className="px-3 py-2 flex items-center gap-2 text-xs text-gray-500 border-b border-[#1e1e1e]">
              <Search className="w-3 h-3 animate-pulse text-purple-400" /> Buscando no TibiaWiki…
            </div>
          )}

          <div className="max-h-60 overflow-y-auto">
            {results.length > 0 ? (
              results.map(item => (
                <button
                  key={item.name}
                  onMouseDown={e => { e.preventDefault(); select(item.name, item.image) }}
                  className={cn(
                    'w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left transition-colors',
                    value === item.name
                      ? 'bg-purple-500/15 text-purple-300'
                      : 'text-gray-400 hover:bg-[#1a1a1a] hover:text-white'
                  )}
                >
                  <div className="w-7 h-7 flex items-center justify-center flex-shrink-0 rounded bg-[#1a1a1a]">
                    {item.image
                      ? <Image src={item.image} alt={item.name} width={24} height={24} className="object-contain" unoptimized />
                      : <div className="w-4 h-4 rounded bg-[#2a2a2a]" />
                    }
                  </div>
                  <span className="flex-1 truncate">{item.name}</span>
                  {value === item.name && <span className="text-[9px] text-purple-400 flex-shrink-0">selecionado</span>}
                </button>
              ))
            ) : query.length >= 2 && !loading ? (
              <button
                onMouseDown={e => { e.preventDefault(); select(query.trim(), null) }}
                className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-purple-400 hover:bg-[#1a1a1a] transition-colors"
              >
                Usar &ldquo;{query}&rdquo;
              </button>
            ) : (
              <p className="px-3 py-3 text-xs text-gray-600 text-center">
                {query.length < 2 ? 'Digite para buscar itens do TibiaWiki…' : 'Nenhum item encontrado'}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
