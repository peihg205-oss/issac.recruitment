import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight, Users, Star, Award, BookOpen, Megaphone, MessageSquare, ChevronDown } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* NAVBAR */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-blue-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-3">
              <Image src="/issac-logo.png" alt="iSSAC Logo" width={40} height={40} className="rounded-full" />
              <div className="hidden sm:block">
                <div className="font-bold text-blue-900 text-sm">iSSAC</div>
                <div className="text-xs text-blue-500">VNU-IS Ambassadors Club</div>
              </div>
            </Link>
            <div className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-600">
              <Link href="/#about" className="hover:text-blue-700 transition-colors">Về iSSAC</Link>
              <Link href="/#departments" className="hover:text-blue-700 transition-colors">Ban hoạt động</Link>
              <Link href="/#events" className="hover:text-blue-700 transition-colors">Sự kiện</Link>
              <Link href="/contact" className="hover:text-blue-700 transition-colors">Liên hệ</Link>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/login">
                <Button variant="outline" size="sm">Đăng nhập</Button>
              </Link>
              <Link href="/register">
                <Button variant="gold" size="sm">Tham gia ngay</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16" style={{background: 'linear-gradient(135deg, #0f1b4c 0%, #1e3a8a 50%, #1e40af 100%)'}}>
        {/* Background decorations */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 right-20 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl" />
          <div className="absolute bottom-20 left-20 w-80 h-80 bg-amber-400/10 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/5 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 text-center max-w-4xl mx-auto px-6">
          <div className="flex justify-center mb-8">
            <div className="relative">
              <div className="absolute inset-0 bg-amber-400/20 rounded-full blur-2xl scale-150" />
              <Image
                src="/issac-logo.png"
                alt="iSSAC Logo"
                width={120}
                height={120}
                className="relative rounded-full border-4 border-white/20 shadow-2xl"
              />
            </div>
          </div>

          <div className="inline-flex items-center gap-2 bg-amber-400/20 border border-amber-400/30 rounded-full px-5 py-2 text-amber-300 text-sm font-medium mb-6">
            <Star className="w-4 h-4 fill-current" />
            Tuyển thành viên chính thức 2026
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white mb-4 leading-tight">
            Bridge to
            <span className="block text-transparent bg-clip-text" style={{backgroundImage: 'linear-gradient(135deg, #f59e0b, #fbbf24, #fde68a)'}}>
              Success
            </span>
          </h1>

          <p className="text-blue-200 text-lg sm:text-xl max-w-2xl mx-auto mb-4 leading-relaxed">
            <span className="font-bold text-white">iSSAC</span> — Câu lạc bộ Đại sứ Sinh viên VNU-IS.
            Nơi bạn phát triển bản thân, kết nối cộng đồng và tạo dựng tương lai.
          </p>

          <p className="text-blue-300 text-base mb-10">
            VNU-IS Ambassadors Club · Bridge to Success
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/register">
              <Button size="xl" variant="gold" className="group font-bold">
                Nộp đơn ứng tuyển
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link href="/#about">
              <Button size="xl" variant="outline" className="border-white/30 text-white hover:bg-white/10 hover:text-white font-semibold">
                Tìm hiểu thêm
              </Button>
            </Link>
          </div>

          <div className="mt-16 grid grid-cols-3 gap-6 max-w-md mx-auto">
            {[
              {num: '3+', label: 'Ban hoạt động'},
              {num: '100+', label: 'Thành viên'},
              {num: '50+', label: 'Sự kiện/năm'},
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <div className="text-2xl font-black text-amber-400">{stat.num}</div>
                <div className="text-blue-300 text-xs mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        <a href="#about" className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/50 hover:text-white transition-colors animate-bounce">
          <ChevronDown className="w-6 h-6" />
        </a>
      </section>

      {/* ABOUT */}
      <section id="about" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-full px-4 py-1.5 text-blue-600 text-sm font-medium mb-4">
              Về chúng tôi
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-blue-900 mb-4">
              iSSAC là gì?
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto text-lg leading-relaxed">
              <strong>iSSAC</strong> (VNU-IS Ambassadors Club) là câu lạc bộ đại sứ sinh viên thuộc Trường Đại học Công nghệ Thông tin — Đại học Quốc gia TP.HCM.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: <Users className="w-8 h-8 text-blue-600" />,
                title: 'Kết nối & Cộng đồng',
                description: 'Xây dựng mạng lưới bạn bè, mentor và cơ hội nghề nghiệp trong và ngoài trường.',
                bg: 'bg-blue-50',
              },
              {
                icon: <Star className="w-8 h-8 text-amber-500" />,
                title: 'Phát triển Bản thân',
                description: 'Rèn luyện kỹ năng mềm, lãnh đạo và chuyên môn qua các dự án thực tế.',
                bg: 'bg-amber-50',
              },
              {
                icon: <Award className="w-8 h-8 text-emerald-600" />,
                title: 'Đại sứ Sinh viên',
                description: 'Đại diện cho tiếng nói sinh viên, cầu nối giữa sinh viên và nhà trường.',
                bg: 'bg-emerald-50',
              },
            ].map((item, i) => (
              <div key={i} className={`${item.bg} rounded-2xl p-8 border border-blue-50 hover:shadow-lg transition-shadow group`}>
                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 transition-transform">
                  {item.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{item.title}</h3>
                <p className="text-gray-600 leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* DEPARTMENTS */}
      <section id="departments" className="py-24" style={{background: 'linear-gradient(180deg, #f0f5ff 0%, #ffffff 100%)'}}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-full px-4 py-1.5 text-blue-600 text-sm font-medium mb-4">
              Ban hoạt động
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-blue-900 mb-4">
              Chọn ban phù hợp với bạn
            </h2>
            <p className="text-gray-600 max-w-xl mx-auto">
              iSSAC có 3 ban chuyên biệt, mỗi ban đem lại trải nghiệm và kỹ năng khác nhau.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: <Megaphone className="w-10 h-10" />,
                title: 'Ban Truyền thông',
                slug: 'truyen-thong',
                color: 'from-blue-500 to-blue-700',
                textColor: 'text-blue-700',
                bgColor: 'bg-blue-50',
                borderColor: 'border-blue-200',
                description: 'Sáng tạo nội dung, thiết kế, chụp ảnh và quản lý mạng xã hội của CLB.',
                skills: ['Content creation', 'Graphic Design', 'Social Media', 'Photography'],
              },
              {
                icon: <MessageSquare className="w-10 h-10" />,
                title: 'Ban Tư vấn',
                slug: 'tu-van',
                color: 'from-emerald-500 to-emerald-700',
                textColor: 'text-emerald-700',
                bgColor: 'bg-emerald-50',
                borderColor: 'border-emerald-200',
                description: 'Tư vấn hướng nghiệp, học bổng và định hướng phát triển cho sinh viên.',
                skills: ['Career Counseling', 'Communication', 'Mentoring', 'Event Planning'],
              },
              {
                icon: <Users className="w-10 h-10" />,
                title: 'Ban Nhân sự',
                slug: 'nhan-su',
                color: 'from-purple-500 to-purple-700',
                textColor: 'text-purple-700',
                bgColor: 'bg-purple-50',
                borderColor: 'border-purple-200',
                description: 'Quản lý nhân sự, tổ chức hoạt động nội bộ và vận hành CLB.',
                skills: ['HR Management', 'Event Organizing', 'Team Building', 'Leadership'],
              },
            ].map((dept, i) => (
              <div key={i} className={`${dept.bgColor} border ${dept.borderColor} rounded-2xl overflow-hidden hover:shadow-xl transition-all group`}>
                <div className={`bg-gradient-to-br ${dept.color} p-8 text-white`}>
                  <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    {dept.icon}
                  </div>
                  <h3 className="text-xl font-bold">{dept.title}</h3>
                </div>
                <div className="p-6">
                  <p className="text-gray-600 mb-4 leading-relaxed">{dept.description}</p>
                  <div className="flex flex-wrap gap-2">
                    {dept.skills.map((skill, j) => (
                      <span key={j} className={`text-xs px-3 py-1 rounded-full bg-white border ${dept.borderColor} ${dept.textColor} font-medium`}>
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* EVENTS */}
      <section id="events" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-full px-4 py-1.5 text-amber-700 text-sm font-medium mb-4">
              Sự kiện nổi bật
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-blue-900 mb-4">
              Hoạt động của iSSAC
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                title: 'iSSAC Orientation Day',
                category: 'Định hướng',
                date: 'Tháng 9, 2026',
                desc: 'Ngày hội giới thiệu về CLB và các cơ hội tham gia dành cho tân sinh viên.',
                color: 'bg-blue-600',
              },
              {
                title: 'Career Talk Series',
                category: 'Hướng nghiệp',
                date: 'Tháng 10, 2026',
                desc: 'Chuỗi buổi nói chuyện với các chuyên gia và alumni về định hướng nghề nghiệp.',
                color: 'bg-emerald-600',
              },
              {
                title: 'iSSAC Club Anniversary',
                category: 'Sự kiện lớn',
                date: 'Tháng 11, 2026',
                desc: 'Lễ kỷ niệm thành lập CLB với các hoạt động văn nghệ, chia sẻ và networking.',
                color: 'bg-amber-500',
              },
            ].map((event, i) => (
              <div key={i} className="bg-white border border-blue-50 rounded-2xl overflow-hidden hover:shadow-lg transition-shadow group">
                <div className={`${event.color} h-3`} />
                <div className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{event.category}</span>
                    <span className="text-xs text-blue-600 font-medium">{event.date}</span>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-blue-700 transition-colors">{event.title}</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">{event.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24" style={{background: 'linear-gradient(135deg, #0f1b4c 0%, #1e3a8a 100%)'}}>
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="flex justify-center mb-6">
            <Image src="/issac-logo.png" alt="iSSAC" width={80} height={80} className="rounded-full border-4 border-white/20" />
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-white mb-4">
            Sẵn sàng gia nhập iSSAC?
          </h2>
          <p className="text-blue-200 text-lg mb-10 max-w-xl mx-auto">
            Đăng ký ngay hôm nay để bắt đầu hành trình phát triển bản thân cùng cộng đồng iSSAC.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register">
              <Button size="xl" variant="gold" className="font-bold">
                Đăng ký ngay
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/login">
              <Button size="xl" variant="outline" className="border-white/30 text-white hover:bg-white/10 hover:text-white">
                Đã có tài khoản
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-gray-900 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <Image src="/issac-logo.png" alt="iSSAC" width={36} height={36} className="rounded-full" />
              <div>
                <div className="font-bold text-white">iSSAC</div>
                <div className="text-gray-400 text-xs">VNU-IS Ambassadors Club</div>
              </div>
            </div>
            <div className="flex gap-6 text-sm text-gray-400">
              <Link href="/about" className="hover:text-white transition-colors">Về iSSAC</Link>
              <Link href="/contact" className="hover:text-white transition-colors">Liên hệ</Link>
              <Link href="/login" className="hover:text-white transition-colors">Đăng nhập</Link>
              <Link href="/register" className="hover:text-white transition-colors">Đăng ký</Link>
            </div>
            <div className="text-gray-500 text-xs">
              © 2026 iSSAC — Bridge to Success
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
