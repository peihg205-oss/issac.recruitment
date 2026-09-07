import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from '@/components/ui/toaster'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: 'iSSAC — VNU-IS Ambassadors Club | Tuyển thành viên 2026',
  description: 'Câu lạc bộ Đại sứ Sinh viên — Bridge to Success. Tham gia iSSAC để phát triển bản thân, kết nối cộng đồng và tạo dựng tương lai.',
  keywords: ['iSSAC', 'VNU-IS', 'Ambassadors Club', 'CLB', 'tuyển thành viên', 'sinh viên'],
  openGraph: {
    title: 'iSSAC — VNU-IS Ambassadors Club',
    description: 'Bridge to Success — Tham gia iSSAC',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="vi">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Nunito:wght@400;600;700;800;900&display=swap" rel="stylesheet" />
        <link rel="icon" href="/issac-logo.png" type="image/png" />
      </head>
      <body className={`${inter.variable} font-sans antialiased`}>
        {children}
        <Toaster />
      </body>
    </html>
  )
}
