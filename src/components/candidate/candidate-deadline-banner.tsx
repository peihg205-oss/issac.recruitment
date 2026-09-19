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
      {/* Outer shimmer border glow */}
      <div className="relative flex flex-col sm:flex-row min-h-[100px]">

        {/* ── LEFT: Orange countdown panel ── */}
        <div className="relative sm:w-[230px] shrink-0 flex flex-col items-center justify-center gap-3
                        px-5 py-5 sm:py-6
                        bg-gradient-to-br from-amber-400/40 via-orange-300/25 to-amber-100/60
                        border-b-2 sm:border-b-0 sm:border-r-2 border-amber-300/60">

          {/* Badge — fixed single line, no break */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full
                          bg-amber-500 text-white shadow-sm self-start
                          text-[10px] font-black uppercase tracking-wide whitespace-nowrap">
            <Bell className="w-3 h-3 shrink-0" />
            THÔNG BÁO TỪ BAN TUYỂN QUÂN
          </div>

          {/* Clock + countdown — perfectly centered row, no wrapping */}
          <div className="flex items-center gap-4 w-full">
            {/* Clock with animated halo rings */}
            <div className="relative shrink-0 flex items-center justify-center w-16 h-16">
              {/* Outer animated ring */}
              <div className="absolute w-16 h-16 rounded-full bg-rose-400/30 animate-pulse-ring-slow" />
              {/* Inner animated ring */}
              <div className="absolute w-16 h-16 rounded-full bg-rose-400/20 animate-pulse-ring" />
              {/* Clock disc */}
              <div className="relative w-14 h-14 rounded-full bg-gradient-to-br from-rose-500 to-rose-700
                              flex items-center justify-center
                              shadow-xl shadow-rose-500/50">
                <Clock className="w-7 h-7 text-white drop-shadow" />
              </div>
            </div>

            {/* Countdown text — nowrap */}
            <div className="min-w-0">
              <div className="text-[11px] font-bold text-amber-800 leading-none mb-1">Còn lại:</div>
              <div className="text-xl sm:text-2xl font-black text-rose-700 leading-none whitespace-nowrap animate-countdown-pop">
                {status.remainingText}
              </div>
            </div>
          </div>
        </div>

        {/* ── RIGHT: Info + CTA ── */}
        <div className="flex-1 flex flex-col justify-center gap-3
                        px-5 py-5 sm:py-6
                        bg-gradient-to-br from-[#fffbf2] to-[#fff7e6]">

          {/* Deadline heading */}
          <div className="flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-amber-600 shrink-0" />
            <p className="text-sm font-bold text-slate-700 leading-snug">
              Hạn chót điền đơn:{' '}
              <span className="text-[#1657c1] font-black">{status.deadlineFormatted}</span>
            </p>
          </div>

          {/* Description */}
          <p className="text-xs text-slate-600 leading-relaxed">
            Bạn cần hoàn thành và nộp đơn ứng tuyển trong vòng <strong>3 ngày</strong> kể từ thời điểm
            đăng ký tài khoản ({status.createdFormatted}). Sau 3 ngày, nếu chưa hoàn thành đơn, hệ thống
            sẽ tự động khóa tài khoản và không thể tham gia các vòng tiếp theo.
          </p>

          {/* CTA with shimmer animation */}
          <div>
            <Link
              href="/member/application"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-sm text-white
                         relative overflow-hidden transition-all active:scale-95 hover:shadow-lg hover:shadow-amber-400/40
                         shadow-md"
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

