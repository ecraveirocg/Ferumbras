import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const CreateSpotSchema = z.object({
  name: z.string().min(1).max(100),
})

export async function GET() {
  try {
    const spots = await prisma.spot.findMany({
      orderBy: { name: 'asc' },
      include: { _count: { select: { sessions: true } } },
    })
    return NextResponse.json(spots)
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Failed to fetch spots' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const data = CreateSpotSchema.parse(body)
    const spot = await prisma.spot.create({ data })
    return NextResponse.json(spot, { status: 201 })
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: e.errors }, { status: 400 })
    }
    console.error(e)
    return NextResponse.json({ error: 'Failed to create spot' }, { status: 500 })
  }
}
