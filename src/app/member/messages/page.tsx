'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/components/ui/use-toast'
import {
  MessageSquare, Send, Loader2, CheckCheck, Clock,
  Sparkles, ShieldCheck, Info, RefreshCw
} from 'lucide-react'
import {
  ChatMessage,
  fetchApplicationMessages,
  sendChatMessage,
  markChatAsRead,
} from '@/lib/messages-manager'

export default function MemberMessagesPage() {
  const supabase = createClient()
  const { toast } = useToast()
  const scrollRef = useRef<HTMLDivElement>(null)

  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [sending, setSending] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [application, setApplication] = useState<any>(null)
  const [hasApp, setHasApp] = useState<boolean | null>(null)

  const scrollToBottom = useCallback((instant = false) => {
    setTimeout(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTo({
          top: scrollRef.current.scrollHeight,
          behavior: instant ? 'auto' : 'smooth',
        })
      }
    }, 100)
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
      setHasApp(!!app)

      if (app?.id) {
        const msgs = await fetchApplicationMessages(supabase, app.id)
        setMessages(msgs)
        // Mark admin messages as read
        await markChatAsRead(supabase, app.id, 'member')
      }
    } catch (err) {
      console.error('Error fetching messages:', err)
    } finally {
      setLoading(false)
      setRefreshing(false)
      if (!isSilent) scrollToBottom(true)
    }
  }, [supabase, scrollToBottom])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Periodic polling to guarantee sync between mobile phones & laptops
  useEffect(() => {
    if (!application?.id) return
    const interval = setInterval(async () => {
      try {
        const msgs = await fetchApplicationMessages(supabase, application.id)
        setMessages(prev => {
          if (msgs.length !== prev.length || JSON.stringify(msgs) !== JSON.stringify(prev)) {
            return msgs
          }
          return prev
        })
      } catch {}
    }, 3500)
    return () => clearInterval(interval)
  }, [application?.id, supabase])

  // Realtime subscription
  useEffect(() => {
    if (!application?.id) return

    const channel = supabase
      .channel(`member-messages-${application.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'audit_logs',
        filter: `target_id=eq.${application.id}`,
      }, async () => {
        const msgs = await fetchApplicationMessages(supabase, application.id)
        setMessages(msgs)
        scrollToBottom()
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'messages',
        filter: `application_id=eq.${application.id}`,
      }, async () => {
        const msgs = await fetchApplicationMessages(supabase, application.id)
        setMessages(msgs)
        scrollToBottom()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [application?.id, supabase, scrollToBottom])

  const handleSend = async () => {
    const trimmed = newMessage.trim()
    if (!trimmed || !user || !application?.id) return
    setSending(true)

    // Optimistic message update
    const tempId = `tmp_${Date.now()}`
    const senderName = profile?.full_name || user.user_metadata?.full_name || 'Ứng viên'
    const optimisticMsg: ChatMessage = {
      id: tempId,
      application_id: application.id,
      sender_id: user.id,
      sender_role: 'member',
      sender_name: senderName,
      content: trimmed,
      is_read: false,
      created_at: new Date().toISOString(),
    }

    setMessages(prev => [...prev, optimisticMsg])
    setNewMessage('')
    scrollToBottom()

    try {
      const savedMsg = await sendChatMessage(supabase, {
        application_id: application.id,
        sender_id: user.id,
        sender_role: 'member',
        sender_name: senderName,
        content: trimmed,
      })

      // Replace optimistic message with actual saved message
      setMessages(prev => prev.map(m => m.id === tempId ? savedMsg : m))
      scrollToBottom()
    } catch (err: any) {
      toast({
        title: 'Không thể gửi tin nhắn',
        description: err?.message || 'Vui lòng thử lại sau.',
        variant: 'destructive',
      })
      // Revert optimistic on error
      setMessages(prev => prev.filter(m => m.id !== tempId))
    } finally {
      setSending(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-[#1657c1] mx-auto" />
          <p className="text-sm text-slate-500 font-medium">Đang tải tin nhắn...</p>
        </div>
      </div>
    )
  }

  if (!hasApp) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4 max-w-md mx-auto p-6 bg-white rounded-3xl border border-slate-200 shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center mx-auto text-[#1657c1]">
            <MessageSquare className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Chat với Ban Tuyển quân</h2>
          <p className="text-sm text-slate-500 leading-relaxed">
            Bạn cần nộp đơn ứng tuyển trước khi có thể trao đổi trực tiếp với Ban Tuyển quân & Ban Chủ nhiệm iSSAC.
          </p>
          <a
            href="/member/application"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#1657c1] text-white font-bold text-sm hover:bg-[#1147a3] transition-all shadow-sm"
          >
            <Sparkles className="w-4 h-4" /> Ứng tuyển ngay
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8.5rem)] max-w-3xl mx-auto bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 px-5 py-3.5 bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 text-white shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center shadow-xs shrink-0">
            <MessageSquare className="w-5 h-5 text-amber-300" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-white truncate">Ban Tuyển quân & BCN iSSAC</h1>
              <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30 rounded-full">
                Kênh chính thức
              </span>
            </div>
            <p className="text-xs text-blue-200 font-medium truncate">
              {application?.departments?.name ? `Ban ${application.departments.name} • ` : ''}Giải đáp thắc mắc tuyển quân
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => loadData(true)}
            disabled={refreshing}
            title="Làm mới tin nhắn"
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-semibold">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="hidden sm:inline">Trực tuyến</span>
          </div>
        </div>
      </div>

      {/* Notice Banner */}
      <div className="flex items-start gap-2.5 px-4 py-2.5 bg-amber-50/80 border-b border-amber-200/60 text-xs text-amber-900 shrink-0">
        <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <span className="leading-snug">
          Bạn có thể đặt câu hỏi về tiến độ duyệt đơn, lịch phỏng vấn hoặc thắc mắc chuyên môn. Ban Chủ nhiệm sẽ phản hồi sớm nhất!
        </span>
      </div>

      {/* Messages Scroll Area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5 bg-slate-50/50">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-12 space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-200/80 flex items-center justify-center text-[#1657c1]">
              <MessageSquare className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-bold text-slate-800">Chưa có tin nhắn nào</p>
              <p className="text-xs text-slate-500 max-w-xs">
                Hãy gửi tin nhắn đầu tiên để kết nối trực tiếp với Ban Chủ nhiệm iSSAC!
              </p>
            </div>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.sender_role === 'member'
            return (
              <div
                key={msg.id}
                className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
              >
                <div className="max-w-[85%] sm:max-w-[75%]">
                  {/* Sender Label */}
                  {!isMe && (
                    <div className="flex items-center gap-1.5 mb-1 px-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                      <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">
                        {msg.sender_name || 'Ban Chủ nhiệm iSSAC'}
                      </span>
                    </div>
                  )}

                  {/* Message Bubble */}
                  <div
                    className={`px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap break-words shadow-2xs ${
                      isMe
                        ? 'bg-[#1657c1] text-white rounded-br-xs'
                        : 'bg-white border border-slate-200/80 text-slate-800 rounded-bl-xs'
                    }`}
                  >
                    {msg.content}
                  </div>

                  {/* Timestamp & Read Status */}
                  <div className={`flex items-center gap-1.5 mt-1 px-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <span className="text-[10px] text-slate-400 font-medium">
                      {formatTime(msg.created_at)}
                    </span>
                    {isMe && (
                      msg.is_read ? (
                        <span className="inline-flex items-center gap-0.5 text-[10px] text-blue-600 font-semibold">
                          <CheckCheck className="w-3.5 h-3.5 text-blue-600" /> Đã xem
                        </span>
                      ) : (
                        <Clock className="w-3 h-3 text-slate-300" />
                      )
                    )}
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Input Area */}
      <div className="border-t border-slate-200 bg-white p-3 sm:p-4 shrink-0">
        <div className="flex items-end gap-2.5">
          <div className="flex-1 relative">
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Nhập câu hỏi hoặc trao đổi với Ban Tuyển quân..."
              rows={1}
              className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-[#1657c1] focus:bg-white transition-all max-h-32 leading-relaxed"
              style={{ minHeight: '44px' }}
              onInput={(e) => {
                const t = e.currentTarget
                t.style.height = 'auto'
                t.style.height = Math.min(t.scrollHeight, 128) + 'px'
              }}
            />
          </div>
          <button
            onClick={handleSend}
            disabled={!newMessage.trim() || sending}
            className="w-11 h-11 rounded-2xl bg-[#1657c1] hover:bg-[#1147a3] disabled:bg-slate-200 text-white disabled:text-slate-400 flex items-center justify-center transition-all shadow-sm shrink-0 cursor-pointer disabled:cursor-not-allowed"
            title="Gửi tin nhắn"
          >
            {sending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>
        <p className="text-[10px] text-slate-400 font-medium text-center mt-2">
          Nhấn Enter để gửi • Shift+Enter để xuống dòng
        </p>
      </div>
    </div>
  )
}
