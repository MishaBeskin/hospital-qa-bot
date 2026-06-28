import type { Metadata } from 'next'
import { Rubik } from 'next/font/google'
import { ThemeProvider } from '@/components/theme-provider'
import './globals.css'

const rubik = Rubik({
  variable: '--font-sans',
  subsets: ['latin', 'hebrew'],
  weight: ['300', '400', '500', '600', '700'],
})

export const metadata: Metadata = {
  title: 'עוזר HR — בית החולים',
  description: 'מערכת שאלות ותשובות לצוות בית החולים',
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="he" dir="rtl" className={`${rubik.variable} h-full`} suppressHydrationWarning>
      <body className="min-h-full flex flex-col antialiased">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
