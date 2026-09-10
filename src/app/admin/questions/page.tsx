'use client'
import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/use-toast'
import { HelpCircle, Plus, Edit2, Trash2, Loader2, Lock, Sparkles, Layers } from 'lucide-react'
import { MOCK_DEPARTMENTS } from '@/lib/mock-data'
import { ADMIN_ROLE_CONFIGS, type AdminRoleType } from '@/lib/permissions'
import { getStoredSystemSettings } from '@/lib/system-settings'
import {
  fetchAllQuestions,
  saveQuestionItem,
  deleteQuestionItem,
  subscribeQuestionsChange,
  DEFAULT_COMMON_QUESTIONS,
  type QuestionItem
} from '@/lib/questions-manager'

const QUESTION_TYPES: Record<string, string> = {
  short_text: 'Văn bản ngắn',
  long_text: 'Văn bản dài (Tự luận)',
  multiple_choice: 'Trắc nghiệm một lựa chọn',
  checkbox: 'Chọn nhiều phương án',
  dropdown: 'Danh sách thả xuống',
}

export default function QuestionsPage() {
  const supabase = createClient()
  const { toast } = useToast()

  const [activeRole, setActiveRole] = useState<AdminRoleType>('chu-nhiem')
  const [questions, setQuestions] = useState<QuestionItem[]>(DEFAULT_COMMON_QUESTIONS)
  const [departments, setDepartments] = useState<any[]>(MOCK_DEPARTMENTS)
  const [deptFilter, setDeptFilter] = useState('all')

  const [showForm, setShowForm] = useState(false)
  const [editQ, setEditQ] = useState<QuestionItem | null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    department_id: 'common',
    question_text: '',
    question_type: 'long_text' as QuestionItem['question_type'],
    placeholder: '',
    is_required: true,
  })

  useEffect(() => {
    const match = document.cookie.match(/issac_admin_role=([^;]+)/)
    if (match && match[1] in ADMIN_ROLE_CONFIGS) {
      const role = match[1] as AdminRoleType
      setActiveRole(role)
      if (role !== 'chu-nhiem') {
        setDeptFilter(role) // Mặc định mở ngay tab của Ban đang đăng nhập
      }
    }
  }, [])

  const isSuperAdmin = activeRole === 'chu-nhiem'
  const userDeptObj = departments.find(d => d.slug === activeRole)
  const [isQuestionsPublished, setIsQuestionsPublished] = useState(true)

  useEffect(() => {
    const s = getStoredSystemSettings()
    setIsQuestionsPublished(s.questions_published !== 'false')

    const onUpdate = () => {
      const cur = getStoredSystemSettings()
      setIsQuestionsPublished(cur.questions_published !== 'false')
    }
    window.addEventListener('issac_system_settings_updated', onUpdate)
    window.addEventListener('storage', onUpdate)
    return () => {
      window.removeEventListener('issac_system_settings_updated', onUpdate)
      window.removeEventListener('storage', onUpdate)
    }
  }, [])

  const handleTogglePublish = async () => {
    const next = !isQuestionsPublished
    setIsQuestionsPublished(next)
    const settings = getStoredSystemSettings()
    settings.questions_published = next ? 'true' : 'false'
    if (typeof window !== 'undefined') {
      localStorage.setItem('issac_system_settings', JSON.stringify(settings))
      window.dispatchEvent(new Event('issac_system_settings_updated'))
    }

    try {
      await supabase.from('system_settings').upsert({
        key: 'questions_published',
        value: next ? 'true' : 'false',
        label: 'Công khai bộ câu hỏi & Cho phép làm đơn',
        value_type: 'boolean',
      }, { onConflict: 'key' })
    } catch {}

    toast({
      title: next ? '✅ Đã công khai bộ câu hỏi' : '🔒 Đã tạm khóa bộ câu hỏi',
      description: next
        ? 'Ứng viên đã có thể điền câu hỏi ứng tuyển trong kỳ tuyển quân.'
        : 'Ứng viên chỉ có thể cập nhật thông tin cá nhân và chưa được làm đơn.',
    })
  }

  const fetchData = useCallback(async () => {
    try {
      const [qs, { data: depts }] = await Promise.all([
        fetchAllQuestions(),
        supabase.from('departments').select('id, name, slug').neq('slug', 'chu-nhiem'),
      ])
      if (qs && qs.length > 0) setQuestions(qs)
      if (depts && depts.length > 0) setDepartments(depts)
    } catch {}
  }, [supabase])

  useEffect(() => {
    fetchData()
    const unsubscribe = subscribeQuestionsChange(() => {
      fetchData()
    })
    return () => {
      unsubscribe()
    }
  }, [fetchData])

  const openCreate = () => {
    setEditQ(null)
    let initialDept = 'common'
    if (!isSuperAdmin) {
      initialDept = userDeptObj?.id || 'common'
    } else {
      if (deptFilter === 'general' || deptFilter === 'all') {
        initialDept = 'common'
      } else {
        const found = departments.find(d => d.slug === deptFilter)
        initialDept = found?.id || 'common'
      }
    }

    setForm({
      department_id: initialDept,
      question_text: '',
      question_type: 'long_text',
      placeholder: '',
      is_required: true,
    })
    setShowForm(true)
  }

  const openEdit = (q: QuestionItem) => {
    // Phân quyền: Ban chuyên môn chỉ được sửa câu hỏi của ban mình
    if (!isSuperAdmin && q.departments?.slug !== activeRole && q.department_id !== userDeptObj?.id) {
      toast({ title: 'Không có quyền chỉnh sửa câu hỏi này', variant: 'destructive' })
      return
    }

    setEditQ(q)
    setForm({
      department_id: q.department_id || 'common',
      question_text: q.question_text,
      question_type: q.question_type,
      placeholder: q.placeholder || '',
      is_required: q.is_required,
    })
    setShowForm(true)
  }

  const handleSave = async () => {
    if (!form.question_text.trim()) {
      toast({ title: 'Vui lòng nhập nội dung câu hỏi', variant: 'destructive' })
      return
    }

    setSaving(true)
    const targetDeptId = isSuperAdmin
      ? (form.department_id === 'common' ? null : form.department_id)
      : (userDeptObj?.id || null)

    const assignedDept = departments.find(d => d.id === targetDeptId) || null

    try {
      const saved = await saveQuestionItem({
        id: editQ ? editQ.id : undefined,
        department_id: targetDeptId,
        question_text: form.question_text.trim(),
        question_type: form.question_type,
        placeholder: form.placeholder.trim() || null,
        is_required: form.is_required,
        sort_order: editQ ? editQ.sort_order : questions.length + 1,
        departments: assignedDept,
        question_options: editQ ? editQ.question_options : [],
      })

      if (editQ) {
        setQuestions(prev => prev.map(q => q.id === editQ.id ? { ...saved, departments: assignedDept } : q))
        toast({ title: 'Đã lưu thay đổi câu hỏi thành công' })
      } else {
        setQuestions(prev => [...prev, { ...saved, departments: assignedDept }])
        toast({ title: 'Đã tạo câu hỏi mới thành công' })
      }
      setShowForm(false)
    } catch (err: any) {
      toast({ title: 'Lỗi lưu câu hỏi', description: err.message, variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (q: QuestionItem) => {
    if (!isSuperAdmin && q.departments?.slug !== activeRole && q.department_id !== userDeptObj?.id) {
      toast({ title: 'Không có quyền xóa câu hỏi này', variant: 'destructive' })
      return
    }

    if (confirm(`Bạn có chắc chắn muốn xóa câu hỏi: "${q.question_text}"?`)) {
      try {
        await deleteQuestionItem(q.id)
        setQuestions(prev => prev.filter(item => item.id !== q.id))
        toast({ title: 'Đã xóa câu hỏi thành công' })
      } catch (err: any) {
        toast({ title: 'Lỗi xóa câu hỏi', description: err.message, variant: 'destructive' })
      }
    }
  }

  // Phân loại câu hỏi
  const commonQuestions = questions.filter(q => !q.department_id)
  const filtered = deptFilter === 'all'
    ? questions
    : deptFilter === 'general'
    ? commonQuestions
    : questions.filter(q => q.departments?.slug === deptFilter || q.department_id === departments.find(d => d.slug === deptFilter)?.id)

  return (
    <div className="space-y-6 animate-fade-in max-w-6xl font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2.5 tracking-tight">
            <HelpCircle className="w-6 h-6 text-[#1559c5]" />
            Quản lý Ngân hàng Câu hỏi
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
            Thiết lập câu hỏi chung toàn CLB và câu hỏi chuyên môn của từng Ban (Đồng bộ real-time với Ứng viên)
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {isSuperAdmin && (
            <button
              type="button"
              role="switch"
              aria-checked={isQuestionsPublished}
              onClick={handleTogglePublish}
              className={`flex items-center gap-3 px-4 py-1.5 rounded-full border-2 text-xs font-bold transition-all cursor-pointer shadow-xs select-none ${
                isQuestionsPublished
                  ? 'bg-emerald-50/90 text-emerald-900 border-[#1559c5] hover:bg-emerald-100/80'
                  : 'bg-[#fffdf5] text-amber-950 border-[#1559c5] hover:bg-amber-50'
              }`}
              title={isQuestionsPublished ? 'Bộ câu hỏi đang công khai. Nhấn để tạm khóa.' : 'Bộ câu hỏi đang tạm khóa. Nhấn để công khai.'}
            >
              <span>Bộ câu hỏi</span>
              <span
                className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full p-0.5 transition-colors duration-200 ease-in-out ${
                  isQuestionsPublished ? 'bg-emerald-500' : 'bg-slate-300'
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform duration-200 ease-in-out ${
                    isQuestionsPublished ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </span>
            </button>
          )}

          <Button
            onClick={openCreate}
            className="gap-2 bg-[#1559c5] hover:bg-[#0f449e] text-white font-bold rounded-xl shadow-xs px-4 py-2"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" /> Thêm câu hỏi
          </Button>
        </div>
      </div>

      {/* Filter Tabs — Xem danh sách đầy đủ tất cả các ban */}
      <div className="flex gap-2 flex-wrap items-center">
        <button
          onClick={() => setDeptFilter('all')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 ${
            deptFilter === 'all'
              ? 'bg-[#1559c5] text-white shadow-xs'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Tất cả</span>
          <span className={`text-[11px] px-1.5 py-0.2 rounded-full font-black ${
            deptFilter === 'all' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
          }`}>
            {questions.length}
          </span>
        </button>

        <button
          onClick={() => setDeptFilter('general')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 ${
            deptFilter === 'general'
              ? 'bg-[#1559c5] text-white shadow-xs'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>Câu hỏi chung (Toàn CLB)</span>
          <span className={`text-[11px] px-1.5 py-0.2 rounded-full font-black ${
            deptFilter === 'general' ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-900'
          }`}>
            {commonQuestions.length}
          </span>
        </button>

        {departments.map(d => {
          const deptCount = questions.filter(q => q.departments?.slug === d.slug || q.department_id === d.id).length
          const isCurrentAdminDept = d.slug === activeRole && !isSuperAdmin

          return (
            <button
              key={d.id}
              onClick={() => setDeptFilter(d.slug)}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 ${
                deptFilter === d.slug
                  ? 'bg-[#1559c5] text-white shadow-xs'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <span>{d.name}</span>
              {isCurrentAdminDept && <span className="text-[10px] text-amber-500 font-normal">(Ban mình)</span>}
              <span className={`text-[11px] px-1.5 py-0.2 rounded-full font-black ${
                deptFilter === d.slug ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
              }`}>
                {deptCount}
              </span>
            </button>
          )
        })}
      </div>

      {/* Description banner for Common Questions */}
      {deptFilter === 'general' && (
        <div className="bg-amber-50/70 border border-amber-200/90 rounded-2xl p-4 text-xs sm:text-sm text-amber-950 flex items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-5 h-5 text-amber-600 shrink-0" />
            <span>
              <strong>Lưu ý:</strong> Câu hỏi chung sẽ được áp dụng bắt buộc cho <strong>toàn bộ ứng viên</strong> khi nộp đơn, bất kể ứng viên chọn Ban chuyên môn nào.
            </span>
          </div>
          <Button
            size="sm"
            onClick={openCreate}
            className="bg-[#1559c5] hover:bg-[#0f449e] text-white font-bold text-xs rounded-lg shrink-0"
          >
            <Plus className="w-3.5 h-3.5 mr-1" /> Thêm câu hỏi chung
          </Button>
        </div>
      )}

      {/* Questions List */}
      {filtered.length === 0 ? (
        <Card className="text-center py-20 rounded-2xl border border-dashed border-slate-300 bg-white shadow-xs">
          <CardContent>
            <HelpCircle className="w-14 h-14 text-slate-300 mx-auto mb-3" />
            <p className="font-bold text-slate-700 text-base">Chưa có câu hỏi nào trong danh mục này.</p>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Nhấn nút bên dưới để tạo câu hỏi mới cho ứng viên trả lời.
            </p>
            <Button onClick={openCreate} className="mt-4 gap-2 bg-[#1559c5] hover:bg-[#0f449e] text-white font-bold rounded-xl">
              <Plus className="w-4 h-4" /> Thêm câu hỏi ngay
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((q, i) => {
            const isGeneral = !q.department_id
            const canManage = isSuperAdmin || (!isGeneral && (q.departments?.slug === activeRole || q.department_id === userDeptObj?.id))

            return (
              <Card key={q.id} className="hover:shadow-md transition-all rounded-2xl border border-slate-200/90 bg-white">
                <CardContent className="py-4 px-5 flex items-start gap-4">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 border ${
                    isGeneral 
                      ? 'bg-amber-50 text-amber-900 border-amber-200' 
                      : 'bg-blue-50 text-[#1559c5] border-blue-200'
                  }`}>
                    {i + 1}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-slate-900 text-sm mb-1.5 leading-snug">
                      {q.question_text}
                    </div>

                    <div className="flex items-center gap-2 flex-wrap text-xs">
                      <Badge variant="secondary" className="text-[11px] font-medium bg-slate-100 text-slate-700">
                        {QUESTION_TYPES[q.question_type] || q.question_type}
                      </Badge>

                      {isGeneral ? (
                        <Badge className="text-[11px] font-bold bg-amber-100 text-amber-950 border border-amber-300">
                          🌟 Câu hỏi chung (Toàn CLB)
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-[11px] font-bold border-blue-200 text-[#1559c5] bg-blue-50/50">
                          {q.departments?.name || 'Ban chuyên môn'}
                        </Badge>
                      )}

                      {q.is_required && (
                        <Badge variant="destructive" className="text-[10px] uppercase font-bold px-2 py-0.5">
                          Bắt buộc
                        </Badge>
                      )}

                      {q.placeholder && (
                        <span className="text-[11px] text-slate-400 italic truncate max-w-xs">
                          Gợi ý: {q.placeholder}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {canManage ? (
                      <>
                        <button
                          onClick={() => openEdit(q)}
                          className="inline-flex items-center gap-1 text-xs text-[#1559c5] hover:text-blue-800 font-bold py-1.5 px-3 rounded-xl hover:bg-blue-50 border border-slate-200 transition-colors cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" /> Sửa
                        </button>
                        <button
                          onClick={() => handleDelete(q)}
                          className="inline-flex items-center text-xs text-rose-600 hover:text-rose-800 p-2 rounded-xl hover:bg-rose-50 border border-slate-200 transition-colors cursor-pointer"
                          title="Xóa câu hỏi"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs text-slate-400 font-medium py-1.5 px-2.5 bg-slate-50 rounded-xl border border-slate-200">
                        <Lock className="w-3 h-3 text-slate-400" /> Chỉ xem
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Dialog Thêm/Sửa câu hỏi */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="font-bold text-gray-900 text-lg">
              {editQ ? 'Chỉnh sửa câu hỏi' : 'Thêm câu hỏi mới'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2 text-left">
            <div>
              <Label className="text-xs font-bold text-slate-700 mb-1.5 block">Phạm vi áp dụng</Label>
              {isSuperAdmin ? (
                <Select
                  value={form.department_id}
                  onValueChange={v => setForm(f => ({ ...f, department_id: v }))}
                >
                  <SelectTrigger className="rounded-xl border-slate-200 h-11 text-xs sm:text-sm font-medium">
                    <SelectValue placeholder="Chọn phạm vi áp dụng" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="common" className="font-bold text-amber-900">
                      🌟 Câu hỏi chung (Toàn CLB - Tất cả ứng viên)
                    </SelectItem>
                    {departments.map(d => (
                      <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="flex items-center justify-between p-3 bg-blue-50/70 border border-blue-200 rounded-xl text-xs">
                  <div className="font-bold text-[#1559c5]">
                    {userDeptObj?.name || 'Ban phụ trách'}
                  </div>
                  <span className="text-[11px] text-gray-500 font-medium">Cố định theo tài khoản của Ban</span>
                </div>
              )}
            </div>

            <div>
              <Label className="text-xs font-bold text-slate-700 mb-1.5 block">
                Nội dung câu hỏi <span className="text-red-500">*</span>
              </Label>
              <Textarea
                value={form.question_text}
                onChange={e => setForm(f => ({ ...f, question_text: e.target.value }))}
                rows={3}
                placeholder="Nhập nội dung câu hỏi phỏng vấn ứng viên..."
                className="text-xs sm:text-sm rounded-xl border-slate-200 focus:border-[#1559c5]"
              />
            </div>

            <div>
              <Label className="text-xs font-bold text-slate-700 mb-1.5 block">
                Gợi ý câu trả lời (Placeholder)
              </Label>
              <Textarea
                value={form.placeholder}
                onChange={e => setForm(f => ({ ...f, placeholder: e.target.value }))}
                rows={2}
                placeholder="VD: Chia sẻ kinh nghiệm, đường dẫn liên kết, hoặc quan điểm cá nhân..."
                className="text-xs sm:text-sm rounded-xl border-slate-200 focus:border-[#1559c5]"
              />
            </div>

            <div>
              <Label className="text-xs font-bold text-slate-700 mb-1.5 block">Định dạng câu trả lời</Label>
              <Select
                value={form.question_type}
                onValueChange={(v: any) => setForm(f => ({ ...f, question_type: v }))}
              >
                <SelectTrigger className="rounded-xl border-slate-200 h-11 text-xs sm:text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="long_text">Văn bản dài (Tự luận / Trả lời chi tiết)</SelectItem>
                  <SelectItem value="short_text">Văn bản ngắn (1 dòng)</SelectItem>
                  <SelectItem value="multiple_choice">Trắc nghiệm một lựa chọn</SelectItem>
                  <SelectItem value="checkbox">Hộp kiểm chọn nhiều</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="req-check"
                checked={form.is_required}
                onChange={e => setForm(f => ({ ...f, is_required: e.target.checked }))}
                className="w-4 h-4 rounded text-[#1559c5] focus:ring-blue-500 cursor-pointer"
              />
              <label htmlFor="req-check" className="text-xs text-slate-700 cursor-pointer font-bold">
                Bắt buộc ứng viên phải trả lời câu hỏi này
              </label>
            </div>
          </div>

          <DialogFooter className="gap-2 pt-2 border-t border-slate-100">
            <Button variant="outline" onClick={() => setShowForm(false)} className="rounded-xl text-xs font-bold">
              Hủy
            </Button>
            <Button onClick={handleSave} disabled={saving} className="bg-[#1559c5] hover:bg-[#0f449e] text-white font-bold rounded-xl text-xs">
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
              {editQ ? 'Lưu thay đổi' : 'Thêm câu hỏi'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
