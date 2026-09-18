'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Clock, AlertTriangle, Lock, ShieldAlert, ArrowRight, MessageSquare } from 'lucide-react'
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
    const isAboutPage = pathname === '/member/about'

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
    <div className="mb-6 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-300/80 p-4 sm:p-5 shadow-2xs animate-fade-in text-amber-950">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
            <Clock className="w-5 h-5 animate-pulse" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-black uppercase tracking-wider bg-amber-200 text-amber-900 px-2 py-0.5 rounded-md">
                Thông báo từ Ban Tuyển quân
              </span>
              <span className="text-xs font-bold text-amber-900">
                Hạn chót điền đơn: {status.deadlineFormatted}
              </span>
              <span className="text-[11px] font-black bg-rose-500 text-white px-2 py-0.5 rounded-full animate-bounce">
                Còn lại: {status.remainingText}
              </span>
            </div>
            <p className="text-xs text-amber-900 leading-relaxed max-w-2xl font-medium">
              Bạn cần hoàn thành và nộp đơn ứng tuyển trong vòng <strong>3 ngày</strong> kể từ thời điểm đăng ký tài khoản ({status.createdFormatted}). Sau 3 ngày, nếu chưa hoàn thành đơn, hệ thống sẽ tự động khóa tài khoản và không thể tham gia các vòng tiếp theo.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
          <Link
            href="/member/application"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
          >
            <span>Điền đơn ứng tuyển ngay</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  )
}
