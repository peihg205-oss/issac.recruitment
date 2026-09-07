import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  CheckCircle, Clock, FileText, Calendar, Trophy,
  ArrowRight, AlertCircle, ChevronRight, User, Sparkles
} from 'lucide-react'
import { APPLICATION_STATUS_LABELS, APPLICATION_STATUS_COLORS, formatDateTime } from '@/lib/utils'
import { type ApplicationStatus } from '@/types/database'
import { MOCK_CANDIDATES } from '@/lib/mock-data'

const TIMELINE_STEPS = [
  { key: 'submitted', label: '1. Đã nộp đơn', icon: FileText },
  { key: 'received', label: '2. Đã tiếp nhận hồ sơ', icon: CheckCircle },
  { key: 'approved', label: '3. Duyệt hồ sơ & Vòng đơn', icon: CheckCircle },
  { key: 'interview_scheduled', label: '4. Đặt lịch phỏng vấn', icon: Calendar },
  { key: 'interviewed', label: '5. Tham gia phỏng vấn', icon: CheckCircle },
  { key: 'evaluated', label: '6. Hội đồng chấm điểm', icon: CheckCircle },
  { key: 'finalized', label: '7. Công bố kết quả TOP 15', icon: Trophy },
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

  let profile: any = null
  let application: any = null
  let interview: any = null
  let ranking: any = null
  let finalResult: any = null
  let notifications: any[] = []
  let resultsPublished = true

  try {
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      const [{ data: prof }, { data: app }, { data: iv }, { data: rk }, { data: fr }, { data: notifs }, { data: setts }] = await Promise.all([
        supabase.from('profiles').select('*, departments(name, color)').eq('id', user.id).single(),
        supabase.from('applications').select('*, departments!applications_department_id_fkey(name, color, slug)').eq('user_id', user.id).limit(1).single(),
        supabase.from('interviews').select('*, interview_slots(*)').eq('user_id', user.id).limit(1).single(),
        supabase.from('candidate_rankings').select('rank_number, final_score, result, applications!inner(user_id)').eq('applications.user_id', user.id).single(),
        supabase.from('final_results').select('*').eq('user_id', user.id).single(),
        supabase.from('notifications').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(5),
        supabase.from('system_settings').select('key, value').eq('key', 'results_published').single()
      ])

      profile = prof
      application = app
      interview = iv
      ranking = rk
      finalResult = fr
      notifications = notifs || []
      resultsPublished = setts?.value === 'true'
    }
  } catch {
    // Fallback handled below
  }

  // Demo fallback applicant: Nguyen Ha Phuong
  if (!profile) {
    const demoCand = MOCK_CANDIDATES[0]
    profile = {
      full_name: demoCand.profiles.full_name,
      student_id: demoCand.profiles.student_id,
      email: demoCand.profiles.email,
      phone: demoCand.profiles.phone,
      university: demoCand.profiles.university,
      major: demoCand.profiles.major,
      cohort: demoCand.profiles.cohort,
    }
    application = {
      id: demoCand.id,
      status: demoCand.status,
      submitted_at: demoCand.submitted_at,
      departments: demoCand.departments,
    }
    interview = {
      interview_slots: {
        interview_date: '2026-09-12',
        start_time: '08:30',
        end_time: '10:00',
        location: 'Phòng Hội đồng 302, Nhà C, VNU-IS (Làng Sinh viên HACINCO)',
        format: 'offline',
      }
    }
    ranking = {
      rank_number: demoCand.candidate_rankings.rank_number,
      final_score: demoCand.candidate_rankings.final_score,
      result: demoCand.candidate_rankings.result,
    }
    finalResult = {
      result: 'pass',
      announcement_message: 'Chúc mừng bạn đã xuất sắc vượt qua các vòng tuyển chọn và trở thành Thành viên chính thức của CLB Đại sứ Sinh viên iSSAC (TOP 1 Toàn CLB)!',
    }
    notifications = [
      { id: 'n1', type: 'success', title: 'Chúc mừng trúng tuyển', message: 'Bạn đã chính thức lọt vào TOP 15 Thành viên chính thức iSSAC.', created_at: '2026-09-05' },
      { id: 'n2', type: 'info', title: 'Nhắc lịch phỏng vấn', message: 'Ca phỏng vấn của bạn đã hoàn thành với điểm số 9.6/10.', created_at: '2026-09-04' },
    ]
    resultsPublished = true
  }

  const dept = application?.departments as any

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-blue-800 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-amber-300 border border-white/15 mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            CỔNG THÔNG TIN ỨNG VIÊN iSSAC
          </div>
          <h1 className="text-2xl sm:text-3xl font-black mb-2">
            Xin chào, {profile?.full_name}!
          </h1>
          <p className="text-blue-200 text-sm max-w-xl leading-relaxed">
            Theo dõi tiến trình hồ sơ, ca phỏng vấn và kết quả xét tuyển chính thức vào Câu lạc bộ Đại sứ Sinh viên (iSSAC).
          </p>

          <div className="mt-5 flex flex-wrap gap-2.5">
            <Link href="/member/application">
              <Button size="sm" variant="gold" className="font-bold gap-1.5 shadow-md">
                <FileText className="w-4 h-4" /> Xem đơn ứng tuyển
              </Button>
            </Link>
            <Link href="/member/interview">
              <Button size="sm" variant="outline" className="text-white border-white/30 hover:bg-white/10 font-bold gap-1.5">
                <Calendar className="w-4 h-4" /> Lịch phỏng vấn
              </Button>
            </Link>
            <Link href="/member/result">
              <Button size="sm" variant="outline" className="text-white border-white/30 hover:bg-white/10 font-bold gap-1.5">
                <Trophy className="w-4 h-4 text-amber-400" /> Tra cứu kết quả
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: 'Ban đăng ký',
            value: dept?.name || 'Chưa chọn',
            icon: FileText,
            color: 'bg-blue-50 border-blue-200',
            iconColor: 'text-blue-600',
          },
          {
            label: 'Lịch phỏng vấn',
            value: interview ? `${interview.interview_slots?.interview_date} (${interview.interview_slots?.start_time})` : 'Chưa có',
            icon: Calendar,
            color: 'bg-emerald-50 border-emerald-200',
            iconColor: 'text-emerald-600',
          },
          {
            label: 'Thứ hạng & Điểm PV',
            value: ranking?.rank_number ? `#${ranking.rank_number} (${Number(ranking.final_score).toFixed(1)}đ)` : '—',
            icon: Trophy,
            color: 'bg-amber-50 border-amber-200',
            iconColor: 'text-amber-600',
          },
          {
            label: 'Trạng thái vòng tuyển',
            value: application ? (APPLICATION_STATUS_LABELS[application.status as ApplicationStatus] || application.status) : 'Chưa nộp',
            icon: CheckCircle,
            color: 'bg-purple-50 border-purple-200',
            iconColor: 'text-purple-600',
          },
        ].map((stat, i) => (
          <Card key={i} className={`${stat.color} border shadow-sm`}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                <stat.icon className={`w-5 h-5 ${stat.iconColor}`} />
              </div>
              <div>
                <div className="text-xs text-gray-500 font-medium">{stat.label}</div>
                <div className="font-bold text-gray-900 text-sm mt-0.5">{stat.value}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Application Timeline */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3 border-b bg-gray-50/50">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-600" />
              Lộ trình 7 bước tuyển thành viên
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5">
            <div className="space-y-4">
              {TIMELINE_STEPS.map((step, i) => {
                const status = application ? getTimelineStatus(application.status as ApplicationStatus, step.key) : 'pending'
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
                      <div className={`text-sm font-semibold ${
                        status === 'done' ? 'text-green-700' :
                        status === 'current' ? 'text-blue-700 font-bold' :
                        'text-gray-400'
                      }`}>
                        {step.label}
                      </div>
                    </div>
                    {status === 'current' && (
                      <Badge className="bg-blue-50 text-blue-700 border-blue-200 text-xs">Hiện tại</Badge>
                    )}
                    {status === 'done' && (
                      <span className="text-xs text-green-600 font-semibold">Hoàn thành</span>
                    )}
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Right column: Results & Quick Actions */}
        <div className="space-y-4">
          {/* Final Result Card */}
          {finalResult && resultsPublished && (
            <Card className="border-2 border-emerald-300 bg-gradient-to-br from-emerald-50 to-teal-50 shadow-sm overflow-hidden">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 mx-auto rounded-2xl bg-emerald-600 text-white flex items-center justify-center mb-3 shadow-md">
                  <Trophy className="w-6 h-6 text-amber-300" />
                </div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold mb-2">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                  KẾT QUẢ CHÍNH THỨC: TRÚNG TUYỂN
                </div>
                <h3 className="text-xl font-black text-emerald-950 mb-2">
                  CHÚC MỪNG BẠN ĐÃ TRÚNG TUYỂN!
                </h3>
                <p className="text-xs text-emerald-800 leading-relaxed max-w-md mx-auto">
                  {finalResult.announcement_message}
                </p>

                <div className="mt-4 pt-3 border-t border-emerald-200 flex justify-center gap-6 text-center">
                  <div>
                    <div className="text-xs text-emerald-700 font-medium">Thứ hạng toàn CLB</div>
                    <div className="text-2xl font-black text-emerald-900">#{ranking?.rank_number || 1}</div>
                  </div>
                  <div>
                    <div className="text-xs text-emerald-700 font-medium">Điểm phỏng vấn</div>
                    <div className="text-2xl font-black text-blue-700">{ranking?.final_score || 9.6}/10</div>
                  </div>
                  <div>
                    <div className="text-xs text-emerald-700 font-medium">Ban trúng tuyển</div>
                    <div className="text-xs font-bold text-gray-900 mt-2">{dept?.name || 'Ban Truyền thông'}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Quick Actions */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3 border-b bg-gray-50/50">
              <CardTitle className="text-base font-bold">Thao tác ứng viên</CardTitle>
            </CardHeader>
            <CardContent className="p-3 space-y-1">
              {[
                { href: '/member/application', label: 'Xem đơn ứng tuyển & câu trả lời', icon: FileText },
                { href: '/member/interview', label: 'Chi tiết ca phỏng vấn & phòng thi', icon: Calendar },
                { href: '/member/result', label: 'Xem thông báo kết quả & bước tiếp theo', icon: Trophy },
                { href: '/member/profile', label: 'Cập nhật thông tin sinh viên', icon: User },
              ].map((action, i) => (
                <Link key={i} href={action.href}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-blue-50 transition-colors group">
                  <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center group-hover:bg-blue-600 transition-colors">
                    <action.icon className="w-4 h-4 text-blue-600 group-hover:text-white transition-colors" />
                  </div>
                  <span className="text-xs font-bold text-gray-700 group-hover:text-blue-700 flex-1">{action.label}</span>
                  <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-blue-600" />
                </Link>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
