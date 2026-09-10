'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { useToast } from '@/components/ui/use-toast'
import {
  Calendar, Plus, Edit2, Trash2, Users, Clock, Video,
  MapPin, Loader2, UserPlus, X, Search, ExternalLink,
  CheckCircle2, AlertCircle, Phone, Mail, GraduationCap, ArrowLeftRight, FileText
} from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { ADMIN_ROLE_CONFIGS, type AdminRoleType } from '@/lib/permissions'
import Link from 'next/link'

interface CandidateItem {
  application_id: string
  user_id: string
  status: string
  department_id: string | null
  department_name: string
  is_interviewed: boolean
  eval_score?: number | null
  eval_status?: string | null
  profile: {
    full_name: string
    email: string
    student_id: string | null
    phone: string | null
    major?: string
    cohort?: string
  }
}

interface AssignedInterview {
  id: string
  slot_id: string
  application_id: string
  user_id: string
  status: string
  confirmed_at: string | null
  is_interviewed: boolean
  eval_score?: number | null
  eval_status?: string | null
  candidate?: {
    full_name: string
    email: string
    student_id: string | null
    phone: string | null
  }
}

export default function InterviewsAdminPage() {
  const supabase = createClient()
  const { toast } = useToast()
  const [slots, setSlots] = useState<any[]>([])
  const [departments, setDepartments] = useState<any[]>([])
  const [allCandidates, setAllCandidates] = useState<CandidateItem[]>([])
  const [loading, setLoading] = useState(true)
  const [activeRole, setActiveRole] = useState<AdminRoleType>('chu-nhiem')

  // Slot Create / Edit modal state
  const [showForm, setShowForm] = useState(false)
  const [editSlot, setEditSlot] = useState<any>(null)
  const [saving, setSaving] = useState(false)

  // Candidate Assignment modal state
  const [assignModalSlot, setAssignModalSlot] = useState<any | null>(null)
  const [candidateSearch, setCandidateSearch] = useState('')
  const [candidateAssignTab, setCandidateAssignTab] = useState<'all' | 'pending' | 'interviewed'>('pending')
  const [assigningCandidateId, setAssigningCandidateId] = useState<string | null>(null)

  // Move candidate between slots modal state
  const [moveModalData, setMoveModalData] = useState<{
    sourceSlot: any
    interview: AssignedInterview
  } | null>(null)
  const [targetSlotId, setTargetSlotId] = useState<string>('')
  const [moving, setMoving] = useState(false)

  // Filter state
  const [selectedDeptFilter, setSelectedDeptFilter] = useState<string>('all')

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
      const [
        { data: slotsData },
        { data: deptData },
        { data: interviewsData },
        { data: appsData },
        { data: evalsData }
      ] = await Promise.all([
        supabase
          .from('interview_slots')
          .select('*, departments(name, slug)')
          .order('interview_date')
          .order('start_time'),
        supabase
          .from('departments')
          .select('id, name, slug')
          .neq('slug', 'chu-nhiem'),
        supabase
          .from('interviews')
          .select('id, slot_id, application_id, user_id, status, confirmed_at'),
        supabase
          .from('applications')
          .select(`
            id, user_id, status, department_id,
            departments!applications_department_id_fkey(name, slug)
          `)
          .order('created_at', { ascending: false }),
        supabase
          .from('evaluations')
          .select('id, application_id, status, total_score, submitted_at')
      ])

      // Map evaluations by application_id
      const evalMap: Record<string, any> = {}
      if (evalsData) {
        evalsData.forEach((ev: any) => {
          evalMap[ev.application_id] = ev
        })
      }

      // Helper check if an application has completed interview (scored, submitted, or status >= interviewed)
      const checkInterviewed = (appId: string, appStatus: string, ivStatus?: string) => {
        const ev = evalMap[appId]
        const hasScore = ev && (
          (ev.total_score !== null && ev.total_score !== undefined) ||
          Boolean(ev.submitted_at) ||
          ev.status === 'submitted'
        )
        const isStatusInterviewed = ['interviewed', 'evaluated', 'finalized', 'passed', 'failed', 'accepted', 'rejected'].includes(appStatus)
        const isIvCompleted = ivStatus === 'completed'
        return Boolean(hasScore || isStatusInterviewed || isIvCompleted)
      }

      // Load all candidate profiles
      const userIds = Array.from(
        new Set([
          ...(appsData || []).map(a => a.user_id),
          ...(interviewsData || []).map(i => i.user_id)
        ].filter(Boolean))
      )

      let profilesMap: Record<string, any> = {}
      if (userIds.length > 0) {
        const { data: profs } = await supabase
          .from('profiles')
          .select('id, full_name, email, student_id, phone, major, cohort')
          .in('id', userIds)

        if (profs) {
          profs.forEach(p => { profilesMap[p.id] = p })
        }
      }

      // Build candidate item list
      const candidateList: CandidateItem[] = (appsData || []).map((a: any) => {
        const isDone = checkInterviewed(a.id, a.status)
        const ev = evalMap[a.id]
        return {
          application_id: a.id,
          user_id: a.user_id,
          status: a.status,
          department_id: a.department_id,
          department_name: (Array.isArray(a.departments) ? a.departments[0]?.name : a.departments?.name) || 'Chưa chọn ban',
          is_interviewed: isDone,
          eval_score: ev?.total_score ?? null,
          eval_status: ev?.status ?? null,
          profile: profilesMap[a.user_id] || {
            full_name: 'Ứng viên',
            email: '',
            student_id: null,
            phone: null
          }
        }
      })
      setAllCandidates(candidateList)

      // Map assigned candidates to each slot
      const mappedSlots = (slotsData || []).map(slot => {
        const slotInterviews: AssignedInterview[] = (interviewsData || [])
          .filter(iv => iv.slot_id === slot.id)
          .map(iv => {
            const app = (appsData || []).find(a => a.id === iv.application_id)
            const isDone = checkInterviewed(iv.application_id, app?.status || '', iv.status)
            const ev = evalMap[iv.application_id]
            return {
              ...iv,
              is_interviewed: isDone,
              eval_score: ev?.total_score ?? null,
              eval_status: ev?.status ?? null,
              candidate: profilesMap[iv.user_id] || {
                full_name: 'Ứng viên',
                email: '',
                student_id: null,
                phone: null
              }
            }
          })

        return {
          ...slot,
          assignedInterviews: slotInterviews,
          current_candidates: slotInterviews.length
        }
      })

      setSlots(mappedSlots)
      setDepartments(deptData || [])
    } catch (err) {
      console.error('Lỗi tải dữ liệu phỏng vấn:', err)
    } finally {
      setLoading(false)
    }
  }, [supabase])

  // Realtime synchronization
  useEffect(() => {
    fetchData()

    const channel = supabase
      .channel('admin-interviews-rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'interview_slots' }, () => {
        fetchData()
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'interviews' }, () => {
        fetchData()
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'applications' }, () => {
        fetchData()
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'evaluations' }, () => {
        fetchData()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchData, supabase])

  // Open Create Dialog
  const openCreate = () => {
    setEditSlot(null)
    setForm({
      department_id: isSuperAdmin ? '' : (userDeptObj?.id || ''),
      interview_date: '',
      start_time: '',
      end_time: '',
      format: 'online',
      location: '',
      meeting_url: '',
      max_candidates: 3
    })
    setShowForm(true)
  }

  // Open Edit Dialog
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

  // Save / Create Slot (NO approval_status to prevent schema cache error)
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
    if (error) {
      toast({ title: 'Lỗi', description: error.message, variant: 'destructive' })
      return
    }

    toast({
      title: '✅ Đã lưu ca phỏng vấn thành công!',
      description: 'Ca phỏng vấn đã được ghi nhận và sẵn sàng tiếp nhận ứng viên.',
      variant: 'success'
    } as Parameters<typeof toast>[0])

    setShowForm(false)
    fetchData()
  }

  // Delete Slot (An toàn: BẢO VỆ LỊCH SỬ ứng viên ĐÃ PHỎNG VẤN & có điểm, chỉ hoàn trả ứng viên CHƯA PHỎNG VẤN)
  const handleDelete = async (id: string) => {
    const targetSlot = slots.find(s => s.id === id)
    const slotInterviews: AssignedInterview[] = targetSlot?.assignedInterviews || []

    const interviewedCandidates = slotInterviews.filter(iv => iv.is_interviewed)
    const pendingCandidates = slotInterviews.filter(iv => !iv.is_interviewed)

    let confirmMsg = 'Bạn có chắc chắn muốn xóa ca phỏng vấn này?'
    if (interviewedCandidates.length > 0) {
      confirmMsg += `\n\n🛡️ Ca này có ${interviewedCandidates.length} ứng viên ĐÃ HOÀN THÀNH PHỎNG VẤN (đã có điểm/đánh giá). Toàn bộ kết quả và điểm số lịch sử của họ sẽ được BẢO TOÀN NGUYÊN VẸN.`
    }
    if (pendingCandidates.length > 0) {
      confirmMsg += `\n\n🔄 ${pendingCandidates.length} ứng viên chưa phỏng vấn sẽ được chuyển về danh sách chờ để xếp ca mới.`
    }

    if (!confirm(confirmMsg)) return
    
    try {
      if (slotInterviews.length > 0) {
        // Chỉ reset status về 'approved' cho những ứng viên CHƯA PHỎNG VẤN
        const pendingAppIds = pendingCandidates.map(iv => iv.application_id).filter(Boolean)
        
        if (pendingAppIds.length > 0) {
          await supabase
            .from('applications')
            .update({ status: 'approved' })
            .in('id', pendingAppIds)
        }

        // Xóa các bản ghi trong bảng interviews liên quan đến ca này trước (để tránh lỗi foreign key constraint)
        const { error: delIvErr } = await supabase
          .from('interviews')
          .delete()
          .eq('slot_id', id)
        
        if (delIvErr) throw delIvErr
      }

      // Xóa ca phỏng vấn
      const { error: delSlotErr } = await supabase
        .from('interview_slots')
        .delete()
        .eq('id', id)

      if (delSlotErr) throw delSlotErr

      toast({ 
        title: '✅ Đã xóa ca phỏng vấn thành công', 
        description: interviewedCandidates.length > 0
          ? `Đã bảo toàn lịch sử ${interviewedCandidates.length} ứng viên đã hoàn thành và hoàn trả ${pendingCandidates.length} ứng viên về danh sách chờ.`
          : 'Các ứng viên trong ca đã được chuyển về danh sách chờ xếp lịch.',
        variant: 'success'
      } as Parameters<typeof toast>[0])

      await fetchData()
    } catch (err: any) {
      toast({ 
        title: 'Lỗi xóa ca phỏng vấn', 
        description: err.message || 'Không thể xóa ca phỏng vấn này.', 
        variant: 'destructive' 
      })
    }
  }

  // ASSIGN CANDIDATE TO SLOT (Thêm ứng viên vào ca — Ngăn trùng lặp & Tự động dọn ca cũ nếu chuyển ca)
  const handleAssignCandidate = async (slot: any, candidate: CandidateItem) => {
    if (slot.current_candidates >= slot.max_candidates) {
      toast({
        title: 'Ca phỏng vấn đã đầy',
        description: `Ca này đã đủ tối đa ${slot.max_candidates} ứng viên.`,
        variant: 'destructive'
      })
      return
    }

    if (candidate.is_interviewed) {
      toast({
        title: 'Ứng viên đã hoàn thành phỏng vấn',
        description: `${candidate.profile.full_name} đã được phỏng vấn và có kết quả đánh giá. Không thể xếp vào ca mới.`,
        variant: 'destructive'
      })
      return
    }

    setAssigningCandidateId(candidate.application_id)

    try {
      // Kiểm tra xem ứng viên đã có lịch trong hệ thống chưa
      const { data: existingIvs } = await supabase
        .from('interviews')
        .select('id, slot_id')
        .eq('application_id', candidate.application_id)

      if (existingIvs && existingIvs.length > 0) {
        // Đã có trong chính ca này -> Báo lỗi tránh thêm trùng lặp
        if (existingIvs.some(iv => iv.slot_id === slot.id)) {
          toast({
            title: 'Ứng viên đã có trong ca này',
            description: 'Ứng viên này đã được xếp trong ca phỏng vấn hiện tại.',
            variant: 'destructive'
          })
          return
        }

        // Nếu đã có ở ca khác -> Tự động chuyển ca: trừ sĩ số ca cũ và xóa bản ghi interview cũ
        for (const ex of existingIvs) {
          const oldSlot = slots.find(s => s.id === ex.slot_id)
          if (oldSlot) {
            const newOldCount = Math.max(0, (oldSlot.current_candidates || 1) - 1)
            await supabase.from('interview_slots').update({ current_candidates: newOldCount }).eq('id', ex.slot_id)
          }
          await supabase.from('interviews').delete().eq('id', ex.id)
        }
      }

      // 1. Insert into interviews
      const { error: ivError } = await supabase.from('interviews').insert({
        application_id: candidate.application_id,
        slot_id: slot.id,
        user_id: candidate.user_id,
        status: 'scheduled',
        confirmed_at: new Date().toISOString(),
      })

      if (ivError) throw ivError

      // 2. Update interview_slots current_candidates
      const newCount = (slot.current_candidates || 0) + 1
      await supabase
        .from('interview_slots')
        .update({ current_candidates: newCount })
        .eq('id', slot.id)

      // 3. Update application status
      await supabase
        .from('applications')
        .update({ status: 'interview_scheduled' })
        .eq('id', candidate.application_id)

      // 4. Send notification to candidate
      await supabase.from('notifications').insert({
        user_id: candidate.user_id,
        title: 'Lịch phỏng vấn chính thức đã được xếp!',
        message: `Bạn đã được Ban Tuyển quân xếp lịch phỏng vấn vào ngày ${formatDate(slot.interview_date)} (${slot.start_time?.slice(0, 5)} - ${slot.end_time?.slice(0, 5)}).`,
        type: 'success',
      })

      toast({
        title: '✅ Đã xếp ứng viên vào ca thành công!',
        description: `Đã thêm ${candidate.profile.full_name} vào ca phỏng vấn ngày ${formatDate(slot.interview_date)}.`,
        variant: 'success'
      } as Parameters<typeof toast>[0])

      // Refresh data
      await fetchData()
      setAssignModalSlot(null)
    } catch (err: any) {
      toast({
        title: 'Lỗi xếp ứng viên',
        description: err.message || 'Không thể xếp ứng viên vào ca.',
        variant: 'destructive'
      })
    } finally {
      setAssigningCandidateId(null)
    }
  }

  // REMOVE CANDIDATE FROM SLOT (Gỡ ứng viên khỏi ca)
  const handleRemoveCandidate = async (slotId: string, interview: AssignedInterview) => {
    const candName = interview.candidate?.full_name || 'Ứng viên'

    if (interview.is_interviewed) {
      toast({
        title: 'Không thể gỡ ứng viên',
        description: `Ứng viên ${candName} đã hoàn thành phỏng vấn và có điểm đánh giá. Dữ liệu lịch sử được bảo toàn vĩnh viễn!`,
        variant: 'destructive'
      })
      return
    }

    if (!confirm(`Bạn có chắc chắn muốn gỡ ứng viên ${candName} khỏi ca phỏng vấn này?`)) return

    try {
      // 1. Delete from interviews
      const { error: delError } = await supabase
        .from('interviews')
        .delete()
        .eq('id', interview.id)

      if (delError) throw delError

      // 2. Decrement slot candidates
      const targetSlot = slots.find(s => s.id === slotId)
      const newCount = Math.max(0, (targetSlot?.current_candidates || 1) - 1)
      await supabase
        .from('interview_slots')
        .update({ current_candidates: newCount })
        .eq('id', slotId)

      // 3. Reset application status to approved (sẵn sàng chờ xếp ca khác)
      await supabase
        .from('applications')
        .update({ status: 'approved' })
        .eq('id', interview.application_id)

      toast({
        title: 'Đã gỡ ứng viên khỏi ca',
        description: `Đã đưa ${candName} về danh sách chờ xếp lịch mới.`,
        variant: 'success'
      } as Parameters<typeof toast>[0])

      fetchData()
    } catch (err: any) {
      toast({
        title: 'Lỗi gỡ ứng viên',
        description: err.message || 'Không thể gỡ ứng viên.',
        variant: 'destructive'
      })
    }
  }

  // MOVE CANDIDATE TO ANOTHER SLOT (Đổi ca phỏng vấn)
  const handleMoveCandidate = async () => {
    if (!moveModalData || !targetSlotId) return
    const { sourceSlot, interview } = moveModalData

    if (interview.is_interviewed) {
      toast({
        title: 'Không thể đổi ca',
        description: 'Ứng viên này đã hoàn thành phỏng vấn. Không thể chuyển sang ca khác.',
        variant: 'destructive'
      })
      return
    }

    const targetSlot = slots.find(s => s.id === targetSlotId)

    if (!targetSlot) return
    if (targetSlot.current_candidates >= targetSlot.max_candidates) {
      toast({ title: 'Ca phỏng vấn đã đầy', description: 'Vui lòng chọn ca khác.', variant: 'destructive' })
      return
    }

    setMoving(true)
    try {
      // 1. Giảm sĩ số ca cũ
      const newOldCount = Math.max(0, (sourceSlot.current_candidates || 1) - 1)
      await supabase
        .from('interview_slots')
        .update({ current_candidates: newOldCount })
        .eq('id', sourceSlot.id)

      // 2. Tăng sĩ số ca mới
      const newTargetCount = (targetSlot.current_candidates || 0) + 1
      await supabase
        .from('interview_slots')
        .update({ current_candidates: newTargetCount })
        .eq('id', targetSlot.id)

      // 3. Cập nhật bản ghi interview
      const { error: updError } = await supabase
        .from('interviews')
        .update({
          slot_id: targetSlot.id,
          confirmed_at: new Date().toISOString()
        })
        .eq('id', interview.id)

      if (updError) throw updError

      // 4. Gửi thông báo cho ứng viên
      await supabase.from('notifications').insert({
        user_id: interview.user_id,
        title: 'Lịch phỏng vấn đã được cập nhật sang ca mới!',
        message: `Ban Tuyển quân đã chuyển lịch phỏng vấn của bạn sang ngày ${formatDate(targetSlot.interview_date)} (${targetSlot.start_time?.slice(0, 5)} - ${targetSlot.end_time?.slice(0, 5)}).`,
        type: 'info',
      })

      toast({
        title: '✅ Đã đổi ca phỏng vấn thành công!',
        description: `Đã chuyển ${interview.candidate?.full_name || 'Ứng viên'} sang ca ngày ${formatDate(targetSlot.interview_date)}.`,
        variant: 'success'
      } as Parameters<typeof toast>[0])

      setMoveModalData(null)
      setTargetSlotId('')
      await fetchData()
    } catch (err: any) {
      toast({
        title: 'Lỗi đổi ca phỏng vấn',
        description: err.message || 'Không thể chuyển ca cho ứng viên.',
        variant: 'destructive'
      })
    } finally {
      setMoving(false)
    }
  }

  // Filter slots
  const filteredSlots = slots.filter(slot => {
    if (selectedDeptFilter === 'all') return true
    return slot.departments?.slug === selectedDeptFilter || (!slot.department_id && selectedDeptFilter === 'all')
  })

  // Candidates available for assignment in assignModalSlot
  const availableCandidates = allCandidates.filter(cand => {
    if (!assignModalSlot) return false
    // Không hiển thị ứng viên đã được xếp vào ca này rồi
    const alreadyInThisSlot = (assignModalSlot.assignedInterviews || []).some(
      (iv: AssignedInterview) => iv.application_id === cand.application_id
    )
    if (alreadyInThisSlot) return false

    // Lọc theo tab trạng thái (chờ xếp / đã phỏng vấn / tất cả)
    if (candidateAssignTab === 'pending' && cand.is_interviewed) return false
    if (candidateAssignTab === 'interviewed' && !cand.is_interviewed) return false

    // Lọc theo từ khóa tìm kiếm (Tên, MSSV, Email, SĐT)
    if (candidateSearch.trim()) {
      const q = candidateSearch.toLowerCase().trim()
      const matchName = cand.profile.full_name?.toLowerCase().includes(q)
      const matchMssv = cand.profile.student_id?.toLowerCase().includes(q)
      const matchEmail = cand.profile.email?.toLowerCase().includes(q)
      const matchPhone = cand.profile.phone?.toLowerCase().includes(q)
      if (!matchName && !matchMssv && !matchEmail && !matchPhone) return false
    }

    return true
  })

  // Thống kê nhanh
  const totalSlots = slots.length
  const totalAssigned = slots.reduce((acc, s) => acc + (s.current_candidates || 0), 0)
  const totalCapacity = slots.reduce((acc, s) => acc + (s.max_candidates || 0), 0)

  return (
    <div className="space-y-6 animate-fade-in font-sans pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 flex items-center gap-3 tracking-tight">
            <Calendar className="w-7 h-7 text-[#1657c1]" />
            Quản trị Lịch Phỏng vấn
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-1 font-medium">
            Quản lý các ca phỏng vấn, xếp ứng viên trực tiếp và đồng bộ thời gian thực 2 chiều
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button onClick={openCreate} className="gap-2 bg-[#1657c1] hover:bg-blue-800 text-white font-bold text-xs sm:text-sm rounded-xl shadow-sm">
            <Plus className="w-4 h-4" /> Tạo ca phỏng vấn mới
          </Button>
        </div>
      </div>

      {/* Overview Stat Cards - Style Ảnh 2 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Card 1: Vàng - Tổng số ca */}
        <div className="p-4 rounded-2xl bg-white border-2 border-[#fdc455] shadow-xs flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-amber-950 bg-[#fdc455] px-2.5 py-0.5 rounded shadow-2xs">
              Tổng số ca
            </span>
            <span className="text-[11px] font-semibold text-amber-800">Toàn hệ thống</span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 pt-1">
            {totalSlots} <span className="text-xs font-bold text-slate-400">ca</span>
          </div>
        </div>

        {/* Card 2: Xanh - Đã xếp phỏng vấn */}
        <div className="p-4 rounded-2xl bg-white border-2 border-[#1657c1] shadow-xs flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-white bg-[#1657c1] px-2.5 py-0.5 rounded shadow-2xs">
              Đã xếp lịch
            </span>
            <span className="text-[11px] font-semibold text-[#1657c1]">Tỉ lệ lấp đầy</span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-[#1657c1] pt-1">
            {totalAssigned} <span className="text-xs font-bold text-slate-400">/ {totalCapacity} chỗ</span>
          </div>
        </div>

        {/* Card 3: Xanh - Hình thức Online */}
        <div className="p-4 rounded-2xl bg-white border-2 border-[#1657c1] shadow-xs flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-white bg-[#1657c1] px-2.5 py-0.5 rounded shadow-2xs">
              Hình thức Online
            </span>
            <span className="text-[11px] font-semibold text-[#1657c1]">Google Meet</span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-600 pt-1">
            {slots.filter(s => s.format === 'online').length} <span className="text-xs font-bold text-slate-400">ca</span>
          </div>
        </div>

        {/* Card 4: Vàng - Hình thức Offline */}
        <div className="p-4 rounded-2xl bg-white border-2 border-[#fdc455] shadow-xs flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-amber-950 bg-[#fdc455] px-2.5 py-0.5 rounded shadow-2xs">
              Hình thức Offline
            </span>
            <span className="text-[11px] font-semibold text-amber-800">Trực tiếp</span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-amber-600 pt-1">
            {slots.filter(s => s.format === 'offline').length} <span className="text-xs font-bold text-slate-400">ca</span>
          </div>
        </div>
      </div>

      {/* Department Tabs Filter */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => setSelectedDeptFilter('all')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
            selectedDeptFilter === 'all'
              ? 'bg-[#1657c1] text-white shadow-xs'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          Tất cả các Ban ({slots.length})
        </button>
        {departments.map(d => {
          const count = slots.filter(s => s.departments?.slug === d.slug).length
          const isActive = selectedDeptFilter === d.slug
          return (
            <button
              key={d.id}
              type="button"
              onClick={() => setSelectedDeptFilter(d.slug)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                isActive
                  ? 'bg-[#1657c1] text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              {d.name} ({count})
            </button>
          )
        })}
      </div>

      {/* Slots Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-[#1657c1]" />
        </div>
      ) : filteredSlots.length === 0 ? (
        <Card className="text-center py-16 rounded-3xl border-slate-200">
          <CardContent>
            <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-600 font-bold text-base mb-1">Chưa có ca phỏng vấn nào cho mục đã chọn</p>
            <p className="text-slate-400 text-xs mb-4">Hãy tạo ca phỏng vấn để mở cổng cho ứng viên đăng ký hoặc xếp lịch trực tiếp.</p>
            <Button onClick={openCreate} className="bg-[#1657c1] hover:bg-blue-800 text-white font-bold text-xs">
              <Plus className="w-4 h-4 mr-1.5" /> Tạo ca phỏng vấn đầu tiên
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredSlots.map((slot, index) => {
            const canManage = isSuperAdmin || (slot.departments?.slug === activeRole || slot.department_id === userDeptObj?.id)
            const booked = slot.assignedInterviews?.length || 0
            const maxCap = slot.max_candidates || 1
            const isFull = booked >= maxCap
            const dept = slot.departments
            const isGold = index % 2 !== 0

            return (
              <div
                key={slot.id}
                className={`rounded-2xl border-2 transition-all overflow-hidden flex flex-col justify-between shadow-xs bg-white ${
                  isFull
                    ? 'border-red-400 bg-red-50/10'
                    : isGold
                    ? 'border-[#fdc455] hover:shadow-md'
                    : 'border-[#1657c1] hover:shadow-md'
                }`}
              >
                <div className="p-5 space-y-4">
                  {/* Top Bar: Dept Badge & Format Meta (Ảnh 2 style) */}
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    {/* Tag badge top left */}
                    <span
                      className={`text-xs font-bold uppercase tracking-wide px-2.5 py-0.5 rounded shadow-2xs ${
                        isGold
                          ? 'text-amber-950 bg-[#fdc455]'
                          : 'text-white bg-[#1657c1]'
                      }`}
                    >
                      {dept?.name || 'Toàn CLB'}
                    </span>

                    {/* Right side: Format text & Actions */}
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs font-semibold ${
                          slot.format === 'online'
                            ? 'text-[#1657c1]'
                            : isGold
                            ? 'text-amber-900'
                            : 'text-[#1657c1]'
                        }`}
                      >
                        {slot.format === 'online' ? 'Online' : 'Offline'}
                      </span>

                      {canManage && (
                        <div className="flex items-center gap-0.5 ml-1">
                          <button
                            onClick={() => openEdit(slot)}
                            className="p-1.5 text-slate-400 hover:text-[#1657c1] hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                            title="Chỉnh sửa ca"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(slot.id)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                            title="Xóa ca"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Slot Date & Time */}
                  <div className="space-y-0.5">
                    <h4 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                      {formatDate(slot.interview_date)}
                    </h4>
                    <div className="text-slate-700 font-bold text-xs sm:text-sm flex items-center gap-1.5 font-mono">
                      <Clock className={`w-3.5 h-3.5 ${isGold ? 'text-amber-700' : 'text-[#1657c1]'}`} />
                      <span>{slot.start_time?.slice(0, 5)} — {slot.end_time?.slice(0, 5)}</span>
                    </div>
                  </div>

                  {/* Location or Meeting URL */}
                  <div className={`text-xs text-slate-700 flex items-start gap-2.5 p-3 rounded-xl border ${
                    isGold ? 'bg-amber-50/40 border-amber-200/60' : 'bg-blue-50/40 border-blue-200/60'
                  }`}>
                    {slot.format === 'online' ? (
                      <Video className="w-4 h-4 text-[#1657c1] shrink-0 mt-0.5" />
                    ) : (
                      <MapPin className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1 min-w-0">
                      {slot.format === 'online' ? (
                        slot.meeting_url ? (
                          <a
                            href={slot.meeting_url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[#1657c1] hover:underline font-semibold break-all flex items-center gap-1"
                          >
                            <span>Link họp trực tuyến</span>
                            <ExternalLink className="w-3 h-3 shrink-0" />
                          </a>
                        ) : (
                          <span className="text-slate-400 italic">Chưa cập nhật link họp</span>
                        )
                      ) : (
                        <span className="text-slate-800 font-medium break-words">
                          {slot.location || 'Địa điểm thông báo sau'}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Capacity Bar */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-slate-600">Số lượng ứng viên:</span>
                      <span className={isFull ? 'text-red-600 font-black' : isGold ? 'text-amber-900 font-black' : 'text-[#1657c1] font-black'}>
                        {booked} / {maxCap} người
                      </span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          isFull
                            ? 'bg-red-500'
                            : isGold
                            ? 'bg-[#fdc455]'
                            : 'bg-[#1657c1]'
                        }`}
                        style={{ width: `${Math.min(100, (booked / maxCap) * 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Candidate List in this slot */}
                  <div className="pt-2 border-t border-slate-100 space-y-2">
                    <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                      <span>Ứng viên trong ca ({booked})</span>
                    </div>

                    {booked === 0 ? (
                      <div className="p-3 rounded-xl bg-slate-50 text-slate-400 text-xs italic text-center">
                        Chưa có ứng viên nào trong ca này
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {slot.assignedInterviews.map((iv: AssignedInterview) => {
                          const cand = iv.candidate
                          return (
                            <div
                              key={iv.id}
                              className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 text-xs transition-all ${
                                iv.is_interviewed
                                  ? 'bg-emerald-50/70 border-emerald-200/90 shadow-2xs'
                                  : isGold
                                  ? 'bg-amber-50/50 border-amber-200/80'
                                  : 'bg-blue-50/50 border-blue-200/80'
                              }`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div
                                  className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                                    iv.is_interviewed
                                      ? 'bg-emerald-600 text-white'
                                      : isGold
                                      ? 'bg-[#fdc455] text-amber-950'
                                      : 'bg-[#1657c1] text-white'
                                  }`}
                                >
                                  {iv.is_interviewed ? (
                                    <CheckCircle2 className="w-4 h-4" />
                                  ) : (
                                    cand?.full_name?.charAt(0)?.toUpperCase() || 'U'
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <Link
                                      href={`/admin/candidates/${iv.application_id}`}
                                      className="font-bold text-slate-900 hover:text-[#1657c1] truncate block"
                                    >
                                      {cand?.full_name || 'Ứng viên'}
                                    </Link>
                                    {iv.is_interviewed ? (
                                      <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 shrink-0">
                                        <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                                        <span>Đã phỏng vấn</span>
                                        {iv.eval_score !== null && iv.eval_score !== undefined && (
                                          <strong className="font-mono ml-0.5">• {iv.eval_score}đ</strong>
                                        )}
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200 shrink-0">
                                        <Clock className="w-2.5 h-2.5 text-slate-400" />
                                        <span>Chờ phỏng vấn</span>
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-[10px] text-slate-500 font-mono flex items-center gap-1.5 truncate mt-0.5">
                                    <span>MSSV: {cand?.student_id || '—'}</span>
                                    {cand?.phone && <span>• {cand.phone}</span>}
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-1 shrink-0">
                                {iv.is_interviewed ? (
                                  <Link
                                    href={`/admin/evaluation/${iv.application_id}`}
                                    className="p-1 px-2 text-emerald-700 bg-emerald-100 hover:bg-emerald-200 rounded-md transition-colors cursor-pointer flex items-center gap-1 text-[11px] font-bold"
                                    title="Xem phiếu chấm điểm & đánh giá"
                                  >
                                    <FileText className="w-3.5 h-3.5" />
                                    <span className="hidden sm:inline">Xem điểm</span>
                                  </Link>
                                ) : (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setMoveModalData({ sourceSlot: slot, interview: iv })
                                        setTargetSlotId('')
                                      }}
                                      className="p-1 text-slate-400 hover:text-[#1657c1] hover:bg-blue-50 rounded-md transition-colors cursor-pointer"
                                      title="Đổi sang ca khác"
                                    >
                                      <ArrowLeftRight className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveCandidate(slot.id, iv)}
                                      className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors cursor-pointer"
                                      title="Gỡ ứng viên khỏi ca"
                                    >
                                      <X className="w-3.5 h-3.5" />
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* Bottom Action: Add Candidate Button */}
                <div className="p-4 bg-slate-50/60 border-t border-slate-100">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={isFull}
                    onClick={() => {
                      setAssignModalSlot(slot)
                      setCandidateSearch('')
                    }}
                    className={`w-full text-xs font-bold gap-1.5 rounded-xl transition-all cursor-pointer ${
                      isFull
                        ? 'opacity-60 cursor-not-allowed bg-slate-100 text-slate-400'
                        : isGold
                        ? 'bg-white hover:bg-amber-50 text-amber-950 border-2 border-[#fdc455] shadow-xs'
                        : 'bg-white hover:bg-blue-50 text-[#1657c1] border-2 border-[#1657c1] shadow-xs'
                    }`}
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>{isFull ? 'Ca phỏng vấn đã đầy' : '+ Xếp ứng viên vào ca này'}</span>
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* MODAL: XẾP ỨNG VIÊN VÀO CA PHỎNG VẤN */}
      <Dialog
        open={Boolean(assignModalSlot)}
        onOpenChange={open => {
          if (!open) {
            setAssignModalSlot(null)
            setCandidateSearch('')
          }
        }}
      >
        <DialogContent className="max-w-xl p-0 overflow-hidden rounded-3xl border-slate-200 shadow-2xl">
          {/* Header */}
          <div className="bg-gradient-to-r from-[#0d3b82] to-[#1657c1] text-white p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-amber-400 shrink-0">
                <UserPlus className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className="text-base sm:text-lg font-black text-white">
                  Xếp ứng viên vào ca phỏng vấn
                </DialogTitle>
                <DialogDescription className="text-xs text-blue-100/90 mt-0.5">
                  {assignModalSlot && (
                    <span>
                      Ngày <strong>{formatDate(assignModalSlot.interview_date)}</strong> ({assignModalSlot.start_time?.slice(0, 5)} - {assignModalSlot.end_time?.slice(0, 5)}) • {assignModalSlot.departments?.name || 'Chung CLB'}
                    </span>
                  )}
                </DialogDescription>
              </div>
            </div>
          </div>

          <div className="p-5 sm:p-6 space-y-4 max-h-[70vh] overflow-y-auto">
            {/* Search Input & Status Filter Tabs */}
            <div className="space-y-3">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input
                  placeholder="Tìm theo tên ứng viên, MSSV, SĐT, Email..."
                  value={candidateSearch}
                  onChange={e => setCandidateSearch(e.target.value)}
                  className="pl-10 text-sm rounded-xl"
                />
              </div>

              {/* Status Filter Tabs */}
              <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
                <button
                  type="button"
                  onClick={() => setCandidateAssignTab('pending')}
                  className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    candidateAssignTab === 'pending'
                      ? 'bg-white text-[#1657c1] shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Chờ xếp ca ({allCandidates.filter(c => !c.is_interviewed).length})
                </button>
                <button
                  type="button"
                  onClick={() => setCandidateAssignTab('interviewed')}
                  className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    candidateAssignTab === 'interviewed'
                      ? 'bg-white text-emerald-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Đã phỏng vấn ({allCandidates.filter(c => c.is_interviewed).length})
                </button>
                <button
                  type="button"
                  onClick={() => setCandidateAssignTab('all')}
                  className={`py-1.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    candidateAssignTab === 'all'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Tất cả ({allCandidates.length})
                </button>
              </div>
            </div>

            {/* Candidate List */}
            <div className="space-y-2.5">
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                <span>Danh sách ứng viên ({availableCandidates.length})</span>
                {candidateAssignTab === 'interviewed' && (
                  <span className="text-[11px] text-emerald-700 font-normal italic">
                    Ứng viên đã hoàn thành và có điểm số
                  </span>
                )}
              </div>

              {availableCandidates.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                  <Users className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="text-xs font-bold text-slate-600">Không tìm thấy ứng viên phù hợp</p>
                  <p className="text-[11px] text-slate-400">
                    {candidateAssignTab === 'pending'
                      ? 'Tất cả ứng viên đã được xếp ca hoặc đã phỏng vấn.'
                      : candidateAssignTab === 'interviewed'
                      ? 'Chưa có ứng viên nào hoàn thành chấm điểm phỏng vấn.'
                      : 'Không có ứng viên nào khớp với bộ lọc.'}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {availableCandidates.map(cand => {
                    const isAssigning = assigningCandidateId === cand.application_id
                    const isThisSlotFull = (assignModalSlot?.current_candidates || 0) >= (assignModalSlot?.max_candidates || 1)

                    return (
                      <div
                        key={cand.application_id}
                        className={`p-3.5 rounded-2xl border transition-all shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                          cand.is_interviewed
                            ? 'bg-emerald-50/40 border-emerald-200'
                            : 'bg-white border-slate-200/80 hover:border-blue-300'
                        }`}
                      >
                        <div className="flex items-start gap-3 min-w-0">
                          <div className={`w-10 h-10 rounded-xl text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-2xs ${
                            cand.is_interviewed
                              ? 'bg-emerald-600'
                              : 'bg-gradient-to-br from-[#1657c1] to-blue-700'
                          }`}>
                            {cand.is_interviewed ? (
                              <CheckCircle2 className="w-5 h-5" />
                            ) : (
                              cand.profile.full_name?.charAt(0)?.toUpperCase() || 'U'
                            )}
                          </div>
                          <div className="min-w-0">
                            {/* TÊN ỨNG VIÊN NỔI BẬT */}
                            <div className="font-black text-slate-900 text-sm leading-tight flex items-center gap-2 flex-wrap">
                              <span>{cand.profile.full_name || 'Ứng viên'}</span>
                              <Badge variant="outline" className="text-[10px] font-bold text-blue-700 border-blue-200">
                                {cand.department_name}
                              </Badge>
                              {cand.is_interviewed ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                                  <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                                  <span>Đã phỏng vấn</span>
                                  {cand.eval_score !== null && cand.eval_score !== undefined && (
                                    <strong className="font-mono ml-0.5">• {cand.eval_score}đ</strong>
                                  )}
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                                  <Clock className="w-2.5 h-2.5 text-amber-600" />
                                  <span>Chờ xếp ca</span>
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 font-medium">
                              <span>MSSV: <strong className="font-mono text-slate-800">{cand.profile.student_id || '—'}</strong></span>
                              {cand.profile.phone && <span>SĐT: <strong className="font-mono text-slate-800">{cand.profile.phone}</strong></span>}
                              {cand.profile.email && <span className="text-slate-400 truncate max-w-[200px]">{cand.profile.email}</span>}
                            </div>
                          </div>
                        </div>

                        <div className="shrink-0 flex items-center gap-2">
                          {cand.is_interviewed ? (
                            <Link
                              href={`/admin/evaluation/${cand.application_id}`}
                              className="px-3 py-1.5 rounded-xl bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                              title="Xem kết quả chấm điểm"
                            >
                              <FileText className="w-3.5 h-3.5" />
                              <span>Xem điểm</span>
                            </Link>
                          ) : (
                            <Button
                              type="button"
                              size="sm"
                              disabled={isAssigning || isThisSlotFull}
                              onClick={() => handleAssignCandidate(assignModalSlot, cand)}
                              className="bg-[#1657c1] hover:bg-blue-800 text-white font-bold text-xs rounded-xl gap-1 shrink-0 cursor-pointer"
                            >
                              {isAssigning ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Plus className="w-3.5 h-3.5" />
                              )}
                              <span>Xếp vào ca này</span>
                            </Button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="p-4 bg-slate-50 border-t border-slate-200">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setAssignModalSlot(null)
                setCandidateSearch('')
              }}
              className="w-full text-xs font-bold rounded-xl"
            >
              Hoàn tất / Đóng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Form Dialog: Create / Edit Slot */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-black text-slate-900">
              {editSlot ? 'Chỉnh sửa ca phỏng vấn' : 'Tạo ca phỏng vấn mới'}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Điền thông tin thời gian, hình thức và chỉ tiêu ứng viên cho ca phỏng vấn
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 text-xs sm:text-sm">
            <div>
              <Label className="mb-1.5 font-bold">Ban áp dụng</Label>
              {isSuperAdmin ? (
                <Select value={form.department_id} onValueChange={v => setForm(f => ({ ...f, department_id: v }))}>
                  <SelectTrigger className="rounded-xl"><SelectValue placeholder="Chọn ban..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Tất cả các Ban (Chung CLB)</SelectItem>
                    {departments.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              ) : (
                <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-xl text-xs font-bold text-[#1559c5]">
                  {userDeptObj?.name || 'Ban phụ trách'}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="mb-1.5 font-bold">Ngày phỏng vấn</Label>
                <Input
                  type="date"
                  value={form.interview_date}
                  onChange={e => setForm(f => ({ ...f, interview_date: e.target.value }))}
                  className="rounded-xl"
                />
              </div>
              <div>
                <Label className="mb-1.5 font-bold">Số ứng viên tối đa</Label>
                <Input
                  type="number"
                  min={1}
                  value={form.max_candidates}
                  onChange={e => setForm(f => ({ ...f, max_candidates: parseInt(e.target.value) || 1 }))}
                  className="rounded-xl"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="mb-1.5 font-bold">Giờ bắt đầu</Label>
                <Input
                  type="time"
                  value={form.start_time}
                  onChange={e => setForm(f => ({ ...f, start_time: e.target.value }))}
                  className="rounded-xl"
                />
              </div>
              <div>
                <Label className="mb-1.5 font-bold">Giờ kết thúc</Label>
                <Input
                  type="time"
                  value={form.end_time}
                  onChange={e => setForm(f => ({ ...f, end_time: e.target.value }))}
                  className="rounded-xl"
                />
              </div>
            </div>

            <div>
              <Label className="mb-1.5 font-bold">Hình thức phỏng vấn</Label>
              <Select value={form.format} onValueChange={v => setForm(f => ({ ...f, format: v }))}>
                <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="online">Phỏng vấn Online (Google Meet / Zoom)</SelectItem>
                  <SelectItem value="offline">Phỏng vấn Offline (Trực tiếp tại trường)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {form.format === 'online' ? (
              <div>
                <Label className="mb-1.5 font-bold">Link phòng họp (Google Meet / Zoom)</Label>
                <Input
                  value={form.meeting_url}
                  onChange={e => setForm(f => ({ ...f, meeting_url: e.target.value }))}
                  placeholder="https://meet.google.com/xyz-abcd-efg"
                  className="rounded-xl font-mono text-xs"
                />
              </div>
            ) : (
              <div>
                <Label className="mb-1.5 font-bold">Địa điểm phỏng vấn</Label>
                <Input
                  value={form.location}
                  onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                  placeholder="Tòa E5, Trường Quốc tế, ĐHQGHN, 144 Xuân Thủy"
                  className="rounded-xl"
                />
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 pt-2">
            <Button variant="outline" onClick={() => setShowForm(false)} className="rounded-xl">Huỷ</Button>
            <Button
              onClick={handleSave}
              disabled={saving || !form.interview_date || !form.start_time}
              className="bg-[#1657c1] hover:bg-blue-800 text-white font-bold rounded-xl"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              {editSlot ? 'Cập nhật ca' : 'Tạo ca phỏng vấn'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL: ĐỔI CA PHỎNG VẤN CHO ỨNG VIÊN */}
      <Dialog
        open={Boolean(moveModalData)}
        onOpenChange={open => {
          if (!open) {
            setMoveModalData(null)
            setTargetSlotId('')
          }
        }}
      >
        <DialogContent className="max-w-lg p-0 overflow-hidden rounded-3xl border-slate-200 shadow-2xl">
          {/* Header */}
          <div className="bg-gradient-to-r from-[#0d3b82] to-[#1657c1] text-white p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-amber-400 shrink-0">
                <ArrowLeftRight className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className="text-base sm:text-lg font-black text-white">
                  Đổi ca phỏng vấn cho ứng viên
                </DialogTitle>
                <DialogDescription className="text-xs text-blue-100/90 mt-0.5">
                  Chuyển ứng viên sang một ca phỏng vấn khác còn chỗ trống
                </DialogDescription>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-4">
            {moveModalData && (
              <>
                {/* Thông tin ứng viên */}
                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Ứng viên cần chuyển</div>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[#1657c1] text-white font-bold flex items-center justify-center text-sm shadow-xs">
                      {moveModalData.interview.candidate?.full_name?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 text-sm">
                        {moveModalData.interview.candidate?.full_name || 'Ứng viên'}
                      </div>
                      <div className="text-xs text-slate-500 font-mono">
                        MSSV: {moveModalData.interview.candidate?.student_id || '—'}
                        {moveModalData.interview.candidate?.phone && ` • SĐT: ${moveModalData.interview.candidate.phone}`}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Ca hiện tại */}
                <div className="p-3.5 bg-amber-50/50 rounded-2xl border border-amber-200/70 space-y-1">
                  <div className="text-[11px] font-bold text-amber-900 uppercase tracking-wider">Ca phỏng vấn hiện tại</div>
                  <div className="text-xs text-slate-800 font-semibold flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-amber-600" />
                    <span>{formatDate(moveModalData.sourceSlot.interview_date)}</span>
                    <Clock className="w-3.5 h-3.5 text-amber-600 ml-1" />
                    <span>{moveModalData.sourceSlot.start_time?.slice(0, 5)} – {moveModalData.sourceSlot.end_time?.slice(0, 5)}</span>
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {moveModalData.sourceSlot.departments?.name || 'Chung'} • {moveModalData.sourceSlot.format === 'online' ? 'Online' : 'Offline'}
                  </div>
                </div>

                {/* Chọn ca mới */}
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-slate-700">Chọn ca phỏng vấn mới</Label>
                  <Select value={targetSlotId} onValueChange={setTargetSlotId}>
                    <SelectTrigger className="h-11 rounded-xl border-slate-200">
                      <SelectValue placeholder="-- Chọn ca phỏng vấn còn chỗ --" />
                    </SelectTrigger>
                    <SelectContent className="max-h-64">
                      {slots
                        .filter(s => s.id !== moveModalData.sourceSlot.id && (s.current_candidates || 0) < s.max_candidates)
                        .map(s => (
                          <SelectItem key={s.id} value={s.id} className="text-xs py-2">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-800">
                                {formatDate(s.interview_date)} ({s.start_time?.slice(0, 5)} - {s.end_time?.slice(0, 5)})
                              </span>
                              <span className="text-slate-500">
                                • {s.departments?.name || 'Chung'}
                              </span>
                              <span className="text-[11px] text-blue-600 font-mono">
                                ({s.current_candidates || 0}/{s.max_candidates} chỗ)
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>

                  {slots.filter(s => s.id !== moveModalData.sourceSlot.id && (s.current_candidates || 0) < s.max_candidates).length === 0 && (
                    <p className="text-xs text-red-500 italic">
                      Hiện tại không có ca phỏng vấn nào khác còn chỗ trống. Hãy tạo thêm ca mới.
                    </p>
                  )}
                </div>
              </>
            )}
          </div>

          <DialogFooter className="gap-2 p-5 bg-slate-50/70 border-t border-slate-100">
            <Button
              variant="outline"
              onClick={() => {
                setMoveModalData(null)
                setTargetSlotId('')
              }}
              className="rounded-xl cursor-pointer"
            >
              Huỷ
            </Button>
            <Button
              onClick={handleMoveCandidate}
              disabled={moving || !targetSlotId}
              className="bg-[#1657c1] hover:bg-blue-800 text-white font-bold rounded-xl gap-1.5 cursor-pointer"
            >
              {moving ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowLeftRight className="w-4 h-4" />}
              <span>{moving ? 'Đang chuyển...' : 'Xác nhận chuyển ca'}</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

