import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { routing } from '@/i18n/routing'

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params

  if (!routing.locales.includes(locale as 'ar' | 'en')) {
    notFound()
  }

  const messages = await getMessages()

  const isAr = locale === 'ar'

  return (
    <NextIntlClientProvider messages={messages} locale={locale}>
      {/* This wrapper is server-rendered per locale segment, so dir + font
          update correctly on every route change — fixing the stale <html> issue */}
      <div
        dir={isAr ? 'rtl' : 'ltr'}
        style={{ fontFamily: isAr ? 'var(--font-cairo)' : 'var(--font-poppins)', minHeight: '100dvh' }}
      >
        {children}
      </div>
    </NextIntlClientProvider>
  )
}
