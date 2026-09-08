'use client'
import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/components/ui/use-toast'
import { Loader2 } from 'lucide-react'
import { APPLICATION_STATUS_LABELS } from '@/lib/utils'
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
          title: 'Nộp đơn thành công!',
          description: 'Hồ sơ của bạn đã được chuyển đến Ban tuyển quân iSSAC.',
        })
        router.push('/member/dashboard')
      }, 800)
      return
    }
    setSubmitting(true)

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

    for (const q of questions) {
      const answerData = {
        application_id: appId,
        question_id: q.id,
        answer_text: answers[q.id] || null,
        answer_options: checkboxAnswers[q.id] || null,
      }
      await supabase.from('application_answers').upsert(answerData, { onConflict: 'application_id,question_id' })
    }

    await supabase.from('notifications').insert({
      user_id: user.id,
      title: 'Đơn ứng tuyển đã được gửi',
      message: 'Đơn ứng tuyển của bạn đã được gửi thành công. Chúng tôi sẽ xem xét và phản hồi sớm nhất.',
      type: 'success',
      action_url: '/member/dashboard',
    })

    await supabase.from('audit_logs').insert({ user_id: user.id, action: 'SUBMIT_APPLICATION', target_type: 'application', target_id: appId, description: 'Submitted application' })

    toast({ title: 'Nộp đơn thành công!', description: 'Đơn ứng tuyển đã được gửi. Chúng tôi sẽ xem xét sớm nhất.' })
    setSubmitting(false)
    router.push('/member/dashboard')
  }

  // Chi tiết từ khóa và thế mạnh từng ban
  const getDeptDetails = (dept: Department) => {
    const slug = (dept.slug || '').toLowerCase()
    const name = (dept.name || '').toLowerCase()
    if (slug.includes('truyen-thong') || name.includes('truyền thông')) {
      return {
        tag: 'Truyền thông & Sáng tạo',
        keywords: ['Thiết kế đồ họa', 'Sản xuất Video', 'Sáng tạo nội dung', 'Quản trị Fanpage'],
      }
    }
    if (slug.includes('tu-van') || name.includes('tư vấn')) {
      return {
        tag: 'Tư vấn & Hỗ trợ sinh viên',
        keywords: ['Định hướng học tập', 'Kết nối học bổng', 'Kỹ năng sinh viên', 'Cố vấn học thuật'],
      }
    }
    return {
      tag: 'Quản trị & Văn hóa nội bộ',
      keywords: ['Quản trị nhân lực', 'Văn hóa gắn kết', 'Tổ chức tuyển quân', 'Team Building'],
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-[#1657c1]" />
      </div>
    )
  }

  // Đã nộp đơn
  if (existingApp && existingApp.status !== 'draft') {
    const dept = (existingApp as any).departments
    return (
      <div className="space-y-6 max-w-3xl mx-auto animate-fade-in pb-12 font-sans">
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 tracking-tight">
              ĐƠN ỨNG TUYỂN iSSAC 2026
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-medium">
              Hồ sơ của bạn đã được ghi nhận trong hệ thống tuyển chọn Gen 3
            </p>
          </div>
          <Link
            href="/member/dashboard"
            className="px-4 py-2 rounded-xl border-2 border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-xs transition-all"
          >
            Về Tổng quan
          </Link>
        </div>

        <div className="bg-white border-2 border-[#1657c1]/20 rounded-3xl p-8 text-center shadow-md space-y-4">
          <div className="inline-block px-4 py-1.5 rounded-full text-xs font-black bg-blue-50 text-[#1657c1] uppercase tracking-wider border border-blue-200">
            Hồ sơ đã gửi thành công
          </div>
          <h2 className="text-2xl font-black text-slate-900">
            Đơn ứng tuyển đã được tiếp nhận
          </h2>
          <p className="text-slate-600 text-xs sm:text-sm max-w-md mx-auto leading-relaxed">
            Đơn ứng tuyển vào <strong className="text-[#1657c1] font-bold">{dept?.name || 'Ban ứng tuyển'}</strong> của bạn đã được chuyển đến Hội đồng tuyển sinh iSSAC để tiến hành thẩm định.
          </p>
          <div className="pt-2">
            <span className="inline-block px-4 py-1 rounded-md text-xs font-extrabold bg-[#fdc455] text-slate-950 border border-amber-400 shadow-2xs">
              Trạng thái: {APPLICATION_STATUS_LABELS[existingApp.status as ApplicationStatus] || existingApp.status}
            </span>
          </div>
          <div className="pt-4">
            <Link
              href="/member/dashboard"
              className="inline-block px-8 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-all"
            >
              Xem tiến trình tại Tổng quan
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // Application Steps Flow
  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-fade-in pb-12 font-sans">
      {/* 1. Header: Đồng bộ font chữ & phong cách toàn hệ thống */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 tracking-tight">
            ĐƠN ỨNG TUYỂN iSSAC 2026
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            Cổng tuyển chọn Đại sứ Sinh viên Gen 3 - Trường Quốc tế, ĐHQGHN
          </p>
        </div>
        <Link
          href="/member/dashboard"
          className="self-start sm:self-auto px-4 py-2 rounded-xl border-2 border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-xs transition-all"
        >
          Về Tổng quan
        </Link>
      </div>

      {/* 2. Thanh tiến trình (Stepper): Tinh gọn, hiện đại, không bọc hộp thô */}
      <div className="bg-white border-2 border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xs">
        <div className="grid grid-cols-3 gap-2 sm:gap-6 max-w-2xl mx-auto">
          {[
            { n: 1, title: 'Chọn ban', sub: 'Nguyện vọng' },
            { n: 2, title: 'Câu hỏi', sub: 'Chuyên môn' },
            { n: 3, title: 'Xác nhận', sub: 'Gửi hồ sơ' }
          ].map((s) => {
            const isDone = step > s.n
            const isActive = step === s.n

            return (
              <div key={s.n} className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all shrink-0 ${
                  isDone 
                    ? 'bg-[#1657c1] text-white' 
                    : isActive 
                      ? 'bg-[#fdc455] text-slate-950 ring-4 ring-amber-400/25 shadow-xs font-bold' 
                      : 'bg-slate-100 text-slate-400 border border-slate-200'
                }`}>
                  {isDone ? '✓' : s.n}
                </div>

                <div className="min-w-0">
                  <div className={`text-xs sm:text-sm font-bold truncate ${
                    isActive ? 'text-[#1657c1]' : isDone ? 'text-slate-800' : 'text-slate-400'
                  }`}>
                    {s.title}
                  </div>
                  <div className="text-[10px] text-slate-400 hidden sm:block">
                    {s.sub}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* STEP 1: CHỌN BAN CHUYÊN MÔN (BỐ CỤC THỐNG NHẤT, GỌN GÀNG, KHÔNG RỜI RẠC) */}
      {step === 1 && (
        <div className="space-y-6">
          {!profileComplete && (
            <div className="p-4 rounded-2xl bg-amber-50 border-2 border-amber-300 text-xs sm:text-sm text-amber-950 flex items-center justify-between gap-4">
              <span>Hồ sơ cá nhân của bạn chưa hoàn thiện. Vui lòng cập nhật đầy đủ để nộp đơn.</span>
              <Link href="/member/profile" className="px-3.5 py-1.5 rounded-lg bg-[#fdc455] text-slate-950 font-bold text-xs shrink-0 shadow-xs hover:bg-[#f59e0b]">
                Cập nhật ngay
              </Link>
            </div>
          )}

          {/* Master Card: Hợp nhất Nguyện vọng 1 & Nguyện vọng 2 trong 1 thể thống nhất */}
          <div className="bg-white border-2 border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-xs space-y-7">
            {/* Phân khu 1: Nguyện vọng chính thức (NV1) */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3.5">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-md text-xs font-black uppercase tracking-wide bg-[#1657c1] text-white">
                      Nguyện vọng 1
                    </span>
                    <span className="text-base font-bold text-slate-900">
                      Ban bạn muốn ứng tuyển chính thức
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Chọn 01 Ban chuyên môn phù hợp nhất với thế mạnh và định hướng phát triển của bạn
                  </p>
                </div>
                <span className="self-start sm:self-auto text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 px-3 py-1 rounded-full">
                  Bắt buộc
                </span>
              </div>

              {/* Link tham khảo trang thông tin riêng về CLB & các ban */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3.5 rounded-2xl bg-blue-50/70 border border-blue-200 text-xs text-[#1657c1]">
                <span>Bạn muốn tìm hiểu chi tiết chức năng, nhiệm vụ và quyền lợi từng ban?</span>
                <Link href="/member/about" className="font-bold underline hover:text-[#0d3b82] shrink-0">
                  Xem trang Giới thiệu CLB & Các ban →
                </Link>
              </div>

              {/* 3 Thẻ Ban Chuyên môn: Ngắn gọn, súc tích, chuẩn nhận diện */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {departments.map(dept => {
                  const isSelected = selectedDept === dept.id

                  const shortDescMap: Record<string, string> = {
                    "Ban Truyền thông": "Sáng tạo nội dung, thiết kế đồ họa & sản xuất media.",
                    "Ban Tư vấn": "Tư vấn hướng nghiệp, học bổng & hỗ trợ sinh viên.",
                    "Ban Nhân sự": "Quản trị nhân lực, tổ chức sự kiện & văn hóa CLB.",
                  }

                  const shortDesc = shortDescMap[dept.name] || dept.description || ""

                  return (
                    <div
                      key={dept.id}
                      onClick={() => setSelectedDept(dept.id)}
                      className={`group p-5 rounded-2xl border-2 text-left transition-all relative flex flex-col justify-between cursor-pointer ${
                        isSelected
                          ? "border-[#1657c1] bg-gradient-to-b from-blue-50/80 via-white to-blue-50/20 shadow-md ring-2 ring-blue-500/20 -translate-y-0.5"
                          : "border-slate-200/90 bg-white hover:border-[#1657c1]/60 hover:bg-slate-50/50 hover:shadow-xs hover:-translate-y-0.5"
                      }`}
                    >
                      <div className="space-y-2">
                        {/* Header Thẻ: Tên ban & Trạng thái NV1 */}
                        <div className="flex items-center justify-between gap-2">
                          <div className={`font-black text-lg ${isSelected ? "text-[#1657c1]" : "text-slate-900 group-hover:text-[#1657c1] transition-colors"}`}>
                            {dept.name}
                          </div>

                          {isSelected ? (
                            <span className="text-[10px] font-black uppercase tracking-wider bg-[#fdc455] text-slate-950 px-2 py-0.5 rounded border border-amber-400 shrink-0 shadow-2xs">
                              NV1
                            </span>
                          ) : (
                            <div className="w-5 h-5 rounded-full border-2 border-slate-300 group-hover:border-[#1657c1] shrink-0 transition-colors" />
                          )}
                        </div>

                        {/* Mô tả 1 dòng ngắn gọn */}
                        <p className="text-xs text-slate-600 leading-relaxed">
                          {shortDesc}
                        </p>
                      </div>

                      {/* Footer Thẻ */}
                      <div className="mt-4 pt-3 border-t border-slate-100/80">
                        {isSelected ? (
                          <div className="text-xs font-black text-[#1657c1] flex items-center justify-between">
                            <span>Đã chọn làm NV1</span>
                            <span className="w-2 h-2 rounded-full bg-[#1657c1]" />
                          </div>
                        ) : (
                          <div className="text-xs font-bold text-slate-400 group-hover:text-[#1657c1] transition-colors">
                            Nhấn để chọn ban này
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Phân khu 2: Nguyện vọng phụ (NV2) - Tích hợp gọn gàng, tinh tế, không tạo hộp to thừa thãi */}
            <div className="pt-3 border-t border-slate-100 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-md text-xs font-black uppercase tracking-wide bg-slate-100 text-slate-700 border border-slate-200">
                      Nguyện vọng 2
                    </span>
                    <span className="text-sm font-bold text-slate-800">
                      Ban dự phòng (Không bắt buộc)
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Mở rộng cơ hội trúng tuyển nếu Ban NV1 có số lượng ứng viên đăng ký vượt chỉ tiêu
                  </p>
                </div>
                <span className="self-start sm:self-auto text-xs font-medium text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                  Tùy chọn
                </span>
              </div>

              <div className="max-w-md pt-1">
                <Select value={selectedDept2} onValueChange={setSelectedDept2}>
                  <SelectTrigger className="rounded-xl border-2 border-slate-200 h-11 text-xs sm:text-sm bg-white focus:border-[#1657c1] focus:ring-2 focus:ring-blue-100">
                    <SelectValue placeholder="Chọn thêm ban nguyện vọng 2 (nếu muốn)" />
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
          </div>

          {/* Thanh tổng kết và nút Tiếp tục bước 2 */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-white border-2 border-slate-200/90 shadow-xs">
            <div className="text-xs sm:text-sm text-slate-600">
              {selectedDept ? (
                <div>
                  Đã chọn NV1: <strong className="text-[#1657c1] font-black text-sm sm:text-base">{departments.find(d => d.id === selectedDept)?.name}</strong>
                  {selectedDept2 && (
                    <span className="text-slate-500"> | NV2: <strong className="text-slate-800 font-bold">{departments.find(d => d.id === selectedDept2)?.name}</strong></span>
                  )}
                </div>
              ) : (
                <span className="text-amber-800 font-bold">Vui lòng chọn 01 Ban chuyên môn để tiếp tục</span>
              )}
            </div>

            <button
              type="button"
              onClick={() => setStep(2)}
              disabled={!selectedDept || !profileComplete}
              className="px-8 py-3.5 rounded-xl bg-[#fdc455] hover:bg-[#f59e0b] disabled:opacity-50 text-slate-950 font-black text-sm shadow-md transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer disabled:cursor-not-allowed shrink-0 text-center"
            >
              Tiếp tục: Trả lời câu hỏi
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: TRẢ LỜI CÂU HỎI */}
      {step === 2 && (
        <div className="space-y-6">
          <div className="bg-white border-2 border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <div>
                <div className="text-xs font-black uppercase tracking-wider text-[#1657c1]">
                  Câu hỏi chuyên môn - {departments.find(d => d.id === selectedDept)?.name}
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Vui lòng trả lời chân thành và đầy đủ các câu hỏi để Hội đồng tuyển sinh hiểu rõ về bạn
                </p>
              </div>
              <span className="px-3 py-1 rounded-full bg-blue-50 text-[#1657c1] border border-blue-200 font-bold text-xs">
                {questions.length} câu hỏi
              </span>
            </div>

            <div className="space-y-6">
              {questions.length === 0 ? (
                <div className="text-center py-8 text-slate-400">Chưa có câu hỏi nào cho ban này.</div>
              ) : (
                questions.map((q, i) => (
                  <div key={q.id} className="p-5 rounded-2xl bg-slate-50/70 border border-slate-200/80 space-y-3">
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
                        className="rounded-xl border-slate-200 text-xs sm:text-sm h-11 bg-white focus:border-[#1657c1] focus:ring-2 focus:ring-blue-100"
                      />
                    )}

                    {q.question_type === 'long_text' && (
                      <Textarea 
                        value={answers[q.id] || ''} 
                        onChange={e => handleAnswer(q.id, e.target.value)} 
                        placeholder={q.placeholder || 'Nhập câu trả lời chi tiết của bạn...'} 
                        rows={4} 
                        className="rounded-xl border-slate-200 text-xs sm:text-sm bg-white focus:border-[#1657c1] focus:ring-2 focus:ring-blue-100"
                      />
                    )}

                    {(q.question_type === 'multiple_choice' || q.question_type === 'dropdown') && (
                      <Select value={answers[q.id] || ''} onValueChange={v => handleAnswer(q.id, v)}>
                        <SelectTrigger className="rounded-xl border-slate-200 text-xs sm:text-sm h-11 bg-white focus:ring-2 focus:ring-blue-100">
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
              className="px-6 py-3 rounded-xl border-2 border-slate-200 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs sm:text-sm transition-all cursor-pointer"
            >
              Quay lại chọn ban
            </button>

            <button
              type="button"
              onClick={() => setStep(3)}
              className="px-8 py-3.5 rounded-xl bg-[#fdc455] hover:bg-[#f59e0b] text-slate-950 font-black text-xs sm:text-sm shadow-md transition-all hover:scale-[1.02] cursor-pointer"
            >
              Xem lại & Nộp đơn
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: XEM LẠI & NỘP */}
      {step === 3 && (
        <div className="space-y-6">
          <div className="bg-white border-2 border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
            <div className="border-b border-slate-100 pb-3">
              <div className="text-xs font-black uppercase tracking-wider text-[#1657c1]">
                Xác nhận thông tin trước khi nộp chính thức
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Kiểm tra kỹ nguyện vọng và các câu trả lời của bạn trước khi gửi
              </p>
            </div>

            {/* Khối xem lại nguyện vọng */}
            <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-50/80 to-indigo-50/50 border-2 border-blue-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="text-xs font-bold text-slate-500">Nguyện vọng 1 (Chính thức):</div>
                <div className="font-black text-lg text-[#1657c1]">
                  {departments.find(d => d.id === selectedDept)?.name}
                </div>
              </div>

              {selectedDept2 && (
                <div className="sm:text-right">
                  <div className="text-xs font-bold text-slate-500">Nguyện vọng 2 (Phụ):</div>
                  <div className="font-bold text-base text-slate-800">
                    {departments.find(d => d.id === selectedDept2)?.name}
                  </div>
                </div>
              )}
            </div>

            {/* Khối xem lại câu trả lời */}
            <div className="space-y-3 pt-1">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Nội dung câu trả lời của bạn:
              </div>
              {questions.map((q, i) => (
                <div key={q.id} className="border-l-4 border-[#1657c1] pl-4 py-1.5 space-y-1 bg-slate-50/50 rounded-r-xl">
                  <div className="text-xs font-bold text-slate-700">
                    {i + 1}. {q.question_text}
                  </div>
                  <div className="text-xs sm:text-sm text-slate-900 font-medium leading-relaxed">
                    {answers[q.id] || (checkboxAnswers[q.id]?.join(', ')) || <span className="text-slate-400 italic">Chưa trả lời</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-amber-50/80 border-2 border-amber-300 text-xs sm:text-sm text-amber-950 leading-relaxed">
            <strong>Lưu ý:</strong> Sau khi nộp đơn chính thức, bạn sẽ không thể thay đổi ban ứng tuyển. Vui lòng kiểm tra chắc chắn các câu trả lời.
          </div>

          <div className="flex justify-between items-center pt-2">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="px-6 py-3 rounded-xl border-2 border-slate-200 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs sm:text-sm transition-all cursor-pointer"
            >
              Quay lại sửa câu hỏi
            </button>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="px-9 py-3.5 rounded-xl bg-[#fdc455] hover:bg-[#f59e0b] text-slate-950 font-black text-sm shadow-md transition-all hover:scale-[1.02] cursor-pointer"
            >
              {submitting ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" /> Đang nộp đơn...
                </span>
              ) : (
                'Nộp đơn ứng tuyển chính thức'
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
