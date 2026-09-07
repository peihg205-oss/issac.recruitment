'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard, Users, Trophy, Calendar,
  FileQuestion, ShieldCheck, Download, Settings,
  LogOut, CheckSquare, Shield, ChevronRight
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
  { href: '/admin/admin-users', label: 'Quản trị viên', icon: ShieldCheck, group: 'tools', superAdminOnly: true },
  { href: '/admin/export', label: 'Xuất dữ liệu', icon: Download, group: 'tools' },
  { href: '/admin/settings', label: 'Cài đặt hệ thống', icon: Settings, group: 'tools', superAdminOnly: true },
]

export function AdminSidebar({ user }: { user: { full_name?: string; email?: string; admin_role?: string; role?: string } | null }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  // Active role state
  const initialRole = (user?.admin_role && user.admin_role in ADMIN_ROLE_CONFIGS ? user.admin_role : 'chu-nhiem') as AdminRoleType
  const [activeRole, setActiveRole] = useState<AdminRoleType>(initialRole)

  useEffect(() => {
    // Read from cookie if present
    const match = document.cookie.match(/issac_admin_role=([^;]+)/)
    if (match && match[1] in ADMIN_ROLE_CONFIGS) {
      setActiveRole(match[1] as AdminRoleType)
    }
  }, [])

  const handleSwitchRole = (newRole: AdminRoleType) => {
    setActiveRole(newRole)
    document.cookie = `issac_admin_role=${newRole}; path=/; max-age=2592000`
    router.refresh()
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const currentConfig = ADMIN_ROLE_CONFIGS[activeRole] || ADMIN_ROLE_CONFIGS['chu-nhiem']
  const isSuper = currentConfig.isSuperAdmin

  const mainItems = navItems.filter(n => n.group === 'main')
  const toolItems = navItems.filter(n => n.group === 'tools')

  return (
    <aside className="w-64 min-h-screen flex flex-col text-white shadow-xl flex-shrink-0" style={{background: 'linear-gradient(180deg, #0f1b4c 0%, #1e3a8a 100%)'}}>
      {/* Logo */}
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
            <div className="text-xs text-blue-300 font-medium">Recruitment Portal</div>
          </div>
        </Link>
      </div>

      {/* Role / Department Switcher */}
      <div className="px-4 py-3.5 bg-black/30 border-b border-white/10">
        <div className="flex items-center justify-between text-[11px] font-bold text-amber-300 uppercase tracking-wider mb-1.5">
          <span className="flex items-center gap-1">
            <Shield className="w-3.5 h-3.5 text-amber-400" />
            Đăng nhập theo Ban
          </span>
          <span className="text-[9px] bg-amber-400/20 text-amber-300 border border-amber-400/30 px-1.5 py-0.2 rounded font-mono">
            Phân quyền
          </span>
        </div>

        <select
          value={activeRole}
          onChange={(e) => handleSwitchRole(e.target.value as AdminRoleType)}
          className="w-full bg-slate-900 border border-blue-400/50 rounded-xl px-2.5 py-2 text-xs text-white font-bold focus:outline-none focus:ring-2 focus:ring-amber-400 cursor-pointer shadow-inner"
        >
          <option value="chu-nhiem">👑 Ban Chủ nhiệm (Full quyền)</option>
          <option value="truyen-thong">📣 Ban Truyền thông (Chỉ Ban TT)</option>
          <option value="tu-van">💬 Ban Tư vấn (Chỉ Ban TV)</option>
          <option value="nhan-su">👥 Ban Nhân sự (Chỉ Ban NS)</option>
        </select>

        <div className="mt-2 text-[10px] text-blue-200/90 leading-tight bg-white/5 rounded-lg p-2 border border-white/5">
          {isSuper ? (
            <span className="text-amber-200 font-medium">
              ✨ <strong>Ban Chủ nhiệm:</strong> Toàn quyền chấm điểm 3 ban, đặt câu hỏi & công bố TOP 15.
            </span>
          ) : (
            <span>
              🔒 <strong>{currentConfig.shortLabel}:</strong> Chỉ được chấm điểm & đặt câu hỏi cho ứng viên của ban mình.
            </span>
          )}
        </div>
      </div>

      {/* User info */}
      <div className="px-4 py-3 border-b border-white/10">
        <div className="flex items-center gap-3 p-2.5 bg-white/10 rounded-xl">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-blue-950 font-black text-sm flex-shrink-0 shadow-sm">
            {currentConfig.icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-bold text-white text-xs truncate">
              {user?.full_name || currentConfig.label}
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-[11px] text-blue-200 font-semibold truncate">
                {currentConfig.shortLabel}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Nav list */}
      <nav className="flex-1 px-3 py-4 space-y-5 overflow-y-auto">
        <div>
          <div className="text-[10px] font-bold text-blue-300 uppercase tracking-widest px-3 mb-2">
            Tuyển sinh & Chấm điểm
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
                      ? 'bg-amber-400 text-blue-950 font-bold shadow-md shadow-amber-400/20'
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
                return (
                  <div
                    key={item.href}
                    className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-white/40 cursor-not-allowed select-none"
                    title="Chỉ Ban Chủ nhiệm mới có quyền truy cập"
                  >
                    <Icon className="w-4 h-4 text-white/30" />
                    <span className="flex-1">{item.label}</span>
                    <span className="text-[10px] bg-white/10 px-1.5 py-0.5 rounded text-white/50">BCN</span>
                  </div>
                )
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
