import { cookies } from 'next/headers'
import { prisma } from './prisma'

const COOKIE_NAME = 'pid'
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30 // 30 days

export async function getParticipantId(): Promise<string | null> {
  const cookieStore = await cookies()
  return cookieStore.get(COOKIE_NAME)?.value ?? null
}

export async function getParticipant() {
  const id = await getParticipantId()
  if (!id) return null
  return prisma.participant.findUnique({
    where: { id },
    include: { entries: true, codes: true },
  })
}

export function setParticipantCookie(response: Response, participantId: string) {
  const isProduction = process.env.NODE_ENV === 'production'
  response.headers.append(
    'Set-Cookie',
    `${COOKIE_NAME}=${participantId}; Path=/; Max-Age=${COOKIE_MAX_AGE}; SameSite=Lax${isProduction ? '; Secure' : ''}`
  )
}

export async function isCampaignActive(): Promise<boolean> {
  const campaign = await prisma.campaign.findUnique({ where: { id: 1 } })
  return campaign?.isActive ?? true
}

export async function verifyAdminSession(req: Request): Promise<boolean> {
  const cookieHeader = req.headers.get('cookie') ?? ''
  const match = cookieHeader.match(/admin_session=([^;]+)/)
  if (!match) return false
  const cookieValue = decodeURIComponent(match[1]).trim()
  const adminPassword = (process.env.ADMIN_PASSWORD ?? '').trim()
  return cookieValue === adminPassword
}
