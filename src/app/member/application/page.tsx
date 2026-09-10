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
import { Button } from '@/components/ui/button'
import { Loader2, CheckCircle2, AlertCircle, ArrowRight, ShieldAlert, FileText, Lock, Check, Clock } from 'lucide-react'
import { APPLICATION_STATUS_LABELS } from '@/lib/utils'
import { type ApplicationStatus } from '@/types/database'
import { MOCK_DEPARTMENTS } from '@/lib/mock-data'
import { useSystemSettings, isRecruitmentOpen, formatDayMonth } from '@/lib/system-settings'

interface Department { id: string; name: string; slug: string; description: string | null; color: string }
interface Question { id: string; question_text: string; question_type: string; is_required: boolean; sort_order: number; placeholder: string | null; question_options?: { id: string; option_text: string }[] }

export default function ApplicationPage() {
  const supabase = createClient()
  const router = useRouter()
  const { toast } = useToast()
  const { settings: systemSettings } = useSystemSettings()
  const recruitmentState = isRecruitmentOpen(systemSettings)

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
  const [part1Complete, setPart1Complete] = useState(false)
  const [part2Complete, setPart2Complete] = useState(false)
  const [missingProfileFields, setMissingProfileFields] = useState<string[]>([])

  const fetchData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setDepartments(MOCK_DEPARTMENTS as any)
      setProfileComplete(true)
      setPart1Complete(true)
      setPart2Complete(true)
      setSelectedDept('dept-1')
      setLoading(false)
      return
    }

    const [{ data: depts }, { data: app }, { data: prof }] = await Promise.all([
      supabase.from('departments').select('*').neq('slug', 'chu-nhiem').eq('is_active', true),
      supabase.from('applications').select('*, departments!applications_department_id_fkey(name)').eq('user_id', user.id).limit(1).maybeSingle(),
      supabase.from('profiles').select('full_name, phone, date_of_birth, gender, student_id, university, cohort, major').eq('id', user.id).maybeSingle(),
    ])

    // Kiểm tra chi tiết Phần 1 và Phần 2
    const missingP1: string[] = []
    if (!prof?.full_name?.trim()) missingP1.push('Họ và tên')
    if (!prof?.phone?.trim()) missingP1.push('Số điện thoại')
    if (!prof?.date_of_birth) missingP1.push('Ngày sinh')
    if (!prof?.gender) missingP1.push('Giới tính')
    const p1 = missingP1.length === 0

    const missingP2: string[] = []
    if (!prof?.student_id?.trim()) missingP2.push('MSSV')
    if (!prof?.university?.trim()) missingP2.push('Trường Đại học')
    if (!prof?.cohort?.trim()) missingP2.push('Khóa sinh viên')
    if (!prof?.major?.trim()) missingP2.push('Ngành học')
    const p2 = missingP2.length === 0

    setPart1Complete(p1)
    setPart2Complete(p2)
    setMissingProfileFields([...missingP1, ...missingP2])
    const isComp = p1 && p2
    setProfileComplete(isComp)

    setDepartments(depts && depts.length > 0 ? depts : (MOCK_DEPARTMENTS as any))
    setExistingApp(app)
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

  useEffect(() => { 
    if (!selectedDept) return
    loadQuestions(selectedDept) 

    const channel = supabase
      .channel(`member-questions-${selectedDept}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'questions' }, () => {
        loadQuestions(selectedDept)
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [selectedDept, loadQuestions, supabase])

  const handleAnswer = (qId: string, value: string) => setAnswers(prev => ({ ...prev, [qId]: value }))

  const handleCheckbox = (qId: string, option: string, checked: boolean) => {
    setCheckboxAnswers(prev => {
      const current = prev[qId] || []
      return { ...prev, [qId]: checked ? [...current, option] : current.filter(o => o !== option) }
    })
  }

  const handleSubmit = async () => {
    if (!profileComplete) {
      toast({
        title: 'Chưa hoàn tất hồ sơ',
        description: 'Bạn cần cập nhật đầy đủ Phần 1 (Thông tin cá nhân) và Phần 2 (Thông tin học vấn) trước khi nộp đơn!',
        variant: 'destructive',
      })
      router.push('/member/profile')
      return
    }

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
        keywords: ['Tư vấn tuyển sinh', 'CTV Tuyển sinh & Truyền thông', 'Tổ chức sự kiện', 'Định hướng ngành nghề'],
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
            Đơn ứng tuyển vào <strong className="text-[#1657c1] font-bold">{dept?.name || 'Ban ứng tuyển'}</strong> của bạn đã được chuyển đến Ban Tuyển quân của CLB để tiến hành thẩm định.
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

const SOCIAL_CHANNELS = [
  {
    name: 'Facebook',
    handle: '@ambassadorsClub.VNUIS',
    url: 'https://www.facebook.com/ambassadorsClub.VNUIS',
    btnBg: 'bg-[#1877F2] hover:bg-blue-700',
    iconBg: 'bg-[#1877F2]',
    icon: (
      <svg className="w-5 h-5 fill-white" viewBox="0 0 24 24">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    ),
  },
  {
    name: 'TikTok',
    handle: '@issac.club',
    url: 'https://www.tiktok.com/@issac.club',
    btnBg: 'bg-[#111111] hover:bg-black',
    iconBg: 'bg-[#111111]',
    icon: (
      <svg className="w-5 h-5 fill-white" viewBox="0 0 24 24">
        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.298-.002.595.042.88.13V9.4a6.33 6.33 0 0 0-1-.08A6.34 6.34 0 0 0 3 15.66a6.34 6.34 0 0 0 10.86 4.43c.25-.26.47-.54.66-.84V10.22a8.16 8.16 0 0 0 5.07 1.76v-3.5a4.85 4.85 0 0 1-.0-.05v-1.74z" />
      </svg>
    ),
  },
  {
    name: 'Instagram',
    handle: '@issac.club',
    url: 'https://www.instagram.com/issac.club',
    btnBg: 'bg-[#C13584] hover:bg-[#b02e75]',
    iconBg: 'bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888]',
    icon: (
      <svg className="w-5 h-5 fill-white" viewBox="0 0 24 24">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
      </svg>
    ),
  },
  {
    name: 'YouTube',
    handle: 'issac_club',
    url: 'https://www.youtube.com/@issac_club',
    btnBg: 'bg-[#FF0000] hover:bg-red-700',
    iconBg: 'bg-[#FF0000]',
    icon: (
      <svg className="w-5 h-5 fill-white" viewBox="0 0 24 24">
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
      </svg>
    ),
  },
]

  // Trường hợp chưa đến ngày mở đơn hoặc Ban Chủ nhiệm chưa công khai bộ câu hỏi
  if (!recruitmentState.isOpen) {
    return (
      <div className="space-y-6 max-w-3xl mx-auto animate-fade-in pb-12 font-sans">
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
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
            className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-xs transition-all"
          >
            Về Tổng quan
          </Link>
        </div>

        {/* Khối thông báo trạng thái mở đơn — Same style ảnh 1 */}
        <div className="bg-white border-2 border-[#fdc455] rounded-3xl p-6 sm:p-8 shadow-xs space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-amber-950 bg-[#fdc455] uppercase tracking-wide px-2.5 py-0.5 rounded shadow-2xs">
              {recruitmentState.isClosed 
                ? 'Đã đóng cổng nhận đơn' 
                : 'Trạng thái vòng tuyển quân'}
            </span>
          </div>

          <div className="space-y-1.5">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
              {recruitmentState.isClosed
                ? 'Đã hết hạn nhận đơn ứng tuyển Gen 3'
                : 'Hiện tại ban tuyển quân chưa mở đơn ứng tuyển'}
            </h2>
            <p className="text-slate-600 text-xs sm:text-sm leading-relaxed max-w-2xl">
              {recruitmentState.isClosed ? (
                <>
                  Thời gian tiếp nhận đơn ứng tuyển Gen 3 đã chính thức kết thúc vào ngày <strong className="text-slate-900 font-bold">{formatDayMonth(recruitmentState.endDate)}</strong>. Cảm ơn bạn đã quan tâm và đồng hành cùng CLB iSSAC.
                </>
              ) : (
                <>
                  Hiện tại ban tuyển quân chưa mở đơn ứng tuyển, vui lòng check lại thông tin và đọc thông tin câu lạc bộ để chọn ban đúng với bản thân, và đừng quên theo dõi trang mạng xã hội để cập nhận thông tin tuyển quân sớm nhất của clb nha!
                </>
              )}
            </p>
          </div>

          {/* Hàng nút tác vụ chính cho ứng viên */}
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <Link href="/member/profile">
              <Button className="bg-[#1657c1] hover:bg-[#0f449e] text-white font-bold text-xs sm:text-sm rounded-xl px-5 py-2.5 h-10 shadow-xs cursor-pointer">
                Kiểm tra Hồ sơ cá nhân (Phần 1 & 2)
              </Button>
            </Link>
            <Link href="/member/about">
              <Button variant="outline" className="text-xs sm:text-sm font-bold rounded-xl px-4 py-2.5 h-10 cursor-pointer border-slate-200 text-slate-700 hover:bg-slate-50">
                Đọc thông tin CLB & Chọn Ban
              </Button>
            </Link>
          </div>

          {/* Thanh footer chuẩn ảnh 1: bên trái là badge trạng thái, bên phải là Về trang Tổng quan */}
          <div className="pt-3 flex items-center justify-between gap-3 border-t border-amber-100/80">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-950 bg-amber-100 border border-amber-300 px-3.5 py-1.5 rounded-lg whitespace-nowrap">
              <span className="w-2 h-2 rounded-full bg-amber-600 shrink-0" />
              <span>{recruitmentState.isClosed ? 'Đã kết thúc kỳ tuyển quân' : 'Chưa mở cổng nhận đơn ứng tuyển'}</span>
            </span>

            <Link
              href="/member/dashboard"
              className="inline-flex items-center px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 font-bold text-xs transition-all border border-slate-200 whitespace-nowrap"
            >
              Về trang Tổng quan
            </Link>
          </div>
        </div>

        {/* Khối các kênh mạng xã hội chính thức (Ảnh 2) */}
        <div className="space-y-3 pt-2">
          {SOCIAL_CHANNELS.map((channel) => (
            <div
              key={channel.name}
              className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-slate-200/80 shadow-xs flex items-center justify-between gap-4 transition-all hover:shadow-md"
            >
              <div className="flex items-center gap-3.5 sm:gap-4 min-w-0">
                <div
                  className={`w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-white shrink-0 ${channel.iconBg} shadow-2xs`}
                >
                  {channel.icon}
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-slate-900 text-sm sm:text-base tracking-tight truncate">
                    {channel.name}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium truncate">
                    {channel.handle}
                  </p>
                </div>
              </div>

              <a
                href={channel.url}
                target="_blank"
                rel="noreferrer"
                className={`px-5 sm:px-6 py-2 sm:py-2.5 rounded-full text-white text-xs sm:text-sm font-bold shrink-0 transition-all shadow-2xs cursor-pointer ${channel.btnBg}`}
              >
                Truy cập ngay
              </a>
            </div>
          ))}
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
          className="self-start sm:self-auto px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-xs transition-all"
        >
          Về Tổng quan
        </Link>
      </div>

      {/* 2. Thanh tiến trình (Stepper): Tinh gọn, thanh lịch */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-xs">
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
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all shrink-0 ${
                  isDone 
                    ? 'bg-[#1657c1] text-white' 
                    : isActive 
                      ? 'bg-[#fdc455] text-slate-950 ring-4 ring-amber-400/25 shadow-xs font-black' 
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

      {/* STEP 1: CHỌN BAN CHUYÊN MÔN (BỐ CỤC THỐNG NHẤT, GỌN GÀNG, ÍT CHỮ) */}
      {step === 1 && (
        <div className="space-y-6">
          {!profileComplete ? (
            <div className="rounded-2xl bg-white border border-amber-200/90 shadow-xs p-5 space-y-4 animate-slide-up">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-300/40 flex items-center justify-center text-amber-600 shrink-0">
                    <AlertCircle className="w-5 h-5 stroke-[2.2]" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <span>Hoàn thiện hồ sơ cá nhân</span>
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                        Bắt buộc
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Cần cập nhật Phần 1 & Phần 2 để mở khóa câu hỏi chuyên môn.
                    </p>
                  </div>
                </div>

                <Link href="/member/profile" className="shrink-0 self-start sm:self-auto">
                  <Button className="bg-[#1657c1] hover:bg-[#0f449e] text-white font-bold text-xs rounded-full px-5 py-2.5 h-auto shadow-xs cursor-pointer transition-all">
                    Cập nhật hồ sơ
                  </Button>
                </Link>
              </div>

              {/* Status pills row */}
              <div className="flex flex-wrap items-center gap-2.5 pt-3 border-t border-slate-100">
                <div
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                    part1Complete
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200 shadow-2xs'
                      : 'bg-amber-50/80 text-amber-800 border-amber-200/80'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${part1Complete ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`} />
                  <span>Phần 1: {part1Complete ? 'Đã hoàn thành' : 'Còn thiếu'}</span>
                </div>

                <div
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                    part2Complete
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200 shadow-2xs'
                      : 'bg-amber-50/80 text-amber-800 border-amber-200/80'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${part2Complete ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`} />
                  <span>Phần 2: {part2Complete ? 'Đã hoàn thành' : 'Còn thiếu'}</span>
                </div>

                {missingProfileFields.length > 0 && (
                  <span className="text-[11px] text-amber-800/90 font-medium pl-1 hidden sm:inline">
                    (Thiếu: {missingProfileFields.slice(0, 4).join(', ')}{missingProfileFields.length > 4 ? '...' : ''})
                  </span>
                )}
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-white border border-emerald-200/80 text-xs sm:text-sm text-emerald-900 flex items-center justify-between gap-4 shadow-xs">
              <span className="font-bold flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <span>Hồ sơ đã hoàn tất! Bạn đã được mở khóa quyền trả lời câu hỏi chuyên môn.</span>
              </span>
              <Link href="/member/profile" className="text-emerald-700 underline font-bold hover:text-emerald-900 text-xs shrink-0">
                Chỉnh sửa hồ sơ
              </Link>
            </div>
          )}

          {/* Master Card: Hợp nhất Nguyện vọng 1 & Nguyện vọng 2 trong 1 thể thống nhất */}
          <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-7 shadow-xs space-y-7">
            {/* Phân khu 1: Nguyện vọng chính thức (NV1) */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3.5">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#1657c1] text-white">
                      Nguyện vọng 1
                    </span>
                    <span className="text-base font-bold text-slate-900">
                      Ban bạn muốn ứng tuyển chính thức
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Chọn 01 Ban chuyên môn phù hợp nhất với thế mạnh và định hướng của bạn
                  </p>
                </div>
                <span className="self-start sm:self-auto text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 px-3 py-1 rounded-full">
                  Bắt buộc
                </span>
              </div>

              {/* Link tham khảo trang thông tin riêng về CLB & các ban */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-xl bg-blue-50/50 border border-blue-100 text-xs text-slate-700">
                <span className="text-slate-600">Tìm hiểu chi tiết chức năng, nhiệm vụ và quyền lợi từng ban?</span>
                <Link href="/member/about" className="text-[#1657c1] font-bold hover:underline shrink-0 flex items-center gap-1">
                  Xem chi tiết các ban
                </Link>
              </div>

              {/* 3 Thẻ Ban Chuyên môn: Đồng bộ Style xen kẽ Xanh - Vàng chuẩn Nhận diện Thương hiệu như Thống kê Dashboard */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {departments.map((dept, index) => {
                  const isSelected = selectedDept === dept.id
                  const isGold = index % 2 === 1

                  const shortDescMap: Record<string, string> = {
                    "Ban Truyền thông": "Sáng tạo nội dung, thiết kế đồ họa & sản xuất media.",
                    "Ban Tư vấn": "Tư vấn tuyển sinh, định hướng & tổ chức sự kiện.",
                    "Ban Nhân sự": "Quản trị nhân lực, tổ chức sự kiện & văn hóa CLB.",
                  }

                  const shortDesc = shortDescMap[dept.name] || dept.description || ""

                  return (
                    <div
                      key={dept.id}
                      onClick={() => setSelectedDept(dept.id)}
                      className={`group rounded-2xl border-2 p-5 shadow-xs transition-all flex flex-col justify-between space-y-3 cursor-pointer text-left ${
                        isGold
                          ? (isSelected
                              ? "border-[#fdc455] bg-amber-50/25 ring-4 ring-amber-400/25 shadow-md"
                              : "border-[#fdc455] bg-white hover:shadow-md hover:bg-amber-50/10")
                          : (isSelected
                              ? "border-[#1657c1] bg-blue-50/25 ring-4 ring-blue-500/20 shadow-md"
                              : "border-[#1657c1] bg-white hover:shadow-md hover:bg-blue-50/10")
                      }`}
                    >
                      {/* Top row: Tag solid pill & Trạng thái NV1 */}
                      <div className="flex items-center justify-between gap-2">
                        <span className={`text-xs font-bold uppercase tracking-wide px-2.5 py-0.5 rounded shadow-2xs ${
                          isGold
                            ? "text-amber-950 bg-[#fdc455]"
                            : "text-white bg-[#1657c1]"
                        }`}>
                          Ban ứng tuyển
                        </span>

                        {isSelected ? (
                          <span className={`inline-flex items-center gap-1 text-xs font-bold ${
                            isGold ? "text-amber-900" : "text-[#1657c1]"
                          }`}>
                            <Check className="w-3.5 h-3.5 stroke-[3]" /> Đã chọn NV1
                          </span>
                        ) : (
                          <span className={`text-xs font-semibold ${
                            isGold ? "text-amber-900" : "text-[#1657c1]"
                          }`}>
                            Nguyện vọng
                          </span>
                        )}
                      </div>

                      {/* Body: Tên ban & Mô tả */}
                      <div>
                        <h4 className={`text-lg sm:text-xl font-bold truncate ${
                          isSelected
                            ? (isGold ? "text-amber-950" : "text-[#1657c1]")
                            : "text-slate-900 group-hover:text-[#1657c1] transition-colors"
                        }`}>
                          {dept.name}
                        </h4>
                        <p className="text-xs text-slate-600 leading-relaxed mt-1">
                          {shortDesc}
                        </p>
                      </div>

                      {/* Footer: Bottom Pill Badge */}
                      <div className="pt-1">
                        {isSelected ? (
                          <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-md ${
                            isGold
                              ? "text-amber-950 bg-amber-100 border border-amber-300"
                              : "text-[#1657c1] bg-blue-50 border border-blue-200"
                          }`}>
                            <span className={`w-2 h-2 rounded-full ${isGold ? "bg-amber-600" : "bg-[#1657c1]"}`} />
                            Đã chọn làm Nguyện vọng 1
                          </span>
                        ) : (
                          <span className={`inline-flex items-center text-xs font-medium px-2.5 py-1 rounded-md transition-colors ${
                            isGold
                              ? "text-slate-600 bg-slate-100 border border-slate-200 group-hover:bg-amber-100/70 group-hover:text-amber-950 group-hover:border-amber-300"
                              : "text-slate-600 bg-slate-100 border border-slate-200 group-hover:bg-blue-50 group-hover:text-[#1657c1] group-hover:border-blue-200"
                          }`}>
                            Nhấn để chọn ban này
                          </span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Phân khu 2: Nguyện vọng phụ (NV2) */}
            <div className="pt-3 border-t border-slate-100 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
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
                  <SelectTrigger className="rounded-xl border border-slate-200 h-11 text-xs sm:text-sm bg-white focus:border-[#1657c1] focus:ring-2 focus:ring-blue-100">
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
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
            <div className="text-xs sm:text-sm text-slate-600">
              {selectedDept ? (
                <div>
                  Đã chọn NV1: <strong className="text-[#1657c1] font-bold text-sm sm:text-base">{departments.find(d => d.id === selectedDept)?.name}</strong>
                  {selectedDept2 && (
                    <span className="text-slate-500"> • NV2: <strong className="text-slate-800 font-bold">{departments.find(d => d.id === selectedDept2)?.name}</strong></span>
                  )}
                </div>
              ) : (
                <span className="text-amber-800 font-bold">Vui lòng chọn 01 Ban chuyên môn để tiếp tục</span>
              )}
            </div>

            {!profileComplete ? (
              <Link href="/member/profile">
                <Button className="px-6 py-2.5 rounded-full bg-[#1657c1] hover:bg-[#0f449e] text-white font-bold text-xs sm:text-sm shadow-xs transition-all cursor-pointer h-11">
                  Cần hoàn thiện Hồ sơ (Phần 1 & 2)
                </Button>
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => {
                  if (!profileComplete) {
                    toast({
                      title: 'Hồ sơ chưa hoàn thiện',
                      description: 'Bạn cần hoàn tất cả Phần 1 và Phần 2 hồ sơ cá nhân trước khi điền câu hỏi ứng tuyển.',
                      variant: 'destructive',
                    })
                    return
                  }
                  setStep(2)
                }}
                disabled={!selectedDept}
                className="px-8 py-2.5 rounded-full bg-[#fdc455] hover:bg-[#f59e0b] disabled:opacity-50 text-slate-950 font-bold text-sm shadow-xs transition-all cursor-pointer disabled:cursor-not-allowed shrink-0 text-center h-11"
              >
                Tiếp tục: Trả lời câu hỏi
              </button>
            )}
          </div>
        </div>
      )}

      {/* STEP 2: TRẢ LỜI CÂU HỎI */}
      {step === 2 && (
        !profileComplete ? (
          <div className="bg-white border border-amber-200/80 rounded-2xl p-8 sm:p-10 text-center shadow-xs space-y-4 animate-slide-up">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-300/40 text-amber-600 flex items-center justify-center mx-auto">
              <Lock className="w-7 h-7" />
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900">
              Khóa quyền trả lời câu hỏi chuyên môn
            </h2>
            <p className="text-slate-600 text-xs sm:text-sm max-w-md mx-auto leading-relaxed">
              Bạn cần cập nhật đầy đủ <b>Phần 1: Thông tin cá nhân</b> và <b>Phần 2: Thông tin học vấn</b> để mở khóa các câu hỏi phỏng vấn ứng tuyển.
            </p>
            {missingProfileFields.length > 0 && (
              <div className="text-xs text-amber-900 bg-amber-50/80 p-3 rounded-xl border border-amber-200/80 max-w-md mx-auto">
                <strong>Các mục bạn còn thiếu:</strong> {missingProfileFields.join(', ')}
              </div>
            )}
            <div className="pt-2 flex flex-wrap justify-center gap-3">
              <Link href="/member/profile">
                <Button className="bg-[#1657c1] hover:bg-[#0f449e] text-white font-bold text-xs rounded-full px-6 py-2.5 h-auto cursor-pointer shadow-xs">
                  Cập nhật hồ sơ cá nhân (Phần 1 & 2)
                </Button>
              </Link>
              <Button variant="outline" onClick={() => setStep(1)} className="text-xs font-bold rounded-full px-5 py-2.5 h-auto cursor-pointer">
                Quay lại chọn ban
              </Button>
            </div>
          </div>
        ) : (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-7 shadow-xs space-y-6">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-[#1657c1]">
                  Câu hỏi chuyên môn - {departments.find(d => d.id === selectedDept)?.name}
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Vui lòng trả lời chân thành và đầy đủ các câu hỏi để Ban Tuyển quân CLB hiểu rõ về bạn
                </p>
              </div>
              <span className="px-3 py-1 rounded-full bg-blue-50 text-[#1657c1] border border-blue-200 font-bold text-xs">
                {questions.length} câu hỏi
              </span>
            </div>

            <div className="space-y-5">
              {questions.length === 0 ? (
                <div className="text-center py-8 text-slate-400">Chưa có câu hỏi nào cho ban này.</div>
              ) : (
                questions.map((q, i) => (
                  <div key={q.id} className="p-5 rounded-2xl bg-slate-50/60 border border-slate-200/80 space-y-3">
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
              className="px-6 py-2.5 rounded-full border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs sm:text-sm transition-all cursor-pointer shadow-xs"
            >
              Quay lại chọn ban
            </button>

            <button
              type="button"
              onClick={() => setStep(3)}
              className="px-8 py-2.5 rounded-full bg-[#fdc455] hover:bg-[#f59e0b] text-slate-950 font-bold text-xs sm:text-sm shadow-xs transition-all cursor-pointer"
            >
              Xem lại & Nộp đơn
            </button>
          </div>
        </div>
        )
      )}

      {/* STEP 3: XEM LẠI & NỘP */}
      {step === 3 && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-7 shadow-xs space-y-6">
            <div className="border-b border-slate-100 pb-3">
              <div className="text-xs font-bold uppercase tracking-wider text-[#1657c1]">
                Xác nhận thông tin trước khi nộp chính thức
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Kiểm tra kỹ nguyện vọng và các câu trả lời của bạn trước khi gửi
              </p>
            </div>

            {/* Khối xem lại nguyện vọng */}
            <div className="p-5 rounded-2xl bg-blue-50/50 border border-blue-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="text-xs font-bold text-slate-500">Nguyện vọng 1 (Chính thức):</div>
                <div className="font-bold text-lg text-[#1657c1]">
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
                <div key={q.id} className="border-l-4 border-[#1657c1] pl-4 py-2 space-y-1 bg-slate-50/60 rounded-r-xl">
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

          <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 text-xs sm:text-sm text-amber-950 leading-relaxed">
            <strong>Lưu ý:</strong> Sau khi nộp đơn chính thức, bạn sẽ không thể thay đổi ban ứng tuyển. Vui lòng kiểm tra chắc chắn các câu trả lời.
          </div>

          <div className="flex justify-between items-center pt-2">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="px-6 py-2.5 rounded-full border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs sm:text-sm transition-all cursor-pointer shadow-xs"
            >
              Quay lại sửa câu hỏi
            </button>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="px-9 py-2.5 rounded-full bg-[#fdc455] hover:bg-[#f59e0b] text-slate-950 font-bold text-sm shadow-xs transition-all cursor-pointer"
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
