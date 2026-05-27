import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const year = parseInt(searchParams.get('year') ?? String(new Date().getFullYear()))

    const start = new Date(`${year}-01-01T00:00:00.000Z`)
    const end   = new Date(`${year + 1}-01-01T00:00:00.000Z`)

    const sessions = await prisma.huntSession.findMany({
      where: { startedAt: { gte: start, lt: end } },
      select: { startedAt: true },
    })

    const countMap = new Map<string, number>()
    for (const s of sessions) {
      // Use local date string (YYYY-MM-DD) based on UTC
      const date = s.startedAt.toISOString().split('T')[0]
      countMap.set(date, (countMap.get(date) ?? 0) + 1)
    }

    const data = Array.from(countMap.entries()).map(([date, count]) => ({ date, count }))

    return NextResponse.json({ year, data })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Failed to fetch calendar data' }, { status: 500 })
  }
}
