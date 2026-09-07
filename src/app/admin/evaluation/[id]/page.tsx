'use client'
import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/use-toast'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
  ArrowLeft, Save, Send, User, Star, Loader2, Lock,
  ShieldAlert, CheckCircle2, AlertTriangle, Crown, UserCheck, HelpCircle
} from 'lucide-react'
import Link from 'next/link'
import { getScoreGrade, getScoreGradeColor } from '@/lib/utils'
import { ADMIN_ROLE_CONFIGS, EVALUATOR_ACCOUNTS, type AdminRoleType } from '@/lib/permissions'
import { MOCK_CANDIDATES } from '@/lib/mock-data'

interface Criteria {
  id: string
  name: string
  description: string | null
  max_score: number
  sort_order: number
}

const DEFAULT_CRITERIA: Criteria[] = [
  { id: 'crit-1', name: '1. Thái độ & Tác phong Đại sứ', description: 'Đúng giờ, trang phục lịch sự, tôn trọng hội đồng, năng lượng tích cực', max_score: 2.5, sort_order: 1 },
  { id: 'crit-2', name: '2. Kỹ năng Giao tiếp & Thuyết phục', description: 'Trình bày lưu loát, tự tin, mạch lạc, phản xạ câu hỏi tình huống sắc bén', max_score: 2.5, sort_order: 2 },
  { id: 'crit-3', name: '3. Năng lực Chuyên môn theo Ban', description: 'Kinh nghiệm thực chiến, kỹ năng và mức độ phù hợp với yêu cầu nhiệm vụ của Ban', max_score: 3.0, sort_order: 3 },
  { id: 'crit-4', name: '4. Tinh thần Đồng đội & Cam kết', description: 'Khả năng phối hợp nhóm, thời gian cống hiến và cam kết gắn bó lâu dài với iSSAC', max_score: 2.0, sort_order: 4 },
]

export default function EvaluationDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()
  const applicationId = params.id as string

  // Active admin role from cookie
  const [activeRole, setActiveRole] = useState<AdminRoleType>('chu-nhiem')

  const [application, setApplication] = useState<any>(null)
  const [criteria, setCriteria] = useState<Criteria[]>(DEFAULT_CRITERIA)
  const [scores, setScores] = useState<Record<string, number>>({})
  const [justification, setJustification] = useState('')
  const [strengths, setStrengths] = useState('')
  const [weaknesses, setWeaknesses] = useState('')
  const [recommendation, setRecommendation] = useState<'pass' | 'waitlist' | 'fail' | ''>('')
  const [bcnDecision, setBcnDecision] = useState<'pass' | 'waitlist' | 'fail' | 'pending'>('pending')
  const [bcnNote, setBcnNote] = useState('')
  const [evaluatorInfo, setEvaluatorInfo] = useState<any>(null)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  useEffect(() => {
    const match = document.cookie.match(/issac_admin_role=([^;]+)/)
    if (match && match[1] in ADMIN_ROLE_CONFIGS) {
      setActiveRole(match[1] as AdminRoleType)
    }
  }, [])

  const fetchData = useCallback(async () => {
    setLoading(true)

    try {
      // Find candidate from mock data first
      const mockApp = MOCK_CANDIDATES.find(c => c.id === applicationId) || MOCK_CANDIDATES[0]
      setApplication(mockApp)

      // Initialize from candidate evaluation data
      if (mockApp) {
        if (mockApp.evaluation_data?.criteria_scores) {
          setScores(mockApp.evaluation_data.criteria_scores)
        }
        if (mockApp.evaluation_data?.score_justification) {
          setJustification(mockApp.evaluation_data.score_justification)
        }
        if (mockApp.evaluation_data?.strengths) {
          setStrengths(mockApp.evaluation_data.strengths)
        }
        if (mockApp.evaluation_data?.weaknesses) {
          setWeaknesses(mockApp.evaluation_data.weaknesses)
        }
        if (mockApp.evaluation_data?.dept_recommendation) {
          setRecommendation(mockApp.evaluation_data.dept_recommendation)
        }
        if (mockApp.evaluation_data?.bcn_decision) {
          setBcnDecision(mockApp.evaluation_data.bcn_decision)
        }
        if (mockApp.evaluation_data?.bcn_note) {
          setBcnNote(mockApp.evaluation_data.bcn_note)
        }
        if (mockApp.evaluator) {
          setEvaluatorInfo(mockApp.evaluator)
        }
      }

      // Supabase try (if live backend)
      const [{ data: app }, { data: crits }] = await Promise.all([
        supabase
          .from('applications')
          .select('id, status, profiles:user_id(full_name, student_id, email, phone, major, cohort, cv_url), departments!applications_department_id_fkey(name, slug)')
          .eq('id', applicationId)
          .single(),
        supabase
          .from('evaluation_criteria')
          .select('*')
          .eq('is_active', true)
          .order('sort_order')
      ])

      if (app) {
        setApplication(app)
      }
      if (crits && crits.length > 0) {
        setCriteria(crits)
      }
    } catch {
      // Handled by mockApp above
    } finally {
      setLoading(false)
    }
  }, [applicationId, supabase])

  useEffect(() => { fetchData() }, [fetchData])

  // RBAC Permission Check:
  const roleConfig = ADMIN_ROLE_CONFIGS[activeRole] || ADMIN_ROLE_CONFIGS['chu-nhiem']
  const appDeptSlug = application?.departments?.slug
  const isSuperAdmin = roleConfig.isSuperAdmin
  const canGrade = isSuperAdmin || appDeptSlug === activeRole

  // Current evaluator account details
  const currentEvaluator = EVALUATOR_ACCOUNTS[activeRole] || EVALUATOR_ACCOUNTS['chu-nhiem']
  const displayEvaluator = evaluatorInfo || currentEvaluator

  const handleScoreChange = (criteriaId: string, val: string, maxScore: number) => {
    if (!canGrade || isSubmitted) return
    const num = parseFloat(val)
    if (isNaN(num)) {
      setScores(prev => { const n = { ...prev }; delete n[criteriaId]; return n })
    } else {
      const clamped = Math.min(Math.max(0, num), maxScore)
      setScores(prev => ({ ...prev, [criteriaId]: clamped }))
    }
  }

  const totalScore = Object.values(scores).reduce((sum, s) => sum + s, 0)
  const maxTotal = criteria.reduce((sum, c) => sum + c.max_score, 0)

  const handleSaveEvaluation = async (submit: boolean) => {
    if (!canGrade) {
      toast({ title: 'Không có quyền', description: 'Bạn không thuộc Ban phụ trách ứng viên này.', variant: 'destructive' })
      return
    }

    if (submit && !justification.trim()) {
      toast({
        title: 'Thiếu lý giải điểm số',
        description: 'Vui lòng nhập lý giải chi tiết giải thích tại sao ứng viên được mức điểm này.',
        variant: 'destructive'
      })
      return
    }

    if (submit) setSubmitting(true)
    else setSaving(true)

    // Demo save simulation
    setTimeout(() => {
      if (submit) {
        setSubmitting(false)
        setShowConfirm(false)
        setIsSubmitted(true)
        toast({
          title: 'Đã nộp phiếu chấm điểm & đề xuất!',
          description: `Đã chấm ${totalScore.toFixed(1)}/${maxTotal} điểm kèm lý giải. Đề xuất đã được gửi lên Ban Chủ nhiệm để thẩm định và phê duyệt cuối cùng.`,
          variant: 'success'
        } as Parameters<typeof toast>[0])
      } else {
        setSaving(false)
        toast({
          title: 'Đã lưu bản nháp',
          description: 'Điểm số và phần lý giải đã được lưu tạm.',
          variant: 'success'
        } as Parameters<typeof toast>[0])
      }
    }, 600)
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-2" />
        <p className="text-sm text-gray-500">Đang tải phiếu đánh giá...</p>
      </div>
    )
  }

  const profile = application?.profiles

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in pb-12">
      {/* Top Back Nav */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <Link href="/admin/evaluation" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-blue-700 font-medium transition-colors">
          <ArrowLeft className="w-4 h-4" /> Quay lại danh sách chấm điểm
        </Link>
        <div className="flex items-center gap-2">
          <Badge className={`px-3 py-1 text-xs font-bold border ${roleConfig.badgeColor}`}>
            Quyền chấm: {roleConfig.shortLabel}
          </Badge>
          <Link href="/admin/ranking">
            <Button variant="outline" size="sm" className="h-7 text-xs text-blue-700">
              Xem Bảng xếp hạng
            </Button>
          </Link>
        </div>
      </div>

      {/* Evaluator Identity Card */}
      <Card className="shadow-sm border-2 border-blue-200 bg-gradient-to-r from-blue-50/60 via-white to-indigo-50/60">
        <CardContent className="p-4 sm:p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-black text-base shadow-sm">
                <UserCheck className="w-6 h-6" />
              </div>
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-blue-800">
                  Tài khoản Giám khảo chấm điểm
                </div>
                <div className="font-bold text-base text-gray-900 flex items-center gap-2">
                  <span>{displayEvaluator.name}</span>
                  <Badge variant="outline" className="text-[11px] font-semibold bg-white text-gray-700">
                    {displayEvaluator.departmentName || displayEvaluator.department_name}
                  </Badge>
                </div>
                <div className="text-xs text-gray-600 font-mono mt-0.5">
                  Email: <strong>{displayEvaluator.email}</strong>
                  {displayEvaluator.evaluated_at && (
                    <span className="ml-2 text-gray-500">· Đã ghi nhận lúc: {displayEvaluator.evaluated_at}</span>
                  )}
                </div>
              </div>
            </div>

            <div className="text-left sm:text-right border-t sm:border-t-0 pt-3 sm:pt-0">
              <div className="text-[11px] text-gray-500 font-medium">Tư cách đăng nhập</div>
              <div className="font-bold text-xs text-gray-800">{currentEvaluator.title}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Access Denied Notice if not allowed */}
      {!canGrade && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-red-800 text-sm flex items-start gap-3 shadow-sm">
          <ShieldAlert className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <div className="font-bold">Giới hạn chấm điểm theo Ban</div>
            <p className="text-xs text-red-700 mt-1">
              Bạn đang đăng nhập với tài khoản <strong>{roleConfig.label}</strong>. Ứng viên này đăng ký vào <strong>{application?.departments?.name}</strong>. Theo quy định, chỉ giám khảo của ban đó hoặc Ban Chủ nhiệm mới có quyền cho điểm.
            </p>
          </div>
        </div>
      )}

      {/* Candidate Profile Summary */}
      <Card className="shadow-sm">
        <CardHeader className="border-b bg-gray-50/50 py-3.5">
          <CardTitle className="text-base flex items-center justify-between">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-blue-600" />
              Thông tin ứng viên phỏng vấn
            </div>
            <span className="text-xs text-gray-500 font-normal">Mã hồ sơ: {application?.id}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-5">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <div className="text-xs text-gray-500 mb-0.5">Họ và tên</div>
              <div className="font-bold text-gray-900 text-base">{profile?.full_name}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-0.5">MSSV</div>
              <div className="font-semibold text-gray-800">{profile?.student_id || '—'}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-0.5">Ban ứng tuyển</div>
              <Badge className="bg-blue-50 text-blue-800 border-blue-200 font-bold">
                {application?.departments?.name}
              </Badge>
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-0.5">Chuyên ngành - Khóa</div>
              <div className="font-semibold text-gray-800 text-sm">
                {profile?.major ? `${profile.major} (${profile?.cohort || ''})` : 'VNU-IS'}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Evaluation Criteria Form */}
      <Card className={`shadow-sm ${!canGrade ? 'opacity-60 pointer-events-none' : ''}`}>
        <CardHeader className="border-b bg-gray-50/50 py-3.5 flex flex-row items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Star className="w-4 h-4 text-amber-500" />
            Bảng Tiêu Chí Đánh Giá Phỏng Vấn (Thang 10.0)
          </CardTitle>
          <span className="text-xs text-gray-500 font-medium">Giám khảo: {displayEvaluator.name}</span>
        </CardHeader>
        <CardContent className="p-5 space-y-4">
          {criteria.map((c) => (
            <div key={c.id} className="p-4 rounded-xl bg-gray-50 border border-gray-100 hover:border-blue-200 transition-colors">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex-1">
                  <div className="font-bold text-gray-900 text-sm">{c.name}</div>
                  {c.description && <div className="text-xs text-gray-500 mt-0.5">{c.description}</div>}
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={0}
                    max={c.max_score}
                    step={0.1}
                    value={scores[c.id] ?? ''}
                    onChange={e => handleScoreChange(c.id, e.target.value, c.max_score)}
                    disabled={!canGrade || isSubmitted}
                    placeholder="0.0"
                    className="w-20 h-10 text-center text-lg font-black text-blue-700 border-2 border-blue-300 rounded-xl focus:outline-none focus:border-blue-600 bg-white"
                  />
                  <span className="text-xs text-gray-500 font-bold">/ {c.max_score}đ</span>
                </div>
              </div>
            </div>
          ))}

          {/* Total Score Summary Box */}
          <div className="mt-6 pt-4 border-t flex items-center justify-between bg-blue-50 rounded-2xl p-5 border border-blue-100">
            <div>
              <div className="text-xs font-bold text-blue-900 uppercase tracking-wider">TỔNG ĐIỂM ĐÁNH GIÁ (CHƯA PHẢI KẾT QUẢ CUỐI)</div>
              <div className={`text-sm font-black mt-0.5 ${getScoreGradeColor(totalScore, maxTotal)}`}>
                Xếp loại: {getScoreGrade(totalScore, maxTotal)}
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-black text-blue-900">{totalScore.toFixed(1)}</div>
              <div className="text-xs text-gray-500 font-bold">trên {maxTotal} điểm</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Mandatory Justification Section */}
      <Card className={`shadow-sm border-2 ${!justification.trim() ? 'border-amber-300' : 'border-gray-200'} ${!canGrade ? 'opacity-60 pointer-events-none' : ''}`}>
        <CardHeader className="border-b bg-amber-50/40 py-3.5">
          <CardTitle className="text-base flex items-center justify-between">
            <span className="text-gray-900 font-bold flex items-center gap-2">
              Lý giải chi tiết cho điểm số đã chấm
              <span className="text-red-500">* (Bắt buộc)</span>
            </span>
            <span className="text-xs text-gray-500 font-normal">Ban Chủ nhiệm sẽ thẩm định dựa trên lý giải này</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-5 space-y-4">
          <div>
            <Label className="text-xs font-bold text-gray-800 mb-1.5 block">
              Căn cứ & lý giải vì sao chấm mức điểm trên ({totalScore.toFixed(1)}/10đ)
            </Label>
            <Textarea
              value={justification}
              onChange={e => setJustification(e.target.value)}
              placeholder="Vui lòng giải thích rõ căn cứ vì sao cho mức điểm này: dẫn chứng câu trả lời, sự thể hiện của ứng viên trong buổi phỏng vấn, năng lực thực chiến phù hợp với ban..."
              rows={4}
              disabled={!canGrade || isSubmitted}
              className="text-sm bg-white"
            />
            <p className="text-[11px] text-gray-500 mt-1">
              Ví dụ: Thể hiện tác phong đại sứ tự tin (2.4/2.5), kỹ năng thuyết phục tốt (2.4/2.5), chuyên môn đồ họa và kịch bản nổi trội (2.9/3.0)...
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <Label className="text-xs font-bold text-gray-700 mb-1.5 block">Điểm mạnh nổi bật</Label>
              <Textarea
                value={strengths}
                onChange={e => setStrengths(e.target.value)}
                placeholder="VD: Tư duy thẩm mỹ hiện đại, năng lượng tích cực, kỹ năng giao tiếp tốt..."
                rows={2}
                disabled={!canGrade || isSubmitted}
                className="text-xs"
              />
            </div>

            <div>
              <Label className="text-xs font-bold text-gray-700 mb-1.5 block">Điểm cần cải thiện / Hạn chế</Label>
              <Textarea
                value={weaknesses}
                onChange={e => setWeaknesses(e.target.value)}
                placeholder="VD: Cần cân đối lịch học và hoạt động, tự tin hơn khi nói trước đám đông..."
                rows={2}
                disabled={!canGrade || isSubmitted}
                className="text-xs"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Preliminary Department Recommendation */}
      <Card className={`shadow-sm ${!canGrade ? 'opacity-60 pointer-events-none' : ''}`}>
        <CardHeader className="border-b bg-gray-50/50 py-3.5">
          <CardTitle className="text-base flex items-center justify-between">
            <span>Đề xuất sơ bộ gửi Ban Chủ nhiệm</span>
            <span className="text-xs text-gray-500 font-normal">Chỉ là đề xuất tham khảo từ Ban chuyên môn</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-5 space-y-4">
          <p className="text-xs text-gray-600">
            Dựa trên điểm số và lý giải ở trên, Ban chuyên môn đề xuất hướng xử lý sơ bộ để gửi lên Ban Chủ nhiệm xem xét:
          </p>

          <div className="grid grid-cols-3 gap-3">
            {[
              {
                value: 'pass',
                title: 'Pass',
                desc: 'Đủ điều kiện vào TOP 15 chính thức',
                bg: recommendation === 'pass' ? 'bg-emerald-600 text-white shadow-md ring-2 ring-emerald-400' : 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
              },
              {
                value: 'waitlist',
                title: 'Phân vân',
                desc: 'Cân nhắc thêm hoặc đưa vào dự bị',
                bg: recommendation === 'waitlist' ? 'bg-amber-500 text-white shadow-md ring-2 ring-amber-400' : 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100'
              },
              {
                value: 'fail',
                title: 'Trượt',
                desc: 'Chưa đáp ứng tiêu chuẩn tuyển chọn',
                bg: recommendation === 'fail' ? 'bg-red-600 text-white shadow-md ring-2 ring-red-400' : 'bg-red-50 text-red-800 border border-red-200 hover:bg-red-100'
              },
            ].map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => canGrade && !isSubmitted && setRecommendation(opt.value as any)}
                className={`p-3 rounded-xl text-left transition-all ${opt.bg}`}
              >
                <div className="font-bold text-xs">{opt.title}</div>
                <div className="text-[11px] opacity-80 mt-0.5">{opt.desc}</div>
              </button>
            ))}
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs text-gray-600">
            <strong>Quy trình tiếp theo:</strong> Ban Chủ nhiệm sẽ tổng hợp điểm của tất cả các ban, kiểm tra lý giải điểm số của từng giám khảo, xếp hạng chung toàn CLB và xếp hạng theo từng ban để ra quyết định chấp thuận cuối cùng.
          </div>
        </CardContent>
      </Card>

      {/* Ban Chủ nhiệm Final Decision Box (Only visible/interactive for BCN) */}
      {isSuperAdmin && (
        <Card className="shadow-sm border-2 border-amber-300 bg-amber-50/20">
          <CardHeader className="border-b bg-amber-100/50 py-3.5 flex flex-row items-center justify-between">
            <CardTitle className="text-base text-amber-950 flex items-center gap-2">
              <Crown className="w-5 h-5 text-amber-600" />
              Thẩm Quyền Thẩm Định & Quyết Định Của Ban Chủ Nhiệm
            </CardTitle>
            <Badge className="bg-amber-200 text-amber-900 border-amber-400 font-bold">
              Chấp thuận cuối cùng
            </Badge>
          </CardHeader>
          <CardContent className="p-5 space-y-3">
            <div className="text-xs text-amber-900">
              Ban Chủ nhiệm xem xét điểm số ({totalScore.toFixed(1)}/10đ), người chấm ({displayEvaluator.name}), và lý giải điểm của Ban để ra quyết định:
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[
                { val: 'pass', label: 'Chấp thuận: ĐẠT (PASS)', color: bcnDecision === 'pass' ? 'bg-emerald-600 text-white' : 'bg-white text-emerald-800 border' },
                { val: 'waitlist', label: 'Chấp thuận: DỰ BỊ (Waitlist)', color: bcnDecision === 'waitlist' ? 'bg-amber-500 text-white' : 'bg-white text-amber-800 border' },
                { val: 'fail', label: 'Chấp thuận: KHÔNG ĐẠT (Fail)', color: bcnDecision === 'fail' ? 'bg-red-600 text-white' : 'bg-white text-red-800 border' },
              ].map(item => (
                <button
                  key={item.val}
                  type="button"
                  onClick={() => setBcnDecision(item.val as any)}
                  className={`p-2.5 rounded-xl text-xs font-bold transition-all ${item.color}`}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <div>
              <Label className="text-xs font-bold text-gray-700 mb-1 block">Ghi chú thẩm định của BCN (nếu có)</Label>
              <input
                type="text"
                value={bcnNote}
                onChange={e => setBcnNote(e.target.value)}
                placeholder="VD: Ban Chủ nhiệm đồng ý với đề xuất của Ban chuyên môn."
                className="w-full text-xs p-2.5 rounded-lg border border-gray-300 bg-white"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      {canGrade && !isSubmitted && (
        <div className="flex gap-3 pt-2">
          <Button
            variant="outline"
            onClick={() => handleSaveEvaluation(false)}
            disabled={saving}
            className="flex-1 gap-2"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Lưu bản nháp
          </Button>
          <Button
            onClick={() => setShowConfirm(true)}
            disabled={totalScore === 0 || !recommendation || !justification.trim()}
            className="flex-1 gap-2"
            variant="gold"
          >
            <Send className="w-4 h-4" />
            Nộp Điểm & Gửi Đề Xuất Lên Ban Chủ Nhiệm
          </Button>
        </div>
      )}

      {isSubmitted && (
        <div className="bg-emerald-50 border border-emerald-300 rounded-2xl p-4 text-center text-emerald-800 font-bold text-sm flex items-center justify-center gap-2 shadow-sm">
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          Phiếu chấm điểm kèm lý giải đã được nộp thành công và chuyển đến Ban Chủ nhiệm thẩm định.
        </div>
      )}

      {/* Confirm Submission Dialog */}
      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Xác nhận gửi điểm & lý giải lên Ban Chủ nhiệm</DialogTitle>
            <DialogDescription className="space-y-2 pt-2 text-left">
              <p>Bạn đang hoàn tất phiếu chấm điểm cho ứng viên <strong>{profile?.full_name}</strong>:</p>
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3.5 text-xs space-y-1.5 text-blue-950 font-medium">
                <div>• Ban ứng tuyển: <strong>{application?.departments?.name}</strong></div>
                <div>• Tài khoản chấm: <strong>{displayEvaluator.name} ({displayEvaluator.email})</strong></div>
                <div>• Tổng điểm chấm: <strong className="text-blue-700 text-sm">{totalScore.toFixed(1)}/{maxTotal}</strong></div>
                <div>• Đề xuất của Ban: <strong className="uppercase text-emerald-700">{recommendation}</strong></div>
                <div>• Lý giải điểm: <span className="italic text-gray-700 line-clamp-2">"{justification}"</span></div>
              </div>
              <p className="text-[11px] text-gray-500 pt-1">
                Lưu ý: Ban chuyên môn chỉ gửi điểm và đề xuất. Quyết định cuối cùng sẽ do Ban Chủ nhiệm phê duyệt trên bảng xếp hạng.
              </p>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowConfirm(false)}>Hủy</Button>
            <Button onClick={() => handleSaveEvaluation(true)} disabled={submitting} variant="gold">
              {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Xác nhận gửi lên BCN
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
