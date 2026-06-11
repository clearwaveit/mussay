import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAdminSession } from '@/lib/session'

/**
 * TEMPORARY go-live cleanup endpoint.
 * Wipes all participant + code data and resets ticket numbering.
 * Preserves the Campaign settings row. Admin-only.
 * Requires body { confirm: "DELETE ALL" } as a second guard.
 *
 * ⚠️ Remove this route (and the Danger Zone UI) after go-live cleanup.
 */
export async function POST(req: NextRequest) {
  if (!(await verifyAdminSession(req)))
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: { confirm?: string } = {}
  try { body = await req.json() } catch {}
  if (body.confirm !== 'DELETE ALL')
    return NextResponse.json({ error: 'Confirmation phrase mismatch' }, { status: 400 })

  // Snapshot counts before wiping, for the response.
  const before = {
    participants: await prisma.participant.count(),
    entries: await prisma.entry.count(),
    codes: await prisma.code.count(),
    userCodes: await prisma.userCode.count(),
    buyClicks: await prisma.buyClickAnalytic.count(),
  }

  // TRUNCATE all data tables, reset identity sequences (ticketNumber → 1),
  // CASCADE handles FK order. Campaign settings row is left untouched.
  await prisma.$executeRawUnsafe(
    'TRUNCATE "Entry","UserCode","AbuseRecord","Code","BuyClickAnalytic","Participant" RESTART IDENTITY CASCADE'
  )

  return NextResponse.json({ success: true, deleted: before })
}
