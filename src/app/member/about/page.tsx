import Link from "next/link"

export const metadata = {
  title: "Giới thiệu CLB & Quyền lợi Đại sứ Sinh viên - iSSAC 2026",
  description: "Thông tin chính thức về Câu lạc bộ Đại sứ Sinh viên Trường Quốc tế - ĐHQGHN: Quyền lợi chi trả kinh phí, Ban Tư vấn chủ trì tổ chức sự kiện lớn (ISTART CAMP, JOBLINK, ENROLLMENT DAY) và cơ cấu 3 ban chuyên môn.",
}

export default function MemberAboutPage() {
  return (
    <div className="space-y-10 max-w-5xl mx-auto animate-fade-in pb-20 font-sans">
      {/* 1. Thanh tiêu đề & Điều hướng nhanh */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-slate-200 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#1657c1]" />
            <span className="text-[11px] font-black uppercase tracking-wider text-[#1657c1]">
              Trường Quốc tế - Đại học Quốc gia Hà Nội
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight uppercase">
            Giới thiệu Câu lạc bộ & Các Ban Chuyên môn
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 font-medium">
            Hồ sơ giới thiệu toàn diện về sứ mệnh, chính sách kinh phí hoạt động và cơ cấu tổ chức Đại sứ iSSAC
          </p>
        </div>
        <Link
          href="/member/application"
          className="self-start sm:self-auto px-6 py-3 rounded-xl bg-[#fdc455] hover:bg-[#f59e0b] text-slate-950 font-black text-xs tracking-wide shadow-sm hover:shadow-md transition-all hover:scale-[1.02] active:scale-[0.98] shrink-0 uppercase"
        >
          Nộp đơn ứng tuyển ngay
        </Link>
      </div>

      {/* 2. Hero Banner Thượng hạng: Royal Navy Gradient & Gold Badge */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#061633] via-[#0c3577] to-[#1657c1] p-8 sm:p-12 text-white shadow-xl border-2 border-[#1657c1]">
        {/* Glow hiệu ứng thị giác */}
        <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-[#fdc455]/15 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 h-96 w-96 rounded-full bg-blue-400/20 blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-6 max-w-3xl">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="px-3.5 py-1 rounded-md text-xs font-black uppercase tracking-wider bg-[#fdc455] text-slate-950 shadow-sm">
              VNU-IS Ambassadors Club
            </span>
            <span className="px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wider bg-white/10 text-blue-100 border border-white/20 backdrop-blur-xs">
              Nhiệm kỳ 2026 - 2027 • Tuyển quân Gen 10
            </span>
          </div>

          <div className="space-y-2">
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight text-white">
              CLB ĐẠI SỨ SINH VIÊN
              <span className="block text-[#fdc455] mt-1">iSSAC - VNU-IS</span>
            </h2>
            <div className="text-sm sm:text-base font-bold text-blue-200">
              Tổ chức Sinh viên nòng cốt trực thuộc Trường Quốc tế - Đại học Quốc gia Hà Nội
            </div>
          </div>

          <p className="text-xs sm:text-sm text-blue-100 leading-relaxed font-normal text-justify">
            Trải qua 10 năm xây dựng và phát triển vững mạnh, iSSAC tự hào là tổ chức đại diện hình ảnh sinh viên tiên phong tại VNU-IS. Chúng tôi là lực lượng nòng cốt kết nối giữa Nhà trường và người học, trực tiếp chủ trì và điều phối các sự kiện thường niên quy mô hàng nghìn người, đại diện tiếng nói và hình ảnh của sinh viên Trường Quốc tế trên mọi diễn đàn.
          </p>

          {/* Dải 4 chỉ số vàng */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-white/20">
            <div className="p-3.5 rounded-2xl bg-white/10 border border-white/15 backdrop-blur-xs">
              <div className="text-2xl font-black text-[#fdc455]">10 Năm</div>
              <div className="text-[11px] text-blue-200 font-semibold mt-0.5">Bản lĩnh & Tự hào</div>
            </div>
            <div className="p-3.5 rounded-2xl bg-white/10 border border-white/15 backdrop-blur-xs">
              <div className="text-2xl font-black text-[#fdc455]">100%</div>
              <div className="text-[11px] text-blue-200 font-semibold mt-0.5">Được chi trả kinh phí</div>
            </div>
            <div className="p-3.5 rounded-2xl bg-white/10 border border-white/15 backdrop-blur-xs">
              <div className="text-2xl font-black text-[#fdc455]">3 Ban</div>
              <div className="text-[11px] text-blue-200 font-semibold mt-0.5">Chuyên môn chủ lực</div>
            </div>
            <div className="p-3.5 rounded-2xl bg-white/10 border border-white/15 backdrop-blur-xs">
              <div className="text-2xl font-black text-[#fdc455]">Gen 10</div>
              <div className="text-[11px] text-blue-200 font-semibold mt-0.5">Đợt tuyển quân 2026</div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. KHỐI ĐẶC QUYỀN & LỢI ÍCH (TẬP TRUNG NỔI BẬT: ĐƯỢC CHI TRẢ KINH PHÍ & LÀM BTC) */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 border-b-2 border-slate-200 pb-3">
          <div>
            <div className="text-xs font-black uppercase tracking-wider text-[#1657c1]">
              Chế độ đãi ngộ & Phát triển cá nhân
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-1 uppercase tracking-tight">
              Đặc quyền dành riêng cho Đại sứ iSSAC
            </h2>
          </div>
          <span className="self-start sm:self-auto text-xs font-black text-slate-950 bg-[#fdc455] border-2 border-amber-400 px-3.5 py-1 rounded-full shadow-xs">
            Chính sách minh bạch & Toàn diện
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* CARD TIÊU ĐIỂM: CHÍNH SÁCH CHI TRẢ KINH PHÍ & THÙ LAO */}
          <div className="md:col-span-2 rounded-3xl bg-gradient-to-r from-amber-50 via-amber-100/40 to-white border-2 border-[#fdc455] p-7 shadow-sm space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span className="px-3 py-1 rounded-md text-xs font-black uppercase tracking-wider bg-[#fdc455] text-slate-950 border border-amber-400 self-start">
                Quyền lợi tài chính trọng tâm
              </span>
              <span className="text-xs font-bold text-amber-900">
                Nguồn kinh phí phê duyệt từ Nhà trường VNU-IS & CLB
              </span>
            </div>
            <h3 className="text-lg sm:text-xl font-black text-slate-900 pt-1">
              Được chi trả kinh phí hoạt động & Thù lao bồi dưỡng xứng đáng
            </h3>
            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed text-justify">
              Đại sứ Sinh viên khi tham gia thực hiện nhiệm vụ, hỗ trợ công tác tuyển sinh, tư vấn hướng nghiệp, tiếp đón đoàn khách quốc tế và trực tiếp điều hành các sự kiện của Trường Quốc tế sẽ <strong>được chi trả thù lao hoạt động và chế độ phụ cấp kinh phí chính thức</strong> từ nguồn ngân sách của Nhà trường và CLB, bảo đảm ghi nhận công sức đóng góp thực chất của từng thành viên.
            </p>
          </div>

          {/* CARD 2: TRỰC TIẾP LÀM BAN TỔ CHỨC (BTC) SỰ KIỆN LỚN */}
          <div className="rounded-3xl bg-white border-2 border-slate-200 hover:border-[#1657c1] p-6 shadow-xs space-y-3 transition-colors">
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-1 rounded-md text-[11px] font-black uppercase tracking-wide bg-blue-50 text-[#1657c1] border border-blue-200">
                Thực chiến sự kiện
              </span>
              <span className="text-[11px] font-bold text-slate-500">Quy mô toàn trường</span>
            </div>
            <h3 className="text-base font-black text-slate-900">
              Chủ trì & Giữ vai trò Ban Tổ chức (BTC) các Đại sự kiện
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed text-justify">
              Được tự tay sáng tạo ý tưởng, viết đề án kịch bản và trực tiếp đứng ở vị trí <strong>Ban Tổ chức (BTC)</strong> tại các sự kiện đỉnh cao như: <strong>ISTART CAMP, JOBLINK, ENROLLMENT DAY</strong> cùng chuỗi ngày hội học thuật, trải nghiệm sinh viên.
            </p>
          </div>

          {/* CARD 3: CHỨNG NHẬN & THƯ GIỚI THIỆU */}
          <div className="rounded-3xl bg-white border-2 border-slate-200 hover:border-[#1657c1] p-6 shadow-xs space-y-3 transition-colors">
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-1 rounded-md text-[11px] font-black uppercase tracking-wide bg-blue-50 text-[#1657c1] border border-blue-200">
                Giá trị học thuật
              </span>
              <span className="text-[11px] font-bold text-slate-500">Hồ sơ xin việc & Học bổng</span>
            </div>
            <h3 className="text-base font-black text-slate-900">
              Chứng nhận chính thức, Thư giới thiệu (LOR) & Điểm rèn luyện
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed text-justify">
              Được cộng tối đa điểm rèn luyện theo quy chế, nhận <strong>Chứng nhận Đại sứ Sinh viên chính thức</strong> từ Trường Quốc tế - ĐHQGHN, và có cơ hội nhận <strong>Thư giới thiệu (Recommendation Letter)</strong> từ Ban Giám hiệu giúp làm đẹp hồ sơ du học và xin việc.
            </p>
          </div>

          {/* CARD 4: ĐÀO TẠO KỸ NĂNG & LEADERSHIP */}
          <div className="rounded-3xl bg-white border-2 border-slate-200 hover:border-[#1657c1] p-6 shadow-xs space-y-3 transition-colors">
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-1 rounded-md text-[11px] font-black uppercase tracking-wide bg-blue-50 text-[#1657c1] border border-blue-200">
                Phát triển năng lực
              </span>
              <span className="text-[11px] font-bold text-slate-500">Training độc quyền</span>
            </div>
            <h3 className="text-base font-black text-slate-900">
              Khóa đào tạo chuyên sâu về Quản lý dự án & Lãnh đạo
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed text-justify">
              Tham gia các buổi tập huấn chuyên đề về kỹ năng thuyết trình trước đám đông, xử lý tình huống phát sinh, quản lý thời gian, đàm phán hợp tác và phong thái đại sứ ngoại giao chuẩn mực.
            </p>
          </div>

          {/* CARD 5: MẠNG LƯỚI QUAN HỆ & ĐỜI SỐNG GẮN KẾT */}
          <div className="rounded-3xl bg-white border-2 border-slate-200 hover:border-[#1657c1] p-6 shadow-xs space-y-3 transition-colors">
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-1 rounded-md text-[11px] font-black uppercase tracking-wide bg-blue-50 text-[#1657c1] border border-blue-200">
                Văn hóa nội bộ
              </span>
              <span className="text-[11px] font-bold text-slate-500">Môi trường gia đình</span>
            </div>
            <h3 className="text-base font-black text-slate-900">
              Mở rộng Networking & Gia đình iSSAC gắn kết bền chặt
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed text-justify">
              Kết nối trực tiếp với giảng viên, doanh nghiệp đối tác và mạng lưới cựu Đại sứ thành đạt; cùng nhau trải nghiệm tuổi trẻ rực rỡ qua các chương trình Teambuilding, Dã ngoại và Sinh nhật ấm áp.
            </p>
          </div>
        </div>
      </div>

      {/* 4. CƠ CẤU 3 BAN CHUYÊN MÔN (ĐẶC BIỆT NÂNG TẦM BAN TƯ VẤN LÀM BTC SỰ KIỆN) */}
      <div className="space-y-6">
        <div className="border-b-2 border-slate-200 pb-3">
          <div className="text-xs font-black uppercase tracking-wider text-[#1657c1]">
            Bộ máy vận hành
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-1 uppercase tracking-tight">
            Chức năng & Nhiệm vụ của 3 Ban Chuyên môn
          </h2>
          <p className="text-xs text-slate-600 mt-0.5 font-medium">
            Mỗi ban giữ một trọng trách chuyên biệt tạo nên sức mạnh tổng thể của iSSAC
          </p>
        </div>

        <div className="space-y-6">
          {/* BAN 1: BAN TƯ VẤN (ADV) - ĐƯỢC TỔ CHỨC, LÊN Ý TƯỞNG, HỌC TỔ CHỨC SỰ KIỆN VÀ LÀM BTC */}
          <div className="bg-white border-2 border-[#1657c1] rounded-3xl p-7 sm:p-9 shadow-md space-y-6 relative overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-2 border-slate-100 pb-4">
              <div>
                <span className="text-[11px] font-black uppercase tracking-wider bg-[#1657c1] text-white px-3.5 py-1 rounded-md shadow-xs">
                  Khối Cốt lõi • Sự kiện & Cố vấn
                </span>
                <h3 className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">
                  Ban Tư vấn (Advising & Support)
                </h3>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-black text-slate-950 bg-[#fdc455] border border-amber-400 px-3.5 py-1 rounded-full">
                  Chủ lực tổ chức sự kiện
                </span>
                <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-full">
                  Mã ban: ADV
                </span>
              </div>
            </div>

            {/* Khối Điểm nhấn: Tổ chức sự kiện & Làm BTC sự kiện cấp Trường */}
            <div className="p-6 rounded-2xl bg-gradient-to-r from-blue-50/90 via-blue-50/40 to-amber-50/50 border-2 border-blue-200 space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="text-xs font-black uppercase tracking-wide text-[#1657c1]">
                  Đặc quyền học tập & Thực hành Tổ chức Sự kiện (Event Management):
                </div>
                <span className="text-[11px] font-bold text-slate-600 bg-white border border-blue-200 px-2.5 py-0.5 rounded-md">
                  Trực tiếp làm Ban Tổ chức (BTC)
                </span>
              </div>

              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed text-justify">
                Tại Ban Tư vấn, bạn không chỉ làm công tác cố vấn mà còn được <strong>đào tạo bài bản kiến thức chuyên sâu về quản lý sự kiện</strong>: từ khâu lên ý tưởng sáng tạo, lập kế hoạch ngân sách, phân bổ nguồn lực, quản trị rủi ro đến điều phối sân khấu thực tế. Bạn sẽ <strong>trực tiếp giữ vai trò thành viên Ban Tổ chức (BTC)</strong> tại các sự kiện đỉnh cao hàng năm của Trường Quốc tế:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                <div className="p-4 rounded-xl bg-white border-2 border-blue-200 shadow-xs space-y-1">
                  <div className="font-black text-[#1657c1] text-xs uppercase tracking-wide">
                    ISTART CAMP
                  </div>
                  <div className="text-[11px] text-slate-600 leading-snug">
                    Đại trại định hướng chào đón tân sinh viên có quy mô và sức lan tỏa lớn nhất năm tại VNU-IS.
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-white border-2 border-blue-200 shadow-xs space-y-1">
                  <div className="font-black text-[#1657c1] text-xs uppercase tracking-wide">
                    JOBLINK
                  </div>
                  <div className="text-[11px] text-slate-600 leading-snug">
                    Ngày hội việc làm quy tụ hàng chục tập đoàn đối tác đa quốc gia cùng cơ hội thực tập, phỏng vấn tuyển dụng.
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-white border-2 border-blue-200 shadow-xs space-y-1">
                  <div className="font-black text-[#1657c1] text-xs uppercase tracking-wide">
                    ENROLLMENT DAY
                  </div>
                  <div className="text-[11px] text-slate-600 leading-snug">
                    Ngày hội nhập học & tư vấn tuyển sinh đại học quốc tế, tiếp đón hàng nghìn phụ huynh và tân cử nhân.
                  </div>
                </div>
              </div>
            </div>

            {/* Chi tiết Chức năng & Nhiệm vụ */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs sm:text-sm pt-1">
              <div className="space-y-2">
                <div className="font-black text-slate-900 uppercase tracking-wide text-xs text-[#1657c1]">
                  Chức năng chính
                </div>
                <p className="text-slate-600 leading-relaxed text-justify">
                  Là hạt nhân điều phối sự kiện và cầu nối học thuật trọng yếu của Nhà trường. Ban chịu trách nhiệm tư vấn chương trình đào tạo, giải đáp thắc mắc học bổng, định hướng lộ trình học tập cho sinh viên và chủ trì các chiến dịch sự kiện quy mô lớn.
                </p>
              </div>

              <div className="space-y-2">
                <div className="font-black text-slate-900 uppercase tracking-wide text-xs text-[#1657c1]">
                  Nhiệm vụ cụ thể
                </div>
                <ul className="space-y-2 text-slate-600 list-disc list-inside leading-relaxed">
                  <li>Lên ý tưởng, xây dựng kịch bản chi tiết và trực tiếp điều phối sự kiện (Event Coordinator).</li>
                  <li>Tư vấn ngành học, chương trình đào tạo liên kết quốc tế và phương pháp học tập hiệu quả.</li>
                  <li>Kết nối các cơ hội học bổng doanh nghiệp và chương trình trao đổi sinh viên quốc tế.</li>
                  <li>Tổ chức các buổi Hội thảo, Tọa đàm kỹ năng mềm và rèn luyện năng lực thích ứng cho sinh viên.</li>
                </ul>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border-2 border-slate-200 text-xs text-slate-700">
              <strong>Phù hợp với bạn nếu:</strong> Bạn đam mê tổ chức sự kiện thực tế, mong muốn học hỏi kỹ năng quản trị dự án từ A đến Z, có tư duy giao tiếp hoạt bát, thích kết nối và truyền cảm hứng tích cực đến mọi người.
            </div>
          </div>

          {/* BAN 2: BAN TRUYỀN THÔNG (COM) */}
          <div className="bg-white border-2 border-slate-200 hover:border-[#1657c1] rounded-3xl p-7 sm:p-9 shadow-xs space-y-6 transition-colors">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-2 border-slate-100 pb-4">
              <div>
                <span className="text-[11px] font-black uppercase tracking-wider bg-blue-50 text-[#1657c1] border border-blue-200 px-3 py-1 rounded-md">
                  Khối Sáng tạo & Media
                </span>
                <h3 className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">
                  Ban Truyền thông (Media & Creative)
                </h3>
              </div>
              <span className="self-start sm:self-auto text-xs font-bold text-slate-600 bg-slate-100 px-3.5 py-1 rounded-full">
                Mã ban: COM
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs sm:text-sm">
              <div className="space-y-2">
                <div className="font-black text-slate-900 uppercase tracking-wide text-xs text-[#1657c1]">
                  Chức năng chính
                </div>
                <p className="text-slate-600 leading-relaxed text-justify">
                  Kiến tạo và quản lý toàn bộ diện mạo thương hiệu của iSSAC trên các nền tảng số. Chịu trách nhiệm sản xuất các ấn phẩm truyền thông, lan tỏa văn hóa và thông tin tuyển sinh của Trường Quốc tế đến hàng chục nghìn học sinh, sinh viên cả nước.
                </p>
              </div>

              <div className="space-y-2">
                <div className="font-black text-slate-900 uppercase tracking-wide text-xs text-[#1657c1]">
                  Nhiệm vụ cụ thể
                </div>
                <ul className="space-y-2 text-slate-600 list-disc list-inside leading-relaxed">
                  <li>Lập kế hoạch nội dung sáng tạo (Content Planning, Copywriting) cho các chiến dịch thường niên.</li>
                  <li>Thiết kế bộ nhận diện và ấn phẩm đồ họa chuyên nghiệp (Photoshop, Illustrator, Canva).</li>
                  <li>Sản xuất video ngắn dẫn đầu xu hướng (TikTok, Reels, Teaser và Recap sự kiện qua CapCut/Premiere).</li>
                  <li>Nhiếp ảnh và phóng viên tác nghiệp trực tiếp tại các sự kiện lớn của Trường và CLB.</li>
                </ul>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border-2 border-slate-200 text-xs text-slate-700">
              <strong>Phù hợp với bạn nếu:</strong> Bạn đam mê sáng tạo nội dung, có mắt thẩm mỹ hiện đại, thích quay chụp, dựng phim ngắn hoặc định hướng phát triển sự nghiệp trong ngành Marketing, PR và Truyền thông đa phương tiện.
            </div>
          </div>

          {/* BAN 3: BAN NHÂN SỰ (HR) */}
          <div className="bg-white border-2 border-slate-200 hover:border-[#1657c1] rounded-3xl p-7 sm:p-9 shadow-xs space-y-6 transition-colors">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-2 border-slate-100 pb-4">
              <div>
                <span className="text-[11px] font-black uppercase tracking-wider bg-blue-50 text-[#1657c1] border border-blue-200 px-3 py-1 rounded-md">
                  Khối Quản trị & Văn hóa
                </span>
                <h3 className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">
                  Ban Nhân sự (HR & Organization)
                </h3>
              </div>
              <span className="self-start sm:self-auto text-xs font-bold text-slate-600 bg-slate-100 px-3.5 py-1 rounded-full">
                Mã ban: HR
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs sm:text-sm">
              <div className="space-y-2">
                <div className="font-black text-slate-900 uppercase tracking-wide text-xs text-[#1657c1]">
                  Chức năng chính
                </div>
                <p className="text-slate-600 leading-relaxed text-justify">
                  Giữ vai trò là bộ máy vận hành và sợi dây gắn kết của tổ chức. Chịu trách nhiệm quản lý nguồn nhân lực, tổ chức các đợt tuyển quân, duy trì kỷ luật, đào tạo nội bộ và bảo đảm công tác hậu cần, tài chính cho mọi hoạt động của CLB.
                </p>
              </div>

              <div className="space-y-2">
                <div className="font-black text-slate-900 uppercase tracking-wide text-xs text-[#1657c1]">
                  Nhiệm vụ cụ thể
                </div>
                <ul className="space-y-2 text-slate-600 list-disc list-inside leading-relaxed">
                  <li>Tổ chức chiến dịch tuyển quân thường niên (thu thập hồ sơ, điều phối phỏng vấn, onboarding tân đại sứ).</li>
                  <li>Theo dõi tiến độ công việc, chấm công, quản lý KPI và bình xét khen thưởng thành viên.</li>
                  <li>Lên ý tưởng và tổ chức các chương trình Team Building, Trại dã ngoại, Gala tổng kết gắn kết gia đình iSSAC.</li>
                  <li>Phụ trách công tác hậu cần vật tư, dự trù ngân sách và quản lý tài sản chung của CLB.</li>
                </ul>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border-2 border-slate-200 text-xs text-slate-700">
              <strong>Phù hợp với bạn nếu:</strong> Bạn là người chu đáo, cẩn thận, có tư duy sắp xếp công việc khoa học, biết lắng nghe, thấu hiểu tâm lý và mong muốn phát triển chuyên sâu trong ngành Quản trị nhân lực hoặc Quản lý tổ chức.
            </div>
          </div>
        </div>
      </div>

      {/* 5. Khối Kêu gọi hành động (CTA) */}
      <div className="p-8 sm:p-10 rounded-3xl bg-gradient-to-r from-blue-50 via-indigo-50 to-amber-50 border-2 border-[#1657c1]/40 flex flex-col sm:flex-row sm:items-center justify-between gap-6 shadow-sm">
        <div className="space-y-2 max-w-xl">
          <span className="px-3 py-1 rounded-md text-[11px] font-black uppercase tracking-wider bg-[#1657c1] text-white">
            Cánh cửa Đại sứ iSSAC Gen 10
          </span>
          <h3 className="text-xl font-black text-slate-900">
            Bạn đã chọn được Ban Chuyên môn phù hợp với đam mê của mình?
          </h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Đừng bỏ lỡ cơ hội trở thành một phần của thế hệ Đại sứ Sinh viên kế tiếp, rèn luyện bản lĩnh, khẳng định giá trị bản thân và mở ra những cánh cửa tương lai rộng mở.
          </p>
        </div>
        <Link
          href="/member/application"
          className="px-8 py-4 rounded-2xl bg-[#fdc455] hover:bg-[#f59e0b] text-slate-950 font-black text-sm tracking-wide shadow-md transition-all hover:scale-[1.03] active:scale-[0.98] shrink-0 text-center uppercase"
        >
          Bắt đầu nộp đơn ứng tuyển
        </Link>
      </div>
    </div>
  )
}
