import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  CheckCircle, Clock, FileText, Calendar, Trophy,
  ArrowRight, AlertCircle, ChevronRight, User
} from 'lucide-react'
import { APPLICATION_STATUS_LABELS, APPLICATION_STATUS_COLORS, formatDateTime } from '@/lib/utils'
import { type ApplicationStatus } from '@/types/database'

const TIMELINE_STEPS = [
  { key: 'submitted', label: 'Đã nộp đơn', icon: FileText },
  { key: 'received', label: 'Đã nhận đơn', icon: CheckCircle },
  { key: 'approved', label: 'Đã duyệt hồ sơ', icon: CheckCircle },
  { key: 'interview_scheduled', label: 'Chuyển vòng PV', icon: Calendar },
  { key: 'interviewed', label: 'Đã phỏng vấn', icon: CheckCircle },
  { key: 'evaluated', label: 'Đã đánh giá', icon: CheckCircle },
  { key: 'finalized', label: 'Công bố kết quả', icon: Trophy },
]

const STATUS_ORDER: ApplicationStatus[] = [
  'draft','submitted','received','reviewing','approved',
  'interview_scheduled','interviewed','evaluating','evaluated','finalized'
]

function getTimelineStatus(currentStatus: ApplicationStatus, stepKey: string) {
  const currentIdx = STATUS_ORDER.indexOf(currentStatus)
  const stepStatuses: Record<string, ApplicationStatus> = {
    submitted: 'submitted', received: 'received', approved: 'approved',
    interview_scheduled: 'interview_scheduled', interviewed: 'interviewed',
    evaluated: 'evaluated', finalized: 'finalized',
  }
  const stepIdx = STATUS_ORDER.indexOf(stepStatuses[stepKey] || 'draft')
  if (currentIdx >= stepIdx + 1) return 'done'
  if (currentIdx === stepIdx) return 'current'
  return 'pending'
}

export default async function MemberDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*, departments(name, color)')
    .eq('id', user.id)
    .single()

  const { data: application } = await supabase
    .from('applications')
    .select('*, departments!applications_department_id_fkey(name, slug, color)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  const { data: interview } = application ? await supabase
    .from('interviews')
    .select('*, interview_slots(*)')
    .eq('application_id', application.id)
    .single() : { data: null }

  const { data: ranking } = application ? await supabase
    .from('candidate_rankings')
    .select('*')
    .eq('application_id', application.id)
    .single() : { data: null }

  const { data: finalResult } = application ? await supabase
    .from('final_results')
    .select('*')
    .eq('application_id', application.id)
    .single() : { data: null }

  const { data: notifications } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', user.id)
    .eq('is_read', false)
    .order('created_at', { ascending: false })
    .limit(5)

  const { data: settings } = await supabase
    .from('system_settings')
    .select('key, value')
    .in('key', ['results_published'])

  const resultsPublished = settings?.find(s => s.key === 'results_published')?.value === 'true'

  const profileComplete = !!(profile?.full_name && profile?.phone && profile?.student_id && profile?.university)

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome header */}
      <div className="bg-gradient-to-br from-blue-900 to-blue-700 rounded-3xl p-8 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-32 translate-x-32" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-24 -translate-x-16" />
        <div className="relative">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-blue-200 text-sm font-medium mb-1">Xin chào,</p>
              <h1 className="text-2xl sm:text-3xl font-black mb-2">
                {profile?.full_name || 'Ứng viên'} 👋
              </h1>
              <p className="text-blue-200 text-sm">
                Chào mừng bạn đến với iSSAC Portal — Mùa tuyển thành viên 2026
              </p>
            </div>
            <div className="hidden sm:flex w-16 h-16 bg-white/10 rounded-2xl items-center justify-center border border-white/20 flex-shrink-0">
              <User className="w-8 h-8 text-blue-200" />
            </div>
          </div>

          {application && (
            <div className="mt-6 flex flex-wrap gap-3">
              <div className="bg-white/15 border border-white/20 rounded-xl px-4 py-2 text-sm">
                <span className="text-blue-200">Ban:</span>{' '}
                <span className="font-bold">{(application as any).departments?.name || '—'}</span>
              </div>
              <div className={`rounded-xl px-4 py-2 text-sm font-medium ${APPLICATION_STATUS_COLORS[application.status as ApplicationStatus] || 'bg-gray-100 text-gray-700'}`}>
                {APPLICATION_STATUS_LABELS[application.status as ApplicationStatus] || application.status}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Profile incomplete warning */}
      {!profileComplete && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold text-amber-800 text-sm">Hồ sơ chưa hoàn thiện</p>
            <p className="text-amber-700 text-sm">Vui lòng điền đầy đủ thông tin cá nhân trước khi ứng tuyển.</p>
          </div>
          <Link href="/member/profile">
            <Button size="sm" className="bg-amber-500 hover:bg-amber-600 text-white">Điền ngay</Button>
          </Link>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: 'Trạng thái đơn',
            value: application ? APPLICATION_STATUS_LABELS[application.status as ApplicationStatus] : 'Chưa có',
            icon: FileText,
            color: 'bg-blue-50',
            iconColor: 'text-blue-600',
          },
          {
            label: 'Lịch phỏng vấn',
            value: interview ? formatDateTime((interview.interview_slots as any)?.interview_date) : 'Chưa có',
            icon: Calendar,
            color: 'bg-emerald-50',
            iconColor: 'text-emerald-600',
          },
          {
            label: 'Xếp hạng',
            value: ranking?.rank_number ? `#${ranking.rank_number}` : '—',
            icon: Trophy,
            color: 'bg-amber-50',
            iconColor: 'text-amber-600',
          },
          {
            label: 'Thông báo mới',
            value: notifications?.length || 0,
            icon: AlertCircle,
            color: 'bg-purple-50',
            iconColor: 'text-purple-600',
          },
        ].map((stat, i) => (
          <Card key={i} className={`${stat.color} border-0`}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm`}>
                <stat.icon className={`w-5 h-5 ${stat.iconColor}`} />
              </div>
              <div>
                <div className="text-xs text-gray-500">{stat.label}</div>
                <div className="font-bold text-gray-900 text-sm">{stat.value}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Application Timeline */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Tiến trình ứng tuyển</CardTitle>
          </CardHeader>
          <CardContent>
            {!application ? (
              <div className="text-center py-8">
                <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 text-sm mb-4">Bạn chưa có đơn ứng tuyển nào.</p>
                <Link href="/member/application">
                  <Button size="sm">Nộp đơn ngay</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {TIMELINE_STEPS.map((step, i) => {
                  const status = getTimelineStatus(application.status as ApplicationStatus, step.key)
                  return (
                    <div key={step.key} className="flex items-center gap-3">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold transition-all ${
                        status === 'done' ? 'bg-green-500 text-white' :
                        status === 'current' ? 'bg-blue-600 text-white ring-4 ring-blue-100' :
                        'bg-gray-100 text-gray-400'
                      }`}>
                        {status === 'done' ? <CheckCircle className="w-4 h-4" /> :
                         status === 'current' ? <Clock className="w-4 h-4" /> : i + 1}
                      </div>
                      <div className="flex-1">
                        <div className={`text-sm font-medium ${
                          status === 'done' ? 'text-green-700' :
                          status === 'current' ? 'text-blue-700 font-bold' :
                          'text-gray-400'
                        }`}>{step.label}</div>
                      </div>
                      {status === 'current' && (
                        <Badge variant="secondary" className="text-xs">Hiện tại</Badge>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick actions & Result */}
        <div className="space-y-4">
          {/* Final result card */}
          {finalResult && resultsPublished && (
            <Card className={`border-2 ${
              finalResult.result === 'pass' ? 'border-green-300 bg-green-50' :
              finalResult.result === 'waitlist' ? 'border-amber-300 bg-amber-50' :
              'border-red-200 bg-red-50'
            }`}>
              <CardContent className="p-6 text-center">
                <div className="text-4xl mb-3">
                  {finalResult.result === 'pass' ? '🎉' : finalResult.result === 'waitlist' ? '⏳' : '😔'}
                </div>
                <h3 className={`text-xl font-black mb-2 ${
                  finalResult.result === 'pass' ? 'text-green-800' :
                  finalResult.result === 'waitlist' ? 'text-amber-800' : 'text-red-800'
                }`}>
                  {finalResult.result === 'pass' ? 'CHÚC MỪNG! Bạn đã đạt!' :
                   finalResult.result === 'waitlist' ? 'Bạn đang ở danh sách dự bị' :
                   'Cảm ơn bạn đã tham gia'}
                </h3>
                <p className={`text-sm ${
                  finalResult.result === 'pass' ? 'text-green-700' :
                  finalResult.result === 'waitlist' ? 'text-amber-700' : 'text-red-700'
                }`}>
                  {finalResult.announcement_message || (
                    finalResult.result === 'pass'
                      ? 'Bạn đã trở thành thành viên chính thức của iSSAC!'
                      : 'Cảm ơn bạn đã nộp đơn ứng tuyển vào iSSAC.'
                  )}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Quick Actions */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Hành động nhanh</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {[
                { href: '/member/application', label: application ? 'Xem đơn ứng tuyển' : 'Nộp đơn ứng tuyển', icon: FileText, show: true },
                { href: '/member/profile', label: 'Cập nhật hồ sơ', icon: User, show: true },
                { href: '/member/interview', label: 'Chọn lịch phỏng vấn', icon: Calendar, show: application?.status === 'approved' },
                { href: '/member/result', label: 'Xem kết quả', icon: Trophy, show: resultsPublished },
              ].filter(a => a.show).map((action, i) => (
                <Link key={i} href={action.href}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-blue-50 transition-colors group">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-600 transition-colors">
                    <action.icon className="w-4 h-4 text-blue-600 group-hover:text-white transition-colors" />
                  </div>
                  <span className="text-sm font-medium text-gray-700 group-hover:text-blue-700 flex-1">{action.label}</span>
                  <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-blue-600" />
                </Link>
              ))}
            </CardContent>
          </Card>

          {/* Notifications */}
          {notifications && notifications.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Thông báo mới</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {notifications.slice(0, 3).map(notif => (
                  <div key={notif.id} className="flex gap-3">
                    <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                      notif.type === 'success' ? 'bg-green-500' :
                      notif.type === 'warning' ? 'bg-amber-500' :
                      notif.type === 'error' ? 'bg-red-500' : 'bg-blue-500'
                    }`} />
                    <div>
                      <div className="text-sm font-medium text-gray-900">{notif.title}</div>
                      <div className="text-xs text-gray-500">{notif.message}</div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
