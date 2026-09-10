'use client'
import { MOCK_INTERVIEW_SLOTS } from '@/lib/mock-data'
import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/components/ui/use-toast'
import { Loader2, ArrowLeftRight, Calendar, Clock, CheckCircle2, AlertCircle } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import Link from 'next/link'
import Image from 'next/image'

export default function MemberInterviewPage() {
  const supabase = createClient()
  const { toast } = useToast()
  const [slots, setSlots] = useState<any[]>([])
  const [myInterview, setMyInterview] = useState<any>(null)
  const [application, setApplication] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [booking, setBooking] = useState<string | null>(null)
  const [showReschedule, setShowReschedule] = useState(false)
  const [rescheduling, setRescheduling] = useState<string | null>(null)
  const [myEvaluation, setMyEvaluation] = useState<any>(null)

  const fetchData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setApplication({
        id: 'app-01',
        status: 'interview_scheduled',
        department_id: 'dept-1'
      })
      setMyInterview({
        id: 'iv-01',
        status: 'scheduled',
        interview_slots: {
          interview_date: '2026-09-12',
          start_time: '08:30',
          end_time: '10:00',
          format: 'offline',
          location: 'Phòng Hội đồng 302, Nhà C, VNU-IS (Làng Sinh viên HACINCO)',
        }
      })
      setSlots(MOCK_INTERVIEW_SLOTS as any)
      setLoading(false)
      return
    }

    const { data: app } = await supabase
      .from('applications')
      .select('id, status, department_id')
      .eq('user_id', user.id)
      .single()

    setApplication(app)

    if (app) {
      const [
        { data: iv },
        { data: ev }
      ] = await Promise.all([
        supabase
          .from('interviews')
          .select('*, interview_slots(*)')
          .eq('application_id', app.id)
          .maybeSingle(),
        supabase
          .from('evaluations')
          .select('id, total_score, submitted_at, status')
          .eq('application_id', app.id)
          .maybeSingle()
      ])

      setMyInterview(iv || null)
      setMyEvaluation(ev || null)

      let query = supabase
        .from('interview_slots')
        .select('*')
        .eq('is_active', true)
        .order('interview_date')
        .order('start_time')

      if (app.department_id) {
        query = query.or(`department_id.eq.${app.department_id},department_id.is.null`)
      }

      const { data: availableSlots } = await query
      setSlots(availableSlots || [])
    }
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    fetchData()

    const channel = supabase
      .channel('member-interviews-rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'interviews' }, () => {
        fetchData()
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'interview_slots' }, () => {
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

  const bookSlot = async (slotId: string) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setBooking(slotId)
      setTimeout(() => {
        setBooking(null)
        toast({
          title: 'Đã đặt ca phỏng vấn thành công!',
          description: 'Hệ thống đã ghi nhận lịch phỏng vấn của bạn.',
        })
      }, 600)
      return
    }
    setBooking(slotId)

    const { data: slot } = await supabase.from('interview_slots').select('current_candidates, max_candidates').eq('id', slotId).single()
    if (!slot || slot.current_candidates >= slot.max_candidates) {
      toast({ title: 'Slot đã đầy', description: 'Vui lòng chọn khung giờ khác.', variant: 'destructive' })
      setBooking(null)
      return
    }

    const { error } = await supabase.from('interviews').insert({
      application_id: application.id,
      slot_id: slotId,
      user_id: user.id,
      status: 'scheduled',
      confirmed_at: new Date().toISOString(),
    })

    if (error) {
      toast({ title: 'Lỗi', description: error.message, variant: 'destructive' })
      setBooking(null)
      return
    }

    await supabase.from('interview_slots').update({ current_candidates: slot.current_candidates + 1 }).eq('id', slotId)
    await supabase.from('applications').update({ status: 'interview_scheduled' }).eq('id', application.id)

    await supabase.from('notifications').insert({
      user_id: user.id,
      title: 'Đã đặt lịch phỏng vấn',
      message: 'Bạn đã đặt lịch phỏng vấn thành công. Vui lòng đến đúng giờ!',
      type: 'success',
    })

    toast({ title: 'Đặt lịch thành công!', description: 'Lịch phỏng vấn của bạn đã được xác nhận.' })
    setBooking(null)
    fetchData()
  }

  // Đổi sang ca phỏng vấn khác
  const rescheduleSlot = async (newSlotId: string) => {
    if (!myInterview) return
    const currentSlotId = myInterview.slot_id
    if (newSlotId === currentSlotId) return

    setRescheduling(newSlotId)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setTimeout(() => {
          setRescheduling(null)
          setShowReschedule(false)
          toast({ title: 'Đã đổi ca thành công!', description: 'Lịch phỏng vấn mới của bạn đã được cập nhật.' })
        }, 600)
        return
      }

      // Check slot availability
      const { data: targetSlot } = await supabase
        .from('interview_slots')
        .select('*')
        .eq('id', newSlotId)
        .single()

      if (!targetSlot || (targetSlot.current_candidates || 0) >= targetSlot.max_candidates) {
        toast({ title: 'Ca phỏng vấn đã đầy', description: 'Vui lòng chọn khung giờ khác.', variant: 'destructive' })
        setRescheduling(null)
        return
      }

      // 1. Trừ sĩ số ca cũ
      if (currentSlotId) {
        const { data: oldSlot } = await supabase
          .from('interview_slots')
          .select('current_candidates')
          .eq('id', currentSlotId)
          .single()
        if (oldSlot) {
          const newOldCount = Math.max(0, (oldSlot.current_candidates || 1) - 1)
          await supabase.from('interview_slots').update({ current_candidates: newOldCount }).eq('id', currentSlotId)
        }
      }

      // 2. Tăng sĩ số ca mới
      await supabase
        .from('interview_slots')
        .update({ current_candidates: (targetSlot.current_candidates || 0) + 1 })
        .eq('id', newSlotId)

      // 3. Cập nhật bản ghi interview
      const { error: updErr } = await supabase
        .from('interviews')
        .update({
          slot_id: newSlotId,
          confirmed_at: new Date().toISOString()
        })
        .eq('id', myInterview.id)

      if (updErr) throw updErr

      // 4. Gửi thông báo
      await supabase.from('notifications').insert({
        user_id: user.id,
        title: 'Đã đổi ca phỏng vấn thành công',
        message: `Lịch phỏng vấn của bạn đã được chuyển sang ngày ${formatDate(targetSlot.interview_date)} (${targetSlot.start_time?.slice(0, 5)} - ${targetSlot.end_time?.slice(0, 5)}).`,
        type: 'info'
      })

      toast({
        title: '✅ Đã đổi ca phỏng vấn thành công!',
        description: `Lịch mới: ${formatDate(targetSlot.interview_date)} (${targetSlot.start_time?.slice(0, 5)} - ${targetSlot.end_time?.slice(0, 5)}).`
      })

      setShowReschedule(false)
      await fetchData()
    } catch (err: any) {
      toast({ title: 'Lỗi đổi ca phỏng vấn', description: err.message || 'Không thể chuyển ca.', variant: 'destructive' })
    } finally {
      setRescheduling(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-[#1657c1]" />
      </div>
    )
  }

  // 1. Trường hợp ĐÃ ĐƯỢC XẾP HOẶC ĐÃ ĐẶT LỊCH THÀNH CÔNG
  if (myInterview) {
    const slot = myInterview.interview_slots
    const otherAvailableSlots = slots.filter(s => s.id !== myInterview.slot_id && (s.current_candidates || 0) < s.max_candidates)
    const isInterviewCompleted = Boolean(
      (myEvaluation && (myEvaluation.total_score !== null && myEvaluation.total_score !== undefined || myEvaluation.submitted_at || myEvaluation.status === 'submitted')) ||
      ['interviewed', 'evaluated', 'finalized', 'passed', 'failed', 'accepted', 'rejected'].includes(application?.status || '') ||
      myInterview?.status === 'completed'
    )

    return (
      <div className="space-y-6 max-w-3xl mx-auto animate-fade-in pb-12 font-sans">
        {/* Header đồng bộ font chữ & phong cách */}
        <div className="flex items-end justify-between border-b border-slate-200 pb-4">
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 tracking-tight">
              LỊCH PHỎNG VẤN iSSAC 2026
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-medium">
              Vòng phỏng vấn tuyển chọn Đại sứ Sinh viên Gen 3
            </p>
          </div>
          <div className="flex items-end gap-3 shrink-0 -mb-4 pl-3 mr-2 sm:mr-4">
            <Link
              href="/member/dashboard"
              className="px-4 py-2 rounded-xl border-2 border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-xs transition-all mb-4 self-center sm:self-end"
            >
              Về Tổng quan
            </Link>
            <Image
              src="/images/isaris-interview.png"
              alt="ISARIS - Hẹn gặp bạn nhé!"
              width={295}
              height={383}
              className="h-20 sm:h-24 w-auto object-contain drop-shadow-sm select-none pointer-events-none"
              priority
            />
          </div>
        </div>

        {/* Thẻ Lịch phỏng vấn: Viền full, phong cách Hoàng gia Xanh Navy & Vàng kim */}
        <div className="bg-white border-2 border-[#1657c1]/20 rounded-3xl shadow-md overflow-hidden">
          {/* Header Banner */}
          <div className={`p-5 sm:p-6 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
            isInterviewCompleted
              ? 'bg-gradient-to-r from-emerald-800 to-[#0d3b82]'
              : 'bg-gradient-to-r from-[#0d3b82] to-[#1657c1]'
          }`}>
            <div>
              <div className="text-[11px] uppercase tracking-widest text-blue-200 font-bold flex items-center gap-1.5">
                {isInterviewCompleted && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />}
                {isInterviewCompleted ? 'Đã hoàn thành phỏng vấn' : 'Trạng thái lịch hẹn'}
              </div>
              <div className="text-lg sm:text-xl font-black text-white">
                {isInterviewCompleted ? 'Đã ghi nhận kết quả đánh giá' : 'Đã xác nhận lịch phỏng vấn'}
              </div>
            </div>
            <span className={`inline-block px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-wider shadow-sm self-start sm:self-auto ${
              isInterviewCompleted
                ? 'bg-emerald-400 text-emerald-950'
                : 'bg-[#fdc455] text-slate-950'
            }`}>
              {isInterviewCompleted ? 'Đã phỏng vấn xong' : 'Đã có lịch chính thức'}
            </span>
          </div>

          {/* Bảng chi tiết thông tin phỏng vấn */}
          <div className="p-6 sm:p-7 space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-slate-50/80 border-2 border-slate-200/80 space-y-1">
                <div className="text-xs font-semibold text-slate-500">Ngày phỏng vấn</div>
                <div className="text-base font-bold text-slate-900">{formatDate(slot?.interview_date)}</div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50/80 border-2 border-slate-200/80 space-y-1">
                <div className="text-xs font-semibold text-slate-500">Khung giờ</div>
                <div className="text-base font-black text-[#1657c1]">{slot?.start_time?.slice(0,5)} - {slot?.end_time?.slice(0,5)}</div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50/80 border-2 border-slate-200/80 space-y-1">
                <div className="text-xs font-semibold text-slate-500">Hình thức phỏng vấn</div>
                <div className="text-base font-bold text-slate-900">
                  {slot?.format === 'online' ? 'Trực tuyến (Online)' : 'Trực tiếp (Offline)'}
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50/80 border-2 border-slate-200/80 space-y-1">
                <div className="text-xs font-semibold text-slate-500">Địa điểm tập trung</div>
                <div className="text-sm font-bold text-slate-900 leading-snug">
                  {slot?.location || (slot?.format === 'online' ? 'Phòng họp trực tuyến' : 'Thông báo sau')}
                </div>
              </div>
            </div>

            {slot?.meeting_url && (
              <div className="p-4 rounded-2xl bg-blue-50/70 border-2 border-blue-200 space-y-1.5">
                <div className="text-xs font-bold text-[#1657c1] uppercase tracking-wide">
                  Đường dẫn phòng phỏng vấn trực tuyến
                </div>
                <a
                  href={slot.meeting_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs sm:text-sm text-blue-700 hover:underline font-semibold break-all block"
                >
                  {slot.meeting_url}
                </a>
              </div>
            )}

            {/* Khối nhắc nhở từ Ban Nhân sự */}
            <div className="rounded-2xl border-l-4 border-amber-400 bg-amber-50/70 p-4 text-xs sm:text-sm text-amber-950 space-y-1">
              <div className="font-bold text-amber-950">Lưu ý từ Ban Tuyển quân:</div>
              <p className="text-amber-900 leading-relaxed font-medium">
                {isInterviewCompleted
                  ? 'Bạn đã tham gia và hoàn tất buổi phỏng vấn cùng Ban Tuyển quân iSSAC Gen 3. Kết quả đánh giá được lưu lại và dùng để xét duyệt vòng kết quả tuyển quân.'
                  : 'Vui lòng có mặt trước giờ phỏng vấn ít nhất 10 phút và chuẩn bị trang phục lịch sự. Nếu phát sinh sự cố đột xuất cần hỗ trợ dời lịch, hãy liên hệ ngay với Ban Nhân sự CLB iSSAC hoặc chọn đổi ca bên dưới.'}
              </p>
            </div>

            {/* Nút kích hoạt Đổi ca phỏng vấn HOẶC Khối thông báo hoàn thành */}
            <div className="pt-2">
              {isInterviewCompleted ? (
                <div className="p-4 rounded-2xl bg-emerald-50/90 border-2 border-emerald-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs sm:text-sm font-black text-emerald-950">
                        Buổi phỏng vấn đã hoàn tất thành công!
                      </div>
                      <div className="text-[11px] text-emerald-700 font-medium">
                        Điểm số và đánh giá của bạn đã được ghi nhận. Lịch phỏng vấn được bảo toàn vĩnh viễn trong hệ thống.
                      </div>
                    </div>
                  </div>
                  <Link
                    href="/member/result"
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shrink-0 transition-all text-center shadow-xs"
                  >
                    Xem trang Kết quả
                  </Link>
                </div>
              ) : !showReschedule ? (
                <button
                  type="button"
                  onClick={() => setShowReschedule(true)}
                  className="w-full py-3 px-4 rounded-2xl border-2 border-blue-200 hover:border-blue-400 bg-blue-50/50 hover:bg-blue-50 text-[#1657c1] font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <ArrowLeftRight className="w-4 h-4" />
                  <span>Đổi sang ca phỏng vấn khác</span>
                </button>
              ) : (
                <div className="p-5 rounded-2xl border-2 border-[#1657c1]/30 bg-slate-50/70 space-y-4 animate-fade-in">
                  <div className="flex items-center justify-between gap-2 border-b border-slate-200 pb-3">
                    <div className="flex items-center gap-2">
                      <ArrowLeftRight className="w-4 h-4 text-[#1657c1]" />
                      <span className="font-bold text-slate-800 text-sm">Chọn ca phỏng vấn mới còn chỗ trống</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowReschedule(false)}
                      className="text-xs font-semibold text-slate-500 hover:text-slate-800 cursor-pointer"
                    >
                      Đóng
                    </button>
                  </div>

                  {otherAvailableSlots.length === 0 ? (
                    <div className="p-4 bg-white rounded-xl border border-slate-200 text-center text-xs text-slate-500">
                      Hiện tại không có ca phỏng vấn nào khác còn chỗ trống. Vui lòng liên hệ trực tiếp Ban Nhân sự nếu bạn cần dời lịch.
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {otherAvailableSlots.map(otherSlot => (
                        <div
                          key={otherSlot.id}
                          className="p-3.5 rounded-xl border-2 border-slate-200 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-blue-300 transition-all"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-slate-900 text-xs sm:text-sm">
                                {formatDate(otherSlot.interview_date)}
                              </span>
                              <span className="text-[#1657c1] font-black text-xs sm:text-sm">
                                {otherSlot.start_time?.slice(0,5)} - {otherSlot.end_time?.slice(0,5)}
                              </span>
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                otherSlot.format === 'online' ? 'bg-blue-100 text-[#1657c1]' : 'bg-amber-100 text-amber-900'
                              }`}>
                                {otherSlot.format === 'online' ? 'Online' : 'Offline'}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-500">
                              {otherSlot.location || (otherSlot.format === 'online' ? 'Trực tuyến' : 'Thông báo sau')} • Còn {otherSlot.max_candidates - (otherSlot.current_candidates || 0)} chỗ
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => rescheduleSlot(otherSlot.id)}
                            disabled={rescheduling === otherSlot.id}
                            className="px-4 py-2 rounded-xl bg-[#1657c1] hover:bg-blue-800 text-white font-bold text-xs transition-all cursor-pointer shrink-0 disabled:opacity-60 flex items-center justify-center gap-1.5"
                          >
                            {rescheduling === otherSlot.id ? (
                              <>
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                <span>Đang đổi...</span>
                              </>
                            ) : (
                              <>
                                <ArrowLeftRight className="w-3.5 h-3.5" />
                                <span>Chuyển sang ca này</span>
                              </>
                            )}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // 2. Trường hợp chưa mở vòng phỏng vấn
  if (!application || application.status === 'draft' || application.status === 'submitted' || application.status === 'received' || application.status === 'reviewing') {
    return (
      <div className="space-y-6 max-w-3xl mx-auto animate-fade-in pb-12 font-sans">
        <div className="flex items-end justify-between border-b border-slate-200 pb-4">
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 tracking-tight">
              LỊCH PHỎNG VẤN iSSAC 2026
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-medium">
              Vòng phỏng vấn tuyển chọn Đại sứ Sinh viên Gen 3
            </p>
          </div>
          <div className="shrink-0 -mb-4 pl-3 mr-3 sm:mr-6">
            <Image
              src="/images/isaris-interview.png"
              alt="ISARIS - Hẹn gặp bạn nhé!"
              width={295}
              height={383}
              className="h-20 sm:h-24 w-auto object-contain drop-shadow-sm select-none pointer-events-none"
              priority
            />
          </div>
        </div>

        <div className="bg-white border-2 border-[#fdc455] rounded-3xl p-6 sm:p-8 shadow-xs space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-amber-950 bg-[#fdc455] uppercase tracking-wide px-2.5 py-0.5 rounded shadow-2xs">
              Trạng thái vòng tuyển quân
            </span>
          </div>

          <div className="space-y-1.5">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
              Chưa mở đặt lịch phỏng vấn
            </h2>
            <p className="text-slate-600 text-xs sm:text-sm leading-relaxed max-w-xl">
              Hồ sơ đơn ứng tuyển của bạn hiện đang trong giai đoạn chấm duyệt. Sau khi có thông báo vượt qua vòng đơn, cổng đặt lịch phỏng vấn sẽ tự động mở tại trang này.
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-amber-100/70">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-950 bg-amber-100 border border-amber-300 px-3 py-1.5 rounded-lg self-start">
              <span className="w-2 h-2 rounded-full bg-amber-600" />
              Đang chấm duyệt hồ sơ ứng tuyển
            </span>

            <Link
              href="/member/dashboard"
              className="inline-flex items-center px-4 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 font-bold text-xs transition-all border border-slate-200 self-start sm:self-auto"
            >
              Về trang Tổng quan
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // Trường hợp ĐƯỢC MỜI VÀ ĐANG CHỌN KHUNG GIỜ
  return (
    <div className="space-y-6 max-w-3xl mx-auto animate-fade-in pb-12 font-sans">
      <div className="flex items-end justify-between border-b border-slate-200 pb-4">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 tracking-tight">
            CHỌN LỊCH PHỎNG VẤN iSSAC 2026
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            Lựa chọn khung giờ thuận tiện nhất để tham gia phỏng vấn cùng Ban Tuyển quân của CLB
          </p>
        </div>
        <div className="shrink-0 -mb-4 pl-3 mr-3 sm:mr-6">
          <Image
            src="/images/isaris-interview.png"
            alt="ISARIS - Hẹn gặp bạn nhé!"
            width={295}
            height={383}
            className="h-20 sm:h-24 w-auto object-contain drop-shadow-sm select-none pointer-events-none"
            priority
          />
        </div>
      </div>

      {slots.length === 0 ? (
        <div className="bg-white border-2 border-[#fdc455] rounded-3xl p-6 sm:p-8 shadow-xs space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-amber-950 bg-[#fdc455] uppercase tracking-wide px-2.5 py-0.5 rounded shadow-2xs">
              Lịch phỏng vấn
            </span>
          </div>
          <div className="space-y-1.5">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
              Chưa có lịch phỏng vấn khả dụng
            </h2>
            <p className="text-slate-600 text-xs sm:text-sm max-w-xl leading-relaxed">
              Các ca phỏng vấn cho Ban của bạn đang được cập nhật. Vui lòng quay lại sau hoặc liên hệ Ban Nhân sự.
            </p>
          </div>
          <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-amber-100/70">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-950 bg-amber-100 border border-amber-300 px-3 py-1.5 rounded-lg self-start">
              <span className="w-2 h-2 rounded-full bg-amber-600" />
              Đang cập nhật danh sách ca phỏng vấn
            </span>
            <Link
              href="/member/dashboard"
              className="inline-flex items-center px-4 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 font-bold text-xs transition-all border border-slate-200 self-start sm:self-auto"
            >
              Về trang Tổng quan
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid gap-3.5">
          {slots.map(slot => {
            const isFull = slot.current_candidates >= slot.max_candidates
            return (
              <div
                key={slot.id}
                className={`p-5 rounded-2xl border-2 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  isFull 
                    ? 'bg-slate-50/60 border-slate-200 opacity-60' 
                    : 'bg-white border-slate-200/90 hover:border-blue-400 hover:shadow-xs'
                }`}
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="font-bold text-slate-900 text-base">
                      {formatDate(slot.interview_date)}
                    </span>
                    <span className="text-[#1657c1] font-black text-base">
                      {slot.start_time?.slice(0,5)} - {slot.end_time?.slice(0,5)}
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-md text-[11px] font-bold ${
                      slot.format === 'online'
                        ? 'bg-blue-100 text-[#1657c1]'
                        : 'bg-amber-100 text-amber-900'
                    }`}>
                      {slot.format === 'online' ? 'Trực tuyến (Online)' : 'Trực tiếp (Offline)'}
                    </span>
                  </div>

                  <div className="text-xs text-slate-500 flex items-center gap-4 flex-wrap">
                    {slot.location && (
                      <span>Địa điểm: <strong className="text-slate-700">{slot.location}</strong></span>
                    )}
                    <span>Số lượng: <strong className="text-slate-700">{slot.current_candidates}/{slot.max_candidates} người</strong></span>
                  </div>
                </div>

                <div className="shrink-0">
                  <button
                    type="button"
                    onClick={() => bookSlot(slot.id)}
                    disabled={isFull || booking === slot.id}
                    className={`w-full sm:w-auto px-6 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                      isFull
                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                        : 'bg-[#fdc455] hover:bg-[#f59e0b] text-slate-950 shadow-sm hover:scale-[1.02] active:scale-[0.98]'
                    }`}
                  >
                    {booking === slot.id ? (
                      <span className="inline-flex items-center gap-1.5">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" /> Đang xử lý...
                      </span>
                    ) : isFull ? (
                      'Đã kín chỗ'
                    ) : (
                      'Đặt lịch này'
                    )}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
