import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAdminSession } from '@/lib/session'

export async function POST(req: NextRequest) {
  if (!(await verifyAdminSession(req)))
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { codes } = await req.json() as { codes: string[] }
  if (!Array.isArray(codes) || codes.length === 0)
    return NextResponse.json({ error: 'No codes provided' }, { status: 400 })

  const trimmed = codes.map(c => c.trim().toUpperCase()).filter(c => c.length > 0)
  const cleaned = [...new Set(trimmed.filter(c => c.length >= 5 && c.length <= 20 && /^[A-Z0-9]+$/.test(c)))]
  const formatInvalid = trimmed.length - trimmed.filter(c => c.length >= 5 && c.length <= 20 && /^[A-Z0-9]+$/.test(c)).length

  const result = await prisma.code.createMany({
    data: cleaned.map(code => ({ code })),
    skipDuplicates: true,
  })

  return NextResponse.json({
    received: codes.length,
    inserted: result.count,
    skipped: cleaned.length - result.count,
    invalid: formatInvalid,
  })
}
