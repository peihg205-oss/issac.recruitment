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

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <AdminSidebar user={profile as any} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Clean, Simple Top Header */}
        <header className="h-14 bg-white border-b border-gray-200 px-6 flex items-center justify-between flex-shrink-0">
          <div className="text-xs text-gray-500 font-medium">
            CLB Đại sứ Sinh viên VNU-IS (iSSAC)
          </div>

          <div className="flex items-center gap-4">
            <a
              href="/"
              className="text-xs text-gray-500 hover:text-blue-600 transition-colors"
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
