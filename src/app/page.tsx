'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  Megaphone, MessageSquare, Calendar, TrendingUp, LayoutGrid,
  Check, ArrowRight, Share2, Play, ChevronRight, ChevronLeft,
  Globe, ExternalLink, Sparkles, UserCheck, ShieldCheck, Heart
} from 'lucide-react'

export default function HomePage() {
  const [activeSlide, setActiveSlide] = useState(0)

  const cards = [
    {
      num: '01',
      title: 'Truyền thông',
      desc: 'Sáng tạo nội dung, lan tỏa hình ảnh và giá trị của Trường Quốc tế.',
      icon: Megaphone,
    },
    {
      num: '02',
      title: 'Tư vấn tuyển sinh',
      desc: 'Đồng hành cùng thí sinh và phụ huynh trong hành trình chọn trường.',
      icon: MessageSquare,
    },
    {
      num: '03',
      title: 'Sự kiện',
      desc: 'Tổ chức và tham gia các sự kiện học thuật, trải nghiệm và cộng đồng.',
      icon: Calendar,
    },
    {
      num: '04',
      title: 'Môi trường phát triển',
      desc: 'Rèn luyện kỹ năng, mở rộng mối quan hệ và phát triển bản thân.',
      icon: TrendingUp,
    },
    {
      num: '05',
      title: 'Member Hub',
      desc: 'Nền tảng quản lý hoạt động, minh chứng và kết nối thành viên.',
      icon: LayoutGrid,
    },
  ]

  const socialLinks = [
    {
      name: 'Facebook',
      handle: '@iSSAC.VNUIS',
      href: 'https://facebook.com/iSSAC.VNUIS',
      bgBtn: 'bg-[#1877f2] hover:bg-[#166fe5]',
      icon: (
        <div className="w-10 h-10 rounded-full bg-[#1877f2] text-white flex items-center justify-center font-black text-lg">
          f
        </div>
      ),
    },
    {
      name: 'TikTok',
      handle: '@issac.club',
      href: 'https://tiktok.com/@issac.club',
      bgBtn: 'bg-[#000000] hover:bg-gray-800',
      icon: (
        <div className="w-10 h-10 rounded-full bg-black text-white flex items-center justify-center font-black text-sm">
          d
        </div>
      ),
    },
    {
      name: 'Instagram',
      handle: '@issac.club',
      href: 'https://instagram.com/issac.club',
      bgBtn: 'bg-gradient-to-r from-[#833ab4] via-[#fd1d1d] to-[#fcb045] hover:opacity-90',
      icon: (
        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#fd1d1d] via-[#e1306c] to-[#833ab4] text-white flex items-center justify-center font-bold text-xs">
          ig
        </div>
      ),
    },
    {
      name: 'YouTube',
      handle: 'issac_club',
      href: 'https://youtube.com',
      bgBtn: 'bg-[#ff0000] hover:bg-[#e60000]',
      icon: (
        <div className="w-10 h-10 rounded-full bg-[#ff0000] text-white flex items-center justify-center font-bold text-xs">
          ▶
        </div>
      ),
    },
    {
      name: 'Website',
      handle: 'issac.vn',
      href: 'https://issactestnotdone.vercel.app',
      bgBtn: 'bg-[#1559c5] hover:bg-[#0f449e]',
      icon: (
        <div className="w-10 h-10 rounded-full bg-[#1559c5] text-white flex items-center justify-center">
          <Globe className="w-5 h-5" />
        </div>
      ),
    },
  ]

  return (
    <div className="min-h-screen bg-[#fcfbf9] text-gray-900 selection:bg-[#fdc455]/30">
      {/* 1. TOP HEADER / NAVBAR (Exact brand royal blue) */}
      <header className="sticky top-0 z-50 bg-[#1559c5] border-b border-white/10 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Logo & Brand Name */}
          <Link href="/" className="flex items-center gap-3.5 group">
            <Image
              src="/issac-logo.png"
              alt="iSSAC Logo"
              width={48}
              height={51}
              className="object-contain flex-shrink-0 drop-shadow-md group-hover:scale-105 transition-transform"
              priority
            />
            <div className="text-white text-left leading-tight hidden sm:block">
              <div className="font-extrabold text-[11px] tracking-wider uppercase opacity-95">
                CÂU LẠC BỘ ĐẠI SỨ SINH VIÊN
              </div>
              <div className="font-black text-sm tracking-wide text-[#fdc455]">
                BRIDGE TO SUCCESS
              </div>
              <div className="font-semibold text-[10px] tracking-wider uppercase opacity-85">
                VNU-IS AMBASSADORS CLUB
              </div>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden lg:flex items-center gap-7 text-sm font-bold text-white">
            <a href="#about" className="hover:text-[#fdc455] transition-colors border-b-2 border-transparent hover:border-[#fdc455] py-1">
              Về iSSAC
            </a>
            <a href="#activities" className="hover:text-[#fdc455] transition-colors py-1">
              Thành viên
            </a>
            <a href="#activities" className="hover:text-[#fdc455] transition-colors py-1">
              Hoạt động
            </a>
            <a href="#events" className="hover:text-[#fdc455] transition-colors py-1">
              Sự kiện
            </a>
            <a href="#social" className="hover:text-[#fdc455] transition-colors py-1">
              Tin tức
            </a>
            <a href="#contact" className="hover:text-[#fdc455] transition-colors py-1">
              Liên hệ
            </a>
          </nav>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5">
            <a
              href="#social"
              className="hidden md:inline-flex items-center gap-2 bg-[#fdc455] hover:bg-[#f59e0b] text-gray-950 font-bold px-4 py-2 rounded-full text-xs shadow-sm transition-all"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Kết nối Mạng xã hội</span>
            </a>

            <Link
              href="/admin/dashboard"
              className="hidden sm:inline-flex items-center gap-1.5 border border-white/40 text-white hover:bg-white/10 font-bold px-3 py-2 rounded-full text-xs transition-colors"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-[#fdc455]" />
              <span>Admin Portal</span>
            </Link>

            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 bg-white text-[#1559c5] hover:bg-blue-50 font-bold px-4 py-2 rounded-full text-xs shadow-sm transition-all"
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Đăng nhập</span>
            </Link>
          </div>
        </div>
      </header>

      {/* 2. HERO SECTION (Screenshot 1 matching) */}
      <section className="bg-[#1559c5] text-white pt-10 pb-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-12 gap-10 items-center">
            {/* Left Column: Heading & Content */}
            <div className="lg:col-span-6 space-y-6 text-left">
              {/* Badge */}
              <div className="inline-block">
                <span className="bg-[#fdc455] text-gray-950 text-xs font-black uppercase px-4 py-1.5 rounded-full tracking-wider shadow-sm">
                  CÂU LẠC BỘ ĐẠI SỨ SINH VIÊN
                </span>
              </div>

              {/* Main Heading */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black leading-[1.12] tracking-tight">
                <span className="text-[#fdc455]">iSSAC</span> - Kết nối, lan tỏa và truyền cảm hứng
              </h1>

              {/* Subtitle */}
              <p className="text-blue-100 text-base sm:text-lg leading-relaxed max-w-xl font-medium">
                Những sinh viên tiên phong - cùng kết nối, lan tỏa và kiến tạo giá trị cho cộng đồng Trường Quốc tế.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-wrap items-center gap-3.5 pt-2">
                <a
                  href="#about"
                  className="bg-[#fdc455] hover:bg-[#f59e0b] text-gray-950 font-black px-6 py-3 rounded-full text-sm shadow-md transition-all inline-flex items-center gap-1.5 hover:translate-x-0.5"
                >
                  <span>Khám phá iSSAC</span>
                  <span>›</span>
                </a>

                <Link
                  href="/member/application"
                  className="border-2 border-white text-white hover:bg-white/15 font-black px-6 py-3 rounded-full text-sm transition-all inline-flex items-center gap-1.5"
                >
                  <span>Tham gia ứng tuyển</span>
                  <span>›</span>
                </Link>
              </div>
            </div>

            {/* Right Column: Hero Real Photo Frame */}
            <div className="lg:col-span-6">
              <div className="relative">
                {/* Photo container with white border */}
                <div className="rounded-[2.2rem] border-4 border-white overflow-hidden shadow-2xl bg-white relative aspect-[16/10]">
                  <Image
                    src="/issac-hero-team.jpg"
                    alt="Đại sứ sinh viên iSSAC VNU-IS"
                    fill
                    className="object-cover"
                    priority
                  />
                </div>

                {/* Carousel Controls */}
                <div className="flex items-center justify-between mt-4 px-2">
                  <button
                    type="button"
                    onClick={() => setActiveSlide(prev => Math.max(0, prev - 1))}
                    className="w-9 h-9 rounded-full bg-white/25 hover:bg-white/40 text-white flex items-center justify-center transition-colors shadow-sm"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>

                  <div className="flex items-center gap-1.5">
                    <span className="w-6 h-2 rounded-full bg-[#fdc455]" />
                    <span className="w-2 h-2 rounded-full bg-white/50" />
                    <span className="w-2 h-2 rounded-full bg-white/50" />
                    <span className="w-2 h-2 rounded-full bg-white/50" />
                    <span className="w-2 h-2 rounded-full bg-white/50" />
                  </div>

                  <button
                    type="button"
                    onClick={() => setActiveSlide(prev => Math.min(4, prev + 1))}
                    className="w-9 h-9 rounded-full bg-white/25 hover:bg-white/40 text-white flex items-center justify-center transition-colors shadow-sm"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. FIVE WARM CREAM CARDS (Screenshot 1 matching) */}
      <section className="-mt-10 relative z-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto" id="activities">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          {cards.map((c) => {
            const Icon = c.icon
            return (
              <div
                key={c.num}
                className="bg-[#fff7e8] border border-[#fed7aa]/60 rounded-3xl p-5 relative overflow-hidden shadow-sm hover:shadow-md transition-all hover:-translate-y-1 group"
              >
                {/* Watermark Number */}
                <span className="absolute top-2 right-4 text-4xl font-black text-[#e5d8c3] select-none pointer-events-none opacity-80">
                  {c.num}
                </span>

                <div className="space-y-3 relative z-10 text-left">
                  {/* Round Blue Icon Badge */}
                  <div className="w-10 h-10 rounded-full bg-[#1559c5] text-white flex items-center justify-center shadow-sm">
                    <Icon className="w-5 h-5" />
                  </div>

                  {/* Title & Description */}
                  <div>
                    <h3 className="font-extrabold text-sm text-gray-950 mb-1 leading-snug">
                      {c.title}
                    </h3>
                    <p className="text-xs text-gray-600 leading-relaxed">
                      {c.desc}
                    </p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* 4. SECTION: VỀ iSSAC (Screenshot 2 matching) */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto" id="about">
        <div className="grid lg:grid-cols-12 gap-8 items-stretch">
          {/* Left: Video Box */}
          <div className="lg:col-span-6 flex flex-col">
            <div className="bg-[#1251b5] rounded-3xl overflow-hidden shadow-lg flex flex-col flex-1 border border-blue-800">
              {/* Top blue pill */}
              <div className="p-4 pb-2">
                <span className="bg-[#1559c5] border border-blue-400/30 text-white text-xs font-bold px-3 py-1 rounded-lg inline-block">
                  Video giới thiệu iSSAC
                </span>
              </div>

              {/* Video Embed / Thumbnail */}
              <div className="relative flex-1 min-h-[280px] bg-slate-900 group">
                <Image
                  src="/issac-video-thumb.jpg"
                  alt="RECAP 2nd Anniversary of iSSAC Club"
                  fill
                  className="object-cover opacity-90 group-hover:opacity-100 transition-opacity"
                />
                <a
                  href="https://youtube.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="absolute inset-0 flex items-center justify-center"
                >
                  <div className="w-16 h-12 rounded-2xl bg-[#ff0000] hover:bg-red-700 text-white flex items-center justify-center shadow-2xl transition-transform group-hover:scale-110">
                    <Play className="w-6 h-6 fill-white ml-0.5" />
                  </div>
                </a>
              </div>

              {/* Bottom bar */}
              <div className="p-4 bg-[#1251b5] flex items-center justify-between text-white text-sm font-bold">
                <span>iSSAC - Kết nối, lan tỏa và truyền cảm hứng</span>
                <div className="w-7 h-7 rounded-full bg-[#1559c5] flex items-center justify-center">
                  ›
                </div>
              </div>
            </div>
          </div>

          {/* Right: Về iSSAC Text & Checklist Card */}
          <div className="lg:col-span-6 flex flex-col">
            <div className="bg-[#fff7e8] border border-[#fed7aa]/60 rounded-3xl p-8 sm:p-10 shadow-sm flex flex-col justify-center flex-1 text-left">
              <h2 className="text-3xl sm:text-4xl font-black text-[#1559c5] mb-6">
                Về iSSAC
              </h2>

              <div className="space-y-4 text-xs sm:text-sm text-gray-800 leading-relaxed">
                {[
                  'iSSAC là Câu lạc bộ Đại sứ Sinh viên Trường Quốc tế - ĐHQGHN, được Ban Giám hiệu, Đảng ủy và Đoàn Trường Quốc tế phê duyệt, được xây dựng để tạo môi trường phát triển cho sinh viên.',
                  'Ban Chủ nhiệm được chuẩn y theo cơ chế của BCH Đoàn Trường, các chương trình hoạt động tuân thủ quy định của Đoàn Trường Quốc tế, có cố vấn là thầy cô phòng TT&TS định hướng rõ ràng.',
                  'Chức năng chính: truyền thông hình ảnh sinh viên VNUIS, tư vấn tuyển sinh, hỗ trợ học sinh và phụ huynh THPT định hướng và nhập học, tổ chức sự kiện, đào tạo kỹ năng và phát triển đội ngũ.',
                  'Nơi hội tụ những bạn trẻ năng động, sáng tạo, trách nhiệm và sẵn sàng đồng hành.',
                  'Môi trường phát triển có mục tiêu rõ ràng, thành viên đoàn kết và có quy tắc chung để hoạt động dựa trên tập thể và không bỏ ai lại phía sau.'
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-[#fdc455] text-[#0f347a] flex items-center justify-center font-bold text-xs flex-shrink-0 mt-0.5 shadow-sm">
                      ✓
                    </div>
                    <p className="flex-1 text-gray-800">{item}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. SECTION: NỀN TẢNG MẠNG XÃ HỘI (Screenshot 3 matching) */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto" id="social">
        <div className="grid lg:grid-cols-12 gap-10 items-center">
          {/* Left Column: Social description and bullet points */}
          <div className="lg:col-span-6 space-y-6 text-left">
            <div>
              <span className="text-[#1559c5] font-black text-xs uppercase tracking-widest block mb-2">
                MẠNG XÃ HỘI
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-[#1559c5] tracking-tight mb-3">
                Nền tảng mạng xã hội của iSSAC
              </h2>
              <p className="text-gray-600 text-sm leading-relaxed">
                Nơi lan tỏa và lưu giữ những khoảnh khắc, câu chuyện và giá trị của iSSAC. Hãy theo dõi iSSAC trên các nền tảng mạng xã hội.
              </p>
            </div>

            {/* Bullet Points Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-gray-700">
              {[
                'Cập nhật tin tức & sự kiện mới nhất mà iSSAC tham gia',
                'Nơi những câu chuyện đáng nhớ được chia sẻ',
                'Lưu trữ những khoảnh khắc đáng nhớ',
                'Livestream, Webinar, Talkshow hấp dẫn',
                'Kết nối câu chuyện của thành viên',
                'Cơ hội nghề nghiệp & hợp tác khi học tại VNUIS',
                'Chia sẻ kiến thức & kinh nghiệm về ngành học tại VNUIS',
                'Đồng hành và giải đáp câu hỏi của các em THPT',
              ].map((text, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="text-[#1559c5] font-bold">✓</span>
                  <span>{text}</span>
                </div>
              ))}
            </div>

            {/* Button */}
            <div className="pt-2">
              <a
                href="https://facebook.com/iSSAC.VNUIS"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-[#fdc455] hover:bg-[#f59e0b] text-gray-950 font-black px-6 py-3 rounded-full text-sm shadow-md transition-all inline-flex items-center gap-1.5"
              >
                <span>Truy cập ngay</span>
                <span>›</span>
              </a>
            </div>
          </div>

          {/* Right Column: Social Media Cards Stack */}
          <div className="lg:col-span-6 space-y-3">
            {socialLinks.map((item) => (
              <div
                key={item.name}
                className="bg-white border border-gray-200/80 rounded-2xl p-4 flex items-center justify-between shadow-sm hover:shadow-md transition-all"
              >
                <div className="flex items-center gap-3.5">
                  {item.icon}
                  <div className="text-left">
                    <div className="font-extrabold text-sm text-gray-950">{item.name}</div>
                    <div className="text-xs text-gray-500 font-medium">{item.handle}</div>
                  </div>
                </div>

                <a
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${item.bgBtn} text-white text-xs font-bold px-5 py-2 rounded-full transition-all shadow-sm`}
                >
                  Truy cập ngay
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. RECRUITMENT CAMPAIGN BANNER (TOP 15 SELECTION) */}
      <section className="py-14 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto" id="recruitment">
        <div className="bg-[#1559c5] rounded-[2.5rem] p-8 sm:p-12 text-white shadow-2xl relative overflow-hidden text-center">
          <div className="max-w-3xl mx-auto space-y-5 relative z-10">
            <div className="inline-flex items-center gap-2 bg-[#fdc455] text-gray-950 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider shadow-sm">
              <Sparkles className="w-3.5 h-3.5" />
              CHIẾN DỊCH TUYỂN THÀNH VIÊN CHÍNH THỨC 2026
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black leading-tight">
              Trở thành 1 trong <span className="text-[#fdc455]">TOP 15</span> Đại sứ sinh viên iSSAC
            </h2>

            <p className="text-blue-100 text-sm sm:text-base leading-relaxed max-w-2xl mx-auto">
              Tuyển sinh cho 3 ban chuyên môn: <strong>Ban Truyền thông</strong>, <strong>Ban Tư vấn</strong>, và <strong>Ban Nhân sự</strong>. Chấm điểm theo thang tiêu chuẩn, xếp hạng minh bạch và thẩm định trực tiếp bởi Ban Chủ nhiệm.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3.5 pt-3">
              <Link
                href="/member/application"
                className="bg-[#fdc455] hover:bg-[#f59e0b] text-gray-950 font-black px-7 py-3.5 rounded-full text-sm shadow-lg transition-all inline-flex items-center gap-2 hover:scale-105"
              >
                <span>Nộp đơn ứng tuyển ngay</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <Link
                href="/member/dashboard"
                className="border-2 border-white text-white hover:bg-white/15 font-black px-6 py-3.5 rounded-full text-sm transition-all inline-flex items-center gap-2"
              >
                <span>Tra cứu tiến độ hồ sơ</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 7. FOOTER */}
      <footer className="bg-[#0f3e8f] text-white py-14 px-4 sm:px-6 lg:px-8 border-t border-blue-900" id="contact">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
          {/* Col 1 */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Image src="/issac-logo.png" alt="iSSAC Logo" width={40} height={42} className="object-contain" />
              <div>
                <div className="font-extrabold text-xs text-[#fdc455]">CÂU LẠC BỘ ĐẠI SỨ SINH VIÊN</div>
                <div className="font-black text-sm text-white">VNU-IS AMBASSADORS CLUB (iSSAC)</div>
              </div>
            </div>
            <p className="text-xs text-blue-200 leading-relaxed">
              Trực thuộc Đoàn Thanh niên - Hội Sinh viên Trường Quốc tế, Đại học Quốc gia Hà Nội.
            </p>
          </div>

          {/* Col 2 */}
          <div className="space-y-2 text-xs text-blue-200">
            <div className="font-bold text-sm text-white mb-2">Địa điểm & Liên hệ</div>
            <div>• Trụ sở: Làng Sinh viên HACINCO, 99 Ngụy Như Kon Tum, Thanh Xuân, Hà Nội</div>
            <div>• Email CLB: clbdaisu@isvnu.vn / issac@vnu.edu.vn</div>
            <div>• Hotline: (024) 3557 5992</div>
          </div>

          {/* Col 3 */}
          <div className="space-y-2 text-xs text-blue-200">
            <div className="font-bold text-sm text-white mb-2">Đường dẫn nhanh</div>
            <div><Link href="/login" className="hover:text-[#fdc455] transition-colors">• Cổng Đăng nhập (Admin & Ứng viên)</Link></div>
            <div><Link href="/admin/ranking" className="hover:text-[#fdc455] transition-colors">• Bảng Xếp Hạng Tuyển Sinh (TOP 15)</Link></div>
            <div><Link href="/member/application" className="hover:text-[#fdc455] transition-colors">• Điền đơn ứng tuyển 3 ban</Link></div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto mt-10 pt-6 border-t border-blue-800/60 text-center text-xs text-blue-300">
          © 2026 iSSAC - Câu lạc bộ Đại sứ Sinh viên Trường Quốc tế, ĐHQGHN. All rights reserved.
        </div>
      </footer>
    </div>
  )
}
