import type { Metadata } from 'next'
import { Cairo, Poppins } from 'next/font/google'
import { headers } from 'next/headers'
import './globals.css'

const cairo = Cairo({
  subsets: ['arabic', 'latin'],
  weight: ['400', '600', '700', '800'],
  variable: '--font-cairo',
  display: 'swap',
})

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800', '900'],
  variable: '--font-poppins',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'إلعب على الذهب مع موسي',
  description: 'Moussy Grand Draw Campaign',
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const headersList = await headers()
  const locale = headersList.get('x-next-intl-locale') ?? 'ar'
  const dir = locale === 'ar' ? 'rtl' : 'ltr'

  return (
    <html lang={locale} dir={dir} className={`${cairo.variable} ${poppins.variable}`}>
      <body style={{ fontFamily: locale === 'ar' ? 'var(--font-cairo)' : 'var(--font-poppins)' }}>
        <div className="max-w-[540px] mx-auto min-h-dvh relative overflow-hidden">
          {children}
        </div>
      </body>
    </html>
  )
}
