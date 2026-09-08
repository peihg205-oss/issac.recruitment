import { cookies } from "next/headers"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { MemberSidebar } from "@/components/shared/member-sidebar"

function formatStudentInfo(major?: string, studentId?: string): string {
  let majorCode = 'MIS'
  if (major) {
    const match = major.match(/\(([^)]+)\)/)
    if (match) {
      majorCode = match[1].trim()
    } else if (major.includes('Hệ thống thông tin')) {
      majorCode = 'MIS'
    } else if (major.length <= 6) {
      majorCode = major.trim()
    }
  }
  const id = studentId || '23087833'
  return majorCode + " - " + id
}

export default async function MemberLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const cookieStore = await cookies()
  
  let userProfile = {
    full_name: 'Nguyễn Hà Phương',
    email: 'phuong.nguyen@vnu.edu.vn',
    student_id: '23087833',
    major: 'MIS',
    avatar_url: null,
    role: 'applicant',
  }

  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, email, avatar_url, role, student_id, major')
        .eq('id', user.id)
        .single()
      if (profile) {
        userProfile = {
          ...userProfile,
          ...(profile as any),
        }
      } else {
        userProfile.email = user.email || userProfile.email
      }
    }
  } catch {
    // Fallback to demo candidate
  }

  const studentDisplay = formatStudentInfo(userProfile.major, userProfile.student_id)

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans">
      <MemberSidebar user={userProfile} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header with User Info in Top Right Corner */}
        <header className="h-16 bg-white border-b border-slate-200/90 px-4 sm:px-8 flex items-center justify-between shrink-0 shadow-2xs z-10">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#1657c1]" />
            <span className="text-xs font-bold uppercase tracking-wider text-[#1657c1]">
              Cổng tuyển chọn Đại sứ Sinh viên Gen 3
            </span>
          </div>

          {/* User Card in the Top Right Corner */}
          <Link
            href="/member/profile"
            className="flex items-center gap-3 p-1.5 sm:px-3 sm:py-1.5 rounded-2xl bg-blue-50/80 hover:bg-blue-100/80 border border-blue-200/80 transition-all group"
            title="Xem hồ sơ cá nhân"
          >
            <div className="w-9 h-9 rounded-full bg-[#1657c1] flex items-center justify-center text-white font-bold text-sm shadow-xs shrink-0">
              {userProfile.full_name?.charAt(0)?.toUpperCase() || 'N'}
            </div>
            <div className="text-left min-w-0 pr-1">
              <div className="font-bold text-slate-900 text-xs sm:text-sm truncate group-hover:text-[#1657c1] transition-colors">
                {userProfile.full_name || 'Nguyễn Hà Phương'}
              </div>
              <div className="text-[11px] font-semibold text-slate-600 truncate">
                {studentDisplay}
              </div>
            </div>
          </Link>
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
