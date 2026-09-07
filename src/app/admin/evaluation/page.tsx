import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ClipboardList, CheckCircle, Clock, BarChart3, Eye, ShieldAlert, Lock, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { APPLICATION_STATUS_COLORS, APPLICATION_STATUS_LABELS } from '@/lib/utils'
import { type ApplicationStatus } from '@/types/database'
import { ADMIN_ROLE_CONFIGS, type AdminRoleType } from '@/lib/permissions'
import { MOCK_CANDIDATES } from '@/lib/mock-data'

export default async function EvaluationListPage() {
  const cookieStore = await cookies()
  const activeRoleFromCookie = cookieStore.get('issac_admin_role')?.value as AdminRoleType | undefined
  const activeRole: AdminRoleType = (activeRoleFromCookie && activeRoleFromCookie in ADMIN_ROLE_CONFIGS)
    ? activeRoleFromCookie
    : 'chu-nhiem'

  const roleConfig = ADMIN_ROLE_CONFIGS[activeRole]
  const isSuperAdmin = roleConfig.isSuperAdmin

  const supabase = await createClient()
  let applications: any[] | null = null

  try {
    const { data } = await supabase
      .from('applications')
      .select(`
        id, status,
        profiles:user_id(full_name, student_id, email),
        departments!applications_department_id_fkey(name, slug),
        evaluations(id, status, total_score, interviewer_id, profiles:interviewer_id(full_name)),
        candidate_rankings(rank_number, final_score, result)
      `)
      .in('status', ['approved', 'interview_scheduled', 'interviewed', 'evaluating', 'evaluated', 'finalized'])
      .order('created_at', { ascending: false })
    applications = data
  } catch {}

  // Fallback to mock data if database is empty
  const allApps = (applications && applications.length > 0) ? applications : MOCK_CANDIDATES

  // RBAC Filter: If not Ban Chủ nhiệm, ONLY show applications for this specific department!
  const apps = isSuperAdmin
    ? allApps
    : allApps.filter(a => (a.departments as any)?.slug === activeRole)

  const totalEvals = apps.reduce((sum, a) => sum + ((a.evaluations as any[])?.length || 0), 0)
  const submittedEvals = apps.reduce((sum, a) => sum + ((a.evaluations as any[])?.filter((e: any) => e.status === 'submitted').length || 0), 0)
  const scored = apps.filter(a => (a.candidate_rankings as any)?.final_score != null).length

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
            <ClipboardList className="w-6 h-6 text-blue-600" />
            Chấm Điểm Phỏng Vấn ({apps.length} ứng viên)
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Đánh giá ứng viên theo các tiêu chí chuẩn hóa của iSSAC
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge className={`px-3 py-1 text-xs font-bold border ${roleConfig.badgeColor}`}>
            {roleConfig.icon} Quyền: {roleConfig.shortLabel}
          </Badge>
        </div>
      </div>

      {/* Permission Notice Box */}
      {isSuperAdmin ? (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3 shadow-sm">
          <div className="w-9 h-9 rounded-xl bg-amber-400 text-amber-950 flex items-center justify-center font-bold flex-shrink-0 text-base shadow-sm">
            👑
          </div>
          <div>
            <div className="font-bold text-amber-950 text-sm flex items-center gap-1.5">
              Quyền Ban Chủ nhiệm (Toàn quyền hệ thống)
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            </div>
            <p className="text-xs text-amber-800 mt-0.5">
              Bạn có thể xem và chấm điểm phỏng vấn cho ứng viên của <strong>toàn bộ cả 3 ban</strong> (Truyền thông, Tư vấn, Nhân sự).
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-4 flex items-start gap-3 shadow-sm">
          <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold flex-shrink-0 text-base shadow-sm">
            {roleConfig.icon}
          </div>
          <div>
            <div className="font-bold text-blue-950 text-sm flex items-center gap-1.5">
              Phân quyền theo Ban: {roleConfig.departmentName}
            </div>
            <p className="text-xs text-blue-800 mt-0.5">
              Hệ thống tự động lọc danh sách: Bạn <strong>chỉ có quyền chấm điểm cho các ứng viên đăng ký vào {roleConfig.departmentName}</strong>. Ứng viên thuộc các ban khác sẽ được ẩn để bảo mật và công bằng.
            </p>
          </div>
        </div>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Ứng viên cần chấm', value: apps.length, icon: ClipboardList, color: 'bg-blue-50 text-blue-700' },
          { label: 'Đã hoàn tất chấm', value: apps.filter(a => a.status === 'finalized' || a.status === 'evaluated').length, icon: CheckCircle, color: 'bg-green-50 text-green-700' },
          { label: 'Đang chấm / Dự kiến', value: apps.filter(a => a.status === 'interview_scheduled' || a.status === 'interviewed').length, icon: Clock, color: 'bg-amber-50 text-amber-700' },
          { label: 'Đã có điểm tổng hợp', value: scored, icon: BarChart3, color: 'bg-purple-50 text-purple-700' },
        ].map((s, i) => (
          <Card key={i} className="border-0 shadow-sm" style={{background: 'transparent'}}>
            <CardContent className={`p-4 rounded-xl flex items-center gap-3 ${s.color.split(' ')[0]} border border-gray-100`}>
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm flex-shrink-0">
                <s.icon className={`w-5 h-5 ${s.color.split(' ')[1]}`} />
              </div>
              <div>
                <div className="text-xs text-gray-600 font-medium">{s.label}</div>
                <div className={`text-2xl font-black ${s.color.split(' ')[1]}`}>{s.value}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Candidates Table */}
      <Card className="shadow-sm overflow-hidden">
        <CardHeader className="border-b bg-gray-50/50 py-3.5">
          <CardTitle className="text-base flex items-center justify-between">
            <span>Danh sách hồ sơ phỏng vấn ({apps.length} ứng viên)</span>
            {!isSuperAdmin && (
              <span className="text-xs text-gray-500 font-normal">
                Chỉ hiển thị ứng viên thuộc <strong>{roleConfig.departmentName}</strong>
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {apps.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-semibold text-gray-700">Chưa có ứng viên nào thuộc ban này</p>
              <p className="text-xs text-gray-400 mt-1">Đổi vai trò ở thanh sidebar hoặc chờ ứng viên nộp đơn</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-gray-600 uppercase text-xs border-b">
                  <tr>
                    <th className="py-3.5 px-4 text-center w-12">#</th>
                    <th className="py-3.5 px-4">Ứng viên</th>
                    <th className="py-3.5 px-4 hidden md:table-cell">MSSV</th>
                    <th className="py-3.5 px-4">Ban ứng tuyển</th>
                    <th className="py-3.5 px-4">Trạng thái</th>
                    <th className="py-3.5 px-4 text-center">Điểm PV</th>
                    <th className="py-3.5 px-4 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {apps.map((app, i) => {
                    const prof = app.profiles as any
                    const dept = app.departments as any
                    const ranking = app.candidate_rankings as any
                    const canGrade = isSuperAdmin || dept?.slug === activeRole

                    return (
                      <tr key={app.id} className="hover:bg-blue-50/30 transition-colors">
                        <td className="py-3.5 px-4 text-center text-xs text-gray-400 font-bold">{i + 1}</td>
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-gray-900">{prof?.full_name || '—'}</div>
                          <div className="text-xs text-gray-500">{prof?.email}</div>
                        </td>
                        <td className="py-3.5 px-4 text-xs text-gray-600 font-medium hidden md:table-cell">
                          {prof?.student_id || '—'}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-800 border border-blue-100">
                            {dept?.name || '—'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${APPLICATION_STATUS_COLORS[app.status as ApplicationStatus] || 'bg-gray-100'}`}>
                            {APPLICATION_STATUS_LABELS[app.status as ApplicationStatus] || app.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className={`font-black text-sm ${ranking?.final_score != null ? 'text-amber-600' : 'text-gray-300'}`}>
                            {ranking?.final_score != null ? `${Number(ranking.final_score).toFixed(1)}/10` : '—'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Link href={`/admin/candidates/${app.id}`}>
                              <Button variant="ghost" size="sm" className="h-8 text-xs text-gray-600 hover:bg-gray-100">
                                <Eye className="w-3.5 h-3.5 mr-1" /> Xem
                              </Button>
                            </Link>
                            {canGrade ? (
                              <Link href={`/admin/evaluation/${app.id}`}>
                                <Button size="sm" className="h-8 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-sm">
                                  <ClipboardList className="w-3.5 h-3.5 mr-1" /> Chấm điểm
                                </Button>
                              </Link>
                            ) : (
                              <Button size="sm" disabled variant="outline" className="h-8 text-xs text-gray-400">
                                <Lock className="w-3 h-3 mr-1" /> Khác ban
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
