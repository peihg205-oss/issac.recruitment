import type { Metadata } from 'next'
import { Plus_Jakarta_Sans } from 'next/font/google'
import './globals.css'
import { Toaster } from '@/components/ui/toaster'

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin', 'vietnamese'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-jakarta',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'iSSAC - VNU-IS Ambassadors Club | Câu lạc bộ Đại sứ Sinh viên',
  description: 'iSSAC - Kết nối, lan tỏa và truyền cảm hứng. Cổng thông tin và tuyển chọn thành viên chính thức Câu lạc bộ Đại sứ Sinh viên Trường Quốc tế - ĐHQGHN.',
  keywords: ['iSSAC', 'VNU-IS', 'Ambassadors Club', 'CLB Đại sứ Sinh viên', 'tuyển thành viên', 'Trường Quốc tế ĐHQGHN'],
  openGraph: {
    title: 'iSSAC - Câu lạc bộ Đại sứ Sinh viên VNU-IS',
    description: 'Bridge to Success - Kết nối, lan tỏa và truyền cảm hứng',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="vi" className={plusJakartaSans.variable}>
      <head>
        <link rel="icon" href="/issac-logo.png" type="image/png" />
      </head>
      <body className="font-sans antialiased bg-[#fcfbf9] text-gray-900 selection:bg-[#fdc455]/30">
        {children}
        <Toaster />
      </body>
    </html>
  )
}
