import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ArrowLeft, User, FileText, Calendar, Star, Clock } from 'lucide-react'
import { APPLICATION_STATUS_LABELS, APPLICATION_STATUS_COLORS, formatDate, formatDateTime, RESULT_COLORS, RESULT_LABELS } from '@/lib/utils'
import { type ApplicationStatus } from '@/types/database'

export default async function CandidateDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()

  const { data: application } = await supabase
    .from('applications')
    .select(`
      *,
      profiles:user_id(full_name, email, student_id, phone, date_of_birth, university, cohort, major, high_school, address, gender, avatar_url),
      departments!applications_department_id_fkey(name, slug, color),
      second_dept:second_department_id(name)
    `)
    .eq('id', params.id)
    .single()

  if (!application) notFound()

  const { data: answers } = await supabase
    .from('application_answers')
    .select('*, questions(question_text, question_type, sort_order)')
    .eq('application_id', params.id)
    .order('questions(sort_order)', { ascending: true })

  const { data: interviews } = await supabase
    .from('interviews')
    .select('*, interview_slots(*)')
    .eq('application_id', params.id)

  const { data: evaluations } = await supabase
    .from('evaluations')
    .select('*, profiles:interviewer_id(full_name), evaluation_scores(*, evaluation_criteria(name, max_score, sort_order))')
    .eq('application_id', params.id)

  const { data: ranking } = await supabase
    .from('candidate_rankings')
    .select('*')
    .eq('application_id', params.id)
    .single()

  const profile = application.profiles as any
  const dept = application.departments as any

  return (
    <div className="space-y-6 max-w-5xl animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin/candidates">
          <Button variant="outline" size="sm" className="gap-2">
            <ArrowLeft className="w-4 h-4" /> Quay lại
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-black text-gray-900">{profile?.full_name || 'Ứng viên'}</h1>
          <p className="text-gray-500 text-sm">{profile?.email} · MSSV: {profile?.student_id || '—'}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${APPLICATION_STATUS_COLORS[application.status as ApplicationStatus] || 'bg-gray-100 text-gray-700'}`}>
            {APPLICATION_STATUS_LABELS[application.status as ApplicationStatus] || application.status}
          </span>
          {ranking && (
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${RESULT_COLORS[ranking.result] || ''}`}>
              {RESULT_LABELS[ranking.result] || ranking.result}
            </span>
          )}
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Ban đăng ký', value: dept?.name || '—', icon: User },
          { label: 'Ngày nộp đơn', value: formatDate(application.submitted_at), icon: FileText },
          { label: 'Điểm cuối cùng', value: ranking?.final_score ? `${Number(ranking.final_score).toFixed(1)}/100` : '—', icon: Star },
          { label: 'Xếp hạng', value: ranking?.rank_number ? `#${ranking.rank_number}` : '—', icon: Clock },
        ].map((item, i) => (
          <Card key={i} className="bg-blue-50/50 border-blue-100">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-9 h-9 bg-white rounded-xl flex items-center justify-center shadow-sm">
                <item.icon className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <div className="text-xs text-gray-500">{item.label}</div>
                <div className="font-bold text-gray-900 text-sm">{item.value}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile">Hồ sơ</TabsTrigger>
          <TabsTrigger value="answers">Câu trả lời</TabsTrigger>
          <TabsTrigger value="interview">Phỏng vấn</TabsTrigger>
          <TabsTrigger value="evaluation">Chấm điểm</TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile">
          <Card>
            <CardHeader><CardTitle className="text-base">Thông tin cá nhân</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                {[
                  { label: 'Họ và tên', value: profile?.full_name },
                  { label: 'Email', value: profile?.email },
                  { label: 'MSSV', value: profile?.student_id },
                  { label: 'Số điện thoại', value: profile?.phone },
                  { label: 'Ngày sinh', value: formatDate(profile?.date_of_birth) },
                  { label: 'Giới tính', value: profile?.gender },
                  { label: 'Trường', value: profile?.university },
                  { label: 'Khóa', value: profile?.cohort },
                  { label: 'Ngành học', value: profile?.major },
                  { label: 'THPT từng học', value: profile?.high_school },
                  { label: 'Địa chỉ', value: profile?.address },
                  { label: 'Nguyện vọng 1', value: dept?.name },
                  { label: 'Nguyện vọng 2', value: (application.second_dept as any)?.name || '—' },
                ].map((item, i) => (
                  <div key={i}>
                    <div className="text-xs text-gray-500 mb-0.5">{item.label}</div>
                    <div className="font-medium text-gray-900 text-sm">{item.value || '—'}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Answers Tab */}
        <TabsContent value="answers">
          <Card>
            <CardHeader><CardTitle className="text-base">Câu trả lời ứng tuyển</CardTitle></CardHeader>
            <CardContent>
              {!answers || answers.length === 0 ? (
                <div className="text-center py-8 text-gray-400">Chưa có câu trả lời nào.</div>
              ) : (
                <div className="space-y-6">
                  {answers.map((ans, i) => (
                    <div key={ans.id} className="border-l-2 border-blue-200 pl-4">
                      <div className="text-sm font-semibold text-gray-700 mb-2">
                        {i + 1}. {(ans.questions as any)?.question_text}
                      </div>
                      <div className="text-sm text-gray-900 bg-gray-50 rounded-lg p-3">
                        {ans.answer_text || (ans.answer_options ? JSON.stringify(ans.answer_options) : <span className="text-gray-400 italic">Chưa trả lời</span>)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Interview Tab */}
        <TabsContent value="interview">
          <Card>
            <CardHeader><CardTitle className="text-base">Lịch phỏng vấn</CardTitle></CardHeader>
            <CardContent>
              {!interviews || interviews.length === 0 ? (
                <div className="text-center py-8 text-gray-400">Chưa có lịch phỏng vấn.</div>
              ) : (
                <div className="space-y-4">
                  {interviews.map(iv => {
                    const slot = iv.interview_slots as any
                    return (
                      <div key={iv.id} className="bg-blue-50 border border-blue-100 rounded-xl p-5">
                        <div className="grid grid-cols-2 gap-4">
                          <div><span className="text-xs text-gray-500">Ngày</span><div className="font-semibold">{formatDate(slot?.interview_date)}</div></div>
                          <div><span className="text-xs text-gray-500">Giờ</span><div className="font-semibold">{slot?.start_time?.slice(0,5)} — {slot?.end_time?.slice(0,5)}</div></div>
                          <div><span className="text-xs text-gray-500">Hình thức</span><div className="font-semibold capitalize">{slot?.format === 'online' ? 'Online' : 'Offline'}</div></div>
                          <div><span className="text-xs text-gray-500">Trạng thái</span>
                            <div className="font-semibold">
                              <Badge variant={iv.status === 'completed' ? 'success' : 'secondary'} className="text-xs mt-0.5">
                                {iv.status === 'scheduled' ? 'Đã đặt lịch' : iv.status === 'completed' ? 'Hoàn thành' : iv.status}
                              </Badge>
                            </div>
                          </div>
                          {slot?.location && <div><span className="text-xs text-gray-500">Địa điểm</span><div className="font-semibold">{slot.location}</div></div>}
                          {slot?.meeting_url && <div className="col-span-2"><span className="text-xs text-gray-500">Meeting URL</span><div><a href={slot.meeting_url} className="text-blue-600 text-sm hover:underline" target="_blank" rel="noopener noreferrer">{slot.meeting_url}</a></div></div>}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Evaluation Tab */}
        <TabsContent value="evaluation">
          <div className="space-y-4">
            {!evaluations || evaluations.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-gray-400">Chưa có phiếu đánh giá nào.</CardContent>
              </Card>
            ) : (
              evaluations.map(ev => {
                const interviewer = ev.profiles as any
                const scores = ev.evaluation_scores as any[]
                return (
                  <Card key={ev.id}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm">
                          Người chấm: <span className="text-blue-600">{interviewer?.full_name || '—'}</span>
                        </CardTitle>
                        <Badge variant={ev.status === 'submitted' ? 'default' : 'secondary'}>
                          {ev.status === 'submitted' ? 'Đã gửi' : 'Bản nháp'}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 mb-4">
                        {scores?.sort((a,b) => (a.evaluation_criteria?.sort_order || 0) - (b.evaluation_criteria?.sort_order || 0)).map((s: any) => (
                          <div key={s.id} className="flex items-center gap-3">
                            <div className="flex-1 text-sm text-gray-700">{s.evaluation_criteria?.name}</div>
                            <div className="text-sm font-bold text-blue-700">{s.score}/{s.evaluation_criteria?.max_score}</div>
                            <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div className="h-full bg-blue-500 rounded-full" style={{width: `${(s.score / (s.evaluation_criteria?.max_score || 1)) * 100}%`}} />
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                        <div className="text-sm font-semibold text-gray-600">Tổng điểm:</div>
                        <div className="text-xl font-black text-blue-700">{Number(ev.total_score)?.toFixed(1) || '—'}/100</div>
                      </div>
                      {ev.overall_comment && (
                        <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                          <div className="text-xs text-gray-500 mb-1">Nhận xét</div>
                          <div className="text-sm text-gray-700">{ev.overall_comment}</div>
                        </div>
                      )}
                      {ev.recommendation && (
                        <div className="mt-2">
                          <span className="text-xs text-gray-500">Đề xuất: </span>
                          <Badge variant={ev.recommendation === 'pass' ? 'success' : ev.recommendation === 'waitlist' ? 'warning' : 'destructive'}>
                            {ev.recommendation === 'pass' ? 'Đạt' : ev.recommendation === 'waitlist' ? 'Dự bị' : 'Không đạt'}
                          </Badge>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )
              })
            )}

            {/* Average score summary */}
            {evaluations && evaluations.length > 0 && ranking && (
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="py-4 flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold text-blue-800">Điểm tổng hợp (TB các interviewer)</div>
                    <div className="text-xs text-blue-600 mt-0.5">Từ {evaluations.length} phiếu đánh giá</div>
                  </div>
                  <div className="text-3xl font-black text-blue-700">{Number(ranking.final_score)?.toFixed(1)}</div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
