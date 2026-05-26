import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const CreateCharacterSchema = z.object({
  name: z.string().min(1).max(50),
  sex: z.enum(['MALE', 'FEMALE']),
  level: z.number().int().min(1).max(9999),
  vocation: z.enum([
    'KNIGHT', 'ELITE_KNIGHT', 'PALADIN', 'ROYAL_PALADIN',
    'SORCERER', 'MASTER_SORCERER', 'DRUID', 'ELDER_DRUID',
  ]),
  world: z.string().max(30).optional().default(''),
})

export async function GET() {
  try {
    const characters = await prisma.character.findMany({
      orderBy: { name: 'asc' },
      include: { _count: { select: { sessions: true } } },
    })
    return NextResponse.json(characters)
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Failed to fetch characters' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const data = CreateCharacterSchema.parse(body)
    const character = await prisma.character.create({ data })
    return NextResponse.json(character, { status: 201 })
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: e.errors }, { status: 400 })
    }
    console.error(e)
    return NextResponse.json({ error: 'Failed to create character' }, { status: 500 })
  }
}
