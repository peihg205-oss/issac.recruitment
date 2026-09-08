'use client'
import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/use-toast'
import { 
  Loader2, ChevronRight, ChevronLeft, Send, CheckCircle2, 
  Check, AlertCircle 
} from "lucide-react"
import { APPLICATION_STATUS_LABELS, APPLICATION_STATUS_COLORS } from '@/lib/utils'
import { type ApplicationStatus } from '@/types/database'
import { MOCK_DEPARTMENTS } from '@/lib/mock-data'

interface Department { id: string; name: string; slug: string; description: string | null; color: string }
interface Question { id: string; question_text: string; question_type: string; is_required: boolean; sort_order: number; placeholder: string | null; question_options?: { id: string; option_text: string }[] }

export default function ApplicationPage() {
  const supabase = createClient()
  const router = useRouter()
  const { toast } = useToast()

  const [step, setStep] = useState(1) // 1=select dept, 2=answer questions, 3=review
  const [departments, setDepartments] = useState<Department[]>([])
  const [selectedDept, setSelectedDept] = useState<string>('')
  const [selectedDept2, setSelectedDept2] = useState<string>('')
  const [questions, setQuestions] = useState<Question[]>([])
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [checkboxAnswers, setCheckboxAnswers] = useState<Record<string, string[]>>({})
  const [existingApp, setExistingApp] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [profileComplete, setProfileComplete] = useState(false)

  const fetchData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setDepartments(MOCK_DEPARTMENTS as any)
      setProfileComplete(true)
      setSelectedDept('dept-1')
      setLoading(false)
      return
    }

    const [{ data: depts }, { data: app }, { data: prof }] = await Promise.all([
      supabase.from('departments').select('*').neq('slug', 'chu-nhiem').eq('is_active', true),
      supabase.from('applications').select('*, departments!applications_department_id_fkey(name)').eq('user_id', user.id).limit(1).single(),
      supabase.from('profiles').select('full_name, phone, student_id, university').eq('id', user.id).single(),
    ])

    setDepartments(depts && depts.length > 0 ? depts : (MOCK_DEPARTMENTS as any))
    setExistingApp(app)
    setProfileComplete(!!(prof?.full_name && prof?.phone && prof?.student_id && prof?.university))
    setLoading(false)

    if (app) {
      setSelectedDept(app.department_id)
      setSelectedDept2(app.second_department_id || '')
      const { data: existingAnswers } = await supabase.from('application_answers').select('question_id, answer_text, answer_options').eq('application_id', app.id)
      const ansMap: Record<string, string> = {}
      const cbMap: Record<string, string[]> = {}
      existingAnswers?.forEach(a => {
        if (a.answer_text) ansMap[a.question_id] = a.answer_text
        if (a.answer_options) cbMap[a.question_id] = a.answer_options as string[]
      })
      setAnswers(ansMap)
      setCheckboxAnswers(cbMap)
    }
  }, [supabase])

  useEffect(() => { fetchData() }, [fetchData])

  const loadQuestions = useCallback(async (deptId: string) => {
    let qList: any[] = []
    try {
      const { data: q } = await supabase
        .from('questions')
        .select('*, question_options(id, option_text)')
        .eq('department_id', deptId)
        .eq('is_active', true)
        .order('sort_order')
      if (q && q.length > 0) qList = q
    } catch {}

    if (qList.length === 0) {
      // Mock questions for the 3 departments
      if (deptId === 'dept-1' || deptId.includes('truyen-thong')) {
        qList = [
          { id: 'q-tt-1', question_text: 'Vì sao bạn muốn tham gia Ban Truyền thông iSSAC?', question_type: 'long_text', is_required: true, placeholder: 'Chia sẻ lý do và mục tiêu của bạn...' },
          { id: 'q-tt-2', question_text: 'Bạn có kinh nghiệm thiết kế (Photoshop/Canva) hoặc quay dựng video chưa? Hãy chia sẻ link sản phẩm nếu có.', question_type: 'long_text', is_required: true, placeholder: 'Link drive, portfolio hoặc mô tả kinh nghiệm...' },
          { id: 'q-tt-3', question_text: 'Nếu được giao nhiệm vụ lên ý tưởng viral cho chiến dịch truyền thông của iSSAC, bạn sẽ làm gì?', question_type: 'long_text', is_required: false, placeholder: 'Ý tưởng sáng tạo của bạn...' }
        ]
      } else if (deptId === 'dept-2' || deptId.includes('tu-van')) {
        qList = [
          { id: 'q-tv-1', question_text: 'Vì sao bạn lựa chọn ứng tuyển vào Ban Tư vấn iSSAC?', question_type: 'long_text', is_required: true, placeholder: 'Chia sẻ lý do và nguyện vọng...' },
          { id: 'q-tv-2', question_text: 'Theo bạn, những kỹ năng quan trọng nhất của một Đại sứ sinh viên khi tư vấn là gì?', question_type: 'long_text', is_required: true, placeholder: 'Kỹ năng lắng nghe, thấu cảm, truyền đạt...' },
          { id: 'q-tv-3', question_text: 'Chia sẻ một tình huống bạn từng lắng nghe và hỗ trợ giải quyết khó khăn cho một người bạn.', question_type: 'long_text', is_required: false, placeholder: 'Kể lại trải nghiệm thực tế...' }
        ]
      } else {
        qList = [
          { id: 'q-ns-1', question_text: 'Vì sao bạn muốn trở thành thành viên Ban Nhân sự iSSAC?', question_type: 'long_text', is_required: true, placeholder: 'Lý do ứng tuyển...' },
          { id: 'q-ns-2', question_text: 'Bạn đã có kinh nghiệm quản lý nhóm, gắn kết thành viên hoặc tổ chức team building chưa?', question_type: 'long_text', is_required: true, placeholder: 'Kinh nghiệm hoạt động đội nhóm...' },
          { id: 'q-ns-3', question_text: 'Nếu trong ban có hai thành viên bất đồng quan điểm, bạn sẽ xử lý như thế nào?', question_type: 'long_text', is_required: false, placeholder: 'Cách giải quyết mâu thuẫn...' }
        ]
      }
    }
    setQuestions(qList)
  }, [supabase])

  useEffect(() => { if (selectedDept) loadQuestions(selectedDept) }, [selectedDept, loadQuestions])

  const handleAnswer = (qId: string, value: string) => setAnswers(prev => ({ ...prev, [qId]: value }))

  const handleCheckbox = (qId: string, option: string, checked: boolean) => {
    setCheckboxAnswers(prev => {
      const current = prev[qId] || []
      return { ...prev, [qId]: checked ? [...current, option] : current.filter(o => o !== option) }
    })
  }

  const handleSubmit = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setSubmitting(true)
      setTimeout(() => {
        setSubmitting(false)
        toast({
          title: '🎉 Nộp đơn thành công!',
          description: 'Hồ sơ của bạn đã được chuyển đến Ban tuyển dụng iSSAC.',
        })
        router.push('/member/dashboard')
      }, 800)
      return
    }
    setSubmitting(true)

    // Create or update application
    let appId = existingApp?.id
    if (!appId) {
      const { data: newApp, error } = await supabase.from('applications').insert({
        user_id: user.id,
        department_id: selectedDept,
        second_department_id: selectedDept2 || null,
        status: 'submitted',
        submitted_at: new Date().toISOString(),
      }).select().single()

      if (error) { 
        toast({ title: 'Lỗi', description: error.message, variant: 'destructive' })
        setSubmitting(false)
        return 
      }
      appId = newApp!.id
    } else {
      await supabase.from('applications').update({ status: 'submitted', submitted_at: new Date().toISOString() }).eq('id', appId)
    }

    // Save answers
    for (const q of questions) {
      const answerData = {
        application_id: appId,
        question_id: q.id,
        answer_text: answers[q.id] || null,
        answer_options: checkboxAnswers[q.id] || null,
      }
      await supabase.from('application_answers').upsert(answerData, { onConflict: 'application_id,question_id' })
    }

    // Notify admins / create notification
    await supabase.from('notifications').insert({
      user_id: user.id,
      title: 'Đơn ứng tuyển đã được gửi',
      message: 'Đơn ứng tuyển của bạn đã được gửi thành công. Chúng tôi sẽ xem xét và phản hồi sớm nhất.',
      type: 'success',
      action_url: '/member/dashboard',
    })

    // Audit log
    await supabase.from('audit_logs').insert({ user_id: user.id, action: 'SUBMIT_APPLICATION', target_type: 'application', target_id: appId, description: 'Submitted application' })

    toast({ title: '🎉 Nộp đơn thành công!', description: 'Đơn ứng tuyển đã được gửi. Chúng tôi sẽ xem xét sớm nhất.' })
    setSubmitting(false)
    router.push('/member/dashboard')
  }

    const getDeptTag = (dept: Department) => {
    const slug = (dept.slug || "").toLowerCase()
    const name = (dept.name || "").toLowerCase()
    if (slug.includes("truyen-thong") || name.includes("truyền thông")) {
      return {
        tag: "Truyền thông & Sáng tạo",
        badgeClass: "bg-blue-100 text-[#1657c1] border border-blue-200",
        activeCardClass: "border-[#1657c1] bg-gradient-to-b from-blue-50/80 via-white to-blue-50/20 shadow-md ring-2 ring-blue-500/20",
        hoverCardClass: "hover:border-blue-300 hover:bg-blue-50/30",
      }
    }
    if (slug.includes("tu-van") || name.includes("tư vấn")) {
      return {
        tag: "Tư vấn & Hỗ trợ sinh viên",
        badgeClass: "bg-amber-100 text-amber-900 border border-amber-300",
        activeCardClass: "border-[#1657c1] bg-gradient-to-b from-blue-50/80 via-white to-amber-50/20 shadow-md ring-2 ring-blue-500/20",
        hoverCardClass: "hover:border-blue-300 hover:bg-amber-50/30",
      }
    }
    return {
      tag: "Quản trị & Văn hóa nội bộ",
      badgeClass: "bg-indigo-100 text-indigo-900 border border-indigo-200",
      activeCardClass: "border-[#1657c1] bg-gradient-to-b from-blue-50/80 via-white to-indigo-50/20 shadow-md ring-2 ring-blue-500/20",
      hoverCardClass: "hover:border-blue-300 hover:bg-indigo-50/30",
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-[#1657c1]" />
      </div>
    )
  }

  // Already submitted confirmation view
  if (existingApp && existingApp.status !== 'draft') {
    const dept = (existingApp as any).departments
    return (
      <div className="space-y-6 max-w-4xl mx-auto animate-fade-in pb-12 font-sans">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">
            ĐƠN ỨNG TUYỂN iSSAC 2026
          </h1>
          <p className="text-slate-500 text-sm font-medium">
            Hồ sơ của bạn đã được ghi nhận trong hệ thống tuyển quân Gen 10
          </p>
        </div>

        <div className="bg-white border-2 border-[#1657c1] rounded-3xl p-6 sm:p-8 shadow-sm relative overflow-hidden">
          
          
          <div className="text-center space-y-3 py-4 max-w-md mx-auto">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-blue-50 border border-blue-200 text-[#1657c1] flex items-center justify-center shadow-xs">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-slate-900">
              Đã nộp đơn thành công!
            </h2>
            <p className="text-slate-600 text-sm leading-relaxed">
              Đơn ứng tuyển vào <strong className="text-[#1657c1] font-bold">{dept?.name || 'Ban ứng tuyển'}</strong> của bạn đã được chuyển đến Hội đồng tuyển chọn iSSAC.
            </p>

            <div className="pt-2">
              <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
                Trạng thái: {APPLICATION_STATUS_LABELS[existingApp.status as ApplicationStatus] || existingApp.status}
              </span>
            </div>

            <div className="pt-4 flex justify-center gap-3">
              <Link href="/member/dashboard">
                <button
                  type="button"
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#fdc455] hover:bg-[#f59e0b] text-slate-950 font-bold text-sm shadow-sm transition-all"
                >
                  Về trang Tổng quan
                  <ChevronRight className="w-4 h-4" />
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Application Steps Flow
  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-fade-in pb-12 font-sans">
      {/* 1. Header: Chuẩn font chữ và đồng bộ tông màu Xanh & Vàng */}
      <div className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">
          ỨNG TUYỂN iSSAC 2026
        </h1>
        <p className="text-slate-500 text-sm font-medium">
          Điền đầy đủ thông tin để hoàn thành đơn ứng tuyển Đại sứ Sinh viên Gen 10
        </p>
      </div>

      {/* 2. Progress Stepper: Tone Xanh & Vàng iSSAC */}
      <div className="bg-white border-2 border-slate-200/90 rounded-2xl p-4 bg-white shadow-xs">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          {[
            { n: 1, l: 'Chọn ban' },
            { n: 2, l: 'Câu hỏi chuyên môn' },
            { n: 3, l: 'Xác nhận & Nộp' }
          ].map((s, i) => {
            const isDone = step > s.n
            const isActive = step === s.n

            return (
              <div key={s.n} className="flex items-center gap-2 sm:gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all ${
                  isDone 
                    ? 'bg-[#1657c1] text-white shadow-xs' 
                    : isActive 
                    ? 'bg-[#fdc455] text-slate-950 ring-4 ring-amber-100 shadow-xs' 
                    : 'bg-slate-100 text-slate-400'
                }`}>
                  {isDone ? <Check className="w-4 h-4 stroke-[3]" /> : s.n}
                </div>

                <span className={`text-xs sm:text-sm font-bold ${
                  isActive ? 'text-[#1657c1]' : isDone ? 'text-slate-800' : 'text-slate-400'
                }`}>
                  {s.l}
                </span>

                {i < 2 && (
                  <ChevronRight className="w-4 h-4 text-slate-300 ml-2 hidden sm:block" />
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* STEP 1: CHỌN BAN */}
      {step === 1 && (
        <div className="space-y-5">
          {!profileComplete && (
            <div className="bg-amber-50 border border-amber-300 rounded-2xl p-4 text-sm text-amber-900 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Hồ sơ cá nhân của bạn chưa đầy đủ. Vui lòng bổ sung để tiếp tục đơn ứng tuyển.</span>
              </div>
              <Link href="/member/profile" className="font-bold underline text-amber-950 text-xs shrink-0">
                Cập nhật ngay
              </Link>
            </div>
          )}

          {/* Nguyện vọng 1: 3 Ban chuyên môn - Màu sắc rõ nét, bỏ icon, full viền */}
          <div className="bg-white border-2 border-slate-200/90 rounded-3xl p-6 shadow-xs space-y-5">
            <div className="border-b border-slate-100 pb-3.5 flex items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2.5 py-0.5 rounded-md text-xs font-black uppercase tracking-wide bg-[#1657c1] text-white">
                    Nguyện vọng 1
                  </span>
                  <span className="text-sm font-bold text-slate-800">
                    - Ban muốn ứng tuyển chính thức
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  Lựa chọn Ban chuyên môn phù hợp nhất với thế mạnh và định hướng của bạn
                </p>
              </div>
              <span className="text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 px-3 py-1 rounded-full shrink-0">
                Bắt buộc
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {departments.map(dept => {
                const isSelected = selectedDept === dept.id
                const deptInfo = getDeptTag(dept)

                return (
                  <button
                    key={dept.id}
                    type="button"
                    onClick={() => setSelectedDept(dept.id)}
                    className={`group p-5 rounded-2xl border-2 text-left transition-all relative flex flex-col justify-between cursor-pointer ${
                      isSelected
                        ? deptInfo.activeCardClass + " -translate-y-0.5"
                        : "border-slate-200/90 bg-white " + deptInfo.hoverCardClass + " hover:shadow-xs hover:-translate-y-0.5"
                    }`}
                  >
                    <div>
                      {/* Top tag and radio check - Không dùng icon */}
                      <div className="flex items-center justify-between gap-2 mb-3.5">
                        <span className={`text-[11px] font-bold px-2.5 py-1 rounded-md ${deptInfo.badgeClass}`}>
                          {deptInfo.tag}
                        </span>

                        {isSelected ? (
                          <div className="w-5 h-5 rounded-full bg-[#1657c1] text-white flex items-center justify-center text-xs font-bold shadow-xs">
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          </div>
                        ) : (
                          <div className="w-5 h-5 rounded-full border-2 border-slate-300 group-hover:border-blue-400 transition-colors" />
                        )}
                      </div>

                      <div className={`font-bold text-base mb-1.5 ${isSelected ? "text-[#1657c1]" : "text-slate-900 group-hover:text-[#1657c1] transition-colors"}`}>
                        {dept.name}
                      </div>

                      <div className="text-xs text-slate-600 leading-relaxed font-normal">
                        {dept.description}
                      </div>
                    </div>

                    <div className="mt-5 pt-2">
                      {isSelected ? (
                        <span className="inline-flex items-center text-xs font-black text-slate-950 bg-[#fdc455] border border-amber-400 px-3.5 py-1.5 rounded-lg shadow-xs">
                          Đã chọn làm NV1
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-xs font-bold text-blue-600 bg-blue-50/80 border border-blue-200/80 px-3 py-1 rounded-lg group-hover:bg-[#1657c1] group-hover:text-white group-hover:border-[#1657c1] transition-all">
                          Chọn ban này
                        </span>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Nguyện vọng 2 (Không bắt buộc) */}
          <div className="bg-white border-2 border-slate-200/90 rounded-3xl p-6 shadow-xs space-y-4">
            <div className="border-b border-slate-100 pb-3.5 flex items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2.5 py-0.5 rounded-md text-xs font-extrabold uppercase tracking-wide bg-slate-100 text-slate-700 border border-slate-200">
                    Nguyện vọng 2
                  </span>
                  <span className="text-sm font-semibold text-slate-700">
                    (Không bắt buộc)
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  Bạn có thể đăng ký thêm một ban phụ nếu muốn mở rộng cơ hội tham gia CLB
                </p>
              </div>
              <span className="text-xs font-medium text-slate-500 bg-slate-100 px-3 py-1 rounded-full shrink-0">
                Tùy chọn
              </span>
            </div>

            <div className="max-w-md">
              <Select value={selectedDept2} onValueChange={setSelectedDept2}>
                <SelectTrigger className="rounded-xl border-slate-200 text-xs sm:text-sm h-11 focus:ring-2 focus:ring-blue-200 bg-white">
                  <SelectValue placeholder="Chọn ban nguyện vọng 2 (nếu có)" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="">Không chọn ban phụ</SelectItem>
                  {departments.filter(d => d.id !== selectedDept).map(d => (
                    <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Nút Tiếp theo màu Vàng iSSAC */}
          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={() => setStep(2)}
              disabled={!selectedDept || !profileComplete}
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-[#fdc455] hover:bg-[#f59e0b] disabled:opacity-50 text-slate-950 font-black text-sm shadow-md transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer disabled:cursor-not-allowed"
            >
              Tiếp theo bước 2
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: TRẢ LỜI CÂU HỎI */}
      {step === 2 && (
        <div className="space-y-5">
          <div className="bg-white border-2 border-blue-100 rounded-3xl p-6 shadow-xs space-y-6">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-[#1657c1]">
                  Câu hỏi ứng tuyển - {departments.find(d => d.id === selectedDept)?.name}
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Vui lòng trả lời chân thành và đầy đủ các câu hỏi để Hội đồng tuyển sinh hiểu rõ về bạn
                </p>
              </div>
              <Badge className="bg-blue-50 text-[#1657c1] border border-blue-200 font-bold text-xs">
                {questions.length} câu hỏi
              </Badge>
            </div>

            <div className="space-y-6">
              {questions.length === 0 ? (
                <div className="text-center py-8 text-slate-400">Chưa có câu hỏi nào cho ban này.</div>
              ) : (
                questions.map((q, i) => (
                  <div key={q.id} className="p-4 rounded-2xl bg-slate-50/60 border border-slate-200/80 space-y-2.5">
                    <Label className="text-xs sm:text-sm font-bold text-slate-900 block leading-snug">
                      <span className="w-5 h-5 rounded-md bg-[#1657c1] text-white inline-flex items-center justify-center text-xs font-black mr-2">
                        {i + 1}
                      </span>
                      {q.question_text}
                      {q.is_required && <span className="text-red-500 ml-1 font-bold">*</span>}
                    </Label>

                    {q.question_type === 'short_text' && (
                      <Input 
                        value={answers[q.id] || ''} 
                        onChange={e => handleAnswer(q.id, e.target.value)} 
                        placeholder={q.placeholder || 'Nhập câu trả lời...'} 
                        className="rounded-xl border-slate-200 text-xs sm:text-sm h-11 bg-white focus:ring-2 focus:ring-blue-200"
                      />
                    )}

                    {q.question_type === 'long_text' && (
                      <Textarea 
                        value={answers[q.id] || ''} 
                        onChange={e => handleAnswer(q.id, e.target.value)} 
                        placeholder={q.placeholder || 'Nhập câu trả lời chi tiết của bạn...'} 
                        rows={4} 
                        className="rounded-xl border-slate-200 text-xs sm:text-sm bg-white focus:ring-2 focus:ring-blue-200"
                      />
                    )}

                    {(q.question_type === 'multiple_choice' || q.question_type === 'dropdown') && (
                      <Select value={answers[q.id] || ''} onValueChange={v => handleAnswer(q.id, v)}>
                        <SelectTrigger className="rounded-xl border-slate-200 text-xs sm:text-sm h-11 bg-white">
                          <SelectValue placeholder="Chọn một đáp án..." />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl">
                          {q.question_options?.map(opt => (
                            <SelectItem key={opt.id} value={opt.option_text}>{opt.option_text}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}

                    {q.question_type === 'checkbox' && (
                      <div className="grid gap-2 pt-1">
                        {q.question_options?.map(opt => (
                          <label key={opt.id} className="flex items-center gap-3 cursor-pointer p-2.5 rounded-xl bg-white border border-slate-200 hover:border-blue-200">
                            <input
                              type="checkbox"
                              checked={(checkboxAnswers[q.id] || []).includes(opt.option_text)}
                              onChange={e => handleCheckbox(q.id, opt.option_text, e.target.checked)}
                              className="w-4 h-4 text-[#1657c1] rounded border-slate-300"
                            />
                            <span className="text-xs sm:text-sm text-slate-800 font-medium">{opt.option_text}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="flex justify-between items-center pt-2">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl border-2 border-slate-200 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs sm:text-sm transition-all"
            >
              <ChevronLeft className="w-4 h-4" /> Quay lại chọn ban
            </button>

            <button
              type="button"
              onClick={() => setStep(3)}
              className="inline-flex items-center gap-2 px-7 py-3 rounded-xl bg-[#fdc455] hover:bg-[#f59e0b] text-slate-950 font-black text-sm shadow-md transition-all hover:scale-[1.02]"
            >
              Xem lại & Nộp đơn
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: XEM LẠI & NỘP */}
      {step === 3 && (
        <div className="space-y-5">
          <div className="bg-white border-2 border-blue-100 rounded-3xl p-6 shadow-xs space-y-5">
            <div className="border-b border-slate-100 pb-3">
              <div className="text-xs font-bold uppercase tracking-wider text-[#1657c1]">
                Xác nhận thông tin trước khi gửi đơn
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Kiểm tra kỹ thông tin nguyện vọng và các câu trả lời trước khi gửi chính thức
              </p>
            </div>

            {/* Department review box */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="text-xs font-bold text-slate-500">Nguyện vọng 1 (Chính thức):</div>
                <div className="font-extrabold text-base text-[#1657c1]">
                  {departments.find(d => d.id === selectedDept)?.name}
                </div>
              </div>

              {selectedDept2 && (
                <div className="sm:text-right">
                  <div className="text-xs font-bold text-slate-500">Nguyện vọng 2 (Phụ):</div>
                  <div className="font-bold text-sm text-slate-800">
                    {departments.find(d => d.id === selectedDept2)?.name}
                  </div>
                </div>
              )}
            </div>

            {/* Questions preview */}
            <div className="space-y-3 pt-1">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Nội dung câu trả lời của bạn:
              </div>
              {questions.map((q, i) => (
                <div key={q.id} className="border-l-2 border-[#1657c1] pl-4 py-1 space-y-1">
                  <div className="text-xs font-bold text-slate-600">
                    {i + 1}. {q.question_text}
                  </div>
                  <div className="text-xs sm:text-sm text-slate-900 font-medium">
                    {answers[q.id] || (checkboxAnswers[q.id]?.join(', ')) || <span className="text-slate-400 italic">Chưa trả lời</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-300 rounded-2xl p-4 text-xs sm:text-sm text-amber-950 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <span>
              <strong>Lưu ý:</strong> Sau khi nộp đơn chính thức, bạn sẽ không thể thay đổi ban ứng tuyển. Vui lòng xác nhận chắc chắn các thông tin đã điền.
            </span>
          </div>

          <div className="flex justify-between items-center pt-2">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl border-2 border-slate-200 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs sm:text-sm transition-all"
            >
              <ChevronLeft className="w-4 h-4" /> Quay lại sửa câu hỏi
            </button>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="inline-flex items-center gap-2 px-8 py-3 rounded-xl bg-[#fdc455] hover:bg-[#f59e0b] text-slate-950 font-black text-sm shadow-md transition-all hover:scale-[1.02] cursor-pointer"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Nộp đơn ứng tuyển ngay
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
