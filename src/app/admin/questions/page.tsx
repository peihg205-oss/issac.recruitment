'use client'
import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/use-toast'
import { FileQuestion, Plus, Edit2, Trash2, HelpCircle, Loader2, Lock, ShieldCheck, Sparkles } from 'lucide-react'
import { MOCK_DEPARTMENTS } from '@/lib/mock-data'
import { ADMIN_ROLE_CONFIGS, type AdminRoleType } from '@/lib/permissions'

const QUESTION_TYPES: Record<string, string> = {
  short_text: 'Văn bản ngắn',
  long_text: 'Văn bản dài (Tự luận)',
  multiple_choice: 'Trắc nghiệm một lựa chọn',
  checkbox: 'Chọn nhiều phương án',
  dropdown: 'Danh sách thả xuống',
}

const INITIAL_MOCK_QUESTIONS = [
  // General Questions
  { id: 'q-gen-1', department_id: null, question_text: 'Bạn biết đến iSSAC qua kênh thông tin nào?', question_type: 'multiple_choice', is_required: true, sort_order: 1, question_options: [{ id: 'o-1', option_text: 'Fanpage CLB' }, { id: 'o-2', option_text: 'Bạn bè giới thiệu' }, { id: 'o-3', option_text: 'Thầy cô / VNU-IS' }] },
  { id: 'q-gen-2', department_id: null, question_text: 'Mục tiêu lớn nhất của bạn khi ứng tuyển trở thành Đại sứ sinh viên iSSAC?', question_type: 'long_text', is_required: true, sort_order: 2, question_options: [] },

  // Truyền thông
  { id: 'q-tt-1', department_id: 'dept-1', departments: { name: 'Ban Truyền thông', slug: 'truyen-thong' }, question_text: 'Vì sao bạn muốn tham gia Ban Truyền thông iSSAC?', question_type: 'long_text', is_required: true, sort_order: 3, question_options: [] },
  { id: 'q-tt-2', department_id: 'dept-1', departments: { name: 'Ban Truyền thông', slug: 'truyen-thong' }, question_text: 'Bạn đã từng có kinh nghiệm thiết kế (Canva/Photoshop) hoặc làm video (CapCut/Premiere) chưa? Hãy đính kèm link sản phẩm nổi bật.', question_type: 'long_text', is_required: true, sort_order: 4, question_options: [] },
  { id: 'q-tt-3', department_id: 'dept-1', departments: { name: 'Ban Truyền thông', slug: 'truyen-thong' }, question_text: 'Nếu được giao ý tưởng cho video tuyển quân iSSAC 2026, bạn sẽ triển khai như thế nào?', question_type: 'long_text', is_required: false, sort_order: 5, question_options: [] },

  // Tư vấn
  { id: 'q-tv-1', department_id: 'dept-2', departments: { name: 'Ban Tư vấn', slug: 'tu-van' }, question_text: 'Vì sao bạn lựa chọn ứng tuyển vào Ban Tư vấn iSSAC?', question_type: 'long_text', is_required: true, sort_order: 6, question_options: [] },
  { id: 'q-tv-2', department_id: 'dept-2', departments: { name: 'Ban Tư vấn', slug: 'tu-van' }, question_text: 'Theo bạn, kỹ năng quan trọng nhất của người tư vấn là gì? Hãy chia sẻ một tình huống thực tế bạn từng hỗ trợ người khác.', question_type: 'long_text', is_required: true, sort_order: 7, question_options: [] },

  // Nhân sự
  { id: 'q-ns-1', department_id: 'dept-3', departments: { name: 'Ban Nhân sự', slug: 'nhan-su' }, question_text: 'Vì sao bạn muốn trở thành thành viên Ban Nhân sự iSSAC?', question_type: 'long_text', is_required: true, sort_order: 8, question_options: [] },
  { id: 'q-ns-2', department_id: 'dept-3', departments: { name: 'Ban Nhân sự', slug: 'nhan-su' }, question_text: 'Nếu trong ban có hai thành viên bất đồng quan điểm gay gắt trong quá trình làm việc, bạn sẽ giải quyết như thế nào?', question_type: 'long_text', is_required: true, sort_order: 9, question_options: [] },
]

export default function QuestionsPage() {
  const supabase = createClient()
  const { toast } = useToast()

  const [activeRole, setActiveRole] = useState<AdminRoleType>('chu-nhiem')
  const [questions, setQuestions] = useState<any[]>(INITIAL_MOCK_QUESTIONS)
  const [departments, setDepartments] = useState<any[]>(MOCK_DEPARTMENTS)
  const [loading, setLoading] = useState(false)
  const [deptFilter, setDeptFilter] = useState('all')

  const [showForm, setShowForm] = useState(false)
  const [editQ, setEditQ] = useState<any>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    department_id: '',
    question_text: '',
    question_type: 'short_text',
    placeholder: '',
    is_required: true,
    options: ['', ''],
  })

  // Detect role from cookie
  useEffect(() => {
    const match = document.cookie.match(/issac_admin_role=([^;]+)/)
    if (match && match[1] in ADMIN_ROLE_CONFIGS) {
      const r = match[1] as AdminRoleType
      setActiveRole(r)
      // If not Ban Chu Nhiem, default filter to their department
      if (r !== 'chu-nhiem') {
        setDeptFilter(r)
      } else {
        setDeptFilter('all')
      }
    }
  }, [])

  const roleConfig = ADMIN_ROLE_CONFIGS[activeRole] || ADMIN_ROLE_CONFIGS['chu-nhiem']
  const isSuperAdmin = roleConfig.isSuperAdmin

  const fetchData = useCallback(async () => {
    try {
      const [{ data: qs }, { data: depts }] = await Promise.all([
        supabase
          .from('questions')
          .select('*, departments(name, slug), question_options(id, option_text, sort_order)')
          .eq('is_active', true)
          .order('sort_order'),
        supabase.from('departments').select('id, name, slug').neq('slug', 'chu-nhiem'),
      ])
      if (qs && qs.length > 0) setQuestions(qs)
      if (depts && depts.length > 0) setDepartments(depts)
    } catch {
      // Use initial mock questions
    }
  }, [supabase])

  useEffect(() => { fetchData() }, [fetchData])

  // Get department ID for non-super admins
  const userDeptObj = departments.find(d => d.slug === activeRole)

  const openCreate = () => {
    setEditQ(null)
    setForm({
      department_id: isSuperAdmin ? '' : (userDeptObj?.id || 'dept-1'),
      question_text: '',
      question_type: 'long_text',
      placeholder: '',
      is_required: true,
      options: ['', ''],
    })
    setShowForm(true)
  }

  const openEdit = (q: any) => {
    const qDeptSlug = q.departments?.slug
    // Check permission to edit
    if (!isSuperAdmin && qDeptSlug !== activeRole) {
      toast({
        title: 'Không thể sửa',
        description: `Bạn chỉ có quyền sửa câu hỏi của ${roleConfig.shortLabel}.`,
        variant: 'destructive',
      })
      return
    }

    setEditQ(q)
    setForm({
      department_id: q.department_id || '',
      question_text: q.question_text,
      question_type: q.question_type,
      placeholder: q.placeholder || '',
      is_required: q.is_required,
      options: q.question_options?.map((o: any) => o.option_text) || ['', ''],
    })
    setShowForm(true)
  }

  const handleSave = async () => {
    if (!form.question_text.trim()) {
      toast({ title: 'Vui lòng nhập nội dung câu hỏi', variant: 'destructive' })
      return
    }

    setSaving(true)

    // Department assigned
    const assignedDeptId = isSuperAdmin ? (form.department_id || null) : (userDeptObj?.id || 'dept-1')
    const assignedDept = departments.find(d => d.id === assignedDeptId)

    if (editQ) {
      setQuestions(prev => prev.map(q => q.id === editQ.id ? {
        ...q,
        question_text: form.question_text,
        question_type: form.question_type,
        department_id: assignedDeptId,
        departments: assignedDept,
        is_required: form.is_required,
      } : q))
      toast({ title: '✅ Đã cập nhật câu hỏi!', variant: 'success' } as Parameters<typeof toast>[0])
    } else {
      const newQuestion = {
        id: `q-custom-${Date.now()}`,
        department_id: assignedDeptId,
        departments: assignedDept,
        question_text: form.question_text,
        question_type: form.question_type,
        is_required: form.is_required,
        sort_order: questions.length + 1,
        question_options: form.question_type === 'multiple_choice'
          ? form.options.filter(o => o.trim()).map((o, idx) => ({ id: `opt-${idx}`, option_text: o }))
          : [],
      }
      setQuestions(prev => [...prev, newQuestion])
      toast({ title: '✅ Đã tạo câu hỏi mới!', variant: 'success' } as Parameters<typeof toast>[0])
    }

    setSaving(false)
    setShowForm(false)
  }

  const handleDelete = (id: string, qDeptSlug: string | undefined) => {
    if (!isSuperAdmin && qDeptSlug !== activeRole) {
      toast({
        title: 'Không thể xóa',
        description: `Bạn chỉ có quyền xóa câu hỏi của ${roleConfig.shortLabel}.`,
        variant: 'destructive',
      })
      return
    }

    if (confirm('Bạn có chắc chắn muốn xóa câu hỏi này?')) {
      setQuestions(prev => prev.filter(q => q.id !== id))
      toast({ title: 'Đã xóa câu hỏi thành công' } as Parameters<typeof toast>[0])
    }
  }

  // Filter questions
  const filtered = deptFilter === 'all'
    ? questions
    : deptFilter === 'general'
    ? questions.filter(q => !q.department_id)
    : questions.filter(q => q.departments?.slug === deptFilter)

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
            <FileQuestion className="w-6 h-6 text-blue-600" />
            Ngân Hàng Câu Hỏi Phỏng Vấn
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Quản lý bộ câu hỏi trong hồ sơ ứng tuyển theo từng ban chuyên môn
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge className={`px-3 py-1 text-xs font-bold border ${roleConfig.badgeColor}`}>
            {roleConfig.icon} Quyền: {roleConfig.shortLabel}
          </Badge>
          <Button onClick={openCreate} className="gap-1.5 shadow-sm bg-blue-600 hover:bg-blue-700 font-bold text-xs">
            <Plus className="w-4 h-4" />
            {isSuperAdmin ? 'Thêm câu hỏi mới' : `Thêm câu hỏi ${roleConfig.shortLabel}`}
          </Button>
        </div>
      </div>

      {/* RBAC Notice */}
      {isSuperAdmin ? (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3 shadow-sm">
          <div className="w-9 h-9 rounded-xl bg-amber-400 text-amber-950 flex items-center justify-center font-bold text-base flex-shrink-0 shadow-sm">
            👑
          </div>
          <div>
            <div className="font-bold text-amber-950 text-sm flex items-center gap-1.5">
              Quyền Ban Chủ nhiệm (Toàn quyền quản lý câu hỏi)
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            </div>
            <p className="text-xs text-amber-800 mt-0.5">
              Bạn có thể tạo, chỉnh sửa hoặc xóa câu hỏi của <strong>tất cả các ban</strong> và cả <strong>câu hỏi chung</strong> của CLB.
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-4 flex items-start gap-3 shadow-sm">
          <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-base flex-shrink-0 shadow-sm">
            {roleConfig.icon}
          </div>
          <div>
            <div className="font-bold text-blue-950 text-sm flex items-center gap-1.5">
              Phân quyền đặt câu hỏi: {roleConfig.departmentName}
            </div>
            <p className="text-xs text-blue-800 mt-0.5">
              Bạn <strong>chỉ có quyền tạo, sửa và quản lý bộ câu hỏi của {roleConfig.departmentName}</strong>. Câu hỏi của các ban khác và câu hỏi chung của CLB sẽ ở chế độ chỉ đọc.
            </p>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex gap-2 flex-wrap items-center bg-white p-2 rounded-2xl border shadow-sm">
        <span className="text-xs text-gray-400 font-medium px-2 hidden sm:inline">Lọc theo:</span>
        <button
          onClick={() => setDeptFilter('all')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
            deptFilter === 'all'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Tất cả ({questions.length})
        </button>
        <button
          onClick={() => setDeptFilter('general')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
            deptFilter === 'general'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          🌐 Câu hỏi chung ({questions.filter(q => !q.department_id).length})
        </button>
        {departments.map(d => {
          const count = questions.filter(q => q.departments?.slug === d.slug).length
          const isMyDept = d.slug === activeRole
          return (
            <button
              key={d.id}
              onClick={() => setDeptFilter(d.slug)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                deptFilter === d.slug
                  ? 'bg-blue-600 text-white shadow-sm'
                  : isMyDept
                  ? 'bg-blue-50 text-blue-800 border border-blue-200 font-bold'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <span>{d.name}</span>
              <span className="opacity-75">({count})</span>
              {isMyDept && <span className="text-[10px] bg-blue-600 text-white px-1 rounded-full">Ban mình</span>}
            </button>
          )
        })}
      </div>

      {/* Questions List */}
      {filtered.length === 0 ? (
        <Card className="text-center py-16 shadow-sm">
          <CardContent>
            <HelpCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="font-bold text-gray-700">Chưa có câu hỏi nào trong danh mục này</p>
            <p className="text-xs text-gray-400 mt-1">Bấm nút "Thêm câu hỏi mới" để bổ sung câu hỏi</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((q, i) => {
            const qDeptSlug = q.departments?.slug
            const canEdit = isSuperAdmin || qDeptSlug === activeRole

            return (
              <Card key={q.id} className="hover:shadow-md transition-shadow border-l-4 border-l-blue-500">
                <CardContent className="py-4 px-5 flex items-start gap-4">
                  <div className="w-8 h-8 bg-blue-100 rounded-xl flex items-center justify-center text-blue-700 font-black text-xs flex-shrink-0 mt-0.5">
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-gray-900 text-sm mb-1.5">
                      {q.question_text}
                    </div>
                    <div className="flex items-center gap-2 flex-wrap text-xs">
                      <Badge variant="secondary" className="text-[11px] font-semibold bg-gray-100">
                        {QUESTION_TYPES[q.question_type] || q.question_type}
                      </Badge>
                      {q.department_id ? (
                        <Badge className="bg-blue-50 text-blue-800 border-blue-200 text-[11px] font-bold">
                          {q.departments?.name}
                        </Badge>
                      ) : (
                        <Badge className="bg-emerald-50 text-emerald-800 border-emerald-200 text-[11px] font-bold">
                          🌐 Câu hỏi chung
                        </Badge>
                      )}
                      {q.is_required ? (
                        <Badge variant="destructive" className="text-[10px] uppercase">
                          Bắt buộc
                        </Badge>
                      ) : (
                        <span className="text-gray-400 text-[11px]">Tùy chọn</span>
                      )}
                    </div>

                    {q.question_options && q.question_options.length > 0 && (
                      <div className="mt-2.5 flex flex-wrap gap-1.5">
                        {q.question_options.map((opt: any) => (
                          <span key={opt.id} className="text-xs bg-gray-100 border border-gray-200 px-2.5 py-0.5 rounded-lg text-gray-700 font-medium">
                            • {opt.option_text}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Actions according to RBAC */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {canEdit ? (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEdit(q)}
                          className="h-8 text-xs text-blue-600 hover:bg-blue-50"
                        >
                          <Edit2 className="w-3.5 h-3.5 mr-1" /> Sửa
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(q.id, qDeptSlug)}
                          className="h-8 text-xs text-red-500 hover:bg-red-50"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </>
                    ) : (
                      <span className="text-[11px] text-gray-400 font-medium flex items-center gap-1 px-2 py-1 bg-gray-50 rounded-lg border">
                        <Lock className="w-3 h-3 text-gray-400" />
                        Chỉ xem
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Add / Edit Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileQuestion className="w-5 h-5 text-blue-600" />
              {editQ ? 'Chỉnh sửa câu hỏi phỏng vấn' : 'Thêm câu hỏi phỏng vấn mới'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2 text-left">
            {/* Department Select (Locked if not Ban Chu Nhiem) */}
            <div>
              <Label className="text-xs font-bold text-gray-700 mb-1.5 block">
                Phân quyền thuộc Ban:
              </Label>
              {isSuperAdmin ? (
                <Select
                  value={form.department_id}
                  onValueChange={v => setForm(f => ({ ...f, department_id: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn Ban hoặc Câu hỏi chung" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">🌐 Câu hỏi chung (Tất cả ứng viên)</SelectItem>
                    {departments.map(d => (
                      <SelectItem key={d.id} value={d.id}>🏛️ {d.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-900 flex items-center justify-between font-bold">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-blue-600" />
                    <span>Cố định: {roleConfig.departmentName}</span>
                  </div>
                  <span className="text-[10px] bg-blue-200/60 px-2 py-0.5 rounded font-mono text-blue-800">
                    Theo quyền Ban của bạn
                  </span>
                </div>
              )}
            </div>

            {/* Question Text */}
            <div>
              <Label className="text-xs font-bold text-gray-700 mb-1.5 block">
                Nội dung câu hỏi <span className="text-red-500">*</span>
              </Label>
              <Textarea
                value={form.question_text}
                onChange={e => setForm(f => ({ ...f, question_text: e.target.value }))}
                rows={3}
                placeholder="VD: Bạn hãy chia sẻ kinh nghiệm xử lý khủng hoảng truyền thông..."
                className="text-sm"
              />
            </div>

            {/* Question Type */}
            <div>
              <Label className="text-xs font-bold text-gray-700 mb-1.5 block">
                Loại câu hỏi trả lời:
              </Label>
              <Select
                value={form.question_type}
                onValueChange={v => setForm(f => ({ ...f, question_type: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="long_text">📝 Văn bản dài (Tự luận mở)</SelectItem>
                  <SelectItem value="short_text">✏️ Văn bản ngắn</SelectItem>
                  <SelectItem value="multiple_choice">🔘 Trắc nghiệm chọn một</SelectItem>
                  <SelectItem value="checkbox">☑️ Hộp kiểm chọn nhiều</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Required Toggle */}
            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="req-check"
                checked={form.is_required}
                onChange={e => setForm(f => ({ ...f, is_required: e.target.checked }))}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
              <label htmlFor="req-check" className="text-xs font-medium text-gray-700 cursor-pointer">
                Bắt buộc ứng viên phải trả lời câu hỏi này
              </label>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowForm(false)}>
              Hủy
            </Button>
            <Button onClick={handleSave} disabled={saving} variant="gold" className="font-bold">
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
              {editQ ? 'Lưu cập nhật' : 'Tạo câu hỏi'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
