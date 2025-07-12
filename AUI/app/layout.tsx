import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Venu Thota | Full Stack Developer Portfolio',
  description: 'A modern full stack portfolio and admin dashboard built with Next.js, Tailwind CSS, MongoDB, and ShadCN UI. Explore projects, blogs, testimonials, and more.',
  generator: 'Next.js 14, App Router, TypeScript, Tailwind CSS, MongoDB, ShadCN UI, Framer Motion',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark">
      <body className="bg-slate-900 text-slate-100">
        {children}
      </body>
    </html>
  )
}
