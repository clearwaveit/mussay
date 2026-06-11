import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isCampaignActive } from '@/lib/session'

export async function POST(req: NextRequest) {
  const { code, participantId } = await req.json()
  if (!code || !participantId)
    return NextResponse.json({ error: 'Code and participant ID required' }, { status: 400 })

  // Validate: exactly 6 alphanumeric characters
  const cleaned = String(code).trim().toUpperCase()
  if (!/^[A-Z0-9]{6}$/.test(cleaned))
    return NextResponse.json({ error: 'Code must be exactly 6 characters' }, { status: 400 })

  const active = await isCampaignActive()
  if (!active) return NextResponse.json({ error: 'Campaign is not active' }, { status: 403 })

  const participant = await prisma.participant.findUnique({ where: { id: participantId } })
  if (!participant) return NextResponse.json({ error: 'Participant not found' }, { status: 404 })

  // Prevent the same user submitting the same code twice
  const alreadySubmitted = await prisma.userCode.findUnique({
    where: { code_participantId: { code: cleaned, participantId } },
  })
  if (alreadySubmitted)
    return NextResponse.json({ error: 'You have already submitted this code' }, { status: 409 })

  // Silently check if code exists in the imported codes list and is unused
  const importedCode = await prisma.code.findUnique({ where: { code: cleaned } })
  const matched = !!(importedCode && !importedCode.isUsed)

  // Always accept — create UserCode with 10 linked entries
  await prisma.$transaction(async (tx) => {
    const userCode = await tx.userCode.create({
      data: {
        code: cleaned,
        participantId,
        matched,
        entries: {
          create: Array.from({ length: 10 }, () => ({
            participantId,
            type: 'CODE' as const,
          })),
        },
      },
    })

    // If matched, mark the imported code as used
    if (matched) {
      await tx.code.update({
        where: { code: cleaned },
        data: { isUsed: true, participantId, usedAt: new Date(), status: 'APPROVED' },
      })
    }

    return userCode
  })

  return NextResponse.json({ success: true })
}
