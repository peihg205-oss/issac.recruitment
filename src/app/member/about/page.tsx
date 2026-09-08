import Link from "next/link"

export const metadata = {
  title: "Giới thiệu CLB & Quyền lợi Đại sứ Sinh viên - iSSAC",
  description: "Thông tin chính thức về Câu lạc bộ Đại sứ Sinh viên Trường Quốc tế - ĐHQGHN, chính sách chi trả kinh phí và cơ cấu 3 ban chuyên môn.",
}

export default function MemberAboutPage() {
  return (
    <div className="space-y-8 max-w-4xl mx-auto animate-fade-in pb-16 font-sans text-slate-800">
      {/* 1. Header Trang: Căn chỉnh đẹp mắt, chuẩn mực, có nút Đăng ký ngay */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div className="space-y-1">
          <div className="text-xs font-semibold tracking-wider text-[#1657c1] uppercase">
            Trường Quốc tế - Đại học Quốc gia Hà Nội
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mt-1">
            Giới thiệu Câu lạc bộ & Các Ban Chuyên môn
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
            Hồ sơ giới thiệu chính thức về sứ mệnh hoạt động, chính sách chi trả kinh phí và cơ cấu tổ chức Đại sứ iSSAC
          </p>
        </div>
        <Link
          href="/member/application"
          className="self-start sm:self-center px-6 py-2.5 rounded-xl bg-[#fdc455] hover:bg-[#f59e0b] text-slate-950 font-bold text-xs tracking-wider uppercase shadow-sm transition-all hover:scale-105 active:scale-95 shrink-0 whitespace-nowrap text-center"
        >
          Đăng ký ngay
        </Link>
      </div>

      {/* 2. Tổng quan Câu lạc bộ: Khung Royal Navy trang nhã, dấu nối ngắn gọn - không dấu chấm giữa */}
      <div className="rounded-2xl bg-gradient-to-br from-[#081f44] via-[#0c3577] to-[#1657c1] text-white p-7 sm:p-9 shadow-md border border-[#1657c1]/60 space-y-5">
        <div className="space-y-3">
          <div className="text-xs font-semibold text-amber-300 uppercase tracking-wider">
            VNU-IS Ambassadors Club - Khóa Tuyển quân Gen 10
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Câu lạc bộ Đại sứ Sinh viên (iSSAC)
          </h2>
          <p className="text-sm sm:text-base text-blue-100 leading-relaxed text-justify font-normal">
            Được thành lập từ năm 2016, iSSAC là tổ chức sinh viên nòng cốt trực thuộc Trường Quốc tế - Đại học Quốc gia Hà Nội. Đội ngũ Đại sứ giữ vai trò là cầu nối thông tin chính thức giữa Nhà trường và cộng đồng sinh viên, đại diện hình ảnh sinh viên trên các diễn đàn đối ngoại, đồng thời là lực lượng chủ chốt trực tiếp sáng tạo và tổ chức các sự kiện lớn nhất năm của Trường.
          </p>
        </div>

        <div className="pt-4 border-t border-white/15 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs text-blue-100">
          <div>
            <div className="text-slate-300 font-medium">Nhiệm kỳ</div>
            <div className="text-sm font-bold text-white mt-0.5">2026 - 2027</div>
          </div>
          <div>
            <div className="text-slate-300 font-medium">Thành lập</div>
            <div className="text-sm font-bold text-white mt-0.5">10 Năm phát triển</div>
          </div>
          <div>
            <div className="text-slate-300 font-medium">Cơ cấu tổ chức</div>
            <div className="text-sm font-bold text-white mt-0.5">3 Ban chuyên môn</div>
          </div>
          <div>
            <div className="text-slate-300 font-medium">Chính sách hỗ trợ</div>
            <div className="text-sm font-bold text-amber-300 mt-0.5">100% có kinh phí</div>
          </div>
        </div>
      </div>

      {/* 3. CHÍNH SÁCH ĐÃI NGỘ & QUYỀN LỢI ĐẠI SỨ */}
      <div className="space-y-4">
        <div className="border-b border-slate-200 pb-3">
          <h2 className="text-lg sm:text-xl font-bold text-slate-900">
            Chính sách đãi ngộ & Quyền lợi thành viên
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Các chế độ và cơ hội phát triển dành riêng cho Đại sứ Sinh viên iSSAC
          </p>
        </div>

        {/* Khối nổi bật: Chi trả kinh phí & Thù lao */}
        <div className="rounded-2xl bg-amber-50/80 border-2 border-amber-300 p-6 space-y-2">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-900 bg-amber-200/80 px-2.5 py-0.5 rounded">
              Chính sách tài chính chính thức
            </span>
            <span className="text-xs font-medium text-amber-800">
              Kinh phí phê duyệt từ Nhà trường VNU-IS & CLB
            </span>
          </div>
          <h3 className="text-base sm:text-lg font-bold text-slate-900 pt-1">
            Được chi trả kinh phí hoạt động & Thù lao bồi dưỡng
          </h3>
          <p className="text-sm text-slate-700 leading-relaxed text-justify">
            Đại sứ Sinh viên khi tham gia thực hiện nhiệm vụ, hỗ trợ công tác tuyển sinh, tư vấn hướng nghiệp, tiếp đón các đoàn khách quốc tế và trực tiếp điều hành các sự kiện của Trường Quốc tế sẽ <strong>được chi trả thù lao hoạt động và phụ cấp kinh phí chính thức</strong> từ nguồn ngân sách của Nhà trường và CLB, bảo đảm ghi nhận xứng đáng thời gian và công sức đóng góp của từng cá nhân.
          </p>
        </div>

        {/* Các quyền lợi cốt lõi khác */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-2xl bg-white border-2 border-slate-200 p-5 space-y-2">
            <div className="text-xs font-bold text-[#1657c1] uppercase tracking-wide">
              Thực chiến quản lý sự kiện
            </div>
            <h4 className="text-base font-bold text-slate-900">
              Chủ trì & Trực tiếp làm Ban Tổ chức sự kiện
            </h4>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed text-justify">
              Được tự tay lên ý tưởng, xây dựng kế hoạch kịch bản và đứng ở vị trí <strong>Ban Tổ chức (BTC)</strong> tại các sự kiện quy mô hàng nghìn người như <strong>ISTART CAMP, JOBLINK, ENROLLMENT DAY</strong>.
            </p>
          </div>

          <div className="rounded-2xl bg-white border-2 border-slate-200 p-5 space-y-2">
            <div className="text-xs font-bold text-[#1657c1] uppercase tracking-wide">
              Chứng nhận & Học thuật
            </div>
            <h4 className="text-base font-bold text-slate-900">
              Chứng nhận chính thức & Thư giới thiệu (LOR)
            </h4>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed text-justify">
              Cộng điểm rèn luyện tối đa theo quy chế, nhận <strong>Chứng nhận Đại sứ Sinh viên chính thức</strong> từ Trường Quốc tế - ĐHQGHN và cơ hội nhận <strong>Thư giới thiệu</strong> từ Ban Giám hiệu phục vụ học bổng du học và xin việc.
            </p>
          </div>

          <div className="rounded-2xl bg-white border-2 border-slate-200 p-5 space-y-2">
            <div className="text-xs font-bold text-[#1657c1] uppercase tracking-wide">
              Đào tạo năng lực
            </div>
            <h4 className="text-base font-bold text-slate-900">
              Tập huấn kỹ năng lãnh đạo & Tác phong ngoại giao
            </h4>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed text-justify">
              Được đào tạo định kỳ về kỹ năng thuyết trình, đàm phán đối ngoại, quản trị thời gian, giải quyết vấn đề dưới áp lực và phong thái đại sứ chuyên nghiệp.
            </p>
          </div>

          <div className="rounded-2xl bg-white border-2 border-slate-200 p-5 space-y-2">
            <div className="text-xs font-bold text-[#1657c1] uppercase tracking-wide">
              Mạng lưới & Đời sống
            </div>
            <h4 className="text-base font-bold text-slate-900">
              Mở rộng Networking & Văn hóa gia đình gắn kết
            </h4>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed text-justify">
              Kết nối trực tiếp với lãnh đạo Nhà trường, các doanh nghiệp đối tác và mạng lưới cựu Đại sứ thành đạt; gắn kết tuổi trẻ qua các chuyến Team Building, Dã ngoại và Sinh nhật ấm cúng.
            </p>
          </div>
        </div>
      </div>

      {/* 4. CƠ CẤU VÀ NHIỆM VỤ 3 BAN CHUYÊN MÔN */}
      <div className="space-y-5">
        <div className="border-b border-slate-200 pb-3">
          <h2 className="text-lg sm:text-xl font-bold text-slate-900">
            Cơ cấu & Nhiệm vụ của 3 Ban Chuyên môn
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Mỗi ban đảm nhiệm chức năng chuyên biệt trong chuỗi vận hành của iSSAC
          </p>
        </div>

        <div className="space-y-5">
          {/* BAN 1: BAN TƯ VẤN (ADV) */}
          <div className="rounded-2xl bg-white border-2 border-[#1657c1] p-6 sm:p-7 space-y-5 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#1657c1]">
                  Khối Cốt lõi - Sự kiện & Cố vấn sinh viên
                </span>
                <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
                  Ban Tư vấn (Advising & Support)
                </h3>
              </div>
              <span className="self-start sm:self-auto text-xs font-bold text-slate-700 bg-slate-100 px-3 py-1 rounded-full">
                Mã ban: ADV
              </span>
            </div>

            {/* Khối Điểm nhấn Tổ chức sự kiện & BTC */}
            <div className="p-5 rounded-xl bg-blue-50/70 border border-blue-200 space-y-3">
              <div className="text-xs font-bold uppercase tracking-wide text-[#1657c1]">
                Đặc quyền học tập & Trực tiếp làm Ban Tổ chức (BTC) Sự kiện
              </div>
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed text-justify">
                Thành viên Ban Tư vấn <strong>được đào tạo kiến thức chuyên sâu về tổ chức sự kiện (Event Management)</strong>: từ khâu lên ý tưởng sáng tạo, lập kế hoạch chi tiết, dự trù ngân sách, phân công nguồn lực đến điều phối sân khấu thực tế. Bạn sẽ <strong>trực tiếp giữ vai trò Ban Tổ chức (BTC)</strong> tại các sự kiện quy mô lớn của Nhà trường:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                <div className="p-3.5 rounded-lg bg-white border border-blue-200">
                  <div className="font-bold text-[#1657c1] text-xs uppercase">
                    ISTART CAMP
                  </div>
                  <div className="text-xs text-slate-600 mt-1 leading-relaxed">
                    Trại định hướng chào đón tân sinh viên có quy mô và sức hút lớn nhất năm tại VNU-IS.
                  </div>
                </div>

                <div className="p-3.5 rounded-lg bg-white border border-blue-200">
                  <div className="font-bold text-[#1657c1] text-xs uppercase">
                    JOBLINK
                  </div>
                  <div className="text-xs text-slate-600 mt-1 leading-relaxed">
                    Ngày hội việc làm quy tụ hàng chục doanh nghiệp lớn cùng hàng nghìn cơ hội nghề nghiệp.
                  </div>
                </div>

                <div className="p-3.5 rounded-lg bg-white border border-blue-200">
                  <div className="font-bold text-[#1657c1] text-xs uppercase">
                    ENROLLMENT DAY
                  </div>
                  <div className="text-xs text-slate-600 mt-1 leading-relaxed">
                    Ngày hội nhập học và tư vấn tuyển sinh đại học quốc tế, đón tiếp phụ huynh và tân cử nhân.
                  </div>
                </div>
              </div>
            </div>

            {/* Chức năng & Nhiệm vụ */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs sm:text-sm">
              <div className="space-y-1.5">
                <div className="font-bold text-slate-900 text-xs uppercase tracking-wide text-[#1657c1]">
                  Chức năng chính
                </div>
                <p className="text-slate-600 leading-relaxed text-justify">
                  Tư vấn lộ trình học tập, giải đáp thông tin học bổng, định hướng ngành nghề cho sinh viên và chủ trì tổ chức các sự kiện học thuật, hướng nghiệp của Nhà trường.
                </p>
              </div>

              <div className="space-y-1.5">
                <div className="font-bold text-slate-900 text-xs uppercase tracking-wide text-[#1657c1]">
                  Nhiệm vụ cụ thể
                </div>
                <ul className="space-y-1.5 text-slate-600 list-disc list-inside leading-relaxed">
                  <li>Lên ý tưởng, xây dựng kịch bản và trực tiếp điều phối sự kiện (Event Coordinator).</li>
                  <li>Tư vấn tuyển sinh, giải đáp thắc mắc chương trình đào tạo liên kết quốc tế.</li>
                  <li>Kết nối các nguồn học bổng doanh nghiệp và chương trình trao đổi sinh viên.</li>
                  <li>Tổ chức các buổi tọa đàm, workshop rèn luyện kỹ năng học tập và thích ứng.</li>
                </ul>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700">
              <span className="font-bold text-slate-900">Đối tượng phù hợp:</span> Bạn yêu thích công việc tổ chức sự kiện thực tế, muốn học quy trình quản lý chương trình từ A đến Z, có khả năng giao tiếp tự tin và muốn truyền cảm hứng đến bạn bè.
            </div>
          </div>

          {/* BAN 2: BAN TRUYỀN THÔNG (COM) */}
          <div className="rounded-2xl bg-white border-2 border-slate-200 p-6 sm:p-7 space-y-5 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#1657c1]">
                  Khối Sáng tạo & Media
                </span>
                <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
                  Ban Truyền thông (Media & Creative)
                </h3>
              </div>
              <span className="self-start sm:self-auto text-xs font-bold text-slate-700 bg-slate-100 px-3 py-1 rounded-full">
                Mã ban: COM
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs sm:text-sm">
              <div className="space-y-1.5">
                <div className="font-bold text-slate-900 text-xs uppercase tracking-wide text-[#1657c1]">
                  Chức năng chính
                </div>
                <p className="text-slate-600 leading-relaxed text-justify">
                  Xây dựng và phát triển diện mạo thương hiệu iSSAC trên các nền tảng số, sản xuất các sản phẩm truyền thông lan tỏa hình ảnh Nhà trường đến cộng đồng học sinh, sinh viên toàn quốc.
                </p>
              </div>

              <div className="space-y-1.5">
                <div className="font-bold text-slate-900 text-xs uppercase tracking-wide text-[#1657c1]">
                  Nhiệm vụ cụ thể
                </div>
                <ul className="space-y-1.5 text-slate-600 list-disc list-inside leading-relaxed">
                  <li>Lập kế hoạch nội dung, viết bài sáng tạo (Content / Copywriting) cho fanpage và sự kiện.</li>
                  <li>Thiết kế bộ nhận diện thương hiệu, ấn phẩm đồ họa (Photoshop, Illustrator, Canva).</li>
                  <li>Sản xuất video ngắn dẫn đầu xu hướng (TikTok, Reels, Teaser, Video Recap qua CapCut/Premiere).</li>
                  <li>Nhiếp ảnh và phóng viên tác nghiệp tại các hoạt động lớn của Trường và CLB.</li>
                </ul>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700">
              <span className="font-bold text-slate-900">Đối tượng phù hợp:</span> Bạn yêu thích sáng tạo nội dung, có mắt thẩm mỹ hiện đại, thích quay chụp ảnh, dựng video hoặc muốn phát triển nghề nghiệp trong ngành Marketing và Truyền thông.
            </div>
          </div>

          {/* BAN 3: BAN NHÂN SỰ (HR) */}
          <div className="rounded-2xl bg-white border-2 border-slate-200 p-6 sm:p-7 space-y-5 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#1657c1]">
                  Khối Quản trị & Vận hành
                </span>
                <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
                  Ban Nhân sự (HR & Organization)
                </h3>
              </div>
              <span className="self-start sm:self-auto text-xs font-bold text-slate-700 bg-slate-100 px-3 py-1 rounded-full">
                Mã ban: HR
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs sm:text-sm">
              <div className="space-y-1.5">
                <div className="font-bold text-slate-900 text-xs uppercase tracking-wide text-[#1657c1]">
                  Chức năng chính
                </div>
                <p className="text-slate-600 leading-relaxed text-justify">
                  Giữ vai trò là bộ máy vận hành và sợi dây gắn kết của tổ chức; chịu trách nhiệm điều phối nguồn nhân lực, duy trì kỷ luật, đào tạo nội bộ và quản trị hậu cần cho mọi hoạt động của CLB.
                </p>
              </div>

              <div className="space-y-1.5">
                <div className="font-bold text-slate-900 text-xs uppercase tracking-wide text-[#1657c1]">
                  Nhiệm vụ cụ thể
                </div>
                <ul className="space-y-1.5 text-slate-600 list-disc list-inside leading-relaxed">
                  <li>Tổ chức các đợt tuyển quân thường niên (tiếp nhận hồ sơ, điều phối phỏng vấn, onboarding).</li>
                  <li>Theo dõi tiến độ công việc, điểm danh, quản lý KPI và bình xét khen thưởng thành viên.</li>
                  <li>Lên kế hoạch và tổ chức các buổi Team Building, Trại dã ngoại và Gala gia đình iSSAC.</li>
                  <li>Phụ trách công tác hậu cần vật tư, dự trù ngân sách và quản lý tài chính chung của CLB.</li>
                </ul>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700">
              <span className="font-bold text-slate-900">Đối tượng phù hợp:</span> Bạn là người chu đáo, cẩn thận, có kỹ năng sắp xếp công việc khoa học, thấu hiểu tâm lý và mong muốn theo đuổi mảng Quản trị nhân sự hoặc Quản lý dự án.
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
