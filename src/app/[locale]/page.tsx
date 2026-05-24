'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations, useLocale } from 'next-intl'
import Image from 'next/image'
import Link from 'next/link'
import Header from '@/components/Header'

const GlobeIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <path d="M2 12h20M12 2a15.3 15.3 0 010 20M12 2a15.3 15.3 0 000 20" />
  </svg>
)

/* ─── Loading Screen ─── */
function LoadingScreen({ progress }: { progress: number }) {
  const t = useTranslations()
  const locale = useLocale()
  const router = useRouter()

  const toggleLocale = () => router.push(locale === 'ar' ? '/en' : '/ar')

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden moussy-bg-gradient" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
      {/* Subtle red glow overlay */}
      <div className="absolute inset-0 pointer-events-none opacity-20 bg-gradient-to-tr from-red-600 via-transparent to-red-900" />

      {/* Language toggle */}
      <div className="absolute top-6 z-50" style={{ insetInlineEnd: '1rem' }}>
        <button
          onClick={toggleLocale}
          className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-bold transition-all active:scale-95 bg-black/20 hover:bg-black/30 text-white border border-white/20 backdrop-blur-md shadow-sm"
        >
          <GlobeIcon />{t('common.switchLang')}
        </button>
      </div>

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center w-full max-w-md px-8">
        {/* Logo */}
        <div className="mb-12">
          <Image
            src="/moussy_logo.png"
            alt="Moussy"
            width={200}
            height={112}
            className="h-28 w-auto object-contain"
            priority
          />
        </div>

        {/* Text */}
        <div className="text-center w-full space-y-4">
          <h1 className="text-4xl font-black tracking-tight text-white drop-shadow-sm">
            {t('landing.title')}
          </h1>
          <div className="inline-block bg-black/20 backdrop-blur-md px-6 py-2 rounded-full border border-white/20 shadow-sm">
            <span className="text-yellow-400 font-bold text-lg">{t('landing.subtitle')}</span>
          </div>
          <p className="text-white/90 text-sm font-medium mt-4 max-w-xs mx-auto leading-relaxed">
            {t('landing.description')}
          </p>
        </div>
      </div>

      {/* Progress bar — pinned to bottom */}
      <div className="absolute bottom-12 w-full max-w-xs px-6">
        <div className="flex justify-between items-end mb-2 px-1">
          <span className="text-white/60 text-[10px] font-bold tracking-widest uppercase">
            {t('common.loading')}
          </span>
          <span className="text-yellow-400 font-bold text-xs">{progress}%</span>
        </div>
        <div className="w-full h-1.5 bg-black/20 rounded-full overflow-hidden border border-black/10 backdrop-blur-sm">
          <div
            className="h-full rounded-full bg-gold-gradient transition-all duration-100 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  )
}

/* ─── Cookie Banner ─── */
function CookieBanner({ onAccept }: { onAccept: () => void }) {
  const t = useTranslations('cookie')
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-black/60 backdrop-blur-md border-t border-white/10 px-4 py-4">
      <div className="max-w-sm mx-auto">
        <p className="text-white font-bold text-sm mb-1">{t('notice')}</p>
        <p className="text-white/70 text-xs mb-3 leading-relaxed">{t('message')}</p>
        <button
          onClick={onAccept}
          className="w-full bg-[#1a1a1a] text-white font-black py-3 rounded-2xl text-sm active:scale-[0.98] transition-all"
        >
          {t('accept')}
        </button>
      </div>
    </div>
  )
}

/* ─── Landing Hero (post-load) ─── */
function HeroContent() {
  const t = useTranslations()
  const locale = useLocale()
  const router = useRouter()
  const [showCookie, setShowCookie] = useState(false)

  useEffect(() => {
    if (!localStorage.getItem('cookie_ok')) setShowCookie(true)
    // If already registered redirect to ticket
    const pid = document.cookie.match(/(?:^|;\s*)pid=([^;]+)/)?.[1]
    if (pid) router.replace(`/${locale}/ticket`)
  }, [locale, router])

  return (
    <div className="bg-pattern min-h-dvh flex flex-col relative overflow-hidden" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
      <Header onBack={null} toggleLocalePath={locale === 'ar' ? '/en' : '/ar'} />

      {/* Main banner image — contains full image in available space */}
      <div className="relative flex-1">
        <Image
          src={locale === 'ar' ? '/main-banner-ar.jpg' : '/main-banner-en.jpg'}
          alt="Moussy Campaign"
          fill
          className="object-cover object-center"
          priority
        />
      </div>

      {/* Bottom section: button + powered-by */}
      <div className="relative z-10 shrink-0 px-6 pb-8 pt-4 flex flex-col gap-3">
        <Link href={`/${locale}/buy`}>
          <span className="w-full bg-gold-gradient text-[#1a1a1a] font-black text-xl py-4 rounded-2xl flex items-center justify-center shadow-premium active:scale-[0.98] transition-all">
            {t('common.startNow')}
          </span>
        </Link>
      </div>


      {showCookie && (
        <CookieBanner onAccept={() => { localStorage.setItem('cookie_ok', '1'); setShowCookie(false) }} />
      )}
    </div>
  )
}

/* ─── Page entry: shows loading then hero ─── */
export default function LandingPage() {
  const [progress, setProgress] = useState(0)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const iv = setInterval(() => {
      setProgress(p => {
        if (p >= 100) { clearInterval(iv); setTimeout(() => setLoaded(true), 400); return 100 }
        return Math.min(p + 2, 100)
      })
    }, 50)
    return () => clearInterval(iv)
  }, [])

  return loaded ? <HeroContent /> : <LoadingScreen progress={progress} />
}
