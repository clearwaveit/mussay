'use client'

import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useTranslations, useLocale } from 'next-intl'

const GlobeIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <path d="M2 12h20M12 2a15.3 15.3 0 010 20M12 2a15.3 15.3 0 000 20" />
  </svg>
)

interface HeaderProps {
  /** Called when back is pressed. Pass null to hide the back button. */
  onBack?: (() => void) | null
  toggleLocalePath: string
  /** When provided, shows a logout button next to the language switcher */
  onLogout?: () => void
}

export default function Header({ onBack, toggleLocalePath, onLogout }: HeaderProps) {
  const t = useTranslations('common')
  const locale = useLocale()
  const router = useRouter()
  const isAr = locale === 'ar'

  const BackBtn = onBack !== null ? (
    <button
      onClick={onBack ?? (() => router.back())}
      className="flex items-center justify-center w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 transition-colors text-white"
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        {isAr ? <path d="M9 18l6-6-6-6" /> : <path d="M15 18l-6-6 6-6" />}
      </svg>
    </button>
  ) : <div className="w-10" />

  const LogoutBtn = onLogout ? (
    <button
      onClick={onLogout}
      className="flex items-center justify-center w-9 h-9 rounded-full bg-white/20 hover:bg-white/30 transition-colors text-white"
      title="Sign out"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/>
      </svg>
    </button>
  ) : null

  const LangBtn = (
    <button
      onClick={() => router.push(toggleLocalePath)}
      className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-full text-sm font-semibold text-white border border-white/30 transition-colors"
    >
      <GlobeIcon />{t('switchLang')}
    </button>
  )

  /* Language switcher + optional logout — always grouped together.
     In Arabic (left side): [lang] [logout]
     In English (right side): [logout] [lang]  */
  const LangGroup = (
    <div className="flex items-center gap-2">
      {isAr ? <>{LangBtn}{LogoutBtn}</> : <>{LogoutBtn}{LangBtn}</>}
    </div>
  )

  // Arabic: lang+logout on LEFT, back on RIGHT
  // English: back on LEFT, lang+logout on RIGHT
  // dir="ltr" on the container prevents the RTL page root from flipping this flex row
  const Left  = isAr ? LangGroup : BackBtn
  const Right = isAr ? BackBtn   : LangGroup

  return (
    <div className="relative z-50 shrink-0 flex items-center justify-between px-4" style={{ minHeight: '110px' }} dir="ltr">
      <div className="w-auto flex items-center">{Left}</div>
      {/* Logo absolutely centered — top padding pushes it down from the status bar */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ paddingTop: '14px' }}>
        <Image
          src="/moussy_logo.png"
          alt="Moussy"
          width={192}
          height={96}
          className="h-32 w-auto object-contain brightness-200"
        />
      </div>
      <div className="w-auto flex items-center justify-end">{Right}</div>
    </div>
  )
}
