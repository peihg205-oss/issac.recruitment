import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  ClipboardList, CheckCircle, Clock, BarChart3,
  Eye
} from 'lucide-react'
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

  const allApps = (applications && applications.length > 0) ? applications : MOCK_CANDIDATES

  // Filter according to department naturally
  const apps = isSuperAdmin
    ? allApps
    : allApps.filter(a => (a.departments as any)?.slug === activeRole)

  const scored = apps.filter(a => (a.candidate_rankings as any)?.final_score != null).length

  return (
    <div className="space-y-6 animate-fade-in max-w-6xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2.5">
          <ClipboardList className="w-6 h-6 text-blue-600" />
          Đánh giá Ứng viên
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Quản lý phiếu chấm điểm phỏng vấn
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Ứng viên cần chấm', value: apps.length, icon: ClipboardList, color: 'bg-blue-50 text-blue-700 border-blue-100' },
          { label: 'Đã chấm điểm', value: apps.filter(a => a.status === 'finalized' || a.status === 'evaluated').length, icon: CheckCircle, color: 'bg-green-50 text-green-700 border-green-100' },
          { label: 'Chờ phỏng vấn', value: apps.filter(a => a.status === 'interview_scheduled' || a.status === 'interviewed').length, icon: Clock, color: 'bg-amber-50 text-amber-700 border-amber-100' },
          { label: 'Có điểm tổng hợp', value: scored, icon: BarChart3, color: 'bg-purple-50 text-purple-700 border-purple-100' },
        ].map((s, i) => (
          <Card key={i} className={`shadow-sm border ${s.color}`}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm flex-shrink-0">
                <s.icon className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs text-gray-600 font-medium">{s.label}</div>
                <div className="text-2xl font-bold">{s.value}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Table */}
      <Card className="shadow-sm overflow-hidden rounded-2xl border border-gray-100">
        <CardHeader className="border-b bg-gray-50/50 py-3.5">
          <CardTitle className="text-base font-semibold text-gray-900">
            Danh sách hồ sơ phỏng vấn
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {apps.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-semibold text-gray-700">Chưa có ứng viên nào.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-gray-600 uppercase text-xs border-b">
                  <tr>
                    <th className="py-3.5 px-4 text-center w-12">#</th>
                    <th className="py-3.5 px-4">Ứng viên</th>
                    <th className="py-3.5 px-4 hidden md:table-cell">MSSV</th>
                    <th className="py-3.5 px-4">Ban</th>
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
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                            {dept?.name || '—'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${APPLICATION_STATUS_COLORS[app.status as ApplicationStatus] || 'bg-gray-100'}`}>
                            {APPLICATION_STATUS_LABELS[app.status as ApplicationStatus] || app.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className={`font-bold text-sm ${ranking?.final_score != null ? 'text-amber-600' : 'text-gray-300'}`}>
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
                            <Link href={`/admin/evaluation/${app.id}`}>
                              <Button size="sm" className="h-8 text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg">
                                <ClipboardList className="w-3.5 h-3.5 mr-1" /> Chấm điểm
                              </Button>
                            </Link>
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
