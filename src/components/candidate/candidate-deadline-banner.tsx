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
    <div className="mb-6 rounded-2xl overflow-hidden border-2 border-amber-400/90 shadow-md animate-slide-up">
      <div className="flex flex-col sm:flex-row">

        {/* ══ LEFT PANEL: Deeper warm amber tone, zero glare, spacious ══ */}
        <div className="sm:w-[320px] w-full shrink-0 flex flex-col justify-between
                        bg-gradient-to-br from-amber-100 via-orange-100/70 to-amber-50/90
                        border-b-2 sm:border-b-0 sm:border-r-2 border-amber-400/80">

          {/* Row A: Badge */}
          <div className="flex items-center px-5 pt-4 pb-2">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full
                            bg-amber-600 text-white shadow-sm
                            text-[11px] font-black uppercase tracking-wider leading-none">
              <Bell className="w-3.5 h-3.5 shrink-0" />
              THÔNG BÁO TỪ BAN TUYỂN QUÂN
            </div>
          </div>

          {/* Row B: Clock + countdown (larger fonts, centered, high contrast) */}
          <div className="flex-1 flex items-center justify-center gap-4 px-5 pb-5 pt-2">
            {/* Clock with continuous radar ping animation */}
            <div className="relative shrink-0 flex items-center justify-center w-[58px] h-[58px]">
              {/* Outer ping ring */}
              <span className="absolute inline-flex w-full h-full rounded-full bg-rose-500/30 animate-ping" />
              {/* Inner delayed ping */}
              <span
                className="absolute inline-flex w-[48px] h-[48px] rounded-full bg-rose-500/20"
                style={{ animation: 'ping 1.8s cubic-bezier(0,0,0.2,1) 0.5s infinite' }}
              />
              {/* Clock disc */}
              <div className="relative w-[58px] h-[58px] rounded-full
                              bg-gradient-to-br from-rose-600 to-rose-800
                              flex items-center justify-center
                              shadow-lg shadow-rose-600/40">
                <Clock className="w-7 h-7 text-white" />
              </div>
            </div>

            {/* Countdown text — larger, high contrast, blinks continuously */}
            <div className="min-w-0">
              <div className="text-xs font-black text-amber-950 leading-none mb-1.5 uppercase tracking-wider">
                Còn lại:
              </div>
              <div className="text-2xl sm:text-3xl font-black text-rose-700 leading-none whitespace-nowrap animate-banner-blink">
                {status.remainingText}
              </div>
            </div>
          </div>
        </div>

        {/* ══ RIGHT PANEL: Crisp text, deeper warm tones, larger font ══ */}
        <div className="flex-1 flex flex-col justify-between gap-3.5 px-6 sm:px-8 py-5 sm:py-6
                        bg-gradient-to-br from-white via-[#fffdf9] to-[#fff9ee]">

          {/* Deadline heading */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-100/90 border border-amber-200 flex items-center justify-center text-amber-700 shrink-0">
              <CalendarDays className="w-4.5 h-4.5" />
            </div>
            <p className="text-base sm:text-lg font-black text-slate-900 leading-snug">
              Hạn chót điền đơn:{' '}
              <span className="text-[#1657c1] font-black underline decoration-blue-300 underline-offset-4">
                {status.deadlineFormatted}
              </span>
            </p>
          </div>

          {/* Description — larger, darker, highly legible text */}
          <p className="text-xs sm:text-sm text-slate-800 leading-relaxed font-medium">
            Bạn cần hoàn thành và nộp đơn ứng tuyển trong vòng <strong className="text-amber-950 font-black">3 ngày</strong> kể từ thời điểm
            đăng ký tài khoản ({status.createdFormatted}). Sau 3 ngày, nếu chưa hoàn thành đơn, hệ thống
            sẽ tự động khóa tài khoản và không thể tham gia các vòng tiếp theo.
          </p>

          {/* CTA button with rich amber-orange gradient */}
          <div>
            <Link
              href="/member/application"
              className="inline-flex items-center gap-2.5 px-6 py-3 rounded-xl font-black text-sm sm:text-base text-white
                         bg-gradient-to-r from-amber-600 via-orange-500 to-amber-600 hover:from-amber-700 hover:to-orange-600
                         transition-all active:scale-95 shadow-md shadow-orange-500/25 hover:shadow-lg hover:shadow-orange-500/35"
            >
              <span>Điền đơn ứng tuyển ngay</span>
              <ArrowRight className="w-4.5 h-4.5" />
            </Link>
          </div>
        </div>

      </div>
    </div>
  )
}

