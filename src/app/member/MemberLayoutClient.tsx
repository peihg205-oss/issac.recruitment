'use client'
import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { MemberSidebar } from '@/components/shared/member-sidebar'
import { MemberNotificationBell } from '@/components/shared/member-notification-bell'
import { Home, Menu, AlertTriangle } from 'lucide-react'
import { useMemberChatUnread } from '@/hooks/use-chat-unread'
import { CandidateDeadlineBanner } from '@/components/candidate/candidate-deadline-banner'

interface MemberLayoutClientProps {
  children: React.ReactNode
  userProfile: {
    id?: string
    full_name: string
    email: string
    student_id: string | null
    cohort: string | null
    avatar_url: string | null
    role: string
    deptName: string | null
    createdAt?: string | null
    hasApplication?: boolean
  }
  studentDisplay: string
}

export function MemberLayoutClient({ children, userProfile, studentDisplay }: MemberLayoutClientProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const chatUnread = useMemberChatUnread()

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans">
      <MemberSidebar
        user={userProfile}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        chatUnread={chatUnread}
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header - Luôn nằm trên các phần tử bên dưới (z-[9999] isolate) */}
        <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between shrink-0 relative z-[9999] isolate">
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Hamburger — only on mobile */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors"
              aria-label="Mở menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="w-9 h-9 rounded-xl bg-white border border-slate-200/90 p-1 flex items-center justify-center shadow-2xs shrink-0">
              <Image
                src="/issac-logo.png"
                alt="iSSAC Logo"
                width={28}
                height={28}
                className="object-contain"
                priority
              />
            </div>
            <div>
              <div className="flex items-center">
                <span className="text-xs font-black uppercase tracking-wider text-[#1657c1] leading-tight">
                  <span className="hidden sm:inline">Cổng Tuyển quân Đại sứ Sinh viên Gen 3</span>
                  <span className="sm:hidden">iSSAC Portal</span>
                </span>
              </div>
              <div className="text-[11px] text-slate-500 font-medium hidden md:block">
                CLB Đại sứ Sinh viên Trường Quốc tế - ĐHQGHN (iSSAC)
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/"
              className="flex items-center justify-center w-9 h-9 rounded-xl bg-slate-100 hover:bg-blue-50 hover:text-[#1657c1] text-slate-600 border border-slate-200/80 transition-all"
              title="Về Trang chủ"
            >
              <Home className="w-4.5 h-4.5" />
            </Link>

            {/* Quick Cảnh báo của BCN iSSAC & Realtime Unread Counter */}
            <Link
              href="/member/messages"
              className={`relative flex items-center justify-center w-9 h-9 rounded-xl border transition-all ${
                chatUnread > 0
                  ? 'bg-rose-500 text-white border-rose-600 shadow-md shadow-rose-500/50 animate-pulse'
                  : 'bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-300'
              }`}
              title="Cảnh báo của Ban Chủ nhiệm iSSAC"
            >
              <AlertTriangle className={`w-4.5 h-4.5 ${chatUnread > 0 ? 'text-white' : 'text-amber-600'}`} />
              {chatUnread > 0 && (
                <span className="absolute -top-1.5 -right-1.5 min-w-[20px] h-[20px] px-1 bg-rose-600 text-white text-[11px] font-black rounded-full flex items-center justify-center animate-bounce shadow-md shadow-rose-500/80 ring-2 ring-white">
                  {chatUnread > 9 ? '9+' : chatUnread}
                </span>
              )}
            </Link>

            {/* Realtime Notification Bell */}
            <MemberNotificationBell />

            {/* User Card */}
            <Link
              href="/member/profile"
              className="flex items-center gap-2 sm:gap-3 p-1.5 sm:px-3 sm:py-1.5 rounded-2xl bg-blue-50/80 hover:bg-blue-100/80 border border-blue-200/80 transition-all group"
              title="Xem và cập nhật hồ sơ cá nhân"
            >
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#1657c1] flex items-center justify-center text-white font-bold text-sm shadow-xs shrink-0">
                {userProfile.full_name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <div className="text-left min-w-0 pr-1 hidden sm:block">
                <div className="font-bold text-slate-900 text-xs sm:text-sm truncate group-hover:text-[#1657c1] transition-colors max-w-[120px]">
                  {userProfile.full_name}
                </div>
                <div className="text-[11px] font-semibold text-slate-600 truncate max-w-[120px]">
                  {studentDisplay}
                </div>
              </div>
            </Link>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto relative z-0">
          <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">
            <CandidateDeadlineBanner
              userId={userProfile.id}
              createdAt={userProfile.createdAt}
              hasApplication={userProfile.hasApplication}
            />
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
