'use client'

import { useState, useEffect } from 'react'
import { Spot } from '@/types'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { Plus, MapPin, Trash2 } from 'lucide-react'

interface SpotWithCount extends Spot {
  _count: { sessions: number }
}

export default function SpotsPage() {
  const [spots, setSpots] = useState<SpotWithCount[]>([])
  const [loading, setLoading] = useState(true)
  const [newName, setNewName] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const fetchSpots = () => {
    fetch('/api/spots')
      .then(r => r.json())
      .then(d => { setSpots(d); setLoading(false) })
  }

  useEffect(() => { fetchSpots() }, [])

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
      if (res.ok) {
        setNewName('')
        fetchSpots()
      } else {
        const d = await res.json()
        setError(d.error ?? 'Failed to add spot')
      }
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Delete spot "${name}"?`)) return
    const res = await fetch(`/api/spots/${id}`, { method: 'DELETE' })
    if (!res.ok) {
      const d = await res.json()
      alert(d.error ?? 'Failed to delete spot')
      return
    }
    fetchSpots()
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-white">Hunt Spots</h1>
        <p className="text-sm text-gray-500 mt-0.5">Manage your hunting locations</p>
      </div>

      {/* Add form */}
      <div className="bg-[#212121] border border-[#2e2e2e] rounded-xl p-4 mb-6">
        <h2 className="text-sm font-medium text-gray-300 mb-3">Add New Spot</h2>
        <form onSubmit={handleAdd} className="flex gap-3">
          <div className="flex-1">
            <Input
              placeholder="e.g. Asura Palace"
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
      {loading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-[#212121] border border-[#2e2e2e] rounded-xl p-4 h-16 animate-pulse" />
          ))}
        </div>
      ) : spots.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-gray-600">
          <MapPin className="w-10 h-10 text-gray-700 mb-3" />
          <p className="text-sm">No spots yet. Add your first hunting location!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {spots.map(spot => (
            <div
              key={spot.id}
              className="flex items-center justify-between bg-[#212121] border border-[#2e2e2e] rounded-xl px-4 py-3 hover:border-[#3a3a3a] transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#2a2a2a] flex items-center justify-center">
                  <MapPin className="w-4 h-4 text-blue-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">{spot.name}</p>
                  <p className="text-xs text-gray-500">{spot._count.sessions} session{spot._count.sessions !== 1 ? 's' : ''}</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDelete(spot.id, spot.name)}
                disabled={spot._count.sessions > 0}
                className="w-8 h-8 p-0 hover:text-red-400 disabled:opacity-30"
                title={spot._count.sessions > 0 ? 'Cannot delete spot with sessions' : 'Delete spot'}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
