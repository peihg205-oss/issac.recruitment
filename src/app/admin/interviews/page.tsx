'use client'
import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { useToast } from '@/components/ui/use-toast'
import { Calendar, Plus, Edit2, Trash2, Users, Clock, Video, MapPin, Loader2 } from 'lucide-react'
import { formatDate } from '@/lib/utils'

export default function InterviewsAdminPage() {
  const supabase = createClient()
  const { toast } = useToast()
  const [slots, setSlots] = useState<any[]>([])
  const [departments, setDepartments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editSlot, setEditSlot] = useState<any>(null)
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState({
    department_id: '',
    interview_date: '',
    start_time: '',
    end_time: '',
    format: 'online',
    location: '',
    meeting_url: '',
    max_candidates: 3,
  })

  const fetchData = useCallback(async () => {
    const [{ data: slotsData }, { data: deptData }] = await Promise.all([
      supabase.from('interview_slots').select('*, departments(name, slug), interviews(count)').order('interview_date').order('start_time'),
      supabase.from('departments').select('id, name, slug').neq('slug', 'chu-nhiem'),
    ])
    setSlots(slotsData || [])
    setDepartments(deptData || [])
    setLoading(false)
  }, [supabase])

  useEffect(() => { fetchData() }, [fetchData])

  const openCreate = () => {
    setEditSlot(null)
    setForm({ department_id: '', interview_date: '', start_time: '', end_time: '', format: 'online', location: '', meeting_url: '', max_candidates: 3 })
    setShowForm(true)
  }

  const openEdit = (slot: any) => {
    setEditSlot(slot)
    setForm({
      department_id: slot.department_id || '',
      interview_date: slot.interview_date || '',
      start_time: slot.start_time?.slice(0, 5) || '',
      end_time: slot.end_time?.slice(0, 5) || '',
      format: slot.format || 'online',
      location: slot.location || '',
      meeting_url: slot.meeting_url || '',
      max_candidates: slot.max_candidates || 3,
    })
    setShowForm(true)
  }

  const handleSave = async () => {
    setSaving(true)
    const payload = {
      department_id: form.department_id || null,
      interview_date: form.interview_date,
      start_time: form.start_time,
      end_time: form.end_time,
      format: form.format,
      location: form.location || null,
      meeting_url: form.meeting_url || null,
      max_candidates: form.max_candidates,
      is_active: true,
    }

    let error
    if (editSlot) {
      ({ error } = await supabase.from('interview_slots').update(payload).eq('id', editSlot.id))
    } else {
      ({ error } = await supabase.from('interview_slots').insert({ ...payload, current_candidates: 0 }))
    }

    setSaving(false)
    if (error) { toast({ title: 'Lỗi', description: error.message, variant: 'destructive' }); return }
    toast({ title: '✅ Đã lưu slot phỏng vấn!' } as Parameters<typeof toast>[0])
    setShowForm(false)
    fetchData()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Xóa slot phỏng vấn này?')) return
    const { error } = await supabase.from('interview_slots').delete().eq('id', id)
    if (error) { toast({ title: 'Lỗi', description: error.message, variant: 'destructive' }); return }
    toast({ title: 'Đã xóa slot.' } as Parameters<typeof toast>[0])
    fetchData()
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
            <Calendar className="w-6 h-6 text-blue-600" />
            Quản lý Lịch phỏng vấn
          </h1>
          <p className="text-gray-500 text-sm mt-1">{slots.length} slot đã được tạo</p>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="w-4 h-4" /> Thêm slot
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>
      ) : slots.length === 0 ? (
        <Card className="text-center py-16">
          <CardContent>
            <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 mb-4">Chưa có slot phỏng vấn nào.</p>
            <Button onClick={openCreate}><Plus className="w-4 h-4 mr-2" /> Tạo slot đầu tiên</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {slots.map(slot => {
            const isFull = slot.current_candidates >= slot.max_candidates
            const dept = slot.departments
            const booked = slot.current_candidates || 0
            return (
              <Card key={slot.id} className={`hover:shadow-md transition-all border-l-4 ${isFull ? 'border-l-red-400' : 'border-l-blue-400'}`}>
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <Badge variant="secondary" className="text-xs mb-2">{dept?.name || 'Tất cả ban'}</Badge>
                      <div className="font-bold text-gray-900">{formatDate(slot.interview_date)}</div>
                      <div className="text-blue-600 font-semibold text-sm">{slot.start_time?.slice(0,5)} — {slot.end_time?.slice(0,5)}</div>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => openEdit(slot)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(slot.id)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 text-xs">
                    <div className="flex items-center gap-1 text-gray-500">
                      {slot.format === 'online' ? <Video className="w-3.5 h-3.5" /> : <MapPin className="w-3.5 h-3.5" />}
                      {slot.format === 'online' ? 'Online' : slot.location || 'Offline'}
                    </div>
                    <div className={`flex items-center gap-1 font-medium ${isFull ? 'text-red-600' : 'text-emerald-600'}`}>
                      <Users className="w-3.5 h-3.5" />
                      {booked}/{slot.max_candidates} người
                    </div>
                  </div>

                  <div className="mt-3 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${isFull ? 'bg-red-400' : 'bg-blue-500'}`}
                      style={{width: `${(booked / slot.max_candidates) * 100}%`}}
                    />
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editSlot ? 'Chỉnh sửa slot' : 'Tạo slot phỏng vấn mới'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label className="mb-1.5">Ban (để trống = tất cả)</Label>
              <Select value={form.department_id} onValueChange={v => setForm(f => ({ ...f, department_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Chọn ban..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Tất cả ban</SelectItem>
                  {departments.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="mb-1.5">Ngày phỏng vấn</Label><Input type="date" value={form.interview_date} onChange={e => setForm(f => ({ ...f, interview_date: e.target.value }))} /></div>
              <div><Label className="mb-1.5">Số người tối đa</Label><Input type="number" min={1} value={form.max_candidates} onChange={e => setForm(f => ({ ...f, max_candidates: parseInt(e.target.value) || 1 }))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="mb-1.5">Giờ bắt đầu</Label><Input type="time" value={form.start_time} onChange={e => setForm(f => ({ ...f, start_time: e.target.value }))} /></div>
              <div><Label className="mb-1.5">Giờ kết thúc</Label><Input type="time" value={form.end_time} onChange={e => setForm(f => ({ ...f, end_time: e.target.value }))} /></div>
            </div>
            <div>
              <Label className="mb-1.5">Hình thức</Label>
              <Select value={form.format} onValueChange={v => setForm(f => ({ ...f, format: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="online">Online</SelectItem>
                  <SelectItem value="offline">Offline</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {form.format === 'online' ? (
              <div><Label className="mb-1.5">Link họp</Label><Input value={form.meeting_url} onChange={e => setForm(f => ({ ...f, meeting_url: e.target.value }))} placeholder="https://meet.google.com/..." /></div>
            ) : (
              <div><Label className="mb-1.5">Địa điểm</Label><Input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} placeholder="Phòng họp A, Tầng 3..." /></div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowForm(false)}>Huỷ</Button>
            <Button onClick={handleSave} disabled={saving || !form.interview_date || !form.start_time}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              {editSlot ? 'Cập nhật' : 'Tạo slot'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
