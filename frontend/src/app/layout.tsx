import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import './globals.css'
import Nav from '@/components/Nav'

const geist = Geist({ subsets: ['latin'], variable: '--font-geist-sans' })

export const metadata: Metadata = {
  title: 'LifeOS',
  description: '12-Week Year planning system',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={geist.variable}>
      <body className="flex min-h-screen bg-[#0a0a0a]">
        <Nav />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </body>
    </html>
  )
}
