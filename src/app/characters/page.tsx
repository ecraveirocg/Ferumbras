'use client'

import { useState, useEffect } from 'react'
import { Character, Vocation } from '@/types'
import CharacterCard from '@/components/characters/CharacterCard'
import CreateCharacterModal from '@/components/characters/CreateCharacterModal'
import Button from '@/components/ui/Button'
import { Plus, Users } from 'lucide-react'

type FormPayload = {
  name: string
  level: number
  sex: 'MALE' | 'FEMALE'
  world?: string
  vocation: Vocation
}

export default function CharactersPage() {
  const [characters, setCharacters] = useState<(Character & { _count: { sessions: number } })[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editChar, setEditChar] = useState<Character | null>(null)
  const [saving, setSaving] = useState(false)
  const [apiError, setApiError] = useState('')

  const fetchCharacters = () => {
    fetch('/api/characters')
      .then(r => r.json())
      .then(d => { setCharacters(Array.isArray(d) ? d : []); setLoading(false) })
      .catch(() => setLoading(false))
  }

  useEffect(() => { fetchCharacters() }, [])

  const handleCreate = async (data: FormPayload) => {
    setSaving(true)
    setApiError('')
    try {
      const res = await fetch('/api/characters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        setApiError(d.error ? JSON.stringify(d.error) : `Error ${res.status}`)
        return
      }
      setShowModal(false)
      fetchCharacters()
    } catch {
      setApiError('Failed to connect to the server')
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = async (data: FormPayload) => {
    if (!editChar) return
    setSaving(true)
    setApiError('')
    try {
      const res = await fetch(`/api/characters/${editChar.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        setApiError(d.error ? JSON.stringify(d.error) : `Error ${res.status}`)
        return
      }
      setEditChar(null)
      fetchCharacters()
    } catch {
      setApiError('Failed to connect to the server')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this character and all their sessions?')) return
    await fetch(`/api/characters/${id}`, { method: 'DELETE' })
    fetchCharacters()
  }

  return (
    <div className="p-6 max-w-screen-xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-white">Characters</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage your Tibia characters</p>
        </div>
        <Button variant="success" onClick={() => setShowModal(true)}>
          <Plus className="w-4 h-4" />
          Add Character
        </Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-[#1a1a1a] border border-[#2e2e2e] rounded-xl p-4 h-32 animate-pulse" />
          ))}
        </div>
      ) : characters.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-600">
          <div className="w-16 h-16 rounded-full bg-[#1a1a1a] flex items-center justify-center mb-4">
            <Users className="w-8 h-8 text-gray-700" />
          </div>
          <p className="text-base font-medium text-gray-400 mb-1">No characters yet</p>
          <p className="text-sm mb-4">Add your first character to start tracking hunts</p>
          <Button variant="success" onClick={() => setShowModal(true)}>
            <Plus className="w-4 h-4" />
            Add Character
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {characters.map(char => (
            <CharacterCard
              key={char.id}
              character={char}
              onEdit={c => setEditChar(c)}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Create modal */}
      <CreateCharacterModal
        isOpen={showModal}
        onClose={() => { setShowModal(false); setApiError('') }}
        onSubmit={handleCreate}
        loading={saving}
        error={apiError}
      />

      {/* Edit modal */}
      <CreateCharacterModal
        isOpen={!!editChar}
        onClose={() => { setEditChar(null); setApiError('') }}
        onSubmit={handleEdit}
        loading={saving}
        character={editChar ?? undefined}
        error={apiError}
      />
    </div>
  )
}
