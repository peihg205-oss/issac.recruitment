import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ClipboardList, CheckCircle, Clock, BarChart3, Eye } from 'lucide-react'
import Link from 'next/link'
import { APPLICATION_STATUS_COLORS, APPLICATION_STATUS_LABELS } from '@/lib/utils'
import { type ApplicationStatus } from '@/types/database'

export default async function EvaluationListPage() {
  const supabase = await createClient()

  const { data: applications } = await supabase
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

  const apps = applications || []
  const totalEvals = apps.reduce((sum, a) => sum + ((a.evaluations as any[])?.length || 0), 0)
  const submittedEvals = apps.reduce((sum, a) => sum + ((a.evaluations as any[])?.filter((e: any) => e.status === 'submitted').length || 0), 0)
  const scored = apps.filter(a => (a.candidate_rankings as any)?.final_score != null).length

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
          <ClipboardList className="w-6 h-6 text-blue-600" />
          Đánh giá Ứng viên
        </h1>
        <p className="text-gray-500 text-sm mt-1">Quản lý phiếu chấm điểm phỏng vấn</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Cần đánh giá', value: apps.length, icon: ClipboardList, color: 'bg-blue-50 text-blue-700' },
          { label: 'Đã chấm (submit)', value: submittedEvals, icon: CheckCircle, color: 'bg-green-50 text-green-700' },
          { label: 'Bản nháp', value: totalEvals - submittedEvals, icon: Clock, color: 'bg-amber-50 text-amber-700' },
          { label: 'Có điểm tổng hợp', value: scored, icon: BarChart3, color: 'bg-purple-50 text-purple-700' },
        ].map((s, i) => (
          <Card key={i} className="border-0" style={{background: 'transparent'}}>
            <CardContent className={`p-4 rounded-xl flex items-center gap-3 ${s.color.split(' ')[0]}`}>
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm flex-shrink-0">
                <s.icon className={`w-5 h-5 ${s.color.split(' ')[1]}`} />
              </div>
              <div>
                <div className="text-xs text-gray-500">{s.label}</div>
                <div className={`text-2xl font-black ${s.color.split(' ')[1]}`}>{s.value}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Danh sách ứng viên cần đánh giá</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {apps.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Chưa có ứng viên nào ở vòng đánh giá.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500">#</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500">Ứng viên</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 hidden md:table-cell">MSSV</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500">Ban</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500">Trạng thái</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500">Phiếu chấm</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500">Điểm TB</th>
                    <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {apps.map((app, i) => {
                    const prof = app.profiles as any
                    const dept = app.departments as any
                    const evals = app.evaluations as any[]
                    const ranking = app.candidate_rankings as any
                    const submittedCount = evals?.filter(e => e.status === 'submitted').length || 0
                    return (
                      <tr key={app.id} className="border-b border-gray-50 hover:bg-blue-50/20 transition-colors">
                        <td className="py-3 px-4 text-sm text-gray-400">{i + 1}</td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-gray-900 text-sm">{prof?.full_name || '—'}</div>
                          <div className="text-xs text-gray-500">{prof?.email}</div>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600 hidden md:table-cell">{prof?.student_id || '—'}</td>
                        <td className="py-3 px-4"><Badge variant="secondary" className="text-xs">{dept?.name || '—'}</Badge></td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${APPLICATION_STATUS_COLORS[app.status as ApplicationStatus] || ''}`}>
                            {APPLICATION_STATUS_LABELS[app.status as ApplicationStatus] || app.status}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-sm">
                            <span className="font-bold text-green-600">{submittedCount}</span>
                            <span className="text-gray-400">/{evals?.length || 0} phiếu</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`font-bold text-sm ${ranking?.final_score != null ? 'text-blue-700' : 'text-gray-400'}`}>
                            {ranking?.final_score != null ? `${Number(ranking.final_score).toFixed(1)}` : '—'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Link href={`/admin/candidates/${app.id}`}>
                              <Button variant="ghost" size="sm" className="gap-1 text-xs">
                                <Eye className="w-3.5 h-3.5" /> Xem
                              </Button>
                            </Link>
                            <Link href={`/admin/evaluation/${app.id}`}>
                              <Button size="sm" className="gap-1 text-xs">
                                <ClipboardList className="w-3.5 h-3.5" /> Chấm điểm
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
