'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Button from '@/components/ui/Button'
import { Character, Spot } from '@/types'

const schema = z.object({
  characterId: z.coerce.number().int().positive('Select a character'),
  spotId: z.coerce.number().int().positive('Select a spot'),
  startedAt: z.string().min(1, 'Date is required'),
  hours: z.coerce.number().int().min(0),
  minutes: z.coerce.number().int().min(0).max(59),
  goldEarned: z.coerce.number().int().min(0),
  xpGained: z.coerce.number().int().min(0),
  notes: z.string().max(1000).optional().default(''),
}).refine(d => d.hours > 0 || d.minutes > 0, {
  message: 'Duration must be at least 1 minute',
  path: ['hours'],
})

type FormData = z.infer<typeof schema>

interface Props {
  onSubmit: (data: { characterId: number; spotId: number; startedAt: string; duration: number; goldEarned: number; xpGained: number; notes: string | null }) => Promise<void>
  loading?: boolean
}

export default function SessionForm({ onSubmit, loading }: Props) {
  const [characters, setCharacters] = useState<Character[]>([])
  const [spots, setSpots] = useState<Spot[]>([])

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      startedAt: new Date().toISOString().slice(0, 16),
      hours: 1,
      minutes: 0,
      goldEarned: 0,
      xpGained: 0,
      notes: '',
    },
  })

  useEffect(() => {
    fetch('/api/characters').then(r => r.json()).then(setCharacters)
    fetch('/api/spots').then(r => r.json()).then(setSpots)
  }, [])

  const handleFormSubmit = async (data: FormData) => {
    const duration = data.hours * 60 + data.minutes
    await onSubmit({
      characterId: data.characterId,
      spotId: data.spotId,
      startedAt: new Date(data.startedAt).toISOString(),
      duration,
      goldEarned: data.goldEarned,
      xpGained: data.xpGained,
      notes: data.notes || null,
    })
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Select label="Character" error={errors.characterId?.message} {...register('characterId')}>
          <option value="">Select character...</option>
          {characters.map(c => (
            <option key={c.id} value={c.id}>{c.name} (Lv. {c.level})</option>
          ))}
        </Select>
        <Select label="Spot" error={errors.spotId?.message} {...register('spotId')}>
          <option value="">Select spot...</option>
          {spots.map(s => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </Select>
      </div>
      <Input
        label="Started At"
        type="datetime-local"
        error={errors.startedAt?.message}
        {...register('startedAt')}
      />
      <div>
        <label className="text-sm font-medium text-gray-300 mb-1.5 block">Duration</label>
        <div className="grid grid-cols-2 gap-3">
          <Input
            placeholder="Hours"
            type="number"
            min={0}
            max={24}
            error={errors.hours?.message}
            hint="Hours"
            {...register('hours')}
          />
          <Input
            placeholder="Minutes"
            type="number"
            min={0}
            max={59}
            hint="Minutes"
            {...register('minutes')}
          />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Gold Earned"
          type="number"
          min={0}
          placeholder="e.g. 1000000"
          error={errors.goldEarned?.message}
          hint="Total loot value in gold/gold"
          {...register('goldEarned')}
        />
        <Input
          label="XP Gained"
          type="number"
          min={0}
          placeholder="e.g. 5000000"
          error={errors.xpGained?.message}
          {...register('xpGained')}
        />
      </div>
      <div>
        <label className="text-sm font-medium text-gray-300 mb-1.5 block">Notes (optional)</label>
        <textarea
          className="w-full rounded-lg border border-[#3a3a3a] bg-[#333333] px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent hover:border-[#555555] transition-colors resize-none"
          rows={3}
          placeholder="Any notes about this hunt..."
          {...register('notes')}
        />
      </div>
      <Button type="submit" variant="success" loading={loading} className="w-full">
        Save Session
      </Button>
    </form>
  )
}
