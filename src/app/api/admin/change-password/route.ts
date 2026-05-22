import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminSession } from '@/lib/session'
import fs from 'fs'
import path from 'path'

export async function POST(req: NextRequest) {
  if (!(await verifyAdminSession(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { newPassword } = await req.json()
  if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 6) {
    return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 })
  }

  // Update .env file
  try {
    const envPath = path.join(process.cwd(), '.env')
    let envContent = ''
    try { envContent = fs.readFileSync(envPath, 'utf-8') } catch {}

    if (envContent.includes('ADMIN_PASSWORD=')) {
      envContent = envContent.replace(/^ADMIN_PASSWORD=.*/m, `ADMIN_PASSWORD=${newPassword}`)
    } else {
      envContent += `\nADMIN_PASSWORD=${newPassword}\n`
    }

    fs.writeFileSync(envPath, envContent, 'utf-8')
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Failed to update .env file' }, { status: 500 })
  }
}
