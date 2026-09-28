'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Bell, CheckCircle2, AlertCircle, Info, ArrowRight, AlertTriangle } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface NotificationItem {
  id: string
  title: string
  message: string
  type: string
  action_url: string | null
  is_read: boolean
  created_at: string
}

export function MemberNotificationBell() {
  const supabase = createClient()
  const router = useRouter()
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const fetchRecent = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(6)

      let dbNotifs = (data as NotificationItem[]) || []

      // Merge local in-app notifications and sanitize legacy ones
      if (typeof window !== 'undefined') {
        try {
          const userNotifsKey = `issac_user_notifs_${user.id}`
          const raw = localStorage.getItem(userNotifsKey)
          if (raw) {
            const localNotifs = JSON.parse(raw)
            if (Array.isArray(localNotifs) && localNotifs.length > 0) {
              const sanitizedLocal = localNotifs.map((n: any) => {
                if (
                  n.action_url === '/member/messages' ||
                  n.type === 'message' ||
                  n.type === 'warning' ||
                  n.title?.toLowerCase().includes('phản hồi') ||
                  n.title?.toLowerCase().includes('tin nhắn')
                ) {
                  return {
                    ...n,
                    title: 'Cảnh báo từ Ban Chủ nhiệm iSSAC',
                    type: 'warning',
                    action_url: '/member/messages',
                    message: typeof n.message === 'string' ? n.message.replace(/tin nhắn/gi, 'cảnh báo') : n.message
                  }
                }
                return n
              })
              localStorage.setItem(userNotifsKey, JSON.stringify(sanitizedLocal))
              const existingIds = new Set(dbNotifs.map(n => n.id))
              const filteredLocal = sanitizedLocal.filter((n: any) => !existingIds.has(n.id))
              dbNotifs = [...filteredLocal, ...dbNotifs]
            }
          }
        } catch {}
      }

      // Map any items with action_url = /member/messages to warning title
      dbNotifs = dbNotifs.map(n => {
        if (
          n.action_url === '/member/messages' ||
          n.type === 'warning' ||
          n.type === 'message' ||
          n.title?.toLowerCase().includes('phản hồi') ||
          n.title?.toLowerCase().includes('tin nhắn')
        ) {
          return {
            ...n,
            title: 'Cảnh báo từ Ban Chủ nhiệm iSSAC',
            type: 'warning',
            action_url: '/member/messages',
            message: typeof n.message === 'string' ? n.message.replace(/tin nhắn/gi, 'cảnh báo') : n.message
          }
        }
        return n
      })

      setNotifications(dbNotifs.slice(0, 6))
    } catch (err) {
      console.error('Error fetching notification bell:', err)
    }
  }, [supabase])

  useEffect(() => {
    fetchRecent()

    const channel = supabase
      .channel('member-bell-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, () => {
        fetchRecent()
      })
      .subscribe()

    let bc: BroadcastChannel | null = null
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      bc = new BroadcastChannel('issac_eval_channel')
      bc.onmessage = (event) => {
        const d = event.data
        if (
          d?.type === 'candidate_approved' ||
          d?.type === 'results_published' ||
          d?.type === 'candidate_decision_changed' ||
          d?.type === 'candidate_status_changed'
        ) {
          fetchRecent()
        }
      }
    }

    const handleCustomEvent = () => {
      fetchRecent()
    }

    window.addEventListener('issac_candidate_approved' as any, handleCustomEvent)
    window.addEventListener('issac_results_published' as any, handleCustomEvent)
    window.addEventListener('storage', handleCustomEvent)

    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)

    return () => {
      supabase.removeChannel(channel)
      if (bc) bc.close()
      window.removeEventListener('issac_candidate_approved' as any, handleCustomEvent)
      window.removeEventListener('issac_results_published' as any, handleCustomEvent)
      window.removeEventListener('storage', handleCustomEvent)
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [fetchRecent, supabase])

  const unreadCount = notifications.filter(n => !n.is_read).length

  // Instant non-blocking item click with background database sync
  const handleItemClick = (n: NotificationItem) => {
    setIsOpen(false)

    if (!n.is_read) {
      setNotifications(prev => prev.map(item => item.id === n.id ? { ...item, is_read: true } : item))
      // Background update without blocking navigation
      Promise.resolve(supabase.from('notifications').update({ is_read: true }).eq('id', n.id)).catch(() => {})
    }
  }

  const getTargetUrl = (n: NotificationItem) => {
    if (n.action_url) {
      return n.action_url.startsWith('/member') ? n.action_url : '/member/dashboard'
    }
    if (
      n.title.toLowerCase().includes('cảnh báo') ||
      n.title.toLowerCase().includes('phản hồi') ||
      n.message.toLowerCase().includes('ban tuyển quân') ||
      n.message.toLowerCase().includes('ban chủ nhiệm')
    ) {
      return '/member/messages'
    }
    return '/member/notifications'
  }

  const isWarningItem = (n: NotificationItem) => {
    return (
      n.type === 'warning' ||
      n.action_url === '/member/messages' ||
      n.title.toLowerCase().includes('cảnh báo') ||
      n.title.toLowerCase().includes('phản hồi')
    )
  }

  const formatShortTime = (ts: string) => {
    try {
      const d = new Date(ts)
      const hours = String(d.getHours()).padStart(2, '0')
      const mins = String(d.getMinutes()).padStart(2, '0')
      const day = String(d.getDate()).padStart(2, '0')
      const month = String(d.getMonth() + 1).padStart(2, '0')
      return `${hours}:${mins} · ${day}/${month}`
    } catch {
      return ''
    }
  }

  return (
    <div className="relative z-[9999]" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-slate-100 hover:bg-blue-50 hover:text-[#1657c1] text-slate-600 border border-slate-200/80 transition-all cursor-pointer"
        title="Thông báo tuyển quân"
      >
        <Bell className="w-4.5 h-4.5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-rose-600 text-[10px] font-black text-white shadow-xs animate-pulse ring-2 ring-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl border-2 border-slate-200 shadow-2xl overflow-hidden z-[9999] animate-in fade-in zoom-in-95 duration-100">
          {/* Header */}
          <div className="px-4 py-3 bg-slate-50/90 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-bold text-xs sm:text-sm text-slate-900">Thông báo tuyển quân</span>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 text-[10px] font-black">
                  {unreadCount} mới
                </span>
              )}
            </div>
            <Link
              href="/member/notifications"
              onClick={() => setIsOpen(false)}
              className="text-xs font-bold text-[#1657c1] hover:underline"
            >
              Xem tất cả
            </Link>
          </div>

          {/* Quick Warning Link to BCN Warnings */}
          <Link
            href="/member/messages"
            onClick={() => setIsOpen(false)}
            className="flex items-center justify-between px-4 py-2.5 bg-rose-50 hover:bg-rose-100/90 border-b border-rose-200 text-rose-800 transition-colors"
          >
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 animate-bounce" />
              <span className="text-xs font-black">Cảnh báo của BCN iSSAC</span>
            </div>
            <span className="text-[11px] font-bold text-rose-700 underline flex items-center gap-1">
              Xem ngay <ArrowRight className="w-3 h-3" />
            </span>
          </Link>

          {/* Notifications List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-slate-400">
                <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-xs font-medium">Chưa có thông báo nào</p>
              </div>
            ) : (
              notifications.map((n) => {
                const isWarning = isWarningItem(n)
                const targetUrl = getTargetUrl(n)

                return (
                  <Link
                    key={n.id}
                    href={targetUrl}
                    onClick={() => handleItemClick(n)}
                    className={`p-3.5 hover:bg-blue-50/60 transition-colors flex items-start gap-3 block ${
                      !n.is_read
                        ? isWarning ? 'bg-rose-50/40' : 'bg-blue-50/30'
                        : ''
                    }`}
                  >
                    <div className="mt-0.5 shrink-0">
                      {isWarning ? (
                        <AlertTriangle className="w-4 h-4 text-rose-600" />
                      ) : (
                        <div
                          className="w-2 h-2 rounded-full mt-1.5 bg-blue-600"
                          style={{ opacity: n.is_read ? 0 : 1 }}
                        />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className={`text-xs truncate ${
                            !n.is_read
                              ? isWarning ? 'text-rose-950 font-black' : 'text-blue-950 font-black'
                              : 'text-slate-800 font-bold'
                          }`}>
                            {isWarning ? 'Cảnh báo từ Ban Chủ nhiệm iSSAC' : n.title}
                          </span>
                          {isWarning && (
                            <span className="px-1.5 py-0.2 rounded-md bg-rose-100 text-rose-800 text-[9px] font-black shrink-0 uppercase">
                              Cảnh báo
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono shrink-0">
                          {formatShortTime(n.created_at)}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed">
                        {n.message}
                      </p>
                    </div>
                  </Link>
                )
              })
            )}
          </div>

          {/* Footer */}
          <div className="p-2.5 bg-slate-50/80 border-t border-slate-100 text-center">
            <Link
              href="/member/notifications"
              onClick={() => setIsOpen(false)}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#1657c1] hover:underline"
            >
              Mở Trung tâm Thông báo <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
