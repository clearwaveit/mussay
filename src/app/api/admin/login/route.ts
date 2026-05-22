import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { password } = await req.json()

  if (!password) {
    return NextResponse.json({ error: 'Password required' }, { status: 400 })
  }

  if (password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Incorrect password' }, { status: 401 })
  }

  const res = NextResponse.json({ ok: true })
  const isProduction = process.env.NODE_ENV === 'production'
  res.cookies.set('admin_session', password, {
    httpOnly: false, // needs to be readable by client for cookie check
    secure: isProduction,
    sameSite: 'lax',
    maxAge: 60 * 60 * 8, // 8 hours
    path: '/',
  })

  return res
}
