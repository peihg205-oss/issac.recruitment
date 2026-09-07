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
import { ArrowLeft, Save, Send, User, Star, Loader2, Lock, ShieldAlert, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'
import { getScoreGrade, getScoreGradeColor } from '@/lib/utils'
import { ADMIN_ROLE_CONFIGS, type AdminRoleType } from '@/lib/permissions'
import { MOCK_CANDIDATES } from '@/lib/mock-data'

interface Criteria {
  id: string
  name: string
  description: string | null
  max_score: number
  sort_order: number
}

interface ApplicationData {
  id: string
  status: string
  profiles: { full_name: string; student_id: string | null; email: string; major?: string; cohort?: string; phone?: string; cv_url?: string }
  departments: { name: string; slug: string }
}

const DEFAULT_CRITERIA: Criteria[] = [
  { id: 'crit-1', name: '1. Thái độ & Tác phong Đại sứ', description: 'Đúng giờ, trang phục lịch sự, tôn trọng giám khảo, năng lượng tích cực', max_score: 2.5, sort_order: 1 },
  { id: 'crit-2', name: '2. Kỹ năng Giao tiếp & Thuyết phục', description: 'Trình bày lưu loát, tự tin, mạch lạc, khả năng phản xạ câu hỏi tình huống', max_score: 2.5, sort_order: 2 },
  { id: 'crit-3', name: '3. Năng lực Chuyên môn theo Ban', description: 'Kinh nghiệm, kỹ năng và mức độ phù hợp với yêu cầu nhiệm vụ của Ban', max_score: 3.0, sort_order: 3 },
  { id: 'crit-4', name: '4. Tinh thần Đồng đội & Cam kết', description: 'Khả năng phối hợp nhóm, thời gian cống hiến và cam kết gắn bó lâu dài với CLB', max_score: 2.0, sort_order: 4 },
]

export default function EvaluationDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()
  const applicationId = params.id as string

  // Active admin role
  const [activeRole, setActiveRole] = useState<AdminRoleType>('chu-nhiem')

  const [application, setApplication] = useState<ApplicationData | null>(null)
  const [criteria, setCriteria] = useState<Criteria[]>(DEFAULT_CRITERIA)
  const [scores, setScores] = useState<Record<string, number>>({})
  const [evaluation, setEvaluation] = useState<any>(null)
  const [strengths, setStrengths] = useState('')
  const [weaknesses, setWeaknesses] = useState('')
  const [comment, setComment] = useState('')
  const [recommendation, setRecommendation] = useState<'pass' | 'waitlist' | 'fail' | ''>('')
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
        setApplication(app as unknown as ApplicationData)
      } else {
        // Fallback to mock candidate
        const mockApp = MOCK_CANDIDATES.find(c => c.id === applicationId) || MOCK_CANDIDATES[0]
        setApplication(mockApp as unknown as ApplicationData)
      }

      if (crits && crits.length > 0) {
        setCriteria(crits)
      }
    } catch {
      const mockApp = MOCK_CANDIDATES.find(c => c.id === applicationId) || MOCK_CANDIDATES[0]
      setApplication(mockApp as unknown as ApplicationData)
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
      toast({ title: 'Không có quyền', description: 'Bạn không thuộc Ban của ứng viên này.', variant: 'destructive' })
      return
    }

    if (submit) setSubmitting(true)
    else setSaving(true)

    // Demo / Local save simulation
    setTimeout(() => {
      if (submit) {
        setSubmitting(false)
        setShowConfirm(false)
        setIsSubmitted(true)
        toast({
          title: '✅ Gửi phiếu đánh giá thành công!',
          description: `Đã chấm ${totalScore.toFixed(1)}/${maxTotal} điểm cho ứng viên ${application?.profiles?.full_name}.`,
          variant: 'success'
        } as Parameters<typeof toast>[0])
      } else {
        setSaving(false)
        toast({
          title: 'Đã lưu bản nháp',
          description: 'Điểm số và nhận xét đã được lưu lại.',
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
      <div className="flex items-center justify-between">
        <Link href="/admin/evaluation" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-blue-700 font-medium transition-colors">
          <ArrowLeft className="w-4 h-4" /> Quay lại danh sách chấm điểm
        </Link>
        <Badge className={`px-3 py-1 text-xs font-bold border ${roleConfig.badgeColor}`}>
          {roleConfig.icon} Quyền chấm: {roleConfig.shortLabel}
        </Badge>
      </div>

      {/* RBAC Warning Banner if not permitted */}
      {!canGrade && (
        <Card className="border-2 border-red-300 bg-gradient-to-br from-red-50 to-orange-50 shadow-md">
          <CardContent className="p-5 flex flex-col sm:flex-row items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-red-600 text-white flex items-center justify-center font-bold text-xl flex-shrink-0 shadow-sm">
              <Lock className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h3 className="font-black text-base text-red-950 flex items-center gap-2">
                🚫 BẠN KHÔNG CÓ QUYỀN CHẤM ĐIỂM ỨNG VIÊN NÀY
              </h3>
              <p className="text-xs text-red-900 mt-1 leading-relaxed">
                Ứng viên <strong>{profile?.full_name}</strong> đăng ký vào <strong>{application?.departments?.name}</strong>.
                Hiện tại bạn đang đăng nhập với tư cách <strong>{roleConfig.label}</strong>.
                <br />
                Theo quy chế tuyển dụng iSSAC: <em>Chỉ giám khảo thuộc {application?.departments?.name} hoặc Ban Chủ nhiệm mới có quyền chấm điểm ứng viên này.</em>
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Link href="/admin/evaluation">
                  <Button size="sm" variant="outline" className="text-xs bg-white text-red-800 border-red-300 hover:bg-red-100">
                    ← Trở lại danh sách ứng viên của ban bạn
                  </Button>
                </Link>
                <span className="text-[11px] text-red-700 self-center">
                  💡 Gợi ý: Hãy đổi quyền sang "{application?.departments?.name}" hoặc "Ban Chủ nhiệm" ở thanh Sidebar bên trái để chấm thử!
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Candidate Card */}
      <Card className="shadow-sm border-l-4 border-l-blue-600">
        <CardContent className="p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-xl font-black text-gray-900">{profile?.full_name || 'Ứng viên'}</h1>
                <Badge className="bg-blue-100 text-blue-800 text-xs font-bold border border-blue-200">
                  {application?.departments?.name}
                </Badge>
              </div>
              <div className="text-xs text-gray-500 mt-1 space-x-3">
                <span>MSSV: <strong>{profile?.student_id || 'Chưa có'}</strong></span>
                <span>•</span>
                <span>Ngành: <strong>{profile?.major || 'VNU-IS'}</strong></span>
                <span>•</span>
                <span>Email: <strong>{profile?.email}</strong></span>
              </div>
            </div>

            {profile?.cv_url && (
              <a href={profile.cv_url} target="_blank" rel="noreferrer">
                <Button variant="outline" size="sm" className="text-xs text-blue-700 border-blue-200 hover:bg-blue-50">
                  📄 Xem CV đính kèm
                </Button>
              </a>
            )}
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
          <span className="text-xs text-gray-500 font-medium">Giám khảo: {roleConfig.shortLabel}</span>
        </CardHeader>
        <CardContent className="p-5 space-y-4">
          {criteria.map((c, i) => (
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
              <div className="text-xs font-bold text-blue-900 uppercase tracking-wider">TỔNG ĐIỂM ĐÁNH GIÁ</div>
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

      {/* Comments & Recommendations */}
      <Card className={`shadow-sm ${!canGrade ? 'opacity-60 pointer-events-none' : ''}`}>
        <CardHeader className="border-b bg-gray-50/50 py-3.5">
          <CardTitle className="text-base">Nhận xét của Giám khảo ({roleConfig.shortLabel})</CardTitle>
        </CardHeader>
        <CardContent className="p-5 space-y-4">
          <div>
            <Label className="text-xs font-bold text-gray-700 mb-1.5 block">Điểm mạnh nổi bật</Label>
            <Textarea
              value={strengths}
              onChange={e => setStrengths(e.target.value)}
              placeholder="VD: Tự tin, nắm vững chuyên môn, thái độ hòa đồng..."
              rows={2}
              disabled={!canGrade || isSubmitted}
            />
          </div>

          <div>
            <Label className="text-xs font-bold text-gray-700 mb-1.5 block">Điểm cần cải thiện</Label>
            <Textarea
              value={weaknesses}
              onChange={e => setWeaknesses(e.target.value)}
              placeholder="VD: Cần tự tin hơn trước đám đông..."
              rows={2}
              disabled={!canGrade || isSubmitted}
            />
          </div>

          <div>
            <Label className="text-xs font-bold text-gray-700 mb-2 block">Đề xuất kết quả</Label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { value: 'pass', label: '✅ ĐẠT (PASS)', bg: recommendation === 'pass' ? 'bg-green-600 text-white shadow-md' : 'bg-green-50 text-green-800 border border-green-200' },
                { value: 'waitlist', label: '⏳ DỰ BỊ', bg: recommendation === 'waitlist' ? 'bg-amber-500 text-white shadow-md' : 'bg-amber-50 text-amber-800 border border-amber-200' },
                { value: 'fail', label: '❌ KHÔNG ĐẠT', bg: recommendation === 'fail' ? 'bg-red-600 text-white shadow-md' : 'bg-red-50 text-red-800 border border-red-200' },
              ].map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => canGrade && !isSubmitted && setRecommendation(opt.value as any)}
                  className={`py-2.5 rounded-xl text-xs font-bold transition-all ${opt.bg}`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Buttons */}
      {canGrade && !isSubmitted && (
        <div className="flex gap-3">
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
            disabled={totalScore === 0 || !recommendation}
            className="flex-1 gap-2"
            variant="gold"
          >
            <Send className="w-4 h-4" />
            Nộp Phiếu Chấm Điểm
          </Button>
        </div>
      )}

      {isSubmitted && (
        <div className="bg-emerald-50 border border-emerald-300 rounded-2xl p-4 text-center text-emerald-800 font-bold text-sm flex items-center justify-center gap-2 shadow-sm">
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          Phiếu đánh giá đã được nộp và ghi nhận thành công vào hệ thống.
        </div>
      )}

      {/* Confirm Dialog */}
      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận gửi phiếu chấm điểm</DialogTitle>
            <DialogDescription className="space-y-2 pt-2 text-left">
              <p>Bạn đang hoàn tất phiếu chấm điểm cho ứng viên <strong>{profile?.full_name}</strong>:</p>
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs space-y-1 text-blue-950 font-medium">
                <div>• Ban ứng tuyển: <strong>{application?.departments?.name}</strong></div>
                <div>• Giám khảo chấm: <strong>{roleConfig.label}</strong></div>
                <div>• Tổng điểm: <strong className="text-blue-700 text-sm">{totalScore.toFixed(1)}/{maxTotal}</strong></div>
                <div>• Đề xuất: <strong className="uppercase">{recommendation}</strong></div>
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowConfirm(false)}>Hủy</Button>
            <Button onClick={() => handleSaveEvaluation(true)} disabled={submitting} variant="gold">
              {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Xác nhận nộp điểm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
