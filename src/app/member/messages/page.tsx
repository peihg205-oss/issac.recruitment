'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  AlertTriangle, Loader2, CheckCheck, Clock,
  ShieldAlert, ShieldCheck, Info, RefreshCw,
  ExternalLink, Mail, MessageCircle
} from 'lucide-react'
import {
  ChatMessage,
  fetchApplicationMessages,
  markChatAsRead,
} from '@/lib/messages-manager'

export default function MemberWarningsPage() {
  const supabase = createClient()
  const scrollRef = useRef<HTMLDivElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const [warnings, setWarnings] = useState<ChatMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [application, setApplication] = useState<any>(null)

  const scrollToBottom = useCallback((instant = false) => {
    setTimeout(() => {
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: instant ? 'auto' : 'smooth', block: 'end' })
      } else if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight
      }
    }, 50)
  }, [])

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

      // Conversation key is application.id if submitted, otherwise authUser.id for fresh accounts
      const convKey = app?.id || authUser.id
      const msgs = await fetchApplicationMessages(supabase, convKey, authUser.id)
      setWarnings(msgs)
      await markChatAsRead(supabase, convKey, 'member', authUser.id)
    } catch (err) {
      console.error('Error fetching warnings:', err)
    } finally {
      setLoading(false)
      setRefreshing(false)
      scrollToBottom(true)
    }
  }, [supabase, scrollToBottom])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Scroll to bottom when new warnings arrive
  useEffect(() => {
    scrollToBottom(false)
  }, [warnings.length, scrollToBottom])

  // Periodic polling to guarantee sync
  useEffect(() => {
    if (!user?.id) return
    const convKey = application?.id || user.id
    const interval = setInterval(async () => {
      try {
        const msgs = await fetchApplicationMessages(supabase, convKey, user.id)
        setWarnings(prev => {
          if (msgs.length !== prev.length || JSON.stringify(msgs) !== JSON.stringify(prev)) {
            return msgs
          }
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
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'audit_logs',
      }, async (payload: any) => {
        if (payload?.new?.action !== 'CHAT_MESSAGE') return
        const target = payload?.new?.target_id || payload?.new?.metadata?.conversation_id || payload?.new?.metadata?.candidate_user_id
        if (target === convKey || target === user.id) {
          const msgs = await fetchApplicationMessages(supabase, convKey, user.id)
          setWarnings(msgs)
          scrollToBottom()
        }
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'messages',
      }, async (payload: any) => {
        if (payload?.new?.application_id === convKey || payload?.new?.application_id === user.id) {
          const msgs = await fetchApplicationMessages(supabase, convKey, user.id)
          setWarnings(msgs)
          scrollToBottom()
        }
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [application?.id, user?.id, supabase, scrollToBottom])

  const formatTime = (dateStr: string) => {
    try {
      const d = new Date(dateStr)
      const now = new Date()
      const isToday = d.toDateString() === now.toDateString()
      const yesterday = new Date(now)
      yesterday.setDate(yesterday.getDate() - 1)
      const isYesterday = d.toDateString() === yesterday.toDateString()

      const time = d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false })

      if (isToday) return time
      if (isYesterday) return `Hôm qua ${time}`
      return `${d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })} ${time}`
    } catch {
      return ''
    }
  }

  // Filter only warnings sent by Admin (or past messages)
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
    <div className="flex flex-col h-[calc(100vh-8.5rem)] max-w-3xl mx-auto bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 px-5 py-3.5 bg-gradient-to-r from-red-950 via-slate-900 to-indigo-950 text-white shrink-0 z-10">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center shadow-xs shrink-0">
            <AlertTriangle className="w-5 h-5 text-amber-400 animate-bounce" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-base font-black text-white truncate uppercase tracking-tight">Cảnh báo của Ban Chủ nhiệm iSSAC</h1>
              <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-black bg-rose-500/30 text-rose-300 border border-rose-400/40 rounded-full">
                Kênh 1 chiều (Chỉ đọc)
              </span>
            </div>
            <p className="text-xs text-slate-300 font-medium truncate">
              {application?.departments?.name
                ? `Ban ${application.departments.name} • Thông báo cảnh báo & nhắc nhở từ Ban Chủ nhiệm CLB iSSAC`
                : 'Ứng viên Gen 3 • Thông báo cảnh báo & nhắc nhở từ Ban Chủ nhiệm CLB iSSAC'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
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

      {/* Notice Banner explaining read-only policy */}
      <div className="flex items-start gap-2.5 px-4 py-2.5 bg-rose-50 border-b border-rose-200 text-xs text-rose-950 shrink-0 z-10">
        <ShieldAlert className="w-4 h-4 text-rose-700 shrink-0 mt-0.5" />
        <span className="leading-snug">
          <strong>LƯU Ý QUAN TRỌNG:</strong> Đây là kênh phát thông báo cảnh báo chính thức từ <strong>Ban Chủ nhiệm CLB iSSAC</strong>. Ứng viên <strong>chỉ có quyền đọc</strong> và <strong>hoàn toàn không có quyền phản hồi</strong> qua kênh này.
        </span>
      </div>

      {/* Warnings Scroll Area */}
      <div
        ref={scrollRef}
        className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-5 space-y-4 bg-slate-50/50 overscroll-contain"
      >
        {adminWarnings.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-12 space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-bold text-slate-800">Không có cảnh báo nào</p>
              <p className="text-xs text-slate-500 max-w-sm leading-relaxed">
                Hiện tại bạn không có thông báo nhắc nhở hoặc cảnh báo vi phạm nào từ Ban Chủ nhiệm CLB iSSAC. Hồ sơ và tiến trình ứng tuyển của bạn đang diễn ra bình thường!
              </p>
            </div>
          </div>
        ) : (
          adminWarnings.map((msg) => (
            <div
              key={msg.id}
              className="rounded-2xl border-2 border-rose-200/90 bg-white p-4 sm:p-5 shadow-xs space-y-2.5 animate-fade-in"
            >
              {/* Header: Sender & Badge & Time */}
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-rose-100 flex items-center justify-center text-rose-700 shrink-0">
                    <AlertTriangle className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-black text-slate-900">
                        {msg.sender_name || 'Ban Chủ nhiệm CLB iSSAC'}
                      </span>
                      <span className="text-[10px] font-black bg-rose-100 text-rose-800 border border-rose-200 px-2 py-0.5 rounded-md uppercase">
                        Cảnh báo BCN
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-medium">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{formatTime(msg.created_at)}</span>
                </div>
              </div>

              {/* Warning Content */}
              <div className="p-3.5 rounded-xl bg-amber-50/50 border border-amber-100 text-sm text-slate-800 leading-relaxed whitespace-pre-wrap break-words">
                {msg.content}
              </div>

              {/* Footer status */}
              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                <span className="inline-flex items-center gap-1 text-emerald-700 font-medium">
                  <CheckCheck className="w-3.5 h-3.5 text-emerald-600" /> Đã ghi nhận gửi tới bạn
                </span>
                <span className="text-[10px] text-slate-400 italic">
                  Thông báo chỉ đọc
                </span>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} className="h-1 shrink-0" />
      </div>

      {/* Readonly Footer with Contact Info (Replaces Input Box) */}
      <div className="border-t border-slate-200 bg-white p-4 sm:p-5 shrink-0 z-10 shadow-2xs">
        <div className="rounded-2xl bg-slate-50 border border-slate-200/80 p-3.5 sm:p-4 text-xs space-y-2.5">
          <div className="flex items-center gap-2 text-slate-800 font-bold">
            <Info className="w-4 h-4 text-blue-600 shrink-0" />
            <span>Bạn cần giải đáp thắc mắc hoặc hỗ trợ thêm?</span>
          </div>
          <p className="text-slate-600 leading-relaxed text-[11px]">
            Hệ thống Cổng Tuyển quân không hỗ trợ gửi phản hồi trực tiếp tại mục Cảnh báo. Nếu bạn có bất kỳ câu hỏi nào về nội dung cảnh báo hoặc cần hỗ trợ về hồ sơ, vui lòng liên hệ trực tiếp qua các kênh chính thức:
          </p>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            <a
              href="https://facebook.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-[11px] shadow-2xs transition-all"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>Fanpage CLB iSSAC</span>
              <ExternalLink className="w-3 h-3 ml-0.5 opacity-80" />
            </a>

            <a
              href="mailto:bcn.issac@gmail.com"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold text-[11px] transition-all"
            >
              <Mail className="w-3.5 h-3.5" />
              <span>bcn.issac@gmail.com</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
