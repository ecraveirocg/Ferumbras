'use client'

import { useState, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Image from 'next/image'
import { Search, X, Plus, Shield } from 'lucide-react'
import { Character, Vocation } from '@/types'
import { cn } from '@/lib/utils'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'

/* ── Vocations config ─────────────────────────────────── */
interface VocationDef {
  key: Vocation
  label: string
  image: string
  color: string
  bg: string
}

const VOCATIONS: VocationDef[] = [
  { key: 'ELITE_KNIGHT',    label: 'Elite Knight',    image: '/EK.gif', color: '#f97316', bg: 'bg-orange-500/10' },
  { key: 'ROYAL_PALADIN',   label: 'Royal Paladin',   image: '/RP.gif', color: '#84cc16', bg: 'bg-lime-500/10'   },
  { key: 'MASTER_SORCERER', label: 'Master Sorcerer', image: '/MS.gif', color: '#3b82f6', bg: 'bg-blue-500/10'   },
  { key: 'ELDER_DRUID',     label: 'Elder Druid',     image: '/ED.gif', color: '#d946ef', bg: 'bg-fuchsia-500/10'},
  { key: 'EXALTED_MONK',    label: 'Exalted Monk',    image: '/EM.gif', color: '#facc15', bg: 'bg-yellow-500/10' },
]

/* ── Form schema ─────────────────────────────────────── */
const schema = z.object({
  name:  z.string().min(1, 'Name is required').max(50),
  level: z.coerce.number().int().min(1).max(9999),
  sex:   z.enum(['MALE', 'FEMALE']),
  world: z.string().max(30).optional().default(''),
})
type FormData = z.infer<typeof schema>

/* ── Props ───────────────────────────────────────────── */
interface Props {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: FormData & { vocation: Vocation }) => Promise<void>
  loading?: boolean
  character?: Character          // when editing
}

export default function CreateCharacterModal({ isOpen, onClose, onSubmit, loading, character }: Props) {
  const [selected, setSelected]   = useState<Vocation | null>(character?.vocation ?? null)
  const [search, setSearch]       = useState('')

  const { register, handleSubmit, formState: { errors }, reset, watch, setValue } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: character
      ? { name: character.name, level: character.level, sex: character.sex, world: character.world }
      : { level: 1, sex: 'MALE', world: '' },
  })

  const selectedSex = watch('sex')

  const filtered = useMemo(() =>
    VOCATIONS.filter(v => v.label.toLowerCase().includes(search.toLowerCase())),
    [search]
  )

  const handleClose = () => {
    reset()
    setSelected(character?.vocation ?? null)
    setSearch('')
    onClose()
  }

  const onFormSubmit = async (data: FormData) => {
    if (!selected) return
    await onSubmit({ ...data, vocation: selected })
    reset()
    setSelected(null)
    setSearch('')
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={handleClose} />

      {/* Modal */}
      <div className="relative bg-[#141414] border border-[#2e2e2e] rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4">
          <h2 className="text-lg font-bold text-white">
            {character ? 'Edit Character' : 'Create Character'}
          </h2>
          <button
            onClick={handleClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#2e2e2e] text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onFormSubmit)} className="px-6 pb-6 space-y-5">
          {/* Class section */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-300 flex items-center gap-2">
                <Shield className="w-4 h-4 text-gray-500" /> Class
              </h3>
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
                <input
                  type="text"
                  placeholder="Search"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="bg-[#1e1e1e] border border-[#2e2e2e] text-white text-xs rounded-lg pl-7 pr-3 py-1.5 w-32 placeholder-gray-600 focus:outline-none focus:border-[#444]"
                />
              </div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-5 gap-2">
              {filtered.map(v => {
                const isSelected = selected === v.key
                return (
                  <button
                    key={v.key}
                    type="button"
                    onClick={() => setSelected(v.key)}
                    className={cn(
                      'flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all',
                      isSelected
                        ? 'border-[2px] bg-[#1e1e1e]'
                        : 'border-[#2a2a2a] bg-[#1a1a1a] hover:border-[#3a3a3a] hover:bg-[#1e1e1e]'
                    )}
                    style={isSelected ? { borderColor: v.color, boxShadow: `0 0 12px ${v.color}40` } : {}}
                  >
                    <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center overflow-hidden', v.bg)}>
                      <Image
                        src={v.image}
                        alt={v.label}
                        width={40}
                        height={40}
                        className="object-contain"
                        unoptimized
                      />
                    </div>
                    <span className="text-[10px] text-center leading-tight" style={{ color: isSelected ? v.color : '#9ca3af' }}>
                      {v.label}
                    </span>
                  </button>
                )
              })}
            </div>
            {filtered.length === 0 && (
              <p className="text-center text-sm text-gray-600 py-4">No classes found</p>
            )}
            {!selected && (
              <p className="text-xs text-red-400 mt-2">Please select a class</p>
            )}
          </div>

          {/* Details section */}
          <div>
            <h3 className="text-sm font-semibold text-gray-300 flex items-center gap-2 mb-3">
              <Shield className="w-4 h-4 text-gray-500" /> Details
            </h3>
            <div className="space-y-3">
              <Input
                label="Name"
                placeholder="Optional"
                error={errors.name?.message}
                {...register('name')}
              />
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Level"
                  type="number"
                  min={1}
                  max={9999}
                  placeholder="60"
                  error={errors.level?.message}
                  {...register('level')}
                />
                <Input
                  label="World"
                  placeholder="e.g. Antica"
                  error={errors.world?.message}
                  {...register('world')}
                />
              </div>
              {/* Sex toggle */}
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Sex</label>
                <div className="flex gap-2">
                  {(['MALE', 'FEMALE'] as const).map(s => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setValue('sex', s)}
                      className={cn(
                        'flex-1 flex items-center justify-center py-2 rounded-lg border text-xs transition-all',
                        selectedSex === s
                          ? 'border-blue-500 bg-blue-500/15 text-blue-400 font-semibold'
                          : 'border-[#2e2e2e] bg-[#1a1a1a] text-gray-400 hover:border-[#3a3a3a] hover:text-white'
                      )}
                    >
                      {s === 'MALE' ? '♂ Male' : '♀ Female'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Submit */}
          <Button
            type="submit"
            variant="success"
            loading={loading}
            disabled={!selected}
            className="w-full"
          >
            <Plus className="w-4 h-4" />
            {character ? 'Save Changes' : 'Create Character'}
          </Button>
        </form>
      </div>
    </div>
  )
}
