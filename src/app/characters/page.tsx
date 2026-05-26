'use client'

import { useState, useEffect } from 'react'
import { Character } from '@/types'
import CharacterCard from '@/components/characters/CharacterCard'
import CharacterForm from '@/components/characters/CharacterForm'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import { Plus, Users } from 'lucide-react'

export default function CharactersPage() {
  const [characters, setCharacters] = useState<(Character & { _count: { sessions: number } })[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editChar, setEditChar] = useState<Character | null>(null)
  const [saving, setSaving] = useState(false)

  const fetchCharacters = () => {
    fetch('/api/characters')
      .then(r => r.json())
      .then(d => { setCharacters(d); setLoading(false) })
  }

  useEffect(() => { fetchCharacters() }, [])

  const handleCreate = async (data: Omit<Character, 'id' | 'createdAt' | 'updatedAt'>) => {
    setSaving(true)
    await fetch('/api/characters', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    setSaving(false)
    setShowModal(false)
    fetchCharacters()
  }

  const handleEdit = async (data: Omit<Character, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!editChar) return
    setSaving(true)
    await fetch(`/api/characters/${editChar.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    setSaving(false)
    setEditChar(null)
    fetchCharacters()
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
            <div key={i} className="bg-[#212121] border border-[#2e2e2e] rounded-xl p-4 h-32 animate-pulse" />
          ))}
        </div>
      ) : characters.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-600">
          <div className="w-16 h-16 rounded-full bg-[#212121] flex items-center justify-center mb-4">
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

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Add Character">
        <CharacterForm
          onSubmit={handleCreate}
          onCancel={() => setShowModal(false)}
          loading={saving}
        />
      </Modal>

      <Modal isOpen={!!editChar} onClose={() => setEditChar(null)} title="Edit Character">
        {editChar && (
          <CharacterForm
            character={editChar}
            onSubmit={handleEdit}
            onCancel={() => setEditChar(null)}
            loading={saving}
          />
        )}
      </Modal>
    </div>
  )
}
