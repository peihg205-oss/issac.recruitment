'use client'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Users, Trophy, Calendar,
  FileQuestion, ShieldCheck, Download, Settings,
  LogOut, CheckSquare
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface NavItem {
  href: string
  label: string
  icon: any
  group: 'main' | 'tools'
}

const navItems: NavItem[] = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard, group: 'main' },
  { href: '/admin/candidates', label: 'Hồ sơ Ứng viên', icon: Users, group: 'main' },
  { href: '/admin/evaluation', label: 'Chấm điểm PV', icon: CheckSquare, group: 'main' },
  { href: '/admin/ranking', label: 'Bảng xếp hạng (Top 15)', icon: Trophy, group: 'main' },
  { href: '/admin/interviews', label: 'Lịch phỏng vấn', icon: Calendar, group: 'main' },
  { href: '/admin/questions', label: 'Ngân hàng câu hỏi', icon: FileQuestion, group: 'tools' },
  { href: '/admin/admin-users', label: 'Quản trị viên', icon: ShieldCheck, group: 'tools' },
  { href: '/admin/export', label: 'Xuất dữ liệu', icon: Download, group: 'tools' },
  { href: '/admin/settings', label: 'Cài đặt hệ thống', icon: Settings, group: 'tools' },
]

export function AdminSidebar({ user }: { user: { full_name?: string; email?: string; admin_role?: string; role?: string } | null }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const handleSignOut = async () => {
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
    <aside className="w-64 min-h-screen flex flex-col text-white shadow-xl flex-shrink-0" style={{background: 'linear-gradient(180deg, #0f1b4c 0%, #1e3a8a 100%)'}}>
      {/* Logo without circle frame */}
      <div className="p-5 border-b border-white/10">
        <Link href="/admin/dashboard" className="flex items-center gap-3 group">
          <Image
            src="/issac-logo.png"
            alt="iSSAC Logo"
            width={44}
            height={47}
            className="object-contain flex-shrink-0 drop-shadow-md group-hover:scale-105 transition-transform"
          />
          <div>
            <div className="font-black text-white text-base tracking-wide leading-tight">iSSAC Admin</div>
            <div className="text-xs text-blue-300 font-medium">Management Portal</div>
          </div>
        </Link>
      </div>

      {/* User info */}
      <div className="px-4 py-4 border-b border-white/10">
        <div className="flex items-center gap-3 p-3 bg-white/10 rounded-xl">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-blue-900 font-black text-sm flex-shrink-0 shadow-sm">
            {user?.full_name?.charAt(0)?.toUpperCase() || 'A'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-white text-sm truncate">{user?.full_name || 'Admin'}</div>
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
              <span className="text-xs text-blue-200">{roleLabel()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Nav list */}
      <nav className="flex-1 px-3 py-4 space-y-6 overflow-y-auto">
        <div>
          <div className="text-[10px] font-bold text-blue-300 uppercase tracking-widest px-3 mb-2">
            Tuyển sinh & Đánh giá
          </div>
          <div className="space-y-1">
            {mainItems.map((item) => {
              const active = pathname === item.href || (item.href !== '/admin/dashboard' && pathname.startsWith(item.href))
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    active
                      ? 'bg-amber-400 text-blue-950 font-bold shadow-md shadow-amber-400/20'
                      : 'text-blue-100 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${active ? 'text-blue-950' : 'text-blue-300'}`} />
                  {item.label}
                </Link>
              )
            })}
          </div>
        </div>

        <div>
          <div className="text-[10px] font-bold text-blue-300 uppercase tracking-widest px-3 mb-2">
            Công cụ & Hệ thống
          </div>
          <div className="space-y-1">
            {toolItems.map((item) => {
              const active = pathname === item.href || pathname.startsWith(item.href)
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    active
                      ? 'bg-amber-400 text-blue-950 font-bold shadow-md shadow-amber-400/20'
                      : 'text-blue-100 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${active ? 'text-blue-950' : 'text-blue-300'}`} />
                  {item.label}
                </Link>
              )
            })}
          </div>
        </div>
      </nav>

      {/* Logout */}
      <div className="p-3 border-t border-white/10">
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-red-300 hover:bg-red-500/20 hover:text-red-200 transition-colors font-medium"
        >
          <LogOut className="w-4 h-4" />
          Đăng xuất
        </button>
      </div>
    </aside>
  )
}
