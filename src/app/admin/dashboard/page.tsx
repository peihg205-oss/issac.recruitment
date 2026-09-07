import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Users, FileText, CheckCircle, Clock, Calendar,
  ClipboardList, Trophy, TrendingUp, BarChart3, Star
} from 'lucide-react'
import { APPLICATION_STATUS_LABELS } from '@/lib/utils'

export default async function AdminDashboardPage() {
  const supabase = await createClient()

  // Fetch all application counts by status
  const { data: applications } = await supabase
    .from('applications')
    .select('id, status, department_id, departments(name, slug)')

  const { data: evaluations } = await supabase
    .from('evaluations')
    .select('id, status, total_score')

  const { data: rankings } = await supabase
    .from('candidate_rankings')
    .select('id, result, final_score, rank_number')
    .order('rank_number', { ascending: true })

  const { data: departments } = await supabase
    .from('departments')
    .select('id, name, slug, color')
    .neq('slug', 'chu-nhiem')

  const { data: interviews } = await supabase
    .from('interviews')
    .select('id, status')

  const { data: settings } = await supabase
    .from('system_settings')
    .select('key, value')
    .in('key', ['recruitment_quota', 'recruitment_end', 'interview_end', 'result_announcement'])

  const quota = parseInt(settings?.find(s => s.key === 'recruitment_quota')?.value || '15')

  const apps = applications || []
  const evals = evaluations || []
  const ranks = rankings || []
  const ivws = interviews || []

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
    total: evals.length,
    submitted: evals.filter(e => e.status === 'submitted').length,
    draft: evals.filter(e => e.status === 'draft').length,
    avgScore: evals.filter(e => e.total_score != null).length > 0
      ? (evals.reduce((sum, e) => sum + (Number(e.total_score) || 0), 0) / evals.filter(e => e.total_score != null).length).toFixed(1)
      : '—',
  }

  const rankStats = {
    pass: ranks.filter(r => r.result === 'pass').length,
    waitlist: ranks.filter(r => r.result === 'waitlist').length,
    fail: ranks.filter(r => r.result === 'fail').length,
  }

  const deptStats = (departments || []).map(dept => ({
    ...dept,
    count: apps.filter(a => a.department_id === dept.id).length,
  }))

  const summaryCards = [
    { label: 'Tổng đơn', value: statusCounts.total, icon: FileText, color: 'bg-blue-50', iconColor: 'text-blue-600', accent: 'border-l-blue-500' },
    { label: 'Chờ duyệt', value: statusCounts.submitted + statusCounts.received + statusCounts.reviewing, icon: Clock, color: 'bg-amber-50', iconColor: 'text-amber-600', accent: 'border-l-amber-500' },
    { label: 'Đã duyệt', value: statusCounts.approved, icon: CheckCircle, color: 'bg-green-50', iconColor: 'text-green-600', accent: 'border-l-green-500' },
    { label: 'Chờ phỏng vấn', value: statusCounts.interview_scheduled, icon: Calendar, color: 'bg-purple-50', iconColor: 'text-purple-600', accent: 'border-l-purple-500' },
    { label: 'Đã phỏng vấn', value: statusCounts.interviewed, icon: Users, color: 'bg-indigo-50', iconColor: 'text-indigo-600', accent: 'border-l-indigo-500' },
    { label: 'Đã chấm điểm', value: evalStats.submitted, icon: ClipboardList, color: 'bg-teal-50', iconColor: 'text-teal-600', accent: 'border-l-teal-500' },
    { label: 'Đề xuất PASS', value: rankStats.pass, icon: Trophy, color: 'bg-emerald-50', iconColor: 'text-emerald-600', accent: 'border-l-emerald-500' },
    { label: 'Điểm TB', value: evalStats.avgScore, icon: Star, color: 'bg-orange-50', iconColor: 'text-orange-600', accent: 'border-l-orange-500' },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Tổng quan hệ thống tuyển thành viên iSSAC 2026</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryCards.map((card, i) => (
          <Card key={i} className={`border-l-4 ${card.accent} overflow-hidden`}>
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
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-blue-600" />
              Phân bổ theo trạng thái
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { label: 'Bản nháp', count: statusCounts.draft, color: 'bg-gray-400' },
                { label: 'Đã nộp / Đang duyệt', count: statusCounts.submitted + statusCounts.received + statusCounts.reviewing, color: 'bg-blue-500' },
                { label: 'Đã duyệt', count: statusCounts.approved, color: 'bg-green-500' },
                { label: 'Từ chối', count: statusCounts.rejected, color: 'bg-red-400' },
                { label: 'Chờ phỏng vấn', count: statusCounts.interview_scheduled, color: 'bg-purple-500' },
                { label: 'Đã phỏng vấn', count: statusCounts.interviewed, color: 'bg-indigo-500' },
                { label: 'Đã đánh giá', count: statusCounts.evaluated + statusCounts.finalized, color: 'bg-teal-500' },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-20 text-xs text-gray-500 text-right">{item.label}</div>
                  <div className="flex-1 h-6 bg-gray-100 rounded-lg overflow-hidden">
                    <div
                      className={`h-full ${item.color} rounded-lg transition-all flex items-center justify-end pr-2`}
                      style={{width: statusCounts.total > 0 ? `${Math.max((item.count / statusCounts.total) * 100, 2)}%` : '2%'}}
                    >
                      {item.count > 0 && <span className="text-white text-xs font-bold">{item.count}</span>}
                    </div>
                  </div>
                  <div className="w-8 text-xs text-gray-600 font-bold">{item.count}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* By Department */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-600" />
              Phân bổ theo Ban
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {deptStats.map((dept, i) => {
                const pct = statusCounts.total > 0 ? (dept.count / statusCounts.total) * 100 : 0
                const colors = ['bg-blue-500', 'bg-emerald-500', 'bg-purple-500']
                return (
                  <div key={dept.id}>
                    <div className="flex justify-between text-sm mb-1.5">
                      <span className="font-medium text-gray-700">{dept.name}</span>
                      <span className="font-bold text-gray-900">{dept.count} đơn</span>
                    </div>
                    <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${colors[i % colors.length]} rounded-full transition-all`}
                        style={{width: `${Math.max(pct, 1)}%`}}
                      />
                    </div>
                    <div className="text-xs text-gray-400 mt-0.5">{pct.toFixed(1)}%</div>
                  </div>
                )
              })}
            </div>

            <div className="mt-6 pt-4 border-t border-gray-100">
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: `TOP ${quota} PASS`, value: rankStats.pass, color: 'text-green-600', bg: 'bg-green-50' },
                  { label: 'Dự bị', value: rankStats.waitlist, color: 'text-amber-600', bg: 'bg-amber-50' },
                  { label: 'Không đạt', value: rankStats.fail, color: 'text-red-600', bg: 'bg-red-50' },
                ].map((item, i) => (
                  <div key={i} className={`${item.bg} rounded-xl p-3 text-center`}>
                    <div className={`text-xl font-black ${item.color}`}>{item.value}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{item.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-blue-600" />
            Tình trạng tuyển dụng
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Chỉ tiêu tuyển', value: `${quota} người`, desc: 'Cấu hình hệ thống' },
              { label: 'Đã chấm điểm', value: `${evalStats.submitted}/${apps.filter(a => ['interviewed','evaluated','finalized'].includes(a.status)).length}`, desc: 'Phiếu đánh giá' },
              { label: 'Điểm trung bình', value: evalStats.avgScore, desc: 'Toàn bộ ứng viên' },
              { label: 'Phỏng vấn xong', value: `${ivws.filter(i => i.status === 'completed').length}/${ivws.length}`, desc: 'Buổi phỏng vấn' },
            ].map((item, i) => (
              <div key={i} className="bg-gray-50 rounded-xl p-4">
                <div className="text-lg font-black text-blue-700">{item.value}</div>
                <div className="text-sm font-medium text-gray-900 mt-0.5">{item.label}</div>
                <div className="text-xs text-gray-400 mt-1">{item.desc}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
