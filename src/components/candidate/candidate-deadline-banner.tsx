'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Clock, AlertTriangle, Lock, ArrowRight, Bell, CalendarDays } from 'lucide-react'
import { computeCandidateDeadlineStatus, CandidateDeadlineStatus } from '@/lib/candidate-deadline-manager'

interface CandidateDeadlineBannerProps {
  userId?: string | null
  createdAt?: string | Date | null
  hasApplication?: boolean
}

export function CandidateDeadlineBanner({
  userId,
  createdAt,
  hasApplication = false,
}: CandidateDeadlineBannerProps) {
  const pathname = usePathname()
  const [currentTime, setCurrentTime] = useState(Date.now())

  // Refresh every 10 seconds to keep remaining countdown accurate
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Date.now())
    }, 10000)
    return () => clearInterval(timer)
  }, [])

  // Listen for admin extension events
  useEffect(() => {
    const handleExtension = () => {
      setCurrentTime(Date.now())
    }
    window.addEventListener('issac_candidate_extended', handleExtension)
    return () => window.removeEventListener('issac_candidate_extended', handleExtension)
  }, [])

  const status: CandidateDeadlineStatus = useMemo(() => {
    return computeCandidateDeadlineStatus(createdAt, hasApplication, userId)
  }, [createdAt, hasApplication, userId, currentTime])

  // If already submitted application, no banner needed
  if (status.hasApplication) {
    return null
  }

  // CASE 1: LOCKED (Over 3 days, no application)
  if (status.isLocked) {
    const isMessagesPage = pathname === '/member/messages'

    return (
      <div className="mb-6 rounded-2xl bg-rose-50 border-2 border-rose-300 p-4 sm:p-5 shadow-xs animate-fade-in text-rose-950">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Lock className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-black uppercase tracking-wider bg-rose-200 text-rose-900 px-2 py-0.5 rounded-md">
                  Tài khoản đã bị tạm khóa
                </span>
                <span className="text-xs font-bold text-rose-800">
                  Quá hạn 3 ngày nộp đơn ứng tuyển
                </span>
              </div>
              <p className="text-xs text-rose-900 leading-relaxed max-w-2xl font-medium">
                Tài khoản được đăng ký lúc <strong>{status.createdFormatted}</strong>. Hạn chót hoàn thành đơn ứng tuyển là 3 ngày (đã kết thúc lúc <strong>{status.deadlineFormatted}</strong>). Do bạn chưa hoàn thành nộp đơn Vòng 1, tài khoản đã bị khóa quyền nộp đơn và không thể tham gia các vòng tiếp theo.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
            {!isMessagesPage && (
              <Link
                href="/member/messages"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
              >
                <AlertTriangle className="w-4 h-4" />
                <span>Xem cảnh báo từ BCN</span>
              </Link>
            )}
          </div>
        </div>
      </div>
    )
  }

  // CASE 2: ACTIVE COUNTDOWN (Within 3 days)
  return (
    <div className="mb-6 rounded-2xl overflow-hidden border-2 border-amber-300/70 shadow-md animate-slide-up">
      {/*
        Grid layout:
          col-1 (left, fixed 200px): badge | clock+countdown
          col-2 (right, flex-1):     deadline | description | CTA
        Row-1: badge + deadline  — same top padding → visually aligned
        Row-2: clock  + body
      */}
      <div className="grid grid-cols-1 sm:grid-cols-[200px_1fr]">

        {/* ── ROW 1, COL 1: Badge ── */}
        <div className="flex items-center px-4 pt-4 pb-2
                        bg-gradient-to-br from-amber-400/40 via-orange-200/30 to-amber-100/50
                        sm:border-r-2 border-amber-300/60">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full
                          bg-amber-500 text-white shadow-sm
                          text-[9px] font-black uppercase tracking-wide leading-none">
            <Bell className="w-2.5 h-2.5 shrink-0" />
            THÔNG BÁO TỪ BAN TUYỂN QUÂN
          </div>
        </div>

        {/* ── ROW 1, COL 2: Deadline title ── */}
        <div className="flex items-center px-5 pt-4 pb-2
                        bg-gradient-to-br from-[#fffbf2] to-[#fff7e6]">
          <div className="flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-amber-600 shrink-0" />
            <p className="text-sm font-bold text-slate-700 leading-snug">
              Hạn chót điền đơn:{' '}
              <span className="text-[#1657c1] font-black">{status.deadlineFormatted}</span>
            </p>
          </div>
        </div>

        {/* ── ROW 2, COL 1: Clock + countdown ── */}
        <div className="flex items-center gap-3 px-4 pb-4 pt-2
                        bg-gradient-to-br from-amber-400/40 via-orange-200/30 to-amber-100/50
                        sm:border-r-2 border-t border-amber-200/60">
          {/* Clock with ping animation */}
          <div className="relative shrink-0 flex items-center justify-center w-[52px] h-[52px]">
            {/* Ping ring 1 */}
            <span className="absolute inline-flex w-full h-full rounded-full bg-rose-400/50 animate-ping" />
            {/* Ping ring 2 — slower, delayed */}
            <span className="absolute inline-flex w-[44px] h-[44px] rounded-full bg-rose-400/30"
              style={{ animation: 'ping 1.8s cubic-bezier(0, 0, 0.2, 1) 0.6s infinite' }} />
            {/* Clock disc */}
            <div className="relative w-[52px] h-[52px] rounded-full
                            bg-gradient-to-br from-rose-500 to-rose-700
                            flex items-center justify-center
                            shadow-lg shadow-rose-500/50">
              <Clock className="w-6 h-6 text-white drop-shadow" />
            </div>
          </div>

          {/* Countdown text */}
          <div>
            <div className="text-[10px] font-bold text-amber-800 leading-none mb-0.5">Còn lại:</div>
            <div className="text-xl font-black text-rose-700 leading-none whitespace-nowrap animate-countdown-pop">
              {status.remainingText}
            </div>
          </div>
        </div>

        {/* ── ROW 2, COL 2: Description + CTA ── */}
        <div className="flex flex-col justify-center gap-3 px-5 pb-4 pt-2
                        bg-gradient-to-br from-[#fffbf2] to-[#fff7e6]
                        border-t border-amber-100">
          <p className="text-xs text-slate-600 leading-relaxed">
            Bạn cần hoàn thành và nộp đơn ứng tuyển trong vòng <strong>3 ngày</strong> kể từ thời điểm
            đăng ký tài khoản ({status.createdFormatted}). Sau 3 ngày, nếu chưa hoàn thành đơn, hệ thống
            sẽ tự động khóa tài khoản và không thể tham gia các vòng tiếp theo.
          </p>

          {/* CTA with shimmer */}
          <div>
            <Link
              href="/member/application"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-sm text-white
                         transition-all active:scale-95 hover:shadow-lg hover:shadow-amber-400/40 shadow-md"
              style={{
                background: 'linear-gradient(90deg, #f59e0b 0%, #fbbf24 40%, #f59e0b 60%, #f97316 100%)',
                backgroundSize: '200% 100%',
                animation: 'shimmer 2.4s linear infinite',
              }}
            >
              Điền đơn ứng tuyển ngay
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

      </div>
    </div>
  )
}
