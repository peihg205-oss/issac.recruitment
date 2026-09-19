'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  AlertTriangle, Loader2, CheckCheck, Clock,
  ShieldCheck, RefreshCw, Bell, Check,
  ExternalLink, Radio, CalendarDays, ArrowRight,
  Sparkles
} from 'lucide-react'
import {
  ChatMessage,
  fetchApplicationMessages,
  markChatAsRead,
} from '@/lib/messages-manager'
import Link from 'next/link'

export default function MemberWarningsPage() {
  const supabase = createClient()

  const [warnings, setWarnings] = useState<ChatMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [application, setApplication] = useState<any>(null)
  const [now, setNow] = useState(Date.now())

  const loadData = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true)
    else setRefreshing(true)

    try {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) { setLoading(false); setRefreshing(false); return }
      setUser(authUser)

      const [{ data: prof }, { data: app }] = await Promise.all([
        supabase.from('profiles').select('full_name, email, student_id, created_at').eq('id', authUser.id).maybeSingle(),
        supabase.from('applications').select('id, status, departments!applications_department_id_fkey(name)').eq('user_id', authUser.id).maybeSingle(),
      ])
      setProfile(prof)
      setApplication(app)

      const convKey = app?.id || authUser.id
      const msgs = await fetchApplicationMessages(supabase, convKey, authUser.id)
      setWarnings(msgs)
      await markChatAsRead(supabase, convKey, 'member', authUser.id)
    } catch (err) {
      console.error('Error fetching warnings:', err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [supabase])

  useEffect(() => { loadData() }, [loadData])

  // Live countdown ticker
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    if (!user?.id) return
    const convKey = application?.id || user.id
    const interval = setInterval(async () => {
      try {
        const msgs = await fetchApplicationMessages(supabase, convKey, user.id)
        setWarnings(prev => {
          if (msgs.length !== prev.length || JSON.stringify(msgs) !== JSON.stringify(prev)) return msgs
          return prev
        })
      } catch {}
    }, 4000)
    return () => clearInterval(interval)
  }, [application?.id, user?.id, supabase])

  useEffect(() => {
    if (!user?.id) return
    const convKey = application?.id || user.id
    const channel = supabase
      .channel(`member-warnings-${convKey}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'audit_logs' }, async (payload: any) => {
        if (payload?.new?.action !== 'CHAT_MESSAGE') return
        const target = payload?.new?.target_id || payload?.new?.metadata?.conversation_id || payload?.new?.metadata?.candidate_user_id
        if (target === convKey || target === user.id) {
          const msgs = await fetchApplicationMessages(supabase, convKey, user.id)
          setWarnings(msgs)
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, async (payload: any) => {
        if (payload?.new?.application_id === convKey || payload?.new?.application_id === user.id) {
          const msgs = await fetchApplicationMessages(supabase, convKey, user.id)
          setWarnings(msgs)
        }
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [application?.id, user?.id, supabase])

  const formatTime = (dateStr: string) => {
    try {
      const d = new Date(dateStr)
      const now = new Date()
      const isToday = d.toDateString() === now.toDateString()
      const yesterday = new Date(now)
      yesterday.setDate(yesterday.getDate() - 1)
      const isYesterday = d.toDateString() === yesterday.toDateString()
      const time = d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false })
      if (isToday) return `Hôm nay, ${time}`
      if (isYesterday) return `Hôm qua, ${time}`
      return `${d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}, ${time}`
    } catch { return '' }
  }

  const adminWarnings = warnings.filter(w => w.sender_role === 'admin' || w.sender_role !== 'member')

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-[#1657c1] mx-auto" />
          <p className="text-sm text-slate-500 font-medium">Đang tải danh sách cảnh báo...</p>
        </div>
      </div>
    )
  }

  const socialLinks = [
    {
      name: 'Facebook',
      handle: '@ambassadorsClub.VNUIS',
      url: 'https://www.facebook.com/ambassadorsClub.VNUIS',
      bg: '#1877F2',
      btnClass: 'bg-[#1877F2] hover:bg-[#1565d8] text-white',
      icon: (
        <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white" xmlns="http://www.w3.org/2000/svg">
          <path d="M24 12.073C24 5.404 18.627 0 12 0S0 5.404 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.235 2.686.235v2.97h-1.513c-1.491 0-1.956.93-1.956 1.886v2.268h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z"/>
        </svg>
      ),
      iconBg: 'bg-[#1877F2]',
    },
    {
      name: 'TikTok',
      handle: '@issac.club',
      url: 'https://www.tiktok.com/@issac.club',
      btnClass: 'bg-slate-900 hover:bg-black text-white',
      icon: (
        <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white" xmlns="http://www.w3.org/2000/svg">
          <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.78a4.85 4.85 0 01-1.01-.09z"/>
        </svg>
      ),
      iconBg: 'bg-slate-900',
    },
    {
      name: 'Instagram',
      handle: '@issac.club',
      url: 'https://www.instagram.com/issac.club',
      btnClass: 'bg-gradient-to-r from-[#f09433] via-[#e6683c] via-[#dc2743] via-[#cc2366] to-[#bc1888] hover:opacity-90 text-white',
      icon: (
        <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
        </svg>
      ),
      iconBg: 'bg-gradient-to-br from-[#f09433] via-[#dc2743] to-[#bc1888]',
    },
    {
      name: 'YouTube',
      handle: 'issac_club',
      url: 'https://www.youtube.com/@issac_club',
      btnClass: 'bg-[#FF0000] hover:bg-[#cc0000] text-white',
      icon: (
        <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white" xmlns="http://www.w3.org/2000/svg">
          <path d="M23.495 6.205a3.007 3.007 0 00-2.088-2.088c-1.87-.501-9.396-.501-9.396-.501s-7.507-.01-9.396.501A3.007 3.007 0 00.527 6.205a31.247 31.247 0 00-.522 5.805 31.247 31.247 0 00.522 5.783 3.007 3.007 0 002.088 2.088c1.868.502 9.396.502 9.396.502s7.506 0 9.396-.502a3.007 3.007 0 002.088-2.088 31.247 31.247 0 00.5-5.783 31.247 31.247 0 00-.5-5.805zM9.609 15.601V8.408l6.264 3.602z"/>
        </svg>
      ),
      iconBg: 'bg-[#FF0000]',
    },
  ]

  return (
    <div className="space-y-6 w-full animate-fade-in pb-12 font-sans">

      {/* ── CARD 1: THÔNG BÁO TỪ CLB ─────────────────────────── */}
      <div className="bg-white border-2 border-slate-200/90 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xs">
        {/* Header row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#1657c1] text-white text-[10px] font-black uppercase tracking-wider">
                <Radio className="w-3 h-3" />
                THÔNG BÁO TỪ CLB
              </span>
              <span className="text-xs font-semibold text-slate-500">Kênh phát tin chính thức một chiều</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Thông báo từ CLB
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-medium">
              Hòm thư lưu trữ các thông báo quan trọng, văn bản hướng dẫn và nhắc nhở gửi đến ứng viên.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
            <button
              onClick={() => loadData(true)}
              disabled={refreshing}
              title="Đồng bộ hòm thư mới nhất"
              className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 transition-all disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
            <Link
              href="/member/dashboard"
              className="px-4 py-2 rounded-xl border-2 border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-xs transition-all"
            >
              Về Tổng quan
            </Link>
          </div>
        </div>

        {/* ── HỘP TIN NHẮN ĐƯỢC GỬI VÀ XEM ĐƯỢC ── */}
        <div className="space-y-4">
          {adminWarnings.length === 0 ? (() => {
            // Compute deadline & remaining
            let deadlineStr = ''
            let remainingStr = ''
            let remainDays = 0
            let remainHours = 0
            if (profile?.created_at) {
              try {
                const created = new Date(profile.created_at)
                const deadline = new Date(created.getTime() + 3 * 24 * 60 * 60 * 1000)
                deadlineStr = `${deadline.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false })} ngày ${deadline.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}`
                const msLeft = deadline.getTime() - now
                if (msLeft > 0) {
                  remainDays = Math.floor(msLeft / (1000 * 60 * 60 * 24))
                  remainHours = Math.floor((msLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
                  remainingStr = remainDays > 0 ? `${remainDays} ngày ${remainHours} giờ` : `${remainHours} giờ`
                } else {
                  remainingStr = 'Đã hết hạn 3 ngày'
                }
              } catch {}
            }

            const createdStr = profile?.created_at
              ? (() => {
                  try {
                    const d = new Date(profile.created_at)
                    return `${d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false })} ngày ${d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}`
                  } catch { return '' }
                })()
              : ''

            return (
              <div className="rounded-2xl border-2 border-blue-200/80 bg-white shadow-xs overflow-hidden transition-all hover:border-blue-400/80">
                {/* Message Header: Người gửi, Huy hiệu & Thời gian */}
                <div className="p-4 sm:p-5 bg-gradient-to-r from-blue-50/90 via-indigo-50/40 to-slate-50 border-b border-blue-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3.5">
                    <div className="w-11 h-11 rounded-2xl bg-[#1657c1] text-white flex items-center justify-center font-black shadow-md shadow-blue-500/20 shrink-0">
                      <Sparkles className="w-5 h-5 text-amber-300" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-black text-slate-900 text-sm sm:text-base">
                          Ban Chủ nhiệm CLB Đại sứ Sinh viên (iSSAC)
                        </span>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-100 text-[#1657c1] text-[10px] font-black uppercase tracking-wide">
                          <ShieldCheck className="w-3 h-3" />
                          Chính thức
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Người nhận: <strong className="text-slate-800">{profile?.full_name || 'Ứng viên'}</strong> · Ban Tuyển quân Gen 3
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 bg-white border border-slate-200 px-2.5 py-1 rounded-lg shadow-2xs">
                      <Clock className="w-3 h-3 text-slate-400" />
                      {createdStr ? `Gửi lúc: ${createdStr}` : 'Hôm nay'}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg">
                      <CheckCheck className="w-3.5 h-3.5" />
                      Đã nhận
                    </span>
                  </div>
                </div>

                {/* Message Content: Thân tin nhắn dạng box công văn / thư thông báo */}
                <div className="p-5 sm:p-7 space-y-4">
                  <div className="border-l-4 border-[#1657c1] pl-3.5 space-y-1">
                    <h3 className="text-base sm:text-lg font-black text-slate-900 leading-snug">
                      Thông báo tiếp nhận tài khoản & Hướng dẫn hoàn thiện hồ sơ Vòng 1
                    </h3>
                    <p className="text-xs text-slate-500 font-medium">
                      Mã văn bản điện tử: <span className="font-mono font-bold text-[#1657c1]">TB-ISSAC-2026/GEN3-01</span>
                    </p>
                  </div>

                  <div className="text-xs sm:text-sm text-slate-700 leading-relaxed space-y-2.5 text-justify">
                    <p>
                      Thân gửi bạn <strong>{profile?.full_name || 'ứng viên'}</strong>,
                    </p>
                    <p>
                      Ban Chủ nhiệm và Ban Tuyển quân Câu lạc bộ Đại sứ Sinh viên (iSSAC) - Trường Quốc tế, Đại học Quốc gia Hà Nội nhiệt liệt chào đón bạn đã đăng ký tham gia kỳ tuyển chọn Đại sứ Sinh viên Gen 3 (nhiệm kỳ 2026 - 2027).
                    </p>
                    <p>
                      Nhằm đảm bảo tiến độ xét duyệt tập trung và tính minh bạch công bằng cho toàn bộ thí sinh, bạn vui lòng hoàn thành <strong>Hồ sơ cá nhân</strong> và gửi <strong>Đơn ứng tuyển Vòng 1 trong thời hạn 3 ngày</strong> kể từ khi mở tài khoản. Sau thời hạn quy định, hệ thống sẽ tự động khóa quyền nộp đơn để Hội đồng tuyển chọn bước vào giai đoạn đánh giá.
                    </p>
                    <p>
                      Chúc bạn có một hành trình ứng tuyển tràn đầy năng lượng và thể hiện xuất sắc bản lĩnh của một Đại sứ Sinh viên!
                    </p>
                  </div>

                  {/* Chi tiết hạn chót & Nút hành động xem/điền đơn */}
                  <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-800">
                        <CalendarDays className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>Hạn chót nộp đơn:</span>
                        <span className="text-[#1657c1] font-black">{deadlineStr || '3 ngày kể từ khi đăng ký'}</span>
                      </div>
                      <p className="text-xs text-slate-500">
                        Thời gian còn lại: <strong className="text-rose-600 font-bold">{remainingStr || 'Đang cập nhật'}</strong>
                      </p>
                    </div>

                    <Link
                      href="/member/application"
                      className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-[#1657c1] hover:bg-blue-800 text-white font-bold text-xs shadow-xs transition-all shrink-0 cursor-pointer self-start sm:self-auto"
                    >
                      <span>Vào xem & Điền đơn ngay</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>

                {/* Message Footer */}
                <div className="px-5 sm:px-7 py-3 bg-slate-50/80 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-500">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                    <span>Tin nhắn chính thức từ Ban Tuyển quân iSSAC Gen 3</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
                    <span>Hòm thư cá nhân · Lưu trữ tự động</span>
                  </div>
                </div>
              </div>
            )
          })() : (
            <div className="space-y-3">
              {adminWarnings.map((msg, idx) => (
                <div
                  key={msg.id}
                  className="border-2 border-rose-200 bg-white rounded-2xl shadow-xs overflow-hidden transition-all"
                >
                  {/* Sender header */}
                  <div className="p-4 bg-rose-50/60 border-b border-rose-100 flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-rose-100 flex items-center justify-center text-rose-600 shrink-0">
                        <AlertTriangle className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs sm:text-sm font-black text-slate-900">
                            {msg.sender_name || 'Ban Chủ nhiệm CLB iSSAC'}
                          </span>
                          <span className="text-[10px] font-black bg-rose-100 text-rose-700 border border-rose-200 px-2 py-0.5 rounded-md uppercase">
                            Thông báo từ CLB
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-[11px] text-slate-400">
                      <Clock className="w-3 h-3" />
                      {formatTime(msg.created_at)}
                    </div>
                  </div>

                  {/* Body */}
                  <div className="p-5 space-y-3">
                    <div className="text-sm text-slate-800 leading-relaxed whitespace-pre-wrap text-justify">
                      {msg.content}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-emerald-700 pt-2 border-t border-slate-100">
                      <CheckCheck className="w-4 h-4" />
                      <span className="font-medium">Đã ghi nhận vào hòm thư ứng viên</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>


      {/* ── CARD 2: 3 STATS ───────────────────────────────── */}
      <div className="grid grid-cols-3 gap-3">
        {/* Tổng thông báo */}
        <div className="bg-white border-2 border-slate-200/90 rounded-2xl p-4 sm:p-5 text-center shadow-xs">
          <div className="text-3xl font-black text-slate-900 leading-none mb-2">
            {adminWarnings.length > 0 ? adminWarnings.length : 1}
          </div>
          <div className="text-[11px] sm:text-xs font-semibold text-slate-500">Tổng thông báo</div>
        </div>

        {/* Từ CLB */}
        <div className="bg-white border-2 border-blue-200 rounded-2xl p-4 sm:p-5 text-center shadow-xs">
          <div className="text-3xl font-black text-[#1657c1] leading-none mb-2">
            {adminWarnings.length > 0 ? adminWarnings.length : 1}
          </div>
          <div className="text-[11px] sm:text-xs font-semibold text-slate-500">Từ CLB</div>
        </div>

        {/* Không vi phạm / Đã vi phạm */}
        <div className="bg-white border-2 border-emerald-300 rounded-2xl p-4 sm:p-5 text-center shadow-xs">
          {adminWarnings.length === 0 ? (
            <>
              <div className="flex items-center justify-center mb-2">
                <Check className="w-8 h-8 text-emerald-600 stroke-[3]" />
              </div>
              <div className="text-[11px] sm:text-xs font-semibold text-slate-500">Không vi phạm</div>
            </>
          ) : (
            <>
              <div className="text-3xl font-black text-rose-600 leading-none mb-2">{adminWarnings.length}</div>
              <div className="text-[11px] sm:text-xs font-semibold text-slate-500">Đã ghi nhận</div>
            </>
          )}
        </div>
      </div>


      {/* ── CARD 3: KẾT NỐI VỚI ISSAC ───────────────────── */}
      <div className="bg-white border-2 border-amber-300 rounded-2xl p-5 sm:p-6 space-y-4">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-400 text-slate-900 text-[11px] font-black uppercase tracking-wider shrink-0">
            KẾT NỐI VỚI ISSAC
          </span>
          <a
            href="https://www.facebook.com/ambassadorsClub.VNUIS"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-bold text-amber-600 hover:underline shrink-0"
          >
            Theo dõi ngay
          </a>
        </div>

        <p className="text-sm font-bold text-slate-800 leading-snug">
          Theo dõi các kênh mạng xã hội chính thức để cập nhật thông tin mới nhất về CLB, sự kiện và cơ hội dành cho bạn!
        </p>

        {/* Social links */}
        <div className="space-y-2.5">
          {socialLinks.map((s) => (
            <div key={s.name} className="flex items-center justify-between gap-3 py-1">
              <div className="flex items-center gap-3 min-w-0">
                <div className={`w-9 h-9 rounded-xl ${s.iconBg} flex items-center justify-center shrink-0`}>
                  {s.icon}
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-black text-slate-900">{s.name}</div>
                  <div className="text-xs text-slate-500">{s.handle}</div>
                </div>
              </div>
              <a
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`shrink-0 px-4 py-2 rounded-lg text-xs font-bold transition-all ${s.btnClass}`}
              >
                Truy cập ngay
              </a>
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}
