'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/use-toast'
import {
  Bell, CheckCheck, Clock, ArrowRight, Trash2, CheckCircle2,
  AlertCircle, Info, Sparkles, Inbox, RefreshCw
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface NotificationItem {
  id: string
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error' | string
  action_url: string | null
  is_read: boolean
  created_at: string
}

export default function MemberNotificationsPage() {
  const supabase = createClient()
  const router = useRouter()
  const { toast } = useToast()

  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'unread'>('all')

  const fetchNotifications = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      let allNotifs = (!error && data) ? (data as NotificationItem[]) : []

      if (typeof window !== 'undefined') {
        try {
          const userNotifsKey = `issac_user_notifs_${user.id}`
          const localNotifs = JSON.parse(localStorage.getItem(userNotifsKey) || '[]')
          if (Array.isArray(localNotifs) && localNotifs.length > 0) {
            const existingIds = new Set(allNotifs.map(n => n.id))
            const filteredLocal = localNotifs.filter(n => !existingIds.has(n.id))
            allNotifs = [...filteredLocal, ...allNotifs]
          }
        } catch {}
      }

      setNotifications(allNotifs)
    } catch (err) {
      console.error('Error fetching notifications:', err)
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    fetchNotifications()

    // Realtime subscription on notifications table
    const channel = supabase
      .channel('member-notifications-channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, () => {
        fetchNotifications()
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
          fetchNotifications()
        }
      }
    }

    const handleCustomEvent = () => {
      fetchNotifications()
    }

    window.addEventListener('issac_candidate_approved' as any, handleCustomEvent)
    window.addEventListener('issac_results_published' as any, handleCustomEvent)
    window.addEventListener('storage', handleCustomEvent)

    return () => {
      supabase.removeChannel(channel)
      if (bc) bc.close()
      window.removeEventListener('issac_candidate_approved' as any, handleCustomEvent)
      window.removeEventListener('issac_results_published' as any, handleCustomEvent)
      window.removeEventListener('storage', handleCustomEvent)
    }
  }, [fetchNotifications, supabase])

  const markAsRead = async (id: string, actionUrl?: string | null) => {
    try {
      await supabase.from('notifications').update({ is_read: true }).eq('id', id)
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
    } catch {}

    if (actionUrl) {
      // Ensure url is valid member route
      const safeUrl = actionUrl.startsWith('/member') ? actionUrl : '/member/dashboard'
      router.push(safeUrl)
    }
  }

  const markAllAsRead = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      await supabase.from('notifications').update({ is_read: true }).eq('user_id', user.id)
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
      toast({ title: 'Đã đánh dấu tất cả là đã đọc' } as Parameters<typeof toast>[0])
    } catch (err) {
      toast({ title: 'Lỗi', description: 'Không thể cập nhật trạng thái', variant: 'destructive' })
    }
  }

  const deleteNotification = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await supabase.from('notifications').delete().eq('id', id)
      setNotifications(prev => prev.filter(n => n.id !== id))
      toast({ title: 'Đã xóa thông báo' } as Parameters<typeof toast>[0])
    } catch {}
  }

  const unreadCount = notifications.filter(n => !n.is_read).length
  const displayed = filter === 'unread' ? notifications.filter(n => !n.is_read) : notifications

  const formatTime = (ts: string) => {
    const d = new Date(ts)
    const hours = String(d.getHours()).padStart(2, '0')
    const mins = String(d.getMinutes()).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const year = d.getFullYear()
    return `${hours}:${mins} · ${day}/${month}/${year}`
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="w-5 h-5 text-emerald-600" />
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-600" />
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-amber-600" />
      default:
        return <Info className="w-5 h-5 text-blue-600" />
    }
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#1657c1] flex items-center justify-center font-bold">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2">
                Trung Tâm Thông Báo
                {unreadCount > 0 && (
                  <Badge className="bg-red-500 hover:bg-red-600 text-white font-bold text-xs px-2 py-0.5 rounded-full">
                    {unreadCount} mới
                  </Badge>
                )}
              </h1>
              <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
                Cập nhật thông tin tuyển quân, duyệt hồ sơ & lịch phỏng vấn theo thời gian thực
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchNotifications}
            className="h-9 gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-xl border-slate-200"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Làm mới
          </Button>
          {unreadCount > 0 && (
            <Button
              size="sm"
              onClick={markAllAsRead}
              className="h-9 gap-1.5 text-xs font-bold bg-[#1657c1] hover:bg-[#0f449e] text-white rounded-xl shadow-xs"
            >
              <CheckCheck className="w-4 h-4" /> Đã đọc tất cả
            </Button>
          )}
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            filter === 'all'
              ? 'bg-[#1657c1] text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          Tất cả thông báo ({notifications.length})
        </button>
        <button
          onClick={() => setFilter('unread')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            filter === 'unread'
              ? 'bg-[#1657c1] text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          Chưa đọc ({unreadCount})
        </button>
      </div>

      {/* Notifications List */}
      {loading ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 shadow-xs">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-slate-500 text-sm font-medium">Đang đồng bộ thông báo...</p>
        </div>
      ) : displayed.length === 0 ? (
        <Card className="rounded-2xl border border-slate-200 shadow-xs">
          <CardContent className="py-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 text-[#1657c1] flex items-center justify-center mx-auto mb-3 shadow-2xs">
              <Inbox className="w-8 h-8 opacity-60" />
            </div>
            <h3 className="font-bold text-slate-800 text-base">Chưa có thông báo nào</h3>
            <p className="text-slate-500 text-xs sm:text-sm mt-1 max-w-sm mx-auto">
              Khi Ban Tuyển quân duyệt hồ sơ hoặc xếp lịch phỏng vấn, thông báo sẽ hiển thị ngay tại đây.
            </p>
            <Link href="/member/dashboard" className="inline-block mt-4">
              <Button size="sm" variant="outline" className="rounded-xl text-xs font-bold text-[#1657c1] border-blue-200">
                Về Trang chủ
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {displayed.map((n) => (
            <div
              key={n.id}
              onClick={() => markAsRead(n.id, n.action_url)}
              className={`group p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer flex items-start gap-4 ${
                n.is_read
                  ? 'bg-white border-slate-200/80 hover:border-blue-300 hover:shadow-xs'
                  : 'bg-blue-50/40 border-blue-200 hover:border-blue-300 hover:shadow-sm'
              }`}
            >
              <div className="w-10 h-10 rounded-xl bg-white border border-slate-200/80 flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
                {getIcon(n.type)}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <div className="flex items-center gap-2">
                    <h3 className={`text-sm font-bold truncate ${n.is_read ? 'text-slate-800' : 'text-blue-950 font-black'}`}>
                      {n.title}
                    </h3>
                    {!n.is_read && (
                      <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />
                    )}
                  </div>
                  <span className="text-[11px] font-mono text-slate-400 shrink-0 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatTime(n.created_at)}
                  </span>
                </div>

                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  {n.message}
                </p>

                <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-100">
                  {n.action_url ? (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-[#1657c1] group-hover:underline">
                      Xem chi tiết <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  ) : (
                    <span />
                  )}

                  <button
                    onClick={(e) => deleteNotification(n.id, e)}
                    className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition-all p-1"
                    title="Xóa thông báo này"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
