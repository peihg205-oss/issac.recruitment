'use client'

import { useState, useEffect, useCallback, useRef, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/components/ui/use-toast'
import { Input } from '@/components/ui/input'
import {
  MessageSquare, Send, Loader2, CheckCheck, Clock,
  ShieldCheck, Users, Search, ArrowLeft, Inbox,
  RefreshCw, Sparkles, Phone, Mail, GraduationCap
} from 'lucide-react'
import {
  ChatMessage,
  ConversationSummary,
  fetchAllConversations,
  fetchApplicationMessages,
  sendChatMessage,
  markChatAsRead,
} from '@/lib/messages-manager'

function AdminMessagesContent() {
  const supabase = createClient()
  const { toast } = useToast()
  const searchParams = useSearchParams()
  const initialAppId = searchParams.get('appId')
  const scrollRef = useRef<HTMLDivElement>(null)

  const [conversations, setConversations] = useState<ConversationSummary[]>([])
  const [activeConv, setActiveConv] = useState<string | null>(initialAppId)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [sending, setSending] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterMode, setFilterMode] = useState<'all' | 'unread'>('all')
  const [adminUser, setAdminUser] = useState<any>(null)
  const [adminProfile, setAdminProfile] = useState<any>(null)
  const [showMobileList, setShowMobileList] = useState(true)

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

  // Load admin user & all conversation summaries
  const loadConversations = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true)
    else setRefreshing(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setAdminUser(user)
        const { data: prof } = await supabase.from('profiles').select('full_name, admin_role').eq('id', user.id).maybeSingle()
        setAdminProfile(prof)
      }

      const list = await fetchAllConversations(supabase)
      setConversations(list)

      // If initialAppId provided and activeConv not set yet
      if (initialAppId && !activeConv) {
        setActiveConv(initialAppId)
        setShowMobileList(false)
      } else if (!activeConv && list.length > 0) {
        // Auto-select first conversation with messages on desktop
        const firstWithMsgs = list.find(c => c.total_messages > 0) || list[0]
        if (firstWithMsgs && typeof window !== 'undefined' && window.innerWidth >= 768) {
          setActiveConv(firstWithMsgs.application_id)
        }
      }
    } catch (err) {
      console.error('Error fetching conversations:', err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [supabase, initialAppId, activeConv])

  useEffect(() => {
    loadConversations()
  }, [loadConversations])

  // Fetch messages for active conversation
  const loadMessages = useCallback(async (appId: string, isSilent = false) => {
    try {
      const msgs = await fetchApplicationMessages(supabase, appId)
      setMessages(msgs)
      await markChatAsRead(supabase, appId, 'admin')

      // Update local unread badge
      setConversations(prev => prev.map(c =>
        c.application_id === appId ? { ...c, unread_count: 0 } : c
      ))

      if (!isSilent) scrollToBottom(true)
    } catch (err) {
      console.error('Error fetching messages for app:', err)
    }
  }, [supabase, scrollToBottom])

  useEffect(() => {
    if (activeConv) {
      loadMessages(activeConv)
    }
  }, [activeConv, loadMessages])

  // Periodic polling for realtime synchronization across phone & laptop
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const list = await fetchAllConversations(supabase)
        setConversations(list)

        if (activeConv) {
          const msgs = await fetchApplicationMessages(supabase, activeConv)
          setMessages(prev => {
            if (msgs.length !== prev.length || JSON.stringify(msgs) !== JSON.stringify(prev)) {
              return msgs
            }
            return prev
          })
        }
      } catch {}
    }, 4000)

    return () => clearInterval(interval)
  }, [activeConv, supabase])

  // Realtime listener
  useEffect(() => {
    const channel = supabase
      .channel('admin-chat-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'audit_logs' }, async (payload: any) => {
        if (payload?.new?.action === 'CHAT_MESSAGE' || payload?.new?.action === 'CHAT_READ') {
          const list = await fetchAllConversations(supabase)
          setConversations(list)
          if (activeConv && (payload?.new?.target_id === activeConv || payload?.new?.metadata?.application_id === activeConv)) {
            const msgs = await fetchApplicationMessages(supabase, activeConv)
            setMessages(msgs)
            scrollToBottom()
          }
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, async (payload: any) => {
        const list = await fetchAllConversations(supabase)
        setConversations(list)
        if (activeConv && payload?.new?.application_id === activeConv) {
          const msgs = await fetchApplicationMessages(supabase, activeConv)
          setMessages(msgs)
          scrollToBottom()
        }
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase, activeConv, scrollToBottom])

  const handleSelectConv = (appId: string) => {
    setActiveConv(appId)
    setShowMobileList(false)
    loadMessages(appId)
  }

  const handleSend = async () => {
    const trimmed = newMessage.trim()
    if (!trimmed || !adminUser || !activeConv) return
    setSending(true)

    // Determine admin sender name
    let senderName = adminProfile?.full_name || 'Ban Chủ nhiệm iSSAC'
    if (typeof document !== 'undefined') {
      const nameCookie = document.cookie.match(/issac_logged_admin_name=([^;]+)/)
      if (nameCookie) senderName = decodeURIComponent(nameCookie[1])
    }

    const currentConv = conversations.find(c => c.application_id === activeConv)
    const tempId = `tmp_${Date.now()}`
    const optimisticMsg: ChatMessage = {
      id: tempId,
      application_id: activeConv,
      sender_id: adminUser.id,
      sender_role: 'admin',
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
        application_id: activeConv,
        sender_id: adminUser.id,
        sender_role: 'admin',
        sender_name: senderName,
        content: trimmed,
        candidate_user_id: undefined, // handled via notification query in manager
      })

      setMessages(prev => prev.map(m => m.id === tempId ? savedMsg : m))
      scrollToBottom()

      // Update conversation list last message
      setConversations(prev => {
        const idx = prev.findIndex(c => c.application_id === activeConv)
        if (idx >= 0) {
          const updated = [...prev]
          updated[idx] = {
            ...updated[idx],
            last_message: trimmed,
            last_time: new Date().toISOString(),
            total_messages: updated[idx].total_messages + 1,
          }
          return updated.sort((a, b) => new Date(b.last_time).getTime() - new Date(a.last_time).getTime())
        }
        return prev
      })
    } catch (err: any) {
      toast({
        title: 'Không thể gửi tin nhắn',
        description: err?.message || 'Vui lòng thử lại sau.',
        variant: 'destructive',
      })
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

  const handleQuickReply = (text: string) => {
    setNewMessage(text)
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

  const filteredConversations = conversations.filter(c => {
    const matchesSearch = !searchQuery ||
      c.candidate_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.candidate_student_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.dept_name.toLowerCase().includes(searchQuery.toLowerCase())

    if (!matchesSearch) return false
    if (filterMode === 'unread') return c.unread_count > 0
    return true
  })

  const totalUnread = conversations.reduce((sum, c) => sum + c.unread_count, 0)
  const activeConversation = conversations.find(c => c.application_id === activeConv)

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-[#1559c5] mx-auto" />
          <p className="text-sm text-slate-500 font-medium">Đang tải hộp thư tuyển quân...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2.5 tracking-tight">
            <MessageSquare className="w-6 h-6 text-[#1559c5]" />
            Tin nhắn Ứng viên
            {totalUnread > 0 && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-500 text-white animate-pulse">
                {totalUnread} mới
              </span>
            )}
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Trao đổi và giải đáp thắc mắc trực tiếp giữa Ban Tuyển quân / Ban Chủ nhiệm với từng ứng viên
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => loadConversations(true)}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Làm mới</span>
          </button>
        </div>
      </div>

      {/* Main Chat Box */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-0 bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden h-[calc(100vh-12rem)] min-h-[500px]">
        {/* Left Sidebar: Conversations List */}
        <div className={`md:col-span-4 lg:col-span-4 border-r border-slate-200 flex flex-col bg-slate-50/60 ${showMobileList ? 'block' : 'hidden md:flex'}`}>
          {/* Search & Filter Tabs */}
          <div className="p-3 border-b border-slate-200 space-y-2 bg-white">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                placeholder="Tìm tên, MSSV, ban..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 text-xs rounded-xl bg-slate-50 border-slate-200"
              />
            </div>

            <div className="flex items-center gap-1.5 pt-1">
              <button
                onClick={() => setFilterMode('all')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  filterMode === 'all'
                    ? 'bg-[#1559c5] text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Tất cả ({conversations.length})
              </button>
              <button
                onClick={() => setFilterMode('unread')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  filterMode === 'unread'
                    ? 'bg-rose-600 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Chưa đọc ({totalUnread})
              </button>
            </div>
          </div>

          {/* Conversations Scroll List */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {filteredConversations.length === 0 ? (
              <div className="p-8 text-center space-y-2 text-slate-400">
                <Inbox className="w-8 h-8 mx-auto stroke-1 text-slate-300" />
                <p className="text-xs font-medium">Không tìm thấy cuộc trò chuyện nào</p>
              </div>
            ) : (
              filteredConversations.map((conv) => {
                const isActive = activeConv === conv.application_id
                return (
                  <button
                    key={conv.application_id}
                    onClick={() => handleSelectConv(conv.application_id)}
                    className={`w-full text-left p-3.5 transition-all flex items-start gap-3 cursor-pointer ${
                      isActive
                        ? 'bg-blue-50/80 border-l-4 border-l-[#1559c5]'
                        : 'hover:bg-slate-100/80 border-l-4 border-l-transparent'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white font-black text-sm flex items-center justify-center shrink-0 shadow-2xs">
                      {conv.candidate_name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className={`text-xs font-bold truncate ${isActive ? 'text-[#1559c5]' : 'text-slate-900'}`}>
                          {conv.candidate_name}
                        </span>
                        <span className="text-[10px] text-slate-400 shrink-0 font-medium">
                          {formatTime(conv.last_time)}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium truncate mt-0.5">
                        {conv.candidate_student_id && <span>{conv.candidate_student_id} • </span>}
                        <span>{conv.dept_name}</span>
                      </div>

                      <div className="flex items-center justify-between gap-2 mt-1">
                        <p className="text-[11px] text-slate-600 truncate flex-1">
                          {conv.last_message}
                        </p>
                        {conv.unread_count > 0 && (
                          <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500 text-white shrink-0 shadow-2xs">
                            {conv.unread_count}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                )
              })
            )}
          </div>
        </div>

        {/* Right Area: Active Chat Window */}
        <div className={`md:col-span-8 lg:col-span-8 flex flex-col bg-white ${!showMobileList ? 'block' : 'hidden md:flex'}`}>
          {activeConversation ? (
            <>
              {/* Active Conversation Header */}
              <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-white shrink-0">
                <div className="flex items-center gap-3 min-w-0">
                  <button
                    onClick={() => setShowMobileList(true)}
                    className="md:hidden p-1.5 rounded-xl hover:bg-slate-100 text-slate-600"
                    title="Quay lại danh sách"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <div className="w-10 h-10 rounded-2xl bg-blue-100 text-[#1559c5] font-black text-sm flex items-center justify-center shrink-0">
                    {activeConversation.candidate_name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h2 className="text-sm font-bold text-slate-900 truncate">
                        {activeConversation.candidate_name}
                      </h2>
                      <span className="px-2 py-0.5 text-[10px] font-bold bg-blue-50 text-[#1559c5] border border-blue-200 rounded-full">
                        {activeConversation.dept_name}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-slate-500 font-medium truncate mt-0.5">
                      {activeConversation.candidate_student_id && (
                        <span className="flex items-center gap-1">
                          <GraduationCap className="w-3 h-3 text-slate-400" />
                          MSSV: {activeConversation.candidate_student_id}
                        </span>
                      )}
                      {activeConversation.candidate_phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3 text-slate-400" />
                          {activeConversation.candidate_phone}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href={`/admin/candidates?search=${encodeURIComponent(activeConversation.candidate_student_id || activeConversation.candidate_name)}`}
                    className="hidden sm:inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all"
                  >
                    Xem hồ sơ ứng viên
                  </a>
                </div>
              </div>

              {/* Messages Body */}
              <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5 bg-slate-50/50">
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center py-12 space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-[#1559c5]">
                      <MessageSquare className="w-6 h-6" />
                    </div>
                    <p className="text-xs font-bold text-slate-700">Chưa có tin nhắn nào trong hội thoại này</p>
                    <p className="text-[11px] text-slate-500 max-w-xs">
                      Hãy gửi lời chào hoặc phản hồi cho ứng viên {activeConversation.candidate_name}.
                    </p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isAdmin = msg.sender_role === 'admin'
                    return (
                      <div
                        key={msg.id}
                        className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className="max-w-[85%] sm:max-w-[70%]">
                          {/* Sender Label */}
                          <div className={`flex items-center gap-1.5 mb-1 px-1 ${isAdmin ? 'justify-end' : 'justify-start'}`}>
                            {isAdmin ? (
                              <div className="flex items-center gap-1">
                                <ShieldCheck className="w-3 h-3 text-blue-600" />
                                <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider">
                                  {msg.sender_name || 'Ban Chủ nhiệm'}
                                </span>
                              </div>
                            ) : (
                              <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                                {msg.sender_name || activeConversation.candidate_name}
                              </span>
                            )}
                          </div>

                          {/* Bubble */}
                          <div
                            className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap break-words shadow-2xs ${
                              isAdmin
                                ? 'bg-[#1559c5] text-white rounded-br-xs'
                                : 'bg-white border border-slate-200 text-slate-800 rounded-bl-xs'
                            }`}
                          >
                            {msg.content}
                          </div>

                          {/* Time & Read */}
                          <div className={`flex items-center gap-1 mt-1 px-1 ${isAdmin ? 'justify-end' : 'justify-start'}`}>
                            <span className="text-[10px] text-slate-400 font-medium">
                              {formatTime(msg.created_at)}
                            </span>
                            {isAdmin && (
                              msg.is_read ? (
                                <span className="inline-flex items-center gap-0.5 text-[10px] text-blue-600 font-semibold">
                                  <CheckCheck className="w-3 h-3 text-blue-600" /> Ứng viên đã xem
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

              {/* Quick Template Chips */}
              <div className="px-4 py-2 bg-slate-50 border-t border-slate-100 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
                <span className="text-[10px] font-bold text-slate-400 shrink-0 uppercase tracking-wider">Mẫu nhanh:</span>
                {[
                  'Ban Chủ nhiệm đã nhận được tin nhắn và đang kiểm tra hồ sơ của bạn.',
                  'Lịch phỏng vấn đã được cập nhật, bạn vui lòng kiểm tra Cổng ứng viên nhé.',
                  'Hồ sơ của bạn đã được duyệt qua vòng đơn, chúc mừng bạn!',
                  'Bạn vui lòng kiểm tra lại thông tin liên lạc và email nhé.',
                ].map((txt, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleQuickReply(txt)}
                    className="text-[11px] px-2.5 py-1 rounded-full bg-white hover:bg-blue-50 hover:text-[#1559c5] border border-slate-200 text-slate-600 whitespace-nowrap transition-all shrink-0"
                  >
                    {txt.slice(0, 32)}...
                  </button>
                ))}
              </div>

              {/* Input Bar */}
              <div className="border-t border-slate-200 p-3 sm:p-4 bg-white shrink-0">
                <div className="flex items-end gap-2.5">
                  <div className="flex-1 relative">
                    <textarea
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder={`Phản hồi cho ứng viên ${activeConversation.candidate_name}...`}
                      rows={1}
                      className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-[#1559c5] focus:bg-white transition-all max-h-32 leading-relaxed"
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
                    className="w-11 h-11 rounded-2xl bg-[#1559c5] hover:bg-[#1147a3] disabled:bg-slate-200 text-white disabled:text-slate-400 flex items-center justify-center transition-all shadow-sm shrink-0 cursor-pointer disabled:cursor-not-allowed"
                    title="Gửi phản hồi"
                  >
                    {sending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </button>
                </div>
                <p className="text-[10px] text-slate-400 font-medium text-center mt-2">
                  Nhấn Enter để gửi phản hồi • Shift+Enter để xuống dòng
                </p>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center p-8 space-y-3 text-slate-400">
              <div className="w-16 h-16 rounded-3xl bg-slate-100 flex items-center justify-center">
                <MessageSquare className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-sm font-bold text-slate-700">Chọn một cuộc trò chuyện</h3>
              <p className="text-xs text-slate-500 max-w-sm">
                Chọn ứng viên từ danh sách bên trái để xem nội dung trao đổi và phản hồi từ Ban Chủ nhiệm.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function AdminMessagesPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-[#1559c5]" />
      </div>
    }>
      <AdminMessagesContent />
    </Suspense>
  )
}
