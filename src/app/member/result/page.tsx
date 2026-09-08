import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { MOCK_CANDIDATES } from '@/lib/mock-data'

export default async function MemberResultPage() {
  const supabase = await createClient()

  let published = true
  let finalResult: any = null
  let deptName = "Ban Truyền thông"
  let candidateName = "Nguyễn Hà Phương"

  try {
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      const [{ data: settings }, { data: fr }, { data: rk }, { data: prof }] = await Promise.all([
        supabase.from("system_settings").select("key, value").eq("key", "results_published").single(),
        supabase.from("final_results").select("*").eq("user_id", user.id).single(),
        supabase.from("candidate_rankings").select("*, applications!inner(department_id, departments:department_id(name))").eq("applications.user_id", user.id).single(),
        supabase.from("profiles").select("full_name").eq("id", user.id).single()
      ])

      published = settings?.value === "true"
      finalResult = fr
      if (prof?.full_name) candidateName = prof.full_name
      if (rk?.applications?.departments?.name) deptName = rk.applications.departments.name
    }
  } catch {
    // Demo fallback
  }

  // Demo fallback
  if (!finalResult) {
    published = true
    finalResult = {
      result: "pass",
      announcement_message: "Chúc mừng bạn đã xuất sắc vượt qua các vòng đánh giá tuyển chọn và chính thức trở thành Đại sứ Sinh viên CLB iSSAC - Trường Quốc tế, ĐHQGHN!",
    }
  }

  const isPassed = finalResult.result === "pass"

  return (
    <div className="space-y-6 max-w-2xl mx-auto animate-fade-in pb-12 font-sans">
      {/* 1. Header: Đồng bộ tone Xanh - Vàng iSSAC, không icon */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 tracking-tight">
            KẾT QUẢ ỨNG TUYỂN iSSAC 2026
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Cổng thông tin tuyển chọn Đại sứ Sinh viên Gen 3
          </p>
        </div>
        <Link
          href="/member/dashboard"
          className="px-4 py-2 rounded-xl border-2 border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-xs transition-all"
        >
          Về Tổng quan
        </Link>
      </div>

      {!published ? (
        <div className="bg-white border-2 border-slate-200 rounded-3xl p-8 sm:p-12 text-center shadow-xs space-y-4">
          <div className="inline-block px-4 py-1.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700 uppercase tracking-wider">
            Thông báo bảo mật
          </div>
          <h2 className="text-xl font-bold text-slate-900">
            Kết quả chưa được công bố
          </h2>
          <p className="text-slate-600 max-w-md mx-auto text-xs sm:text-sm leading-relaxed">
            Hội đồng tuyển sinh đang hoàn tất quá trình phê duyệt danh sách chính thức. Kết quả sẽ được cập nhật tại đây ngay sau khi công bố.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {/* Main result card: Sang trọng, màu xanh navy & vàng iSSAC, tuyệt đối không lộ điểm */}
          <div className="bg-white border-2 border-[#1657c1]/20 rounded-3xl shadow-md overflow-hidden">
            {/* Top banner */}
            <div className="bg-gradient-to-br from-[#0d3b82] via-[#1657c1] to-[#0a2550] p-6 sm:p-8 text-white text-center space-y-2">
              <div className="text-[11px] uppercase tracking-widest text-blue-200 font-bold">
                Câu lạc bộ Đại sứ Sinh viên - Trường Quốc tế, ĐHQGHN
              </div>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                {isPassed ? "CHÚC MỪNG TRÚNG TUYỂN!" : "KẾT QUẢ TUYỂN CHỌN"}
              </h2>
              <div className="pt-2">
                <span className={
                  isPassed
                    ? "inline-block px-5 py-1.5 rounded-full text-xs font-black uppercase tracking-wider shadow-xs bg-[#fdc455] text-slate-950 border border-amber-400"
                    : "inline-block px-5 py-1.5 rounded-full text-xs font-black uppercase tracking-wider shadow-xs bg-slate-100 text-slate-800"
                }>
                  {isPassed ? "Trạng thái: Chính thức trúng tuyển" : "Trạng thái: Chưa trúng tuyển"}
                </span>
              </div>
            </div>

            {/* Card Content */}
            <div className="p-6 sm:p-8 space-y-6">
              <div className="text-center space-y-2 max-w-lg mx-auto">
                <p className="text-xs sm:text-sm text-slate-500 font-medium">
                  Hội đồng Tuyển quân iSSAC trân trọng gửi kết quả đến ứng viên
                </p>
                <div className="text-2xl font-black text-[#1657c1]">
                  {candidateName}
                </div>
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed pt-1">
                  {finalResult.announcement_message}
                </p>
              </div>

              {/* Bảng thông tin kết quả: BẢO MẬT TUYỆT ĐỐI - KHÔNG HIỂN THỊ ĐIỂM SỐ VÀ THỨ HẠNG */}
              {isPassed ? (
                <div className="rounded-2xl border-2 border-slate-200/90 bg-slate-50/70 p-5 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-200/80 pb-2.5 text-xs sm:text-sm">
                    <span className="text-slate-500 font-medium">Ban chuyên môn trúng tuyển:</span>
                    <strong className="text-[#1657c1] font-black text-sm sm:text-base">{deptName}</strong>
                  </div>
                  <div className="flex items-center justify-between border-b border-slate-200/80 pb-2.5 text-xs sm:text-sm">
                    <span className="text-slate-500 font-medium">Tư cách thành viên:</span>
                    <strong className="text-slate-900 font-bold">Đại sứ Sinh viên Gen 3</strong>
                  </div>
                  <div className="flex items-center justify-between border-b border-slate-200/80 pb-2.5 text-xs sm:text-sm">
                    <span className="text-slate-500 font-medium">Nhiệm kỳ hoạt động:</span>
                    <span className="text-amber-950 font-black bg-amber-100 border border-amber-300 px-3 py-0.5 rounded-md text-xs">
                      2026 - 2027
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs sm:text-sm pt-0.5">
                    <span className="text-slate-500 font-medium">Đơn vị trực thuộc:</span>
                    <span className="text-slate-800 font-bold">Trường Quốc tế - ĐHQGHN</span>
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border-2 border-slate-200 bg-slate-50 p-5 text-center text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Cảm ơn bạn đã dành thời gian và sự quan tâm tham gia đợt tuyển chọn Đại sứ Sinh viên iSSAC Gen 3. Rất hy vọng sẽ tiếp tục được đồng hành cùng bạn trong các sự kiện và hoạt động tiếp theo của CLB.
                </div>
              )}
            </div>
          </div>

          {/* Next Steps: Bố cục rõ ràng, màu Xanh & Vàng iSSAC, không icon */}
          {isPassed && (
            <div className="bg-white border-2 border-slate-200/90 rounded-3xl p-6 sm:p-7 shadow-xs space-y-4">
              <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                <div>
                  <div className="text-xs font-black uppercase tracking-wider text-[#1657c1]">
                    Các bước tiếp theo dành cho Tân Đại sứ
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Vui lòng theo dõi các mốc hoạt động quan trọng để hoàn tất thủ tục gia nhập CLB
                  </p>
                </div>
                <span className="text-[11px] font-bold text-amber-950 bg-amber-100 border border-amber-300 px-2.5 py-0.5 rounded-full">
                  Quan trọng
                </span>
              </div>

              <div className="space-y-3 pt-1">
                {[
                  {
                    step: "1",
                    title: "Kiểm tra hòm thư email sinh viên",
                    desc: "Nhận thư mời chính thức và thông tin chi tiết về buổi gặp mặt đầu tiên từ Ban Chủ nhiệm CLB."
                  },
                  {
                    step: "2",
                    title: "Tham gia buổi Họp mặt Tân Thành viên (Onboarding Day)",
                    desc: "Gặp gỡ Ban Chủ nhiệm, làm quen với các thành viên trong Ban và tiếp nhận thẻ Đại sứ Sinh viên."
                  },
                  {
                    step: "3",
                    title: "Gia nhập nhóm liên lạc nội bộ của Ban chuyên môn",
                    desc: "Kết nối cùng Trưởng ban và các cộng sự để bắt đầu những dự án và nhiệm vụ đầu tiên của nhiệm kỳ."
                  }
                ].map(item => (
                  <div key={item.step} className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-slate-50/70 border border-slate-200/80">
                    <span className="w-6 h-6 rounded-full bg-[#1657c1] text-white flex items-center justify-center text-xs font-black shrink-0 mt-0.5">
                      {item.step}
                    </span>
                    <div className="space-y-0.5">
                      <div className="text-xs sm:text-sm font-bold text-slate-900">
                        {item.title}
                      </div>
                      <div className="text-xs text-slate-600 leading-relaxed">
                        {item.desc}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
