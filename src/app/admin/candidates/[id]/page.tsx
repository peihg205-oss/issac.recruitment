import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ArrowLeft, User, FileText, Calendar, Star, Clock, UserCheck, ShieldAlert } from 'lucide-react'
import { APPLICATION_STATUS_LABELS, APPLICATION_STATUS_COLORS, formatDate, formatDateTime, RESULT_COLORS, RESULT_LABELS } from '@/lib/utils'
import { type ApplicationStatus } from '@/types/database'
import { MOCK_CANDIDATES } from '@/lib/mock-data'

export default async function CandidateDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()

  let application: any = null
  let answers: any[] | null = null
  let interviews: any[] | null = null
  let evaluations: any[] | null = null
  let ranking: any = null

  try {
    const { data: app } = await supabase
      .from('applications')
      .select(`
        *,
        profiles:user_id(full_name, email, student_id, phone, date_of_birth, university, cohort, major, high_school, address, gender, avatar_url),
        departments!applications_department_id_fkey(name, slug, color),
        second_dept:second_department_id(name)
      `)
      .eq('id', params.id)
      .single()

    application = app

    const [ansRes, intRes, evRes, rankRes] = await Promise.all([
      supabase
        .from('application_answers')
        .select('*, questions(question_text, question_type, sort_order)')
        .eq('application_id', params.id)
        .order('questions(sort_order)', { ascending: true }),
      supabase
        .from('interviews')
        .select('*, interview_slots(*)')
        .eq('application_id', params.id),
      supabase
        .from('evaluations')
        .select('*, profiles:interviewer_id(full_name), evaluation_scores(*, evaluation_criteria(name, max_score, sort_order))')
        .eq('application_id', params.id),
      supabase
        .from('candidate_rankings')
        .select('*')
        .eq('application_id', params.id)
        .single()
    ])

    answers = ansRes.data
    interviews = intRes.data
    evaluations = evRes.data
    ranking = rankRes.data
  } catch {
    // Demo fallback
  }

  const mockCandidate = MOCK_CANDIDATES.find(c => c.id === params.id)
  if (!application && !mockCandidate) notFound()

  const appData = application || mockCandidate
  const profile = appData.profiles as any
  const dept = appData.departments as any
  const finalRanking = ranking || mockCandidate?.candidate_rankings

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/admin/candidates">
            <Button variant="outline" size="sm" className="gap-2">
              <ArrowLeft className="w-4 h-4" /> Quay lại
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-black text-gray-900">{profile?.full_name || 'Ứng viên'}</h1>
            <p className="text-gray-500 text-sm">{profile?.email} · MSSV: {profile?.student_id || '—'}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${APPLICATION_STATUS_COLORS[appData.status as ApplicationStatus] || 'bg-gray-100 text-gray-700'}`}>
            {APPLICATION_STATUS_LABELS[appData.status as ApplicationStatus] || appData.status}
          </span>
          {finalRanking && (
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${RESULT_COLORS[finalRanking.result as keyof typeof RESULT_COLORS] || ''}`}>
              {RESULT_LABELS[finalRanking.result as keyof typeof RESULT_LABELS] || finalRanking.result}
            </span>
          )}
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
              <User className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-gray-500">Ban đăng ký</div>
              <div className="font-bold text-sm text-gray-900">{dept?.name}</div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center">
              <Star className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-gray-500">Điểm phỏng vấn</div>
              <div className="font-black text-lg text-blue-700">
                {finalRanking?.final_score != null ? `${Number(finalRanking.final_score).toFixed(1)}/10` : '—'}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-gray-500">Người chấm</div>
              <div className="font-bold text-xs text-gray-900 truncate max-w-[130px]">
                {mockCandidate?.evaluator?.name || 'Giám khảo Ban'}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-gray-500">Thứ hạng toàn CLB</div>
              <div className="font-black text-lg text-amber-600">
                {finalRanking?.rank_number ? `#${finalRanking.rank_number}` : '—'}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="evaluation" className="w-full">
        <TabsList className="grid grid-cols-3 w-full max-w-md bg-gray-100">
          <TabsTrigger value="evaluation">Phiếu chấm & Lý giải</TabsTrigger>
          <TabsTrigger value="profile">Hồ sơ cá nhân</TabsTrigger>
          <TabsTrigger value="answers">Câu trả lời</TabsTrigger>
        </TabsList>

        {/* Tab 1: Evaluation and Justification */}
        <TabsContent value="evaluation" className="space-y-4 pt-3">
          {mockCandidate?.evaluation_data ? (
            <div className="space-y-4">
              {/* Evaluator Card */}
              <Card className="shadow-sm border border-blue-200 bg-blue-50/40">
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="text-xs text-blue-800 font-bold uppercase">Giám khảo chấm điểm</div>
                      <div className="font-black text-gray-900 text-sm">{mockCandidate.evaluator?.name}</div>
                      <div className="text-xs text-gray-600 font-mono">{mockCandidate.evaluator?.email}</div>
                    </div>
                    <div className="text-right">
                      <Badge className="bg-blue-100 text-blue-800 border-blue-300">
                        {mockCandidate.evaluator?.department_name}
                      </Badge>
                      <div className="text-[11px] text-gray-500 mt-1">
                        Ghi nhận lúc: {mockCandidate.evaluator?.evaluated_at}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Justification Box */}
              <Card className="shadow-sm border border-amber-200 bg-amber-50/30">
                <CardHeader className="py-3 border-b bg-amber-50/60">
                  <CardTitle className="text-sm font-bold text-amber-950">
                    Lý giải chi tiết cho điểm số (Giải trình của Giám khảo)
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-3">
                  <p className="text-xs text-gray-800 leading-relaxed italic">
                    "{mockCandidate.evaluation_data.score_justification}"
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
                    <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200">
                      <strong className="text-emerald-900 block mb-1">Điểm mạnh:</strong>
                      <span className="text-gray-700">{mockCandidate.evaluation_data.strengths}</span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-gray-50 border border-gray-200">
                      <strong className="text-gray-900 block mb-1">Cần cải thiện:</strong>
                      <span className="text-gray-700">{mockCandidate.evaluation_data.weaknesses}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between pt-2 border-t text-xs">
                    <div>
                      <span className="text-gray-500">Đề xuất sơ bộ của Ban: </span>
                      <strong className="uppercase text-blue-800">
                        {mockCandidate.evaluation_data.dept_recommendation_label}
                      </strong>
                    </div>
                    <div>
                      <span className="text-gray-500">Quyết định Ban Chủ nhiệm: </span>
                      <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 font-bold ml-1">
                        {mockCandidate.evaluation_data.bcn_decision.toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Action Button */}
              <div className="flex justify-end">
                <Link href={`/admin/evaluation/${params.id}`}>
                  <Button variant="gold" size="sm" className="gap-1.5 font-bold">
                    <Star className="w-4 h-4" /> Mở giao diện chấm điểm & chỉnh sửa
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <Card>
              <CardContent className="py-8 text-center text-gray-400">
                Chưa có phiếu đánh giá nào cho ứng viên này.
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Tab 2: Profile details */}
        <TabsContent value="profile" className="space-y-4 pt-3">
          <Card className="shadow-sm">
            <CardHeader><CardTitle className="text-base">Thông tin cá nhân ứng viên</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                <div><div className="text-xs text-gray-500">Họ và tên</div><div className="font-semibold">{profile?.full_name}</div></div>
                <div><div className="text-xs text-gray-500">Email</div><div className="font-semibold">{profile?.email}</div></div>
                <div><div className="text-xs text-gray-500">Số điện thoại</div><div className="font-semibold">{profile?.phone || '—'}</div></div>
                <div><div className="text-xs text-gray-500">Trường</div><div className="font-semibold">{profile?.university || 'VNU-IS'}</div></div>
                <div><div className="text-xs text-gray-500">Ngành học</div><div className="font-semibold">{profile?.major || '—'}</div></div>
                <div><div className="text-xs text-gray-500">Khóa</div><div className="font-semibold">{profile?.cohort || '—'}</div></div>
                <div><div className="text-xs text-gray-500">GPA</div><div className="font-semibold">{profile?.gpa || '—'}</div></div>
                <div><div className="text-xs text-gray-500">Giới tính</div><div className="font-semibold">{profile?.gender || '—'}</div></div>
                <div><div className="text-xs text-gray-500">Ban ứng tuyển</div><div className="font-semibold">{dept?.name}</div></div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 3: Answers */}
        <TabsContent value="answers" className="space-y-4 pt-3">
          <Card className="shadow-sm">
            <CardHeader><CardTitle className="text-base">Câu trả lời ứng tuyển</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-4 text-sm">
                <div className="border-l-2 border-blue-400 pl-3">
                  <div className="font-bold text-gray-800 text-xs mb-1">1. Giới thiệu bản thân và lý do ứng tuyển iSSAC?</div>
                  <p className="text-gray-700 bg-gray-50 p-3 rounded-lg text-xs leading-relaxed">
                    {profile?.bio || 'Em mong muốn trở thành Đại sứ sinh viên iSSAC để lan tỏa hình ảnh năng động của Trường Quốc tế đến cộng đồng sinh viên.'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
