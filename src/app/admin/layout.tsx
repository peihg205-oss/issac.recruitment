import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { AdminSidebar } from '@/components/shared/admin-sidebar'
import { ADMIN_ROLE_CONFIGS, type AdminRoleType } from '@/lib/permissions'
import { ShieldCheck, Crown, Users, Megaphone, MessageSquare } from 'lucide-react'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies()
  const activeRoleFromCookie = cookieStore.get('issac_admin_role')?.value as AdminRoleType | undefined
  const activeRole: AdminRoleType = (activeRoleFromCookie && activeRoleFromCookie in ADMIN_ROLE_CONFIGS)
    ? activeRoleFromCookie
    : 'chu-nhiem'

  const currentConfig = ADMIN_ROLE_CONFIGS[activeRole]

  const supabase = await createClient()
  let user = null
  try {
    const { data } = await supabase.auth.getUser()
    user = data.user
  } catch {}

  let profile = null

  if (!user) {
    profile = {
      full_name: `${currentConfig.label}`,
      email: `${activeRole}@issac.vnu.edu.vn`,
      role: currentConfig.isSuperAdmin ? 'super_admin' : 'admin',
      admin_role: activeRole,
    }
  } else {
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('full_name, email, role, admin_role')
      .eq('id', user.id)
      .single()

    profile = userProfile || {
      full_name: user.email || 'Admin',
      email: user.email || '',
      role: currentConfig.isSuperAdmin ? 'super_admin' : 'admin',
      admin_role: activeRole,
    }
  }

  const renderRoleIcon = () => {
    switch (activeRole) {
      case 'chu-nhiem':
        return <Crown className="w-3.5 h-3.5 text-amber-500" />
      case 'truyen-thong':
        return <Megaphone className="w-3.5 h-3.5 text-blue-600" />
      case 'tu-van':
        return <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
      case 'nhan-su':
        return <Users className="w-3.5 h-3.5 text-purple-600" />
    }
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <AdminSidebar user={profile as any} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Sleek Minimalist Top Navigation Header */}
        <header className="h-14 bg-white border-b border-gray-200 px-6 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-800 border border-gray-200">
              {renderRoleIcon()}
              <span>Tài khoản: {currentConfig.label}</span>
            </span>
            <span className="text-xs text-gray-400 hidden sm:inline">
              | CLB Đại sứ Sinh viên VNU-IS (iSSAC)
            </span>
          </div>

          <div className="flex items-center gap-4">
            <a
              href="/"
              className="text-xs font-semibold text-gray-500 hover:text-blue-700 transition-colors"
            >
              Về Trang chủ →
            </a>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
