import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAdminSession } from '@/lib/session'

// GET — list all abuse records
export async function GET(req: NextRequest) {
  if (!(await verifyAdminSession(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const records = await prisma.abuseRecord.findMany({
    include: { participant: { select: { name: true, phone: true } } },
    orderBy: { updatedAt: 'desc' },
  })

  return NextResponse.json({
    records: records.map((r) => ({
      id: r.id,
      participantId: r.participantId,
      participantName: r.participant.name,
      participantPhone: r.participant.phone,
      failedAttempts: r.failedAttempts,
      blockLevel: r.blockLevel,
      blockedUntil: r.blockedUntil?.toISOString() ?? null,
      updatedAt: r.updatedAt.toISOString(),
    })),
  })
}

// DELETE — reset a single record (by participantId) or all (?all=true)
export async function DELETE(req: NextRequest) {
  if (!(await verifyAdminSession(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const all = req.nextUrl.searchParams.get('all') === 'true'
  const participantId = req.nextUrl.searchParams.get('pid')

  if (all) {
    await prisma.abuseRecord.deleteMany()
    return NextResponse.json({ ok: true, deleted: 'all' })
  }

  if (participantId) {
    await prisma.abuseRecord.deleteMany({ where: { participantId } })
    return NextResponse.json({ ok: true, deleted: participantId })
  }

  return NextResponse.json({ error: 'Provide ?pid=... or ?all=true' }, { status: 400 })
}
