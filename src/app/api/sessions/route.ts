import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const CreateSessionSchema = z.object({
  characterId: z.number().int().positive(),
  spotId: z.number().int().positive(),
  startedAt: z.string().datetime(),
  duration: z.number().int().min(1),
  goldEarned: z.number().int().min(0),
  xpGained: z.number().int().min(0),
  notes: z.string().max(1000).nullable().optional(),
})

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const characterId = searchParams.get('characterId')
    const spotId = searchParams.get('spotId')
    const limit = Number(searchParams.get('limit') ?? 50)
    const page = Number(searchParams.get('page') ?? 1)

    const where: Record<string, unknown> = {}
    if (characterId) where.characterId = Number(characterId)
    if (spotId) where.spotId = Number(spotId)

    const [sessions, total] = await Promise.all([
      prisma.huntSession.findMany({
        where,
        include: { character: true, spot: true },
        orderBy: { startedAt: 'desc' },
        take: limit,
        skip: (page - 1) * limit,
      }),
      prisma.huntSession.count({ where }),
    ])

    return NextResponse.json({ sessions, total, page, limit })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const data = CreateSessionSchema.parse(body)
    const session = await prisma.huntSession.create({
      data: {
        ...data,
        startedAt: new Date(data.startedAt),
        notes: data.notes ?? null,
      },
      include: { character: true, spot: true },
    })
    return NextResponse.json(session, { status: 201 })
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: e.errors }, { status: 400 })
    }
    console.error(e)
    return NextResponse.json({ error: 'Failed to create session' }, { status: 500 })
  }
}
