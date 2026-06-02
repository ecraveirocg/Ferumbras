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

    const totalGold = sessions.reduce((sum, s) => sum + s.goldEarned, 0)
    const totalXp   = sessions.reduce((sum, s) => sum + s.xpGained,  0)
    const totalMinutes = sessions.reduce((sum, s) => sum + s.duration, 0)
    const totalHours = totalMinutes / 60
    const avgGoldPerHour = totalMinutes > 0 ? Math.round((totalGold / totalMinutes) * 60) : 0

    // By spot
    const spotMap = new Map<number, { spotId: number; spotName: string; totalGold: number; totalXp: number; totalMinutes: number; sessionCount: number }>()
    for (const s of sessions) {
      const existing = spotMap.get(s.spotId) ?? { spotId: s.spotId, spotName: s.spot.name, totalGold: 0, totalXp: 0, totalMinutes: 0, sessionCount: 0 }
      existing.totalGold    += s.goldEarned
      existing.totalXp      += s.xpGained
      existing.totalMinutes += s.duration
      existing.sessionCount += 1
      spotMap.set(s.spotId, existing)
    }
    const sessionsBySpot = Array.from(spotMap.values()).map(v => ({
      ...v,
      goldPerHour: v.totalMinutes > 0 ? Math.round((v.totalGold / v.totalMinutes) * 60) : 0,
      xpPerHour:   v.totalMinutes > 0 ? Math.round((v.totalXp   / v.totalMinutes) * 60) : 0,
    })).sort((a, b) => b.totalGold - a.totalGold)

    // By class
    const classMap = new Map<string, { vocation: string; totalGold: number; totalXp: number; totalMinutes: number; sessionCount: number }>()
    for (const s of sessions) {
      const v = s.character.vocation
      const existing = classMap.get(v) ?? { vocation: v, totalGold: 0, totalXp: 0, totalMinutes: 0, sessionCount: 0 }
      existing.totalGold    += s.goldEarned
      existing.totalXp      += s.xpGained
      existing.totalMinutes += s.duration
      existing.sessionCount += 1
      classMap.set(v, existing)
    }
    const sessionsByClass = Array.from(classMap.values()).map(v => ({
      ...v,
      goldPerHour: v.totalMinutes > 0 ? Math.round((v.totalGold / v.totalMinutes) * 60) : 0,
      xpPerHour:   v.totalMinutes > 0 ? Math.round((v.totalXp   / v.totalMinutes) * 60) : 0,
    })).sort((a, b) => b.totalGold - a.totalGold)

    // By date
    const dateMap = new Map<string, { date: string; totalGold: number; totalXp: number; totalMinutes: number; sessionCount: number }>()
    for (const s of sessions) {
      const date = s.startedAt.toISOString().split('T')[0]
      const existing = dateMap.get(date) ?? { date, totalGold: 0, totalXp: 0, totalMinutes: 0, sessionCount: 0 }
      existing.totalGold    += s.goldEarned
      existing.totalXp      += s.xpGained
      existing.totalMinutes += s.duration
      existing.sessionCount += 1
      dateMap.set(date, existing)
    }
    const sessionsByDate = Array.from(dateMap.values()).map(v => ({
      ...v,
      goldPerHour: v.totalMinutes > 0 ? Math.round((v.totalGold / v.totalMinutes) * 60) : 0,
      xpPerHour:   v.totalMinutes > 0 ? Math.round((v.totalXp   / v.totalMinutes) * 60) : 0,
    })).sort((a, b) => a.date.localeCompare(b.date))

    const recentSessions = sessions.slice(0, 5)

    // Days active
    const allSessions = await prisma.huntSession.findMany({ select: { startedAt: true } })
    const uniqueDates = [...new Set(allSessions.map(s => s.startedAt.toISOString().split('T')[0]))].sort()
    const daysActive = uniqueDates.length

    const dateSet = new Set(uniqueDates)

    // Current streak
    let currentStreak = 0
    const cur = new Date()
    while (true) {
      const d = cur.toISOString().split('T')[0]
      if (!dateSet.has(d)) break
      currentStreak++
      cur.setDate(cur.getDate() - 1)
    }

    // Longest streak
    let longestStreak = 0
    let streak = 0
    for (let i = 0; i < uniqueDates.length; i++) {
      if (i === 0) {
        streak = 1
      } else {
        const prev = new Date(uniqueDates[i - 1])
        const curr = new Date(uniqueDates[i])
        const diff = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24)
        streak = diff === 1 ? streak + 1 : 1
      }
      if (streak > longestStreak) longestStreak = streak
    }

    const avgXpPerHour = totalMinutes > 0 ? Math.round((totalXp / totalMinutes) * 60) : 0

    return NextResponse.json({
      totalGold,
      totalXp,
      avgGoldPerHour,
      avgXpPerHour,
      totalHours,
      daysActive,
      currentStreak,
      longestStreak,
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
