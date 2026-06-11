'use client'

import { useState } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import Header from '@/components/Header'

type Step = 'phone' | 'details' | 'terms'

export default function RegisterPage() {
  const t = useTranslations()
  const locale = useLocale()
  const router = useRouter()

  const [step, setStep] = useState<Step>('phone')
  const [phone, setPhone] = useState('')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [ageConfirmed, setAgeConfirmed] = useState(false)
  const [termsAgreed, setTermsAgreed] = useState(false)
  const [newsConsent, setNewsConsent] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handlePhoneNext = async () => {
    setError('')
    if (!/^\d{7,10}$/.test(phone.trim())) { setError(t('register.phoneInvalid')); return }
    setLoading(true)
    try {
      const res = await fetch('/api/verify-phone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: `+20${phone.trim()}` }),
      })
      const data = await res.json()
      if (data.exists) {
        document.cookie = `pid=${data.participantId}; path=/; max-age=${60 * 60 * 24 * 30}`
        router.push(`/${locale}/ticket`)
        return
      }
    } catch {
      // Network error — still allow continuing
    } finally {
      setLoading(false)
    }
    setStep('details')
  }

  const handleDetailsNext = () => {
    setError('')
    if (!name.trim() || !email.trim()) { setError(t('register.fillAll')); return }
    if (name.trim().split(/\s+/).filter(Boolean).length < 2) { setError(t('register.nameMinError')); return }
    if (!/^[a-zA-Z؀-ۿ\s]+$/.test(name)) { setError(t('register.nameError')); return }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError(t('register.emailError')); return }
    if (!ageConfirmed) { setError(t('register.fillAll')); return }
    setStep('terms')
  }

  const handleFormSubmit = async () => {
    setError('')
    if (!termsAgreed) { setError(t('register.fillAll')); return }
    setLoading(true)
    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: `+20${phone.trim()}`, name: name.trim(), email: email.trim(), newsConsent }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? t('register.failed')); return }
      document.cookie = `pid=${data.participantId}; path=/; max-age=${60 * 60 * 24 * 30}`
      router.push(`/${locale}/ticket`)
    } catch { setError(t('register.failed')) }
    finally { setLoading(false) }
  }

  const handleBack = () => {
    if (step === 'terms') setStep('details')
    else if (step === 'details') setStep('phone')
    else router.push(`/${locale}/buy`)
  }

  const Banner = () => (
    <div className="shrink-0 mx-4 mt-2 mb-1 h-[220px]">
      <div className="w-full h-full rounded-2xl overflow-hidden relative shadow-lg">
        <Image src="/top_banner.jpg" alt="Moussy Campaign" fill className="object-cover object-top" />
      </div>
    </div>
  )

  const Checkbox = ({ checked, onToggle, children }: { checked: boolean; onToggle: () => void; children: React.ReactNode }) => (
    <label className="flex items-start gap-3 cursor-pointer" onClick={onToggle}>
      <div className="relative flex items-center justify-center mt-0.5 shrink-0">
        <input type="checkbox" readOnly checked={checked} className="peer appearance-none w-5 h-5 border-2 border-gold rounded-md checked:bg-gold transition-colors" />
        <svg className="absolute text-white opacity-0 peer-checked:opacity-100 pointer-events-none" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M20 6L9 17l-5-5" /></svg>
      </div>
      <span className="text-white/90 text-sm leading-snug">{children}</span>
    </label>
  )

  return (
    <div className="bg-pattern min-h-dvh flex flex-col relative overflow-hidden" dir={locale === 'ar' ? 'rtl' : 'ltr'}>

      <Header onBack={handleBack} toggleLocalePath={locale === 'ar' ? '/en/register' : '/ar/register'} />

      <div className="flex-1 flex flex-col w-full overflow-y-auto overflow-x-hidden scrollbar-hide">

        {/* ── Phone Step ── */}
        {step === 'phone' && (
          <>
            <Banner />
            <div className="flex-1 flex flex-col justify-center px-6 py-8">
              <h2 className="text-3xl font-bold text-center mb-8 text-gold uppercase tracking-wider leading-tight">
                {t('register.phoneTitle')}
              </h2>
              <div className="bg-white rounded-2xl p-2 flex items-center shadow-xl mb-6">
                <div className="flex items-center gap-2 px-4 shrink-0" style={{ borderInlineEnd: '1px solid #e5e7eb', paddingInlineEnd: '1rem' }}>
                  <span className="text-2xl">🇪🇬</span>
                  <span className="text-[#1a1a1a] font-bold">+20</span>
                </div>
                <input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  placeholder={t('register.phonePlaceholder')}
                  inputMode="numeric"
                  onKeyDown={e => e.key === 'Enter' && handlePhoneNext()}
                  dir="ltr"
                  className={`flex-1 bg-transparent text-[#1a1a1a] font-bold text-xl px-4 py-3 outline-none${locale === 'ar' ? ' placeholder:text-right' : ''}`}
                />
              </div>
              {error && <p className="text-yellow-400 text-sm text-center mb-4">{error}</p>}
              <button onClick={handlePhoneNext} disabled={loading}
                className="w-full bg-gold-gradient text-[#1a1a1a] font-black text-xl py-4 rounded-2xl shadow-premium active:scale-[0.98] transition-all disabled:opacity-60">
                {loading ? '...' : t('common.next')}
              </button>
            </div>
          </>
        )}

        {/* ── Details Step ── */}
        {step === 'details' && (
          <>
            <Banner />
            <div className="flex-1 flex flex-col justify-center px-6 py-8">
              <h2 className="text-3xl font-bold text-center mb-6 text-gold uppercase tracking-wider leading-tight">
                {t('register.formTitle')}
              </h2>
              <div className="space-y-4 mb-6">
                <input type="text" value={name} onChange={e => setName(e.target.value)}
                  placeholder={t('register.fullName')} autoComplete="name" dir="auto"
                  className={`w-full bg-white text-[#1a1a1a] font-bold text-lg px-6 py-4 rounded-2xl outline-none focus:ring-4 focus:ring-[#cc9a5280] transition-all${locale === 'ar' ? ' placeholder:text-right' : ''}`} />
                <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder={t('register.email')} autoComplete="email" inputMode="email" dir="ltr"
                  className={`w-full bg-white text-[#1a1a1a] font-bold text-lg px-6 py-4 rounded-2xl outline-none focus:ring-4 focus:ring-[#cc9a5280] transition-all${locale === 'ar' ? ' placeholder:text-right' : ''}`} />
              </div>
              <div className="mb-6">
                <Checkbox checked={ageConfirmed} onToggle={() => setAgeConfirmed(v => !v)}>
                  {t('register.ageConfirm')}
                </Checkbox>
              </div>
              {error && <p className="text-yellow-400 text-sm text-center mb-4">{error}</p>}
              <button onClick={handleDetailsNext}
                className="w-full bg-gold-gradient text-[#1a1a1a] font-black text-xl py-4 rounded-2xl shadow-premium active:scale-[0.98] transition-all">
                {t('common.next')}
              </button>
            </div>
          </>
        )}

        {/* ── Terms Step ── */}
        {step === 'terms' && (
          <>
            <Banner />
            <div className="flex-1 flex flex-col px-6 py-6">
              <h2 className="text-2xl font-bold text-center mb-4 text-gold uppercase tracking-wider">
                {t('terms.title')}
              </h2>
              <div className="bg-white rounded-2xl p-5 mb-6 max-h-[280px] overflow-y-auto scrollbar text-[#1a1a1a]">
                <p className="font-bold text-sm mb-3">{t('terms.intro')}</p>
                {([
                  ['introTitle', 'introText'], ['eligibilityTitle', 'eligibilityText'],
                  ['periodTitle', 'periodText'], ['howTitle', 'howText'],
                  ['prizesTitle', 'prizesText'], ['drawTitle', 'drawText'],
                  ['redeemTitle', 'redeemText'], ['privacyTitle', 'privacyText'],
                  ['disclaimerTitle', 'disclaimerText'], ['generalTitle', 'generalText'],
                ] as [string, string][]).map(([tk, vk], i) => (
                  <div key={tk} className="mb-3">
                    <h3 className="font-bold text-sm mb-1">{i + 1}. {t(`terms.${tk}`)}</h3>
                    <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-line">{t(`terms.${vk}`)}</p>
                  </div>
                ))}
              </div>
              <div className="space-y-4 mb-6">
                <Checkbox checked={termsAgreed} onToggle={() => setTermsAgreed(v => !v)}>
                  {t('register.termsAgree')} {t('register.termsLink')}
                </Checkbox>
                <Checkbox checked={newsConsent} onToggle={() => setNewsConsent(v => !v)}>
                  {t('register.newsConsent')}
                </Checkbox>
              </div>
              {error && <p className="text-yellow-400 text-sm text-center mb-4">{error}</p>}
              <button onClick={handleFormSubmit} disabled={loading}
                className="w-full bg-gold-gradient text-[#1a1a1a] font-black text-xl py-4 rounded-2xl shadow-premium active:scale-[0.98] transition-all disabled:opacity-60">
                {loading ? '...' : t('common.submit')}
              </button>
            </div>
          </>
        )}
      </div>

    </div>
  )
}
