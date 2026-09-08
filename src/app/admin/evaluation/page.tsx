import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  ClipboardList, CheckCircle, Clock, BarChart3, Eye,
  UserCheck, Trophy, Crown, Megaphone, MessageSquare, Users
} from 'lucide-react'
import Link from 'next/link'
import { ADMIN_ROLE_CONFIGS, getActiveRoleConfig, type AdminRoleType } from '@/lib/permissions'
import { MOCK_CANDIDATES } from '@/lib/mock-data'

export default async function EvaluationListPage() {
  const cookieStore = await cookies()
  const activeRoleFromCookie = cookieStore.get('issac_admin_role')?.value as AdminRoleType | undefined
  const activeRole: AdminRoleType = (activeRoleFromCookie && activeRoleFromCookie in ADMIN_ROLE_CONFIGS)
    ? activeRoleFromCookie
    : 'chu-nhiem'

  const roleConfig = getActiveRoleConfig(activeRole, cookieStore.toString())
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

  // Tất cả các Ban đều xem được danh sách đầy đủ toàn CLB
  const apps = allApps

  const scored = apps.filter(a => {
    const final = (a.candidate_rankings as any)?.final_score
    return final != null
  }).length

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto">
      {/* Header - Clean, Sleek, No unnecessary verbose notes */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-950 flex items-center gap-2.5">
            <ClipboardList className="w-6 h-6 text-[#1559c5]" />
            Hội Đồng Đánh Giá & Chấm Điểm Phỏng Vấn
          </h1>
        </div>
        <div className="flex items-center gap-2.5">
          <span className="px-3.5 py-1.5 text-xs font-bold bg-[#fff7e8] text-amber-950 border border-amber-300 rounded-full shadow-sm flex items-center gap-1.5">
            {activeRole === "chu-nhiem" && <Crown className="w-3.5 h-3.5 text-amber-600 shrink-0" />}
            {activeRole === "truyen-thong" && <Megaphone className="w-3.5 h-3.5 text-blue-600 shrink-0" />}
            {activeRole === "tu-van" && <MessageSquare className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
            {activeRole === "nhan-su" && <Users className="w-3.5 h-3.5 text-purple-600 shrink-0" />}
            <span>{roleConfig.label}</span>
            <span className="text-amber-700 font-medium">({roleConfig.shortLabel})</span>
          </span>
          <Link href="/admin/ranking">
            <Button variant="outline" size="sm" className="h-9 text-xs font-bold text-[#1559c5] border-[#1559c5]/30 hover:bg-blue-50 rounded-full px-4 shadow-sm">
              <Trophy className="w-3.5 h-3.5 mr-1.5 text-amber-500" /> Bảng xếp hạng
            </Button>
          </Link>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Ứng viên phân công', value: apps.length, icon: ClipboardList, color: 'bg-blue-50/70 border-blue-200', text: 'text-[#1559c5]' },
          { label: 'Đã hoàn tất chấm điểm', value: scored, icon: CheckCircle, color: 'bg-emerald-50/70 border-emerald-200', text: 'text-emerald-700' },
          { label: 'Chờ phỏng vấn & chấm', value: apps.length - scored, icon: Clock, color: 'bg-amber-50/70 border-amber-200', text: 'text-amber-700' },
          { label: 'Chỉ tiêu tuyển chọn', value: 15, icon: BarChart3, color: 'bg-purple-50/70 border-purple-200', text: 'text-purple-700' },
        ].map((s, i) => (
          <Card key={i} className={`shadow-sm border rounded-2xl ${s.color}`}>
            <CardContent className="p-4 flex items-center gap-3.5">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm flex-shrink-0">
                <s.icon className={`w-5 h-5 ${s.text}`} />
              </div>
              <div>
                <div className="text-xs text-gray-600 font-medium">{s.label}</div>
                <div className={`text-2xl font-black ${s.text}`}>{s.value}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Table */}
      <Card className="shadow-sm overflow-hidden rounded-2xl border border-gray-200 bg-white">
        <CardHeader className="border-b bg-gray-50/60 py-4 px-6 flex flex-row items-center justify-between">
          <CardTitle className="text-base font-bold text-gray-950">
            Danh sách hồ sơ phỏng vấn ({apps.length} ứng viên)
          </CardTitle>
          <span className="text-xs text-gray-500 font-medium">
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
                    <th className="py-3.5 px-4 text-center w-12 whitespace-nowrap">#</th>
                    <th className="py-3.5 px-4 whitespace-nowrap">Ứng viên</th>
                    <th className="py-3.5 px-4 hidden md:table-cell whitespace-nowrap">MSSV</th>
                    <th className="py-3.5 px-4 whitespace-nowrap">Ban</th>
                    <th className="py-3.5 px-4 text-center whitespace-nowrap">Điểm PV (/10)</th>
                    <th className="py-3.5 px-4 whitespace-nowrap">Tài khoản Người chấm</th>
                    <th className="py-3.5 px-4 text-center whitespace-nowrap">Đề xuất của Ban</th>
                    <th className="py-3.5 px-4 text-center whitespace-nowrap">Quyết định BCN</th>
                    <th className="py-3.5 px-4 text-right whitespace-nowrap">Thao tác</th>
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
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="font-bold text-gray-900">{prof?.full_name || '—'}</div>
                          <div className="text-xs text-gray-500">{prof?.email}</div>
                        </td>
                        <td className="py-3.5 px-4 text-xs text-gray-600 font-medium hidden md:table-cell whitespace-nowrap">
                          {prof?.student_id || '—'}
                        </td>

                        {/* Ban: single line badge, no line wrapping */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-[#1559c5] border border-blue-200 whitespace-nowrap">
                            {dept?.name || '—'}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          <span className={`font-black text-sm ${ranking?.final_score != null ? 'text-[#1559c5]' : 'text-gray-300'}`}>
                            {ranking?.final_score != null ? Number(ranking.final_score).toFixed(1) : '—'}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {evaluator ? (
                            <div className="text-xs">
                              <div className="font-bold text-gray-900 flex items-center gap-1">
                                <UserCheck className="w-3.5 h-3.5 text-[#1559c5] flex-shrink-0" />
                                <span>{evaluator.name}</span>
                              </div>
                              <div className="text-[11px] text-gray-500 font-mono truncate max-w-[150px]">
                                {evaluator.email}
                              </div>
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400 italic">Chưa chấm</span>
                          )}
                        </td>

                        {/* Đề xuất của Ban: hiển thị Pass, Phân vân, Trượt (không để Đạt (Pass)) */}
                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          {evalData?.dept_recommendation === 'pass' ? (
                            <span className="inline-flex items-center px-3 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 whitespace-nowrap">
                              Pass
                            </span>
                          ) : evalData?.dept_recommendation === 'waitlist' ? (
                            <span className="inline-flex items-center px-3 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 whitespace-nowrap">
                              Phân vân
                            </span>
                          ) : evalData?.dept_recommendation === 'fail' ? (
                            <span className="inline-flex items-center px-3 py-0.5 rounded-full text-xs font-bold bg-red-50 text-red-700 border border-red-200 whitespace-nowrap">
                              Trượt
                            </span>
                          ) : (
                            <span className="text-xs text-gray-400 italic">—</span>
                          )}
                        </td>

                        {/* Quyết định BCN */}
                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          {evalData?.bcn_decision === 'pass' ? (
                            <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 text-xs font-bold whitespace-nowrap">
                              Pass
                            </Badge>
                          ) : evalData?.bcn_decision === 'waitlist' ? (
                            <Badge className="bg-amber-100 text-amber-800 border-amber-300 text-xs font-bold whitespace-nowrap">
                              Dự bị
                            </Badge>
                          ) : evalData?.bcn_decision === 'fail' ? (
                            <Badge className="bg-gray-100 text-gray-700 border-gray-300 text-xs font-bold whitespace-nowrap">
                              Trượt
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-gray-400 text-xs whitespace-nowrap">
                              Chờ duyệt
                            </Badge>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <Link href={`/admin/candidates/${app.id}`}>
                              <Button variant="ghost" size="sm" className="h-8 text-xs text-gray-600 hover:bg-gray-100 rounded-lg">
                                <Eye className="w-3.5 h-3.5 mr-1" /> Hồ sơ
                              </Button>
                            </Link>
                            {(() => {
                              const canGrade = isSuperAdmin || (app.departments as any)?.slug === activeRole
                              return canGrade ? (
                                <Link href={`/admin/evaluation/${app.id}`}>
                                  <Button size="sm" className="h-8 text-xs font-bold bg-[#1559c5] hover:bg-[#0f449e] text-white rounded-lg shadow-sm">
                                    <ClipboardList className="w-3.5 h-3.5 mr-1" /> Chấm điểm
                                  </Button>
                                </Link>
                              ) : (
                                <Link href={`/admin/evaluation/${app.id}`}>
                                  <Button variant="outline" size="sm" className="h-8 text-xs font-semibold text-gray-600 hover:text-[#1559c5] hover:bg-blue-50/50 rounded-lg border-gray-200 shadow-sm">
                                    <Eye className="w-3.5 h-3.5 mr-1 text-gray-400" /> Xem điểm
                                  </Button>
                                </Link>
                              )
                            })()}
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
