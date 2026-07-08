// app/layout.tsx
import type { Metadata } from 'next'
import { getSiteSettings, themeToDataAttr, designToDataAttr } from '@/lib/theme'
import Script from 'next/script'
import './globals.css'

export const metadata: Metadata = {
  title:       'Afroqueens — Music & Events',
  description: 'Your gateway to the beating pulse of the global music scene.',
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const settings  = await getSiteSettings()
  const theme     = themeToDataAttr(settings.theme)
  const design    = designToDataAttr(settings.design)
  const GA_ID     = process.env.NEXT_PUBLIC_GA_ID

  return (
    <html
      lang="en"
      data-theme={theme}
      data-design={design}
      suppressHydrationWarning
    >
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=DM+Sans:wght@300;400;500;600&family=Playfair+Display:ital,wght@0,400;0,700;1,400;1,700&family=Space+Grotesk:wght@300;400;500;600;700&family=Syne:wght@400;600;700;800&display=swap"
          rel="stylesheet"
        />
        {/* Google Analytics 4 — add NEXT_PUBLIC_GA_ID to .env */}
        {GA_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
              strategy="afterInteractive"
            />
            <Script id="ga4-init" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${GA_ID}', { page_path: window.location.pathname });
              `}
            </Script>
          </>
        )}
      </head>
      <body>{children}</body>
    </html>
  )
}
