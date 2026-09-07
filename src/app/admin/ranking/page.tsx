import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Trophy, Crown, CheckCircle, Download, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { RESULT_COLORS, RESULT_LABELS, formatDateTime, exportToCSV } from '@/lib/utils'
import FinalizeButton from './FinalizeButton'
import { MOCK_CANDIDATES } from '@/lib/mock-data'

export default async function RankingPage() {
  const supabase = await createClient()

  const cookieStore = await cookies()
  const activeRole = cookieStore.get('issac_admin_role')?.value || 'chu-nhiem'
  let isSuperAdmin = activeRole === 'chu-nhiem'
  let rankings: any[] | null = null
  let settings: any[] | null = null

  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: profile } = await supabase.from('profiles').select('role, admin_role').eq('id', user.id).single()
      isSuperAdmin = profile?.role === 'super_admin' || profile?.role === 'admin'
    }

    const [ranksRes, settsRes] = await Promise.all([
      supabase
        .from('candidate_rankings')
        .select(`
          *,
          applications!inner(
            id, status,
            profiles:user_id(full_name, student_id, email),
            departments!applications_department_id_fkey(name, slug)
          )
        `)
        .order('rank_number', { ascending: true, nullsFirst: false }),
      supabase
        .from('system_settings')
        .select('key, value')
        .in('key', ['recruitment_quota', 'results_published'])
    ])
    rankings = ranksRes.data
    settings = settsRes.data
  } catch {
    // Fallback to demo
  }

  const quota = parseInt(settings?.find(s => s.key === 'recruitment_quota')?.value || '15')
  const published = settings?.find(s => s.key === 'results_published')?.value === 'true'

  // Fallback to mock rankings
  const ranked = (rankings && rankings.length > 0)
    ? rankings
    : MOCK_CANDIDATES.map(c => ({
        id: `rank-${c.id}`,
        application_id: c.id,
        rank_number: c.candidate_rankings.rank_number,
        final_score: c.candidate_rankings.final_score,
        result: c.candidate_rankings.result,
        is_tie: false,
        applications: {
          id: c.id,
          status: c.status,
          profiles: c.profiles,
          departments: c.departments,
        }
      }))

  const passCount = ranked.filter(r => r.result === 'pass').length
  const waitlistCount = ranked.filter(r => r.result === 'waitlist').length
  const failCount = ranked.filter(r => r.result === 'fail').length

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
            <Trophy className="w-6 h-6 text-amber-500" />
            Bảng Xếp Hạng Tuyển Thành Viên iSSAC
          </h1>
          <p className="text-gray-500 text-sm mt-1">Xếp hạng tự động theo điểm phỏng vấn trung bình — Chọn TOP 15 chính thức</p>
        </div>
        <div className="flex items-center gap-2">
          {isSuperAdmin ? (
            <FinalizeButton quota={quota} published={published} totalRanked={ranked.length} />
          ) : (
            <div className="flex items-center gap-1.5 bg-gray-100 border border-gray-300 rounded-xl px-3.5 py-2 text-xs text-gray-600 font-semibold shadow-inner">
              <span>🔒</span>
              <span>Chỉ Ban Chủ nhiệm có quyền công bố kết quả TOP {quota}</span>
            </div>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {[
          { label: 'Tổng xếp hạng', value: ranked.length, color: 'bg-blue-50 border-blue-200', text: 'text-blue-700' },
          { label: `TOP ${quota} ĐẠT (PASS)`, value: passCount, color: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-700' },
          { label: 'Danh sách Dự bị', value: waitlistCount, color: 'bg-amber-50 border-amber-200', text: 'text-amber-700' },
          { label: 'Không đạt', value: failCount, color: 'bg-gray-50 border-gray-200', text: 'text-gray-600' },
          { label: 'Chỉ tiêu tuyển', value: quota, color: 'bg-purple-50 border-purple-200', text: 'text-purple-700' },
        ].map((s, i) => (
          <Card key={i} className={`${s.color} border shadow-sm`}>
            <CardContent className="py-4 text-center">
              <div className={`text-2xl font-black ${s.text}`}>{s.value}</div>
              <div className="text-xs font-semibold text-gray-600 mt-1">{s.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* PASS section banner */}
      {passCount > 0 && (
        <div className="bg-gradient-to-r from-emerald-700 via-emerald-600 to-teal-600 rounded-2xl px-6 py-4 flex flex-wrap items-center justify-between gap-3 text-white shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <Crown className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <div className="font-black text-base flex items-center gap-2">
                DANH SÁCH TOP {quota} ĐẠT YÊU CẦU ({passCount} ỨNG VIÊN)
                <Sparkles className="w-4 h-4 text-amber-300" />
              </div>
              <p className="text-emerald-100 text-xs mt-0.5">Các ứng viên có điểm số phỏng vấn cao nhất, đủ điều kiện trở thành Thành viên chính thức iSSAC</p>
            </div>
          </div>
          <Badge className="bg-white text-emerald-800 font-bold px-3 py-1 shadow-sm">
            CHỈ TIÊU {passCount}/{quota}
          </Badge>
        </div>
      )}

      {/* Rankings Table */}
      <Card className="shadow-sm overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-600 uppercase text-xs border-b">
                <tr>
                  <th className="py-3.5 px-4 text-center w-16">Hạng</th>
                  <th className="py-3.5 px-4">Họ và tên ứng viên</th>
                  <th className="py-3.5 px-4 hidden md:table-cell">MSSV</th>
                  <th className="py-3.5 px-4">Ban ứng tuyển</th>
                  <th className="py-3.5 px-4 text-center">Điểm PV (/10)</th>
                  <th className="py-3.5 px-4 text-center">Kết quả</th>
                  <th className="py-3.5 px-4 text-right">Chi tiết</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {ranked.map((ranking, i) => {
                  const app = ranking.applications as any
                  const prof = app?.profiles
                  const dept = app?.departments
                  const isPass = ranking.result === 'pass'
                  const rankNum = ranking.rank_number ?? (i + 1)

                  return (
                    <tr
                      key={ranking.id || i}
                      className={`transition-colors ${
                        isPass ? 'bg-emerald-50/40 hover:bg-emerald-50/70' : 'hover:bg-gray-50'
                      }`}
                    >
                      <td className="py-3.5 px-4 text-center">
                        <div className={`w-8 h-8 mx-auto rounded-full flex items-center justify-center font-black text-xs ${
                          rankNum === 1 ? 'bg-amber-400 text-amber-950 shadow-sm ring-2 ring-amber-300' :
                          rankNum === 2 ? 'bg-slate-300 text-slate-900 shadow-sm' :
                          rankNum === 3 ? 'bg-amber-600 text-white shadow-sm' :
                          isPass ? 'bg-emerald-100 text-emerald-800 font-bold' : 'bg-gray-100 text-gray-500'
                        }`}>
                          #{rankNum}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-gray-900">{prof?.full_name || 'Ứng viên'}</div>
                        <div className="text-xs text-gray-500">{prof?.email}</div>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-gray-600 font-medium hidden md:table-cell">
                        {prof?.student_id || '—'}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-blue-50 text-blue-800 border border-blue-100">
                          {dept?.name || '—'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className={`text-base font-black ${
                          Number(ranking.final_score) >= 9 ? 'text-amber-600' :
                          Number(ranking.final_score) >= 8 ? 'text-emerald-700' : 'text-gray-600'
                        }`}>
                          {ranking.final_score != null ? Number(ranking.final_score).toFixed(1) : '—'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${RESULT_COLORS[ranking.result] || 'bg-gray-100 text-gray-700'}`}>
                          {RESULT_LABELS[ranking.result] || ranking.result}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <Link href={`/admin/candidates/${app?.id}`}>
                          <Button variant="ghost" size="sm" className="h-8 text-xs text-blue-600 hover:bg-blue-50">
                            Xem hồ sơ
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
