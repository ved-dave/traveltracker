import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import Footer from '@/components/Footer'
import './globals.css'

export const metadata: Metadata = {
  title: 'World Map Tracker',
  description: 'Track the places you have visited, lived, and called home.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={GeistSans.className}>
      <body style={{ background: '#0a0a0a' }}>
        {children}
        <Footer />
      </body>
    </html>
  )
}
