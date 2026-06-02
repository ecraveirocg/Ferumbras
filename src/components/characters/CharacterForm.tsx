'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Button from '@/components/ui/Button'
import { Character } from '@/types'

const schema = z.object({
  name: z.string().min(1, 'Name is required').max(50),
  sex: z.enum(['MALE', 'FEMALE']),
  level: z.coerce.number().int().min(1, 'Level must be at least 1').max(9999),
  vocation: z.enum(['ELITE_KNIGHT', 'ROYAL_PALADIN', 'MASTER_SORCERER', 'ELDER_DRUID', 'EXALTED_MONK']),
  world: z.string().max(30).optional().default(''),
})

type FormData = z.infer<typeof schema>

interface Props {
  character?: Character
  onSubmit: (data: FormData) => Promise<void>
  onCancel: () => void
  loading?: boolean
}

export default function CharacterForm({ character, onSubmit, onCancel, loading }: Props) {
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: character
      ? { name: character.name, sex: character.sex, level: character.level, vocation: character.vocation, world: character.world }
      : { sex: 'MALE', level: 1, vocation: 'ELITE_KNIGHT', world: '' },
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input
        label="Character Name"
        placeholder="e.g. Tibianus III"
        error={errors.name?.message}
        {...register('name')}
      />
      <div className="grid grid-cols-2 gap-4">
        <Select label="Sex" error={errors.sex?.message} {...register('sex')}>
          <option value="MALE">Male</option>
          <option value="FEMALE">Female</option>
        </Select>
        <Input
          label="Level"
          type="number"
          min={1}
          max={9999}
          placeholder="e.g. 350"
          error={errors.level?.message}
          {...register('level')}
        />
      </div>
      <Select label="Vocation" error={errors.vocation?.message} {...register('vocation')}>
        <option value="ELITE_KNIGHT">Elite Knight</option>
        <option value="ROYAL_PALADIN">Royal Paladin</option>
        <option value="MASTER_SORCERER">Master Sorcerer</option>
        <option value="ELDER_DRUID">Elder Druid</option>
        <option value="EXALTED_MONK">Exalted Monk</option>
      </Select>
      <Input
        label="World (optional)"
        placeholder="e.g. Antica"
        error={errors.world?.message}
        {...register('world')}
      />
      <div className="flex gap-3 pt-2">
        <Button type="button" variant="ghost" onClick={onCancel} className="flex-1">
          Cancel
        </Button>
        <Button type="submit" variant="success" loading={loading} className="flex-1">
          {character ? 'Save Changes' : 'Create Character'}
        </Button>
      </div>
    </form>
  )
}
