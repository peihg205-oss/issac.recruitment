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

  // CASE 2: ACTIVE COUNTDOWN (Within 3 days) — match screenshot design
  return (
    <div className="mb-6 rounded-2xl overflow-hidden border border-amber-200 shadow-sm animate-fade-in">
      <div className="flex flex-col sm:flex-row bg-gradient-to-br from-[#fff8ee] to-[#fff3e0]">

        {/* ── LEFT: Orange countdown panel ─────────────────────── */}
        <div className="relative sm:w-[210px] shrink-0 flex flex-col justify-between gap-4 px-5 pt-4 pb-5
                        bg-gradient-to-br from-amber-100/80 via-orange-50 to-amber-50
                        border-b sm:border-b-0 sm:border-r border-amber-200">

          {/* Badge */}
          <span className="inline-flex items-center gap-1.5 self-start px-3 py-1.5 rounded-full
                           bg-amber-500 text-white text-[10px] font-black uppercase tracking-wide shadow-sm leading-tight">
            <Bell className="w-3 h-3 shrink-0" />
            THÔNG BÁO TỪ BAN<br className="hidden" />TUYỂN QUÂN
          </span>

          {/* Clock + remaining time */}
          <div className="flex items-center gap-3">
            {/* Animated clock with halo rings */}
            <div className="relative shrink-0 w-14 h-14 flex items-center justify-center">
              {/* Outer halo */}
              <div className="absolute inset-0 rounded-full bg-rose-300/25 scale-[1.55]" />
              {/* Inner halo */}
              <div className="absolute inset-0 rounded-full bg-rose-300/20 scale-[1.25]" />
              {/* Clock circle */}
              <div className="relative w-14 h-14 rounded-full bg-rose-600 flex items-center justify-center shadow-lg shadow-rose-500/40">
                <Clock className="w-7 h-7 text-white" />
              </div>
            </div>

            {/* Countdown text */}
            <div>
              <div className="text-[11px] font-bold text-amber-700 mb-0.5">Còn lại:</div>
              <div className="text-xl font-black text-rose-700 leading-none">
                {status.remainingText}
              </div>
            </div>
          </div>
        </div>

        {/* ── RIGHT: Deadline info + CTA ───────────────────────── */}
        <div className="flex-1 flex flex-col justify-between gap-3 px-5 py-4 sm:py-5">
          <div className="space-y-2">
            {/* Deadline date */}
            <div className="flex items-center gap-2 flex-wrap">
              <CalendarDays className="w-4 h-4 text-slate-500 shrink-0" />
              <span className="text-sm font-bold text-slate-700">
                Hạn chót điền đơn:{' '}
                <span className="text-[#1657c1] font-black">{status.deadlineFormatted}</span>
              </span>
            </div>

            {/* Description */}
            <p className="text-xs text-slate-600 leading-relaxed max-w-lg">
              Bạn cần hoàn thành và nộp đơn ứng tuyển trong vòng <strong>3 ngày</strong> kể từ thời điểm đăng ký tài khoản ({status.createdFormatted}). Sau 3 ngày, nếu chưa hoàn thành đơn, hệ thống sẽ tự động khóa tài khoản và không thể tham gia các vòng tiếp theo.
            </p>
          </div>

          {/* CTA Button */}
          <div>
            <Link
              href="/member/application"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl
                         bg-amber-500 hover:bg-amber-600 active:scale-95
                         text-white text-sm font-black shadow-sm transition-all"
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
