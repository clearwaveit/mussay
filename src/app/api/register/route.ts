import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isCampaignActive } from '@/lib/session'

export async function POST(req: NextRequest) {
  const { phone, name, email, newsConsent } = await req.json()
  if (!phone || !name || !email)
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })

  const active = await isCampaignActive()
  if (!active) return NextResponse.json({ error: 'Campaign is not active' }, { status: 403 })

  const existing = await prisma.participant.findUnique({ where: { phone } })
  if (existing) return NextResponse.json({ participantId: existing.id })

  const participant = await prisma.participant.create({
    data: {
      phone, name, email,
      entries: { create: { type: 'QR' } },
    },
  })

  return NextResponse.json({ participantId: participant.id }, { status: 201 })
}
