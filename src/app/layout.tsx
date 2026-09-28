import type { Metadata } from 'next'
import { Montserrat } from 'next/font/google'
import './globals.css'
import { Toaster } from '@/components/ui/toaster'

const montserrat = Montserrat({
  subsets: ['latin', 'vietnamese'],
  weight: ['300', '400', '500', '600', '700', '800', '900'],
  variable: '--font-montserrat',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'iSSAC - CLB Đại sứ Sinh viên VNUIS',
  description: 'iSSAC - Kết nối, lan tỏa và truyền cảm hứng. Cổng thông tin và tuyển chọn thành viên chính thức Câu lạc bộ Đại sứ Sinh viên Trường Quốc tế - ĐHQGHN.',
  keywords: ['iSSAC', 'VNU-IS', 'Ambassadors Club', 'CLB Đại sứ Sinh viên', 'tuyển thành viên', 'Trường Quốc tế ĐHQGHN'],
  icons: {
    icon: [
      { url: '/issac-logo.png?v=3', type: 'image/png' },
      { url: '/favicon.ico?v=3', sizes: 'any' },
    ],
    shortcut: '/issac-logo.png?v=3',
    apple: '/apple-touch-icon.png?v=3',
  },
  openGraph: {
    title: 'iSSAC - CLB Đại sứ Sinh viên VNUIS',
    description: 'Bridge to Success - Kết nối, lan tỏa và truyền cảm hứng',
    type: 'website',
    images: ['/issac-logo.png?v=3'],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="vi" className={montserrat.variable}>
      <head>
        <link rel="icon" href="/issac-logo.png?v=3" type="image/png" sizes="any" />
        <link rel="shortcut icon" href="/favicon.ico?v=3" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png?v=3" />
      </head>
      <body className="font-sans antialiased bg-[#fcfbf9] text-gray-900 selection:bg-[#fdc455]/30">
        {children}
        <Toaster />
      </body>
    </html>
  )
}
