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
    icon: '/issac-logo.png',
    shortcut: '/issac-logo.png',
    apple: '/issac-logo.png',
  },
  openGraph: {
    title: 'iSSAC - CLB Đại sứ Sinh viên VNUIS',
    description: 'Bridge to Success - Kết nối, lan tỏa và truyền cảm hứng',
    type: 'website',
    images: ['/issac-logo.png'],
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
        <link rel="icon" href="/issac-logo.png" type="image/png" />
      </head>
      <body className="font-sans antialiased bg-[#fcfbf9] text-gray-900 selection:bg-[#fdc455]/30">
        {children}
        <Toaster />
      </body>
    </html>
  )
}
