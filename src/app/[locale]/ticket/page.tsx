'use client'

import { useState, useEffect, useCallback } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import Header from '@/components/Header'

const NOON_URL = 'https://minutes.noon.com/saudi-en/search/?f%5Btag%5D=ksa_moussy_admon_may_25'

type CodeStatus = 'PENDING' | 'APPROVED' | 'REJECTED'
interface EntryCode { id: string; code: string; status: CodeStatus; usedAt: string | null }
interface Participant { id: string; ticketNumber: number; name: string; phone: string; entries: { type: string }[]; codes: EntryCode[] }
type CodeView = 'main' | 'entry' | 'success'

export default function TicketPage() {
  const t = useTranslations()
  const locale = useLocale()
  const router = useRouter()

  const [participant, setParticipant] = useState<Participant | null>(null)
  const [codeView, setCodeView] = useState<CodeView>('main')
  const [codeInput, setCodeInput] = useState('')
  const [codeError, setCodeError] = useState('')
  const [codeLoading, setCodeLoading] = useState(false)
  const [loadError, setLoadError] = useState(false)

  const pid = typeof document !== 'undefined'
    ? document.cookie.match(/(?:^|;\s*)pid=([^;]+)/)?.[1] : null

  const fetchParticipant = useCallback(async () => {
    if (!pid) { router.replace(`/${locale}/register`); return }
    try {
      const res = await fetch(`/api/entries?pid=${pid}`)
      if (!res.ok) { router.replace(`/${locale}/register`); return }
      setParticipant(await res.json())
    } catch { setLoadError(true) }
  }, [pid, locale, router])

  useEffect(() => { fetchParticipant() }, [fetchParticipant])

  const handleCodeSubmit = async () => {
    if (!codeInput.trim() || !pid) return
    setCodeError(''); setCodeLoading(true)
    try {
      const res = await fetch('/api/code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: codeInput.trim().toUpperCase(), participantId: pid }),
      })
      const data = await res.json()
      if (!res.ok) setCodeError(data.error ?? t('ticket.error'))
      else { setCodeView('success'); setCodeInput(''); fetchParticipant() }
    } catch { setCodeError(t('ticket.error')) }
    finally { setCodeLoading(false) }
  }

  const totalEntries = participant ? participant.entries.length : 0

  const ticketNum = participant
    ? String(participant.ticketNumber).padStart(5, '0')
    : '00000'

  const statusColor = (s: CodeStatus) =>
    s === 'APPROVED' ? 'text-[#00c758]' : s === 'REJECTED' ? 'text-[#e21f26]' : 'text-yellow-400'
  const statusLabel = (s: CodeStatus) =>
    s === 'APPROVED' ? t('ticket.approved') : s === 'REJECTED' ? t('ticket.rejected') : t('ticket.underReview')

  const Banner = () => (
    <div className="shrink-0 mx-4 mt-2 mb-1 h-[220px]">
      <div className="w-full h-full rounded-2xl overflow-hidden relative shadow-lg">
        <Image src="/top_banner.jpg" alt="Moussy Campaign" fill className="object-cover object-top" />
      </div>
    </div>
  )

  if (loadError) return (
    <div className="bg-pattern min-h-dvh flex items-center justify-center" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
      <p className="text-yellow-400">{t('ticket.error')}</p>
    </div>
  )
  if (!participant) return (
    <div className="bg-pattern min-h-dvh flex items-center justify-center" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
      <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
    </div>
  )

  /* ── Code Entry / Success full-screen view ── */
  if (codeView === 'entry' || codeView === 'success') {
    return (
      <div className="bg-pattern min-h-dvh flex flex-col relative overflow-hidden" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
        <Header onBack={() => { setCodeView('main'); setCodeError('') }} toggleLocalePath={locale === 'ar' ? '/en/ticket' : '/ar/ticket'} />

        <div className="flex-1 flex flex-col w-full overflow-y-auto scrollbar-hide">
          <Banner />
          {codeView === 'entry' && (
            <div className="flex-1 flex flex-col px-6 py-8">
              <h2 className="text-3xl font-bold text-center mb-4 text-gold">{t('ticket.enterCode')}</h2>
              <p className="text-white/80 text-sm text-center mb-8 leading-relaxed">{t('ticket.codeDesc')}</p>
              <input
                type="text"
                value={codeInput}
                onChange={e => setCodeInput(e.target.value.toUpperCase())}
                placeholder="XXXXXXXXX"
                maxLength={12}
                onKeyDown={e => e.key === 'Enter' && handleCodeSubmit()}
                dir="ltr" className="w-full font-black text-center text-4xl tracking-widest text-[#1a1a1a] placeholder:text-[#1a1a1a]/20 bg-white border-4 border-gold/50 rounded-2xl py-7 outline-none shadow-inner uppercase mb-4"
              />
              {codeError && <p className="text-yellow-400 text-xs text-center mb-4">{codeError}</p>}
              <button onClick={handleCodeSubmit} disabled={codeLoading || !codeInput.trim()}
                className="w-full bg-gold-gradient text-[#1a1a1a] font-black text-xl py-4 rounded-2xl shadow-premium active:scale-[0.98] transition-all disabled:opacity-50 mb-3">
                {codeLoading ? t('ticket.submitting') : t('ticket.submitCode')}
              </button>
              <button onClick={() => { setCodeView('main'); setCodeError('') }}
                className="w-full bg-white/10 text-white font-black text-xl py-4 rounded-2xl active:scale-[0.98] transition-all">
                {t('common.cancel')}
              </button>
            </div>
          )}
          {codeView === 'success' && (
            <div className="flex-1 flex flex-col items-center justify-center px-6 py-8 text-center">
              <div className="w-16 h-16 bg-[#00c758]/20 rounded-full flex items-center justify-center mb-4">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#00c758" strokeWidth="2.5"><path d="M20 6L9 17l-5-5" /></svg>
              </div>
              <h3 className="text-[#00c758] font-black text-2xl mb-2">{t('ticket.codeVerified')}</h3>
              <p className="text-white font-bold text-lg mb-2">{t('ticket.entryAdded')}</p>
              <p className="text-white/60 text-sm leading-relaxed mb-8">{t('ticket.congrats2')}</p>
              <button onClick={() => setCodeView('entry')}
                className="w-full bg-gold-gradient text-[#1a1a1a] font-black text-xl py-4 rounded-2xl shadow-premium active:scale-[0.98] transition-all mb-3">
                {t('ticket.enterAnother')}
              </button>
              <button onClick={() => setCodeView('main')} className="text-white/50 text-sm py-2">
                {t('ticket.backToDashboard')}
              </button>
            </div>
          )}
        </div>

      </div>
    )
  }

  /* ── Main Ticket View ── */
  return (
    <div className="bg-pattern min-h-dvh flex flex-col relative overflow-hidden" dir={locale === 'ar' ? 'rtl' : 'ltr'}>

      <Header
        onBack={null}
        toggleLocalePath={locale === 'ar' ? '/en/ticket' : '/ar/ticket'}
        onLogout={() => { document.cookie = 'pid=; path=/; max-age=0'; router.replace(`/${locale}/register`) }}
      />

      <div className="flex-1 flex flex-col w-full overflow-y-auto scrollbar-hide">
        <Banner />

        {/* ── Physical Ticket Card ── */}
        <div className="mx-4 mt-3 mb-3">
          <div className="bg-white rounded-2xl overflow-hidden flex flex-row shadow-md border border-red-100 h-[110px]">
            {/* Left stub — entry count */}
            <div className="flex flex-col items-center justify-center px-3 shrink-0 bg-red-50 border-e-2 border-dashed border-red-300 min-w-[60px]">
              <span className="text-[#e21f26] font-black text-[9px] uppercase tracking-widest leading-none">{t('ticket.entries')}</span>
              <span className="text-[#e21f26] font-black text-2xl leading-none my-1" dir="ltr">{totalEntries}</span>
              <span className="text-[#e21f26] font-black text-[9px] uppercase tracking-widest leading-none">{t('ticket.entryLabel')}</span>
            </div>
            {/* Main body */}
            <div className="flex-1 flex flex-col justify-center px-4 py-3">
              <p className="text-[#1a1a1a] font-bold text-xs mb-1">{t('ticket.drawLabel')} – Dhul Qa&apos;dah 1447 H</p>
              <p className="text-[#e21f26] text-xs font-semibold">
                {t('ticket.congrats')} ✓
              </p>
            </div>
            {/* Right stub — ticket number */}
            <div className="flex flex-col items-center justify-center px-3 shrink-0 border-s-2 border-dashed border-red-300 min-w-[72px]">
              <span className="text-[#e85d8a] font-black text-xl leading-none" dir="ltr">#{ticketNum}</span>
              <span className="text-gray-400 text-[9px] mt-1 font-semibold uppercase tracking-wide">{t('ticket.title')}</span>
            </div>
          </div>
        </div>

        {/* ── Buy More Section ── */}
        <div className="mx-4 mb-3">
          <p className="text-gold font-black text-base mb-1">
            🛒 {t('ticket.buyMore')}
          </p>
          <p className="text-white text-xs mb-4">{t('ticket.eachPurchase')}</p>

          {/* Steps */}
          <div className="flex justify-around mb-4">
            {[
              { n: '1', icon: '🥤', label: t('ticket.step1') },
              { n: '2', icon: '🔍', label: t('ticket.step2') },
              { n: '3', icon: '🎟️', label: t('ticket.step3') },
            ].map(step => (
              <div key={step.n} className="flex flex-col items-center gap-1.5">
                <div className="w-8 h-8 bg-gold rounded-full flex items-center justify-center">
                  <span className="text-[#1a1a1a] font-black text-sm">{step.n}</span>
                </div>
                <span className="text-2xl">{step.icon}</span>
                <span className="text-white text-[11px] font-semibold text-center">{step.label}</span>
              </div>
            ))}
          </div>

          {/* BUY NOW card */}
          <div className="bg-black/20 backdrop-blur-sm rounded-2xl p-3 mb-3">
            <a
              href={NOON_URL} target="_blank" rel="noopener noreferrer"
              onClick={() => fetch('/api/analytics/buy-click', { method: 'POST' }).catch(() => {})}
              className="block w-full bg-gold-gradient text-[#1a1a1a] font-black text-2xl py-5 rounded-2xl shadow-premium active:scale-[0.98] transition-all text-center"
            >
              {t('buy.buyNow')}
            </a>
          </div>

          {/* Enter Lid Code button */}
          <button onClick={() => setCodeView('entry')}
            className="w-full bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 rounded-2xl py-4 px-5 flex items-center justify-center mb-3">
            <span className="text-white font-bold text-xl">{t('ticket.enterCode')}</span>
          </button>

          {/* My Entries */}
          {participant.codes.length > 0 && (
            <div className="space-y-2 mt-2">
              <h3 className="text-gold font-bold text-sm px-1">{t('ticket.myEntries')}</h3>
              {participant.codes.map(entry => (
                <div key={entry.id} className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-black tracking-widest text-sm font-mono" dir="ltr">{entry.code}</p>
                  </div>
                  <span className={`text-xs font-bold shrink-0 ${statusColor(entry.status)}`}>{statusLabel(entry.status)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

    </div>
  )
}
