import { cookies } from "next/headers"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { MemberSidebar } from "@/components/shared/member-sidebar"
import { MemberNotificationBell } from "@/components/shared/member-notification-bell"
import { Sparkles, Home } from "lucide-react"

function formatStudentInfo({
  cohort,
  studentId,
}: {
  cohort?: string | null
  studentId?: string | null
  deptName?: string | null
}): string {
  const cleanCohort = cohort?.trim()
  const cleanId = studentId?.trim()

  // 1. Có cả Khóa và MSSV (VD: "K22 - 23070691")
  if (cleanCohort && cleanId) {
    return `${cleanCohort} - ${cleanId}`
  }

  // 2. Chỉ có MSSV
  if (cleanId) {
    return `MSSV: ${cleanId}`
  }

  // 3. Chỉ có Khóa
  if (cleanCohort) {
    return `${cleanCohort} - Ứng viên`
  }

  // 4. Mặc định khi chưa điền thông tin
  return 'Ứng viên Gen 3'
}

export default async function MemberLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()

  let userProfile: {
    full_name: string
    email: string
    student_id: string | null
    cohort: string | null
    avatar_url: string | null
    role: string
    deptName: string | null
  } = {
    full_name: 'Ứng viên',
    email: '',
    student_id: null,
    cohort: null,
    avatar_url: null,
    role: 'applicant',
    deptName: null,
  }

  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const [{ data: profile }, { data: app }] = await Promise.all([
        supabase
          .from('profiles')
          .select('full_name, email, avatar_url, role, student_id, cohort')
          .eq('id', user.id)
          .maybeSingle(),
        supabase
          .from('applications')
          .select('departments!applications_department_id_fkey(name)')
          .eq('user_id', user.id)
          .maybeSingle()
      ])

      userProfile = {
        full_name: profile?.full_name || user.user_metadata?.full_name || 'Ứng viên',
        email: profile?.email || user.email || '',
        student_id: profile?.student_id || null,
        cohort: profile?.cohort || null,
        avatar_url: profile?.avatar_url || null,
        role: profile?.role || 'applicant',
        deptName: (Array.isArray(app?.departments) ? (app.departments[0] as any)?.name : (app?.departments as any)?.name) || null,
      }
    }
  } catch (err) {
    console.error('Error loading member layout profile:', err)
  }

  const studentDisplay = formatStudentInfo({
    cohort: userProfile.cohort,
    studentId: userProfile.student_id,
    deptName: userProfile.deptName,
  })

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans">
      <MemberSidebar user={userProfile} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header with User Info in Top Right Corner */}
        <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-8 flex items-center justify-between shrink-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-200/80 flex items-center justify-center text-[#1657c1] shadow-2xs">
              <Sparkles className="w-4.5 h-4.5 text-[#1657c1]" />
            </div>
            <div>
              <div className="flex items-center">
                <span className="text-xs font-black uppercase tracking-wider text-[#1657c1]">
                  Cổng Tuyển quân Đại sứ Sinh viên Gen 3
                </span>
              </div>
              <div className="text-[11px] text-slate-500 font-medium hidden md:block">
                CLB Đại sứ Sinh viên Trường Quốc tế - ĐHQGHN (iSSAC)
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="flex items-center justify-center w-9 h-9 rounded-xl bg-slate-100 hover:bg-blue-50 hover:text-[#1657c1] text-slate-600 border border-slate-200/80 transition-all"
              title="Về Trang chủ"
            >
              <Home className="w-4.5 h-4.5" />
            </Link>

            {/* Realtime Notification Bell */}
            <MemberNotificationBell />

            {/* User Card in the Top Right Corner */}
            <Link
              href="/member/profile"
              className="flex items-center gap-3 p-1.5 sm:px-3 sm:py-1.5 rounded-2xl bg-blue-50/80 hover:bg-blue-100/80 border border-blue-200/80 transition-all group"
              title="Xem và cập nhật hồ sơ cá nhân"
            >
              <div className="w-9 h-9 rounded-full bg-[#1657c1] flex items-center justify-center text-white font-bold text-sm shadow-xs shrink-0">
                {userProfile.full_name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <div className="text-left min-w-0 pr-1">
                <div className="font-bold text-slate-900 text-xs sm:text-sm truncate group-hover:text-[#1657c1] transition-colors">
                  {userProfile.full_name}
                </div>
                <div className="text-[11px] font-semibold text-slate-600 truncate">
                  {studentDisplay}
                </div>
              </div>
            </Link>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
