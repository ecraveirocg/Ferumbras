import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const UpdateCharacterSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  sex: z.enum(['MALE', 'FEMALE']).optional(),
  level: z.number().int().min(1).max(9999).optional(),
  vocation: z.enum([
    'KNIGHT', 'ELITE_KNIGHT', 'PALADIN', 'ROYAL_PALADIN',
    'SORCERER', 'MASTER_SORCERER', 'DRUID', 'ELDER_DRUID',
  ]).optional(),
  world: z.string().max(30).optional(),
})

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    const character = await prisma.character.findUnique({
      where: { id: Number(params.id) },
      include: { sessions: { include: { spot: true }, orderBy: { startedAt: 'desc' }, take: 10 } },
    })
    if (!character) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(character)
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Failed to fetch character' }, { status: 500 })
  }
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const body = await req.json()
    const data = UpdateCharacterSchema.parse(body)
    const character = await prisma.character.update({
      where: { id: Number(params.id) },
      data,
    })
    return NextResponse.json(character)
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: e.errors }, { status: 400 })
    }
    console.error(e)
    return NextResponse.json({ error: 'Failed to update character' }, { status: 500 })
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    await prisma.huntSession.deleteMany({ where: { characterId: Number(params.id) } })
    await prisma.character.delete({ where: { id: Number(params.id) } })
    return NextResponse.json({ success: true })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Failed to delete character' }, { status: 500 })
  }
}
