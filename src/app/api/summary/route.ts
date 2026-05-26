import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

function getDateFilter(filter: string | null): Date | null {
  if (!filter || filter === 'all') return null
  const now = new Date()
  const days = filter === '7d' ? 7 : filter === '30d' ? 30 : filter === '90d' ? 90 : null
  if (!days) return null
  return new Date(now.getTime() - days * 24 * 60 * 60 * 1000)
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const timeFilter = searchParams.get('timeFilter')
    const sinceDate = getDateFilter(timeFilter)

    const where = sinceDate ? { startedAt: { gte: sinceDate } } : {}

    const sessions = await prisma.huntSession.findMany({
      where,
      include: { character: true, spot: true },
      orderBy: { startedAt: 'desc' },
    })

    const totalSilver = sessions.reduce((sum, s) => sum + s.silverEarned, 0)
    const totalMinutes = sessions.reduce((sum, s) => sum + s.duration, 0)
    const totalHours = totalMinutes / 60
    const avgSilverPerHour = totalMinutes > 0 ? Math.round((totalSilver / totalMinutes) * 60) : 0

    // By spot
    const spotMap = new Map<number, { spotId: number; spotName: string; totalSilver: number; totalMinutes: number; sessionCount: number }>()
    for (const s of sessions) {
      const existing = spotMap.get(s.spotId) ?? { spotId: s.spotId, spotName: s.spot.name, totalSilver: 0, totalMinutes: 0, sessionCount: 0 }
      existing.totalSilver += s.silverEarned
      existing.totalMinutes += s.duration
      existing.sessionCount += 1
      spotMap.set(s.spotId, existing)
    }
    const sessionsBySpot = Array.from(spotMap.values()).map(v => ({
      ...v,
      silverPerHour: v.totalMinutes > 0 ? Math.round((v.totalSilver / v.totalMinutes) * 60) : 0,
    })).sort((a, b) => b.totalSilver - a.totalSilver)

    // By class
    const classMap = new Map<string, { vocation: string; totalSilver: number; totalMinutes: number; sessionCount: number }>()
    for (const s of sessions) {
      const v = s.character.vocation
      const existing = classMap.get(v) ?? { vocation: v, totalSilver: 0, totalMinutes: 0, sessionCount: 0 }
      existing.totalSilver += s.silverEarned
      existing.totalMinutes += s.duration
      existing.sessionCount += 1
      classMap.set(v, existing)
    }
    const sessionsByClass = Array.from(classMap.values()).map(v => ({
      ...v,
      silverPerHour: v.totalMinutes > 0 ? Math.round((v.totalSilver / v.totalMinutes) * 60) : 0,
    })).sort((a, b) => b.totalSilver - a.totalSilver)

    // By date (last 30 days, grouped by day)
    const dateMap = new Map<string, { date: string; totalSilver: number; totalMinutes: number; sessionCount: number }>()
    for (const s of sessions) {
      const date = s.startedAt.toISOString().split('T')[0]
      const existing = dateMap.get(date) ?? { date, totalSilver: 0, totalMinutes: 0, sessionCount: 0 }
      existing.totalSilver += s.silverEarned
      existing.totalMinutes += s.duration
      existing.sessionCount += 1
      dateMap.set(date, existing)
    }
    const sessionsByDate = Array.from(dateMap.values()).map(v => ({
      ...v,
      silverPerHour: v.totalMinutes > 0 ? Math.round((v.totalSilver / v.totalMinutes) * 60) : 0,
    })).sort((a, b) => a.date.localeCompare(b.date))

    const recentSessions = sessions.slice(0, 5)

    return NextResponse.json({
      totalSilver,
      avgSilverPerHour,
      totalHours,
      sessionsBySpot,
      sessionsByClass,
      sessionsByDate,
      recentSessions,
    })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Failed to fetch summary' }, { status: 500 })
  }
}
