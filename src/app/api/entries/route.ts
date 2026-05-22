import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const pid = req.nextUrl.searchParams.get('pid')

  if (!pid) {
    return NextResponse.json({ error: 'Missing participant ID' }, { status: 400 })
  }

  const participant = await prisma.participant.findUnique({
    where: { id: pid },
    include: {
      entries: { select: { type: true } },
      codes: {
        select: { id: true, code: true, status: true, usedAt: true },
        orderBy: { usedAt: 'desc' },
      },
    },
  })

  if (!participant) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  return NextResponse.json(participant)
}
