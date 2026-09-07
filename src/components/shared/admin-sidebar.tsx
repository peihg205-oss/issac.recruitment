'use client'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard, Users, HelpCircle, Calendar,
  ClipboardList, BarChart3, Download, Settings,
  LogOut, Crown, ChevronRight, Shield
} from 'lucide-react'

const navItems = [
  { href: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard', group: 'main' },
  { href: '/admin/candidates', icon: Users, label: 'Ứng viên', group: 'main' },
  { href: '/admin/questions', icon: HelpCircle, label: 'Câu hỏi', group: 'main' },
  { href: '/admin/interviews', icon: Calendar, label: 'Lịch phỏng vấn', group: 'main' },
  { href: '/admin/evaluation', icon: ClipboardList, label: 'Đánh giá', group: 'main' },
  { href: '/admin/ranking', icon: BarChart3, label: 'Xếp hạng', group: 'main' },
  { href: '/admin/export', icon: Download, label: 'Xuất dữ liệu', group: 'tools' },
  { href: '/admin/admin-users', icon: Shield, label: 'Quản lý ban', group: 'tools' },
  { href: '/admin/settings', icon: Settings, label: 'Cài đặt', group: 'tools' },
]

interface AdminSidebarProps {
  user?: { full_name?: string; email?: string; admin_role?: string | null }
}

export function AdminSidebar({ user }: AdminSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const mainItems = navItems.filter(n => n.group === 'main')
  const toolItems = navItems.filter(n => n.group === 'tools')

  const roleLabel = () => {
    switch (user?.admin_role) {
      case 'chu-nhiem': return 'Ban Chủ nhiệm'
      case 'nhan-su': return 'Ban Nhân sự'
      case 'truyen-thong': return 'Ban Truyền thông'
      case 'tu-van': return 'Ban Tư vấn'
      default: return 'Admin'
    }
  }

  return (
    <aside className="w-64 min-h-screen flex flex-col text-white shadow-xl" style={{background: 'linear-gradient(180deg, #0f1b4c 0%, #1e3a8a 100%)'}}>
      {/* Logo */}
      <div className="p-5 border-b border-white/10">
        <Link href="/admin/dashboard" className="flex items-center gap-3">
          <Image src="/issac-logo.png" alt="iSSAC" width={36} height={36} className="rounded-full border-2 border-white/20" />
          <div>
            <div className="font-black text-white text-sm">iSSAC Admin</div>
            <div className="text-xs text-blue-300">Management Portal</div>
          </div>
        </Link>
      </div>

      {/* User info */}
      <div className="px-4 py-4 border-b border-white/10">
        <div className="flex items-center gap-3 p-3 bg-white/10 rounded-xl">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-blue-900 font-black text-sm flex-shrink-0">
            {user?.full_name?.charAt(0)?.toUpperCase() || 'A'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-white text-sm truncate">{user?.full_name || 'Admin'}</div>
            <div className="flex items-center gap-1">
              <Crown className="w-3 h-3 text-amber-400" />
              <span className="text-xs text-blue-300">{roleLabel()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        <div className="text-xs font-semibold text-blue-400 uppercase tracking-wider px-3 mb-2">Quản lý</div>
        {mainItems.map(item => {
          const active = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group',
                active
                  ? 'bg-white/20 text-white shadow-sm border border-white/10'
                  : 'text-blue-200 hover:bg-white/10 hover:text-white'
              )}
            >
              <item.icon size={18} className={active ? 'text-amber-400' : 'text-blue-300 group-hover:text-white'} />
              <span className="flex-1">{item.label}</span>
              {active && <ChevronRight className="w-3 h-3 text-white/50" />}
            </Link>
          )
        })}

        <div className="text-xs font-semibold text-blue-400 uppercase tracking-wider px-3 mt-4 mb-2">Công cụ</div>
        {toolItems.map(item => {
          const active = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group',
                active
                  ? 'bg-white/20 text-white shadow-sm border border-white/10'
                  : 'text-blue-200 hover:bg-white/10 hover:text-white'
              )}
            >
              <item.icon size={18} className={active ? 'text-amber-400' : 'text-blue-300 group-hover:text-white'} />
              <span className="flex-1">{item.label}</span>
              {active && <ChevronRight className="w-3 h-3 text-white/50" />}
            </Link>
          )
        })}
      </nav>

      {/* Bottom */}
      <div className="px-3 py-4 border-t border-white/10">
        <button onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-300 hover:bg-red-500/20 hover:text-red-200 transition-all">
          <LogOut size={18} />
          Đăng xuất
        </button>
      </div>
    </aside>
  )
}
