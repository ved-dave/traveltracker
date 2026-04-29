import type { Metadata } from 'next'
import { Poppins } from 'next/font/google'
import Footer from '@/components/Footer'
import './globals.css'

const poppins = Poppins({ subsets: ['latin'], weight: ['300', '400', '500', '600'] })

export const metadata: Metadata = {
  title: 'World Map Tracker',
  description: 'Track the places you have visited, lived, and called home.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={poppins.className}>
      <body className="flex flex-col min-h-screen" style={{ background: '#0a0a0a' }}>
        {children}
        <Footer />
      </body>
    </html>
  )
}
