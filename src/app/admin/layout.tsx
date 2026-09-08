import { cookies } from "next/headers"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { AdminSidebar } from "@/components/shared/admin-sidebar"
import { ADMIN_ROLE_CONFIGS, EVALUATOR_ACCOUNTS, type AdminRoleType } from "@/lib/permissions"
import { Crown, Megaphone, MessageSquare, Users } from "lucide-react"

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies()
  const activeRoleFromCookie = cookieStore.get("issac_admin_role")?.value as AdminRoleType | undefined
  const activeRole: AdminRoleType = (activeRoleFromCookie && activeRoleFromCookie in ADMIN_ROLE_CONFIGS)
    ? activeRoleFromCookie
    : "chu-nhiem"

  const currentConfig = ADMIN_ROLE_CONFIGS[activeRole]

  const supabase = await createClient()
  let user = null
  try {
    const { data } = await supabase.auth.getUser()
    user = data.user
  } catch {}

  let profile = null
  const acc = EVALUATOR_ACCOUNTS[activeRole] || EVALUATOR_ACCOUNTS["chu-nhiem"]

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
    const { data: userProfile } = await supabase
      .from("profiles")
      .select("full_name, email, role, admin_role")
      .eq("id", user.id)
      .single()

    profile = userProfile ? {
      ...userProfile,
      title: acc.title,
      avatarInitial: acc.avatarInitial,
    } : {
      full_name: acc.name,
      email: acc.email,
      role: currentConfig.isSuperAdmin ? "super_admin" : "admin",
      admin_role: activeRole,
      title: acc.title,
      avatarInitial: acc.avatarInitial,
    }
  }

  const getRoleIcon = () => {
    switch (activeRole) {
      case "chu-nhiem":
        return <Crown className="w-3.5 h-3.5 text-amber-500 shrink-0" />
      case "truyen-thong":
        return <Megaphone className="w-3.5 h-3.5 text-blue-500 shrink-0" />
      case "tu-van":
        return <MessageSquare className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
      case "nhan-su":
        return <Users className="w-3.5 h-3.5 text-purple-500 shrink-0" />
      default:
        return <Crown className="w-3.5 h-3.5 text-amber-500 shrink-0" />
    }
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans">
      <AdminSidebar user={profile as any} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header - Aligned h-16 and border with Sidebar */}
        <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-8 flex items-center justify-between shrink-0 z-10">
          <div className="flex items-center gap-2.5">
            <span className="h-2 w-2 rounded-full bg-amber-500" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Hệ thống Quản trị Tuyển sinh Gen 3
            </span>
            <span className="hidden md:inline-block text-xs text-slate-300">|</span>
            <span className="hidden md:inline-block text-xs text-slate-500 font-medium">
              CLB Đại sứ Sinh viên VNU-IS (iSSAC)
            </span>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="hidden lg:inline-flex items-center text-xs text-slate-500 hover:text-[#1657c1] font-medium transition-colors"
            >
              Về Trang chủ →
            </Link>

            {/* Admin Profile Card in Top Right Corner */}
            <div
              className="flex items-center gap-3 px-3 py-1.5 rounded-xl bg-amber-50/70 border border-amber-200/80 transition-all shadow-2xs"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#1657c1] to-indigo-700 flex items-center justify-center text-white font-black text-xs shadow-xs shrink-0">
                {profile.avatarInitial || acc.avatarInitial}
              </div>
              <div className="text-left min-w-0 pr-1">
                <div className="font-bold text-slate-900 text-xs sm:text-sm truncate leading-tight">
                  {profile.full_name || acc.name}
                </div>
                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-amber-800 truncate leading-tight mt-0.5">
                  {getRoleIcon()}
                  <span>{profile.title || acc.title}</span>
                </div>
              </div>
            </div>
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
