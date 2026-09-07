'use client'
import { MOCK_DEPARTMENTS } from '@/lib/mock-data'
import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/use-toast'
import { HelpCircle, Plus, Edit2, Trash2, Loader2, ChevronUp, ChevronDown } from 'lucide-react'

const QUESTION_TYPES = {
  short_text: 'Văn bản ngắn',
  long_text: 'Văn bản dài',
  multiple_choice: 'Chọn một',
  checkbox: 'Chọn nhiều',
  dropdown: 'Dropdown',
}

export default function QuestionsPage() {
  const supabase = createClient()
  const { toast } = useToast()
  const [questions, setQuestions] = useState<any[]>([])
  const [departments, setDepartments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [deptFilter, setDeptFilter] = useState('all')
  const [showForm, setShowForm] = useState(false)
  const [editQ, setEditQ] = useState<any>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ department_id: '', question_text: '', question_type: 'short_text', placeholder: '', is_required: true, options: ['', ''] })

  const fetchData = useCallback(async () => {
    const [{ data: qs }, { data: depts }] = await Promise.all([
      supabase.from('questions').select('*, departments(name, slug), question_options(id, option_text, sort_order)').eq('is_active', true).order('sort_order'),
      supabase.from('departments').select('id, name, slug').neq('slug', 'chu-nhiem'),
    ])
    setQuestions(qs || [])
    setDepartments(depts && depts.length > 0 ? depts : MOCK_DEPARTMENTS)
    setLoading(false)
  }, [supabase])

  useEffect(() => { fetchData() }, [fetchData])

  const filtered = deptFilter === 'all' ? questions : deptFilter === 'general' ? questions.filter(q => !q.department_id) : questions.filter(q => q.departments?.slug === deptFilter)

  const openCreate = () => {
    setEditQ(null)
    setForm({ department_id: '', question_text: '', question_type: 'short_text', placeholder: '', is_required: true, options: ['', ''] })
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
      options: q.question_options?.map((o: any) => o.option_text) || ['', ''],
    })
    setShowForm(true)
  }

  const handleSave = async () => {
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    const hasOptions = ['multiple_choice', 'checkbox', 'dropdown'].includes(form.question_type)

    const payload = {
      department_id: form.department_id || null,
      question_text: form.question_text,
      question_type: form.question_type,
      placeholder: form.placeholder || null,
      is_required: form.is_required,
      is_active: true,
      sort_order: editQ?.sort_order || questions.length + 1,
      created_by: user?.id,
    }

    let qId = editQ?.id
    if (editQ) {
      const { error } = await supabase.from('questions').update(payload).eq('id', editQ.id)
      if (error) { toast({ title: 'Lỗi', description: error.message, variant: 'destructive' }); setSaving(false); return }
    } else {
      const { data: newQ, error } = await supabase.from('questions').insert(payload).select().single()
      if (error) { toast({ title: 'Lỗi', description: error.message, variant: 'destructive' }); setSaving(false); return }
      qId = newQ.id
    }

    // Handle options
    if (hasOptions && qId) {
      await supabase.from('question_options').delete().eq('question_id', qId)
      const validOptions = form.options.filter(o => o.trim())
      if (validOptions.length > 0) {
        await supabase.from('question_options').insert(
          validOptions.map((opt, i) => ({ question_id: qId, option_text: opt, sort_order: i + 1 }))
        )
      }
    }

    setSaving(false)
    toast({ title: '✅ Đã lưu câu hỏi!' } as Parameters<typeof toast>[0])
    setShowForm(false)
    fetchData()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Xóa câu hỏi này?')) return
    await supabase.from('questions').update({ is_active: false }).eq('id', id)
    fetchData()
  }

  const hasOptions = ['multiple_choice', 'checkbox', 'dropdown'].includes(form.question_type)

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
            <HelpCircle className="w-6 h-6 text-blue-600" />
            Quản lý Câu hỏi
          </h1>
          <p className="text-gray-500 text-sm mt-1">Câu hỏi trong đơn ứng tuyển</p>
        </div>
        <Button onClick={openCreate} className="gap-2"><Plus className="w-4 h-4" /> Thêm câu hỏi</Button>
      </div>

      {/* Filter */}
      <div className="flex gap-2 flex-wrap">
        <button onClick={() => setDeptFilter('all')} className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${deptFilter === 'all' ? 'bg-blue-700 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>Tất cả</button>
        <button onClick={() => setDeptFilter('general')} className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${deptFilter === 'general' ? 'bg-blue-700 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>Chung</button>
        {departments.map(d => (
          <button key={d.id} onClick={() => setDeptFilter(d.slug)} className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${deptFilter === d.slug ? 'bg-blue-700 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{d.name}</button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>
      ) : filtered.length === 0 ? (
        <Card className="text-center py-16">
          <CardContent>
            <HelpCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 mb-4">Chưa có câu hỏi nào.</p>
            <Button onClick={openCreate}><Plus className="w-4 h-4 mr-2" /> Thêm câu hỏi</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((q, i) => (
            <Card key={q.id} className="hover:shadow-sm transition-all">
              <CardContent className="py-4 flex items-start gap-4">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center text-blue-700 font-bold text-sm flex-shrink-0">{i + 1}</div>
                <div className="flex-1">
                  <div className="font-semibold text-gray-900 text-sm mb-1">{q.question_text}</div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="secondary" className="text-xs">{QUESTION_TYPES[q.question_type as keyof typeof QUESTION_TYPES] || q.question_type}</Badge>
                    {q.department_id && <Badge variant="outline" className="text-xs">{q.departments?.name}</Badge>}
                    {!q.department_id && <Badge variant="outline" className="text-xs">Chung</Badge>}
                    {q.is_required && <Badge variant="destructive" className="text-xs">Bắt buộc</Badge>}
                  </div>
                  {q.question_options?.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {q.question_options.map((opt: any) => (
                        <span key={opt.id} className="text-xs bg-gray-100 px-2 py-0.5 rounded-full text-gray-600">{opt.option_text}</span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <button onClick={() => openEdit(q)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Edit2 className="w-4 h-4" /></button>
                  <button onClick={() => handleDelete(q.id)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Form dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editQ ? 'Sửa câu hỏi' : 'Thêm câu hỏi mới'}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label className="mb-1.5">Ban (để trống = câu hỏi chung)</Label>
              <Select value={form.department_id} onValueChange={v => setForm(f => ({ ...f, department_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Chọn ban..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Câu hỏi chung</SelectItem>
                  {departments.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="mb-1.5">Nội dung câu hỏi <span className="text-red-500">*</span></Label>
              <Textarea value={form.question_text} onChange={e => setForm(f => ({ ...f, question_text: e.target.value }))} rows={2} placeholder="Nhập câu hỏi..." />
            </div>
            <div>
              <Label className="mb-1.5">Loại câu hỏi</Label>
              <Select value={form.question_type} onValueChange={v => setForm(f => ({ ...f, question_type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(QUESTION_TYPES).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {!hasOptions && (
              <div>
                <Label className="mb-1.5">Placeholder</Label>
                <Input value={form.placeholder} onChange={e => setForm(f => ({ ...f, placeholder: e.target.value }))} placeholder="Gợi ý cho người trả lời..." />
              </div>
            )}
            {hasOptions && (
              <div>
                <Label className="mb-2">Các lựa chọn</Label>
                <div className="space-y-2">
                  {form.options.map((opt, i) => (
                    <div key={i} className="flex gap-2">
                      <Input value={opt} onChange={e => { const opts = [...form.options]; opts[i] = e.target.value; setForm(f => ({ ...f, options: opts })) }} placeholder={`Lựa chọn ${i + 1}`} />
                      {form.options.length > 2 && (
                        <button onClick={() => setForm(f => ({ ...f, options: f.options.filter((_, j) => j !== i) }))} className="text-red-400 hover:text-red-600 p-1">✕</button>
                      )}
                    </div>
                  ))}
                  <Button variant="outline" size="sm" onClick={() => setForm(f => ({ ...f, options: [...f.options, ''] }))}>
                    <Plus className="w-3 h-3 mr-1" /> Thêm lựa chọn
                  </Button>
                </div>
              </div>
            )}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setForm(f => ({ ...f, is_required: !f.is_required }))}
                className={`relative w-10 h-6 rounded-full transition-colors ${form.is_required ? 'bg-blue-600' : 'bg-gray-300'}`}
              >
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.is_required ? 'translate-x-5' : 'translate-x-1'}`} />
              </button>
              <Label>Bắt buộc phải trả lời</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowForm(false)}>Huỷ</Button>
            <Button onClick={handleSave} disabled={saving || !form.question_text.trim()}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              {editQ ? 'Cập nhật' : 'Thêm câu hỏi'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
