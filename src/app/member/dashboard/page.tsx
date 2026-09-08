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
  ChevronRight, User, Sparkles, Building, MapPin,
  ExternalLink, Mail, Check, Eye, Heart, PartyPopper,
  AlertCircle
} from 'lucide-react'
import { formatDate, formatFullTimestamp } from '@/lib/utils'
import { MOCK_CANDIDATES } from '@/lib/mock-data'

interface StepItem {
  number: number
  title: string
  sublabel: string
  status: 'done' | 'current' | 'waiting'
}

export default function MemberDashboardPage() {
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<any>(null)
  const [application, setApplication] = useState<any>(null)
  const [interview, setInterview] = useState<any>(null)
  const [finalResult, setFinalResult] = useState<any>(null)
  const [resultsPublished, setResultsPublished] = useState(true)
  const [showResultModal, setShowResultModal] = useState(false)
  const [hasViewedResult, setHasViewedResult] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        const [{ data: prof }, { data: app }, { data: iv }, { data: fr }, { data: setts }] = await Promise.all([
          supabase.from('profiles').select('*, departments(name, color)').eq('id', user.id).single(),
          supabase.from('applications').select('*, departments!applications_department_id_fkey(name, color, slug)').eq('user_id', user.id).limit(1).single(),
          supabase.from('interviews').select('*, interview_slots(*)').eq('user_id', user.id).limit(1).single(),
          supabase.from('final_results').select('*').eq('user_id', user.id).single(),
          supabase.from('system_settings').select('key, value').eq('key', 'results_published').single()
        ])

        if (prof) setProfile(prof)
        if (app) setApplication(app)
        if (iv) setInterview(iv)
        if (fr) setFinalResult(fr)
        if (setts) setResultsPublished(setts.value === 'true')
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

  // Fallback demo applicant: Nguyen Ha Phuong
  const currentProfile = profile || {
    full_name: MOCK_CANDIDATES[0].profiles.full_name,
    student_id: MOCK_CANDIDATES[0].profiles.student_id,
    email: MOCK_CANDIDATES[0].profiles.email,
    phone: MOCK_CANDIDATES[0].profiles.phone,
    university: MOCK_CANDIDATES[0].profiles.university,
    major: MOCK_CANDIDATES[0].profiles.major,
    cohort: MOCK_CANDIDATES[0].profiles.cohort,
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
    announcement_message: 'Chúc mừng bạn đã xuất sắc vượt qua các vòng đánh giá tuyển chọn và chính thức trở thành Thành viên CLB Đại sứ Sinh viên VNU-IS (iSSAC) - Ban Truyền thông Gen 10!',
  }

  const deptName = currentApp?.departments?.name || 'Ban Truyền thông'
  const isPassed = currentFinalResult?.result === 'pass'

  // 5 Journey Steps matching wireframe:
  // (1) Hồ sơ  (2) Đơn  (3) PV  (4) Đánh giá  (5) Kết quả
  const steps: StepItem[] = [
    { number: 1, title: 'Hồ sơ', sublabel: 'Đã tạo hồ sơ', status: 'done' },
    { number: 2, title: 'Đơn', sublabel: 'Đã nộp đơn', status: 'done' },
    { number: 3, title: 'PV', sublabel: 'Đã phỏng vấn', status: 'done' },
    { number: 4, title: 'Đánh giá', sublabel: 'Hoàn tất chấm', status: 'done' },
    { number: 5, title: 'Kết quả', sublabel: 'Chờ xem kết quả', status: hasViewedResult ? 'done' : 'current' },
  ]

  const handleOpenResult = () => {
    setShowResultModal(true)
    setHasViewedResult(true)
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-fade-in pb-12">
      {/* 1. Header: Greeting matching wireframe */}
      <div className="space-y-1">
        <h1 className="text-xl sm:text-2xl font-black text-gray-900 flex items-center gap-2">
          XIN CHÀO, {currentProfile.full_name?.toUpperCase()} 👋
        </h1>
        <p className="text-gray-500 text-sm font-medium">
          Chào mừng bạn đến với hành trình Gen 10 — CLB Đại sứ Sinh viên VNU-IS (iSSAC)
        </p>
      </div>

      {/* 2. Top 3 Cards matching wireframe: [Ban] [Vòng hiện tại] [Trạng thái] */}
      {/* Notice: No rank or score exposed here! Clean and suspenseful */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Card 1: Ban */}
        <Card className="border shadow-xs bg-white hover:border-blue-200 transition-colors">
          <CardContent className="p-4">
            <div className="text-xs text-gray-500 font-medium">Ban ứng tuyển</div>
            <div className="text-lg font-bold text-gray-900 mt-1">
              {deptName}
            </div>
            <div className="text-[11px] text-gray-400 mt-0.5">Nguyện vọng 1 (NV1)</div>
          </CardContent>
        </Card>

        {/* Card 2: Vòng hiện tại */}
        <Card className="border shadow-xs bg-white hover:border-blue-200 transition-colors">
          <CardContent className="p-4">
            <div className="text-xs text-gray-500 font-medium">Vòng hiện tại</div>
            <div className="text-lg font-bold text-blue-700 mt-1 flex items-center gap-1.5 font-mono">
              <span>5/5</span>
              <span className="text-xs font-semibold text-gray-500 font-sans">(Công bố kết quả)</span>
            </div>
            <div className="text-[11px] text-gray-400 mt-0.5">Vòng tuyển chọn cuối cùng</div>
          </CardContent>
        </Card>

        {/* Card 3: Trạng thái */}
        <Card className="border shadow-xs bg-white hover:border-blue-200 transition-colors">
          <CardContent className="p-4">
            <div className="text-xs text-gray-500 font-medium">Trạng thái</div>
            <div className="text-lg font-bold text-emerald-700 mt-1 flex items-center gap-1.5">
              <span>Đã phỏng vấn</span>
              <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-xs font-black">
                ✓
              </span>
            </div>
            <div className="text-[11px] text-emerald-600 font-medium mt-0.5">
              Hội đồng đã hoàn tất chấm điểm
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 3. Section: HÀNH TRÌNH GIA NHẬP iSSAC (5-step process) */}
      <Card className="border shadow-xs bg-white overflow-hidden">
        <CardHeader className="py-3.5 px-5 border-b bg-gray-50/70">
          <CardTitle className="text-xs font-black uppercase tracking-wider text-gray-700 flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-600" />
            HÀNH TRÌNH GIA NHẬP iSSAC
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="relative">
            {/* Connecting line */}
            <div className="absolute top-4 left-6 right-6 h-0.5 bg-gray-200 hidden sm:block -z-0" />
            
            <div className="grid grid-cols-5 gap-2 relative z-10 text-center">
              {steps.map((step) => {
                const isDone = step.status === 'done'
                const isCurrent = step.status === 'current'
                return (
                  <div key={step.number} className="flex flex-col items-center space-y-1.5">
                    {/* Circle Node: 1, 2, 3, 4, 5 */}
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                      isDone
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : isCurrent
                        ? 'bg-blue-600 text-white ring-4 ring-blue-100 shadow-xs animate-pulse'
                        : 'bg-white border-2 border-gray-300 text-gray-500'
                    }`}>
                      {isDone ? '✓' : step.number}
                    </div>

                    {/* Step Title matching wireframe: Hồ sơ, Đơn, PV, Đánh giá, Kết quả */}
                    <div className="text-xs sm:text-sm font-bold text-gray-900">
                      {step.title}
                    </div>

                    {/* Symbol indicator: ✓, ●, ○ */}
                    <div className="text-xs">
                      {isDone ? (
                        <span className="text-emerald-600 font-bold">✓</span>
                      ) : isCurrent ? (
                        <span className="text-blue-600 font-bold text-sm">●</span>
                      ) : (
                        <span className="text-gray-400 font-bold text-sm">○</span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 4. Two Information Cards matching wireframe: [THÔNG TIN ỨNG TUYỂN] [LỊCH PHỎNG VẤN] */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Card Left: THÔNG TIN ỨNG TUYỂN */}
        <Card className="border shadow-xs bg-white hover:border-blue-200 transition-colors">
          <CardHeader className="py-3 px-5 border-b bg-gray-50/70">
            <CardTitle className="text-xs font-black uppercase tracking-wider text-gray-700 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-blue-600" />
              THÔNG TIN ỨNG TUYỂN
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 space-y-2 text-xs sm:text-sm">
            <div className="flex justify-between py-1 border-b border-gray-100">
              <span className="text-gray-500">Ban đăng ký:</span>
              <span className="font-bold text-gray-900">{deptName}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-gray-100">
              <span className="text-gray-500">Nguyện vọng:</span>
              <Badge className="bg-blue-50 text-blue-700 border-blue-200 font-bold text-[11px]">
                NV1 Chính thức
              </Badge>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-gray-500">Mã đơn ứng tuyển:</span>
              <span className="font-mono text-gray-700">#app-01 · 01/09/2026</span>
            </div>
            <div className="pt-2">
              <Link href="/member/application" className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:underline">
                Xem lại câu trả lời đơn ứng tuyển <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Card Right: LỊCH PHỎNG VẤN */}
        <Card className="border shadow-xs bg-white hover:border-blue-200 transition-colors">
          <CardHeader className="py-3 px-5 border-b bg-gray-50/70">
            <CardTitle className="text-xs font-black uppercase tracking-wider text-gray-700 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-blue-600" />
              LỊCH PHỎNG VẤN
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 space-y-2 text-xs sm:text-sm">
            <div className="flex justify-between py-1 border-b border-gray-100">
              <span className="text-gray-500">Giờ phỏng vấn:</span>
              <span className="font-mono font-bold text-blue-900">
                {currentInterview?.interview_slots?.start_time || '08:30'}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-gray-100">
              <span className="text-gray-500">Ngày phỏng vấn:</span>
              <span className="font-semibold text-gray-900 font-mono">
                {currentInterview?.interview_slots?.interview_date ? formatDate(currentInterview.interview_slots.interview_date) : '12/09/2026'}
              </span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-gray-500">Địa điểm:</span>
              <span className="text-gray-700 text-right truncate max-w-[180px]" title={currentInterview?.interview_slots?.location}>
                Phòng 302, Nhà C (HACINCO)
              </span>
            </div>
            <div className="pt-2">
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Đã hoàn thành ca phỏng vấn
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 5. Section: THÔNG BÁO TỪ iSSAC & NÚT ẤN ĐỂ XEM KẾT QUẢ (BẤT NGỜ) */}
      <Card className="border border-blue-100 bg-gradient-to-br from-blue-50/60 via-white to-amber-50/40 shadow-xs overflow-hidden">
        <CardHeader className="py-3.5 px-5 border-b bg-white/70">
          <CardTitle className="text-xs font-black uppercase tracking-wider text-gray-800 flex items-center gap-2">
            <Mail className="w-4 h-4 text-blue-600" />
            THÔNG BÁO TỪ HỘI ĐỒNG TUYỂN SINH iSSAC
          </CardTitle>
        </CardHeader>
        <CardContent className="p-5 sm:p-6 space-y-4">
          <div className="space-y-2 text-xs sm:text-sm text-gray-800 leading-relaxed">
            <p className="font-semibold text-gray-900">
              Thân gửi bạn {currentProfile.full_name},
            </p>
            <p className="text-gray-700">
              Trước tiên, CLB Đại sứ Sinh viên Trường Quốc tế — ĐHQGHN (iSSAC) xin gửi lời cảm ơn chân thành nhất đến bạn vì đã dành thời gian, sự quan tâm và nhiệt huyết tham gia đợt tuyển quân Gen 10.
            </p>
            <p className="text-gray-700">
              Hành trình vừa qua là cơ hội quý báu để CLB được lắng nghe những chia sẻ, câu chuyện và tài năng của bạn. Dù kết quả như thế nào thì hy vọng bạn vẫn sẽ luôn theo dõi và đồng hành cùng CLB trong các hoạt động sắp tới nhé! ✨
            </p>
          </div>

          {/* Call to action button: "Ấn để xem kết quả" for surprise */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-white border border-blue-100 shadow-2xs">
            <div className="flex items-center gap-3 text-left">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center shrink-0 shadow-2xs">
                <Sparkles className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <div className="text-xs font-bold text-gray-900">
                  Kết quả xét tuyển chính thức đã có!
                </div>
                <div className="text-[11px] text-gray-500">
                  Hội đồng tuyển sinh đã hoàn tất phê duyệt quyết định.
                </div>
              </div>
            </div>

            <Button
              onClick={handleOpenResult}
              variant="gold"
              className="w-full sm:w-auto font-black text-xs sm:text-sm px-6 py-2.5 gap-2 shadow-sm hover:scale-[1.02] transition-transform cursor-pointer"
            >
              <Eye className="w-4 h-4" />
              Ấn để xem kết quả
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 6. MODAL BẤT NGỜ: THƯ CHÚC MỪNG KẾT QUẢ XÉT TUYỂN */}
      <Dialog open={showResultModal} onOpenChange={setShowResultModal}>
        <DialogContent className="max-w-md p-6 bg-white rounded-3xl border shadow-xl">
          <DialogHeader className="text-center space-y-3 pb-2">
            {isPassed ? (
              <div className="mx-auto w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center shadow-md animate-bounce">
                <PartyPopper className="w-9 h-9 text-emerald-700" />
              </div>
            ) : (
              <div className="mx-auto w-16 h-16 rounded-2xl bg-blue-100 text-blue-800 flex items-center justify-center shadow-md">
                <Heart className="w-9 h-9 text-blue-700" />
              </div>
            )}

            <DialogTitle className="text-xl sm:text-2xl font-black text-emerald-950 text-center">
              {isPassed ? '🎉 XIN CHÚC MỪNG BẠN!' : 'THÔNG BÁO KẾT QUẢ TUYỂN SINH'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2 text-center text-xs sm:text-sm text-gray-700 leading-relaxed">
            {isPassed ? (
              <>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 font-black text-xs">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                  KẾT QUẢ: TRÚNG TUYỂN (PASS)
                </div>

                <p className="font-medium text-gray-900">
                  Chúc mừng bạn <strong className="text-emerald-900 font-bold">{currentProfile.full_name}</strong> đã xuất sắc vượt qua các vòng tuyển chọn và chính thức trở thành Thành viên của CLB Đại sứ Sinh viên VNU-IS (iSSAC)!
                </p>

                <div className="p-3.5 rounded-2xl bg-emerald-50/80 border border-emerald-200 text-left space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-emerald-800">Ban trúng tuyển:</span>
                    <strong className="text-emerald-950">{deptName}</strong>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-emerald-800">Tư cách:</span>
                    <strong className="text-emerald-950">Đại sứ Sinh viên Gen 10</strong>
                  </div>
                </div>

                <p className="text-xs text-gray-600 italic">
                  "Chào mừng bạn gia nhập gia đình iSSAC. Hẹn gặp bạn tại buổi First Meeting & Lễ ra mắt Ban để cùng nhau bắt đầu hành trình đáng nhớ!"
                </p>
              </>
            ) : (
              <p>
                Cảm ơn bạn đã tham gia ứng tuyển cùng iSSAC. Hy vọng sẽ có dịp gặp lại bạn trong những sự kiện mở sắp tới của CLB.
              </p>
            )}
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-3 border-t">
            <Link href="/member/result" className="w-full sm:flex-1">
              <Button variant="gold" className="w-full font-bold text-xs gap-1.5">
                <Trophy className="w-3.5 h-3.5" /> Xem chi tiết thư kết quả
              </Button>
            </Link>
            <Button
              variant="outline"
              onClick={() => setShowResultModal(false)}
              className="w-full sm:w-auto text-xs"
            >
              Đóng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
