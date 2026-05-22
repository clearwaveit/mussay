import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAdminSession } from '@/lib/session'

const PAGE_SIZE = 20

export async function GET(req: NextRequest) {
  if (!(await verifyAdminSession(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const filter = req.nextUrl.searchParams.get('filter') ?? 'all'
  const search = req.nextUrl.searchParams.get('search')?.trim().toUpperCase() ?? ''
  const page = Math.max(1, parseInt(req.nextUrl.searchParams.get('page') ?? '1'))

  const filterWhere =
    filter === 'used' ? { isUsed: true } :
    filter === 'unused' ? { isUsed: false } : {}

  const where = search
    ? { ...filterWhere, code: { contains: search } }
    : filterWhere

  const [codes, total] = await Promise.all([
    prisma.code.findMany({
      where,
      orderBy: { usedAt: 'desc' },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { participant: { select: { name: true } } },
    }),
    prisma.code.count({ where }),
  ])

  return NextResponse.json({
    codes: codes.map((c) => ({
      id: c.id,
      code: c.code,
      isUsed: c.isUsed,
      status: c.status,
      participantName: c.participant?.name ?? null,
      usedAt: c.usedAt?.toISOString() ?? null,
    })),
    total,
  })
}

// Bulk upload codes via POST
export async function POST(req: NextRequest) {
  if (!(await verifyAdminSession(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { codes } = await req.json()
  if (!Array.isArray(codes) || codes.length === 0) {
    return NextResponse.json({ error: 'codes array required' }, { status: 400 })
  }

  const result = await prisma.code.createMany({
    data: codes.map((c: string) => ({ code: c.trim().toUpperCase() })),
    skipDuplicates: true,
  })

  return NextResponse.json({ created: result.count })
}
