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
import { ArrowLeft, Save, Send, User, Star, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { getScoreGrade, getScoreGradeColor } from '@/lib/utils'

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
  profiles: { full_name: string; student_id: string | null; email: string }
  departments: { name: string }
}

export default function EvaluationDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()
  const applicationId = params.id as string

  const [application, setApplication] = useState<ApplicationData | null>(null)
  const [criteria, setCriteria] = useState<Criteria[]>([])
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
  const [currentUser, setCurrentUser] = useState<any>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    setCurrentUser(user)

    const [{ data: app }, { data: profile }] = await Promise.all([
      supabase
        .from('applications')
        .select('id, status, profiles:user_id(full_name, student_id, email), departments!applications_department_id_fkey(name)')
        .eq('id', applicationId)
        .single(),
      user ? supabase.from('profiles').select('department_id').eq('id', user.id).single() : { data: null }
    ])

    setApplication(app as any)

    // Get criteria for this department
    const deptId = (app as any)?.departments ? undefined : null
    const { data: appWithDept } = await supabase
      .from('applications')
      .select('department_id')
      .eq('id', applicationId)
      .single()

    const { data: crit } = await supabase
      .from('evaluation_criteria')
      .select('*')
      .eq('department_id', appWithDept?.department_id || '')
      .eq('is_active', true)
      .order('sort_order')

    setCriteria(crit || [])

    if (user) {
      const { data: existingEval } = await supabase
        .from('evaluations')
        .select('*, evaluation_scores(*)')
        .eq('application_id', applicationId)
        .eq('interviewer_id', user.id)
        .single()

      if (existingEval) {
        setEvaluation(existingEval)
        const scoreMap: Record<string, number> = {}
        ;(existingEval.evaluation_scores as any[])?.forEach((s: any) => {
          scoreMap[s.criteria_id] = Number(s.score)
        })
        setScores(scoreMap)
        setStrengths(existingEval.strengths || '')
        setWeaknesses(existingEval.weaknesses || '')
        setComment(existingEval.overall_comment || '')
        setRecommendation(existingEval.recommendation || '')
      }
    }

    setLoading(false)
  }, [applicationId, supabase])

  useEffect(() => { fetchData() }, [fetchData])

  const totalScore = criteria.reduce((sum, c) => sum + (scores[c.id] || 0), 0)
  const maxTotal = criteria.reduce((sum, c) => sum + c.max_score, 0)

  const handleScoreChange = (criteriaId: string, value: string, max: number) => {
    const num = parseFloat(value)
    if (isNaN(num)) { setScores(prev => ({ ...prev, [criteriaId]: 0 })); return }
    if (num < 0 || num > max) return
    setScores(prev => ({ ...prev, [criteriaId]: num }))
  }

  const saveEvaluation = async (isSubmit = false) => {
    if (!currentUser) return
    if (isSubmit) setSubmitting(true)
    else setSaving(true)

    const { data: eval_, error: evalError } = await supabase
      .from('evaluations')
      .upsert({
        id: evaluation?.id,
        application_id: applicationId,
        interviewer_id: currentUser.id,
        status: isSubmit ? 'submitted' : 'draft',
        total_score: totalScore,
        strengths,
        weaknesses,
        overall_comment: comment,
        recommendation: recommendation || null,
        submitted_at: isSubmit ? new Date().toISOString() : null,
      }, { onConflict: 'application_id,interviewer_id' })
      .select()
      .single()

    if (evalError) {
      toast({ title: 'Lỗi', description: evalError.message, variant: 'destructive' })
      setSaving(false); setSubmitting(false)
      return
    }

    // Upsert scores
    const scoreRows = criteria.map(c => ({
      evaluation_id: eval_!.id,
      criteria_id: c.id,
      score: scores[c.id] || 0,
    }))

    for (const row of scoreRows) {
      await supabase.from('evaluation_scores').upsert(row, { onConflict: 'evaluation_id,criteria_id' })
    }

    if (isSubmit) {
      // Trigger ranking recalculation via RPC
      await supabase.rpc('recalculate_rankings')
      toast({ title: '✅ Đã gửi phiếu đánh giá!', description: 'Phiếu chấm điểm đã được ghi nhận.' } as Parameters<typeof toast>[0])
      setShowConfirm(false)
      router.push('/admin/evaluation')
    } else {
      toast({ title: '💾 Đã lưu bản nháp', description: 'Phiếu đánh giá đã được lưu.' } as Parameters<typeof toast>[0])
      fetchData()
    }

    setSaving(false); setSubmitting(false)
  }

  const isSubmitted = evaluation?.status === 'submitted'

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    )
  }

  const profile = (application as any)?.profiles
  const dept = (application as any)?.departments

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/admin/evaluation">
          <Button variant="outline" size="sm" className="gap-1"><ArrowLeft className="w-4 h-4" /> Quay lại</Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-black text-gray-900">Phiếu chấm phỏng vấn</h1>
        </div>
        {isSubmitted && <Badge className="bg-green-600">Đã gửi</Badge>}
        {!isSubmitted && evaluation && <Badge variant="warning">Bản nháp</Badge>}
      </div>

      {/* Candidate info */}
      <Card className="border-l-4 border-l-blue-600">
        <CardContent className="py-5">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl flex items-center justify-center text-white font-black text-xl">
              {profile?.full_name?.charAt(0) || 'U'}
            </div>
            <div>
              <h2 className="text-lg font-black text-gray-900">{profile?.full_name || 'Ứng viên'}</h2>
              <div className="flex items-center gap-3 text-sm text-gray-500">
                <span>MSSV: <strong>{profile?.student_id || '—'}</strong></span>
                <span>·</span>
                <span>Ban: <strong className="text-blue-700">{dept?.name || '—'}</strong></span>
              </div>
              <div className="text-sm text-gray-500">{profile?.email}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Score Sheet */}
      <Card>
        <CardHeader className="border-b border-gray-100">
          <CardTitle className="text-base flex items-center gap-2">
            <Star className="w-4 h-4 text-amber-500" />
            Bảng chấm điểm
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          {criteria.length === 0 ? (
            <div className="text-center py-8 text-gray-400">Chưa có tiêu chí chấm điểm nào được cấu hình.</div>
          ) : (
            <div className="space-y-4">
              {criteria.map((c, i) => (
                <div key={c.id} className="group">
                  <div className="flex items-start gap-4 p-4 rounded-xl bg-gray-50 hover:bg-blue-50/50 transition-colors">
                    <div className="w-7 h-7 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                      {i + 1}
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900 text-sm mb-0.5">{c.name}</div>
                      {c.description && <div className="text-xs text-gray-500 mb-2">{c.description}</div>}
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <input
                            type="number"
                            min={0}
                            max={c.max_score}
                            step={0.5}
                            value={scores[c.id] ?? ''}
                            onChange={e => handleScoreChange(c.id, e.target.value, c.max_score)}
                            disabled={isSubmitted}
                            placeholder="0"
                            className="w-20 h-10 text-center text-lg font-black text-blue-700 border-2 border-blue-200 rounded-xl focus:outline-none focus:border-blue-500 disabled:opacity-60 disabled:bg-gray-100"
                          />
                        </div>
                        <span className="text-gray-400 font-medium">/ {c.max_score}</span>
                        <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-500 rounded-full transition-all"
                            style={{width: `${c.max_score > 0 ? ((scores[c.id] || 0) / c.max_score) * 100 : 0}%`}}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* Total */}
              <div className="mt-6 pt-4 border-t-2 border-blue-200 flex items-center justify-between bg-blue-50 rounded-xl p-5">
                <div>
                  <div className="text-sm text-gray-600 font-medium">TỔNG ĐIỂM</div>
                  <div className={`text-sm font-semibold ${getScoreGradeColor(totalScore, maxTotal)}`}>
                    Xếp loại: {getScoreGrade(totalScore, maxTotal)}
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-4xl font-black ${getScoreGradeColor(totalScore, maxTotal)}`}>{totalScore}</div>
                  <div className="text-gray-500 text-sm">/ {maxTotal}</div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Comments */}
      <Card>
        <CardHeader><CardTitle className="text-base">Nhận xét & Đề xuất</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="mb-1.5">Điểm mạnh của ứng viên</Label>
            <Textarea
              value={strengths}
              onChange={e => setStrengths(e.target.value)}
              placeholder="Mô tả điểm mạnh nổi bật..."
              rows={3}
              disabled={isSubmitted}
            />
          </div>
          <div>
            <Label className="mb-1.5">Điểm cần cải thiện</Label>
            <Textarea
              value={weaknesses}
              onChange={e => setWeaknesses(e.target.value)}
              placeholder="Những điểm cần phát triển thêm..."
              rows={3}
              disabled={isSubmitted}
            />
          </div>
          <div>
            <Label className="mb-1.5">Nhận xét chung</Label>
            <Textarea
              value={comment}
              onChange={e => setComment(e.target.value)}
              placeholder="Nhận xét tổng quan về buổi phỏng vấn..."
              rows={4}
              disabled={isSubmitted}
            />
          </div>

          {/* Recommendation */}
          <div>
            <Label className="mb-2">Đề xuất</Label>
            <div className="flex gap-3">
              {[
                { value: 'pass', label: '✅ Đạt', color: recommendation === 'pass' ? 'bg-green-600 text-white' : 'bg-green-50 text-green-700 border border-green-200' },
                { value: 'waitlist', label: '⏳ Dự bị', color: recommendation === 'waitlist' ? 'bg-amber-500 text-white' : 'bg-amber-50 text-amber-700 border border-amber-200' },
                { value: 'fail', label: '❌ Không đạt', color: recommendation === 'fail' ? 'bg-red-600 text-white' : 'bg-red-50 text-red-700 border border-red-200' },
              ].map(opt => (
                <button
                  key={opt.value}
                  onClick={() => !isSubmitted && setRecommendation(opt.value as any)}
                  disabled={isSubmitted}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${opt.color} disabled:opacity-60`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-2">
              ⚠️ Quyết định cuối cùng phải dựa trên ranking + quota + Ban Chủ nhiệm xác nhận.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Action buttons */}
      {!isSubmitted && (
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => saveEvaluation(false)} disabled={saving} className="flex-1 gap-2">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Lưu nháp
          </Button>
          <Button onClick={() => setShowConfirm(true)} disabled={criteria.length === 0} className="flex-1 gap-2" variant="gold">
            <Send className="w-4 h-4" />
            Submit Phiếu
          </Button>
        </div>
      )}

      {isSubmitted && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center text-green-700 font-medium text-sm">
          ✅ Phiếu đánh giá đã được gửi thành công. Không thể chỉnh sửa.
        </div>
      )}

      {/* Confirm dialog */}
      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận gửi phiếu đánh giá</DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn gửi phiếu đánh giá cho <strong>{profile?.full_name}</strong>?
              <br /><br />
              <strong className="text-blue-700">Tổng điểm: {totalScore}/{maxTotal}</strong>
              <br /><br />
              <span className="text-red-500">Sau khi gửi, bạn sẽ không thể chỉnh sửa phiếu này.</span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirm(false)}>Huỷ</Button>
            <Button onClick={() => saveEvaluation(true)} disabled={submitting} variant="gold">
              {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Xác nhận gửi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
