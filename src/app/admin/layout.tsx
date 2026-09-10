import { cookies } from "next/headers"
import Link from "next/link"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { AdminSidebar } from "@/components/shared/admin-sidebar"
import { AdminProfileBadge } from "@/components/admin/admin-profile-badge"
import { ADMIN_ROLE_CONFIGS, EVALUATOR_ACCOUNTS, type AdminRoleType } from "@/lib/permissions"
import { ShieldCheck, Home } from "lucide-react"

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies()
  const activeRoleFromCookie = cookieStore.get("issac_admin_role")?.value as AdminRoleType | undefined

  const supabase = await createClient()
  let user = null
  try {
    const { data } = await supabase.auth.getUser()
    user = data.user
  } catch {}

  let userProfile = null
  if (user) {
    const { data: prof } = await supabase
      .from("profiles")
      .select("full_name, email, role, admin_role")
      .eq("id", user.id)
      .single()
    userProfile = prof
  }

  // Nếu là ứng viên (role = member) và không có cookie admin, chuyển hướng ngay về dashboard ứng viên
  if (userProfile && userProfile.role === "member" && !activeRoleFromCookie) {
    redirect("/member/dashboard")
  }

  const activeRole: AdminRoleType = (activeRoleFromCookie && activeRoleFromCookie in ADMIN_ROLE_CONFIGS)
    ? activeRoleFromCookie
    : (userProfile?.admin_role && userProfile.admin_role in ADMIN_ROLE_CONFIGS ? (userProfile.admin_role as AdminRoleType) : "chu-nhiem")

  const currentConfig = ADMIN_ROLE_CONFIGS[activeRole]

  // Read any custom name/title overrides saved by BCN or approved requests
  const accountsCookie = cookieStore.get("issac_admin_accounts")?.value
  let customAccounts: Record<string, any> = {}
  if (accountsCookie) {
    try {
      customAccounts = JSON.parse(decodeURIComponent(accountsCookie))
    } catch {}
  }

  const baseAcc = EVALUATOR_ACCOUNTS[activeRole] || EVALUATOR_ACCOUNTS["chu-nhiem"]
  const acc = {
    ...baseAcc,
    name: customAccounts[activeRole]?.name || baseAcc.name,
    title: customAccounts[activeRole]?.title || baseAcc.title,
    avatarInitial: customAccounts[activeRole]?.avatarInitial || baseAcc.avatarInitial,
  }

  let profile = null

  if (!user) {
    profile = {
      full_name: acc.name,
      email: acc.email,
      role: currentConfig.isSuperAdmin ? "super_admin" : "admin",
      admin_role: activeRole,
      title: acc.title,
      avatarInitial: acc.avatarInitial,
    }
  } else {
    profile = userProfile ? {
      ...userProfile,
      admin_role: activeRole,
      role: currentConfig.isSuperAdmin ? "super_admin" : "admin",
      full_name: customAccounts[activeRole]?.name || userProfile.full_name || acc.name,
      title: customAccounts[activeRole]?.title || acc.title,
      avatarInitial: customAccounts[activeRole]?.avatarInitial || acc.avatarInitial,
    } : {
      full_name: acc.name,
      email: acc.email,
      role: currentConfig.isSuperAdmin ? "super_admin" : "admin",
      admin_role: activeRole,
      title: acc.title,
      avatarInitial: acc.avatarInitial,
    }
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans">
      <AdminSidebar user={profile as any} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header - Aligned h-16 and border with Sidebar */}
        <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-8 flex items-center justify-between shrink-0 z-10">
          {/* Header Title with Modern Icon Badge */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-400/30 flex items-center justify-center text-amber-600 shadow-2xs">
              <ShieldCheck className="w-4.5 h-4.5 text-amber-600" />
            </div>
            <div>
              <div className="flex items-center">
                <span className="text-xs font-black uppercase tracking-wider text-slate-800">
                  Hệ thống Quản trị Tuyển quân Gen 3
                </span>
              </div>
              <div className="text-[11px] text-slate-500 font-medium hidden md:block">
                CLB Đại sứ Sinh viên Trường Quốc tế - ĐHQGHN (iSSAC)
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="flex items-center justify-center w-9 h-9 rounded-xl bg-slate-100 hover:bg-amber-50 hover:text-amber-700 text-slate-600 border border-slate-200/80 transition-all"
              title="Về Trang chủ"
            >
              <Home className="w-4.5 h-4.5" />
            </Link>

            {/* Interactive Admin Profile Badge with Edit & BCN Approval Modal */}
            <AdminProfileBadge
              role={activeRole}
              initialName={acc.name}
              initialTitle={acc.title}
              initialAvatarInitial={acc.avatarInitial}
            />
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
