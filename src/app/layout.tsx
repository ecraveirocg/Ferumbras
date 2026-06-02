import type { Metadata } from 'next'
import './globals.css'
import Sidebar from '@/components/layout/Sidebar'
import RouteProgress from '@/components/ui/RouteProgress'
import PageTransition from '@/components/ui/PageTransition'

export const metadata: Metadata = {
  title: 'Ferumbras - Tibia Hunt Tracker',
  description: 'Track your Tibia hunting sessions, gold, and experience gains',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#1a1a1a] text-white min-h-screen">
        <RouteProgress />
        <PageTransition>
          <div className="flex h-screen overflow-hidden">
            <Sidebar />
            <main className="flex-1 overflow-y-auto bg-[#1a1a1a]">
              {children}
            </main>
          </div>
        </PageTransition>
      </body>
    </html>
  )
}
