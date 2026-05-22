import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST() {
  await prisma.buyClickAnalytic.create({ data: {} })
  return NextResponse.json({ ok: true })
}
