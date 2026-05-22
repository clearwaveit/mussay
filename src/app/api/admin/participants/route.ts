import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAdminSession } from '@/lib/session'

const PAGE_SIZE = 20

export async function GET(req: NextRequest) {
  if (!(await verifyAdminSession(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const search = req.nextUrl.searchParams.get('search') ?? ''
  const page = Math.max(1, parseInt(req.nextUrl.searchParams.get('page') ?? '1'))

  const where = search
    ? {
        OR: [
          { name: { contains: search, mode: 'insensitive' as const } },
          { phone: { contains: search } },
          { email: { contains: search, mode: 'insensitive' as const } },
        ],
      }
    : {}

  const [participants, total] = await Promise.all([
    prisma.participant.findMany({
      where,
      orderBy: { ticketNumber: 'asc' },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        _count: { select: { codes: true, entries: true } },
        entries: { select: { type: true } },
        abuse: { select: { blockedUntil: true, blockLevel: true } },
      },
    }),
    prisma.participant.count({ where }),
  ])

  return NextResponse.json({
    participants: participants.map((p) => {
      const regEntries = p.entries.filter(e => e.type === 'QR').length
      const codeEntries = p.entries.filter(e => e.type === 'CODE').length
      const isBlocked = !!(p.abuse?.blockedUntil && p.abuse.blockedUntil > new Date())
      return {
        id: p.id,
        ticketNumber: p.ticketNumber,
        name: p.name,
        phone: p.phone,
        email: p.email,
        codesCount: p._count.codes,
        entriesCount: p._count.entries,
        regEntries,
        codeEntries,
        isBlocked,
        blockLevel: p.abuse?.blockLevel ?? 0,
        createdAt: p.createdAt.toISOString(),
      }
    }),
    total,
  })
}
