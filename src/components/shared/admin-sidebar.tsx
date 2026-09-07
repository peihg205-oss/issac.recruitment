'use client'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard, Users, Trophy, Calendar,
  FileQuestion, ShieldCheck, Download, Settings,
  LogOut, CheckSquare, Crown, Megaphone, MessageSquare
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { ADMIN_ROLE_CONFIGS, type AdminRoleType } from '@/lib/permissions'

interface NavItem {
  href: string
  label: string
  icon: any
  group: 'main' | 'tools'
  superAdminOnly?: boolean
}

const navItems: NavItem[] = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard, group: 'main' },
  { href: '/admin/candidates', label: 'Hồ sơ Ứng viên', icon: Users, group: 'main' },
  { href: '/admin/evaluation', label: 'Chấm điểm PV', icon: CheckSquare, group: 'main' },
  { href: '/admin/ranking', label: 'Bảng xếp hạng (Top 15)', icon: Trophy, group: 'main' },
  { href: '/admin/interviews', label: 'Lịch phỏng vấn', icon: Calendar, group: 'main' },
  { href: '/admin/questions', label: 'Ngân hàng câu hỏi', icon: FileQuestion, group: 'tools' },
  { href: '/admin/admin-users', label: 'Cấp tài khoản Ban', icon: ShieldCheck, group: 'tools', superAdminOnly: true },
  { href: '/admin/export', label: 'Xuất dữ liệu', icon: Download, group: 'tools' },
  { href: '/admin/settings', label: 'Cài đặt hệ thống', icon: Settings, group: 'tools', superAdminOnly: true },
]

export function AdminSidebar({ user }: { user: { full_name?: string; email?: string; admin_role?: string; role?: string } | null }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const handleSignOut = async () => {
    // Clear demo cookie if any
    document.cookie = 'issac_admin_role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const roleKey = (user?.admin_role && user.admin_role in ADMIN_ROLE_CONFIGS ? user.admin_role : 'chu-nhiem') as AdminRoleType
  const currentConfig = ADMIN_ROLE_CONFIGS[roleKey] || ADMIN_ROLE_CONFIGS['chu-nhiem']
  const isSuper = currentConfig.isSuperAdmin

  const mainItems = navItems.filter(n => n.group === 'main')
  const toolItems = navItems.filter(n => n.group === 'tools')

  const getRoleIcon = () => {
    switch (roleKey) {
      case 'chu-nhiem':
        return <Crown className="w-3.5 h-3.5 text-amber-400" />
      case 'truyen-thong':
        return <Megaphone className="w-3.5 h-3.5 text-blue-300" />
      case 'tu-van':
        return <MessageSquare className="w-3.5 h-3.5 text-emerald-300" />
      case 'nhan-su':
        return <Users className="w-3.5 h-3.5 text-purple-300" />
      default:
        return <Crown className="w-3.5 h-3.5 text-amber-400" />
    }
  }

  return (
    <aside className="w-64 min-h-screen flex flex-col text-white shadow-xl flex-shrink-0" style={{background: 'linear-gradient(180deg, #1559c5 0%, #0d3d8a 100%)'}}>
      {/* Brand Header */}
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
            <div className="text-[11px] text-blue-300 font-medium">Recruitment Portal</div>
          </div>
        </Link>
      </div>

      {/* User / Department Account Badge (Clean & Professional) */}
      <div className="px-4 py-3.5 border-b border-white/10">
        <div className="flex items-center gap-3 p-3 bg-white/5 border border-white/10 rounded-2xl">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 border border-white/20 flex items-center justify-center text-white font-black text-sm flex-shrink-0 shadow-sm">
            {user?.full_name ? user.full_name.charAt(0).toUpperCase() : 'A'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-bold text-white text-xs truncate">
              {user?.full_name || 'Admin'}
            </div>
            <div className="flex items-center gap-1.5 mt-1">
              {getRoleIcon()}
              <span className="text-[11px] font-semibold text-blue-200 truncate">
                {currentConfig.shortLabel}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Nav List */}
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
                  className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                    active
                      ? 'bg-[#fdc455] text-gray-950 font-black font-bold shadow-md shadow-amber-400/20'
                      : 'text-blue-100 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${active ? 'text-blue-950' : 'text-blue-300'}`} />
                  <span className="flex-1">{item.label}</span>
                  {item.href === '/admin/evaluation' && !isSuper && (
                    <span className="text-[10px] bg-blue-500/30 px-1.5 py-0.5 rounded text-blue-200">
                      Ban mình
                    </span>
                  )}
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
              const isLocked = item.superAdminOnly && !isSuper

              if (isLocked) {
                return null // Cleanly hide admin-only management tools for departmental users
              }

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                    active
                      ? 'bg-amber-400 text-blue-950 font-bold shadow-md shadow-amber-400/20'
                      : 'text-blue-100 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${active ? 'text-blue-950' : 'text-blue-300'}`} />
                  <span className="flex-1">{item.label}</span>
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
          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-red-300 hover:bg-red-500/20 hover:text-red-200 transition-colors font-medium"
        >
          <LogOut className="w-4 h-4" />
          Đăng xuất
        </button>
      </div>
    </aside>
  )
}
