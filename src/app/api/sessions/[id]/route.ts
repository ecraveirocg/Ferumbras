import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const UpdateSessionSchema = z.object({
  characterId: z.number().int().positive().optional(),
  spotId: z.number().int().positive().optional(),
  startedAt: z.string().datetime().optional(),
  duration: z.number().int().min(1).optional(),
  silverEarned: z.number().int().min(0).optional(),
  xpGained: z.number().int().min(0).optional(),
  notes: z.string().max(1000).nullable().optional(),
})

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await prisma.huntSession.findUnique({
      where: { id: Number(params.id) },
      include: { character: true, spot: true },
    })
    if (!session) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(session)
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Failed to fetch session' }, { status: 500 })
  }
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const body = await req.json()
    const data = UpdateSessionSchema.parse(body)
    const updateData: Record<string, unknown> = { ...data }
    if (data.startedAt) updateData.startedAt = new Date(data.startedAt)
    const session = await prisma.huntSession.update({
      where: { id: Number(params.id) },
      data: updateData,
      include: { character: true, spot: true },
    })
    return NextResponse.json(session)
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: e.errors }, { status: 400 })
    }
    console.error(e)
    return NextResponse.json({ error: 'Failed to update session' }, { status: 500 })
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    await prisma.huntSession.delete({ where: { id: Number(params.id) } })
    return NextResponse.json({ success: true })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Failed to delete session' }, { status: 500 })
  }
}
