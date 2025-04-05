import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Link from 'next/link'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Secure Examination System',
  description: 'Blockchain-based secure examination and result management system',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <nav className="bg-gray-800 text-white p-4">
          <div className="container mx-auto flex items-center justify-between">
            <Link href="/" className="text-xl font-bold">
              Secure Exam System
            </Link>
            <div className="space-x-4">
              <Link href="/" className="hover:text-gray-300">
                Dashboard
              </Link>
              <Link href="/paper-delivery" className="hover:text-gray-300">
                Paper Delivery
              </Link>
            </div>
          </div>
        </nav>
        {children}
      </body>
    </html>
  )
}
