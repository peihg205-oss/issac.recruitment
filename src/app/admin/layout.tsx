import { cookies } from "next/headers"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { AdminSidebar } from "@/components/shared/admin-sidebar"
import { ADMIN_ROLE_CONFIGS, EVALUATOR_ACCOUNTS, type AdminRoleType } from "@/lib/permissions"
import { Crown, Megaphone, MessageSquare, Users, ShieldCheck, Sparkles, Home } from "lucide-react"

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
        return <Crown className="w-3.5 h-3.5 text-amber-600 shrink-0" />
      case "truyen-thong":
        return <Megaphone className="w-3.5 h-3.5 text-blue-600 shrink-0" />
      case "tu-van":
        return <MessageSquare className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
      case "nhan-su":
        return <Users className="w-3.5 h-3.5 text-purple-600 shrink-0" />
      default:
        return <Crown className="w-3.5 h-3.5 text-amber-600 shrink-0" />
    }
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans">
      <AdminSidebar user={profile as any} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header - Aligned h-16 and border with Sidebar */}
        <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-8 flex items-center justify-between shrink-0 z-10">
          {/* Header Title with Modern Icon Badge (Replaced plain dot) */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-400/30 flex items-center justify-center text-amber-600 shadow-2xs">
              <ShieldCheck className="w-4.5 h-4.5 text-amber-600" />
            </div>
            <div>
              <div className="flex items-center">
                <span className="text-xs font-black uppercase tracking-wider text-slate-800">
                  Hệ thống Quản trị Tuyển sinh Gen 3
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

            {/* Admin Profile Card in Top Right Corner */}
            <div
              className="flex items-center gap-3 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-50/90 to-amber-100/60 border border-amber-200/90 shadow-2xs"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#1657c1] to-blue-800 flex items-center justify-center text-white font-black text-xs shadow-xs shrink-0">
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
