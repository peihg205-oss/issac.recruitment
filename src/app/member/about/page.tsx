import Link from "next/link"

export const metadata = {
  title: "Giới thiệu CLB & Các ban chuyên môn - iSSAC 2026",
  description: "Thông tin đầy đủ về Câu lạc bộ Đại sứ Sinh viên Trường Quốc tế - ĐHQGHN, chức năng nhiệm vụ các ban và quyền lợi thành viên.",
}

export default function MemberAboutPage() {
  return (
    <div className="space-y-8 max-w-4xl mx-auto animate-fade-in pb-16 font-sans">
      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 tracking-tight">
            GIỚI THIỆU CLB & CÁC BAN CHUYÊN MÔN
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            Thông tin toàn diện về sứ mệnh, chức năng từng ban và quyền lợi Đại sứ Sinh viên iSSAC
          </p>
        </div>
        <Link
          href="/member/application"
          className="self-start sm:self-auto px-5 py-2.5 rounded-xl bg-[#fdc455] hover:bg-[#f59e0b] text-slate-950 font-black text-xs shadow-sm transition-all"
        >
          Đến trang Ứng tuyển
        </Link>
      </div>

      {/* 2. Banner Giới thiệu CLB */}
      <div className="bg-gradient-to-br from-[#0d3b82] via-[#1657c1] to-[#0a2550] rounded-3xl p-7 sm:p-9 text-white space-y-4 shadow-md relative overflow-hidden">
        <div className="space-y-2 relative z-10 max-w-2xl">
          <span className="inline-block px-3 py-1 rounded-md text-[11px] font-black uppercase tracking-wider bg-white/15 text-amber-300 border border-white/20">
            VNU-IS Ambassadors Club • Thành lập từ 2016
          </span>
          <h2 className="text-xl sm:text-3xl font-black tracking-tight text-white leading-snug">
            CÂU LẠC BỘ ĐẠI SỨ SINH VIÊN (iSSAC)
          </h2>
          <p className="text-xs sm:text-sm text-blue-100 leading-relaxed font-normal">
            iSSAC là tổ chức sinh viên nòng cốt trực thuộc Trường Quốc tế - Đại học Quốc gia Hà Nội (VNU-IS). CLB quy tụ những sinh viên ưu tú, bản lĩnh, đóng vai trò là gương mặt đại diện, cầu nối thông tin tin cậy và nguồn cảm hứng tích cực cho cộng đồng sinh viên trong và ngoài trường.
          </p>
        </div>

        {/* 3 Trụ cột giá trị cốt lõi */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 relative z-10">
          <div className="p-4 rounded-2xl bg-white/10 border border-white/15 backdrop-blur-xs space-y-1">
            <div className="text-xs font-black text-amber-300 uppercase tracking-wide">Bản lĩnh</div>
            <div className="text-xs text-blue-100 leading-relaxed">Tự tin đại diện hình ảnh sinh viên VNU-IS tại các diễn đàn học thuật và sự kiện lớn.</div>
          </div>
          <div className="p-4 rounded-2xl bg-white/10 border border-white/15 backdrop-blur-xs space-y-1">
            <div className="text-xs font-black text-amber-300 uppercase tracking-wide">Tận tâm</div>
            <div className="text-xs text-blue-100 leading-relaxed">Luôn sẵn sàng đồng hành, giải đáp và hỗ trợ sinh viên trong hành trình đại học.</div>
          </div>
          <div className="p-4 rounded-2xl bg-white/10 border border-white/15 backdrop-blur-xs space-y-1">
            <div className="text-xs font-black text-amber-300 uppercase tracking-wide">Tiên phong</div>
            <div className="text-xs text-blue-100 leading-relaxed">Sáng tạo không ngừng trong các chiến dịch truyền thông và mô hình hoạt động.</div>
          </div>
        </div>
      </div>

      {/* 3. Chức năng & Nhiệm vụ chi tiết từng Ban */}
      <div className="space-y-6">
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Cơ cấu & Chức năng các Ban chuyên môn
          </h2>
          <p className="text-xs text-slate-500">
            Tìm hiểu chi tiết công việc cụ thể của từng ban để đưa ra lựa chọn nguyện vọng chính xác nhất
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6">
          {/* Ban 1: Ban Truyền thông */}
          <div className="bg-white border-2 border-slate-200/90 rounded-3xl p-6 sm:p-7 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
              <div>
                <span className="text-[11px] font-black uppercase tracking-wider text-[#1657c1] bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded">
                  Khối Sáng tạo & Media
                </span>
                <h3 className="text-xl font-black text-slate-900 mt-1">
                  Ban Truyền thông
                </h3>
              </div>
              <span className="self-start sm:self-auto text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-full">
                Mã ban: COM
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs sm:text-sm">
              <div className="space-y-2">
                <div className="font-bold text-slate-800 uppercase tracking-wide text-xs">
                  Chức năng chính
                </div>
                <p className="text-slate-600 leading-relaxed">
                  Chịu trách nhiệm toàn diện về bộ mặt hình ảnh, tiếng nói và thông điệp của iSSAC trên tất cả các kênh thông tin truyền thông số (Facebook Fanpage, TikTok, Instagram, YouTube).
                </p>
              </div>

              <div className="space-y-2">
                <div className="font-bold text-slate-800 uppercase tracking-wide text-xs">
                  Nhiệm vụ cụ thể
                </div>
                <ul className="space-y-1.5 text-slate-600 list-disc list-inside leading-relaxed">
                  <li>Lên kế hoạch nội dung, viết bài (Copywriting) cho các chiến dịch tuyển quân, sự kiện.</li>
                  <li>Thiết kế ấn phẩm truyền thông đồ họa (Canva, Photoshop, Illustrator).</li>
                  <li>Quay dựng video ngắn (TikTok, Reels, Recap sự kiện bằng CapCut/Premiere).</li>
                  <li>Chụp ảnh tư liệu, trực tiếp tác nghiệp tại các sự kiện của CLB và Nhà trường.</li>
                </ul>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs text-slate-700">
              <strong>Phù hợp với bạn nếu:</strong> Bạn yêu thích sáng tạo, có gu thẩm mỹ tốt, đam mê chụp ảnh, làm video, viết lách hoặc muốn rèn luyện kỹ năng truyền thông đa phương tiện thực chiến.
            </div>
          </div>

          {/* Ban 2: Ban Tư vấn */}
          <div className="bg-white border-2 border-slate-200/90 rounded-3xl p-6 sm:p-7 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
              <div>
                <span className="text-[11px] font-black uppercase tracking-wider text-[#1657c1] bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded">
                  Khối Học thuật & Định hướng
                </span>
                <h3 className="text-xl font-black text-slate-900 mt-1">
                  Ban Tư vấn
                </h3>
              </div>
              <span className="self-start sm:self-auto text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-full">
                Mã ban: ADV
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs sm:text-sm">
              <div className="space-y-2">
                <div className="font-bold text-slate-800 uppercase tracking-wide text-xs">
                  Chức năng chính
                </div>
                <p className="text-slate-600 leading-relaxed">
                  Đóng vai trò là điểm tựa tri thức và kinh nghiệm, chuyên trách tư vấn hướng nghiệp, giải đáp thông tin học bổng, hỗ trợ học tập và đồng hành cùng tân sinh viên hòa nhập môi trường quốc tế.
                </p>
              </div>

              <div className="space-y-2">
                <div className="font-bold text-slate-800 uppercase tracking-wide text-xs">
                  Nhiệm vụ cụ thể
                </div>
                <ul className="space-y-1.5 text-slate-600 list-disc list-inside leading-relaxed">
                  <li>Tư vấn tuyển sinh, giải đáp thắc mắc ngành học và cơ hội nghề nghiệp cho tân sinh viên.</li>
                  <li>Tổng hợp và phổ biến thông tin học bổng trong và ngoài nước, cơ hội trao đổi sinh viên.</li>
                  <li>Tổ chức các buổi tọa đàm (Workshop), chia sẻ phương pháp học đại học hiệu quả.</li>
                  <li>Xây dựng cẩm nang sinh viên, tài liệu hỗ trợ kỹ năng mềm và ngoại ngữ.</li>
                </ul>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs text-slate-700">
              <strong>Phù hợp với bạn nếu:</strong> Bạn có khả năng lắng nghe và giao tiếp tốt, yêu thích việc giúp đỡ người khác, có học lực khá/giỏi hoặc mong muốn tích lũy kiến thức sâu rộng về học thuật.
            </div>
          </div>

          {/* Ban 3: Ban Nhân sự */}
          <div className="bg-white border-2 border-slate-200/90 rounded-3xl p-6 sm:p-7 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
              <div>
                <span className="text-[11px] font-black uppercase tracking-wider text-[#1657c1] bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded">
                  Khối Quản trị & Vận hành
                </span>
                <h3 className="text-xl font-black text-slate-900 mt-1">
                  Ban Nhân sự
                </h3>
              </div>
              <span className="self-start sm:self-auto text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-full">
                Mã ban: HR
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs sm:text-sm">
              <div className="space-y-2">
                <div className="font-bold text-slate-800 uppercase tracking-wide text-xs">
                  Chức năng chính
                </div>
                <p className="text-slate-600 leading-relaxed">
                  Được xem là "trái tim" gắn kết của iSSAC, chịu trách nhiệm quản trị nhân sự nội bộ, duy trì văn hóa tổ chức, đào tạo thành viên và điều phối vận hành các sự kiện lớn.
                </p>
              </div>

              <div className="space-y-2">
                <div className="font-bold text-slate-800 uppercase tracking-wide text-xs">
                  Nhiệm vụ cụ thể
                </div>
                <ul className="space-y-1.5 text-slate-600 list-disc list-inside leading-relaxed">
                  <li>Tổ chức chiến dịch tuyển quân thường niên (lên form, điều phối phỏng vấn, onboarding).</li>
                  <li>Theo dõi tiến độ công việc, điểm danh, chấm điểm KPI và đánh giá thi đua thành viên.</li>
                  <li>Lên kế hoạch và tổ chức các buổi Team Building, sinh nhật thành viên, lễ gắn kết nội bộ.</li>
                  <li>Phụ trách hậu cần, dự trù ngân sách và điều phối nhân lực trong các sự kiện của CLB.</li>
                </ul>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs text-slate-700">
              <strong>Phù hợp với bạn nếu:</strong> Bạn là người cẩn thận, chu đáo, có tư duy tổ chức logic, nhiệt huyết, thích kết nối mọi người và mong muốn theo đuổi mảng quản trị nhân lực/sự kiện.
            </div>
          </div>
        </div>
      </div>

      {/* 4. Quyền lợi & Lợi ích khi trở thành Đại sứ iSSAC */}
      <div className="bg-white border-2 border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
        <div className="border-b border-slate-100 pb-3.5">
          <span className="text-[11px] font-black uppercase tracking-wider text-[#1657c1]">
            Đặc quyền thành viên
          </span>
          <h2 className="text-xl font-bold text-slate-900 mt-1">
            Quyền lợi & Lợi ích khi gia nhập iSSAC
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Những giá trị thiết thực bạn sẽ nhận được trong suốt nhiệm kỳ hoạt động
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-5 rounded-2xl bg-slate-50/70 border border-slate-200/80 space-y-2">
            <div className="font-black text-slate-900 text-sm text-[#1657c1]">
              1. Nâng tầm kỹ năng thực chiến
            </div>
            <p className="text-xs text-slate-600 leading-relaxed font-normal">
              Được đào tạo bài bản về kỹ năng lãnh đạo, thuyết trình trước đám đông, đàm phán, quản lý dự án và làm việc nhóm trong môi trường chuyên nghiệp.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-50/70 border border-slate-200/80 space-y-2">
            <div className="font-black text-slate-900 text-sm text-[#1657c1]">
              2. Mở rộng mạng lưới quan hệ (Networking)
            </div>
            <p className="text-xs text-slate-600 leading-relaxed font-normal">
              Cơ hội làm việc trực tiếp với Ban Giám hiệu, các thầy cô phụ trách khoa, các cựu sinh viên thành đạt và đại diện các doanh nghiệp, tổ chức đối tác lớn.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-50/70 border border-slate-200/80 space-y-2">
            <div className="font-black text-slate-900 text-sm text-[#1657c1]">
              3. Điểm rèn luyện, Chứng nhận & Thư giới thiệu
            </div>
            <p className="text-xs text-slate-600 leading-relaxed font-normal">
              Cộng điểm rèn luyện tối đa theo quy chế, nhận Chứng nhận Đại sứ Sinh viên từ Trường Quốc tế - ĐHQGHN và cơ hội nhận Thư giới thiệu (Recommendation Letter) để xin việc hoặc du học.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-50/70 border border-slate-200/80 space-y-2">
            <div className="font-black text-slate-900 text-sm text-[#1657c1]">
              4. Môi trường gắn kết như gia đình
            </div>
            <p className="text-xs text-slate-600 leading-relaxed font-normal">
              Trải nghiệm thanh xuân đại học rực rỡ bên những người bạn đồng hành cùng chí hướng qua các chuyến đi dã ngoại, sinh nhật và các dự án ý nghĩa.
            </p>
          </div>
        </div>
      </div>

      {/* 5. Khối Kêu gọi hành động (CTA) */}
      <div className="p-6 sm:p-8 rounded-3xl bg-blue-50/80 border-2 border-blue-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="text-base font-bold text-[#1657c1]">
            Bạn đã sẵn sàng để trở thành Đại sứ Sinh viên iSSAC Gen 10?
          </div>
          <p className="text-xs text-slate-600">
            Hãy bắt đầu đơn ứng tuyển và lựa chọn Ban chuyên môn phù hợp với bạn ngay hôm nay.
          </p>
        </div>
        <Link
          href="/member/application"
          className="px-8 py-3.5 rounded-xl bg-[#fdc455] hover:bg-[#f59e0b] text-slate-950 font-black text-sm shadow-md transition-all hover:scale-[1.02] active:scale-[0.98] shrink-0 text-center"
        >
          Nộp đơn ứng tuyển ngay
        </Link>
      </div>
    </div>
  )
}
