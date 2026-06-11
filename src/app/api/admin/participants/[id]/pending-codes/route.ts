import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAdminSession } from '@/lib/session'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await verifyAdminSession(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  const codes = await prisma.userCode.findMany({
    where: { participantId: id, matched: false, rejected: false },
    select: { id: true, code: true, submittedAt: true },
    orderBy: { submittedAt: 'desc' },
  })

  return NextResponse.json({ codes })
}
