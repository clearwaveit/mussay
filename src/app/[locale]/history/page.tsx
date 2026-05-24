'use client'

import { useState, useEffect, useCallback } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import Header from '@/components/Header'

type CodeStatus = 'PENDING' | 'APPROVED' | 'REJECTED'
interface EntryCode { id: string; code: string; status: CodeStatus; usedAt: string | null }

export default function HistoryPage() {
  const t = useTranslations()
  const locale = useLocale()
  const router = useRouter()

  const [codes, setCodes] = useState<EntryCode[]>([])
  const [loading, setLoading] = useState(true)

  const pid = typeof document !== 'undefined'
    ? document.cookie.match(/(?:^|;\s*)pid=([^;]+)/)?.[1] : null

  const fetchCodes = useCallback(async () => {
    if (!pid) { router.replace(`/${locale}/register`); return }
    try {
      const res = await fetch(`/api/entries?pid=${pid}`)
      if (!res.ok) { router.replace(`/${locale}/register`); return }
      const data = await res.json()
      setCodes(data.codes ?? [])
    } catch {}
    finally { setLoading(false) }
  }, [pid, locale, router])

  useEffect(() => { fetchCodes() }, [fetchCodes])

  const statusColor = (s: CodeStatus) =>
    s === 'APPROVED' ? 'text-[#00c758]' : s === 'REJECTED' ? 'text-[#e21f26]' : 'text-yellow-400'
  const statusLabel = (s: CodeStatus) =>
    s === 'APPROVED' ? t('ticket.approved') : s === 'REJECTED' ? t('ticket.rejected') : t('ticket.underReview')

  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString(locale === 'ar' ? 'ar-EG' : 'en-GB', {
      day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
    })

  return (
    <div className="bg-pattern min-h-dvh flex flex-col relative overflow-hidden" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
      <Header
        onBack={() => router.push(`/${locale}/ticket`)}
        toggleLocalePath={locale === 'ar' ? '/en/history' : '/ar/history'}
      />

      <div className="flex-1 flex flex-col w-full overflow-y-auto scrollbar-hide px-4 py-6">
        {/* Banner */}
        <div className="shrink-0 mb-4 h-[160px]">
          <div className="w-full h-full rounded-2xl overflow-hidden relative shadow-lg">
            <Image src="/top_banner.jpg" alt="Moussy Campaign" fill className="object-cover object-top" />
          </div>
        </div>

        <h2 className="text-2xl font-bold text-center mb-6 text-gold uppercase tracking-wider">
          {t('ticket.myCodesHistory')}
        </h2>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
          </div>
        ) : codes.length === 0 ? (
          <p className="text-white/50 text-center py-12">{t('ticket.noCodes')}</p>
        ) : (
          <div className="space-y-2">
            <p className="text-white/50 text-xs text-center mb-4">{codes.length} {t('ticket.codesSubmitted')}</p>
            {codes.map((entry, i) => (
              <div key={entry.id} className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 flex items-center gap-3">
                <span className="text-white/30 text-xs font-mono shrink-0 w-5 text-center">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-black tracking-widest text-sm font-mono" dir="ltr">{entry.code}</p>
                  {entry.usedAt && (
                    <p className="text-white/40 text-[10px] mt-0.5">{fmtDate(entry.usedAt)}</p>
                  )}
                </div>
                <span className={`text-xs font-bold shrink-0 ${statusColor(entry.status)}`}>
                  {statusLabel(entry.status)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
