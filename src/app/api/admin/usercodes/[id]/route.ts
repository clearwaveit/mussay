import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAdminSession } from '@/lib/session'

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await verifyAdminSession(req))
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  const userCode = await prisma.userCode.findUnique({ where: { id } })
  if (!userCode)
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (userCode.matched)
    return NextResponse.json({ error: 'Cannot reject a matched code' }, { status: 400 })
  if (userCode.rejected)
    return NextResponse.json({ error: 'Already rejected' }, { status: 400 })

  // Mark as rejected and delete all linked entries
  await prisma.$transaction([
    prisma.userCode.update({ where: { id }, data: { rejected: true } }),
    prisma.entry.deleteMany({ where: { userCodeId: id } }),
  ])

  return NextResponse.json({ success: true })
}
