import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { ADMIN_ROLE_CONFIGS, EVALUATOR_ACCOUNTS, type AdminRoleType } from "@/lib/permissions"
import { AdminLayoutClient } from "./AdminLayoutClient"

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
    <AdminLayoutClient
      profile={profile as any}
      activeRole={activeRole}
      acc={acc}
    >
      {children}
    </AdminLayoutClient>
  )
}
