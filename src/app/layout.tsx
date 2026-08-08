import type { Metadata, Viewport } from 'next'
import { ThemeProvider } from 'next-themes'
import { Layout } from '@/components/layout/Layout'
import { SkipLink } from '@/components/ui/SkipLink'
import { BackToTop } from '@/components/ui/BackToTop'
import '@/index.css'

export const metadata: Metadata = {
  title: {
    default: 'Vinayak Mathur — ML Engineer | Production GenAI Systems',
    template: '%s — Vinayak Mathur',
  },
  description:
    'ML Engineer, 4 years shipping production AI. RAG pipelines, LLM fine-tuning and MLOps at enterprise scale. Open to senior roles and architecture consulting.',
  authors: [{ name: 'Vinayak Mathur' }],
  metadataBase: new URL('https://vnykzhub.com'),
  openGraph: {
    type: 'website',
    url: 'https://vnykzhub.com',
    title: 'Vinayak Mathur — ML Engineer',
    description: 'Production GenAI systems, RAG pipelines, MLOps at scale.',
    images: '/og-image.png',
    siteName: 'Vinayak Mathur',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Vinayak Mathur — ML Engineer',
    description: 'Production GenAI systems, RAG pipelines, MLOps at scale.',
    images: '/og-image.png',
  },
  robots: 'index, follow',
  icons: '/favicon.svg',
  alternates: {
    canonical: 'https://vnykzhub.com',
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: dark)', color: '#100E0C' },
    { media: '(prefers-color-scheme: light)', color: '#F3F5F8' },
  ],
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider
          attribute="data-theme"
          defaultTheme="dark"
          storageKey="geom-odometer-theme"
          enableSystem
          disableTransitionOnChange
        >
          <SkipLink />
          <Layout>{children}</Layout>
          <BackToTop />
        </ThemeProvider>
      </body>
    </html>
  )
}
