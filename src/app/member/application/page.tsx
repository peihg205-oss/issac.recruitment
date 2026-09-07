'use client'
import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/use-toast'
import { Loader2, ChevronRight, ChevronLeft, Send, CheckCircle } from 'lucide-react'
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
          title: 'Nộp đơn thành công!',
          description: 'Hồ sơ của bạn đã được chuyển đến Ban tuyển dụng iSSAC.',
          variant: 'success'
        } as Parameters<typeof toast>[0])
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

      if (error) { toast({ title: 'Lỗi', description: error.message, variant: 'destructive' }); setSubmitting(false); return }
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

    toast({ title: '🎉 Nộp đơn thành công!', description: 'Đơn ứng tuyển đã được gửi. Chúng tôi sẽ xem xét sớm nhất.' } as Parameters<typeof toast>[0])
    setSubmitting(false)
    router.push('/member/dashboard')
  }

  if (loading) return <div className="flex items-center justify-center min-h-[400px]"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>

  // Already submitted
  if (existingApp && existingApp.status !== 'draft') {
    const dept = (existingApp as any).departments
    return (
      <div className="space-y-6 animate-fade-in">
        <h1 className="text-2xl font-black text-gray-900">Đơn ứng tuyển</h1>
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="py-8 text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-black text-gray-900 mb-2">Đã nộp đơn thành công!</h2>
            <p className="text-gray-600 mb-4">
              Đơn ứng tuyển vào <strong>{dept?.name || 'ban đã chọn'}</strong> của bạn đã được ghi nhận.
            </p>
            <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold ${APPLICATION_STATUS_COLORS[existingApp.status as ApplicationStatus] || 'bg-gray-100 text-gray-700'}`}>
              Trạng thái: {APPLICATION_STATUS_LABELS[existingApp.status as ApplicationStatus] || existingApp.status}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-black text-gray-900">Ứng tuyển iSSAC 2026</h1>
        <p className="text-gray-500 text-sm">Điền đầy đủ thông tin để hoàn thành đơn ứng tuyển</p>
      </div>

      {/* Progress */}
      <div className="flex items-center gap-2">
        {[{ n: 1, l: 'Chọn ban' }, { n: 2, l: 'Câu hỏi' }, { n: 3, l: 'Xác nhận' }].map((s, i) => (
          <div key={s.n} className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step >= s.n ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-400'}`}>{s.n}</div>
            <span className={`text-sm font-medium ${step >= s.n ? 'text-blue-700' : 'text-gray-400'}`}>{s.l}</span>
            {i < 2 && <ChevronRight className="w-4 h-4 text-gray-300" />}
          </div>
        ))}
      </div>

      {/* Step 1: Select department */}
      {step === 1 && (
        <div className="space-y-4">
          {!profileComplete && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
              ⚠️ <strong>Hồ sơ chưa đầy đủ.</strong> Vui lòng điền đầy đủ thông tin cá nhân trước khi ứng tuyển.
              <a href="/member/profile" className="underline ml-1">Cập nhật ngay</a>
            </div>
          )}

          <Card>
            <CardHeader><CardTitle className="text-base">Nguyện vọng 1 — Ban muốn ứng tuyển</CardTitle></CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4">
                {departments.map(dept => (
                  <button
                    key={dept.id}
                    onClick={() => setSelectedDept(dept.id)}
                    className={`p-5 rounded-xl border-2 text-left transition-all ${
                      selectedDept === dept.id
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-100 hover:border-blue-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className={`font-bold text-sm mb-1 ${selectedDept === dept.id ? 'text-blue-700' : 'text-gray-900'}`}>{dept.name}</div>
                    <div className="text-xs text-gray-500">{dept.description}</div>
                    {selectedDept === dept.id && <CheckCircle className="w-4 h-4 text-blue-600 mt-2" />}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Nguyện vọng 2 (không bắt buộc)</CardTitle></CardHeader>
            <CardContent>
              <Select value={selectedDept2} onValueChange={setSelectedDept2}>
                <SelectTrigger><SelectValue placeholder="Chọn ban nguyện vọng 2 (nếu có)" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Không chọn</SelectItem>
                  {departments.filter(d => d.id !== selectedDept).map(d => (
                    <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          <Button onClick={() => setStep(2)} disabled={!selectedDept || !profileComplete} className="gap-2">
            Tiếp theo <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* Step 2: Questions */}
      {step === 2 && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Câu hỏi ứng tuyển — {departments.find(d => d.id === selectedDept)?.name}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {questions.length === 0 ? (
                <div className="text-center py-8 text-gray-400">Chưa có câu hỏi nào cho ban này.</div>
              ) : (
                questions.map((q, i) => (
                  <div key={q.id} className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-900">
                      {i + 1}. {q.question_text}
                      {q.is_required && <span className="text-red-500 ml-1">*</span>}
                    </Label>

                    {(q.question_type === 'short_text') && (
                      <Input value={answers[q.id] || ''} onChange={e => handleAnswer(q.id, e.target.value)} placeholder={q.placeholder || 'Nhập câu trả lời...'} />
                    )}
                    {(q.question_type === 'long_text') && (
                      <Textarea value={answers[q.id] || ''} onChange={e => handleAnswer(q.id, e.target.value)} placeholder={q.placeholder || 'Nhập câu trả lời...'} rows={4} />
                    )}
                    {(q.question_type === 'multiple_choice' || q.question_type === 'dropdown') && (
                      <Select value={answers[q.id] || ''} onValueChange={v => handleAnswer(q.id, v)}>
                        <SelectTrigger><SelectValue placeholder="Chọn một đáp án..." /></SelectTrigger>
                        <SelectContent>
                          {q.question_options?.map(opt => (
                            <SelectItem key={opt.id} value={opt.option_text}>{opt.option_text}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                    {q.question_type === 'checkbox' && (
                      <div className="grid gap-2">
                        {q.question_options?.map(opt => (
                          <label key={opt.id} className="flex items-center gap-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={(checkboxAnswers[q.id] || []).includes(opt.option_text)}
                              onChange={e => handleCheckbox(q.id, opt.option_text, e.target.checked)}
                              className="w-4 h-4 text-blue-600 rounded border-gray-300"
                            />
                            <span className="text-sm text-gray-700">{opt.option_text}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setStep(1)} className="gap-2"><ChevronLeft className="w-4 h-4" /> Quay lại</Button>
            <Button onClick={() => setStep(3)} className="gap-2">Xem lại & Nộp <ChevronRight className="w-4 h-4" /></Button>
          </div>
        </div>
      )}

      {/* Step 3: Review */}
      {step === 3 && (
        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Xem lại trước khi nộp đơn</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-blue-50 rounded-xl p-4">
                <div className="text-sm font-semibold text-blue-800 mb-1">Nguyện vọng 1</div>
                <div className="font-bold text-blue-900">{departments.find(d => d.id === selectedDept)?.name}</div>
                {selectedDept2 && (
                  <div className="mt-2">
                    <div className="text-sm font-semibold text-blue-800 mb-1">Nguyện vọng 2</div>
                    <div className="font-bold text-blue-900">{departments.find(d => d.id === selectedDept2)?.name}</div>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                {questions.map((q, i) => (
                  <div key={q.id} className="border-l-2 border-blue-200 pl-4">
                    <div className="text-xs font-semibold text-gray-500 mb-1">{i + 1}. {q.question_text}</div>
                    <div className="text-sm text-gray-900">
                      {answers[q.id] || (checkboxAnswers[q.id]?.join(', ')) || <span className="text-gray-400 italic">Chưa trả lời</span>}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
            ⚠️ Sau khi nộp đơn, bạn sẽ không thể thay đổi ban ứng tuyển và một số thông tin quan trọng.
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setStep(2)} className="gap-2"><ChevronLeft className="w-4 h-4" /> Quay lại</Button>
            <Button onClick={handleSubmit} disabled={submitting} variant="gold" className="gap-2">
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Nộp đơn ứng tuyển
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
