import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAdminSession } from '@/lib/session'

export async function GET(req: NextRequest) {
  if (!(await verifyAdminSession(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Registrations grouped by day (last 30 days)
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const [participants, codes, buyClicks, totalEntries] = await Promise.all([
    prisma.participant.findMany({
      where: { createdAt: { gte: thirtyDaysAgo } },
      select: { createdAt: true },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.code.findMany({
      where: { usedAt: { gte: thirtyDaysAgo } },
      select: { usedAt: true, status: true },
      orderBy: { usedAt: 'asc' },
    }),
    prisma.buyClickAnalytic.findMany({
      where: { createdAt: { gte: thirtyDaysAgo } },
      select: { createdAt: true },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.entry.count(),
  ])

  // Group by date string YYYY-MM-DD
  const groupByDay = (items: { createdAt?: Date | null; usedAt?: Date | null }[], field: 'createdAt' | 'usedAt') => {
    const map: Record<string, number> = {}
    for (const item of items) {
      const d = item[field]
      if (!d) continue
      const key = d.toISOString().slice(0, 10)
      map[key] = (map[key] ?? 0) + 1
    }
    return map
  }

  const regByDay = groupByDay(participants as { createdAt: Date }[], 'createdAt')
  const codesByDay = groupByDay(codes as { usedAt: Date | null }[], 'usedAt')
  const clicksByDay = groupByDay(buyClicks as { createdAt: Date }[], 'createdAt')

  // Build last 30 days array
  const days: { date: string; registrations: number; codesUsed: number; buyClicks: number }[] = []
  for (let i = 29; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const key = d.toISOString().slice(0, 10)
    days.push({
      date: key,
      registrations: regByDay[key] ?? 0,
      codesUsed: codesByDay[key] ?? 0,
      buyClicks: clicksByDay[key] ?? 0,
    })
  }

  // Totals
  const totalParticipants = await prisma.participant.count()
  const totalCodesImported = await prisma.code.count()
  const totalCodesUsed = await prisma.code.count({ where: { isUsed: true } })
  const totalBuyClicks = await prisma.buyClickAnalytic.count()

  return NextResponse.json({
    days,
    totals: {
      participants: totalParticipants,
      codesImported: totalCodesImported,
      codesUsed: totalCodesUsed,
      entries: totalEntries,
      buyClicks: totalBuyClicks,
      redemptionRate: totalCodesImported > 0
        ? Math.round((totalCodesUsed / totalCodesImported) * 10000) / 100
        : 0,
    },
  })
}
