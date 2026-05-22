import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isCampaignActive } from '@/lib/session'

export async function POST(req: NextRequest) {
  const { phone } = await req.json()

  if (!phone) {
    return NextResponse.json({ error: 'Phone required' }, { status: 400 })
  }

  const active = await isCampaignActive()
  if (!active) {
    return NextResponse.json({ error: 'Campaign is not active' }, { status: 403 })
  }

  const participant = await prisma.participant.findUnique({
    where: { phone },
    select: { id: true },
  })

  if (participant) {
    return NextResponse.json({ exists: true, participantId: participant.id })
  }

  return NextResponse.json({ exists: false })
}
