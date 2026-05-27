import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    const characterId = Number(params.id)
    const gear = await prisma.characterGear.upsert({
      where: { characterId },
      update: {},
      create: { characterId },
    })
    return NextResponse.json({
      slots:   JSON.parse(gear.slots),
      runes:   JSON.parse(gear.runes),
      pots:    JSON.parse(gear.pots),
      presets: JSON.parse((gear as any).presets ?? '[]'),
    })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Failed to fetch gear' }, { status: 500 })
  }
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const characterId = Number(params.id)
    const body = await req.json()
    const gear = await prisma.characterGear.upsert({
      where: { characterId },
      update: {
        slots:   body.slots    !== undefined ? JSON.stringify(body.slots)    : undefined,
        runes:   body.runes    !== undefined ? JSON.stringify(body.runes)    : undefined,
        pots:    body.pots     !== undefined ? JSON.stringify(body.pots)     : undefined,
        presets: body.presets  !== undefined ? JSON.stringify(body.presets)  : undefined,
      } as any,
      create: {
        characterId,
        slots:   JSON.stringify(body.slots   ?? {}),
        runes:   JSON.stringify(body.runes   ?? []),
        pots:    JSON.stringify(body.pots    ?? []),
        presets: JSON.stringify(body.presets ?? []),
      } as any,
    })
    return NextResponse.json({
      slots:   JSON.parse(gear.slots),
      runes:   JSON.parse(gear.runes),
      pots:    JSON.parse(gear.pots),
      presets: JSON.parse((gear as any).presets ?? '[]'),
    })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Failed to save gear' }, { status: 500 })
  }
}
