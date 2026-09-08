'use client'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard, User, FileText, HelpCircle,
  Calendar, Trophy, LogOut, Bell, ChevronRight, Info
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
}

export function MemberSidebar({ user }: MemberSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <aside className="w-64 min-h-screen flex flex-col bg-white border-r border-slate-200 shrink-0">
      {/* Logo - Matching exact h-16 height and border with top header */}
      <div className="h-16 px-5 border-b border-slate-200 flex items-center shrink-0">
        <Link href="/" className="flex items-center gap-3">
          <Image src="/issac-logo.png" alt="iSSAC" width={34} height={36} className="object-contain drop-shadow-sm shrink-0" />
          <div>
            <div className="font-black text-blue-900 text-sm leading-tight">iSSAC Portal</div>
            <div className="text-[11px] text-blue-400 font-medium">Member Dashboard</div>
          </div>
        </Link>
      </div>



      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
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

      {/* Bottom */}
      <div className="px-3 py-4 border-t border-slate-200 space-y-1">
        <Link href="/member/notifications"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-blue-50 hover:text-blue-700 transition-all">
          <Bell size={18} className="text-gray-400" />
          Thông báo
        </Link>
        <button onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition-all">
          <LogOut size={18} />
          Đăng xuất
        </button>
      </div>
    </aside>
  )
}
