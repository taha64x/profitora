import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { Toaster } from 'sonner'
import HydrationFlag from '@/components/HydrationFlag'
import './globals.css'

const inter = Inter({ subsets: ['latin'], display: 'swap' })

export const metadata: Metadata = {
  title: {
    default: 'Profitora – KI-Wirtschaftlichkeitsanalyse für Ihr Unternehmen',
    template: '%s | Profitora',
  },
  description:
    'Laden Sie Ihre Unternehmensdaten hoch. Die KI zeigt Ihnen, wo Ihr Betrieb Geld verliert – mit branchenspezifischen Benchmarks und konkreten Sparpotenzialen in Euro.',
  keywords: ['Wirtschaftlichkeitsanalyse', 'KI Controlling', 'Hotel Analyse', 'Restaurant KPI', 'Einzelhandel Controlling', 'Sparpotenziale', 'Betriebswirtschaft'],
  robots: { index: true, follow: true },
  manifest: '/manifest.json',
  openGraph: {
    title: 'Profitora – KI-Wirtschaftlichkeitsanalyse',
    description: 'Wo verliert Ihr Betrieb Geld? Die KI zeigt es Ihnen in Minuten.',
    type: 'website',
    locale: 'de_DE',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Profitora',
  },
  other: {
    'mobile-web-app-capable': 'yes',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  // Zoomen erlauben (Barrierefreiheit) – nicht sperren.
  maximumScale: 5,
  // Inhalt bis in die Notch-/Safe-Area ziehen; Abstände regelt CSS via env().
  viewportFit: 'cover',
  themeColor: '#06091A',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de" className={inter.className}>
      <body>
        <HydrationFlag />
        {children}
        <Toaster
          position="top-right"
          richColors
          toastOptions={{
            style: { fontFamily: 'inherit', fontSize: '14px' },
            duration: 4000,
          }}
        />
      </body>
    </html>
  )
}
