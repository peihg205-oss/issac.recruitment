import { createClient } from '@/lib/supabase/server'
import { AdminSidebar } from '@/components/shared/admin-sidebar'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let profile = null
  let isDemo = false

  if (!user) {
    isDemo = true
    profile = {
      full_name: 'Trưởng Ban Tuyển Dụng iSSAC',
      email: 'admin@issac.vnu.edu.vn',
      role: 'super_admin',
      admin_role: 'super_admin',
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
      role: 'admin',
      admin_role: 'interviewer',
    }
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {isDemo && (
        <div className="bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-600 text-white px-4 py-2 text-xs flex flex-wrap items-center justify-between gap-2 shadow-sm z-50">
          <div className="flex items-center gap-2">
            <span className="bg-white/25 px-2 py-0.5 rounded font-black uppercase tracking-wider text-[10px]">
              Chế độ Demo Trực Quan
            </span>
            <span>⚡ Bạn đang xem toàn bộ giao diện Ban Tuyển Dụng iSSAC với dữ liệu mẫu hoàn chỉnh (Top 15, Chấm điểm, Quản lý ứng viên).</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-white/80 hidden sm:inline">Để lưu dữ liệu thật: Điền URL & Key vào file <code>.env.local</code></span>
            <a href="/" className="bg-white text-amber-800 px-2.5 py-1 rounded font-bold hover:bg-amber-50 transition-colors">
              Về Trang chủ
            </a>
          </div>
        </div>
      )}
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
