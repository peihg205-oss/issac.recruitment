'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  AlertTriangle, Loader2, CheckCheck, Clock,
  ShieldCheck, RefreshCw, Bell, Check,
  ExternalLink, Radio
} from 'lucide-react'
import {
  ChatMessage,
  fetchApplicationMessages,
  markChatAsRead,
} from '@/lib/messages-manager'

export default function MemberWarningsPage() {
  const supabase = createClient()

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
      handle: '@ISSAC.VNUIS',
      url: 'https://www.facebook.com/issac.vnuis',
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
    <div className="max-w-3xl mx-auto space-y-4">

      {/* ── CARD 1: THÔNG BÁO BCN ─────────────────────────── */}
      <div className="bg-white border-2 border-[#1657c1]/30 rounded-2xl p-5 sm:p-6 space-y-4">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#1657c1] text-white text-[11px] font-black uppercase tracking-wider shrink-0 mt-0.5">
              <Radio className="w-3 h-3" />
              THÔNG BÁO BCN
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs font-semibold text-slate-500">Kênh một chiều</span>
            <button
              onClick={() => loadData(true)}
              disabled={refreshing}
              title="Làm mới"
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition-all disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900">Thông báo từ BCN ISSAC</h1>
          <p className="text-sm text-slate-500 mt-1">Các thông báo quan trọng, cảnh báo và nhắc nhở dành cho ứng viên.</p>
        </div>

        {/* Info box - Deadline reminder OR warnings list */}
        {adminWarnings.length === 0 ? (
          <div className="flex items-start gap-3.5 p-4 bg-slate-50 border border-slate-200 rounded-xl">
            <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center shrink-0 shadow-xs">
              <Bell className="w-4.5 h-4.5 text-slate-500" />
            </div>
            <p className="text-sm text-slate-700 leading-relaxed">
              Bạn cần hoàn thành và nộp đơn ứng tuyển trong vòng <strong>3 ngày</strong> kể từ thời điểm đăng ký tài khoản
              {profile?.created_at ? (() => {
                try {
                  const d = new Date(profile.created_at)
                  const deadline = new Date(d.getTime() + 3 * 24 * 60 * 60 * 1000)
                  const time = deadline.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false })
                  const date = deadline.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
                  return ` (${time} ngày ${date}).`
                } catch { return '.' }
              })() : '.'} Sau 3 ngày, nếu chưa hoàn thành đơn, hệ thống sẽ tự động khóa tài khoản và không thể tham gia các vòng tiếp theo.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {adminWarnings.map((msg, idx) => (
              <div
                key={msg.id}
                className="border border-rose-200 bg-rose-50/40 rounded-xl p-4 space-y-2"
              >
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-rose-100 flex items-center justify-center">
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                    </div>
                    <span className="text-xs font-black text-slate-900">
                      {msg.sender_name || 'Ban Chủ nhiệm CLB iSSAC'}
                    </span>
                    <span className="text-[10px] font-black bg-rose-100 text-rose-700 border border-rose-200 px-2 py-0.5 rounded-md uppercase">
                      Cảnh báo BCN
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-[11px] text-slate-400">
                    <Clock className="w-3 h-3" />
                    {formatTime(msg.created_at)}
                  </div>
                </div>
                <div className="text-sm text-slate-800 leading-relaxed whitespace-pre-wrap pl-9">
                  {msg.content}
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-emerald-700 pl-9">
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span className="font-medium">Đã ghi nhận · Chỉ đọc</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── CARD 2: 3 STATS ───────────────────────────────── */}
      <div className="grid grid-cols-3 gap-3">
        {/* Tổng cảnh báo */}
        <div className="bg-white border-2 border-slate-200 rounded-2xl p-4 sm:p-5 text-center">
          <div className="text-3xl font-black text-slate-900 leading-none mb-2">{adminWarnings.length}</div>
          <div className="text-[11px] sm:text-xs font-semibold text-slate-500">Tổng cảnh báo</div>
        </div>

        {/* Từ BCN ISSAC */}
        <div className="bg-white border-2 border-amber-300 rounded-2xl p-4 sm:p-5 text-center">
          <div className="text-3xl font-black text-amber-600 leading-none mb-2">{adminWarnings.length}</div>
          <div className="text-[11px] sm:text-xs font-semibold text-slate-500">Từ BCN ISSAC</div>
        </div>

        {/* Không vi phạm / Đã vi phạm */}
        <div className="bg-white border-2 border-emerald-300 rounded-2xl p-4 sm:p-5 text-center">
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
            href="https://www.facebook.com/issac.vnuis"
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
