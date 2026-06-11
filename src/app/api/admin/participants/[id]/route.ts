import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAdminSession } from '@/lib/session'

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await verifyAdminSession(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  // Unlink codes first, then delete entries, userCodes and participant
  await prisma.$transaction([
    prisma.code.updateMany({
      where: { participantId: id },
      data: { participantId: null, isUsed: false, status: 'PENDING', usedAt: null },
    }),
    prisma.entry.deleteMany({ where: { participantId: id } }),
    prisma.userCode.deleteMany({ where: { participantId: id } }),
    prisma.participant.delete({ where: { id } }),
  ])

  return NextResponse.json({ ok: true })
}
