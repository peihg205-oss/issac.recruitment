'use client'

import { useState, useEffect, useCallback, useRef, useMemo, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/components/ui/use-toast'
import { Input } from '@/components/ui/input'
import { ADMIN_ROLE_CONFIGS, type AdminRoleType } from '@/lib/permissions'
import {
  AlertTriangle, Send, Loader2, CheckCheck, Clock,
  ShieldCheck, ShieldAlert, Users, Search, ArrowLeft, Inbox,
  RefreshCw, Phone, Mail, GraduationCap, ChevronDown, Info
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
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const isComposingRef = useRef(false)

  const [conversations, setConversations] = useState<ConversationSummary[]>([])
  const [activeConv, setActiveConv] = useState<string | null>(initialAppId)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterMode, setFilterMode] = useState<'all' | 'unread'>('all')
  const [adminUser, setAdminUser] = useState<any>(null)
  const [adminProfile, setAdminProfile] = useState<any>(null)
  const [showMobileList, setShowMobileList] = useState(true)
  const [showScrollBottomBtn, setShowScrollBottomBtn] = useState(false)

  const [activeRole, setActiveRole] = useState<AdminRoleType>(() => {
    if (typeof document !== 'undefined') {
      const match = document.cookie.match(/(?:^|;\s*)issac_admin_role=([^;]+)/)
      if (match && match[1] in ADMIN_ROLE_CONFIGS) {
        return match[1] as AdminRoleType
      }
    }
    return 'chu-nhiem'
  })

  const [adminName, setAdminName] = useState<string>(() => {
    if (typeof document !== 'undefined') {
      const match = document.cookie.match(/(?:^|;\s*)issac_logged_admin_name=([^;]+)/)
      if (match) {
        try { return decodeURIComponent(match[1]) } catch {}
      }
    }
    return 'Nguyễn Thị Hồng Hân'
  })

  const [adminTitle, setAdminTitle] = useState<string>(() => {
    if (typeof document !== 'undefined') {
      const match = document.cookie.match(/(?:^|;\s*)issac_logged_admin_title=([^;]+)/)
      if (match) {
        try { return decodeURIComponent(match[1]) } catch {}
      }
    }
    return 'Chủ nhiệm CLB iSSAC'
  })

  useEffect(() => {
    if (typeof document !== 'undefined') {
      const roleMatch = document.cookie.match(/(?:^|;\s*)issac_admin_role=([^;]+)/)
      if (roleMatch && roleMatch[1] in ADMIN_ROLE_CONFIGS) {
        setActiveRole(roleMatch[1] as AdminRoleType)
      }
      const nameMatch = document.cookie.match(/(?:^|;\s*)issac_logged_admin_name=([^;]+)/)
      if (nameMatch) {
        try { setAdminName(decodeURIComponent(nameMatch[1])) } catch {}
      }
      const titleMatch = document.cookie.match(/(?:^|;\s*)issac_logged_admin_title=([^;]+)/)
      if (titleMatch) {
        try { setAdminTitle(decodeURIComponent(titleMatch[1])) } catch {}
      }
    }
  }, [])

  const roleConfig = ADMIN_ROLE_CONFIGS[activeRole] || ADMIN_ROLE_CONFIGS['chu-nhiem']
  const isSuperAdmin = activeRole === 'chu-nhiem' || roleConfig.isSuperAdmin

  // Tên hiển thị đầy đủ kèm chức vụ của cán bộ gửi cảnh báo
  const senderFormattedName = useMemo(() => {
    const effectiveName = adminProfile?.full_name || adminName || roleConfig.label
    const effectiveTitle = adminTitle || roleConfig.shortLabel || roleConfig.label
    if (effectiveTitle && !effectiveName.toLowerCase().includes(effectiveTitle.toLowerCase())) {
      return `${effectiveName} (${effectiveTitle})`
    }
    return effectiveName
  }, [adminProfile?.full_name, adminName, adminTitle, roleConfig])

  // Lọc danh sách ứng viên theo phân quyền:
  // - Ban Chủ nhiệm: Xem và gửi cảnh báo tới TẤT CẢ ứng viên
  // - Các ban chuyên môn: CHỈ xem và gửi cảnh báo tới ứng viên ban mình
  const accessibleConversations = useMemo(() => {
    if (isSuperAdmin) return conversations
    return conversations.filter(c => {
      if (c.dept_slug === activeRole) return true
      if (c.dept_name && c.dept_name.toLowerCase().includes(roleConfig.departmentName.toLowerCase())) return true
      return false
    })
  }, [conversations, isSuperAdmin, activeRole, roleConfig.departmentName])

  const scrollToBottom = useCallback((instant = false) => {
    setTimeout(() => {
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: instant ? 'auto' : 'smooth', block: 'end' })
      } else if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight
      }
    }, 60)
  }, [])

  const handleScroll = () => {
    if (!scrollRef.current) return
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 120
    setShowScrollBottomBtn(!isNearBottom)
  }

  // Load admin user & all candidate warning summaries
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

      if (initialAppId && !activeConv) {
        setActiveConv(initialAppId)
        setShowMobileList(false)
      } else if (!activeConv && list.length > 0) {
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

  // Fetch warnings for active conversation
  const loadMessages = useCallback(async (appId: string) => {
    try {
      const msgs = await fetchApplicationMessages(supabase, appId)
      setMessages(msgs)
      await markChatAsRead(supabase, appId, 'admin')

      setConversations(prev => {
        const item = prev.find(c => c.application_id === appId)
        if (!item || item.unread_count === 0) return prev
        return prev.map(c =>
          c.application_id === appId ? { ...c, unread_count: 0 } : c
        )
      })

      scrollToBottom(true)
    } catch (err) {
      console.error('Error fetching warnings for app:', err)
    }
  }, [supabase, scrollToBottom])

  useEffect(() => {
    if (activeConv) {
      loadMessages(activeConv)
    }
  }, [activeConv]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    scrollToBottom(false)
  }, [messages.length, activeConv, scrollToBottom])

  // Periodic polling
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const list = await fetchAllConversations(supabase)
        setConversations(list)

        if (activeConv) {
          const conv = list.find(c => c.application_id === activeConv)
          const msgs = await fetchApplicationMessages(supabase, activeConv, conv?.candidate_id)
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
      .channel('admin-warning-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'audit_logs' }, async (payload: any) => {
        if (payload?.new?.action === 'CHAT_MESSAGE' || payload?.new?.action === 'CHAT_READ') {
          const list = await fetchAllConversations(supabase)
          setConversations(list)
          if (activeConv) {
            const conv = list.find(c => c.application_id === activeConv)
            const target = payload?.new?.target_id || payload?.new?.metadata?.conversation_id || payload?.new?.metadata?.candidate_user_id
            if (target === activeConv || (conv && target === conv.candidate_id)) {
              const msgs = await fetchApplicationMessages(supabase, activeConv, conv?.candidate_id)
              setMessages(msgs)
              scrollToBottom()
            }
          }
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, async (payload: any) => {
        const list = await fetchAllConversations(supabase)
        setConversations(list)
        if (activeConv && payload?.new?.application_id === activeConv) {
          const conv = list.find(c => c.application_id === activeConv)
          const msgs = await fetchApplicationMessages(supabase, activeConv, conv?.candidate_id)
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

  const handleSendWarning = () => {
    const trimmed = newMessage.trim()
    if (!trimmed || !activeConv) return

    if (!canChatWithCandidate) {
      toast({
        title: 'Không có quyền gửi cảnh báo',
        description: `Bạn đang phụ trách ${roleConfig.departmentName}. Chỉ có thể gửi cảnh báo cho ứng viên thuộc ban này.`,
        variant: 'destructive',
      })
      return
    }

    setNewMessage('')
    if (textareaRef.current) {
      textareaRef.current.style.height = '44px'
    }

    const senderName = senderFormattedName
    const senderId = adminUser?.id || `admin_${activeRole}`

    const currentConv = conversations.find(c => c.application_id === activeConv)
    const tempId = `tmp_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
    const optimisticMsg: ChatMessage = {
      id: tempId,
      application_id: activeConv,
      sender_id: senderId,
      sender_role: 'admin',
      sender_name: senderName,
      content: trimmed,
      is_read: false,
      created_at: new Date().toISOString(),
    }

    setMessages(prev => [...prev, optimisticMsg])
    scrollToBottom(true)

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

    sendChatMessage(supabase, {
      conversation_id: activeConv,
      application_id: currentConv?.has_application ? activeConv : null,
      candidate_user_id: currentConv?.candidate_id || activeConv,
      sender_id: senderId,
      sender_role: 'admin',
      sender_name: senderName,
      content: trimmed,
    }).then(savedMsg => {
      setMessages(prev => prev.map(m => m.id === tempId ? savedMsg : m))
      scrollToBottom()
      toast({
        title: 'Đã gửi cảnh báo',
        description: `Đã phát cảnh báo thành công tới ứng viên ${currentConv?.candidate_name}.`,
      })
    }).catch(err => {
      console.error('Send warning error:', err)
      toast({
        title: 'Không thể gửi cảnh báo',
        description: err?.message || 'Vui lòng kiểm tra lại kết nối.',
        variant: 'destructive',
      })
      setMessages(prev => prev.filter(m => m.id !== tempId))
    })
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.nativeEvent.isComposing || isComposingRef.current || e.keyCode === 229) {
      return
    }
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendWarning()
    }
  }

  const handleQuickTemplate = (text: string) => {
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

  const filteredConversations = accessibleConversations.filter(c => {
    const matchesSearch = !searchQuery ||
      c.candidate_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.candidate_student_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.dept_name.toLowerCase().includes(searchQuery.toLowerCase())

    if (!matchesSearch) return false
    if (filterMode === 'unread') return c.total_messages > 0
    return true
  })

  const totalWarningsSent = accessibleConversations.reduce((sum, c) => sum + c.total_messages, 0)
  const activeConversation = conversations.find(c => c.application_id === activeConv)

  const canChatWithCandidate = useMemo(() => {
    if (!activeConversation) return false
    if (isSuperAdmin) return true
    if (activeConversation.dept_slug === activeRole) return true
    if (activeConversation.dept_name && activeConversation.dept_name.toLowerCase().includes(roleConfig.departmentName.toLowerCase())) return true
    return false
  }, [activeConversation, isSuperAdmin, activeRole, roleConfig.departmentName])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-[#1559c5] mx-auto" />
          <p className="text-sm text-slate-500 font-medium">Đang tải trung tâm cảnh báo...</p>
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
            <AlertTriangle className="w-6 h-6 text-amber-600" />
            Cảnh báo Ứng viên
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
              Kênh 1 chiều
            </span>
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Gửi thông báo cảnh báo và nhắc nhở trực tiếp cho từng ứng viên (Ứng viên chỉ đọc, không có quyền phản hồi)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => loadConversations(true)}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-all disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Làm mới</span>
          </button>
        </div>
      </div>

      {/* Main Container */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-0 bg-white rounded-3xl border border-slate-200 shadow-xs h-[calc(100vh-11rem)] max-h-[850px] min-h-[550px] overflow-hidden">
        {/* Left Sidebar: Candidates List */}
        <div className={`md:col-span-4 lg:col-span-4 border-r border-slate-200 flex flex-col bg-slate-50/60 h-full min-h-0 overflow-hidden ${showMobileList ? 'flex' : 'hidden md:flex'}`}>
          {/* Search & Filter */}
          <div className="p-3 border-b border-slate-200 space-y-2.5 bg-white shrink-0">
            {/* Active role badge */}
            <div className="flex items-center justify-between gap-2 px-1 pt-0.5">
              <div className="flex items-center gap-1.5 min-w-0">
                <ShieldCheck className="w-4 h-4 text-[#1559c5] shrink-0" />
                <span className="text-xs font-bold text-slate-800 truncate" title={senderFormattedName}>
                  {senderFormattedName}
                </span>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${
                isSuperAdmin
                  ? 'bg-blue-50 text-[#1559c5] border-blue-200'
                  : 'bg-indigo-50 text-indigo-700 border-indigo-200'
              }`}>
                {isSuperAdmin ? 'Toàn quyền' : `Ban ${roleConfig.shortLabel}`}
              </span>
            </div>

            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                placeholder="Tìm ứng viên theo tên, MSSV..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 text-xs rounded-xl bg-slate-50 border-slate-200"
              />
            </div>

            <div className="flex items-center gap-1.5 pt-0.5">
              <button
                onClick={() => setFilterMode('all')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  filterMode === 'all'
                    ? 'bg-[#1559c5] text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Tất cả ({accessibleConversations.length})
              </button>
              <button
                onClick={() => setFilterMode('unread')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  filterMode === 'unread'
                    ? 'bg-amber-600 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Đã có cảnh báo ({accessibleConversations.filter(c => c.total_messages > 0).length})
              </button>
            </div>
          </div>

          {/* Candidates Scroll List */}
          <div className="flex-1 min-h-0 overflow-y-auto divide-y divide-slate-100 overscroll-contain">
            {filteredConversations.length === 0 ? (
              <div className="p-8 text-center space-y-2 text-slate-400">
                <Inbox className="w-8 h-8 mx-auto stroke-1 text-slate-300" />
                <p className="text-xs font-medium">Không tìm thấy ứng viên nào</p>
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
                        ? 'bg-amber-50/80 border-l-4 border-l-amber-600'
                        : 'hover:bg-slate-100/80 border-l-4 border-l-transparent'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-600 to-orange-700 text-white font-black text-sm flex items-center justify-center shrink-0 shadow-2xs">
                      {conv.candidate_name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className={`text-xs font-bold truncate ${isActive ? 'text-amber-900' : 'text-slate-900'}`}>
                          {conv.candidate_name}
                        </span>
                        <span className="text-[10px] text-slate-400 shrink-0 font-medium">
                          {formatTime(conv.last_time)}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium truncate mt-0.5">
                        {conv.candidate_student_id && <span>{conv.candidate_student_id} • </span>}
                        <span className={conv.has_application ? 'text-blue-700 font-semibold' : 'text-slate-500'}>
                          {conv.dept_name}
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-2 mt-1">
                        <p className="text-[11px] text-slate-600 truncate flex-1">
                          {conv.last_message}
                        </p>
                        {conv.total_messages > 0 && (
                          <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200 shrink-0">
                            {conv.total_messages} cảnh báo
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

        {/* Right Area: Warning Management Window */}
        <div className={`md:col-span-8 lg:col-span-8 flex flex-col bg-white h-full min-h-0 overflow-hidden relative ${!showMobileList ? 'flex' : 'hidden md:flex'}`}>
          {activeConversation ? (
            <>
              {/* Candidate Info Header */}
              <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-white shrink-0 z-10 shadow-2xs">
                <div className="flex items-center gap-3 min-w-0">
                  <button
                    onClick={() => setShowMobileList(true)}
                    className="md:hidden p-1.5 rounded-xl hover:bg-slate-100 text-slate-600 cursor-pointer"
                    title="Quay lại danh sách"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-800 font-black text-sm flex items-center justify-center shrink-0">
                    {activeConversation.candidate_name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h2 className="text-sm font-bold text-slate-900 truncate">
                        {activeConversation.candidate_name}
                      </h2>
                      <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                        activeConversation.has_application
                          ? 'bg-blue-50 text-[#1559c5] border border-blue-200'
                          : 'bg-amber-50 text-amber-800 border border-amber-200'
                      }`}>
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
                      {activeConversation.candidate_email && (
                        <span className="hidden sm:flex items-center gap-1">
                          <Mail className="w-3 h-3 text-slate-400" />
                          {activeConversation.candidate_email}
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

              {/* Informational banner: 1-way warning channel */}
              <div className="px-4 py-2 bg-amber-50/70 border-b border-amber-200/60 flex items-center justify-between text-xs text-amber-900 shrink-0 z-10">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0" />
                  <span className="text-[11px] font-medium">
                    Kênh thông báo cảnh báo 1 chiều: <strong>Ứng viên chỉ đọc, không có quyền phản hồi</strong>.
                  </span>
                </div>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-200/70 text-amber-900">
                  Chỉ đọc
                </span>
              </div>

              {/* Warnings List Body */}
              <div
                ref={scrollRef}
                onScroll={handleScroll}
                className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-5 space-y-3.5 bg-slate-50/50 overscroll-contain"
              >
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center py-12 space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
                      <AlertTriangle className="w-6 h-6" />
                    </div>
                    <p className="text-xs font-bold text-slate-700">Chưa có cảnh báo nào được gửi tới ứng viên này</p>
                    <p className="text-[11px] text-slate-500 max-w-xs">
                      Soạn nội dung hoặc chọn mẫu cảnh báo nhanh bên dưới để gửi cảnh báo/nhắc nhở cho {activeConversation.candidate_name}.
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
                        <div className="max-w-[85%] sm:max-w-[75%]">
                          {/* Sender Label */}
                          <div className={`flex items-center gap-1.5 mb-1 px-1 ${isAdmin ? 'justify-end' : 'justify-start'}`}>
                            {isAdmin ? (
                              <div className="flex items-center gap-1">
                                <ShieldAlert className="w-3 h-3 text-amber-600 shrink-0" />
                                <span className="text-[10px] font-bold text-amber-800">
                                  {msg.sender_name || 'Ban Chủ nhiệm'}
                                </span>
                                <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded-md bg-amber-100 text-amber-900">
                                  Cảnh báo
                                </span>
                              </div>
                            ) : (
                              <span className="text-[10px] font-bold text-slate-600">
                                {msg.sender_name || activeConversation.candidate_name}
                              </span>
                            )}
                          </div>

                          {/* Bubble */}
                          <div
                            className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap break-words shadow-2xs ${
                              isAdmin
                                ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-br-xs'
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
                                <span className="inline-flex items-center gap-0.5 text-[10px] text-emerald-600 font-semibold">
                                  <CheckCheck className="w-3 h-3 text-emerald-600" /> Ứng viên đã xem
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-0.5 text-[10px] text-slate-400">
                                  <Clock className="w-3 h-3" /> Đã gửi
                                </span>
                              )
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
                <div ref={messagesEndRef} className="h-1 shrink-0" />
              </div>

              {/* Floating Scroll to Bottom Button */}
              {showScrollBottomBtn && (
                <button
                  onClick={() => scrollToBottom(false)}
                  className="absolute bottom-32 right-6 p-2 rounded-full bg-white text-amber-700 shadow-md border border-slate-200 hover:bg-slate-50 transition-all z-20 cursor-pointer animate-bounce flex items-center gap-1 text-xs font-bold px-3"
                  title="Cuộn xuống cảnh báo mới nhất"
                >
                  <ChevronDown className="w-4 h-4" />
                  <span>Mới nhất</span>
                </button>
              )}

              {/* Quick Warning Templates */}
              {canChatWithCandidate && (
                <div className="px-4 py-2 bg-slate-50 border-t border-slate-100 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0 z-10">
                  <span className="text-[10px] font-bold text-slate-400 shrink-0 uppercase tracking-wider">Mẫu cảnh báo:</span>
                  {[
                    'Cảnh báo: Bạn chưa hoàn thiện nộp đơn Vòng 1. Hạn chót là 3 ngày sau khi tạo tài khoản, quá hạn tài khoản sẽ bị tạm khóa.',
                    'Nhắc nhở: Thông tin hồ sơ (MSSV / Số điện thoại / Email) có dấu hiệu sai sót, bạn vui lòng cập nhật lại sớm.',
                    'Cảnh báo: Lịch phỏng vấn đã được sắp xếp, vui lòng truy cập Cổng ứng viên xác nhận tham dự đúng giờ.',
                    'Cảnh báo vi phạm: Nghiêm cấm chia sẻ đề bài hoặc nội dung phỏng vấn ra bên ngoài theo quy chế tuyển quân.',
                    'Thông báo: Vui lòng kiểm tra email để nhận hướng dẫn chi tiết từ Ban Tuyển quân iSSAC.',
                  ].map((txt, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleQuickTemplate(txt)}
                      className="text-[11px] px-2.5 py-1 rounded-full bg-white hover:bg-amber-50 hover:text-amber-800 border border-slate-200 text-slate-600 whitespace-nowrap transition-all shrink-0 cursor-pointer"
                    >
                      {txt.slice(0, 32)}...
                    </button>
                  ))}
                </div>
              )}

              {/* Warning Sender Bar */}
              {!canChatWithCandidate ? (
                <div className="border-t border-slate-200 p-4 bg-amber-50/70 shrink-0 z-10">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-xl bg-amber-100 border border-amber-200 flex items-center justify-center text-amber-700 shrink-0 mt-0.5">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-bold text-amber-900">
                        Chế độ chỉ xem đối với ứng viên {activeConversation.dept_name || 'khác ban'}
                      </h4>
                      <p className="text-[11px] text-amber-700 mt-0.5 leading-relaxed">
                        Tài khoản của bạn đang có quyền <strong>{roleConfig.label}</strong> nên chỉ có thể gửi cảnh báo cho các ứng viên thuộc <strong>{roleConfig.departmentName}</strong>. Ban Chủ nhiệm có quyền xem và gửi cảnh báo cho toàn bộ ứng viên.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="border-t border-slate-200 p-3 sm:p-4 bg-white shrink-0 z-10">
                  <div className="flex items-center justify-between text-[11px] text-slate-500 mb-2 px-1">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shrink-0"></span>
                      <span className="truncate">
                        Người gửi cảnh báo: <strong className="text-slate-800 font-semibold">{senderFormattedName}</strong>
                      </span>
                    </div>
                    {isSuperAdmin ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-[#1559c5] border border-blue-200 shrink-0">
                        Ban Chủ nhiệm (Gửi All)
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 shrink-0">
                        Ban {roleConfig.shortLabel}
                      </span>
                    )}
                  </div>

                  <div className="flex items-end gap-2.5">
                    <div className="flex-1 relative">
                      <textarea
                        ref={textareaRef}
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onCompositionStart={() => {
                          isComposingRef.current = true
                        }}
                        onCompositionEnd={() => {
                          isComposingRef.current = false
                        }}
                        onKeyDown={handleKeyDown}
                        placeholder={`Nhập nội dung cảnh báo hoặc nhắc nhở gửi tới ứng viên ${activeConversation.candidate_name}...`}
                        rows={1}
                        className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-200 focus:border-amber-500 focus:bg-white transition-all max-h-32 leading-relaxed"
                        style={{ minHeight: '44px' }}
                        onInput={(e) => {
                          const t = e.currentTarget
                          t.style.height = 'auto'
                          t.style.height = Math.min(t.scrollHeight, 128) + 'px'
                        }}
                      />
                    </div>
                    <button
                      onClick={handleSendWarning}
                      disabled={!newMessage.trim()}
                      className="h-11 px-4 rounded-2xl bg-amber-600 hover:bg-amber-700 active:scale-95 disabled:bg-slate-200 text-white disabled:text-slate-400 flex items-center justify-center gap-1.5 text-xs font-bold transition-all shadow-sm shrink-0 cursor-pointer disabled:cursor-not-allowed"
                      title="Gửi cảnh báo tới ứng viên (Enter)"
                    >
                      <AlertTriangle className="w-4 h-4" />
                      <span className="hidden sm:inline">Gửi cảnh báo</span>
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center p-8 space-y-3 text-slate-400">
              <div className="w-16 h-16 rounded-3xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
                <AlertTriangle className="w-8 h-8" />
              </div>
              <h3 className="text-sm font-bold text-slate-700">Chọn một ứng viên</h3>
              <p className="text-xs text-slate-500 max-w-sm">
                Chọn ứng viên từ danh sách bên trái để xem lịch sử cảnh báo và gửi thông báo nhắc nhở từ Ban Tuyển quân.
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
