import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAdminSession } from '@/lib/session'

export async function GET(req: NextRequest) {
  if (!(await verifyAdminSession(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const participants = await prisma.participant.findMany({
    orderBy: { ticketNumber: 'asc' },
    include: {
      _count: { select: { codes: true, entries: true } },
      entries: { select: { type: true } },
      abuse: { select: { blockedUntil: true, blockLevel: true } },
    },
  })

  const header = 'Ticket #,Name,Phone,Email,Total Entries,Reg Entries,Code Entries,Codes Submitted,Block Level,Flagged,Registered At\n'
  const rows = participants.map((p) => {
    const regEntries = p.entries.filter(e => e.type === 'QR').length
    const codeEntries = p.entries.filter(e => e.type === 'CODE').length
    const isBlocked = !!(p.abuse?.blockedUntil && p.abuse.blockedUntil > new Date())
    return [
      String(p.ticketNumber).padStart(5, '0'),
      `"${p.name}"`,
      p.phone,
      p.email,
      p._count.entries,
      regEntries,
      codeEntries,
      p._count.codes,
      p.abuse?.blockLevel ?? 0,
      isBlocked ? 'YES' : 'NO',
      p.createdAt.toISOString(),
    ].join(',')
  })

  const csv = header + rows.join('\n')

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="moussy-participants-${Date.now()}.csv"`,
    },
  })
}
