'use client'
import { MOCK_INTERVIEW_SLOTS } from '@/lib/mock-data'
import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/components/ui/use-toast'
import { Loader2 } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import Link from 'next/link'

export default function MemberInterviewPage() {
  const supabase = createClient()
  const { toast } = useToast()
  const [slots, setSlots] = useState<any[]>([])
  const [myInterview, setMyInterview] = useState<any>(null)
  const [application, setApplication] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [booking, setBooking] = useState<string | null>(null)

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
      const { data: iv } = await supabase
        .from('interviews')
        .select('*, interview_slots(*)')
        .eq('application_id', app.id)
        .single()
      setMyInterview(iv)

      const { data: availableSlots } = await supabase
        .from('interview_slots')
        .select('*')
        .eq('department_id', app.department_id)
        .eq('is_active', true)
        .gt('current_candidates', -1)
        .order('interview_date')
        .order('start_time')
      setSlots(availableSlots || [])
    }
    setLoading(false)
  }, [supabase])

  useEffect(() => { fetchData() }, [fetchData])

  const bookSlot = async (slotId: string) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setBooking(slotId)
      setTimeout(() => {
        setBooking(null)
        toast({
          title: 'Đã đặt ca phỏng vấn thành công (Demo)!',
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-[#1657c1]" />
      </div>
    )
  }

  // Trường hợp chưa mở vòng phỏng vấn
  if (!application || application.status === 'draft' || application.status === 'submitted' || application.status === 'received' || application.status === 'reviewing') {
    return (
      <div className="space-y-6 max-w-3xl mx-auto animate-fade-in pb-12 font-sans">
        <div className="space-y-1 border-b border-slate-200 pb-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 tracking-tight">
            LỊCH PHỎNG VẤN iSSAC 2026
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            Vòng phỏng vấn tuyển chọn Đại sứ Sinh viên Gen 10
          </p>
        </div>

        <div className="bg-white border-2 border-slate-200 rounded-3xl p-8 sm:p-12 text-center shadow-xs space-y-4">
          <div className="inline-block px-4 py-1.5 rounded-full text-xs font-bold bg-blue-50 text-[#1657c1] uppercase tracking-wider border border-blue-200">
            Trạng thái vòng tuyển quân
          </div>
          <h2 className="text-xl font-bold text-slate-900">
            Chưa mở đặt lịch phỏng vấn
          </h2>
          <p className="text-slate-600 max-w-md mx-auto text-xs sm:text-sm leading-relaxed">
            Hồ sơ đơn ứng tuyển của bạn hiện đang trong giai đoạn chấm duyệt. Sau khi có thông báo vượt qua vòng đơn, cổng đặt lịch phỏng vấn sẽ tự động mở tại trang này.
          </p>
          <div className="pt-2">
            <Link
              href="/member/dashboard"
              className="inline-block px-6 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-all"
            >
              Về trang Tổng quan
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // Trường hợp ĐÃ ĐẶT LỊCH THÀNH CÔNG
  if (myInterview) {
    const slot = myInterview.interview_slots
    return (
      <div className="space-y-6 max-w-3xl mx-auto animate-fade-in pb-12 font-sans">
        {/* Header đồng bộ font chữ & phong cách */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 tracking-tight">
              LỊCH PHỎNG VẤN iSSAC 2026
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-medium">
              Vòng phỏng vấn tuyển chọn Đại sứ Sinh viên Gen 10
            </p>
          </div>
          <Link
            href="/member/dashboard"
            className="px-4 py-2 rounded-xl border-2 border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-xs transition-all"
          >
            Về Tổng quan
          </Link>
        </div>

        {/* Thẻ Lịch phỏng vấn: Viền full, phong cách Hoàng gia Xanh Navy & Vàng kim, không dùng icon */}
        <div className="bg-white border-2 border-[#1657c1]/20 rounded-3xl shadow-md overflow-hidden">
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-[#0d3b82] to-[#1657c1] p-5 sm:p-6 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="text-[11px] uppercase tracking-widest text-blue-200 font-bold">
                Trạng thái lịch hẹn
              </div>
              <div className="text-lg sm:text-xl font-black text-white">
                Đã xác nhận lịch phỏng vấn
              </div>
            </div>
            <span className="inline-block px-3.5 py-1 rounded-full text-xs font-black bg-[#fdc455] text-slate-950 uppercase tracking-wider shadow-sm self-start sm:self-auto">
              Đã đặt lịch thành công
            </span>
          </div>

          {/* Bảng chi tiết thông tin phỏng vấn - Rõ ràng, sạch sẽ, không icon */}
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

            {/* Khối nhắc nhở từ Ban Nhân sự - Không emoji ⏰ */}
            <div className="rounded-2xl border-l-4 border-amber-400 bg-amber-50/70 p-4 text-xs sm:text-sm text-amber-950 space-y-1">
              <div className="font-bold text-amber-950">Lưu ý quan trọng từ Ban Nhân sự:</div>
              <p className="text-amber-900 leading-relaxed font-medium">
                Vui lòng có mặt trước giờ phỏng vấn ít nhất 10 phút và chuẩn bị trang phục lịch sự. Nếu phát sinh sự cố đột xuất cần hỗ trợ dời lịch, hãy liên hệ ngay với Ban Nhân sự CLB iSSAC.
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Trường hợp ĐƯỢC MỜI VÀ ĐANG CHỌN KHUNG GIỜ
  return (
    <div className="space-y-6 max-w-3xl mx-auto animate-fade-in pb-12 font-sans">
      <div className="space-y-1 border-b border-slate-200 pb-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 tracking-tight">
          CHỌN LỊCH PHỎNG VẤN iSSAC 2026
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 font-medium">
          Lựa chọn khung giờ thuận tiện nhất để tham gia phỏng vấn cùng Hội đồng tuyển sinh
        </p>
      </div>

      {slots.length === 0 ? (
        <div className="bg-white border-2 border-slate-200 rounded-3xl p-8 sm:p-12 text-center shadow-xs space-y-3">
          <div className="text-base font-bold text-slate-800">
            Chưa có lịch phỏng vấn khả dụng
          </div>
          <p className="text-slate-500 text-xs sm:text-sm max-w-sm mx-auto leading-relaxed">
            Các ca phỏng vấn cho Ban của bạn đang được cập nhật. Vui lòng quay lại sau hoặc liên hệ Ban Nhân sự.
          </p>
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
