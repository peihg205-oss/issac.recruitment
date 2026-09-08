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
  ShieldCheck, Layers, ArrowUpRight, Compass, Send
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

  // 5 Steps of the recruitment journey matching user's wireframe
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
      {/* 1. Header Card: Executive & Clean (No AI cliché blob) */}
      <div className="relative bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-7 shadow-[0_2px_12px_rgba(0,0,0,0.03)] overflow-hidden">
        {/* Subtle accent bar at the top */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-700 via-indigo-600 to-amber-500" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-blue-50 border border-blue-200 text-blue-800 text-[11px] font-bold tracking-wide uppercase">
                <Compass className="w-3.5 h-3.5 text-blue-600" />
                CLB Đại sứ Sinh viên VNU-IS (iSSAC)
              </span>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs font-semibold text-slate-500">
                Kỳ Tuyển quân Gen 10 · Nhiệm kỳ 2026 - 2027
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Xin chào, {currentProfile.full_name}! 👋
            </h1>

            <p className="text-slate-600 text-xs sm:text-sm font-medium">
              Chào mừng bạn đến với hành trình Gen 10. MSSV:{' '}
              <span className="font-mono font-bold text-slate-800">{currentProfile.student_id || '22070142'}</span> ·{' '}
              {currentProfile.major || 'Hệ thống thông tin quản lý (MIS)'} ({currentProfile.cohort || 'K22'})
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
            <div className="px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-right">
              <div className="text-[10px] uppercase font-bold text-slate-400">Trạng thái cổng</div>
              <div className="text-xs font-bold text-emerald-700 flex items-center justify-end gap-1.5 mt-0.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Đang mở tra cứu
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Three Metric Cards: [Ban] [Vòng hiện tại] [Trạng thái] strictly adhering to wireframe */}
      {/* Zero rank or score displayed here, keeping it clean and suspenseful */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Card 1: Ban */}
        <Card className="bg-white border border-slate-200/90 shadow-[0_2px_8px_rgba(0,0,0,0.03)] hover:border-blue-300 transition-all rounded-2xl">
          <CardContent className="p-5 flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 text-blue-700 flex items-center justify-center shrink-0 mt-0.5">
              <Building2 className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-semibold text-slate-500">Ban ứng tuyển</div>
              <div className="text-base sm:text-lg font-black text-slate-900 mt-0.5 truncate">
                {deptName}
              </div>
              <div className="text-[11px] text-slate-400 font-medium">Nguyện vọng 1 (NV1)</div>
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Vòng hiện tại */}
        <Card className="bg-white border border-slate-200/90 shadow-[0_2px_8px_rgba(0,0,0,0.03)] hover:border-indigo-300 transition-all rounded-2xl">
          <CardContent className="p-5 flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-700 flex items-center justify-center shrink-0 mt-0.5">
              <Layers className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-semibold text-slate-500">Vòng hiện tại</div>
              <div className="text-base sm:text-lg font-black text-blue-700 mt-0.5 flex items-center gap-1.5 font-mono">
                <span>Vòng 5 / 5</span>
              </div>
              <div className="text-[11px] text-slate-400 font-medium">Công bố kết quả chính thức</div>
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Trạng thái */}
        <Card className="bg-white border border-slate-200/90 shadow-[0_2px_8px_rgba(0,0,0,0.03)] hover:border-emerald-300 transition-all rounded-2xl">
          <CardContent className="p-5 flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-semibold text-slate-500">Trạng thái hồ sơ</div>
              <div className="text-base sm:text-lg font-black text-emerald-800 mt-0.5 flex items-center gap-1.5">
                <span>Đã phỏng vấn</span>
                <Check className="w-4 h-4 text-emerald-600 stroke-[3]" />
              </div>
              <div className="text-[11px] text-emerald-600 font-medium">Hội đồng đã hoàn tất chấm</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 3. Section: HÀNH TRÌNH GIA NHẬP iSSAC (Modern 5-Node Stepper) */}
      <Card className="bg-white border border-slate-200/90 shadow-[0_2px_8px_rgba(0,0,0,0.03)] rounded-2xl overflow-hidden">
        <CardHeader className="py-4 px-6 border-b border-slate-100 bg-slate-50/50 flex flex-row items-center justify-between">
          <CardTitle className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-600" />
            HÀNH TRÌNH GIA NHẬP iSSAC
          </CardTitle>
          <span className="text-[11px] font-bold text-slate-500 bg-slate-200/60 px-2.5 py-0.5 rounded-full">
            Thời gian thực
          </span>
        </CardHeader>
        <CardContent className="p-6 sm:p-8">
          <div className="relative">
            {/* Horizontal Track line */}
            <div className="absolute top-5 left-8 right-8 h-1 bg-slate-100 hidden sm:block z-0" />
            <div className="absolute top-5 left-8 right-8 h-1 bg-emerald-500 hidden sm:block z-0 transition-all" style={{ width: '85%' }} />

            <div className="grid grid-cols-5 gap-2 relative z-10 text-center">
              {journeySteps.map((step) => {
                const isDone = step.status === 'done'
                const isActive = step.status === 'active'

                return (
                  <div key={step.id} className="flex flex-col items-center space-y-2 group">
                    {/* Circle Node */}
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                      isDone
                        ? 'bg-emerald-600 text-white shadow-sm ring-4 ring-emerald-50'
                        : isActive
                        ? 'bg-blue-600 text-white shadow-md ring-4 ring-blue-100 scale-105'
                        : 'bg-white border-2 border-slate-300 text-slate-400'
                    }`}>
                      {isDone ? (
                        <Check className="w-4 h-4 stroke-[3]" />
                      ) : (
                        <span className="font-mono text-sm font-black">{step.id}</span>
                      )}
                    </div>

                    {/* Step Title: Hồ sơ, Đơn, PV, Đánh giá, Kết quả */}
                    <div>
                      <div className={`text-xs sm:text-sm font-bold ${
                        isDone ? 'text-slate-900' : isActive ? 'text-blue-700' : 'text-slate-400'
                      }`}>
                        {step.name}
                      </div>
                      <div className="text-[10px] text-slate-400 hidden sm:block">
                        {step.desc}
                      </div>
                    </div>

                    {/* Real-time status symbol */}
                    <div>
                      {isDone ? (
                        <span className="inline-flex items-center text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          ✓ Hoàn thành
                        </span>
                      ) : isActive ? (
                        <span className="inline-flex items-center text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200 animate-pulse">
                          ● Đã mở xem
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-xs text-slate-400 font-bold">
                          ○ Chờ xét
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 4. Two Information Cards: [THÔNG TIN ỨNG TUYỂN] [LỊCH PHỎNG VẤN] */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {/* Card Left: THÔNG TIN ỨNG TUYỂN */}
        <Card className="bg-white border border-slate-200/90 shadow-[0_2px_8px_rgba(0,0,0,0.03)] hover:border-slate-300 transition-all rounded-2xl overflow-hidden flex flex-col justify-between">
          <div>
            <CardHeader className="py-3.5 px-5 border-b border-slate-100 bg-slate-50/50">
              <CardTitle className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-600" />
                THÔNG TIN ỨNG TUYỂN
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-3 text-xs sm:text-sm">
              <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Ban đăng ký:</span>
                <span className="font-bold text-slate-900">{deptName}</span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Nguyện vọng:</span>
                <Badge className="bg-blue-50 text-blue-700 border-blue-200 font-bold text-[11px] px-2 py-0.5">
                  Nguyện vọng 1 (NV1)
                </Badge>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Mã đơn ứng tuyển:</span>
                <span className="font-mono font-semibold text-slate-700">#app-01 · 01/09/2026</span>
              </div>
              <div className="flex items-center justify-between py-1.5">
                <span className="text-slate-500 font-medium">Hồ sơ đính kèm:</span>
                <span className="text-emerald-700 font-semibold flex items-center gap-1">
                  <Check className="w-3.5 h-3.5 stroke-[3]" /> Đã nộp CV & Portfolio
                </span>
              </div>
            </CardContent>
          </div>

          <div className="p-4 bg-slate-50 border-t border-slate-100 text-right">
            <Link
              href="/member/application"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-700 hover:text-blue-900 transition-colors"
            >
              Xem lại câu trả lời đơn ứng tuyển
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </Card>

        {/* Card Right: LỊCH PHỎNG VẤN */}
        <Card className="bg-white border border-slate-200/90 shadow-[0_2px_8px_rgba(0,0,0,0.03)] hover:border-slate-300 transition-all rounded-2xl overflow-hidden flex flex-col justify-between">
          <div>
            <CardHeader className="py-3.5 px-5 border-b border-slate-100 bg-slate-50/50">
              <CardTitle className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-600" />
                LỊCH PHỎNG VẤN
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-3 text-xs sm:text-sm">
              <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Giờ phỏng vấn:</span>
                <span className="font-mono font-bold text-blue-900 text-sm">
                  {currentInterview?.interview_slots?.start_time || '08:30'}
                </span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Ngày phỏng vấn:</span>
                <span className="font-semibold text-slate-900 font-mono">
                  {currentInterview?.interview_slots?.interview_date ? formatDate(currentInterview.interview_slots.interview_date) : '12/09/2026'}
                </span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Địa điểm:</span>
                <span className="text-slate-700 text-right truncate max-w-[200px]" title={currentInterview?.interview_slots?.location}>
                  Phòng Hội đồng 302, Nhà C (HACINCO)
                </span>
              </div>
              <div className="flex items-center justify-between py-1.5">
                <span className="text-slate-500 font-medium">Hình thức:</span>
                <span className="text-slate-700 font-semibold">Phỏng vấn trực tiếp (Offline)</span>
              </div>
            </CardContent>
          </div>

          <div className="p-4 bg-slate-50 border-t border-slate-100 text-right">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Đã hoàn thành ca phỏng vấn
            </span>
          </div>
        </Card>
      </div>

      {/* 5. Section: THÔNG BÁO TỪ iSSAC & NÚT ẤN ĐỂ XEM KẾT QUẢ BẤT NGỜ */}
      <div className="relative rounded-2xl bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white p-6 sm:p-7 shadow-lg border border-slate-800 overflow-hidden">
        {/* Decorative corner glow */}
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-48 h-48 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-300">
              <Mail className="w-4 h-4 text-amber-400" />
              THÔNG BÁO TỪ BAN CHỦ NHIỆM CLB iSSAC
            </div>
            <Badge className="bg-amber-400/20 text-amber-300 border-amber-400/30 text-[10px] font-bold">
              Thư gửi ứng viên
            </Badge>
          </div>

          <div className="space-y-2.5 text-xs sm:text-sm text-slate-200 leading-relaxed max-w-3xl">
            <p className="font-semibold text-white">
              Thân gửi bạn {currentProfile.full_name},
            </p>
            <p className="text-slate-300">
              Trước tiên, Câu lạc bộ Đại sứ Sinh viên Trường Quốc tế — ĐHQGHN (iSSAC) xin gửi lời cảm ơn chân thành nhất đến bạn vì đã dành thời gian, sự quan tâm và nhiệt huyết tham gia đợt tuyển quân Gen 10.
            </p>
            <p className="text-slate-300">
              Dù kết quả như thế nào thì hy vọng bạn vẫn sẽ luôn theo dõi, ủng hộ và đồng hành cùng CLB trong các hoạt động sắp tới nhé! ✨
            </p>
          </div>

          {/* Interactive Reveal Button Box */}
          <div className="pt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-white/10 border border-white/15 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-400/20 border border-amber-400/30 text-amber-300 flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <div className="text-xs sm:text-sm font-bold text-white">
                  Kết quả xét tuyển chính thức đã có!
                </div>
                <div className="text-[11px] text-slate-300">
                  Hội đồng tuyển sinh đã hoàn tất phê duyệt quyết định.
                </div>
              </div>
            </div>

            <Button
              onClick={handleOpenResult}
              variant="gold"
              className="w-full sm:w-auto font-black text-xs sm:text-sm px-6 py-2.5 gap-2 shadow-md hover:scale-[1.02] active:scale-[0.98] transition-transform cursor-pointer"
            >
              <Eye className="w-4 h-4" />
              Ấn để xem kết quả
            </Button>
          </div>
        </div>
      </div>

      {/* 6. MODAL BẤT NGỜ: THƯ CHÚC MỪNG TRÚNG TUYỂN */}
      <Dialog open={showResultModal} onOpenChange={setShowResultModal}>
        <DialogContent className="max-w-md p-6 sm:p-7 bg-white rounded-3xl border border-slate-200 shadow-2xl">
          <DialogHeader className="text-center space-y-3 pb-1">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center shadow-md">
              <PartyPopper className="w-9 h-9 text-emerald-700" />
            </div>

            <div className="space-y-1">
              <div className="text-[11px] uppercase tracking-widest text-emerald-800 font-bold">
                Trường Quốc tế — ĐHQGHN
              </div>
              <DialogTitle className="text-xl sm:text-2xl font-black text-slate-900 text-center">
                🎉 XIN CHÚC MỪNG BẠN!
              </DialogTitle>
            </div>
          </DialogHeader>

          <div className="space-y-4 py-3 text-center text-xs sm:text-sm text-slate-700 leading-relaxed">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-emerald-100 text-emerald-900 font-black text-xs border border-emerald-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-700" />
              KẾT QUẢ: TRÚNG TUYỂN (PASS)
            </div>

            <p className="font-medium text-slate-800">
              Chúc mừng bạn <strong className="text-emerald-900 font-bold">{currentProfile.full_name}</strong> đã xuất sắc vượt qua các vòng đánh giá và chính thức trở thành{' '}
              <strong className="text-slate-900">Thành viên CLB Đại sứ Sinh viên VNU-IS (iSSAC)</strong>!
            </p>

            <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200/90 text-left space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-emerald-800 font-medium">Ban trúng tuyển:</span>
                <strong className="text-emerald-950 font-bold">{deptName}</strong>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-emerald-800 font-medium">Tư cách thành viên:</span>
                <strong className="text-emerald-950 font-bold">Đại sứ Sinh viên Gen 10</strong>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-emerald-800 font-medium">Nhiệm kỳ hoạt động:</span>
                <span className="text-emerald-900 font-semibold">2026 - 2027</span>
              </div>
            </div>

            <p className="text-xs text-slate-500 italic">
              "Chào mừng bạn gia nhập gia đình iSSAC. Hẹn gặp bạn tại buổi First Meeting & Lễ ra mắt Ban để cùng nhau bắt đầu một nhiệm kỳ rực rỡ!"
            </p>
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-3 border-t border-slate-100">
            <Link href="/member/result" className="w-full sm:flex-1">
              <Button variant="gold" className="w-full font-bold text-xs gap-1.5 shadow-sm">
                <Trophy className="w-3.5 h-3.5" /> Xem chi tiết thư kết quả
              </Button>
            </Link>
            <Button
              variant="outline"
              onClick={() => setShowResultModal(false)}
              className="w-full sm:w-auto text-xs font-semibold"
            >
              Đóng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
