'use client'
import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  CheckCircle2, Clock, FileText, Calendar, Trophy,
  ChevronRight, User, Sparkles, Building2, MapPin,
  ExternalLink, Mail, Check, Eye, Heart, PartyPopper,
  ShieldCheck, Layers, ArrowUpRight, Compass, Send,
  Star, Award
} from 'lucide-react'
import { formatDate, formatFullTimestamp } from '@/lib/utils'
import { MOCK_CANDIDATES } from '@/lib/mock-data'

export default function MemberDashboardPage() {
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<any>(null)
  const [application, setApplication] = useState<any>(null)
  const [interview, setInterview] = useState<any>(null)
  const [finalResult, setFinalResult] = useState<any>(null)
  const [showResultModal, setShowResultModal] = useState(false)
  const [hasOpenedEnvelope, setHasOpenedEnvelope] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        const [{ data: prof }, { data: app }, { data: iv }, { data: fr }] = await Promise.all([
          supabase.from('profiles').select('*, departments(name, color)').eq('id', user.id).single(),
          supabase.from('applications').select('*, departments!applications_department_id_fkey(name, color, slug)').eq('user_id', user.id).limit(1).single(),
          supabase.from('interviews').select('*, interview_slots(*)').eq('user_id', user.id).limit(1).single(),
          supabase.from('final_results').select('*').eq('user_id', user.id).single(),
        ])

        if (prof) setProfile(prof)
        if (app) setApplication(app)
        if (iv) setInterview(iv)
        if (fr) setFinalResult(fr)
      }
    } catch {
      // Demo fallback handled below
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Fallback demo candidate: Nguyen Ha Phuong
  const currentProfile = profile || {
    full_name: MOCK_CANDIDATES[0].profiles.full_name,
    student_id: MOCK_CANDIDATES[0].profiles.student_id,
    email: MOCK_CANDIDATES[0].profiles.email,
    phone: MOCK_CANDIDATES[0].profiles.phone,
    university: MOCK_CANDIDATES[0].profiles.university,
    major: MOCK_CANDIDATES[0].profiles.major,
    cohort: MOCK_CANDIDATES[0].profiles.cohort,
    gpa: MOCK_CANDIDATES[0].profiles.gpa,
  }

  const currentApp = application || {
    id: MOCK_CANDIDATES[0].id,
    status: MOCK_CANDIDATES[0].status,
    submitted_at: MOCK_CANDIDATES[0].submitted_at,
    departments: MOCK_CANDIDATES[0].departments,
  }

  const currentInterview = interview || {
    interview_slots: {
      interview_date: '2026-09-12',
      start_time: '08:30',
      end_time: '10:00',
      location: 'Phòng Hội đồng 302, Nhà C, VNU-IS (Làng Sinh viên HACINCO)',
      format: 'offline',
    }
  }

  const currentFinalResult = finalResult || {
    result: 'pass',
    announcement_message: 'Chúc mừng bạn đã xuất sắc vượt qua các vòng đánh giá tuyển chọn và chính thức trở thành Thành viên CLB Đại sứ Sinh viên VNU-IS (iSSAC) - Ban Truyền thông!',
  }

  const deptName = currentApp?.departments?.name || 'Ban Truyền thông'
  const isPassed = currentFinalResult?.result === 'pass'

  // 5 Steps matching wireframe: (1) Hồ sơ  (2) Đơn  (3) PV  (4) Đánh giá  (5) Kết quả
  // Unified single font - zero font-mono!
  const journeySteps = [
    { id: 1, name: 'Hồ sơ', desc: 'Thông tin cá nhân', status: 'done', symbol: '✓' },
    { id: 2, name: 'Đơn', desc: 'Câu trả lời & CV', status: 'done', symbol: '✓' },
    { id: 3, name: 'PV', desc: 'Phỏng vấn trực tiếp', status: 'done', symbol: '✓' },
    { id: 4, name: 'Đánh giá', desc: 'Hội đồng chấm điểm', status: 'done', symbol: '✓' },
    { id: 5, name: 'Kết quả', desc: 'Công bố chính thức', status: hasOpenedEnvelope ? 'done' : 'active', symbol: hasOpenedEnvelope ? '✓' : '●' },
  ]

  const handleOpenResult = () => {
    setShowResultModal(true)
    setHasOpenedEnvelope(true)
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-fade-in pb-12">
      {/* 1. Header: Chữ bớt đậm, gọn gàng, bỏ iSSAC-VNU */}
      <div className="space-y-1 pt-1">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">
          XIN CHÀO, {currentProfile.full_name?.toUpperCase() || 'NGUYỄN HÀ PHƯƠNG'}!
        </h1>
        <p className="text-slate-500 text-sm font-medium">
          Chào mừng bạn đến với hành trình Gen 3
        </p>
      </div>

      {/* 2. Bộ 3 thẻ thống kê trên cùng: Tinh gọn, bỏ hoàn toàn icon to */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Thẻ 1: Ban ứng tuyển */}
        <div className="bg-white border-2 border-blue-200 hover:border-blue-300 shadow-xs transition-all rounded-2xl p-5 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-600 to-indigo-600" />
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Ban ứng tuyển</div>
          <div className="text-xl font-bold text-slate-900 mt-1 truncate">
            {deptName}
          </div>
          <div className="mt-2.5">
            <span className="inline-flex items-center text-xs font-bold text-amber-900 bg-amber-100 border border-amber-300 px-2.5 py-0.5 rounded-md">
              Nguyện vọng 1 (NV1)
            </span>
          </div>
        </div>

        {/* Thẻ 2: Vòng hiện tại */}
        <div className="bg-white border-2 border-amber-200 hover:border-amber-300 shadow-xs transition-all rounded-2xl p-5 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-400 to-amber-500" />
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Vòng hiện tại</div>
          <div className="text-xl font-bold text-blue-700 mt-1">
            Vòng 5 / 5
          </div>
          <div className="mt-2.5">
            <span className="inline-flex items-center text-xs font-bold text-blue-900 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-md">
              Công bố kết quả chính thức
            </span>
          </div>
        </div>

        {/* Thẻ 3: Trạng thái */}
        <div className="bg-white border-2 border-emerald-200 hover:border-emerald-300 shadow-xs transition-all rounded-2xl p-5 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 to-teal-500" />
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Trạng thái hồ sơ</div>
          <div className="text-xl font-bold text-emerald-800 mt-1 flex items-center gap-1.5">
            <span>Đã phỏng vấn</span>
            <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-black">
              ✓
            </span>
          </div>
          <div className="mt-2.5">
            <span className="inline-flex items-center text-xs font-bold text-emerald-900 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-md">
              Hội đồng đã hoàn tất chấm
            </span>
          </div>
        </div>
      </div>

      {/* 3. Section: HÀNH TRÌNH GIA NHẬP iSSAC (Đậm đà, nổi bật, phong cách CLB) */}
      <div className="bg-white border-2 border-blue-100 shadow-sm rounded-3xl overflow-hidden">
        {/* Header băng rôn Xanh Navy sang trọng */}
        <div className="py-4 px-6 bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 text-white flex flex-row items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="text-sm font-bold uppercase tracking-wider text-white">
              HÀNH TRÌNH GIA NHẬP iSSAC
            </span>
          </div>
          <span className="text-xs font-extrabold text-slate-950 bg-gradient-to-r from-amber-300 to-amber-400 px-3 py-1 rounded-full shadow-sm">
            Thời gian thực
          </span>
        </div>

        <div className="p-6 sm:p-8 bg-gradient-to-b from-blue-50/20 to-white">
          <div className="relative">
            {/* Thanh ray nối giữa các chặng */}
            <div className="absolute top-5 left-10 right-10 h-1.5 bg-slate-200 hidden sm:block z-0 rounded-full" />
            <div className="absolute top-5 left-10 right-10 h-1.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-amber-500 hidden sm:block z-0 rounded-full shadow-xs" style={{ width: '85%' }} />

            <div className="grid grid-cols-5 gap-2 relative z-10 text-center">
              {journeySteps.map((step) => {
                const isDone = step.status === 'done'
                const isActive = step.status === 'active'

                return (
                  <div key={step.id} className="flex flex-col items-center space-y-2">
                    {/* Circle Node: Nổi bật với hiệu ứng đổ bóng & vòng sáng */}
                    <div className={`w-11 h-11 rounded-full flex items-center justify-center text-sm font-black transition-all ${
                      isDone
                        ? 'bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-md shadow-blue-200 ring-4 ring-blue-100'
                        : isActive
                        ? 'bg-gradient-to-br from-amber-400 to-amber-500 text-slate-950 font-black shadow-lg shadow-amber-300 ring-4 ring-amber-200 scale-110'
                        : 'bg-white border-2 border-slate-300 text-slate-400'
                    }`}>
                      {isDone ? (
                        <Check className="w-5 h-5 stroke-[3]" />
                      ) : (
                        <span>{step.id}</span>
                      )}
                    </div>

                    {/* Step Title: 1 font chữ duy nhất */}
                    <div>
                      <div className={`text-xs sm:text-sm font-extrabold ${
                        isDone ? 'text-slate-900' : isActive ? 'text-amber-800' : 'text-slate-400'
                      }`}>
                        {step.name}
                      </div>
                      <div className="text-[11px] font-medium text-slate-500 hidden sm:block">
                        {step.desc}
                      </div>
                    </div>

                    {/* Badge trạng thái */}
                    <div>
                      {isDone ? (
                        <span className="inline-flex items-center text-xs font-bold text-blue-800 bg-blue-100 px-2.5 py-0.5 rounded-full border border-blue-200 shadow-2xs">
                          ✓ Hoàn thành
                        </span>
                      ) : isActive ? (
                        <span className="inline-flex items-center text-xs font-black text-amber-950 bg-amber-200 px-2.5 py-0.5 rounded-full border border-amber-400 shadow-xs animate-pulse">
                          ● Đã mở xem
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-xs text-slate-400 font-semibold">
                          ○ Chờ xét
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* 4. Hai khối thông tin trọng tâm: Màu sắc đậm đà, không mờ nhạt */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {/* Khối Trái: THÔNG TIN ỨNG TUYỂN (Xanh Dương Chủ Đạo) */}
        <div className="bg-white border-2 border-blue-100 shadow-sm hover:shadow-md transition-all rounded-3xl overflow-hidden flex flex-col justify-between">
          <div>
            <div className="py-3.5 px-5 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100 flex items-center justify-between">
              <div className="text-xs font-bold uppercase tracking-wider text-blue-900">
                THÔNG TIN ỨNG TUYỂN
              </div>
            </div>

            <div className="p-5 space-y-3.5 text-xs sm:text-sm">
              <div className="flex items-center justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500 font-semibold">Ban đăng ký:</span>
                <span className="font-extrabold text-slate-900 text-sm">{deptName}</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500 font-semibold">Nguyện vọng:</span>
                <span className="inline-flex items-center bg-amber-100 text-amber-900 border border-amber-300 font-bold text-xs px-2.5 py-0.5 rounded-md">
                  NV1 Chính thức
                </span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500 font-semibold">Mã đơn ứng tuyển:</span>
                <span className="font-bold text-slate-800">#app-01 · 01/09/2026</span>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="text-slate-500 font-semibold">Hồ sơ đính kèm:</span>
                <span className="text-emerald-700 font-extrabold flex items-center gap-1 bg-emerald-50 px-2.5 py-0.5 rounded-lg border border-emerald-200">
                  <Check className="w-3.5 h-3.5 stroke-[3]" /> Đã nộp CV & Portfolio
                </span>
              </div>
            </div>
          </div>

          <div className="p-3.5 bg-blue-50/70 border-t border-blue-100 text-right">
            <Link
              href="/member/application"
              className="inline-flex items-center gap-1.5 text-xs font-black text-blue-700 hover:text-blue-900 transition-colors"
            >
              Xem lại câu trả lời đơn ứng tuyển
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Khối Phải: LỊCH PHỎNG VẤN (Vàng & Xanh Phối Hợp) */}
        <div className="bg-white border-2 border-amber-100 shadow-sm hover:shadow-md transition-all rounded-3xl overflow-hidden flex flex-col justify-between">
          <div>
            <div className="py-3.5 px-5 bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-100 flex items-center justify-between">
              <div className="text-xs font-bold uppercase tracking-wider text-amber-950">
                LỊCH PHỎNG VẤN
              </div>
            </div>

            <div className="p-5 space-y-3.5 text-xs sm:text-sm">
              <div className="flex items-center justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500 font-semibold">Giờ phỏng vấn:</span>
                <span className="font-extrabold text-blue-800 text-sm">
                  {currentInterview?.interview_slots?.start_time || '08:30'} (Sáng)
                </span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500 font-semibold">Ngày phỏng vấn:</span>
                <span className="font-extrabold text-slate-900">
                  {currentInterview?.interview_slots?.interview_date ? formatDate(currentInterview.interview_slots.interview_date) : '12/09/2026'}
                </span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500 font-semibold">Địa điểm:</span>
                <span className="text-slate-800 font-medium text-right truncate max-w-[210px]" title={currentInterview?.interview_slots?.location}>
                  Phòng Hội đồng 302, Nhà C (HACINCO)
                </span>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="text-slate-500 font-semibold">Hình thức:</span>
                <span className="text-slate-800 font-extrabold">Phỏng vấn trực tiếp (Offline)</span>
              </div>
            </div>
          </div>

          <div className="p-3.5 bg-emerald-50/70 border-t border-emerald-100 text-right">
            <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-emerald-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Đã hoàn thành ca phỏng vấn
            </span>
          </div>
        </div>
      </div>

      {/* 5. THÔNG BÁO TỪ iSSAC & NÚT ẤN ĐỂ XEM KẾT QUẢ (Nền Xanh Hoàng Gia & Nút Vàng iSSAC) */}
      <div className="relative rounded-3xl bg-gradient-to-br from-[#0c326f] via-[#124ba4] to-[#0a2757] text-white p-6 sm:p-8 shadow-xl border-2 border-amber-400/40 overflow-hidden">
        {/* Vầng sáng vàng ấm áp */}
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-60 h-60 rounded-full bg-amber-400/20 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-10 -mb-10 w-48 h-48 rounded-full bg-blue-400/15 blur-2xl pointer-events-none" />

        <div className="relative z-10 space-y-4">
          <div className="flex items-center justify-between border-b border-white/20 pb-3">
            <div className="text-xs font-bold uppercase tracking-wider text-amber-300">
              THÔNG BÁO TỪ BAN CHỦ NHIỆM CLB iSSAC
            </div>
            <span className="bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 text-[11px] font-black px-3 py-0.5 rounded-full shadow-sm">
              Hộp thư kết quả
            </span>
          </div>

          <div className="space-y-3 text-xs sm:text-sm text-blue-50 leading-relaxed w-full">
            <p className="font-bold text-white text-base">
              Thân gửi bạn {currentProfile.full_name},
            </p>
            <p className="text-blue-100 font-normal leading-relaxed text-justify">
              Trước tiên, Câu lạc bộ Đại sứ Sinh viên Trường Quốc tế - ĐHQGHN (iSSAC) xin gửi lời cảm ơn chân thành nhất đến bạn vì đã dành thời gian, sự quan tâm và nhiệt huyết tham gia đợt tuyển quân Gen 3.
            </p>
            <p className="text-blue-100 font-normal leading-relaxed text-justify">
              Dù kết quả như thế nào thì hy vọng bạn vẫn sẽ luôn theo dõi, ủng hộ và đồng hành cùng CLB trong các hoạt động sắp tới nhé!
            </p>
          </div>

          {/* Hộp nút mở kết quả màu vàng iSSAC - Bố cục sang trọng, không dùng icon */}
          <div className="pt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-5 rounded-2xl bg-white/10 border border-white/20 backdrop-blur-md shadow-inner">
            <div className="flex items-center gap-3">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse shrink-0" />
              <div>
                <div className="text-sm font-black text-white">
                  Kết quả xét tuyển chính thức đã sẵn sàng!
                </div>
                <div className="text-xs text-blue-200 font-medium">
                  Hội đồng tuyển sinh đã hoàn tất phê duyệt quyết định.
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleOpenResult}
              className="w-full sm:w-auto inline-flex items-center justify-center px-7 py-3 rounded-xl bg-[#fdc455] hover:bg-[#f59e0b] text-slate-950 font-black text-sm shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer shrink-0"
            >
              Ấn để xem kết quả
            </button>
          </div>
        </div>
      </div>

      {/* 6. MODAL BẤT NGỜ: THƯ CHÚC MỪNG KẾT QUẢ XÉT TUYỂN (SANG TRỌNG, BỐ CỤC RÕ RÀNG, KHÔNG DÙNG ICON) */}
      <Dialog open={showResultModal} onOpenChange={setShowResultModal}>
        <DialogContent className="max-w-lg p-0 bg-white rounded-3xl border-2 border-[#1657c1]/20 shadow-2xl overflow-hidden font-sans">
          {/* Header Banner trang trọng */}
          <div className="bg-gradient-to-br from-[#0d3b82] via-[#1657c1] to-[#0a2550] p-6 text-white text-center space-y-2 relative">
            <div className="text-[11px] uppercase tracking-widest text-blue-200 font-bold">
              Câu lạc bộ Đại sứ Sinh viên - Trường Quốc tế, ĐHQGHN
            </div>
            <DialogTitle className="text-xl sm:text-2xl font-black text-white tracking-tight">
              THƯ CHÚC MỪNG TRÚNG TUYỂN
            </DialogTitle>
            <div className="pt-1">
              <span className="inline-block px-4 py-1 rounded-full text-xs font-black bg-[#fdc455] text-slate-950 uppercase tracking-wider shadow-sm">
                Chính thức trúng tuyển
              </span>
            </div>
          </div>

          <div className="p-6 sm:p-7 space-y-5 text-slate-800">
            {/* Lời chúc mừng cá nhân hóa */}
            <div className="text-center space-y-1.5">
              <p className="text-xs sm:text-sm text-slate-500 font-medium">
                Hội đồng Tuyển sinh iSSAC trân trọng chúc mừng ứng viên
              </p>
              <div className="text-xl sm:text-2xl font-black text-[#1657c1]">
                {currentProfile.full_name}
              </div>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-md mx-auto pt-1">
                Bạn đã xuất sắc vượt qua các vòng tuyển chọn và chính thức trở thành{" "}
                <strong className="text-slate-900 font-bold">Đại sứ Sinh viên Gen 3</strong>.
              </p>
            </div>

            {/* Bảng thông tin phân bổ ban chuyên môn - Rõ ràng, sang trọng */}
            <div className="rounded-2xl border-2 border-slate-200/90 bg-slate-50/70 p-4 space-y-2.5">
              <div className="flex items-center justify-between border-b border-slate-200/80 pb-2 text-xs sm:text-sm">
                <span className="text-slate-500 font-medium">Ban trúng tuyển</span>
                <strong className="text-[#1657c1] font-bold text-sm sm:text-base">{deptName}</strong>
              </div>
              <div className="flex items-center justify-between border-b border-slate-200/80 pb-2 text-xs sm:text-sm">
                <span className="text-slate-500 font-medium">Tư cách thành viên</span>
                <strong className="text-slate-900 font-bold">Đại sứ Sinh viên chính thức</strong>
              </div>
              <div className="flex items-center justify-between text-xs sm:text-sm">
                <span className="text-slate-500 font-medium">Nhiệm kỳ hoạt động</span>
                <span className="text-amber-950 font-black bg-amber-100 border border-amber-300 px-3 py-0.5 rounded-md text-xs">
                  2026 - 2027
                </span>
              </div>
            </div>

            {/* Thông điệp từ BCN */}
            <div className="rounded-xl border-l-4 border-[#1657c1] bg-blue-50/60 p-3.5 text-xs text-slate-700 leading-relaxed">
              <p className="italic">
                "Chào mừng bạn chính thức gia nhập đại gia đình iSSAC. Hẹn gặp bạn tại buổi First Meeting & Lễ ra mắt Ban để cùng nhau khởi đầu một nhiệm kỳ rực rỡ và bứt phá!"
              </p>
              <div className="text-right font-bold text-[#1657c1] text-[11px] mt-1.5 not-italic">
                - Ban Chủ nhiệm iSSAC
              </div>
            </div>

            {/* Hàng nút hành động - Không dùng icon */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Link href="/member/result" className="flex-1">
                <button
                  type="button"
                  className="w-full py-3 px-5 rounded-xl bg-[#fdc455] hover:bg-[#f59e0b] text-slate-950 font-black text-xs sm:text-sm shadow-md transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer text-center"
                >
                  Xem chi tiết thư kết quả
                </button>
              </Link>
              <button
                type="button"
                onClick={() => setShowResultModal(false)}
                className="py-3 px-6 rounded-xl border-2 border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-xs sm:text-sm transition-all cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
