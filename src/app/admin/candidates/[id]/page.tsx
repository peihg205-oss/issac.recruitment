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
  RESULT_COLORS, RESULT_LABELS, getCandidateCode 
} from '@/lib/utils'
import { type ApplicationStatus } from '@/types/database'
import { MOCK_CANDIDATES, getCandidateApplicationAnswers } from '@/lib/mock-data'
import { CandidateDetailAccountBtn } from "@/components/admin/candidate-detail-account-btn"

export default async function CandidateDetailPage({ params }: { params: Promise<{ id: string }> | { id: string } }) {
  const resolvedParams = await params
  const id = resolvedParams.id
  const supabase = await createClient()

  let application: any = null
  let answers: any[] | null = null
  let interviews: any[] | null = null
  let evaluations: any[] | null = null
  let ranking: any = null
  let candidateCode = 'ISSAC-01'

  try {
    const [{ data: app }, { data: allApps }] = await Promise.all([
      supabase
        .from('applications')
        .select(`
          *,
          departments!applications_department_id_fkey(name, slug, color),
          second_dept:second_department_id(name)
        `)
        .eq('id', id)
        .single(),
      supabase
        .from('applications')
        .select('id, submitted_at, created_at')
        .order('created_at', { ascending: true })
    ])

    const appsList = (allApps && allApps.length > 0) ? allApps : MOCK_CANDIDATES
    candidateCode = getCandidateCode(id, appsList)

    if (app) {
      const { data: prof } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', app.user_id)
        .maybeSingle()

      application = { ...app, profiles: prof || { full_name: 'Ứng viên', email: '', student_id: '' } }
    }

    const [ansRes, intRes, evRes, rankRes] = await Promise.all([
      supabase
        .from('application_answers')
        .select('*, questions(question_text, question_type, sort_order)')
        .eq('application_id', id),
      supabase
        .from('interviews')
        .select('*, interview_slots(*)')
        .eq('application_id', id),
      supabase
        .from('evaluations')
        .select('*, evaluation_scores(*, evaluation_criteria(name, max_score, sort_order))')
        .eq('application_id', id),
      supabase
        .from('candidate_rankings')
        .select('*')
        .eq('application_id', id)
        .maybeSingle()
    ])

    answers = ansRes.data
    interviews = intRes.data
    evaluations = evRes.data
    ranking = rankRes.data
  } catch (err) {
    console.error('Error fetching candidate detail:', err)
  }

  const mockCandidate = MOCK_CANDIDATES.find(c => c.id === id)
  if (!application && !mockCandidate) notFound()

  const appData = application || mockCandidate
  const profile = appData.profiles as any
  const dept = appData.departments as any
  const finalRanking = ranking || mockCandidate?.candidate_rankings

  // Facebook URL resolution (from profiles.facebook_url or profiles.address)
  const facebookUrl = (profile as any)?.facebook_url || 
    (profile?.address?.includes('facebook.com') || profile?.address?.startsWith('http') ? profile.address : null)

  // Exact submission timestamp
  const submissionTimestamp = appData.submitted_at || appData.created_at
  const { dateStr, timeStr } = formatFullTimestamp(submissionTimestamp)

  // Candidate answers (Real Supabase answers if available, otherwise mock)
  const candidateAnswers = (answers && answers.length > 0)
    ? answers.map((ans, idx) => ({
        question_id: ans.question_id || ans.id,
        question_order: (ans.questions as any)?.sort_order ?? idx + 1,
        category_label: 'Câu hỏi tuyển quân',
        question_type: (ans.questions as any)?.question_type || 'long_text',
        question_text: (ans.questions as any)?.question_text || 'Câu hỏi',
        answer_text: ans.answer_text,
        file_url: ans.file_url,
        options: (ans.answer_options as string[]) || [],
        selected_option: ans.answer_text || (Array.isArray(ans.answer_options) ? ans.answer_options.join(', ') : ''),
        is_submitted: true,
      }))
    : getCandidateApplicationAnswers(id)

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-fade-in pb-12 font-sans">
      {/* 1. TOP NAVIGATION: Nút quay lại danh sách độc lập, thẩm mỹ, đúng chuẩn UI */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1">
        <Link 
          href="/admin/candidates"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:text-[#1657c1] hover:border-blue-300 text-xs sm:text-sm font-bold transition-all shadow-xs hover:shadow-sm group w-fit cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 text-slate-500 group-hover:-translate-x-1 transition-transform" />
          <span>Quay lại danh sách ứng viên</span>
        </Link>

        <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
          <span>Quản trị tuyển quân</span>
          <span className="text-slate-300">/</span>
          <span>Hồ sơ ứng viên</span>
          <span className="text-slate-300">/</span>
          <span className="font-bold text-slate-900">{profile?.full_name || 'Ứng viên'}</span>
        </div>
      </div>

      {/* 2. MASTER CANDIDATE DOSSIER CARD: Bố cục khoa học, typography sắc nét, không bị lặp thông tin */}
      <Card className="border border-slate-200/90 shadow-sm bg-white rounded-3xl overflow-hidden">
        {/* Hero Header */}
        <div className="p-6 sm:p-7 bg-gradient-to-r from-blue-50/90 via-white to-indigo-50/50 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-start sm:items-center gap-4 sm:gap-5">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#1657c1] to-blue-700 text-white flex items-center justify-center font-black text-2xl shadow-md ring-4 ring-blue-50 shrink-0">
              {profile?.full_name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  {profile?.full_name || 'Ứng viên'}
                </h1>
                <Badge className="bg-blue-100 text-[#1657c1] border-blue-200 text-xs font-black px-2.5 py-0.5">
                  {profile?.cohort || 'K22'}
                </Badge>
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap border shadow-2xs ${APPLICATION_STATUS_COLORS[appData.status as ApplicationStatus] || 'bg-gray-100 text-gray-700'}`}>
                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${appData.status === 'draft' ? 'bg-amber-500' : appData.status === 'finalized' || appData.status === 'approved' ? 'bg-emerald-500' : 'bg-blue-500'}`} />
                  <span>{APPLICATION_STATUS_LABELS[appData.status as ApplicationStatus] || appData.status}</span>
                </span>
                <Badge variant="outline" className="bg-white text-slate-700 border-slate-300 text-xs font-semibold">
                  {dept?.name || 'Ban chưa chọn'}
                </Badge>
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs sm:text-sm text-slate-600 mt-2.5 font-medium">
                <span className="flex items-center gap-1.5">
                  <span className="text-slate-400 font-semibold">Mã hồ sơ:</span>
                  <strong className="font-mono text-[#1657c1] font-bold">
                    {candidateCode}
                  </strong>
                </span>
                <span className="hidden sm:inline text-slate-300">•</span>
                <span className="flex items-center gap-1.5">
                  <span className="text-slate-400 font-semibold">MSSV:</span>
                  <strong className="font-mono text-slate-900 font-bold">{profile?.student_id || '—'}</strong>
                </span>
                <span className="hidden sm:inline text-slate-300">•</span>
                <span className="flex items-center gap-1.5">
                  <span className="text-slate-400 font-semibold">Ngành học:</span>
                  <strong className="text-slate-800">{profile?.major || 'VNU-IS'}</strong>
                </span>
                <span className="hidden sm:inline text-slate-300">•</span>
                <span className="flex items-center gap-1.5">
                  <span className="text-slate-400 font-semibold">Trường:</span>
                  <span className="text-slate-700">{profile?.university || 'Trường Quốc tế - ĐHQGHN'}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons & Submission Time */}
          <div className="flex flex-wrap items-center lg:flex-col lg:items-end gap-3 shrink-0 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-100">
            <div className="flex items-center gap-2.5">
              <CandidateDetailAccountBtn candidate={appData} />
              {facebookUrl && (
                <a
                  href={facebookUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-xs"
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>Trang Facebook</span>
                  <ExternalLink className="w-3 h-3 opacity-80" />
                </a>
              )}
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-medium border border-slate-200/60">
              <Clock className="w-3.5 h-3.5 text-[#1657c1] shrink-0" />
              <span>Thời gian nộp: <strong className="font-mono text-slate-900 font-bold">{timeStr}</strong> · {dateStr}</span>
            </div>
          </div>
        </div>

        {/* Thông tin nhân khẩu & học vụ chi tiết */}
        <div className="p-6 grid grid-cols-2 sm:grid-cols-4 gap-4 bg-white text-xs sm:text-sm">
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Số điện thoại liên hệ</div>
            <div className="font-mono font-bold text-slate-900 mt-1 text-sm">{profile?.phone || '—'}</div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Email trường (VNU)</div>
            <div className="font-mono font-bold text-slate-900 mt-1 text-xs truncate" title={profile?.email}>{profile?.email || '—'}</div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Ngày sinh & Giới tính</div>
            <div className="font-bold text-slate-900 mt-1">
              {profile?.date_of_birth ? profile.date_of_birth : '—'} · {profile?.gender || '—'}
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Trường THPT</div>
            <div className="font-bold text-slate-900 mt-1 truncate" title={profile?.high_school}>{profile?.high_school || '—'}</div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Ban đăng ký (NV1)</div>
            <div className="font-bold text-[#1657c1] mt-1">{dept?.name || '—'}</div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Điểm phỏng vấn PV</div>
            <div className="font-bold text-amber-600 mt-1 font-mono text-sm">
              {finalRanking?.final_score != null ? `${Number(finalRanking.final_score).toFixed(1)}/10` : 'Chưa chấm'}
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Thứ hạng toàn CLB</div>
            <div className="font-bold text-amber-600 mt-1">
              {finalRanking?.rank_number ? `#${finalRanking.rank_number}` : 'Đang xét'}
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Facebook cá nhân</div>
            <div className="font-semibold text-blue-600 mt-1 truncate">
              {facebookUrl ? (
                <a href={facebookUrl} target="_blank" rel="noreferrer" className="underline hover:text-blue-800">
                  {facebookUrl}
                </a>
              ) : (
                <span className="text-slate-400 font-normal italic">Chưa cập nhật</span>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* 3. TABS HỆ THỐNG: Tách bạch rõ ràng, font chữ to rõ, không bị trùng lặp banner */}
      <Tabs defaultValue="answers" className="w-full">
        <TabsList className="grid grid-cols-3 w-full max-w-xl bg-slate-100 p-1.5 rounded-2xl">
          <TabsTrigger value="answers" className="gap-2 font-bold text-xs sm:text-sm data-[state=active]:bg-white data-[state=active]:shadow-xs rounded-xl py-2">
            <FileText className="w-4 h-4 text-[#1657c1]" />
            <span>Câu trả lời ({candidateAnswers.length})</span>
          </TabsTrigger>
          <TabsTrigger value="profile" className="gap-2 font-bold text-xs sm:text-sm data-[state=active]:bg-white data-[state=active]:shadow-xs rounded-xl py-2">
            <User className="w-4 h-4 text-purple-600" />
            <span>Hồ sơ chi tiết</span>
          </TabsTrigger>
          <TabsTrigger value="evaluation" className="gap-2 font-bold text-xs sm:text-sm data-[state=active]:bg-white data-[state=active]:shadow-xs rounded-xl py-2">
            <Star className="w-4 h-4 text-amber-500" />
            <span>Phiếu chấm & Giải trình</span>
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: CÂU TRẢ LỜI ĐƠN ỨNG TUYỂN */}
        <TabsContent value="answers" className="space-y-4 pt-3">
          <div className="flex items-center justify-between px-1">
            <div className="text-sm font-bold text-slate-800">
              Chi tiết bài làm từng câu hỏi tuyển quân ({candidateAnswers.length} câu)
            </div>
            <div className="text-xs text-slate-500 font-medium">
              Ban ứng tuyển: <strong className="text-[#1657c1]">{dept?.name}</strong>
            </div>
          </div>

          {/* List of answers */}
          <div className="space-y-4">
            {candidateAnswers.map((item) => (
              <Card key={item.question_id} className="border border-slate-200/90 shadow-2xs rounded-2xl overflow-hidden transition-all hover:border-blue-300">
                <CardHeader className="py-4 px-5 sm:px-6 bg-slate-50/70 border-b border-slate-100 flex flex-row items-start justify-between gap-3">
                  <div className="flex items-start gap-3.5">
                    <span className="px-2.5 py-1 rounded-lg bg-[#1657c1] text-white flex items-center justify-center text-xs font-black shrink-0 mt-0.5 shadow-2xs">
                      Câu {item.question_order}
                    </span>
                    <div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <Badge variant="outline" className="text-[10px] font-bold bg-white text-slate-600 border-slate-200">
                          {item.category_label}
                        </Badge>
                        {item.question_type === 'multiple_choice' && (
                          <Badge className="text-[10px] font-bold bg-emerald-50 text-emerald-800 border-emerald-200">
                            Trắc nghiệm
                          </Badge>
                        )}
                        {item.question_type === 'long_text' && (
                          <Badge className="text-[10px] font-bold bg-blue-50 text-[#1657c1] border-blue-200">
                            Tự luận chi tiết
                          </Badge>
                        )}
                        {item.question_type === 'link' && (
                          <Badge className="text-[10px] font-bold bg-purple-50 text-purple-800 border-purple-200">
                            Hồ sơ đính kèm
                          </Badge>
                        )}
                      </div>
                      <CardTitle className="text-sm sm:text-base font-bold text-slate-900 leading-snug">
                        {item.question_text}
                      </CardTitle>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="p-5 sm:p-6 space-y-3.5">
                  {/* Options selection for multiple choice */}
                  {item.options && item.options.length > 0 && (
                    <div className="space-y-1.5 pb-2">
                      <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                        Lựa chọn của ứng viên:
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {item.options.map((opt, i) => {
                          const isSelected = opt === item.selected_option
                          return (
                            <div 
                              key={i} 
                              className={`p-3 rounded-xl text-xs sm:text-sm flex items-center gap-2.5 border transition-all ${
                                isSelected 
                                  ? 'bg-emerald-50/80 border-emerald-300 font-bold text-emerald-950 shadow-2xs' 
                                  : 'bg-slate-50/40 border-slate-200 text-slate-500 opacity-75'
                              }`}
                            >
                              <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${
                                isSelected ? 'bg-emerald-600 text-white' : 'border border-slate-300'
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
                  <div className="p-4 sm:p-5 rounded-2xl bg-blue-50/30 border border-blue-100/80 text-slate-800 leading-relaxed">
                    <div className="text-[11px] font-bold text-[#1657c1] mb-1.5 uppercase tracking-wider">
                      Nội dung trả lời từ ứng viên:
                    </div>
                    <div className="whitespace-pre-line text-sm sm:text-[15px] text-slate-900 font-normal leading-relaxed">
                      {item.answer_text ? item.answer_text : <span className="text-slate-400 italic">Chưa có câu trả lời</span>}
                    </div>

                    {/* Auto-detect Google Drive / Portfolio / External URLs */}
                    {(() => {
                      const text = item.answer_text || ''
                      const matches = text.match(/(https?:\/\/[^\s"'<>]+)/g) || []
                      if (matches.length === 0) return null
                      return (
                        <div className="mt-3 pt-3 border-t border-blue-100 flex flex-wrap gap-2">
                          {matches.map((url: string, idx: number) => {
                            const isDrive = url.includes('drive.google.com') || url.includes('docs.google.com')
                            const isCanva = url.includes('canva.com')
                            return (
                              <a
                                key={idx}
                                href={url}
                                target="_blank"
                                rel="noreferrer"
                                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs ${
                                  isDrive
                                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                                    : isCanva
                                    ? 'bg-purple-600 hover:bg-purple-700 text-white'
                                    : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                }`}
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                                {isDrive ? 'Mở Google Drive đính kèm' : isCanva ? 'Mở Canva Portfolio' : 'Mở liên kết đính kèm'}
                              </a>
                            )
                          })}
                        </div>
                      )
                    })()}

                    {/* File URL directly attached */}
                    {(item as any).file_url && (
                      <div className="mt-3 pt-3 border-t border-blue-100 flex flex-wrap gap-2">
                        <a
                          href={(item as any).file_url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs bg-indigo-600 hover:bg-indigo-700 text-white"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          Mở tệp đính kèm câu trả lời
                        </a>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* TAB 2: HỒ SƠ CHI TIẾT ỨNG VIÊN */}
        <TabsContent value="profile" className="space-y-4 pt-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Personal credentials */}
            <Card className="shadow-2xs border border-slate-200/90 rounded-2xl overflow-hidden">
              <CardHeader className="py-3.5 px-5 border-b border-slate-100 bg-slate-50/70">
                <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <User className="w-4 h-4 text-[#1657c1]" />
                  Thông tin nhân khẩu học & Liên hệ
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5 space-y-3.5 text-xs sm:text-sm">
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500 font-medium">Họ và tên</span>
                  <span className="font-bold text-slate-900">{profile?.full_name}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500 font-medium">Mã số sinh viên (MSSV)</span>
                  <span className="font-mono font-bold text-slate-900">{profile?.student_id || 'Chưa cập nhật'}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500 font-medium">Email trường (VNU)</span>
                  <span className="font-mono font-semibold text-slate-800">{profile?.email}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500 font-medium">Số điện thoại liên hệ</span>
                  <span className="font-mono font-bold text-slate-900">{profile?.phone || '—'}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500 font-medium">Giới tính</span>
                  <span className="font-semibold text-slate-900">{profile?.gender || '—'}</span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-slate-500 font-medium">Facebook cá nhân</span>
                  <span className="text-blue-600 truncate max-w-[200px]">
                    {facebookUrl ? (
                      <a href={facebookUrl} target="_blank" rel="noreferrer" className="underline hover:text-blue-800 inline-flex items-center gap-1 font-semibold">
                        {facebookUrl}
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    ) : 'Chưa cập nhật'}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Academic details */}
            <Card className="shadow-2xs border border-slate-200/90 rounded-2xl overflow-hidden">
              <CardHeader className="py-3.5 px-5 border-b border-slate-100 bg-slate-50/70">
                <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-purple-600" />
                  Học vụ & Nguyện vọng CLB
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5 space-y-3.5 text-xs sm:text-sm">
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500 font-medium">Trường đào tạo</span>
                  <span className="font-bold text-slate-900">Trường Quốc tế - ĐHQGHN (VNU-IS)</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500 font-medium">Ngành học chuyên ngành</span>
                  <span className="font-bold text-slate-900">{profile?.major || '—'}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500 font-medium">Đợt tuyển quân</span>
                  <Badge className="bg-purple-50 text-purple-800 border-purple-200 font-bold">
                    {profile?.cohort || 'K22'}
                  </Badge>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500 font-medium">Điểm GPA tích lũy</span>
                  <span className="font-bold text-amber-600 font-mono text-sm">
                    {profile?.gpa ? `${profile.gpa}/4.00` : '—'}
                  </span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500 font-medium">Ban đăng ký (NV1)</span>
                  <span className="font-bold text-[#1657c1]">{dept?.name}</span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-slate-500 font-medium">Thời gian nộp đơn</span>
                  <span className="font-mono text-xs text-slate-700 font-bold">
                    {timeStr} · {dateStr}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Bio statement */}
          <Card className="shadow-2xs border border-slate-200/90 rounded-2xl overflow-hidden">
            <CardHeader className="py-3.5 px-5 border-b border-slate-100 bg-slate-50/70">
              <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-emerald-600" />
                Giới thiệu bản thân & Điểm mạnh cá nhân
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5">
              <p className="text-xs sm:text-sm text-slate-800 leading-relaxed italic bg-emerald-50/40 p-4 rounded-xl border border-emerald-200/60">
                "{profile?.bio || 'Ứng viên chưa cập nhật phần giới thiệu bản thân.'}"
              </p>
            </CardContent>
          </Card>

          {/* Kênh kết nối Facebook cá nhân */}
          {facebookUrl && (
            <Card className="shadow-xs border border-blue-200 bg-blue-50/20">
              <CardHeader className="py-3 px-5 border-b bg-blue-50/60">
                <CardTitle className="text-sm font-bold text-blue-950 flex items-center gap-2">
                  <Globe className="w-4 h-4 text-blue-600" />
                  Kênh kết nối Facebook cá nhân của ứng viên
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-white rounded-xl border border-blue-100 shadow-2xs">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                      <Globe className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-gray-900">
                        Facebook chính thức của ứng viên
                      </div>
                      <div className="text-[11px] text-gray-500 truncate max-w-[280px] sm:max-w-[450px]">
                        {facebookUrl}
                      </div>
                    </div>
                  </div>
                  <a
                    href={facebookUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-xs shrink-0"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Mở trang Facebook cá nhân
                  </a>
                </div>
              </CardContent>
            </Card>
          )}
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
                <Link href={`/admin/evaluation/${id}`}>
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
