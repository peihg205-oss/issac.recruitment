import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { AdminSidebar } from '@/components/shared/admin-sidebar'
import { ADMIN_ROLE_CONFIGS, type AdminRoleType } from '@/lib/permissions'

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
  let isDemo = false

  if (!user) {
    isDemo = true
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

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Top Banner indicating current Department & Permissions */}
      <div className="bg-slate-900 border-b border-white/10 text-white px-4 py-2 text-xs flex flex-wrap items-center justify-between gap-2 z-50">
        <div className="flex items-center gap-2">
          <span className="font-bold flex items-center gap-1.5 bg-blue-950 border border-blue-400/40 px-2.5 py-1 rounded-lg text-amber-300">
            <span>{currentConfig.icon}</span>
            <span>{currentConfig.label}</span>
          </span>
          <span className="text-gray-300 hidden md:inline">
            {currentConfig.isSuperAdmin
              ? '👑 Toàn quyền xem & chấm điểm cả 3 ban, đặt câu hỏi & công bố Top 15.'
              : `🔒 Quyền hạn: Chỉ được chấm điểm & quản lý câu hỏi thuộc ${currentConfig.departmentName}.`}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-gray-400 text-[11px] hidden sm:inline">
            Đổi ban đăng nhập ở thanh Sidebar bên trái 👈
          </span>
          <a href="/" className="text-xs text-blue-300 hover:text-white underline">
            Về Trang chủ
          </a>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <AdminSidebar user={profile as any} />
        <main className="flex-1 overflow-y-auto">
          <div className="p-4 sm:p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
