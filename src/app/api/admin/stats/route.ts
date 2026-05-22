import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAdminSession } from '@/lib/session'

export async function GET(req: NextRequest) {
  if (!(await verifyAdminSession(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const [
    totalParticipants,
    codesEntered,
    validCodes,
    usedCodes,
    unusedCodes,
    buyNowClicks,
    totalEntries,
    totalCodes,
    campaignData,
  ] = await Promise.all([
    prisma.participant.count(),
    prisma.code.count({ where: { isUsed: true } }),
    prisma.code.count({ where: { status: 'APPROVED' } }),
    prisma.code.count({ where: { isUsed: true } }),
    prisma.code.count({ where: { isUsed: false } }),
    prisma.buyClickAnalytic.count(),
    prisma.entry.count(),
    prisma.code.count(),
    prisma.campaign.findUnique({ where: { id: 1 } }),
  ])

  return NextResponse.json({
    totalParticipants,
    codesEntered,
    validCodes,
    usedCodes,
    unusedCodes,
    buyNowClicks,
    totalEntries,
    totalCodes,
    campaignActive: campaignData?.isActive ?? true,
  })
}
