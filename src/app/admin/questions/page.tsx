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
import { HelpCircle, Plus, Edit2, Trash2, Loader2 } from 'lucide-react'
import { MOCK_DEPARTMENTS } from '@/lib/mock-data'
import { ADMIN_ROLE_CONFIGS, type AdminRoleType } from '@/lib/permissions'

const QUESTION_TYPES: Record<string, string> = {
  short_text: 'Văn bản ngắn',
  long_text: 'Văn bản dài (Tự luận)',
  multiple_choice: 'Trắc nghiệm một lựa chọn',
  checkbox: 'Chọn nhiều phương án',
  dropdown: 'Danh sách thả xuống',
}

const INITIAL_QUESTIONS = [
  // Câu hỏi chung
  { id: 'q-gen-1', department_id: null, question_text: 'Bạn biết đến iSSAC qua kênh thông tin nào?', question_type: 'multiple_choice', is_required: true, sort_order: 1, question_options: [{ id: 'o-1', option_text: 'Fanpage CLB' }, { id: 'o-2', option_text: 'Bạn bè giới thiệu' }, { id: 'o-3', option_text: 'Thầy cô / VNU-IS' }] },
  { id: 'q-gen-2', department_id: null, question_text: 'Mục tiêu lớn nhất của bạn khi ứng tuyển trở thành Đại sứ sinh viên iSSAC?', question_type: 'long_text', is_required: true, sort_order: 2, question_options: [] },

  // Ban Truyền thông
  { id: 'q-tt-1', department_id: 'dept-1', departments: { name: 'Ban Truyền thông', slug: 'truyen-thong' }, question_text: 'Vì sao bạn muốn tham gia Ban Truyền thông iSSAC?', question_type: 'long_text', is_required: true, sort_order: 3, question_options: [] },
  { id: 'q-tt-2', department_id: 'dept-1', departments: { name: 'Ban Truyền thông', slug: 'truyen-thong' }, question_text: 'Bạn đã từng có kinh nghiệm thiết kế (Canva/Photoshop) hoặc làm video (CapCut/Premiere) chưa? Hãy đính kèm link sản phẩm nổi bật.', question_type: 'long_text', is_required: true, sort_order: 4, question_options: [] },

  // Ban Tư vấn
  { id: 'q-tv-1', department_id: 'dept-2', departments: { name: 'Ban Tư vấn', slug: 'tu-van' }, question_text: 'Vì sao bạn lựa chọn ứng tuyển vào Ban Tư vấn iSSAC?', question_type: 'long_text', is_required: true, sort_order: 5, question_options: [] },
  { id: 'q-tv-2', department_id: 'dept-2', departments: { name: 'Ban Tư vấn', slug: 'tu-van' }, question_text: 'Theo bạn, kỹ năng quan trọng nhất của người tư vấn là gì? Hãy chia sẻ một tình huống thực tế bạn từng hỗ trợ người khác.', question_type: 'long_text', is_required: true, sort_order: 6, question_options: [] },

  // Ban Nhân sự
  { id: 'q-ns-1', department_id: 'dept-3', departments: { name: 'Ban Nhân sự', slug: 'nhan-su' }, question_text: 'Vì sao bạn muốn trở thành thành viên Ban Nhân sự iSSAC?', question_type: 'long_text', is_required: true, sort_order: 7, question_options: [] },
  { id: 'q-ns-2', department_id: 'dept-3', departments: { name: 'Ban Nhân sự', slug: 'nhan-su' }, question_text: 'Nếu trong ban có hai thành viên bất đồng quan điểm gay gắt trong quá trình làm việc, bạn sẽ giải quyết như thế nào?', question_type: 'long_text', is_required: true, sort_order: 8, question_options: [] },
]

export default function QuestionsPage() {
  const supabase = createClient()
  const { toast } = useToast()

  const [activeRole, setActiveRole] = useState<AdminRoleType>('chu-nhiem')
  const [questions, setQuestions] = useState<any[]>(INITIAL_QUESTIONS)
  const [departments, setDepartments] = useState<any[]>(MOCK_DEPARTMENTS)
  const [deptFilter, setDeptFilter] = useState('all')

  const [showForm, setShowForm] = useState(false)
  const [editQ, setEditQ] = useState<any>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    department_id: '',
    question_text: '',
    question_type: 'long_text',
    placeholder: '',
    is_required: true,
  })

  useEffect(() => {
    const match = document.cookie.match(/issac_admin_role=([^;]+)/)
    if (match && match[1] in ADMIN_ROLE_CONFIGS) {
      setActiveRole(match[1] as AdminRoleType)
    }
  }, [])

  const isSuperAdmin = activeRole === 'chu-nhiem'
  const userDeptObj = departments.find(d => d.slug === activeRole)

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
    } catch {}
  }, [supabase])

  useEffect(() => { fetchData() }, [fetchData])

  const openCreate = () => {
    setEditQ(null)
    setForm({
      department_id: isSuperAdmin ? '' : (userDeptObj?.id || 'dept-1'),
      question_text: '',
      question_type: 'long_text',
      placeholder: '',
      is_required: true,
    })
    setShowForm(true)
  }

  const openEdit = (q: any) => {
    setEditQ(q)
    setForm({
      department_id: q.department_id || '',
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
      toast({ title: 'Đã lưu thay đổi' } as Parameters<typeof toast>[0])
    } else {
      const newQuestion = {
        id: `q-${Date.now()}`,
        department_id: assignedDeptId,
        departments: assignedDept,
        question_text: form.question_text,
        question_type: form.question_type,
        is_required: form.is_required,
        sort_order: questions.length + 1,
        question_options: [],
      }
      setQuestions(prev => [...prev, newQuestion])
      toast({ title: 'Đã thêm câu hỏi mới' } as Parameters<typeof toast>[0])
    }

    setSaving(false)
    setShowForm(false)
  }

  const handleDelete = (id: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa câu hỏi này?')) {
      setQuestions(prev => prev.filter(q => q.id !== id))
      toast({ title: 'Đã xóa câu hỏi' } as Parameters<typeof toast>[0])
    }
  }

  // Filter questions
  const filtered = deptFilter === 'all'
    ? questions
    : deptFilter === 'general'
    ? questions.filter(q => !q.department_id)
    : questions.filter(q => q.departments?.slug === deptFilter)

  return (
    <div className="space-y-6 animate-fade-in max-w-6xl">
      {/* Header — clean as in Screenshot 2 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2.5">
            <HelpCircle className="w-6 h-6 text-blue-600" />
            Quản lý Câu hỏi
          </h1>
          <p className="text-gray-500 text-sm mt-1">Câu hỏi trong đơn ứng tuyển</p>
        </div>

        <Button onClick={openCreate} className="gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl">
          <Plus className="w-4 h-4" /> Thêm câu hỏi
        </Button>
      </div>

      {/* Filter Tabs — clean pill style as in Screenshot 2 */}
      <div className="flex gap-2 flex-wrap items-center">
        <button
          onClick={() => setDeptFilter('all')}
          className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
            deptFilter === 'all'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Tất cả
        </button>
        <button
          onClick={() => setDeptFilter('general')}
          className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
            deptFilter === 'general'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Chung
        </button>
        {departments.map(d => (
          <button
            key={d.id}
            onClick={() => setDeptFilter(d.slug)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
              deptFilter === d.slug
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {d.name}
          </button>
        ))}
      </div>

      {/* Questions List */}
      {filtered.length === 0 ? (
        <Card className="text-center py-20 rounded-2xl border border-gray-100 shadow-sm">
          <CardContent>
            <HelpCircle className="w-14 h-14 text-gray-300 mx-auto mb-3" />
            <p className="font-semibold text-gray-700 text-base">Chưa có câu hỏi nào.</p>
            <Button onClick={openCreate} className="mt-4 gap-2 bg-blue-600 hover:bg-blue-700 text-white">
              <Plus className="w-4 h-4" /> Thêm câu hỏi
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((q, i) => (
            <Card key={q.id} className="hover:shadow-sm transition-all rounded-2xl border border-gray-100">
              <CardContent className="py-4 px-5 flex items-start gap-4">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center text-blue-700 font-bold text-sm flex-shrink-0 mt-0.5">
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-gray-900 text-sm mb-1.5">
                    {q.question_text}
                  </div>
                  <div className="flex items-center gap-2 flex-wrap text-xs">
                    <Badge variant="secondary" className="text-[11px] font-medium bg-gray-100 text-gray-700">
                      {QUESTION_TYPES[q.question_type] || q.question_type}
                    </Badge>
                    {q.department_id ? (
                      <Badge variant="outline" className="text-[11px] font-medium border-blue-200 text-blue-700 bg-blue-50/50">
                        {q.departments?.name}
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-[11px] font-medium text-gray-600">
                        Chung
                      </Badge>
                    )}
                    {q.is_required && (
                      <Badge variant="destructive" className="text-[10px] uppercase font-bold">
                        Bắt buộc
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => openEdit(q)}
                    className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium py-1 px-2 rounded hover:bg-blue-50 transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5" /> Sửa
                  </button>
                  <button
                    onClick={() => handleDelete(q.id)}
                    className="inline-flex items-center text-xs text-red-500 hover:text-red-700 p-1.5 rounded hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editQ ? 'Sửa câu hỏi' : 'Thêm câu hỏi mới'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2 text-left">
            <div>
              <Label className="text-xs font-semibold text-gray-700 mb-1.5 block">Ban áp dụng</Label>
              <Select
                value={form.department_id}
                onValueChange={v => setForm(f => ({ ...f, department_id: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn ban (để trống = câu hỏi chung)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Câu hỏi chung</SelectItem>
                  {departments.map(d => (
                    <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs font-semibold text-gray-700 mb-1.5 block">
                Nội dung câu hỏi <span className="text-red-500">*</span>
              </Label>
              <Textarea
                value={form.question_text}
                onChange={e => setForm(f => ({ ...f, question_text: e.target.value }))}
                rows={3}
                placeholder="Nhập nội dung câu hỏi..."
                className="text-sm"
              />
            </div>

            <div>
              <Label className="text-xs font-semibold text-gray-700 mb-1.5 block">Loại câu hỏi</Label>
              <Select
                value={form.question_type}
                onValueChange={v => setForm(f => ({ ...f, question_type: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="long_text">Văn bản dài (Tự luận)</SelectItem>
                  <SelectItem value="short_text">Văn bản ngắn</SelectItem>
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
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
              <label htmlFor="req-check" className="text-xs text-gray-700 cursor-pointer">
                Bắt buộc trả lời
              </label>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowForm(false)}>Hủy</Button>
            <Button onClick={handleSave} disabled={saving} className="bg-blue-600 hover:bg-blue-700 text-white font-medium">
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
              {editQ ? 'Lưu thay đổi' : 'Thêm câu hỏi'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
