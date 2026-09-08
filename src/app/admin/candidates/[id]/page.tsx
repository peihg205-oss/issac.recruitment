import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  ArrowLeft, User, FileText, Calendar, Star, Clock, UserCheck, 
  ShieldAlert, ExternalLink, Mail, Phone, GraduationCap, Award, 
  CheckCircle2, Building, Globe, Check, BookOpen
} from 'lucide-react'
import { 
  APPLICATION_STATUS_LABELS, APPLICATION_STATUS_COLORS, 
  formatDate, formatDateTime, formatFullTimestamp, 
  RESULT_COLORS, RESULT_LABELS 
} from '@/lib/utils'
import { type ApplicationStatus } from '@/types/database'
import { MOCK_CANDIDATES, getCandidateApplicationAnswers } from '@/lib/mock-data'

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
        profiles:user_id(full_name, email, student_id, phone, date_of_birth, university, cohort, major, high_school, address, gender, avatar_url, cv_url, facebook_url, gpa, bio),
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

  // Exact submission timestamp
  const submissionTimestamp = appData.submitted_at || appData.created_at
  const { dateStr, timeStr } = formatFullTimestamp(submissionTimestamp)

  // Candidate answers (mock enriched or Supabase answers)
  const candidateAnswers = getCandidateApplicationAnswers(params.id)

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border shadow-xs">
        <div className="flex items-center gap-4">
          <Link href="/admin/candidates">
            <Button variant="outline" size="sm" className="gap-2 font-medium hover:bg-gray-100">
              <ArrowLeft className="w-4 h-4" /> Quay lại danh sách
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl sm:text-2xl font-black text-gray-900">{profile?.full_name || 'Ứng viên'}</h1>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${APPLICATION_STATUS_COLORS[appData.status as ApplicationStatus] || 'bg-gray-100 text-gray-700'}`}>
                {APPLICATION_STATUS_LABELS[appData.status as ApplicationStatus] || appData.status}
              </span>
            </div>
            <p className="text-gray-500 text-xs sm:text-sm mt-0.5">
              {profile?.email} · MSSV: <span className="font-mono font-semibold text-gray-700">{profile?.student_id || '—'}</span> · {profile?.cohort || 'K23'} {profile?.major || 'VNU-IS'}
            </p>
          </div>
        </div>

        {/* Right Header: Exact Giờ Gửi & Final Result */}
        <div className="flex flex-wrap sm:flex-col items-start sm:items-end gap-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 text-blue-800 border border-blue-200 text-xs font-semibold shadow-2xs">
            <Clock className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <span>Giờ gửi hồ sơ: <strong className="font-mono font-black text-blue-900">{timeStr}</strong> · {dateStr}</span>
          </div>

          {finalRanking && (
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-gray-500">Kết quả:</span>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${RESULT_COLORS[finalRanking.result as keyof typeof RESULT_COLORS] || ''}`}>
                {RESULT_LABELS[finalRanking.result as keyof typeof RESULT_LABELS] || finalRanking.result}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Summary 4 KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Department */}
        <Card className="shadow-xs border hover:border-blue-200 transition-colors">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
              <Building className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="text-xs text-gray-500">Ban đăng ký (NV1)</div>
              <div className="font-black text-sm text-gray-900 truncate">{dept?.name || 'Chưa chọn'}</div>
              <div className="text-[11px] text-gray-400 truncate">Trường Quốc tế - VNU-IS</div>
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Submission exact time */}
        <Card className="shadow-xs border border-blue-100 bg-blue-50/20 hover:border-blue-300 transition-colors">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Clock className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="text-xs text-blue-800 font-semibold">Thời gian gửi đơn</div>
              <div className="font-black text-base font-mono text-gray-900">{timeStr}</div>
              <div className="text-[11px] text-gray-500 font-medium">Ngày {dateStr}</div>
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Interview Score */}
        <Card className="shadow-xs border hover:border-purple-200 transition-colors">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center shrink-0">
              <Star className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="text-xs text-gray-500">Điểm phỏng vấn PV</div>
              <div className="font-black text-lg text-blue-700">
                {finalRanking?.final_score != null ? `${Number(finalRanking.final_score).toFixed(1)}/10` : '—'}
              </div>
              <div className="text-[11px] text-gray-400 truncate">
                Chấm: {mockCandidate?.evaluator?.name || 'Giám khảo Ban'}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card 4: CLB Rank & Result */}
        <Card className="shadow-xs border hover:border-amber-200 transition-colors">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
              <Award className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="text-xs text-gray-500">Thứ hạng toàn CLB</div>
              <div className="font-black text-lg text-amber-600">
                {finalRanking?.rank_number ? `#${finalRanking.rank_number}` : '—'}
              </div>
              <div className="text-[11px] text-gray-500">
                {finalRanking?.result ? RESULT_LABELS[finalRanking.result as keyof typeof RESULT_LABELS] || finalRanking.result : 'Đang xét'}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs: Default value is 'answers' as explicitly requested */}
      <Tabs defaultValue="answers" className="w-full">
        <TabsList className="grid grid-cols-3 w-full max-w-lg bg-gray-100 p-1 rounded-xl">
          <TabsTrigger value="answers" className="gap-2 font-bold text-xs sm:text-sm data-[state=active]:bg-white data-[state=active]:shadow-xs">
            <FileText className="w-4 h-4 text-blue-600" />
            Câu trả lời ({candidateAnswers.length})
          </TabsTrigger>
          <TabsTrigger value="profile" className="gap-2 font-bold text-xs sm:text-sm data-[state=active]:bg-white data-[state=active]:shadow-xs">
            <User className="w-4 h-4 text-purple-600" />
            Hồ sơ ứng viên
          </TabsTrigger>
          <TabsTrigger value="evaluation" className="gap-2 font-bold text-xs sm:text-sm data-[state=active]:bg-white data-[state=active]:shadow-xs">
            <Star className="w-4 h-4 text-amber-500" />
            Phiếu chấm & Giải trình
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: CÂU TRẢ LỜI ĐƠN ỨNG TUYỂN */}
        <TabsContent value="answers" className="space-y-4 pt-3">
          {/* Submission Info Banner */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-blue-50/90 to-indigo-50/70 border border-blue-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
            <div>
              <div className="text-xs font-bold text-blue-900 uppercase tracking-wide">
                Đơn Ứng Tuyển Đại Sứ Sinh Viên iSSAC — Đợt Tuyển Quân Mới
              </div>
              <div className="text-xs text-blue-700 mt-0.5">
                Ứng viên: <strong className="text-blue-950 font-bold">{profile?.full_name}</strong> · Ban đăng ký: <strong className="text-blue-950 font-bold">{dept?.name}</strong>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-[11px] text-gray-500">Giờ gửi hệ thống ghi nhận:</div>
                <div className="text-xs font-mono font-black text-blue-900 flex items-center justify-end gap-1">
                  <Clock className="w-3.5 h-3.5 text-blue-600" />
                  {timeStr} · {dateStr}
                </div>
              </div>
              {profile?.cv_url && (
                <a 
                  href={profile.cv_url} 
                  target="_blank" 
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition-colors shadow-2xs"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Mở CV
                </a>
              )}
            </div>
          </div>

          {/* List of answers */}
          <div className="space-y-4">
            {candidateAnswers.map((item) => (
              <Card key={item.question_id} className="border shadow-xs overflow-hidden transition-all hover:border-blue-200">
                <CardHeader className="py-3 px-5 bg-gray-50/80 border-b flex flex-row items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center text-xs font-black shrink-0 mt-0.5 shadow-2xs">
                      {item.question_order}
                    </span>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-[10px] font-semibold bg-white text-gray-600 border-gray-200">
                          {item.category_label}
                        </Badge>
                        {item.question_type === 'multiple_choice' && (
                          <Badge className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200">
                            Trắc nghiệm
                          </Badge>
                        )}
                        {item.question_type === 'long_text' && (
                          <Badge className="text-[10px] bg-blue-50 text-blue-700 border-blue-200">
                            Tự luận chi tiết
                          </Badge>
                        )}
                        {item.question_type === 'link' && (
                          <Badge className="text-[10px] bg-purple-50 text-purple-700 border-purple-200">
                            Hồ sơ đính kèm
                          </Badge>
                        )}
                      </div>
                      <CardTitle className="text-sm font-bold text-gray-900 leading-snug">
                        {item.question_text}
                      </CardTitle>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="p-5 space-y-3">
                  {/* Options selection for multiple choice */}
                  {item.options && item.options.length > 0 && (
                    <div className="space-y-1.5 pb-2">
                      <div className="text-xs font-semibold text-gray-500 mb-1">Lựa chọn của ứng viên:</div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {item.options.map((opt, i) => {
                          const isSelected = opt === item.selected_option
                          return (
                            <div 
                              key={i} 
                              className={`p-2.5 rounded-lg text-xs flex items-center gap-2 border transition-colors ${
                                isSelected 
                                  ? 'bg-emerald-50 border-emerald-300 font-bold text-emerald-900' 
                                  : 'bg-gray-50/50 border-gray-200 text-gray-500 opacity-70'
                              }`}
                            >
                              <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${
                                isSelected ? 'bg-emerald-600 text-white' : 'border border-gray-300'
                              }`}>
                                {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                              </div>
                              <span className="truncate">{opt}</span>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* Main Answer text container */}
                  <div className="p-4 rounded-xl bg-blue-50/30 border border-blue-100 text-sm text-gray-800 leading-relaxed">
                    <div className="text-xs font-bold text-blue-900 mb-1 uppercase tracking-wide">
                      Nội dung trả lời từ ứng viên:
                    </div>
                    <div className="whitespace-pre-line text-xs sm:text-sm text-gray-800 font-normal leading-relaxed">
                      "{item.answer_text}"
                    </div>
                  </div>

                  {/* Attachment links */}
                  {item.question_type === 'link' && (
                    <div className="pt-2 flex flex-wrap gap-2">
                      {profile?.cv_url && (
                        <a 
                          href={profile.cv_url} 
                          target="_blank" 
                          rel="noreferrer"
                          className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white border border-gray-300 text-xs font-bold text-blue-700 hover:bg-blue-50 hover:border-blue-300 transition-colors shadow-2xs"
                        >
                          <FileText className="w-4 h-4 text-blue-600" />
                          Xem CV ứng viên trực tuyến
                          <ExternalLink className="w-3.5 h-3.5 text-gray-400" />
                        </a>
                      )}
                      {profile?.facebook_url && (
                        <a 
                          href={profile.facebook_url} 
                          target="_blank" 
                          rel="noreferrer"
                          className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white border border-gray-300 text-xs font-bold text-indigo-700 hover:bg-indigo-50 hover:border-indigo-300 transition-colors shadow-2xs"
                        >
                          <Globe className="w-4 h-4 text-indigo-600" />
                          Trang Facebook cá nhân
                          <ExternalLink className="w-3.5 h-3.5 text-gray-400" />
                        </a>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* TAB 2: HỒ SƠ CHI TIẾT ỨNG VIÊN */}
        <TabsContent value="profile" className="space-y-4 pt-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Personal credentials */}
            <Card className="shadow-xs border">
              <CardHeader className="py-3 px-5 border-b bg-gray-50/70">
                <CardTitle className="text-sm font-bold text-gray-900 flex items-center gap-2">
                  <User className="w-4 h-4 text-blue-600" />
                  Thông tin nhân khẩu học & Liên hệ
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5 space-y-3.5 text-xs sm:text-sm">
                <div className="flex justify-between py-1 border-b border-gray-100">
                  <span className="text-gray-500">Họ và tên</span>
                  <span className="font-bold text-gray-900">{profile?.full_name}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-100">
                  <span className="text-gray-500">Mã số sinh viên (MSSV)</span>
                  <span className="font-mono font-bold text-gray-900">{profile?.student_id || 'Chưa cập nhật'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-100">
                  <span className="text-gray-500">Email trường (VNU)</span>
                  <span className="font-mono text-gray-800">{profile?.email}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-100">
                  <span className="text-gray-500">Số điện thoại liên hệ</span>
                  <span className="font-semibold text-gray-900">{profile?.phone || '—'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-100">
                  <span className="text-gray-500">Giới tính</span>
                  <span className="font-semibold text-gray-900">{profile?.gender || '—'}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-gray-500">Facebook cá nhân</span>
                  <span className="text-blue-600 truncate max-w-[200px]">
                    {profile?.facebook_url ? (
                      <a href={profile.facebook_url} target="_blank" rel="noreferrer" className="underline hover:text-blue-800">
                        {profile.facebook_url}
                      </a>
                    ) : 'Chưa cập nhật'}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Academic details */}
            <Card className="shadow-xs border">
              <CardHeader className="py-3 px-5 border-b bg-gray-50/70">
                <CardTitle className="text-sm font-bold text-gray-900 flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-purple-600" />
                  Học vụ & Nguyện vọng CLB
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5 space-y-3.5 text-xs sm:text-sm">
                <div className="flex justify-between py-1 border-b border-gray-100">
                  <span className="text-gray-500">Trường đào tạo</span>
                  <span className="font-bold text-gray-900">Trường Quốc tế - ĐHQGHN (VNU-IS)</span>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-100">
                  <span className="text-gray-500">Ngành học chuyên ngành</span>
                  <span className="font-bold text-blue-900">{profile?.major || '—'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-100">
                  <span className="text-gray-500">Đợt tuyển quân</span>
                  <Badge className="bg-purple-50 text-purple-800 border-purple-200 font-bold">
                    {profile?.cohort || 'K23'}
                  </Badge>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-100">
                  <span className="text-gray-500">Điểm GPA tích lũy</span>
                  <span className="font-black text-amber-600 font-mono text-sm">
                    {profile?.gpa ? `${profile.gpa}/4.00` : '—'}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-100">
                  <span className="text-gray-500">Ban đăng ký (NV1)</span>
                  <span className="font-bold text-gray-900">{dept?.name}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-gray-500">Thời gian nộp đơn</span>
                  <span className="font-mono text-xs text-gray-700 font-bold">
                    {timeStr} · {dateStr}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Bio statement */}
          <Card className="shadow-xs border">
            <CardHeader className="py-3 px-5 border-b bg-gray-50/70">
              <CardTitle className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-emerald-600" />
                Giới thiệu bản thân & Điểm mạnh cá nhân
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5">
              <p className="text-xs sm:text-sm text-gray-800 leading-relaxed italic bg-emerald-50/40 p-4 rounded-xl border border-emerald-200/60">
                "{profile?.bio || 'Ứng viên chưa cập nhật phần giới thiệu bản thân.'}"
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 3: PHIẾU CHẤM ĐIỂM & GIẢI TRÌNH */}
        <TabsContent value="evaluation" className="space-y-4 pt-3">
          {mockCandidate?.evaluation_data ? (
            <div className="space-y-4">
              {/* Evaluator Card */}
              <Card className="shadow-xs border border-blue-200 bg-blue-50/40">
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="text-xs text-blue-800 font-bold uppercase tracking-wide">Giám khảo chấm điểm</div>
                      <div className="font-black text-gray-900 text-sm">{mockCandidate.evaluator?.name}</div>
                      <div className="text-xs text-gray-600 font-mono">{mockCandidate.evaluator?.email}</div>
                    </div>
                    <div className="text-right">
                      <Badge className="bg-blue-100 text-blue-800 border-blue-300 font-semibold">
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
              <Card className="shadow-xs border border-amber-200 bg-amber-50/30">
                <CardHeader className="py-3 border-b bg-amber-50/60">
                  <CardTitle className="text-sm font-bold text-amber-950">
                    Lý giải chi tiết cho điểm số (Giải trình của Giám khảo)
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-3">
                  <p className="text-xs sm:text-sm text-gray-800 leading-relaxed italic bg-white p-3.5 rounded-xl border border-amber-200/70">
                    "{mockCandidate.evaluation_data.score_justification}"
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
                    <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                      <strong className="text-emerald-900 block mb-1 text-xs">Điểm mạnh nổi bật:</strong>
                      <span className="text-gray-700">{mockCandidate.evaluation_data.strengths}</span>
                    </div>
                    <div className="p-3 rounded-xl bg-gray-50 border border-gray-200">
                      <strong className="text-gray-900 block mb-1 text-xs">Điểm cần cải thiện:</strong>
                      <span className="text-gray-700">{mockCandidate.evaluation_data.weaknesses}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between pt-3 border-t text-xs">
                    <div>
                      <span className="text-gray-500">Đề xuất sơ bộ của Ban: </span>
                      <strong className="uppercase text-blue-800 font-bold">
                        {mockCandidate.evaluation_data.dept_recommendation_label}
                      </strong>
                    </div>
                    <div>
                      <span className="text-gray-500">Quyết định Ban Chủ nhiệm: </span>
                      <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 font-bold ml-1">
                        {mockCandidate.evaluation_data.bcn_decision.toUpperCase() === 'PASS' ? 'PASS' : 
                         mockCandidate.evaluation_data.bcn_decision.toUpperCase() === 'WAITLIST' ? 'DỰ BỊ' : 'TRƯỢT'}
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
      </Tabs>
    </div>
  )
}
