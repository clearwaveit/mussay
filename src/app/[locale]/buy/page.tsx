'use client'

import { useTranslations, useLocale } from 'next-intl'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Header from '@/components/Header'

const NOON_URL = 'https://minutes.noon.com/saudi-en/search/?f%5Btag%5D=ksa_moussy_admon_may_25'

export default function BuyPage() {
  const t = useTranslations()
  const locale = useLocale()
  const router = useRouter()

  const handleBuyNow = () => {
    fetch('/api/analytics/buy-click', { method: 'POST' }).catch(() => {})
    window.open(NOON_URL, '_blank', 'noopener,noreferrer')
  }

  return (
    <div className="bg-pattern min-h-dvh flex flex-col relative overflow-hidden" dir={locale === 'ar' ? 'rtl' : 'ltr'}>

      <Header onBack={() => router.push(`/${locale}`)} toggleLocalePath={locale === 'ar' ? '/en/buy' : '/ar/buy'} />

      {/* Banner image strip */}
      <div className="relative z-40 shrink-0 mx-4 mt-2 mb-1 h-[220px]">
        <div className="w-full h-full rounded-2xl overflow-hidden relative shadow-lg">
          <Image src="/top_banner.png" alt="Moussy Campaign" fill className="object-cover object-top" />
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 flex flex-col items-center justify-start w-full px-0 pb-2 overflow-y-auto overflow-x-hidden scrollbar-hide">
        <div className="shrink-0 px-6 pb-8 pt-4 flex flex-col gap-3 w-full">

          <h1 className="text-2xl sm:text-3xl font-black text-center text-white drop-shadow-md leading-tight">
            {t('buy.title')}
          </h1>
          <p className="text-center text-white/90 font-medium text-base px-4 leading-relaxed">
            {t('buy.description')}
          </p>

          <div className="w-full flex flex-col gap-4 px-2 mt-4">
            {/* Primary: Buy Now */}
            <button
              onClick={handleBuyNow}
              className="w-full bg-gold-gradient text-[#1a1a1a] font-black text-xl py-4 rounded-2xl shadow-premium active:scale-[0.98] transition-all"
            >
              {t('buy.buyNow')}
            </button>

            {/* Secondary: I have a code */}
            <Link href={`/${locale}/register`}>
              <span className="w-full bg-white/10 hover:bg-white/20 backdrop-blur-sm py-4 rounded-2xl font-bold text-xl text-white border border-white/20 shadow-sm mt-4 transition-all flex items-center justify-center">
                {t('buy.haveCode')}
              </span>
            </Link>
          </div>
        </div>
      </div>

    </div>
  )
}
