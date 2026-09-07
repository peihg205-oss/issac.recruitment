import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Trophy, Crown, CheckCircle, Download } from 'lucide-react'
import Link from 'next/link'
import { RESULT_COLORS, RESULT_LABELS, formatDateTime, exportToCSV } from '@/lib/utils'
import FinalizeButton from './FinalizeButton'

export default async function RankingPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('role, admin_role').eq('id', user!.id).single()
  const isSuperAdmin = profile?.role === 'super_admin'

  const { data: rankings } = await supabase
    .from('candidate_rankings')
    .select(`
      *,
      applications!inner(
        id, status,
        profiles:user_id(full_name, student_id, email),
        departments!applications_department_id_fkey(name, slug)
      )
    `)
    .order('rank_number', { ascending: true, nullsFirst: false })

  const { data: settings } = await supabase
    .from('system_settings')
    .select('key, value')
    .in('key', ['recruitment_quota', 'results_published'])

  const quota = parseInt(settings?.find(s => s.key === 'recruitment_quota')?.value || '15')
  const published = settings?.find(s => s.key === 'results_published')?.value === 'true'

  const ranked = rankings || []
  const passCount = ranked.filter(r => r.result === 'pass').length
  const waitlistCount = ranked.filter(r => r.result === 'waitlist').length
  const failCount = ranked.filter(r => r.result === 'fail').length

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
            <Trophy className="w-6 h-6 text-amber-500" />
            Bảng xếp hạng ứng viên
          </h1>
          <p className="text-gray-500 text-sm mt-1">Xếp hạng tự động theo điểm phỏng vấn trung bình</p>
        </div>
        <div className="flex gap-2">
          {isSuperAdmin && (
            <FinalizeButton quota={quota} published={published} totalRanked={ranked.length} />
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 lg:grid-cols-5 gap-4">
        {[
          { label: 'Tổng xếp hạng', value: ranked.length, color: 'bg-blue-50', text: 'text-blue-700' },
          { label: `TOP ${quota} Đạt`, value: passCount, color: 'bg-green-50', text: 'text-green-700' },
          { label: 'Dự bị', value: waitlistCount, color: 'bg-amber-50', text: 'text-amber-700' },
          { label: 'Không đạt', value: failCount, color: 'bg-red-50', text: 'text-red-700' },
          { label: 'Chỉ tiêu', value: quota, color: 'bg-purple-50', text: 'text-purple-700' },
        ].map((s, i) => (
          <Card key={i} className={`${s.color} border-0`}>
            <CardContent className="py-4 text-center">
              <div className={`text-2xl font-black ${s.text}`}>{s.value}</div>
              <div className="text-xs text-gray-500 mt-1">{s.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* PASS section header */}
      {passCount > 0 && (
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl px-6 py-3 flex items-center gap-3">
          <Crown className="w-5 h-5 text-white" />
          <span className="text-white font-bold">TOP {quota} — ĐỀ XUẤT TUYỂN ({passCount} ứng viên)</span>
          <Badge className="bg-white text-green-700 ml-auto">PASS</Badge>
        </div>
      )}

      {/* Rankings Table */}
      <Card>
        <CardContent className="p-0">
          {ranked.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <Trophy className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Chưa có dữ liệu xếp hạng. Cần submit ít nhất 1 phiếu đánh giá.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500">Hạng</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500">Ứng viên</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 hidden md:table-cell">MSSV</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500">Ban</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500">Điểm</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500">Kết quả</th>
                    <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500">Chi tiết</th>
                  </tr>
                </thead>
                <tbody>
                  {ranked.map((ranking, i) => {
                    const app = ranking.applications as any
                    const prof = app?.profiles
                    const dept = app?.departments
                    const isPass = ranking.result === 'pass'
                    const isLast = ranking.result !== ranked[i - 1]?.result && i > 0 && !isPass
                    return (
                      <>
                        {/* Divider when transitioning from PASS to WAITLIST */}
                        {i === quota && ranked.length > quota && (
                          <tr key="divider">
                            <td colSpan={7} className="py-2 px-4 bg-gray-100">
                              <div className="flex items-center gap-2 text-xs text-gray-500 font-semibold">
                                <div className="flex-1 h-px bg-gray-300" />
                                <span>NGOÀI CHỈ TIÊU TOP {quota}</span>
                                <div className="flex-1 h-px bg-gray-300" />
                              </div>
                            </td>
                          </tr>
                        )}
                        <tr
                          key={ranking.id}
                          className={`border-b border-gray-50 transition-colors ${
                            isPass ? 'bg-green-50/30 hover:bg-green-50/60' : 'hover:bg-gray-50'
                          }`}
                        >
                          <td className="py-3 px-4">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-sm ${
                              ranking.rank_number === 1 ? 'bg-amber-400 text-white' :
                              ranking.rank_number === 2 ? 'bg-gray-400 text-white' :
                              ranking.rank_number === 3 ? 'bg-orange-400 text-white' :
                              isPass ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                            }`}>
                              {ranking.rank_number !== null ? ranking.rank_number : '—'}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-semibold text-gray-900 text-sm">{prof?.full_name || '—'}</div>
                            <div className="text-xs text-gray-500">{prof?.email}</div>
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-600 hidden md:table-cell">{prof?.student_id || '—'}</td>
                          <td className="py-3 px-4"><Badge variant="secondary" className="text-xs">{dept?.name || '—'}</Badge></td>
                          <td className="py-3 px-4">
                            <div className={`text-lg font-black ${
                              Number(ranking.final_score) >= 80 ? 'text-green-600' :
                              Number(ranking.final_score) >= 60 ? 'text-blue-600' : 'text-gray-600'
                            }`}>
                              {ranking.final_score != null ? Number(ranking.final_score).toFixed(1) : '—'}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${RESULT_COLORS[ranking.result] || ''}`}>
                              {ranking.is_tie && <span className="mr-1">⚖️</span>}
                              {RESULT_LABELS[ranking.result] || ranking.result}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <Link href={`/admin/candidates/${app?.id}`}>
                              <Button variant="ghost" size="sm">Xem</Button>
                            </Link>
                          </td>
                        </tr>
                      </>
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
