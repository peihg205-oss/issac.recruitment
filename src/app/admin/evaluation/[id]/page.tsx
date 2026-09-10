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
  ArrowLeft, Save, Send, User, Star, Loader2,
  ShieldAlert, CheckCircle2, Crown, UserCheck,
  ExternalLink, Globe, Phone, Mail, GraduationCap,
  Calendar, Check, FileText, Lock
} from 'lucide-react'
import Link from 'next/link'
import { getScoreGrade, getScoreGradeColor, getCandidateCode } from '@/lib/utils'
import { ADMIN_ROLE_CONFIGS, EVALUATOR_ACCOUNTS, type AdminRoleType } from '@/lib/permissions'
import { getAdminAccounts } from '@/lib/admin-account-manager'
import { MOCK_CANDIDATES } from '@/lib/mock-data'

export interface Criteria {
  id: string
  name: string
  description: string | null
  max_score: number
  sort_order: number
}

// BẢNG TIÊU CHÍ PHỎNG VẤN CHUẨN CLB iSSAC THEO THANG 50.0 (5 TIÊU CHÍ x 10 ĐIỂM)
export const DEFAULT_CRITERIA: Criteria[] = [
  {
    id: 'crit-gioi-thieu',
    name: 'Giới thiệu',
    description: 'Phong thái tự tin, tác phong đại sứ, ấn tượng đầu tiên và phần giới thiệu bản thân rõ ràng, thu hút',
    max_score: 10,
    sort_order: 1
  },
  {
    id: 'crit-giao-tiep-tu-duy',
    name: 'Kỹ năng giao tiếp/ tư duy',
    description: 'Khả năng diễn đạt mạch lạc, phản xạ câu hỏi tình huống nhanh nhạy, tư duy logic và lập luận sắc bén',
    max_score: 10,
    sort_order: 2
  },
  {
    id: 'crit-kinh-nghiem',
    name: 'Kinh nghiệm sau thực nghiệm',
    description: 'Kinh nghiệm thực chiến, bài học rút ra sau hoạt động/dự án trước đây, năng lực xử lý tình huống thực tế',
    max_score: 10,
    sort_order: 3
  },
  {
    id: 'crit-ngoai-hinh',
    name: 'Ngoại hình',
    description: 'Ngoại hình sáng, trang phục chỉn chu, tác phong thanh lịch, đại diện cho hình ảnh Đại sứ Sinh viên iSSAC',
    max_score: 10,
    sort_order: 4
  },
  {
    id: 'crit-thai-do-cam-ket',
    name: 'Thái độ cam kết',
    description: 'Tinh thần trách nhiệm, năng lượng tích cực, mức độ nhiệt huyết và cam kết gắn bó thời gian lâu dài với CLB',
    max_score: 10,
    sort_order: 5
  },
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
  const [bcnReviewerInfo, setBcnReviewerInfo] = useState<any>(null)
  const [candidateCode, setCandidateCode] = useState<string>('ISSAC-01')

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
      // 0. Fetch all applications to determine chronological candidate code: ISSAC-01, ISSAC-02...
      const { data: allApps } = await supabase
        .from('applications')
        .select('id, submitted_at, created_at')
        .order('created_at', { ascending: true })

      const appsList = (allApps && allApps.length > 0) ? allApps : MOCK_CANDIDATES
      const computedCode = getCandidateCode(applicationId, appsList)
      setCandidateCode(computedCode)

      // 1. Fetch Application from Supabase
      const { data: app, error: appErr } = await supabase
        .from('applications')
        .select(`
          id, user_id, status, department_id, submitted_at, created_at,
          departments!applications_department_id_fkey(name, slug)
        `)
        .eq('id', applicationId)
        .maybeSingle()

      // 2. Fetch Evaluation details if already evaluated
      const { data: evals } = await supabase
        .from('evaluations')
        .select('*, evaluation_scores(*)')
        .eq('application_id', applicationId)
        .maybeSingle()

      // Check locked status: either marked submitted in DB, in localStorage, or status is interviewed/evaluated
      const isSubmittedDb = Boolean(evals?.submitted_at)
      const isSubmittedLocal = typeof window !== 'undefined' && localStorage.getItem(`eval_submitted_${applicationId}`) === 'true'
      const isSubmittedApp = app?.status === 'interviewed' || app?.status === 'evaluated' || app?.status === 'finalized'
      if (isSubmittedDb || isSubmittedLocal || (isSubmittedApp && (evals?.total_score || evals?.score_justification))) {
        setIsSubmitted(true)
      }

      if (app) {
        // Fetch candidate profile (DO NOT include cv_url to avoid PGRST204 schema cache error)
        let candidateProfile: any = null
        if (app.user_id) {
          const { data: prof, error: profErr } = await supabase
            .from('profiles')
            .select('id, full_name, student_id, email, phone, major, cohort, university, high_school, gender, date_of_birth, address')
            .eq('id', app.user_id)
            .maybeSingle()

          if (!profErr && prof) {
            candidateProfile = prof
          }
        }

        // Check fallback from mock or local cache if needed
        if (!candidateProfile) {
          const mockMatch = MOCK_CANDIDATES.find(c => c.id === applicationId || c.user_id === app.user_id)
          if (mockMatch) {
            candidateProfile = mockMatch.profiles
          }
        }

        setApplication({
          ...app,
          profiles: candidateProfile || {
            full_name: 'Ứng viên',
            student_id: '—',
            email: '',
            phone: '—',
            major: 'Hệ thống thông tin quản lý (MIS)',
            cohort: 'K22',
            university: 'Trường Quốc tế - ĐHQGHN'
          }
        })

        let resolvedEvaluator: any = null

        // Check if evals.overall_comment has structured payload with grader and bcnReviewer
        if (evals?.overall_comment) {
          try {
            if (evals.overall_comment.startsWith('{')) {
              const parsedComment = JSON.parse(evals.overall_comment)
              if (parsedComment.grader) resolvedEvaluator = parsedComment.grader
              if (parsedComment.bcnReviewer) setBcnReviewerInfo(parsedComment.bcnReviewer)
              if (parsedComment.justification) setJustification(parsedComment.justification)
              if (parsedComment.bcnNote) setBcnNote(parsedComment.bcnNote)
            } else {
              setJustification(evals.overall_comment)
            }
          } catch {}
        }

        if (evals) {
          if (evals.score_justification && !justification) setJustification(evals.score_justification)
          if (evals.strengths) setStrengths(evals.strengths)
          if (evals.weaknesses) setWeaknesses(evals.weaknesses)
          if (evals.dept_recommendation) setRecommendation(evals.dept_recommendation)
          if (evals.bcn_decision) setBcnDecision(evals.bcn_decision)
          if (evals.bcn_note) setBcnNote(evals.bcn_note)
          if (evals.evaluation_scores && evals.evaluation_scores.length > 0) {
            const scMap: Record<string, number> = {}
            evals.evaluation_scores.forEach((s: any) => { scMap[s.criteria_id] = s.score })
            setScores(scMap)
          }
        }

        // Check localStorage cached scores for offline / cross-tab resilience
        try {
          const cached = localStorage.getItem(`eval_scores_${applicationId}`)
          if (cached) {
            const parsed = JSON.parse(cached)
            if (parsed.scores && Object.keys(parsed.scores).length > 0) setScores(parsed.scores)
            if (parsed.justification) setJustification(parsed.justification)
            if (parsed.strengths) setStrengths(parsed.strengths)
            if (parsed.weaknesses) setWeaknesses(parsed.weaknesses)
            if (parsed.recommendation) setRecommendation(parsed.recommendation)
            if (parsed.bcnDecision) setBcnDecision(parsed.bcnDecision)
            if (parsed.bcnNote) setBcnNote(parsed.bcnNote)
            if (parsed.bcnReviewer) setBcnReviewerInfo(parsed.bcnReviewer)
            if (parsed.evaluator) {
              resolvedEvaluator = typeof parsed.evaluator === 'string'
                ? { name: parsed.evaluator }
                : parsed.evaluator
            }
          }
        } catch {}

        // Evaluator Resolution Rule:
        // "mỗi ban có quyền chấm thành viên ban mình nhưng ban chủ nhiệm có quyền all"
        const appDeptObj = Array.isArray(app?.departments) ? app?.departments[0] : app?.departments
        const deptSlug = ((appDeptObj as any)?.slug || 'truyen-thong') as AdminRoleType
        const deptAccounts = getAdminAccounts()
        const defaultDeptEvaluator = EVALUATOR_ACCOUNTS[deptSlug] || EVALUATOR_ACCOUNTS['truyen-thong']
        const deptAccountName = deptAccounts[deptSlug]?.name || defaultDeptEvaluator.name
        const deptAccountTitle = deptAccounts[deptSlug]?.title || defaultDeptEvaluator.title
        const deptAccountEmail = deptAccounts[deptSlug]?.email || defaultDeptEvaluator.email
        const deptAccountDept = (appDeptObj as any)?.name || defaultDeptEvaluator.departmentName

        const hasEvaluatedScores = (evals && (evals.total_score != null || (evals.evaluation_scores && evals.evaluation_scores.length > 0))) ||
          Boolean(isSubmittedLocal) ||
          Boolean(app?.status === 'interviewed' || app?.status === 'evaluated')

        if (!resolvedEvaluator && hasEvaluatedScores) {
          resolvedEvaluator = {
            name: deptAccountName,
            email: deptAccountEmail,
            title: deptAccountTitle,
            departmentName: deptAccountDept,
            role: deptSlug
          }
        }

        if (resolvedEvaluator) {
          setEvaluatorInfo({
            name: resolvedEvaluator.name || deptAccountName,
            email: resolvedEvaluator.email || deptAccountEmail,
            title: resolvedEvaluator.title || deptAccountTitle,
            departmentName: resolvedEvaluator.departmentName || deptAccountDept,
            role: resolvedEvaluator.role || deptSlug
          })
        }
      } else {
        const mockApp = MOCK_CANDIDATES.find(c => c.id === applicationId)
        if (mockApp) {
          setApplication(mockApp)
          if (mockApp.evaluation_data?.criteria_scores) setScores(mockApp.evaluation_data.criteria_scores)
          if (mockApp.evaluation_data?.score_justification) setJustification(mockApp.evaluation_data.score_justification)
          if (mockApp.evaluation_data?.strengths) setStrengths(mockApp.evaluation_data.strengths)
          if (mockApp.evaluation_data?.weaknesses) setWeaknesses(mockApp.evaluation_data.weaknesses)
          if (mockApp.evaluation_data?.dept_recommendation) setRecommendation(mockApp.evaluation_data.dept_recommendation)
          if (mockApp.evaluation_data?.bcn_decision) setBcnDecision(mockApp.evaluation_data.bcn_decision)
          if (mockApp.evaluation_data?.bcn_note) setBcnNote(mockApp.evaluation_data.bcn_note)
          if (mockApp.evaluator) {
            setEvaluatorInfo({
              name: mockApp.evaluator.name,
              email: mockApp.evaluator.email,
              role: mockApp.evaluator.role,
              departmentName: mockApp.evaluator.department_name,
              title: mockApp.evaluator.role === 'truyen-thong' ? 'Phó Ban Truyền thông' : 'Trưởng Ban',
            })
          }
        }
      }

      // We always ensure the 5 criteria from Image 2 are active
      setCriteria(DEFAULT_CRITERIA)
    } catch (err) {
      console.error('Error in evaluation detail:', err)
    } finally {
      setLoading(false)
    }
  }, [applicationId, supabase])

  // Real-time synchronization: Supabase channel + BroadcastChannel + window storage
  useEffect(() => {
    fetchData()

    // 1. Supabase Postgres Realtime Subscription
    const channel = supabase
      .channel(`rt-eval-${applicationId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'evaluations', filter: `application_id=eq.${applicationId}` },
        () => { fetchData() }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'candidate_rankings', filter: `application_id=eq.${applicationId}` },
        () => { fetchData() }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'applications', filter: `id=eq.${applicationId}` },
        () => { fetchData() }
      )
      .subscribe()

    // 2. Cross-tab Real-time Listeners
    const handleStorage = (e: StorageEvent) => {
      if (
        e.key === `eval_scores_${applicationId}` ||
        e.key === `eval_submitted_${applicationId}` ||
        e.key === 'issac_last_eval_update' ||
        e.key === 'issac_admin_accounts'
      ) {
        fetchData()
      }
    }

    const handleCustomEvent = (e: any) => {
      if (!e.detail?.applicationId || e.detail?.applicationId === applicationId) {
        fetchData()
      }
    }

    let bc: BroadcastChannel | null = null
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      bc = new BroadcastChannel('issac_eval_channel')
      bc.onmessage = (event) => {
        if (!event.data?.applicationId || event.data?.applicationId === applicationId) {
          fetchData()
        }
      }
    }

    window.addEventListener('storage', handleStorage)
    window.addEventListener('issac_eval_updated' as any, handleCustomEvent)

    return () => {
      supabase.removeChannel(channel)
      window.removeEventListener('storage', handleStorage)
      window.removeEventListener('issac_eval_updated' as any, handleCustomEvent)
      if (bc) bc.close()
    }
  }, [applicationId, fetchData, supabase])

  // RBAC Permission Check
  const roleConfig = ADMIN_ROLE_CONFIGS[activeRole] || ADMIN_ROLE_CONFIGS['chu-nhiem']
  const appDeptSlug = application?.departments?.slug
  const isSuperAdmin = roleConfig.isSuperAdmin
  const isOwnDepartment = appDeptSlug === activeRole
  // Mỗi ban có quyền chấm thành viên ban mình, Ban Chủ nhiệm có quyền all
  const canGrade = isSuperAdmin || isOwnDepartment
  // Đã khóa đối với Ban chuyên môn sau khi nộp, nhưng Ban Chủ nhiệm có quyền thẩm định & điều chỉnh
  const isLockedForRole = !canGrade || (isSubmitted && !isSuperAdmin)

  // Evaluator Account: Đúng như Ban Chủ nhiệm cấp
  const accounts = getAdminAccounts()
  const activeAdmin = accounts[activeRole] || EVALUATOR_ACCOUNTS[activeRole] || EVALUATOR_ACCOUNTS['chu-nhiem']
  const currentEvaluator = EVALUATOR_ACCOUNTS[activeRole] || EVALUATOR_ACCOUNTS['chu-nhiem']

  const appDeptData = Array.isArray(application?.departments) ? application?.departments[0] : application?.departments
  const targetDeptSlug = ((appDeptData as any)?.slug || 'truyen-thong') as AdminRoleType
  const baseDeptEvaluator = EVALUATOR_ACCOUNTS[targetDeptSlug] || EVALUATOR_ACCOUNTS['truyen-thong']
  const targetDeptName = accounts[targetDeptSlug]?.name || baseDeptEvaluator.name
  const targetDeptTitle = accounts[targetDeptSlug]?.title || baseDeptEvaluator.title
  const targetDeptEmail = accounts[targetDeptSlug]?.email || baseDeptEvaluator.email
  const targetDeptDepartment = (appDeptData as any)?.name || baseDeptEvaluator.departmentName

  let bcnAssignedEmail = activeAdmin.email || currentEvaluator.email
  if (typeof window !== 'undefined') {
    try {
      const created = localStorage.getItem('issac_created_admins')
      if (created) {
        const parsed = JSON.parse(created)
        const match = parsed.find((a: any) => a.admin_role === activeRole && a.is_active)
        if (match?.email) bcnAssignedEmail = match.email
      }
    } catch {}
  }

  let loggedName: string | null = null
  let loggedTitle: string | null = null
  let loggedEmail: string | null = null
  if (typeof document !== 'undefined') {
    const matchName = document.cookie.match(/(?:^|;\s*)issac_logged_admin_name=([^;]+)/)
    if (matchName) {
      try { loggedName = decodeURIComponent(matchName[1]) } catch {}
    }
    const matchTitle = document.cookie.match(/(?:^|;\s*)issac_logged_admin_title=([^;]+)/)
    if (matchTitle) {
      try { loggedTitle = decodeURIComponent(matchTitle[1]) } catch {}
    }
    const matchEmail = document.cookie.match(/(?:^|;\s*)issac_logged_admin_email=([^;]+)/)
    if (matchEmail) {
      try { loggedEmail = decodeURIComponent(matchEmail[1]) } catch {}
    }
  }

  const currentLoggedInAdmin = {
    name: loggedName || activeAdmin.name || currentEvaluator.name,
    title: loggedTitle || (isSuperAdmin ? (activeAdmin.title || 'Ban Chủ nhiệm CLB') : (activeAdmin.title || `Cán bộ Tuyển quân · ${currentEvaluator.departmentName}`)),
    email: loggedEmail || activeAdmin.email || currentEvaluator.email,
    role: activeRole,
  }

  // displayEvaluator: Giữ đúng Giám khảo ban chuyên môn đã chấm điểm
  const displayEvaluator = evaluatorInfo || (
    (isSubmitted || Object.keys(scores).length > 0) ? {
      name: targetDeptName,
      email: targetDeptEmail,
      departmentName: targetDeptDepartment,
      title: targetDeptTitle,
      role: targetDeptSlug
    } : {
      name: currentLoggedInAdmin.name,
      email: currentLoggedInAdmin.email,
      departmentName: isSuperAdmin ? 'Ban Chủ nhiệm' : currentEvaluator.departmentName,
      title: currentLoggedInAdmin.title,
      role: activeRole
    }
  )

  const handleScoreChange = (criteriaId: string, val: string, maxScore: number) => {
    if (isLockedForRole) return
    const num = parseFloat(val)
    if (isNaN(num)) {
      setScores(prev => { const n = { ...prev }; delete n[criteriaId]; return n })
    } else {
      const clamped = Math.min(Math.max(0, num), maxScore)
      setScores(prev => ({ ...prev, [criteriaId]: clamped }))
    }
  }

  // Quick preset button for grading
  const handleQuickScore = (criteriaId: string, scoreVal: number) => {
    if (isLockedForRole) return
    setScores(prev => ({ ...prev, [criteriaId]: scoreVal }))
  }

  // Score calculations
  const totalScore = Object.values(scores).reduce((sum, s) => sum + s, 0)
  const maxTotal = criteria.reduce((sum, c) => sum + c.max_score, 0) // 50.0
  const normalized10 = maxTotal > 0 ? (totalScore / maxTotal) * 10 : 0 // Quy đổi hệ 10.0

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

    try {
      // 1. Lưu vào bảng evaluations (Supabase)
      const { data: { user } } = await supabase.auth.getUser()
      const interviewerId = user?.id || '00000000-0000-0000-0000-000000000001'

      // Người chấm điểm: Nếu đã có thông tin chấm từ trước, giữ nguyên; nếu chưa, lưu chính tài khoản đang chấm
      const graderToPersist = evaluatorInfo ? evaluatorInfo : {
        name: currentLoggedInAdmin.name,
        title: currentLoggedInAdmin.title,
        email: currentLoggedInAdmin.email,
        departmentName: isSuperAdmin ? 'Ban Chủ nhiệm' : currentEvaluator.departmentName,
        role: activeRole,
        evaluatedAt: new Date().toISOString()
      }

      // Thông tin Ban Chủ nhiệm thẩm định
      const bcnReviewerPayload = isSuperAdmin ? {
        name: currentLoggedInAdmin.name,
        title: currentLoggedInAdmin.title,
        email: currentLoggedInAdmin.email,
        reviewedAt: new Date().toISOString()
      } : (bcnReviewerInfo || null)

      const overallPayload = JSON.stringify({
        justification: justification.trim(),
        grader: graderToPersist,
        bcnReviewer: bcnReviewerPayload,
        bcnDecision: isSuperAdmin ? bcnDecision : undefined,
        bcnNote: bcnNote.trim(),
        updatedAt: new Date().toISOString()
      })

      await supabase.from('evaluations').upsert({
        application_id: applicationId,
        interviewer_id: interviewerId,
        total_score: parseFloat(totalScore.toFixed(1)),
        overall_comment: overallPayload,
        strengths: strengths.trim(),
        weaknesses: weaknesses.trim(),
        recommendation: recommendation || null,
        submitted_at: (submit || isSubmitted) ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'application_id' })

      // 2. Cập nhật candidate_rankings (điểm hệ 10 chuẩn)
      await supabase.from('candidate_rankings').upsert({
        application_id: applicationId,
        final_score: parseFloat(normalized10.toFixed(1)),
        result: (isSuperAdmin && bcnDecision !== 'pending') ? bcnDecision : (recommendation || 'pending'),
        updated_at: new Date().toISOString(),
      }, { onConflict: 'application_id' })

      // 3. Nếu nộp chính thức, cập nhật trạng thái đơn sang 'interviewed'
      if (submit) {
        await supabase.from('applications').update({ status: 'interviewed' }).eq('id', applicationId)
      }

      // 4. Lưu trữ dự phòng ở localStorage để luôn hiển thị chính xác
      localStorage.setItem(`eval_scores_${applicationId}`, JSON.stringify({
        scores,
        totalScore,
        normalized10,
        justification,
        strengths,
        weaknesses,
        recommendation,
        evaluator: graderToPersist,
        bcnReviewer: bcnReviewerPayload,
        bcnDecision,
        bcnNote,
        updatedAt: new Date().toISOString(),
      }))

      if (submit) {
        localStorage.setItem(`eval_submitted_${applicationId}`, 'true')
        setIsSubmitted(true)
      }

      // 5. Broadcast Real-time update to all listeners (tabs / components)
      if (typeof window !== 'undefined') {
        try {
          if ('BroadcastChannel' in window) {
            const bc = new BroadcastChannel('issac_eval_channel')
            bc.postMessage({ applicationId, timestamp: Date.now() })
            bc.close()
          }
          window.dispatchEvent(new CustomEvent('issac_eval_updated', {
            detail: { applicationId, timestamp: Date.now() }
          }))
          localStorage.setItem('issac_last_eval_update', String(Date.now()))
        } catch {}
      }

      if (submit) {
        setShowConfirm(false)
        toast({
          title: '✅ Đã nộp phiếu chấm điểm & đề xuất!',
          description: `Đã chấm ${totalScore.toFixed(1)}/50.0đ (quy đổi ${normalized10.toFixed(1)}/10đ). Đề xuất đã chuyển lên Ban Chủ nhiệm.`,
          variant: 'success'
        } as Parameters<typeof toast>[0])
      } else if (isSubmitted && isSuperAdmin) {
        toast({
          title: '✅ Ban Chủ nhiệm đã cập nhật thẩm định!',
          description: `Đã cập nhật điểm số (${totalScore.toFixed(1)}/50đ • ${normalized10.toFixed(1)}/10đ) và thẩm định BCN real-time.`,
          variant: 'success'
        } as Parameters<typeof toast>[0])
      } else {
        toast({
          title: '✅ Đã lưu bản nháp',
          description: 'Điểm số theo 5 tiêu chí và phần lý giải đã được lưu tạm.',
          variant: 'success'
        } as Parameters<typeof toast>[0])
      }
    } catch (err: any) {
      console.warn('Lỗi lưu điểm (đã lưu cache):', err)
      if (submit) {
        localStorage.setItem(`eval_submitted_${applicationId}`, 'true')
        setShowConfirm(false)
        setIsSubmitted(true)
      }
      toast({
        title: submit ? '✅ Đã ghi nhận phiếu chấm' : '✅ Đã lưu bản nháp',
        description: 'Điểm số và đánh giá đã được lưu vào hệ thống.',
        variant: 'success'
      } as Parameters<typeof toast>[0])
    } finally {
      setSaving(false)
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-[#1657c1] mb-2" />
        <p className="text-sm text-slate-500 font-medium">Đang tải phiếu đánh giá & hồ sơ ứng viên...</p>
      </div>
    )
  }

  const profile = application?.profiles
  const facebookUrl = profile?.facebook_url ||
    (profile?.address?.includes('facebook.com') || profile?.address?.startsWith('http') ? profile.address : null)

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in pb-16 font-sans">
      {/* 1. TOP NAVIGATION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <Link
          href="/admin/evaluation"
          className="inline-flex items-center gap-2 text-xs sm:text-sm text-slate-600 hover:text-[#1657c1] font-bold transition-colors bg-white px-3.5 py-2 rounded-xl border border-slate-200 shadow-2xs w-fit"
        >
          <ArrowLeft className="w-4 h-4" /> Quay lại danh sách chấm điểm
        </Link>
        <div className="flex items-center gap-2">
          <Badge className={`px-3 py-1 text-xs font-bold border ${roleConfig.badgeColor}`}>
            Quyền chấm: {roleConfig.shortLabel}
          </Badge>
          <Link href="/admin/ranking">
            <Button variant="outline" size="sm" className="h-8 text-xs font-bold text-[#1657c1] border-blue-200 hover:bg-blue-50">
              Xem Bảng xếp hạng
            </Button>
          </Link>
        </div>
      </div>

      {/* 2. EVALUATOR IDENTITY CARD */}
      <Card className="shadow-xs border border-blue-200 bg-gradient-to-r from-blue-50/80 via-white to-indigo-50/50 rounded-2xl overflow-hidden">
        <CardContent className="p-4 sm:p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-[#1657c1] text-white flex items-center justify-center font-black text-base shadow-sm shrink-0">
                <UserCheck className="w-6 h-6" />
              </div>
              <div>
                <div className="text-[10px] font-black uppercase tracking-wider text-[#1657c1]">
                  Giám khảo chấm điểm phỏng vấn
                </div>
                <div className="font-black text-base sm:text-lg text-slate-900 flex flex-wrap items-center gap-2 mt-0.5">
                  <span>{displayEvaluator.name}</span>
                  <Badge variant="outline" className="text-[10px] font-bold bg-white text-slate-700 border-slate-300">
                    {displayEvaluator.departmentName || application?.departments?.name || 'Ban Chuyên môn'}
                  </Badge>
                  <span className="text-xs text-slate-500 font-medium">({displayEvaluator.title})</span>
                </div>
                <div className="text-xs text-slate-600 font-mono mt-0.5">
                  Email: <strong>{displayEvaluator.email}</strong>
                </div>
                {bcnReviewerInfo && (
                  <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-300 text-amber-950 text-xs font-bold shadow-2xs">
                    <Crown className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span>Ban Chủ nhiệm thẩm định: <strong>{bcnReviewerInfo.name}</strong> ({bcnReviewerInfo.title})</span>
                  </div>
                )}
              </div>
            </div>

            <div className="text-left sm:text-right border-t sm:border-t-0 pt-3 sm:pt-0">
              <div className="text-[11px] text-slate-500 font-medium">Bạn đang đăng nhập với tư cách</div>
              <div className="font-bold text-xs sm:text-sm text-slate-900 flex items-center sm:justify-end gap-1.5 mt-0.5">
                {isSuperAdmin && <Crown className="w-3.5 h-3.5 text-amber-600 shrink-0" />}
                <span className="text-[#1657c1] font-black">{currentLoggedInAdmin.name}</span>
                <span className="text-slate-600 text-xs font-semibold">({currentLoggedInAdmin.title})</span>
              </div>
              {isSuperAdmin ? (
                <div className="mt-1">
                  <Badge className="bg-amber-100 text-amber-900 border-amber-300 text-[10px] font-bold">
                    Ban Chủ nhiệm: Toàn quyền thẩm định & điều chỉnh
                  </Badge>
                </div>
              ) : (
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Quyền chấm: {appDeptSlug === activeRole ? 'Ban phụ trách ứng viên' : 'Chỉ xem'}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Access Denied Notice if not allowed */}
      {!canGrade && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-red-900 text-sm flex items-start gap-3 shadow-xs">
          <ShieldAlert className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div>
            <div className="font-black">Giới hạn chấm điểm theo Ban</div>
            <p className="text-xs text-red-700 mt-1">
              Bạn đang đăng nhập với tài khoản <strong>{roleConfig.label} ({roleConfig.shortLabel})</strong>. Ứng viên này đăng ký vào <strong>{application?.departments?.name}</strong>. Theo quy chế tuyển quân, mỗi ban chỉ chấm thành viên ban mình; chỉ Ban Chủ nhiệm mới có quyền thẩm định tất cả các ban.
            </p>
          </div>
        </div>
      )}

      {/* 3. CANDIDATE PROFILE SUMMARY - HIỆN RÕ THÔNG TIN ỨNG VIÊN KHI CHẤM */}
      <Card className="shadow-xs border border-slate-200/90 bg-white rounded-3xl overflow-hidden">
        {/* Header Hero */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-slate-50 via-white to-blue-50/40 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#1657c1] to-blue-700 text-white flex items-center justify-center font-black text-xl shadow-md ring-4 ring-blue-50 shrink-0">
              {profile?.full_name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Hồ sơ ứng viên phỏng vấn
              </div>
              <div className="flex flex-wrap items-center gap-2 mt-0.5">
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  {profile?.full_name || 'Ứng viên'}
                </h2>
                <Badge className="bg-blue-100 text-[#1657c1] border-blue-200 text-xs font-black px-2.5 py-0.5">
                  {profile?.cohort || 'K22'}
                </Badge>
                <Badge variant="outline" className="bg-white text-slate-700 border-slate-300 text-xs font-bold">
                  {application?.departments?.name || 'Ban ứng tuyển'}
                </Badge>
              </div>
              <div className="text-xs text-slate-500 font-mono mt-1 flex flex-wrap items-center gap-1.5">
                <span>Mã hồ sơ:</span>
                <strong className="text-[#1657c1] font-mono font-bold">
                  {candidateCode}
                </strong>
                <span className="text-slate-300">•</span>
                <span className="text-[11px] text-slate-400">UUID: {application?.id?.slice(0, 8)}...</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {/* Direct Link to Candidate Full Dossier */}
            <Link
              href={`/admin/candidates/${applicationId}`}
              target="_blank"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-all shadow-2xs"
              title="Mở toàn bộ đơn ứng tuyển và câu trả lời trong tab mới"
            >
              <FileText className="w-3.5 h-3.5 text-[#1657c1]" />
              <span>Xem bài làm & câu trả lời</span>
              <ExternalLink className="w-3 h-3 text-slate-400" />
            </Link>

            {facebookUrl && (
              <a
                href={facebookUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-2xs"
              >
                <Globe className="w-3.5 h-3.5" />
                <span>Facebook</span>
              </a>
            )}
          </div>
        </div>

        {/* 8-Item Information Matrix */}
        <div className="p-5 sm:p-6 grid grid-cols-2 sm:grid-cols-4 gap-3.5 text-xs">
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">MSSV</div>
            <div className="font-mono font-bold text-slate-900 mt-1 text-sm">{profile?.student_id || 'Chưa cập nhật'}</div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Số điện thoại</div>
            <div className="font-mono font-bold text-slate-900 mt-1 text-sm">{profile?.phone || '—'}</div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Email trường (VNU)</div>
            <div className="font-mono font-bold text-slate-900 mt-1 text-xs truncate" title={profile?.email}>
              {profile?.email || '—'}
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Chuyên ngành - Khóa</div>
            <div className="font-bold text-slate-900 mt-1 truncate" title={profile?.major}>
              {profile?.major || 'Hệ thống thông tin quản lý'} ({profile?.cohort || 'K22'})
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Trường Đại học</div>
            <div className="font-bold text-slate-900 mt-1 truncate">
              {profile?.university || 'Trường Quốc tế - ĐHQGHN'}
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Trường THPT</div>
            <div className="font-bold text-slate-900 mt-1 truncate" title={profile?.high_school}>
              {profile?.high_school || '—'}
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Ngày sinh & Giới tính</div>
            <div className="font-bold text-slate-900 mt-1">
              {profile?.date_of_birth || '—'} · {profile?.gender || '—'}
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Ban đăng ký (NV1)</div>
            <div className="font-bold text-[#1657c1] mt-1">{application?.departments?.name || '—'}</div>
          </div>
        </div>
      </Card>

      {/* 3.5 LOCKED STATUS BANNER IF SUBMITTED */}
      {isSubmitted && (
        <div className="bg-gradient-to-r from-amber-50 via-amber-50/90 to-amber-100/60 border-2 border-amber-300 rounded-3xl p-5 text-amber-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-amber-200 text-amber-900 flex items-center justify-center shrink-0 shadow-xs ring-4 ring-amber-100">
              <Lock className="w-6 h-6 text-amber-900" />
            </div>
            <div>
              <div className="font-black text-sm sm:text-base text-amber-950 flex flex-wrap items-center gap-2">
                <span>Phiếu chấm điểm đã nộp chính thức lên Ban Chủ nhiệm</span>
                <Badge className="bg-amber-300 text-amber-950 border-amber-500 text-[10px] font-black uppercase">
                  {isSuperAdmin ? 'Chế độ thẩm định BCN' : 'Đã khóa chỉnh sửa'}
                </Badge>
              </div>
              <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                {isSuperAdmin
                  ? `Phiếu điểm này do Giám khảo ${displayEvaluator.name} (${displayEvaluator.title}) nộp lên. Ban Chủ nhiệm có toàn quyền thẩm định, điều chỉnh điểm số và phê duyệt kết quả cuối cùng.`
                  : 'Theo quy chế tuyển quân CLB iSSAC, sau khi Ban chuyên môn nộp phiếu chấm kèm đề xuất, hệ thống khóa cố định điểm để đảm bảo tính công bằng và minh bạch tuyệt đối.'}
              </p>
            </div>
          </div>
          {isSuperAdmin ? (
            <Badge className="bg-amber-300 text-amber-950 border-amber-500 font-bold text-xs shrink-0 self-end sm:self-auto py-1.5 px-3">
              Ban Chủ nhiệm: Có quyền thẩm định & điều chỉnh
            </Badge>
          ) : (
            <Badge variant="outline" className="bg-white/80 text-amber-900 border-amber-300 font-bold text-xs shrink-0 self-end sm:self-auto">
              Chế độ chỉ xem (Đã khóa)
            </Badge>
          )}
        </div>
      )}

      {/* 4. VISUAL SPREADSHEET SUMMARY - CHUẨN HOÁ GIỐNG BẢNG EXCEL TRONG ẢNH 2 */}
      <Card className="shadow-xs border border-blue-200 bg-white rounded-3xl overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200/80 flex items-center justify-between">
          <div className="font-black text-xs sm:text-sm text-slate-800 flex items-center gap-2">
            <Star className="w-4 h-4 text-amber-500" />
            <span>Bảng tổng hợp điểm phỏng vấn (Theo thang điểm CLB iSSAC)</span>
          </div>
          <Badge className="bg-blue-100 text-[#1657c1] border-blue-200 text-[10px] font-bold">
            Thang 50.0
          </Badge>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-center border-collapse">
            <thead>
              <tr className="bg-[#1b64da] text-white text-xs sm:text-sm font-bold">
                <th className="p-3 border-r border-blue-500/50">Giới thiệu<br /><span className="text-[11px] font-normal opacity-90">(10)</span></th>
                <th className="p-3 border-r border-blue-500/50">Kỹ năng giao tiếp/<br />tư duy (10)</th>
                <th className="p-3 border-r border-blue-500/50">Kinh nghiệm sau<br />thực nghiệm (10)</th>
                <th className="p-3 border-r border-blue-500/50">Ngoại hình<br /><span className="text-[11px] font-normal opacity-90">(10)</span></th>
                <th className="p-3 border-r border-blue-500/50">Thái độ cam<br />kết (10)</th>
                <th className="p-3 bg-[#0e4399] text-white font-black text-base">Total</th>
              </tr>
            </thead>
            <tbody>
              <tr className="text-sm sm:text-base font-bold text-slate-800 bg-white">
                <td className="p-3.5 border border-slate-200 font-mono">
                  {scores['crit-gioi-thieu'] !== undefined ? scores['crit-gioi-thieu'] : '—'}
                </td>
                <td className="p-3.5 border border-slate-200 font-mono">
                  {scores['crit-giao-tiep-tu-duy'] !== undefined ? scores['crit-giao-tiep-tu-duy'] : '—'}
                </td>
                <td className="p-3.5 border border-slate-200 font-mono text-red-600 font-black">
                  {scores['crit-kinh-nghiem'] !== undefined ? scores['crit-kinh-nghiem'] : '—'}
                </td>
                <td className="p-3.5 border border-slate-200 font-mono">
                  {scores['crit-ngoai-hinh'] !== undefined ? scores['crit-ngoai-hinh'] : '—'}
                </td>
                <td className="p-3.5 border border-slate-200 font-mono">
                  {scores['crit-thai-do-cam-ket'] !== undefined ? scores['crit-thai-do-cam-ket'] : '—'}
                </td>
                <td className="p-3.5 border border-slate-200 bg-red-50/40 text-red-600 font-black text-lg sm:text-xl font-mono">
                  {totalScore > 0 ? totalScore.toFixed(1) : '—'}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="p-3.5 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="text-slate-600">
            <span>Điểm quy đổi hệ 10: </span>
            <strong className="text-[#1657c1] font-black text-sm">{normalized10.toFixed(1)} / 10.0đ</strong>
            <span className="text-slate-400 ml-1.5">• Xếp loại: <strong className={getScoreGradeColor(normalized10, 10)}>{getScoreGrade(normalized10, 10)}</strong></span>
          </div>
          <div className="text-[11px] text-slate-600 flex items-center gap-2">
            <span>Giám khảo chấm: <strong className="text-slate-900">{displayEvaluator.name}</strong> ({displayEvaluator.title})</span>
            {isSuperAdmin && (
              <Badge className="bg-amber-100 text-amber-900 border-amber-300 text-[10px] font-bold">
                Thẩm định BCN: {activeAdmin.name}
              </Badge>
            )}
          </div>
        </div>
      </Card>

      {/* 5. EVALUATION CRITERIA INPUT FORM - 5 TIÊU CHÍ x 10 ĐIỂM */}
      <Card className={`shadow-xs border border-slate-200/90 rounded-3xl overflow-hidden ${!canGrade ? 'opacity-60 pointer-events-none' : ''}`}>
        <CardHeader className="border-b bg-slate-50/80 py-4 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
              <Star className="w-5 h-5 text-amber-500" />
              Phiếu Chấm Điểm Chi Tiết (5 Tiêu Chí Chuẩn CLB)
            </CardTitle>
            <p className="text-xs text-slate-500 mt-0.5">
              Nhập điểm trực tiếp từ 0 đến 10 cho từng tiêu chí (cho phép điểm lẻ như 7.5, 8.5)
            </p>
          </div>
          <div className="text-right hidden sm:block">
            <span className="text-xs text-slate-800 font-bold block">
              Giám khảo: {displayEvaluator.name}
            </span>
            <span className="text-[10px] text-slate-500">
              {displayEvaluator.title}
            </span>
          </div>
        </CardHeader>

        <CardContent className="p-5 sm:p-6 space-y-4">
          {criteria.map((c, index) => {
            const currentVal = scores[c.id]
            return (
              <div
                key={c.id}
                className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 hover:border-blue-300 transition-all shadow-2xs space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-blue-100 text-[#1657c1] flex items-center justify-center font-black text-xs shrink-0">
                        {index + 1}
                      </span>
                      <h3 className="font-black text-slate-900 text-sm sm:text-base">
                        {c.name}
                      </h3>
                      <Badge className="bg-blue-50 text-[#1657c1] border-blue-200 text-[10px] font-black">
                        Tối đa {c.max_score}đ
                      </Badge>
                    </div>
                    {c.description && (
                      <p className="text-xs text-slate-500 mt-1.5 leading-relaxed pl-8">
                        {c.description}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    <input
                      type="number"
                      min={0}
                      max={c.max_score}
                      step={0.5}
                      value={currentVal ?? ''}
                      onChange={e => handleScoreChange(c.id, e.target.value, c.max_score)}
                      disabled={isLockedForRole}
                      placeholder="0.0"
                      className="w-20 h-11 text-center text-lg font-black text-[#1657c1] border-2 border-blue-200 rounded-xl focus:outline-none focus:border-[#1657c1] bg-slate-50/50 font-mono disabled:opacity-75 disabled:bg-slate-100"
                    />
                    <span className="text-xs text-slate-500 font-bold">/ {c.max_score}đ</span>
                  </div>
                </div>

                {/* Quick Score Rating Pills */}
                {canGrade && !isLockedForRole && (
                  <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-1.5 pl-8">
                    <span className="text-[11px] text-slate-400 font-medium mr-1">Gợi ý nhanh:</span>
                    {[5, 6, 7, 7.5, 8, 8.5, 9, 9.5, 10].map(val => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => handleQuickScore(c.id, val)}
                        className={`px-2 py-0.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          currentVal === val
                            ? 'bg-[#1657c1] text-white shadow-2xs'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                        }`}
                      >
                        {val}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </CardContent>
      </Card>

      {/* 6. MANDATORY JUSTIFICATION SECTION */}
      <Card className={`shadow-xs border-2 rounded-3xl overflow-hidden ${!justification.trim() ? 'border-amber-300' : 'border-slate-200'} ${!canGrade ? 'opacity-60 pointer-events-none' : ''}`}>
        <CardHeader className="border-b bg-amber-50/40 py-3.5">
          <CardTitle className="text-base font-black text-slate-900 flex items-center justify-between">
            <span className="flex items-center gap-2">
              Lý giải chi tiết cho điểm số đã chấm
              <span className="text-red-500">* (Bắt buộc)</span>
            </span>
            <span className="text-xs text-slate-500 font-normal">Ban Chủ nhiệm sẽ thẩm định dựa trên lý giải này</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-5 sm:p-6 space-y-4">
          <div>
            <Label className="text-xs font-bold text-slate-800 mb-1.5 block">
              Căn cứ & lý giải vì sao chấm mức điểm trên ({totalScore.toFixed(1)}/50đ • Quy đổi {normalized10.toFixed(1)}/10đ)
            </Label>
            <Textarea
              value={justification}
              onChange={e => setJustification(e.target.value)}
              placeholder="Vui lòng giải thích rõ căn cứ vì sao cho mức điểm này: dẫn chứng phần giới thiệu, phản xạ câu hỏi tình huống, kinh nghiệm thực tế, ngoại hình tác phong, thái độ cam kết gắn bó..."
              rows={4}
              disabled={isLockedForRole}
              className="text-sm bg-white rounded-xl disabled:opacity-75 disabled:bg-slate-100"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Ví dụ: Giới thiệu lưu loát (7/10), giao tiếp và tư duy tốt (7.5/10), kinh nghiệm thực chiến thực tế (7/10), ngoại hình sáng thanh lịch (8/10), thái độ cam kết cao (9/10) → Tổng 38.5/50đ.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <Label className="text-xs font-bold text-slate-700 mb-1.5 block">Điểm mạnh nổi bật</Label>
              <Textarea
                value={strengths}
                onChange={e => setStrengths(e.target.value)}
                placeholder="VD: Tư duy logic tốt, ngoại hình sáng, tác phong chỉn chu, nhiệt huyết cống hiến..."
                rows={2}
                disabled={isLockedForRole}
                className="text-xs rounded-xl disabled:opacity-75 disabled:bg-slate-100"
              />
            </div>

            <div>
              <Label className="text-xs font-bold text-slate-700 mb-1.5 block">Điểm cần cải thiện / Hạn chế</Label>
              <Textarea
                value={weaknesses}
                onChange={e => setWeaknesses(e.target.value)}
                placeholder="VD: Cần tự tin hơn khi nói trước đám đông, cần cân đối lịch học và hoạt động CLB..."
                rows={2}
                disabled={isLockedForRole}
                className="text-xs rounded-xl disabled:opacity-75 disabled:bg-slate-100"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 7. PRELIMINARY DEPARTMENT RECOMMENDATION */}
      <Card className={`shadow-xs border border-slate-200 rounded-3xl overflow-hidden ${!canGrade ? 'opacity-60 pointer-events-none' : ''}`}>
        <CardHeader className="border-b bg-slate-50/80 py-3.5">
          <CardTitle className="text-base font-black text-slate-900 flex items-center justify-between">
            <span>Đề xuất sơ bộ gửi Ban Chủ nhiệm</span>
            <span className="text-xs text-slate-500 font-normal">Đề xuất tham khảo từ Ban chuyên môn</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-5 space-y-4">
          <div className="grid grid-cols-3 gap-3">
            {[
              {
                value: 'pass',
                title: 'Pass (Đạt)',
                desc: 'Đủ điều kiện trúng tuyển chính thức',
                bg: recommendation === 'pass' ? 'bg-emerald-600 text-white shadow-md ring-2 ring-emerald-400' : 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
              },
              {
                value: 'waitlist',
                title: 'Dự bị (Waitlist)',
                desc: 'Xem xét nếu có vị trí trống',
                bg: recommendation === 'waitlist' ? 'bg-amber-500 text-white shadow-md ring-2 ring-amber-400' : 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100'
              },
              {
                value: 'fail',
                title: 'Không đạt (Fail)',
                desc: 'Chưa đáp ứng tiêu chuẩn tuyển chọn',
                bg: recommendation === 'fail' ? 'bg-red-600 text-white shadow-md ring-2 ring-red-400' : 'bg-red-50 text-red-800 border border-red-200 hover:bg-red-100'
              },
            ].map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => !isLockedForRole && setRecommendation(opt.value as any)}
                disabled={isLockedForRole}
                className={`p-3.5 rounded-2xl text-left transition-all cursor-pointer disabled:cursor-not-allowed ${opt.bg}`}
              >
                <div className="font-bold text-xs sm:text-sm">{opt.title}</div>
                <div className="text-[11px] opacity-80 mt-0.5">{opt.desc}</div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 8. BAN CHỦ NHIỆM FINAL DECISION BOX */}
      {isSuperAdmin && (
        <Card className="shadow-xs border-2 border-amber-300 bg-amber-50/20 rounded-3xl overflow-hidden">
          <CardHeader className="border-b bg-amber-100/50 py-3.5 flex flex-row items-center justify-between">
            <CardTitle className="text-base text-amber-950 font-black flex items-center gap-2">
              <Crown className="w-5 h-5 text-amber-600" />
              Thẩm Quyền Thẩm Định Của Ban Chủ Nhiệm
            </CardTitle>
            <Badge className="bg-amber-200 text-amber-900 border-amber-400 font-bold text-xs">
              Quyết định BCN
            </Badge>
          </CardHeader>
          <CardContent className="p-5 space-y-3">
            <div className="text-xs text-amber-900">
              Ban Chủ nhiệm xem xét điểm số ({totalScore.toFixed(1)}/50đ • Quy đổi {normalized10.toFixed(1)}/10đ), người chấm ({displayEvaluator.name}), và lý giải điểm của Ban:
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[
                { val: 'pass', label: 'Phê duyệt Pass', color: bcnDecision === 'pass' ? 'bg-emerald-600 text-white' : 'bg-white text-emerald-800 border' },
                { val: 'waitlist', label: 'Dự bị', color: bcnDecision === 'waitlist' ? 'bg-amber-500 text-white' : 'bg-white text-amber-800 border' },
                { val: 'fail', label: 'Trượt', color: bcnDecision === 'fail' ? 'bg-red-600 text-white' : 'bg-white text-red-800 border' },
              ].map(item => (
                <button
                  key={item.val}
                  type="button"
                  onClick={() => setBcnDecision(item.val as any)}
                  className={`p-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${item.color}`}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <div>
              <Label className="text-xs font-bold text-slate-700 mb-1 block">Ghi chú thẩm định của BCN (nếu có)</Label>
              <input
                type="text"
                value={bcnNote}
                onChange={e => setBcnNote(e.target.value)}
                placeholder="VD: Ban Chủ nhiệm nhất trí phê duyệt kết quả của ứng viên."
                className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white"
              />
            </div>
            {isSubmitted && (
              <div className="pt-2 flex justify-end">
                <Button
                  onClick={() => handleSaveEvaluation(false)}
                  disabled={saving}
                  className="bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs sm:text-sm h-10 px-5 shadow-sm"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                  Lưu thẩm định & Cập nhật điểm số BCN
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* 9. ACTION BUTTONS */}
      {canGrade && !isSubmitted && (
        <div className="flex gap-3 pt-2">
          <Button
            variant="outline"
            onClick={() => handleSaveEvaluation(false)}
            disabled={saving}
            className="flex-1 gap-2 rounded-xl text-xs sm:text-sm font-bold h-11"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Lưu bản nháp
          </Button>
          <Button
            onClick={() => setShowConfirm(true)}
            disabled={totalScore === 0 || !recommendation || !justification.trim()}
            className="flex-1 gap-2 bg-[#1657c1] hover:bg-blue-800 text-white rounded-xl text-xs sm:text-sm font-bold h-11 shadow-sm"
          >
            <Send className="w-4 h-4" />
            Nộp Điểm & Gửi Đề Xuất Lên Ban Chủ Nhiệm
          </Button>
        </div>
      )}

      {isSubmitted && (
        <Card className="border-2 border-slate-200 bg-slate-50/80 rounded-3xl overflow-hidden shadow-xs">
          <CardContent className="p-6 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center mx-auto shadow-2xs">
              <Lock className="w-6 h-6 text-amber-700" />
            </div>
            <div>
              <div className="font-black text-base text-slate-900 flex items-center justify-center gap-2">
                <span>Phiếu chấm điểm & Đề xuất đã được nộp chính thức</span>
                <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 text-xs font-bold">
                  Đã ghi nhận
                </Badge>
              </div>
              <p className="text-xs text-slate-500 max-w-xl mx-auto mt-1 leading-relaxed">
                {isSuperAdmin
                  ? 'Ban Chủ nhiệm có toàn quyền thẩm định, điều chỉnh điểm số 5 tiêu chí ở trên và nhấn "Lưu thẩm định & Cập nhật điểm số BCN" để cập nhật real-time sang Bảng xếp hạng.'
                  : 'Nhằm đảm bảo tính công bằng và khách quan tuyệt đối giữa các ban, sau khi nộp đề xuất và điểm số lên Ban Chủ nhiệm, quyền chỉnh sửa đã được khóa cố định. Kết quả đang được thẩm định trên Bảng xếp hạng.'}
              </p>
            </div>
            <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
              <Link href="/admin/evaluation">
                <Button variant="outline" className="rounded-xl text-xs font-bold h-10 px-4">
                  <ArrowLeft className="w-3.5 h-3.5 mr-1.5" /> Quay lại danh sách chấm điểm
                </Button>
              </Link>
              <Link href="/admin/ranking">
                <Button className="bg-[#1657c1] hover:bg-blue-800 text-white rounded-xl text-xs font-bold h-10 px-4 shadow-sm">
                  Xem Bảng xếp hạng
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Confirm Submission Dialog */}
      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent className="max-w-lg rounded-3xl">
          <DialogHeader>
            <DialogTitle className="font-black text-slate-900">
              Xác nhận gửi điểm & lý giải lên Ban Chủ nhiệm
            </DialogTitle>
            <DialogDescription asChild>
              <div className="space-y-2 pt-2 text-left text-sm text-slate-500">
                <p>Bạn đang hoàn tất phiếu chấm điểm cho ứng viên <strong>{profile?.full_name}</strong>:</p>
                <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-xs space-y-2 text-blue-950 font-medium">
                  <div>• Ban ứng tuyển: <strong>{application?.departments?.name}</strong></div>
                  <div>• Giám khảo chấm: <strong>{displayEvaluator.name} ({displayEvaluator.email})</strong></div>
                  <div>• Tổng điểm chấm: <strong className="text-red-600 font-black text-base">{totalScore.toFixed(1)} / 50.0đ</strong> (Quy đổi: <strong className="text-blue-800">{normalized10.toFixed(1)} / 10.0đ</strong>)</div>
                  <div>• Đề xuất của Ban: <strong className="uppercase text-emerald-700 font-bold">{recommendation}</strong></div>
                  <div>• Lý giải điểm: <span className="italic text-slate-700 line-clamp-2">"{justification}"</span></div>
                </div>
                <p className="text-[11px] text-slate-500 pt-1">
                  Lưu ý: Ban chuyên môn chỉ gửi điểm và đề xuất. Quyết định tuyển chọn cuối cùng sẽ do Ban Chủ nhiệm phê chuẩn chính thức trên Bảng xếp hạng.
                </p>
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowConfirm(false)} className="rounded-xl">Hủy</Button>
            <Button
              onClick={() => handleSaveEvaluation(true)}
              disabled={submitting}
              className="bg-[#1657c1] hover:bg-blue-800 text-white font-bold rounded-xl"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Xác nhận gửi lên BCN
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
