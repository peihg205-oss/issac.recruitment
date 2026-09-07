import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  ClipboardList, CheckCircle, Clock, BarChart3, Eye,
  UserCheck, ShieldAlert, ArrowUpRight, Trophy
} from 'lucide-react'
import Link from 'next/link'
import { APPLICATION_STATUS_LABELS, APPLICATION_STATUS_COLORS } from '@/lib/utils'
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

  const scored = apps.filter(a => {
    const final = (a.candidate_rankings as any)?.final_score
    return final != null
  }).length

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2.5">
            <ClipboardList className="w-6 h-6 text-blue-600" />
            Hội Đồng Đánh Giá & Chấm Điểm Phỏng Vấn
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Mỗi ban có tài khoản riêng để chấm điểm và bắt buộc giải trình lý do — Ban Chủ nhiệm thẩm định quyết định cuối cùng.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={`px-3 py-1.5 text-xs font-bold border ${roleConfig.badgeColor}`}>
            Đang đăng nhập: {roleConfig.shortLabel}
          </Badge>
          <Link href="/admin/ranking">
            <Button variant="outline" size="sm" className="h-8 text-xs font-bold text-blue-700">
              <Trophy className="w-3.5 h-3.5 mr-1 text-amber-500" /> Bảng xếp hạng
            </Button>
          </Link>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Ứng viên phân công', value: apps.length, icon: ClipboardList, color: 'bg-blue-50 text-blue-700 border-blue-100' },
          { label: 'Đã hoàn tất chấm điểm', value: scored, icon: CheckCircle, color: 'bg-green-50 text-green-700 border-green-100' },
          { label: 'Chờ phỏng vấn & chấm', value: apps.length - scored, icon: Clock, color: 'bg-amber-50 text-amber-700 border-amber-100' },
          { label: 'Chỉ tiêu tuyển chọn', value: 15, icon: BarChart3, color: 'bg-purple-50 text-purple-700 border-purple-100' },
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
      <Card className="shadow-sm overflow-hidden rounded-2xl border border-gray-200">
        <CardHeader className="border-b bg-gray-50/50 py-3.5 flex flex-row items-center justify-between">
          <CardTitle className="text-base font-semibold text-gray-900">
            Danh sách hồ sơ phỏng vấn ({apps.length} ứng viên)
          </CardTitle>
          <span className="text-xs text-gray-500">
            {isSuperAdmin ? 'Hiển thị tất cả 3 ban' : `Chỉ hiển thị ứng viên thuộc ${roleConfig.shortLabel}`}
          </span>
        </CardHeader>
        <CardContent className="p-0">
          {apps.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-semibold text-gray-700">Chưa có ứng viên nào cần chấm điểm.</p>
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
                    <th className="py-3.5 px-4 text-center">Điểm PV (/10)</th>
                    <th className="py-3.5 px-4">Tài khoản Người chấm</th>
                    <th className="py-3.5 px-4 text-center">Đề xuất của Ban</th>
                    <th className="py-3.5 px-4 text-center">Quyết định BCN</th>
                    <th className="py-3.5 px-4 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {apps.map((app: any, i) => {
                    const prof = app.profiles
                    const dept = app.departments
                    const ranking = app.candidate_rankings
                    const evalData = app.evaluation_data
                    const evaluator = app.evaluator

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
                        <td className="py-3.5 px-4 text-center">
                          <span className={`font-black text-sm ${ranking?.final_score != null ? 'text-blue-700' : 'text-gray-300'}`}>
                            {ranking?.final_score != null ? `${Number(ranking.final_score).toFixed(1)}` : '—'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          {evaluator ? (
                            <div className="text-xs">
                              <div className="font-semibold text-gray-900 flex items-center gap-1">
                                <UserCheck className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                                <span>{evaluator.name}</span>
                              </div>
                              <div className="text-[11px] text-gray-500 font-mono truncate max-w-[140px]">
                                {evaluator.email}
                              </div>
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400 italic">Chưa chấm</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          {evalData?.dept_recommendation === 'pass' ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              Đạt (Pass)
                            </span>
                          ) : evalData?.dept_recommendation === 'waitlist' ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                              Phân vân
                            </span>
                          ) : evalData?.dept_recommendation === 'fail' ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-red-50 text-red-700 border border-red-200">
                              Trượt
                            </span>
                          ) : (
                            <span className="text-xs text-gray-400 italic">—</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          {evalData?.bcn_decision === 'pass' ? (
                            <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 text-[11px] font-bold">
                              PASS
                            </Badge>
                          ) : evalData?.bcn_decision === 'waitlist' ? (
                            <Badge className="bg-amber-100 text-amber-800 border-amber-300 text-[11px] font-bold">
                              DỰ BỊ
                            </Badge>
                          ) : evalData?.bcn_decision === 'fail' ? (
                            <Badge className="bg-gray-100 text-gray-700 border-gray-300 text-[11px] font-bold">
                              FAIL
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-gray-400 text-[11px]">
                              Chờ duyệt
                            </Badge>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Link href={`/admin/candidates/${app.id}`}>
                              <Button variant="ghost" size="sm" className="h-8 text-xs text-gray-600 hover:bg-gray-100">
                                <Eye className="w-3.5 h-3.5 mr-1" /> Hồ sơ
                              </Button>
                            </Link>
                            <Link href={`/admin/evaluation/${app.id}`}>
                              <Button size="sm" className="h-8 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg">
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
