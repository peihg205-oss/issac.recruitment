import { createClient } from "@/lib/supabase/server"
import { MemberLayoutClient } from "./MemberLayoutClient"

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
    <MemberLayoutClient userProfile={userProfile} studentDisplay={studentDisplay}>
      {children}
    </MemberLayoutClient>
  )
}
