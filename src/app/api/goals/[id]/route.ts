import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const Schema = z.object({
  type:        z.enum(['GENERAL', 'ITEM', 'LEVEL']).optional(),
  title:       z.string().min(1).max(100).optional(),
  itemImage:   z.string().nullable().optional(),
  description: z.string().max(500).optional(),
  target:      z.number().int().positive().optional(),
  current:     z.number().int().min(0).optional(),
  unit:        z.string().max(30).optional(),
  deadline:    z.string().nullable().optional(),
  completed:   z.boolean().optional(),
})

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const body = await req.json()
    const data = Schema.parse(body)
    const goal = await prisma.goal.update({
      where: { id: Number(params.id) },
      data: {
        ...data,
        deadline: data.deadline === null ? null : data.deadline ? new Date(data.deadline) : undefined,
      },
    })
    return NextResponse.json(goal)
  } catch (e) {
    if (e instanceof z.ZodError) return NextResponse.json({ error: e.errors }, { status: 400 })
    console.error(e)
    return NextResponse.json({ error: 'Failed to update goal' }, { status: 500 })
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    await prisma.goal.delete({ where: { id: Number(params.id) } })
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Failed to delete goal' }, { status: 500 })
  }
}
