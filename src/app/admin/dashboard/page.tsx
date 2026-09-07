import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Users, FileText, CheckCircle, Clock, Calendar,
  ClipboardList, Trophy, TrendingUp, BarChart3, Star
} from 'lucide-react'
import { MOCK_CANDIDATES, MOCK_DEPARTMENTS, MOCK_INTERVIEW_SLOTS } from '@/lib/mock-data'

export default async function AdminDashboardPage() {
  const supabase = await createClient()

  let applications: any[] | null = null
  let evaluations: any[] | null = null
  let rankings: any[] | null = null
  let departments: any[] | null = null
  let interviews: any[] | null = null
  let settings: any[] | null = null

  try {
    const [appsRes, evalsRes, ranksRes, deptsRes, ivwsRes, settRes] = await Promise.all([
      supabase.from('applications').select('id, status, department_id, departments(name, slug)'),
      supabase.from('evaluations').select('id, status, total_score'),
      supabase.from('candidate_rankings').select('id, result, final_score, rank_number').order('rank_number', { ascending: true }),
      supabase.from('departments').select('id, name, slug, color').neq('slug', 'chu-nhiem'),
      supabase.from('interviews').select('id, status'),
      supabase.from('system_settings').select('key, value').in('key', ['recruitment_quota', 'recruitment_end', 'interview_end', 'result_announcement'])
    ])
    applications = appsRes.data
    evaluations = evalsRes.data
    rankings = ranksRes.data
    departments = deptsRes.data
    interviews = ivwsRes.data
    settings = settRes.data
  } catch {
    // Demo fallback
  }

  // Fallback to rich mock data if empty
  const isUsingMock = !applications || applications.length === 0
  const apps: any[] = (applications && applications.length > 0) ? applications : MOCK_CANDIDATES
  const depts = (!departments || departments.length === 0) ? MOCK_DEPARTMENTS : departments
  const ranks: any[] = (rankings && rankings.length > 0) ? rankings : MOCK_CANDIDATES.map(c => c.candidate_rankings)
  const quota = parseInt(settings?.find(s => s.key === 'recruitment_quota')?.value || '15')

  const statusCounts = {
    total: apps.length,
    draft: apps.filter(a => a.status === 'draft').length,
    submitted: apps.filter(a => a.status === 'submitted').length,
    received: apps.filter(a => a.status === 'received').length,
    reviewing: apps.filter(a => a.status === 'reviewing').length,
    approved: apps.filter(a => a.status === 'approved').length,
    rejected: apps.filter(a => a.status === 'rejected').length,
    interview_scheduled: apps.filter(a => a.status === 'interview_scheduled').length,
    interviewed: apps.filter(a => a.status === 'interviewed').length,
    evaluated: apps.filter(a => a.status === 'evaluated').length,
    finalized: apps.filter(a => a.status === 'finalized').length,
  }

  const evalStats = {
    total: isUsingMock ? 18 : (evaluations?.length || 0),
    submitted: isUsingMock ? 18 : (evaluations?.filter(e => e.status === 'submitted').length || 0),
    avgScore: isUsingMock
      ? (MOCK_CANDIDATES.reduce((acc, c) => acc + (c.candidate_rankings?.final_score || 0), 0) / MOCK_CANDIDATES.length).toFixed(1)
      : (evaluations && evaluations.length > 0
          ? (evaluations.reduce((acc, e) => acc + (e.total_score || 0), 0) / evaluations.length).toFixed(1)
          : '0.0'),
  }

  const rankStats = {
    pass: ranks.filter(r => r?.result === 'pass').length,
    waitlist: ranks.filter(r => r?.result === 'waitlist').length,
    fail: ranks.filter(r => r?.result === 'fail').length,
  }

  const deptStats = depts.map(d => ({
    ...d,
    count: apps.filter(a =>
      a.department_id === d.id ||
      (a.departments as any)?.slug === d.slug ||
      (a.departments as any)?.name === d.name
    ).length
  }))

  const summaryCards = [
    { label: 'Tổng hồ sơ', value: statusCounts.total, icon: Users, color: 'bg-blue-50', iconColor: 'text-blue-600', accent: 'border-l-blue-600' },
    { label: 'Chờ duyệt', value: statusCounts.submitted + statusCounts.received + statusCounts.reviewing, icon: Clock, color: 'bg-amber-50', iconColor: 'text-amber-600', accent: 'border-l-amber-500' },
    { label: 'Đã duyệt hồ sơ', value: statusCounts.approved + statusCounts.interview_scheduled, icon: CheckCircle, color: 'bg-green-50', iconColor: 'text-green-600', accent: 'border-l-green-500' },
    { label: 'Lịch phỏng vấn', value: isUsingMock ? MOCK_INTERVIEW_SLOTS.length : (interviews?.length || 0), icon: Calendar, color: 'bg-purple-50', iconColor: 'text-purple-600', accent: 'border-l-purple-500' },
    { label: 'Đã hoàn thành PV', value: statusCounts.interviewed + statusCounts.evaluated + statusCounts.finalized, icon: Users, color: 'bg-indigo-50', iconColor: 'text-indigo-600', accent: 'border-l-indigo-500' },
    { label: 'Đã chấm điểm', value: evalStats.submitted, icon: ClipboardList, color: 'bg-teal-50', iconColor: 'text-teal-600', accent: 'border-l-teal-500' },
    { label: 'TOP 15 Pass', value: rankStats.pass, icon: Trophy, color: 'bg-emerald-50', iconColor: 'text-emerald-600', accent: 'border-l-emerald-500' },
    { label: 'Điểm TB phỏng vấn', value: `${evalStats.avgScore}/10`, icon: Star, color: 'bg-orange-50', iconColor: 'text-orange-600', accent: 'border-l-orange-500' },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Dashboard Ban Tuyển Dụng</h1>
          <p className="text-gray-500 text-sm mt-1">Tổng quan tiến độ tuyển thành viên iSSAC - VNU-IS Ambassadors Club</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800 border border-green-200">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            Đang mở cổng tuyển sinh
          </span>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryCards.map((card, i) => (
          <Card key={i} className={`border-l-4 ${card.accent} shadow-sm hover:shadow-md transition-shadow`}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-xs font-medium text-gray-500 mb-1">{card.label}</div>
                  <div className="text-2xl font-black text-gray-900">{card.value}</div>
                </div>
                <div className={`w-10 h-10 ${card.color} rounded-xl flex items-center justify-center`}>
                  <card.icon className={`w-5 h-5 ${card.iconColor}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Status Breakdown */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-blue-600" />
              Tiến trình duyệt & phỏng vấn
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { label: 'Đã nộp đơn', count: apps.length, color: 'bg-blue-500' },
                { label: 'Đã duyệt hồ sơ', count: statusCounts.approved + statusCounts.interview_scheduled + statusCounts.interviewed + statusCounts.evaluated + statusCounts.finalized, color: 'bg-green-500' },
                { label: 'Đã phỏng vấn', count: statusCounts.interviewed + statusCounts.evaluated + statusCounts.finalized, color: 'bg-purple-500' },
                { label: 'Đã có điểm số', count: evalStats.submitted, color: 'bg-teal-500' },
                { label: 'Trúng tuyển Top 15', count: rankStats.pass, color: 'bg-amber-500' },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-28 text-xs text-gray-600 text-right font-medium">{item.label}</div>
                  <div className="flex-1 h-6 bg-gray-100 rounded-lg overflow-hidden">
                    <div
                      className={`h-full ${item.color} rounded-lg transition-all flex items-center justify-end pr-2`}
                      style={{width: statusCounts.total > 0 ? `${Math.max((item.count / statusCounts.total) * 100, 4)}%` : '4%'}}
                    >
                      {item.count > 0 && <span className="text-white text-xs font-bold">{item.count}</span>}
                    </div>
                  </div>
                  <div className="w-8 text-xs text-gray-800 font-bold">{item.count}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* By Department */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-600" />
              Phân bổ ứng viên theo Ban
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {deptStats.map((dept, i) => {
                const pct = statusCounts.total > 0 ? (dept.count / statusCounts.total) * 100 : 0
                const colors = ['bg-blue-600', 'bg-pink-500', 'bg-purple-600', 'bg-amber-500']
                return (
                  <div key={dept.id || i}>
                    <div className="flex justify-between text-sm mb-1.5">
                      <span className="font-semibold text-gray-800">{dept.name}</span>
                      <span className="font-bold text-gray-900">{dept.count} hồ sơ</span>
                    </div>
                    <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${colors[i % colors.length]} rounded-full transition-all`}
                        style={{width: `${Math.max(pct, 3)}%`}}
                      />
                    </div>
                    <div className="text-xs text-gray-400 mt-0.5">{pct.toFixed(1)}% trên tổng số đơn</div>
                  </div>
                )
              })}
            </div>

            <div className="mt-6 pt-4 border-t border-gray-100">
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: `TOP ${quota} CHÍNH THỨC`, value: rankStats.pass, color: 'text-emerald-700', bg: 'bg-emerald-50 border border-emerald-200' },
                  { label: 'DANH SÁCH DỰ BỊ', value: rankStats.waitlist, color: 'text-amber-700', bg: 'bg-amber-50 border border-amber-200' },
                  { label: 'KHÔNG ĐẠT', value: rankStats.fail, color: 'text-gray-600', bg: 'bg-gray-50 border border-gray-200' },
                ].map((item, i) => (
                  <div key={i} className={`${item.bg} rounded-xl p-3 text-center`}>
                    <div className={`text-xl font-black ${item.color}`}>{item.value}</div>
                    <div className="text-[11px] font-bold text-gray-600 mt-0.5">{item.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recruitment Status */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-blue-600" />
            Thông số đợt tuyển iSSAC 2026
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Chỉ tiêu tuyển chọn', value: `${quota} thành viên`, desc: 'Chỉ tiêu phê duyệt TOP 15' },
              { label: 'Số ban tuyển dụng', value: '3 Ban chuyên môn', desc: 'Ban Truyền thông, Ban Tư vấn, Ban Nhân sự' },
              { label: 'Điểm sàn phỏng vấn', value: '8.0 / 10.0', desc: 'Ngưỡng xét vào Top 15' },
              { label: 'Hình thức phỏng vấn', value: 'Online & Offline', desc: 'Trường Quốc tế VNU-IS / Google Meet' },
            ].map((item, i) => (
              <div key={i} className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                <div className="text-lg font-black text-blue-800">{item.value}</div>
                <div className="text-sm font-semibold text-gray-900 mt-0.5">{item.label}</div>
                <div className="text-xs text-gray-500 mt-1">{item.desc}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
