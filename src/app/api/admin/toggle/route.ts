import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAdminSession } from '@/lib/session'

export async function POST(req: NextRequest) {
  if (!(await verifyAdminSession(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const current = await prisma.campaign.findUnique({ where: { id: 1 } })
  const updated = await prisma.campaign.upsert({
    where: { id: 1 },
    update: { isActive: !current?.isActive },
    create: { id: 1, isActive: false },
  })

  return NextResponse.json({ campaignActive: updated.isActive })
}
