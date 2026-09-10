'use client'
import { useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard, User, FileText, HelpCircle,
  Calendar, Trophy, LogOut, Bell, ChevronRight, Info, X
} from 'lucide-react'

const navItems = [
  { href: '/member/dashboard', icon: LayoutDashboard, label: 'Tổng quan' },
  { href: '/member/about', icon: Info, label: 'Giới thiệu CLB' },
  { href: '/member/profile', icon: User, label: 'Hồ sơ cá nhân' },
  { href: '/member/application', icon: FileText, label: 'Ứng tuyển' },
  { href: '/member/interview', icon: Calendar, label: 'Lịch phỏng vấn' },
  { href: '/member/result', icon: Trophy, label: 'Kết quả' },
]

interface MemberSidebarProps {
  user?: { full_name?: string; email?: string; avatar_url?: string | null }
  isOpen?: boolean
  onClose?: () => void
}

export function MemberSidebar({ user, isOpen = false, onClose }: MemberSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  // Close sidebar on route change (mobile)
  useEffect(() => {
    onClose?.()
  }, [pathname]) // eslint-disable-line react-hooks/exhaustive-deps

  const sidebarContent = (
    <aside className="w-64 h-full flex flex-col bg-white border-r border-slate-200 shrink-0">
      {/* Logo */}
      <div className="h-16 px-5 border-b border-slate-200 flex items-center justify-between shrink-0">
        <Link href="/" className="flex items-center gap-3" onClick={onClose}>
          <Image src="/issac-logo.png" alt="iSSAC" width={34} height={36} className="object-contain drop-shadow-sm shrink-0" />
          <div>
            <div className="font-black text-blue-900 text-sm leading-tight">iSSAC Portal</div>
            <div className="text-[11px] text-blue-400 font-medium">Member Dashboard</div>
          </div>
        </Link>
        {/* Close button — only visible on mobile */}
        <button
          onClick={onClose}
          className="md:hidden p-1.5 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          aria-label="Đóng menu"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="px-3 pt-3 pb-1 space-y-1">
        {navItems.map(item => {
          const active = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group',
                active
                  ? 'bg-[#1559c5] text-white shadow-sm font-bold'
                  : 'text-gray-600 hover:bg-blue-50 hover:text-blue-700'
              )}
            >
              <item.icon className={cn('w-4.5 h-4.5', active ? 'text-white' : 'text-gray-400 group-hover:text-blue-600')} size={18} />
              <span className="flex-1">{item.label}</span>
              {active && <ChevronRight className="w-3 h-3 text-blue-200" />}
            </Link>
          )
        })}
      </nav>

      {/* Mascot ISARIS */}
      <div className="flex-1 px-4 py-2 flex items-center justify-center my-auto min-h-[140px]">
        <Link
          href="/member/about"
          title="Gặp gỡ Mascot ISARIS - CLB Đại sứ Sinh viên iSSAC"
          className="group block w-full max-w-[200px] mx-auto transition-all duration-300 hover:scale-[1.04] active:scale-[0.98] focus:outline-none"
        >
          <Image
            src="/isaris-mascot.png"
            alt="Mascot ISARIS - CLB Đại sứ Sinh viên iSSAC"
            width={400}
            height={440}
            className="w-full h-auto object-contain transition-transform duration-300 group-hover:scale-105"
            priority
          />
        </Link>
      </div>

      {/* Bottom */}
      <div className="px-3 py-3 border-t border-slate-200 space-y-1 mt-auto shrink-0">
        <Link href="/member/notifications"
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
            pathname === '/member/notifications'
              ? "bg-[#1559c5] text-white shadow-sm font-bold"
              : "text-gray-600 hover:bg-blue-50 hover:text-blue-700"
          )}>
          <Bell size={18} className={pathname === '/member/notifications' ? "text-white" : "text-gray-400"} />
          <span className="flex-1">Thông báo</span>
        </Link>
        <button onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition-all cursor-pointer">
          <LogOut size={18} />
          Đăng xuất
        </button>
      </div>
    </aside>
  )

  return (
    <>
      {/* Desktop: always visible */}
      <div className="hidden md:flex h-screen flex-shrink-0">
        {sidebarContent}
      </div>

      {/* Mobile: overlay drawer */}
      {isOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />
          {/* Drawer */}
          <div className="relative h-full">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  )
}
