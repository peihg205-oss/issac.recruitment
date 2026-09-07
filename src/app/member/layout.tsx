import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { MemberSidebar } from '@/components/shared/member-sidebar'

export default async function MemberLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const cookieStore = await cookies()
  
  let userProfile = {
    full_name: 'Nguyễn Hà Phương',
    email: 'phuong.nguyen@vnu.edu.vn',
    avatar_url: null,
    role: 'applicant',
  }

  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, email, avatar_url, role')
        .eq('id', user.id)
        .single()
      if (profile) {
        userProfile = profile as any
      } else {
        userProfile.email = user.email || userProfile.email
      }
    }
  } catch {
    // Fallback to demo candidate
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <MemberSidebar user={userProfile} />
      <main className="flex-1 overflow-y-auto">
        <div className="p-4 sm:p-6 max-w-5xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  )
}
