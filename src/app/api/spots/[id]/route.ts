import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    const id = Number(params.id)
    const count = await prisma.huntSession.count({ where: { spotId: id } })
    if (count > 0) {
      return NextResponse.json(
        { error: 'Cannot delete spot with existing sessions' },
        { status: 400 }
      )
    }
    await prisma.spot.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Failed to delete spot' }, { status: 500 })
  }
}
