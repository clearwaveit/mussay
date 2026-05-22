import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAdminSession } from '@/lib/session'

export async function GET(req: NextRequest) {
  if (!(await verifyAdminSession(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const campaign = await prisma.campaign.findUnique({ where: { id: 1 } })
  return NextResponse.json({ campaignActive: campaign?.isActive ?? true })
}
