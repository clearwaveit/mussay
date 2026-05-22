import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isCampaignActive } from '@/lib/session'

const IS_PRODUCTION = process.env.APP_ENV === 'production'

const BLOCK_DURATIONS_MS = [0, 30 * 60 * 1000, 2 * 60 * 60 * 1000, 24 * 60 * 60 * 1000]
const BLOCK_THRESHOLDS   = [5, 1, 1, 1]

export async function POST(req: NextRequest) {
  const { code, participantId } = await req.json()
  if (!code || !participantId)
    return NextResponse.json({ error: 'Code and participant ID required' }, { status: 400 })

  const active = await isCampaignActive()
  if (!active) return NextResponse.json({ error: 'Campaign is not active' }, { status: 403 })

  const participant = await prisma.participant.findUnique({
    where: { id: participantId },
    include: { abuse: true },
  })
  if (!participant) return NextResponse.json({ error: 'Participant not found' }, { status: 404 })

  // Abuse block check (production only)
  if (IS_PRODUCTION) {
    const abuse = participant.abuse
    if (abuse?.blockedUntil && abuse.blockedUntil > new Date()) {
      const mins = Math.ceil((abuse.blockedUntil.getTime() - Date.now()) / 60000)
      return NextResponse.json(
        { error: `Too many invalid attempts. Try again in ${mins} minute${mins !== 1 ? 's' : ''}.` },
        { status: 429 }
      )
    }
  }

  const capCode = await prisma.code.findUnique({ where: { code } })

  if (!capCode) {
    if (IS_PRODUCTION) await recordFailure(participantId, participant.abuse)
    return NextResponse.json({ error: 'Invalid code' }, { status: 404 })
  }
  if (capCode.isUsed) {
    if (IS_PRODUCTION) await recordFailure(participantId, participant.abuse)
    return NextResponse.json({ error: 'Code already used' }, { status: 409 })
  }

  // Valid code — reset abuse record
  if (IS_PRODUCTION && participant.abuse) {
    await prisma.abuseRecord.update({
      where: { participantId },
      data: { failedAttempts: 0, blockedUntil: null, blockLevel: 0 },
    })
  }

  // Redeem: mark code used + create 10 entries
  await prisma.$transaction([
    prisma.code.update({
      where: { code },
      data: { isUsed: true, participantId, usedAt: new Date(), status: 'APPROVED' },
    }),
    prisma.entry.createMany({
      data: Array.from({ length: 10 }, () => ({ participantId, type: 'CODE' as const })),
    }),
  ])

  return NextResponse.json({ success: true })
}

async function recordFailure(
  participantId: string,
  abuse: { failedAttempts: number; blockedUntil: Date | null; blockLevel: number } | null
) {
  const now = new Date()
  if (!abuse) {
    await prisma.abuseRecord.create({ data: { participantId, failedAttempts: 1 } })
    return
  }

  let { failedAttempts, blockLevel } = abuse
  if (abuse.blockedUntil && abuse.blockedUntil <= now) failedAttempts = 0

  failedAttempts += 1
  const threshold = BLOCK_THRESHOLDS[Math.min(blockLevel, BLOCK_THRESHOLDS.length - 1)]

  if (failedAttempts >= threshold) {
    const nextLevel = Math.min(blockLevel + 1, 3)
    const blockedUntil = new Date(now.getTime() + BLOCK_DURATIONS_MS[nextLevel])
    await prisma.abuseRecord.update({
      where: { participantId },
      data: { failedAttempts: 0, blockLevel: nextLevel, blockedUntil },
    })
  } else {
    await prisma.abuseRecord.update({ where: { participantId }, data: { failedAttempts } })
  }
}
