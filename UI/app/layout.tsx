import type { Metadata, Viewport } from 'next'
import './globals.css'
import ChatBot from "@/components/chatbot"
import { Toaster } from 'sonner'
// Removed: import AudioControls from '@/components/audio-controls' 

export const metadata: Metadata = {
  title: 'Venkata Thota | AI/ML Engineer & Cybersecurity Specialist',
  description: 'Portfolio showcasing cutting-edge AI solutions, cybersecurity expertise, and full-stack development projects.',
  keywords: [
    'AI Engineer',
    'Machine Learning',
    'Cybersecurity',
    'Full Stack Developer',
    'Python',
    'React',
    'Next.js',
    'Portfolio',
    'Venkata Thota'
  ],
  openGraph: {
    title: 'Venkata Venu Thota | AI/ML Engineer Portfolio',
    description: 'Innovative solutions in AI/ML, Cybersecurity, and Web Development',
    url: 'https://venu-thota.vercel.app',
    siteName: 'Venkata Thota Portfolio',
    images: [
      {
        url: 'https://venu-thota.vercel.app/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Venkata Thota Portfolio Preview',
      }
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Venkata Venu Thota | AI/ML Engineer',
    description: 'Building secure, intelligent systems for the future',
    creator: '@VenuThota',
    images: ['https://venu-thota.vercel.app/og-image.jpg'],
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: '/icon.png',
  },
}

export const viewport: Viewport = {
  themeColor: '#0f172a',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className="relative bg-slate-900 text-slate-100 antialiased">
        {children}
        <Toaster position="top-right" richColors />

        <div className="fixed bottom-6 right-6 z-[999]">
          <ChatBot />
        </div>

        {/* Removed: <AudioControls /> */}
      </body>
    </html>
  )
}