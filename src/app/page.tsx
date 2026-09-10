import Image from "next/image"
import Link from "next/link"
import {
  Megaphone,
  MessageSquare,
  Users,
  FileText,
  Monitor,
  Star,
  User,
  ClipboardCheck,
  Trophy,
  Lightbulb,
  Send,
  Calendar,
  ChevronDown,
  ChevronRight,
  MapPin,
  Mail,
  Phone,

} from "lucide-react"

export const metadata = {
  title: "iSSAC 2026 - Tuyển Thành Viên Đại Sứ Sinh Viên Trường Quốc Tế VNU-IS",
  description:
    "Trở thành thành viên iSSAC 2026. Kết nối, lan tỏa, phát triển và tạo dấu ấn cùng cộng đồng sinh viên Trường Quốc tế - Đại học Quốc gia Hà Nội.",
}

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#fcfbf9] text-slate-900 font-sans selection:bg-[#fdc455]/30">
      {/* 1. TOP NAVBAR */}
      <header className="bg-[#0d4499] text-white sticky top-0 z-50 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2 sm:gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 shrink-0">
            <Image
              src="/issac-logo-2026.png"
              alt="iSSAC - VNU-IS Ambassadors Club"
              width={200}
              height={50}
              className="h-8 sm:h-11 w-auto object-contain max-w-[110px] sm:max-w-[180px] lg:max-w-none"
              priority
            />
          </Link>

          {/* Center Navigation Links */}
          <nav className="hidden lg:flex items-center gap-6 text-xs sm:text-sm font-medium text-white/90">
            <Link href="/member/about" className="hover:text-[#fdc455] transition-colors">
              Về iSSAC
            </Link>
            <div className="relative group flex items-center gap-1 cursor-pointer hover:text-[#fdc455] transition-colors">
              <Link href="#departments">Ban tuyển thành viên</Link>
              <ChevronDown className="w-3.5 h-3.5 opacity-80 group-hover:rotate-180 transition-transform" />
            </div>
            <div className="relative group flex items-center gap-1 cursor-pointer hover:text-[#fdc455] transition-colors">
              <Link href="#journey">Lộ trình</Link>
              <ChevronDown className="w-3.5 h-3.5 opacity-80 group-hover:rotate-180 transition-transform" />
            </div>
            <div className="relative group flex items-center gap-1 cursor-pointer hover:text-[#fdc455] transition-colors">
              <Link href="#departments">Các ban</Link>
              <ChevronDown className="w-3.5 h-3.5 opacity-80 group-hover:rotate-180 transition-transform" />
            </div>
            <Link href="#criteria" className="hover:text-[#fdc455] transition-colors">
              FAQ
            </Link>
            <Link href="#contact" className="hover:text-[#fdc455] transition-colors">
              Liên hệ
            </Link>
          </nav>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-full border border-white/40 hover:border-white text-white text-xs sm:text-sm font-semibold transition-all hover:bg-white/10"
            >
              <User className="w-3.5 h-3.5" />
              <span className="hidden xs:inline sm:inline">Đăng nhập</span>
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-full bg-[#fdc455] hover:bg-[#f59e0b] text-slate-950 text-xs sm:text-sm font-bold shadow-sm transition-all hover:scale-105 active:scale-95"
            >
              <Send className="w-3.5 h-3.5 rotate-[-20deg]" />
              <span className="whitespace-nowrap">Ứng tuyển</span>
            </Link>
          </div>
        </div>
      </header>

      {/* 2. HERO SECTION */}
      <section className="relative bg-gradient-to-b from-[#0d4499] to-[#0a3579] text-white pt-8 pb-16 lg:pt-14 lg:pb-24 overflow-hidden">
        {/* Glow & Sparkles background effects */}
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-[#fdc455]/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 rounded-full bg-blue-400/15 blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center relative z-10">
          {/* Left Hero Content */}
          <div className="lg:col-span-6 space-y-6">
            {/* Pill Tag */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#fdc455] text-slate-950 text-xs font-black uppercase tracking-wider shadow-sm">
              <Megaphone className="w-3.5 h-3.5 fill-current" />
              <span>Tuyển thành viên 2026</span>
            </div>

            {/* Headline */}
            <div className="relative space-y-1">
              <h1 className="text-[2rem] sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.08] uppercase">
                Trở thành
                <span className="block">thành viên</span>
                <span className="block text-[#fdc455] mt-1 relative">
                  iSSAC 2026
                  <span className="absolute -right-6 top-1 text-[#fdc455] text-xl font-bold hidden sm:inline-block rotate-12">
                    ✦
                  </span>
                  <span className="absolute -right-10 top-4 text-[#fdc455] text-sm font-bold hidden sm:inline-block -rotate-12">
                    ★
                  </span>
                </span>
              </h1>
            </div>

            {/* Subtitle */}
            <p className="text-sm sm:text-base text-blue-100 font-normal leading-relaxed max-w-lg">
              Kết nối - Lan tỏa - Phát triển - Tạo dấu ấn cùng cộng đồng sinh viên VNU-IS.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-wrap items-center gap-3.5 pt-2">
              <Link
                href="/register"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full bg-[#fdc455] hover:bg-[#f59e0b] text-slate-950 font-bold text-xs sm:text-sm shadow-lg transition-all hover:scale-105 active:scale-95 uppercase tracking-wide"
              >
                <Send className="w-4 h-4 rotate-[-20deg]" />
                <span>Ứng tuyển ngay</span>
              </Link>
              <Link
                href="/member/about"
                className="inline-flex items-center gap-1.5 px-6 py-3.5 rounded-full border border-white/40 hover:border-white text-white font-semibold text-xs sm:text-sm transition-all hover:bg-white/10"
              >
                <span>Tìm hiểu thêm</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Right Hero Image Frame */}
          <div className="lg:col-span-6 relative">
            <div className="relative mx-auto max-w-md lg:max-w-none">
              {/* Photo Card with White Border */}
              <div className="relative rounded-3xl p-2.5 bg-white shadow-2xl overflow-hidden border-2 border-white/80">
                <div className="relative w-full aspect-[1024/680] rounded-2xl overflow-hidden">
                  <Image
                    src="/issac-hero-team-2026.jpg"
                    alt="Tập thể gia đình iSSAC VNU-IS"
                    fill
                    className="object-cover object-center"
                    priority
                  />
                </div>

                {/* Badge Sticker Top Right */}
                <div className="absolute top-5 right-5 z-20 rotate-[8deg] hover:rotate-0 transition-transform">
                  <div className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-full bg-[#fdc455] text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg border border-amber-300">
                    <Star className="w-3 h-3 fill-slate-950" />
                    <span>Join Our Team</span>
                    <Star className="w-3 h-3 fill-slate-950" />
                  </div>
                </div>

                {/* Handwritten Script Bottom Right */}
                <div className="absolute bottom-5 right-6 z-20 pointer-events-none select-none">
                  <span className="font-caveat text-3xl sm:text-4xl text-white font-bold drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] rotate-[-6deg] block">
                    iSSAC Family ♡
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. KEY STATS SECTION (DẢI 4 CHỈ SỐ) */}
      <section className="bg-[#f8fafc] border-b border-slate-200/80 py-10 sm:py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {/* Stat 1 */}
            <div className="bg-white rounded-2xl p-6 shadow-xs border border-slate-200/70 flex flex-col items-start gap-3">
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-[#1657c1] flex items-center justify-center">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <div className="text-3xl sm:text-4xl font-black text-[#1657c1] tracking-tight">03</div>
                <div className="text-xs sm:text-sm text-slate-600 font-medium mt-0.5">
                  Ban tuyển thành viên
                </div>
              </div>
            </div>

            {/* Stat 2 */}
            <div className="bg-white rounded-2xl p-6 shadow-xs border border-slate-200/70 flex flex-col items-start gap-3">
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-[#1657c1] flex items-center justify-center">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <div className="text-3xl sm:text-4xl font-black text-[#1657c1] tracking-tight">02</div>
                <div className="text-xs sm:text-sm text-slate-600 font-medium mt-0.5">
                  Vòng tuyển chọn
                </div>
              </div>
            </div>

            {/* Stat 3 */}
            <div className="bg-white rounded-2xl p-6 shadow-xs border border-slate-200/70 flex flex-col items-start gap-3">
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-[#1657c1] flex items-center justify-center">
                <Monitor className="w-6 h-6" />
              </div>
              <div>
                <div className="text-3xl sm:text-4xl font-black text-[#1657c1] tracking-tight">100%</div>
                <div className="text-xs sm:text-sm text-slate-600 font-medium mt-0.5">
                  Online/Offline linh hoạt
                </div>
              </div>
            </div>

            {/* Stat 4 */}
            <div className="bg-white rounded-2xl p-6 shadow-xs border border-slate-200/70 flex flex-col items-start gap-3">
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-[#1657c1] flex items-center justify-center">
                <Star className="w-6 h-6 fill-[#1657c1]" />
              </div>
              <div>
                <div className="text-3xl sm:text-4xl font-black text-[#1657c1] tracking-tight">3 Năm</div>
                <div className="text-xs sm:text-sm text-slate-600 font-medium mt-0.5">
                  Bản lĩnh & Tự hào
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. SECTION: BẠN SẼ TRỞ THÀNH AI TẠI iSSAC? */}
      <section id="departments" className="py-14 sm:py-20 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Title */}
        <div className="space-y-2">
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight uppercase">
            Bạn sẽ trở thành ai tại iSSAC?
          </h2>
          <div className="w-12 h-1 bg-[#fdc455] rounded-full" />
        </div>

        {/* 3 Department Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8 items-stretch">
          {/* Card 1: Truyền thông */}
          <div className="relative bg-white rounded-2xl p-7 border-2 border-slate-200/80 shadow-xs hover:shadow-md hover:border-[#1657c1]/50 transition-all flex flex-col justify-between overflow-hidden h-full">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-full bg-[#1657c1] text-white flex items-center justify-center shadow-xs">
                  <Megaphone className="w-5 h-5" />
                </div>
                <span className="text-3xl sm:text-4xl font-black text-slate-200 select-none pointer-events-none">
                  01
                </span>
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-slate-900">Ban Truyền thông</h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed text-justify">
                  Chịu trách nhiệm toàn diện về diện mạo thương hiệu số của iSSAC và Trường Quốc tế; xây dựng kế hoạch nội dung sáng tạo (Content Planning), thiết kế bộ nhận diện & ấn phẩm đồ họa chuyên nghiệp, sản xuất video ngắn dẫn đầu xu hướng (TikTok, Reels, Recap), và tác nghiệp nhiếp ảnh trực tiếp tại các sự kiện lớn.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-5 mt-5 border-t border-slate-100">
              <span className="px-2.5 py-1 rounded-md bg-blue-50 text-[#1657c1] text-xs font-semibold">
                #Sáng tạo nội dung
              </span>
              <span className="px-2.5 py-1 rounded-md bg-blue-50 text-[#1657c1] text-xs font-semibold">
                #Thiết kế đồ họa
              </span>
              <span className="px-2.5 py-1 rounded-md bg-blue-50 text-[#1657c1] text-xs font-semibold">
                #Video ngắn xu hướng
              </span>
              <span className="px-2.5 py-1 rounded-md bg-blue-50 text-[#1657c1] text-xs font-semibold">
                #Nhiếp ảnh sự kiện
              </span>
            </div>
          </div>

          {/* Card 2: Tư vấn */}
          <div className="relative bg-white rounded-2xl p-7 border-2 border-slate-200/80 shadow-xs hover:shadow-md hover:border-[#1657c1]/50 transition-all flex flex-col justify-between overflow-hidden h-full">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-full bg-[#1657c1] text-white flex items-center justify-center shadow-xs">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <span className="text-3xl sm:text-4xl font-black text-slate-200 select-none pointer-events-none">
                  02
                </span>
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-slate-900">Ban Tư vấn</h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed text-justify">
                  Học kiến thức tổ chức sự kiện, trực tiếp làm Ban Tổ chức (BTC) chạy các đại sự kiện lớn tại VNU-IS như: <strong>ISTART CAMP</strong>, <strong>JOBLINK WEEK</strong>, <strong>ENROLLMENT DAY</strong>,... đồng thời trực tiếp tham gia chuyến đi tư vấn tuyển sinh dài vài ngày tại các tỉnh, thành phố trực thuộc Trung ương như <strong>TP. Hà Nội, TP. Hải Phòng, Quảng Ninh</strong>,...
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-5 mt-5 border-t border-slate-100">
              <span className="px-2.5 py-1 rounded-md bg-blue-50 text-[#1657c1] text-xs font-semibold">
                #Tổ chức sự kiện
              </span>
              <span className="px-2.5 py-1 rounded-md bg-blue-50 text-[#1657c1] text-xs font-semibold">
                #ISTART CAMP
              </span>
              <span className="px-2.5 py-1 rounded-md bg-blue-50 text-[#1657c1] text-xs font-semibold">
                #JOBLINK WEEK
              </span>
              <span className="px-2.5 py-1 rounded-md bg-blue-50 text-[#1657c1] text-xs font-semibold">
                #Tư vấn tuyển sinh tỉnh thành
              </span>
            </div>
          </div>

          {/* Card 3: Nhân sự */}
          <div className="relative bg-white rounded-2xl p-7 border-2 border-slate-200/80 shadow-xs hover:shadow-md hover:border-[#1657c1]/50 transition-all flex flex-col justify-between overflow-hidden h-full">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-full bg-[#1657c1] text-white flex items-center justify-center shadow-xs">
                  <Users className="w-5 h-5" />
                </div>
                <span className="text-3xl sm:text-4xl font-black text-slate-200 select-none pointer-events-none">
                  03
                </span>
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-slate-900">Ban Nhân sự</h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed text-justify">
                  Giữ vai trò là bộ máy vận hành và sợi dây gắn kết của tổ chức; chịu trách nhiệm tuyển quân thường niên, quản trị nhân sự, theo dõi tiến độ & đánh giá KPI, bảo đảm công tác hậu cần - dự trù ngân sách, cùng sứ mệnh kiến tạo văn hóa gia đình iSSAC qua các chương trình Team Building, Trại dã ngoại và Gala tổng kết.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-5 mt-5 border-t border-slate-100">
              <span className="px-2.5 py-1 rounded-md bg-blue-50 text-[#1657c1] text-xs font-semibold">
                #Quản trị nhân lực
              </span>
              <span className="px-2.5 py-1 rounded-md bg-blue-50 text-[#1657c1] text-xs font-semibold">
                #Tuyển quân & KPI
              </span>
              <span className="px-2.5 py-1 rounded-md bg-blue-50 text-[#1657c1] text-xs font-semibold">
                #Hậu cần & Ngân sách
              </span>
              <span className="px-2.5 py-1 rounded-md bg-blue-50 text-[#1657c1] text-xs font-semibold">
                #Gala & Team Building
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 5. SECTION: HÀNH TRÌNH GIA NHẬP iSSAC */}
      <section id="journey" className="py-14 sm:py-20 bg-slate-50 border-y border-slate-200/80">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          {/* Title */}
          <div className="space-y-2">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight uppercase">
              Hành trình gia nhập iSSAC
            </h2>
            <div className="w-12 h-1 bg-[#fdc455] rounded-full" />
          </div>

          {/* 5 Steps Horizontal Timeline */}
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-6 md:gap-3 items-start text-center relative">
            {/* Step 1 */}
            <div className="flex flex-col items-center space-y-2 relative">
              <div className="w-14 h-14 rounded-full bg-[#1657c1] text-white flex flex-col items-center justify-center shadow-md">
                <User className="w-4 h-4" />
                <span className="text-xs font-bold mt-0.5">01</span>
              </div>
              <h4 className="text-sm font-bold text-slate-900">Đăng ký hồ sơ</h4>
              <p className="text-xs text-slate-500 max-w-[170px] leading-relaxed">
                Tạo tài khoản và điền thông tin cá nhân
              </p>
              {/* Arrow */}
              <div className="hidden sm:block absolute -right-4 top-4 text-[#1657c1]">
                <ChevronRight className="w-5 h-5" />
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex flex-col items-center space-y-2 relative">
              <div className="w-14 h-14 rounded-full bg-[#1657c1] text-white flex flex-col items-center justify-center shadow-md">
                <FileText className="w-4 h-4" />
                <span className="text-xs font-bold mt-0.5">02</span>
              </div>
              <h4 className="text-sm font-bold text-slate-900">Vòng đơn</h4>
              <p className="text-xs text-slate-500 max-w-[170px] leading-relaxed">
                Trả lời bộ câu hỏi theo từng ban
              </p>
              {/* Arrow */}
              <div className="hidden sm:block absolute -right-4 top-4 text-[#1657c1]">
                <ChevronRight className="w-5 h-5" />
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex flex-col items-center space-y-2 relative">
              <div className="w-14 h-14 rounded-full bg-[#1657c1] text-white flex flex-col items-center justify-center shadow-md">
                <Users className="w-4 h-4" />
                <span className="text-xs font-bold mt-0.5">03</span>
              </div>
              <h4 className="text-sm font-bold text-slate-900">Phỏng vấn</h4>
              <p className="text-xs text-slate-500 max-w-[170px] leading-relaxed">
                Tham gia phỏng vấn trực tuyến hoặc trực tiếp
              </p>
              {/* Arrow */}
              <div className="hidden sm:block absolute -right-4 top-4 text-[#1657c1]">
                <ChevronRight className="w-5 h-5" />
              </div>
            </div>

            {/* Step 4 */}
            <div className="flex flex-col items-center space-y-2 relative">
              <div className="w-14 h-14 rounded-full bg-[#1657c1] text-white flex flex-col items-center justify-center shadow-md">
                <ClipboardCheck className="w-4 h-4" />
                <span className="text-xs font-bold mt-0.5">04</span>
              </div>
              <h4 className="text-sm font-bold text-slate-900">Đánh giá</h4>
              <p className="text-xs text-slate-500 max-w-[170px] leading-relaxed">
                Ban tuyển quân chấm điểm dựa trên tiêu chí
              </p>
              {/* Arrow */}
              <div className="hidden sm:block absolute -right-4 top-4 text-[#1657c1]">
                <ChevronRight className="w-5 h-5" />
              </div>
            </div>

            {/* Step 5 */}
            <div className="flex flex-col items-center space-y-2">
              <div className="w-14 h-14 rounded-full bg-[#1657c1] text-white flex flex-col items-center justify-center shadow-md">
                <Trophy className="w-4 h-4" />
                <span className="text-xs font-bold mt-0.5">05</span>
              </div>
              <h4 className="text-sm font-bold text-slate-900">Kết quả</h4>
              <p className="text-xs text-slate-500 max-w-[170px] leading-relaxed">
                Công bố kết quả và trở thành thành viên iSSAC
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. SECTION: TIÊU CHÍ CHÚNG TÔI TÌM KIẾM */}
      <section id="criteria" className="py-14 sm:py-20 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Title */}
        <div className="space-y-2">
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight uppercase">
            Tiêu chí chúng tôi tìm kiếm
          </h2>
          <div className="w-12 h-1 bg-[#fdc455] rounded-full" />
        </div>

        {/* 4 Criteria Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card 1 */}
          <div className="bg-white rounded-2xl p-6 border-2 border-slate-200/80 shadow-xs space-y-3">
            <div className="w-12 h-12 rounded-full bg-[#1657c1] text-white flex items-center justify-center">
              <Lightbulb className="w-5 h-5" />
            </div>
            <h4 className="text-base font-bold text-slate-900">Chủ động</h4>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Luôn sẵn sàng học hỏi, đề xuất và hành động.
            </p>
          </div>

          {/* Card 2 */}
          <div className="bg-white rounded-2xl p-6 border-2 border-slate-200/80 shadow-xs space-y-3">
            <div className="w-12 h-12 rounded-full bg-[#1657c1] text-white flex items-center justify-center">
              <Star className="w-5 h-5 fill-white" />
            </div>
            <h4 className="text-base font-bold text-slate-900">Sáng tạo</h4>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Dám nghĩ, dám làm, tạo ra giá trị khác biệt.
            </p>
          </div>

          {/* Card 3 */}
          <div className="bg-white rounded-2xl p-6 border-2 border-slate-200/80 shadow-xs space-y-3">
            <div className="w-12 h-12 rounded-full bg-[#1657c1] text-white flex items-center justify-center">
              <MessageSquare className="w-5 h-5" />
            </div>
            <h4 className="text-base font-bold text-slate-900">Giao tiếp</h4>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Kết nối tốt, lắng nghe và lan tỏa năng lượng tích cực.
            </p>
          </div>

          {/* Card 4 */}
          <div className="bg-white rounded-2xl p-6 border-2 border-slate-200/80 shadow-xs space-y-3">
            <div className="w-12 h-12 rounded-full bg-[#1657c1] text-white flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <h4 className="text-base font-bold text-slate-900">Tinh thần đồng đội</h4>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Cùng nhau phát triển, vì một iSSAC vững mạnh.
            </p>
          </div>
        </div>
      </section>

      {/* 7. CTA BANNER: SẴN SÀNG TẠO DẤU ẤN? */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 mb-12">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#0d3b82] via-[#10489c] to-[#1657c1] p-8 sm:p-12 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-8 border-2 border-blue-400/20">
          {/* Subtle Background Pattern */}
          <div className="absolute -right-20 -top-20 w-80 h-80 rounded-full bg-[#fdc455]/15 blur-3xl pointer-events-none" />

          {/* Left Script Decoration */}
          <div className="shrink-0 text-center md:text-left select-none pointer-events-none rotate-[-6deg]">
            <span className="font-caveat text-4xl sm:text-5xl text-[#fdc455] font-bold block leading-tight drop-shadow-md">
              iSSAC
            </span>
            <span className="font-caveat text-2xl sm:text-3xl text-[#fdc455]/90 block leading-tight">
              More Connection
            </span>
            <span className="font-caveat text-2xl sm:text-3xl text-[#fdc455]/90 block leading-tight">
              More Impact ♡
            </span>
          </div>

          {/* Right/Center Content */}
          <div className="space-y-4 text-center md:text-left max-w-xl">
            <h3 className="text-2xl sm:text-4xl font-black tracking-tight text-white uppercase">
              Sẵn sàng tạo dấu ấn?
            </h3>
            <p className="text-xs sm:text-sm text-blue-100 leading-relaxed">
              Gia nhập iSSAC ngay hôm nay để cùng chúng mình kiến tạo những giá trị bền vững!
            </p>

            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 pt-2">
              <Link
                href="/register"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#fdc455] hover:bg-[#f59e0b] text-slate-950 font-bold text-xs sm:text-sm shadow-md transition-all hover:scale-105 active:scale-95 uppercase tracking-wide"
              >
                <Send className="w-3.5 h-3.5 rotate-[-20deg]" />
                <span>Bắt đầu ứng tuyển</span>
              </Link>
              <div className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-white/10 border border-white/20 text-white font-medium text-xs sm:text-sm backdrop-blur-xs">
                <Calendar className="w-4 h-4 text-blue-200" />
                <span>Mở đơn đến 30/09/2026</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 8. FOOTER */}
      <footer id="contact" className="bg-[#06152d] text-white pt-12 pb-8 border-t border-blue-950">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          {/* Main Footer Info */}
          <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-8 pb-8 border-b border-white/10">
            {/* Logo */}
            <div className="shrink-0">
              <Image
                src="/issac-logo-2026.png"
                alt="iSSAC VNU-IS Logo"
                width={200}
                height={55}
                className="h-11 sm:h-12 w-auto object-contain"
              />
            </div>

            {/* Social Links */}
            <div className="space-y-3 text-center md:text-left">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Kết nối với chúng tôi
              </div>
              <div className="flex items-center justify-center md:justify-start gap-2.5">
                <a
                  href="https://www.facebook.com/ambassadorsClub.VNUIS"
                  target="_blank"
                  rel="noreferrer"
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-[#1877f2] flex items-center justify-center text-white transition-colors"
                  aria-label="Facebook"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                </a>
                <a
                  href="https://www.instagram.com/issac.club/"
                  target="_blank"
                  rel="noreferrer"
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-pink-600 flex items-center justify-center text-white transition-colors"
                  aria-label="Instagram"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                </a>
                <a
                  href="https://youtube.com/@issac_club"
                  target="_blank"
                  rel="noreferrer"
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-red-600 flex items-center justify-center text-white transition-colors"
                  aria-label="YouTube"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
                </a>
                <a
                  href="https://www.tiktok.com/@issac.club"
                  target="_blank"
                  rel="noreferrer"
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-slate-800 flex items-center justify-center text-white transition-colors"
                  aria-label="TikTok"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.97-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.24 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/></svg>
                </a>
              </div>
            </div>

            {/* Contact Details */}
            <div className="space-y-2 text-xs text-slate-300 text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-2">
                <MapPin className="w-3.5 h-3.5 text-[#fdc455] shrink-0" />
                <span>Tòa E5, Trường Quốc tế, ĐHQGHN, số 144 Xuân Thủy, Cầu Giấy, Hà Nội</span>
              </div>
              <div className="flex items-center justify-center md:justify-start gap-2">
                <Mail className="w-3.5 h-3.5 text-[#fdc455] shrink-0" />
                <a href="mailto:ambassadors.club@vnuis.edu.vn" className="hover:text-white transition-colors">
                  ambassadors.club@vnuis.edu.vn
                </a>
              </div>
              <div className="flex items-center justify-center md:justify-start gap-2">
                <Phone className="w-3.5 h-3.5 text-[#fdc455] shrink-0" />
                <a href="tel:0374140705" className="hover:text-white transition-colors">
                  0374140705 (PCN - Mr.Hiệp)
                </a>
              </div>
            </div>

            {/* Handwritten script slogan */}
            <div className="shrink-0 text-center md:text-right select-none pointer-events-none rotate-[-4deg]">
              <span className="font-caveat text-3xl text-white font-bold block leading-tight drop-shadow-sm">
                Together
              </span>
              <span className="font-caveat text-3xl text-[#fdc455] font-bold block leading-tight drop-shadow-sm">
                We Grow ♡
              </span>
            </div>
          </div>

          {/* Bottom Copyright & Terms */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400 pt-2">
            <div>© 2026 iSSAC. All rights reserved.</div>
            <div className="flex items-center gap-3">
              <Link href="#" className="hover:text-white transition-colors">
                Chính sách bảo mật
              </Link>
              <span>|</span>
              <Link href="#" className="hover:text-white transition-colors">
                Điều khoản sử dụng
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
