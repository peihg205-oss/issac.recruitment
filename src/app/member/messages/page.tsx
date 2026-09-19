'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  AlertTriangle, Loader2, CheckCheck, Clock,
  ShieldCheck, RefreshCw, Mail, MessageCircle,
  ExternalLink, ShieldAlert, Info, BellRing
} from 'lucide-react'
import {
  ChatMessage,
  fetchApplicationMessages,
  markChatAsRead,
} from '@/lib/messages-manager'
import Link from 'next/link'
import Image from 'next/image'

export default function MemberWarningsPage() {
  const supabase = createClient()
  const scrollRef = useRef<HTMLDivElement>(null)

  const [warnings, setWarnings] = useState<ChatMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [application, setApplication] = useState<any>(null)

  const loadData = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true)
    else setRefreshing(true)

    try {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) {
        setLoading(false)
        setRefreshing(false)
        return
      }
      setUser(authUser)

      const [{ data: prof }, { data: app }] = await Promise.all([
        supabase.from('profiles').select('full_name, email, student_id').eq('id', authUser.id).maybeSingle(),
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

  useEffect(() => {
    loadData()
  }, [loadData])

  // Periodic polling
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

  // Realtime subscription
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

  return (
    <div className="max-w-3xl mx-auto space-y-5">

      {/* ── HERO HEADER ─────────────────────────────────────── */}
      <div className="bg-white border-2 border-slate-200/80 rounded-3xl overflow-hidden shadow-sm">
        {/* Top gradient banner */}
        <div className="bg-gradient-to-r from-rose-900 via-slate-900 to-indigo-900 p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-2xl bg-amber-400/20 border border-amber-400/40 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5.5 h-5.5 text-amber-400 animate-bounce" />
            </div>
            <div className="min-w-0">
              <h1 className="text-base sm:text-lg font-black text-white uppercase tracking-tight leading-tight">
                Cảnh báo của Ban Chủ nhiệm iSSAC
              </h1>
              <p className="text-xs text-slate-300 font-medium mt-0.5 truncate">
                {application?.departments?.name
                  ? `Ban ${application.departments.name} · Thông báo 1 chiều từ BCN CLB iSSAC`
                  : 'Ứng viên Gen 3 · Thông báo 1 chiều từ BCN CLB iSSAC'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black bg-rose-500/30 text-rose-300 border border-rose-400/40">
              <ShieldAlert className="w-3.5 h-3.5" />
              Kênh chỉ đọc
            </span>
            <button
              onClick={() => loadData(true)}
              disabled={refreshing}
              title="Làm mới cảnh báo"
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Read-only notice row */}
        <div className="flex items-start gap-2.5 px-5 py-3 bg-rose-50 border-b border-rose-200 text-xs text-rose-900">
          <Info className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <span className="leading-snug">
            <strong>LƯU Ý:</strong> Đây là kênh phát cảnh báo chính thức từ <strong>Ban Chủ nhiệm CLB iSSAC</strong>. Ứng viên <strong>chỉ có quyền đọc</strong> — không có quyền phản hồi qua kênh này.
          </span>
        </div>
      </div>

      {/* ── STATS ROW ────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white border-2 border-slate-200/80 rounded-2xl p-4 text-center shadow-xs">
          <div className="text-2xl font-black text-slate-900">{adminWarnings.length}</div>
          <div className="text-[11px] font-semibold text-slate-500 mt-0.5">Tổng cảnh báo</div>
        </div>
        <div className="bg-white border-2 border-rose-200 rounded-2xl p-4 text-center shadow-xs">
          <div className="text-2xl font-black text-rose-700">
            {adminWarnings.length}
          </div>
          <div className="text-[11px] font-semibold text-slate-500 mt-0.5">Từ BCN iSSAC</div>
        </div>
        <div className="bg-white border-2 border-emerald-200 rounded-2xl p-4 text-center shadow-xs">
          <div className="text-2xl font-black text-emerald-700">
            {adminWarnings.length === 0 ? '✓' : adminWarnings.length}
          </div>
          <div className="text-[11px] font-semibold text-slate-500 mt-0.5">
            {adminWarnings.length === 0 ? 'Không vi phạm' : 'Đã ghi nhận'}
          </div>
        </div>
      </div>

      {/* ── WARNINGS LIST ────────────────────────────────────── */}
      {adminWarnings.length === 0 ? (
        /* Empty state */
        <div className="bg-white border-2 border-slate-200/80 rounded-3xl overflow-hidden shadow-sm">
          <div className="bg-gradient-to-r from-emerald-700 to-[#0d3b82] p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="text-[11px] uppercase tracking-widest text-emerald-200 font-bold flex items-center gap-1.5 mb-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
                Tình trạng hồ sơ
              </div>
              <div className="text-lg sm:text-xl font-black text-white">Hồ sơ đang diễn ra bình thường</div>
            </div>
            <span className="inline-block px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-emerald-400 text-emerald-950 self-start sm:self-auto shadow-sm">
              Không có cảnh báo
            </span>
          </div>

          <div className="p-6 sm:p-8 flex flex-col sm:flex-row items-center gap-6">
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 border-2 border-emerald-200 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-8 h-8 text-emerald-600" />
            </div>
            <div className="space-y-2 text-center sm:text-left">
              <p className="text-sm font-bold text-slate-800">Chúc mừng — bạn chưa nhận cảnh báo nào!</p>
              <p className="text-xs text-slate-500 leading-relaxed max-w-md">
                Hiện tại bạn không có thông báo nhắc nhở hoặc cảnh báo vi phạm nào từ Ban Chủ nhiệm CLB iSSAC. Hồ sơ và tiến trình ứng tuyển của bạn đang diễn ra hoàn toàn bình thường!
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-3.5" ref={scrollRef}>
          {adminWarnings.map((msg, idx) => (
            <div
              key={msg.id}
              className="bg-white border-2 border-rose-200/90 rounded-3xl overflow-hidden shadow-sm"
            >
              {/* Card header */}
              <div className="bg-gradient-to-r from-rose-800 to-slate-900 px-5 py-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-amber-400/20 border border-amber-400/40 flex items-center justify-center shrink-0">
                    <AlertTriangle className="w-4.5 h-4.5 text-amber-400" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-black text-white truncate">
                        {msg.sender_name || 'Ban Chủ nhiệm CLB iSSAC'}
                      </span>
                      <span className="text-[10px] font-black bg-rose-500/40 text-rose-200 border border-rose-400/40 px-2 py-0.5 rounded-md uppercase shrink-0">
                        Cảnh báo BCN
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 font-medium flex items-center gap-1 mt-0.5">
                      <Clock className="w-3 h-3" />
                      {formatTime(msg.created_at)}
                    </div>
                  </div>
                </div>
                <span className="text-xs font-black text-slate-400 shrink-0">#{String(idx + 1).padStart(2, '0')}</span>
              </div>

              {/* Warning content */}
              <div className="p-5 sm:p-6 space-y-4">
                <div className="rounded-2xl bg-amber-50/70 border border-amber-200 p-4 text-sm text-slate-800 leading-relaxed whitespace-pre-wrap break-words">
                  {msg.content}
                </div>

                {/* Footer status row */}
                <div className="flex items-center justify-between text-[11px] pt-1">
                  <span className="inline-flex items-center gap-1.5 text-emerald-700 font-semibold">
                    <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
                    Đã ghi nhận gửi tới bạn
                  </span>
                  <span className="text-[10px] text-slate-400 italic font-medium">
                    Thông báo chỉ đọc · Không thể phản hồi
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── CONTACT PANEL ────────────────────────────────────── */}
      <div className="bg-white border-2 border-slate-200/80 rounded-3xl overflow-hidden shadow-sm">
        {/* Panel header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center shrink-0">
            <BellRing className="w-4 h-4 text-[#1657c1]" />
          </div>
          <div>
            <div className="text-sm font-black text-slate-900">Bạn cần hỗ trợ hoặc giải đáp thắc mắc?</div>
            <div className="text-[11px] text-slate-500 font-medium">Liên hệ trực tiếp qua các kênh chính thức bên dưới</div>
          </div>
        </div>

        {/* Panel body */}
        <div className="p-5 sm:p-6 space-y-4">
          <p className="text-xs text-slate-600 leading-relaxed">
            Hệ thống Cổng Tuyển quân không hỗ trợ gửi phản hồi trực tiếp tại mục Cảnh báo. Nếu bạn có câu hỏi về nội dung cảnh báo hoặc cần hỗ trợ về hồ sơ, vui lòng liên hệ qua:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <a
              href="https://www.facebook.com/issac.vnuis"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-3.5 rounded-2xl bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-all group"
            >
              <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center shrink-0 shadow-sm">
                <MessageCircle className="w-4.5 h-4.5 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-black text-slate-900 group-hover:text-blue-700 transition-colors">Fanpage CLB iSSAC</div>
                <div className="text-[11px] text-slate-500 truncate">facebook.com/issac.vnuis</div>
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-blue-500 shrink-0" />
            </a>

            <a
              href="mailto:ambassadors.club@vnuis.edu.vn"
              className="flex items-center gap-3 p-3.5 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-all group"
            >
              <div className="w-9 h-9 rounded-xl bg-slate-700 flex items-center justify-center shrink-0 shadow-sm">
                <Mail className="w-4.5 h-4.5 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-black text-slate-900 group-hover:text-slate-700 transition-colors">Email BCN iSSAC</div>
                <div className="text-[11px] text-slate-500 truncate">ambassadors.club@vnuis.edu.vn</div>
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            </a>
          </div>

          <div className="rounded-2xl border-l-4 border-amber-400 bg-amber-50/70 p-4 text-xs text-amber-950 space-y-1">
            <div className="font-bold">Lưu ý từ Ban Tuyển quân:</div>
            <p className="text-amber-900 leading-relaxed font-medium">
              Kênh cảnh báo này chỉ được sử dụng để Ban Chủ nhiệm gửi thông báo chính thức về vi phạm, nhắc nhở hoặc cảnh báo đến ứng viên. Vui lòng đọc kỹ và thực hiện theo hướng dẫn trong từng thông báo.
            </p>
          </div>
        </div>
      </div>

      {/* Back to dashboard */}
      <div className="flex justify-start pb-2">
        <Link
          href="/member/dashboard"
          className="px-4 py-2 rounded-xl border-2 border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-xs transition-all"
        >
          ← Về Tổng quan
        </Link>
      </div>
    </div>
  )
}
