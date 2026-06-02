'use client'

import { useState, useEffect, useCallback } from 'react'
import { HuntSession, Character, Spot } from '@/types'
import SessionCard from '@/components/sessions/SessionCard'
import Button from '@/components/ui/Button'
import Select from '@/components/ui/Select'
import Link from 'next/link'
import { Plus, Clock } from 'lucide-react'

export default function SessionsPage() {
  const [sessions, setSessions] = useState<HuntSession[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [characters, setCharacters] = useState<Character[]>([])
  const [spots, setSpots] = useState<Spot[]>([])
  const [filterCharId, setFilterCharId] = useState('')
  const [filterSpotId, setFilterSpotId] = useState('')

  const LIMIT = 20

  const fetchSessions = useCallback(() => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(page), limit: String(LIMIT) })
    if (filterCharId) params.set('characterId', filterCharId)
    if (filterSpotId) params.set('spotId', filterSpotId)
    fetch(`/api/sessions?${params}`)
      .then(r => r.json())
      .then(d => { setSessions(Array.isArray(d.sessions) ? d.sessions : []); setTotal(d.total ?? 0); setLoading(false) })
      .catch(() => setLoading(false))
  }, [page, filterCharId, filterSpotId])

  useEffect(() => { fetchSessions() }, [fetchSessions])
  useEffect(() => {
    fetch('/api/characters').then(r => r.json()).then(d => setCharacters(Array.isArray(d) ? d : [])).catch(() => {})
    fetch('/api/spots').then(r => r.json()).then(d => setSpots(Array.isArray(d) ? d : [])).catch(() => {})
  }, [])

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this session?')) return
    await fetch(`/api/sessions/${id}`, { method: 'DELETE' })
    fetchSessions()
  }

  const totalPages = Math.ceil(total / LIMIT)

  return (
    <div className="p-6 max-w-screen-xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-white">Hunt Sessions</h1>
          <p className="text-sm text-gray-500 mt-0.5">{total} sessions recorded</p>
        </div>
        <Link href="/sessions/new">
          <Button variant="success">
            <Plus className="w-4 h-4" />
            Log Session
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-6">
        <Select
          value={filterCharId}
          onChange={e => { setFilterCharId(e.target.value); setPage(1) }}
          className="w-48"
        >
          <option value="">All Characters</option>
          {characters.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </Select>
        <Select
          value={filterSpotId}
          onChange={e => { setFilterSpotId(e.target.value); setPage(1) }}
          className="w-48"
        >
          <option value="">All Spots</option>
          {spots.map(s => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </Select>
        {(filterCharId || filterSpotId) && (
          <Button variant="ghost" size="sm" onClick={() => { setFilterCharId(''); setFilterSpotId(''); setPage(1) }}>
            Clear filters
          </Button>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-[#212121] border border-[#2e2e2e] rounded-xl p-4 h-36 animate-pulse" />
          ))}
        </div>
      ) : sessions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-600">
          <div className="w-16 h-16 rounded-full bg-[#212121] flex items-center justify-center mb-4">
            <Clock className="w-8 h-8 text-gray-700" />
          </div>
          <p className="text-base font-medium text-gray-400 mb-1">No sessions found</p>
          <p className="text-sm mb-4">Start logging your hunts!</p>
          <Link href="/sessions/new">
            <Button variant="success">
              <Plus className="w-4 h-4" />
              Log Session
            </Button>
          </Link>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {sessions.map(session => (
              <SessionCard key={session.id} session={session} onDelete={handleDelete} />
            ))}
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
                Previous
              </Button>
              <span className="text-sm text-gray-400">Page {page} of {totalPages}</span>
              <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
