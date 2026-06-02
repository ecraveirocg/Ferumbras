import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const Schema = z.object({
  type:        z.enum(['GENERAL', 'ITEM', 'LEVEL']).optional(),
  title:       z.string().min(1).max(100),
  itemImage:   z.string().optional(),
  description: z.string().max(500).optional(),
  target:      z.number().int().positive().optional(),
  current:     z.number().int().min(0).optional(),
  unit:        z.string().max(30).optional(),
  deadline:    z.string().optional(),
})

export async function GET() {
  try {
    const goals = await prisma.goal.findMany({ orderBy: { createdAt: 'asc' } })
    return NextResponse.json(goals)
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Failed to fetch goals' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body  = await req.json()
    const data  = Schema.parse(body)
    const goal  = await prisma.goal.create({
      data: {
        ...data,
        deadline: data.deadline ? new Date(data.deadline) : undefined,
      },
    })
    return NextResponse.json(goal, { status: 201 })
  } catch (e) {
    if (e instanceof z.ZodError) return NextResponse.json({ error: e.errors }, { status: 400 })
    console.error(e)
    return NextResponse.json({ error: 'Failed to create goal' }, { status: 500 })
  }
}
