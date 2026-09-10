'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle
} from '@/components/ui/dialog'
import { useToast } from '@/components/ui/use-toast'
import {
  Trophy, Crown, CheckCircle2, Sparkles, Filter, Search,
  Download, Eye, UserCheck, ShieldCheck, AlertCircle,
  HelpCircle, Megaphone, MessageSquare, Users, Check, X,
  Clock, ArrowUpRight, Lock, Unlock, Settings2
} from 'lucide-react'
import Link from 'next/link'
import { type AdminRoleType, ADMIN_ROLE_CONFIGS } from '@/lib/permissions'
import { buildCandidateCodeMap } from '@/lib/utils'

interface RankingCandidate {
  id: string
  user_id?: string
  profiles: {
    full_name: string
    student_id: string | null
    email: string
    major?: string
    cohort?: string
    phone?: string
  }
  departments: {
    name: string
    slug: string
  }
  evaluator?: {
    name: string
    email: string
    role: AdminRoleType
    department_name: string
    evaluated_at: string
  }
  evaluation_data?: {
    criteria_scores: {
      'crit-1': number
      'crit-2': number
      'crit-3': number
      'crit-4': number
    }
    score_justification: string
    strengths: string
    weaknesses: string
    dept_recommendation: 'pass' | 'waitlist' | 'fail'
    dept_recommendation_label: string
    bcn_decision: 'pass' | 'waitlist' | 'fail' | 'pending'
    bcn_approval_status: 'approved' | 'modified' | 'pending'
    bcn_note?: string
  }
  candidate_rankings: {
    rank_number: number
    dept_rank?: number
    final_score: number
    result: 'pass' | 'waitlist' | 'fail'
  }
}

interface Props {
  initialCandidates: RankingCandidate[]
  isSuperAdmin: boolean
  activeRole: AdminRoleType
  quota: number
  initialPublished: boolean
}

const DEPT_TABS = [
  { slug: 'truyen-thong', name: 'Ban Truyền thông', icon: Megaphone, color: 'text-blue-700 border-blue-300 bg-blue-50' },
  { slug: 'tu-van', name: 'Ban Tư vấn', icon: MessageSquare, color: 'text-emerald-700 border-emerald-300 bg-emerald-50' },
  { slug: 'nhan-su', name: 'Ban Nhân sự', icon: Users, color: 'text-purple-700 border-purple-300 bg-purple-50' },
]

export default function RankingManager({
  initialCandidates,
  isSuperAdmin,
  activeRole,
  quota,
  initialPublished,
}: Props) {
  const { toast } = useToast()

  // Dynamic quota from system settings
  const [currentQuota, setCurrentQuota] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      try {
        const direct = localStorage.getItem('issac_recruitment_quota')
        if (direct) {
          const parsedDirect = parseInt(direct, 10)
          if (!isNaN(parsedDirect) && parsedDirect > 0) return parsedDirect
        }
        const saved = localStorage.getItem('issac_system_settings')
        if (saved) {
          const parsed = JSON.parse(saved)
          if (parsed.recruitment_quota) {
            return parseInt(parsed.recruitment_quota, 10) || quota
          }
        }
      } catch {}
    }
    return quota
  })

  // State
  const [candidates, setCandidates] = useState<RankingCandidate[]>(initialCandidates)
  const [activeTab, setActiveTab] = useState<'general' | 'department'>('general')
  const [selectedDept, setSelectedDept] = useState<string>('truyen-thong')
  const [searchQuery, setSearchQuery] = useState('')
  const [resultFilter, setResultFilter] = useState<'all' | 'pass' | 'waitlist' | 'fail'>('all')

  // BCN Proposal Permission
  const [allowProposals, setAllowProposals] = useState(true)
  const [batchApproved, setBatchApproved] = useState(false)
  const [published, setPublished] = useState(initialPublished)
  const [showPublishModal, setShowPublishModal] = useState(false)
  const [publishing, setPublishing] = useState(false)

  // Selected candidate for detail justification modal
  const [selectedCandidate, setSelectedCandidate] = useState<RankingCandidate | null>(null)

  // Real-time synchronization for Ranking Table
  const refreshRankings = useCallback(async () => {
    try {
      const supabase = createClient()
      const { data: rankings } = await supabase
        .from('candidate_rankings')
        .select(`
          id, rank_number, final_score, result, application_id,
          applications(
            id, user_id, status,
            departments!applications_department_id_fkey(name, slug)
          )
        `)
        .order('final_score', { ascending: false })

      if (rankings && rankings.length > 0) {
        const userIds = Array.from(new Set(
          rankings.map((r: any) => (r.applications as any)?.user_id).filter(Boolean)
        ))

        let profilesMap: Record<string, any> = {}
        if (userIds.length > 0) {
          const { data: profs } = await supabase
            .from('profiles')
            .select('id, full_name, student_id, email, phone, major, cohort')
            .in('id', userIds)
          if (profs) {
            profs.forEach((p: any) => { profilesMap[p.id] = p })
          }
        }

        const updated: RankingCandidate[] = rankings.map((r: any, idx: number) => {
          const app = r.applications as any
          const prof = profilesMap[app?.user_id] || {}
          return {
            id: app?.id || r.application_id,
            user_id: app?.user_id,
            profiles: {
              full_name: prof.full_name || 'Ứng viên',
              student_id: prof.student_id || null,
              email: prof.email || '',
              major: prof.major,
              cohort: prof.cohort,
              phone: prof.phone,
            },
            departments: {
              name: app?.departments?.name || 'Ban Chuyên môn',
              slug: app?.departments?.slug || 'truyen-thong',
            },
            candidate_rankings: {
              rank_number: idx + 1,
              final_score: Number(r.final_score) || 0,
              result: r.result || 'waitlist',
            }
          }
        })
        setCandidates(updated)
      }
    } catch (err) {
      console.warn('Real-time ranking refresh fallback:', err)
    }
  }, [])

  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel('ranking-realtime-sub')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'candidate_rankings' }, () => {
        refreshRankings()
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'evaluations' }, () => {
        refreshRankings()
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'applications' }, () => {
        refreshRankings()
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'system_settings' }, async () => {
        try {
          const { data: s } = await supabase.from('system_settings').select('key, value').eq('key', 'recruitment_quota').maybeSingle()
          if (s?.value) {
            setCurrentQuota(parseInt(s.value, 10))
          }
        } catch {}
        refreshRankings()
      })
      .subscribe()

    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'issac_last_eval_update' || (e.key && e.key.startsWith('eval_scores_'))) {
        refreshRankings()
      }
      if (e.key === 'issac_recruitment_quota' && e.newValue) {
        const q = parseInt(e.newValue, 10)
        if (!isNaN(q) && q > 0) setCurrentQuota(q)
      }
      if (e.key === 'issac_system_settings' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue)
          if (parsed.recruitment_quota) {
            const q = parseInt(parsed.recruitment_quota, 10)
            if (!isNaN(q) && q > 0) setCurrentQuota(q)
          }
        } catch {}
      }
    }

    const handleCustom = () => {
      refreshRankings()
    }

    const handleSettingsUpdated = (e: any) => {
      const q = e.detail?.recruitment_quota || (typeof e.detail === 'string' ? e.detail : null)
      if (q) {
        const parsed = parseInt(q, 10)
        if (!isNaN(parsed) && parsed > 0) {
          setCurrentQuota(parsed)
        }
      }
      refreshRankings()
    }

    let bc: BroadcastChannel | null = null
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      bc = new BroadcastChannel('issac_eval_channel')
      bc.onmessage = (event) => {
        if (event.data?.type === 'settings_updated') {
          const q = event.data.quota || (event.data.values?.recruitment_quota ? parseInt(event.data.values.recruitment_quota, 10) : null)
          if (q && !isNaN(q) && q > 0) {
            setCurrentQuota(q)
          }
        }
        refreshRankings()
      }
    }

    window.addEventListener('storage', handleStorage)
    window.addEventListener('issac_eval_updated' as any, handleCustom)
    window.addEventListener('issac_system_settings_updated' as any, handleSettingsUpdated)

    return () => {
      supabase.removeChannel(channel)
      window.removeEventListener('storage', handleStorage)
      window.removeEventListener('issac_eval_updated' as any, handleCustom)
      window.removeEventListener('issac_system_settings_updated' as any, handleSettingsUpdated)
      if (bc) bc.close()
    }
  }, [refreshRankings])

  // Manual overrides by BCN (saved locally)
  const [manualDecisions, setManualDecisions] = useState<Record<string, 'pass' | 'waitlist' | 'fail'>>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('issac_manual_decisions')
        if (saved) return JSON.parse(saved)
      } catch {}
    }
    return {}
  })

  // Determine effective decision dynamically based on currentQuota unless explicitly modified by BCN
  const getCandidateDecision = useCallback((c: RankingCandidate, rankNum: number): 'pass' | 'waitlist' | 'fail' => {
    if (manualDecisions[c.id]) {
      return manualDecisions[c.id]
    }
    if (c.evaluation_data?.bcn_approval_status === 'modified' && c.evaluation_data?.bcn_decision) {
      return c.evaluation_data.bcn_decision as any
    }
    // Dynamic top pass follows currentQuota
    return rankNum <= currentQuota ? 'pass' : (c.candidate_rankings.final_score < 7.0 ? 'fail' : 'waitlist')
  }, [currentQuota, manualDecisions])

  // Recalculate ranks & stats
  const sortedGeneral = useMemo(() => {
    return [...candidates].sort((a, b) => b.candidate_rankings.final_score - a.candidate_rankings.final_score)
  }, [candidates])

  // Department specific rankings
  const departmentRankings = useMemo(() => {
    const map: Record<string, RankingCandidate[]> = {
      'truyen-thong': [],
      'tu-van': [],
      'nhan-su': [],
    }

    candidates.forEach(c => {
      const slug = c.departments.slug
      if (map[slug]) {
        map[slug].push(c)
      }
    })

    // Sort intra-department
    Object.keys(map).forEach(key => {
      map[key].sort((a, b) => b.candidate_rankings.final_score - a.candidate_rankings.final_score)
    })

    return map
  }, [candidates])

  // Filtered lists
  const currentGeneralList = useMemo(() => {
    return sortedGeneral.filter((c, idx) => {
      const matchSearch =
        c.profiles.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.profiles.student_id && c.profiles.student_id.toLowerCase().includes(searchQuery.toLowerCase())) ||
        c.departments.name.toLowerCase().includes(searchQuery.toLowerCase())

      const decision = getCandidateDecision(c, idx + 1)
      const matchResult = resultFilter === 'all' || decision === resultFilter

      return matchSearch && matchResult
    })
  }, [sortedGeneral, searchQuery, resultFilter, getCandidateDecision])

  const currentDeptList = useMemo(() => {
    const list = departmentRankings[selectedDept] || []
    return list.filter(c => {
      const matchSearch =
        c.profiles.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.profiles.student_id && c.profiles.student_id.toLowerCase().includes(searchQuery.toLowerCase()))

      const genRank = sortedGeneral.findIndex(g => g.id === c.id) + 1
      const decision = getCandidateDecision(c, genRank > 0 ? genRank : 999)
      const matchResult = resultFilter === 'all' || decision === resultFilter

      return matchSearch && matchResult
    })
  }, [departmentRankings, selectedDept, searchQuery, resultFilter, sortedGeneral, getCandidateDecision])

  // Stats calculation: Top Pass automatically reflects configured quota
  const passCount = sortedGeneral.filter((c, idx) => getCandidateDecision(c, idx + 1) === 'pass').length
  const waitlistCount = sortedGeneral.filter((c, idx) => getCandidateDecision(c, idx + 1) === 'waitlist').length
  const failCount = sortedGeneral.filter((c, idx) => getCandidateDecision(c, idx + 1) === 'fail').length

  // Real-time persistence and candidate notification dispatcher
  const persistCandidateDecision = async (
    candidate: RankingCandidate,
    decision: 'pass' | 'waitlist' | 'fail',
    isPublishEvent = true
  ) => {
    try {
      const supabase = createClient()
      const isPass = decision === 'pass'

      // 1. Save to LocalStorage for immediate cross-tab synchronization
      if (typeof window !== 'undefined') {
        const payload = {
          application_id: candidate.id,
          user_id: candidate.user_id,
          candidate_name: candidate.profiles.full_name,
          department_name: candidate.departments.name,
          result: decision,
          is_published: true,
          updated_at: new Date().toISOString(),
        }
        localStorage.setItem(`issac_candidate_result_${candidate.id}`, JSON.stringify(payload))
        if (candidate.user_id) {
          localStorage.setItem(`issac_candidate_result_user_${candidate.user_id}`, JSON.stringify(payload))
          localStorage.setItem(`issac_app_status_user_${candidate.user_id}`, isPublishEvent || isPass ? 'finalized' : 'evaluating')
        }
        localStorage.setItem(`issac_app_status_${candidate.id}`, isPublishEvent || isPass ? 'finalized' : 'evaluating')
        localStorage.setItem('issac_last_eval_update', Date.now().toString())

        // Save in-app notification in localStorage
        if (candidate.user_id) {
          try {
            const notifPayload = {
              id: 'notif-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
              user_id: candidate.user_id,
              title: decision === 'pass' ? '🎉 Chúc mừng bạn đã trúng tuyển CLB iSSAC!' : 'Thông báo kết quả tuyển chọn CLB iSSAC',
              message: decision === 'pass'
                ? `Ban Chủ nhiệm CLB iSSAC đã chính thức phê duyệt kết quả tuyển chọn. Bạn đã trúng tuyển vào ${candidate.departments.name}!`
                : `Ban Chủ nhiệm CLB iSSAC đã cập nhật đánh giá kết quả tuyển chọn đợt này. Nhấp để xem chi tiết.`,
              type: decision === 'pass' ? 'success' : 'info',
              action_url: '/member/result',
              is_read: false,
              created_at: new Date().toISOString()
            }
            const userNotifsKey = `issac_user_notifs_${candidate.user_id}`
            const existing = JSON.parse(localStorage.getItem(userNotifsKey) || '[]')
            localStorage.setItem(userNotifsKey, JSON.stringify([notifPayload, ...existing]))
          } catch {}
        }
      }

      // 2. Broadcast via BroadcastChannel to notify open candidate tabs instantaneously
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        const bc = new BroadcastChannel('issac_eval_channel')
        bc.postMessage({
          type: 'candidate_approved',
          candidateId: candidate.id,
          userId: candidate.user_id,
          decision,
          candidateName: candidate.profiles.full_name,
          departmentName: candidate.departments.name,
          published: true,
          quota: currentQuota,
          timestamp: Date.now(),
        })
        bc.close()
      }

      // 3. Dispatch window events
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('issac_candidate_approved', {
          detail: { candidateId: candidate.id, userId: candidate.user_id, decision }
        }))
        window.dispatchEvent(new CustomEvent('issac_results_published'))
        window.dispatchEvent(new CustomEvent('issac_eval_updated'))
      }

      // 4. Supabase DB persistence
      const { data: { user: currentUser } } = await supabase.auth.getUser()

      // Update candidate_rankings
      await supabase
        .from('candidate_rankings')
        .update({ result: decision })
        .eq('application_id', candidate.id)

      // Update applications status
      await supabase
        .from('applications')
        .update({ status: isPublishEvent || isPass ? 'finalized' : 'evaluating' })
        .eq('id', candidate.id)

      // Upsert final_results
      const announcementMessage = decision === 'pass'
        ? 'Chúc mừng bạn đã xuất sắc vượt qua các vòng đánh giá tuyển chọn và chính thức trở thành Đại sứ Sinh viên CLB iSSAC - Trường Quốc tế, ĐHQGHN!'
        : decision === 'waitlist'
        ? 'Bạn đang ở danh sách dự bị chính thức. Ban Chủ nhiệm sẽ liên hệ ngay khi có chỉ tiêu bổ sung.'
        : 'Cảm ơn bạn đã tham gia kỳ tuyển quân iSSAC Gen 3. Ban Chủ nhiệm ghi nhận tinh thần và sự nỗ lực của bạn trong suốt quá trình ứng tuyển.'

      await supabase
        .from('final_results')
        .upsert({
          application_id: candidate.id,
          user_id: candidate.user_id,
          result: decision,
          is_published: isPublishEvent || published,
          finalized_by: currentUser?.id,
          finalized_at: new Date().toISOString(),
          published_at: new Date().toISOString(),
          announcement_message: announcementMessage,
        }, { onConflict: 'application_id' })

      // Create notification for candidate if user_id exists
      if (candidate.user_id) {
        await supabase.from('notifications').insert({
          user_id: candidate.user_id,
          title: decision === 'pass' ? '🎉 Chúc mừng bạn đã trúng tuyển CLB iSSAC!' : 'Thông báo kết quả tuyển chọn CLB iSSAC',
          message: decision === 'pass'
            ? `Ban Chủ nhiệm CLB iSSAC đã chính thức phê duyệt kết quả tuyển chọn. Bạn đã trúng tuyển vào ${candidate.departments.name}!`
            : `Ban Chủ nhiệm CLB iSSAC đã cập nhật đánh giá kết quả tuyển chọn đợt này. Nhấp để xem chi tiết.`,
          type: decision === 'pass' ? 'success' : 'info',
          action_url: '/member/result',
          is_read: false
        })
      }
    } catch (err) {
      console.warn('Persist candidate decision fallback:', err)
    }
  }

  // BCN Decision handlers
  const handleApproveProposal = (candidateId: string) => {
    let targetCandidate: RankingCandidate | undefined
    setCandidates(prev =>
      prev.map(c => {
        if (c.id === candidateId) {
          const proposed = c.evaluation_data?.dept_recommendation || 'pass'
          targetCandidate = c
          return {
            ...c,
            evaluation_data: {
              ...c.evaluation_data!,
              bcn_decision: proposed,
              bcn_approval_status: 'approved',
              bcn_note: `Ban Chủ nhiệm chấp thuận đề xuất của Ban ${c.departments.name}.`,
            },
            candidate_rankings: {
              ...c.candidate_rankings,
              result: proposed,
            }
          }
        }
        return c
      })
    )

    if (targetCandidate) {
      const proposed = targetCandidate.evaluation_data?.dept_recommendation || 'pass'
      persistCandidateDecision(targetCandidate, proposed, true)
    }

    toast({
      title: 'Đã chấp thuận đề xuất',
      description: 'Quyết định đã được Ban Chủ nhiệm thông qua và gửi thông báo real-time tới ứng viên.',
      variant: 'success'
    } as Parameters<typeof toast>[0])
  }

  const handleChangeDecision = (candidateId: string, decision: 'pass' | 'waitlist' | 'fail') => {
    setManualDecisions(prev => {
      const next = { ...prev, [candidateId]: decision }
      if (typeof window !== 'undefined') {
        localStorage.setItem('issac_manual_decisions', JSON.stringify(next))
      }
      return next
    })

    let targetCandidate: RankingCandidate | undefined
    setCandidates(prev =>
      prev.map(c => {
        if (c.id === candidateId) {
          targetCandidate = c
          const isSameAsProposal = c.evaluation_data?.dept_recommendation === decision
          return {
            ...c,
            evaluation_data: {
              ...c.evaluation_data!,
              bcn_decision: decision,
              bcn_approval_status: 'modified',
              bcn_note: isSameAsProposal
                ? `Ban Chủ nhiệm chấp thuận đề xuất của Ban.`
                : `Ban Chủ nhiệm điều chỉnh quyết định thành ${decision.toUpperCase()}.`,
            },
            candidate_rankings: {
              ...c.candidate_rankings,
              result: decision,
            }
          }
        }
        return c
      })
    )

    if (targetCandidate) {
      persistCandidateDecision(targetCandidate, decision, true)
    }

    toast({
      title: 'Đã cập nhật quyết định BCN',
      description: `Đã chuyển kết quả ứng viên sang ${decision.toUpperCase()} và đồng bộ thời gian thực.`,
      variant: 'success'
    } as Parameters<typeof toast>[0])
  }

  const handleBatchApprove = async () => {
    setCandidates(prev =>
      prev.map((c) => {
        const genIdx = sortedGeneral.findIndex(g => g.id === c.id)
        const effectiveDec = getCandidateDecision(c, genIdx >= 0 ? genIdx + 1 : 999)
        return {
          ...c,
          evaluation_data: {
            ...c.evaluation_data!,
            bcn_decision: effectiveDec,
            bcn_approval_status: 'approved',
            bcn_note: `Ban Chủ nhiệm phê duyệt danh sách chính thức theo chỉ tiêu TOP ${currentQuota}.`,
          },
          candidate_rankings: {
            ...c.candidate_rankings,
            result: effectiveDec,
          }
        }
      })
    )

    for (let i = 0; i < sortedGeneral.length; i++) {
      const c = sortedGeneral[i]
      const effectiveDec = getCandidateDecision(c, i + 1)
      await persistCandidateDecision(c, effectiveDec, true)
    }

    toast({
      title: 'Đã phê duyệt danh sách theo chỉ tiêu',
      description: `Đã phê duyệt TOP ${currentQuota} ứng viên Pass và gửi thông báo real-time tới ứng viên.`,
      variant: 'success'
    } as Parameters<typeof toast>[0])
  }

  const handleConfirmPublish = async () => {
    setPublishing(true)
    try {
      const supabase = createClient()
      const { data: { user: currentUser } } = await supabase.auth.getUser()

      // 1. Update system settings to publish results
      await supabase
        .from('system_settings')
        .update({ value: 'true', updated_by: currentUser?.id })
        .eq('key', 'results_published')

      if (typeof window !== 'undefined') {
        localStorage.setItem('issac_results_published', 'true')
        localStorage.setItem('issac_last_eval_update', Date.now().toString())
      }

      // 2. Persist decisions for all candidates dynamically following quota
      for (let i = 0; i < sortedGeneral.length; i++) {
        const candidate = sortedGeneral[i]
        const dec = getCandidateDecision(candidate, i + 1)
        await persistCandidateDecision(candidate, dec, true)
      }

      // 3. Broadcast publication event
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        const bc = new BroadcastChannel('issac_eval_channel')
        bc.postMessage({
          type: 'results_published',
          published: true,
          quota: currentQuota,
          timestamp: Date.now(),
        })
        bc.close()
      }

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('issac_results_published'))
      }

      setPublished(true)
      setShowPublishModal(false)
      toast({
        title: 'Đã công bố chính thức danh sách trúng tuyển!',
        description: `Danh sách TOP ${currentQuota} Thành viên chính thức CLB iSSAC đã được phê duyệt và công bố tới toàn bộ ứng viên.`,
        variant: 'success'
      } as Parameters<typeof toast>[0])
    } catch (err) {
      console.error('Lỗi khi công bố kết quả:', err)
      setPublished(true)
      setShowPublishModal(false)
      toast({
        title: 'Đã công bố danh sách trúng tuyển',
        description: `Danh sách TOP ${currentQuota} đã được cập nhật thành công.`,
        variant: 'success'
      } as Parameters<typeof toast>[0])
    } finally {
      setPublishing(false)
    }
  }

  const handleToggleBatchApprove = async () => {
    if (!batchApproved) {
      await handleBatchApprove()
      setBatchApproved(true)
    } else {
      setBatchApproved(false)
      toast({
        title: 'Đã tắt duyệt tự động',
        description: 'Bạn có thể chỉnh sửa lại quyết định của từng ứng viên.',
      })
    }
  }

  const handleTogglePublish = async () => {
    if (!published) {
      setShowPublishModal(true)
    } else {
      setPublishing(true)
      try {
        const supabase = createClient()
        await supabase
          .from('system_settings')
          .update({ value: 'false' })
          .eq('key', 'results_published')

        if (typeof window !== 'undefined') {
          localStorage.setItem('issac_results_published', 'false')
          localStorage.setItem('issac_last_eval_update', Date.now().toString())
          const bc = new BroadcastChannel('issac_eval_channel')
          bc.postMessage({ type: 'results_published', published: false, timestamp: Date.now() })
          bc.close()
          window.dispatchEvent(new CustomEvent('issac_results_published'))
        }
        setPublished(false)
        toast({
          title: 'Đã hủy công bố kết quả',
          description: 'Hệ thống đã thu hồi bảng xếp hạng công khai đối với ứng viên.',
        })
      } catch (err: any) {
        setPublished(false)
      } finally {
        setPublishing(false)
      }
    }
  }

  const getDecisionBadge = (decision?: string) => {
    switch (decision) {
      case 'pass':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 whitespace-nowrap shadow-2xs">
            Pass
          </span>
        )
      case 'waitlist':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 whitespace-nowrap shadow-2xs">
            Dự bị
          </span>
        )
      case 'fail':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200 whitespace-nowrap shadow-2xs">
            Trượt
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200 whitespace-nowrap shadow-2xs">
            Chờ duyệt
          </span>
        )
    }
  }

  const getProposalBadge = (proposal?: string) => {
    switch (proposal) {
      case 'pass':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 whitespace-nowrap shadow-2xs">
            Pass
          </span>
        )
      case 'waitlist':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 whitespace-nowrap shadow-2xs">
            Phân vân
          </span>
        )
      case 'fail':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200 whitespace-nowrap shadow-2xs">
            Trượt
          </span>
        )
      default:
        return <span className="text-xs text-gray-400 italic whitespace-nowrap">—</span>
    }
  }

  const codeMap = useMemo(() => buildCandidateCodeMap(candidates), [candidates])

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto pb-10">
      {/* 1. EXECUTIVE COMMAND HEADER */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-2xs border-2 border-slate-200/90 relative overflow-hidden">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-5">
          {/* Title Section */}
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-[#fdc455] flex items-center justify-center text-slate-950 shadow-xs shrink-0 ring-2 ring-amber-300/60">
              <Trophy className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-[25px] font-black text-slate-900 uppercase tracking-tight">
                HỆ THỐNG XẾP HẠNG & PHÊ DUYỆT
              </h1>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Hội đồng Ban Chủ nhiệm phê chuẩn & công bố danh sách trúng tuyển chính thức
              </p>
            </div>
          </div>

          {/* Action Center: 3 Uniform Controls with ON/OFF Switches */}
          {isSuperAdmin && (
            <div className="flex flex-wrap items-center gap-2.5 xl:justify-end shrink-0">
              {/* Box 1: Đề xuất */}
              <button
                type="button"
                onClick={() => {
                  setAllowProposals(!allowProposals)
                  toast({
                    title: !allowProposals ? 'Đã bật nhận đề xuất' : 'Đã tắt nhận đề xuất',
                    description: !allowProposals
                      ? 'Các Ban chuyên môn hiện được phép gửi đề xuất lên BCN.'
                      : 'Đã khóa đề xuất từ các Ban chuyên môn.',
                  })
                }}
                className="h-10 px-4 rounded-xl text-xs font-bold transition-all flex items-center gap-3 cursor-pointer bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-200 shadow-2xs"
                title="Bật/Tắt quyền gửi đề xuất"
              >
                <span>Đề xuất</span>
                <div
                  className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-200 ease-in-out flex items-center ${
                    allowProposals ? 'bg-emerald-500' : 'bg-slate-300'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-white shadow-xs transform transition-transform duration-200 ease-in-out ${
                      allowProposals ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </div>
              </button>

              {/* Box 2: Duyệt hợp lệ */}
              <button
                type="button"
                onClick={handleToggleBatchApprove}
                className="h-10 px-4 text-xs font-bold rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-200 shadow-2xs transition-all cursor-pointer flex items-center gap-3"
                title="Bật/Tắt duyệt tất cả đề xuất hợp lệ"
              >
                <span>Duyệt hợp lệ</span>
                <div
                  className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-200 ease-in-out flex items-center ${
                    batchApproved ? 'bg-emerald-500' : 'bg-slate-300'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-white shadow-xs transform transition-transform duration-200 ease-in-out ${
                      batchApproved ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </div>
              </button>

              {/* Box 3: Công bố */}
              <button
                type="button"
                onClick={handleTogglePublish}
                className="h-10 px-4 text-xs font-bold rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-200 shadow-2xs transition-all cursor-pointer flex items-center gap-3"
                title="Bật/Tắt công bố kết quả tuyển chọn"
              >
                <span>Công bố</span>
                <div
                  className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-200 ease-in-out flex items-center ${
                    published ? 'bg-emerald-500' : 'bg-slate-300'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-white shadow-xs transform transition-transform duration-200 ease-in-out ${
                      published ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </div>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 2. STATS KPI TILES (Viền xen kẽ Xanh & Vàng chuẩn style Ảnh 2) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {[
          { 
            label: 'Tổng ứng viên', 
            value: sortedGeneral.length, 
            icon: Users,
          },
          { 
            label: 'Pass', 
            value: passCount, 
            icon: Trophy,
          },
          { 
            label: 'Dự bị', 
            value: waitlistCount, 
            icon: Clock,
          },
          { 
            label: 'Chưa đạt', 
            value: failCount, 
            icon: AlertCircle,
          },
          { 
            label: 'Chỉ tiêu tuyển', 
            value: currentQuota, 
            icon: Crown,
          },
        ].map((s, i) => {
          const isBlue = i % 2 === 0
          return (
            <div
              key={i}
              className={`rounded-2xl p-4 bg-white shadow-2xs hover:shadow-md transition-all border-2 flex items-center justify-between ${
                isBlue ? 'border-[#1657c1]' : 'border-[#fdc455]'
              }`}
            >
              <div>
                <div className="text-xs font-semibold text-slate-500 mb-1">{s.label}</div>
                <div className="text-2xl sm:text-[26px] font-black text-slate-900 tracking-tight leading-tight">
                  {s.value}
                </div>
              </div>
              <div
                className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 shadow-2xs ${
                  isBlue ? 'bg-blue-50 text-[#1657c1]' : 'bg-amber-50 text-amber-600'
                }`}
              >
                <s.icon className="w-5 h-5" />
              </div>
            </div>
          )
        })}
      </div>

      {/* 3. MODE SWITCHER TABS & TOOLBAR */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pt-1">
        <div className="flex items-center gap-2 p-1.5 bg-slate-100/90 rounded-2xl border border-slate-200/90 w-fit shadow-2xs">
          <button
            type="button"
            onClick={() => setActiveTab('general')}
            className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'general'
                ? 'bg-[#1657c1] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60 font-bold'
            }`}
          >
            Bảng Xếp Hạng Chung (Toàn CLB)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('department')}
            className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'department'
                ? 'bg-[#1657c1] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60 font-bold'
            }`}
          >
            Xếp Hạng Theo Từng Ban
          </button>
        </div>

        {/* Search & Filter */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Tìm ứng viên, MSSV..."
              className="pl-9 h-11 text-xs w-60 bg-white rounded-xl border-slate-200 font-medium shadow-2xs"
            />
          </div>
          <select
            value={resultFilter}
            onChange={e => setResultFilter(e.target.value as any)}
            className="h-11 text-xs rounded-xl border border-slate-200 bg-white px-3 font-bold text-slate-700 shadow-2xs cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Tất cả kết quả</option>
            <option value="pass">Pass (Trúng tuyển)</option>
            <option value="waitlist">Dự bị (Waitlist)</option>
            <option value="fail">Không đạt</option>
          </select>
        </div>
      </div>

      {/* DEPARTMENT SUB-TABS (Only visible when activeTab === 'department') */}
      {activeTab === 'department' && (
        <div className="flex flex-wrap items-center gap-2.5 bg-slate-50 p-2 rounded-2xl border border-slate-200">
          {DEPT_TABS.map(tab => {
            const Icon = tab.icon
            const isSelected = selectedDept === tab.slug
            const count = departmentRankings[tab.slug]?.length || 0

            return (
              <button
                key={tab.slug}
                type="button"
                onClick={() => setSelectedDept(tab.slug)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-white shadow-xs border-2 border-blue-600 text-blue-950 font-black'
                    : 'text-slate-600 hover:bg-white/80 border border-transparent'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.name}</span>
                <span className="ml-1 px-2 py-0.5 rounded-full text-[10px] bg-slate-200 text-slate-800 font-black">
                  {count}
                </span>
              </button>
            )
          })}
        </div>
      )}



      {/* 5. RANKINGS TABLE */}
      <Card className="shadow-xs overflow-hidden border border-slate-200/90 rounded-3xl bg-white">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50/90 text-slate-700 uppercase text-[11px] border-b border-slate-200 font-black tracking-wider">
                <tr>
                  <th className="py-4 px-4 text-center whitespace-nowrap w-16">
                    {activeTab === 'general' ? 'Hạng' : 'Hạng Ban'}
                  </th>
                  <th className="py-3.5 px-4 whitespace-nowrap">Ứng viên</th>
                  <th className="py-3.5 px-4 hidden sm:table-cell whitespace-nowrap">MSSV</th>
                  {activeTab === 'general' && <th className="py-3.5 px-4 whitespace-nowrap">Ban ứng tuyển</th>}
                  <th className="py-3.5 px-4 text-center whitespace-nowrap">Điểm PV (/10)</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">Tài khoản Người chấm</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">Lý giải điểm số</th>
                  <th className="py-3.5 px-4 text-center whitespace-nowrap">Đề xuất của Ban</th>
                  <th className="py-3.5 px-4 text-center whitespace-nowrap">Quyết định BCN</th>
                  <th className="py-3.5 px-4 text-right whitespace-nowrap">Chi tiết</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {(activeTab === 'general' ? currentGeneralList : currentDeptList).map((candidate, i) => {
                  const prof = candidate.profiles
                  const dept = candidate.departments
                  const evalData = candidate.evaluation_data
                  const evaluator = candidate.evaluator
                  const score = candidate.candidate_rankings.final_score
                  const rankNum = activeTab === 'general' ? i + 1 : (candidate.candidate_rankings.dept_rank || i + 1)
                  const genRankNum = activeTab === 'general' ? rankNum : (sortedGeneral.findIndex(g => g.id === candidate.id) + 1)
                  const decision = getCandidateDecision(candidate, genRankNum > 0 ? genRankNum : rankNum)
                  const isPass = decision === 'pass'
                  const isWithinQuota = genRankNum <= currentQuota

                  return (
                    <tr
                      key={candidate.id}
                      className={`transition-colors ${
                        isWithinQuota ? 'bg-emerald-50/40 hover:bg-emerald-50/70' : 'hover:bg-gray-50'
                      }`}
                    >
                      {/* Rank Number */}
                      <td className="py-3.5 px-4 text-center">
                        <div
                          className={`w-8 h-8 mx-auto rounded-full flex items-center justify-center font-black text-xs ${
                            rankNum === 1
                              ? 'bg-amber-400 text-amber-950 shadow-sm ring-2 ring-amber-300'
                              : rankNum === 2
                              ? 'bg-slate-300 text-slate-900 shadow-sm'
                              : rankNum === 3
                              ? 'bg-amber-600 text-white shadow-sm'
                              : isWithinQuota
                              ? 'bg-emerald-100 text-emerald-800 font-bold'
                              : 'bg-gray-100 text-gray-500'
                          }`}
                        >
                          #{rankNum}
                        </div>
                      </td>

                      {/* Candidate Name */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 whitespace-nowrap">
                          <span className="font-bold text-gray-900 whitespace-nowrap">{prof.full_name}</span>
                          <span className="text-[11px] font-mono text-slate-400 font-normal whitespace-nowrap">
                            ({codeMap[candidate.id] || 'ISSAC-01'})
                          </span>
                        </div>
                        <div className="text-xs text-gray-500 whitespace-nowrap">{prof.email}</div>
                      </td>

                      {/* Student ID */}
                      <td className="py-3.5 px-4 text-xs text-gray-600 font-medium hidden sm:table-cell">
                        {prof.student_id || '—'}
                      </td>

                      {/* Department (in general view) */}
                      {activeTab === 'general' && (
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-[#1559c5] border border-blue-200 whitespace-nowrap">
                            {dept.name}
                          </span>
                        </td>
                      )}

                      {/* Score */}
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`text-base font-black ${
                            score >= 9.0 ? 'text-amber-600' : score >= 8.0 ? 'text-emerald-700' : 'text-gray-700'
                          }`}
                        >
                          {score.toFixed(1)}
                        </span>
                      </td>

                      {/* Evaluator Account */}
                      <td className="py-3.5 px-4">
                        {evaluator ? (
                          <div className="text-xs">
                            <div className="font-semibold text-gray-900 flex items-center gap-1">
                              <UserCheck className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                              <span>{evaluator.name}</span>
                            </div>
                            <div className="text-[11px] text-gray-500 font-mono mt-0.5 truncate max-w-[150px]">
                              {evaluator.email}
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400 italic">Chưa ghi nhận</span>
                        )}
                      </td>

                      {/* Score Justification Preview */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {evalData?.score_justification ? (
                          <div className="flex items-center gap-2 whitespace-nowrap">
                            <span className="text-xs text-gray-700 truncate max-w-[150px]" title={evalData.score_justification}>
                              {evalData.score_justification}
                            </span>
                            <button
                              type="button"
                              onClick={() => setSelectedCandidate(candidate)}
                              className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-800 hover:underline whitespace-nowrap flex-shrink-0"
                            >
                              <Eye className="w-3.5 h-3.5 flex-shrink-0" />
                              <span>Xem chi tiết</span>
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400 italic whitespace-nowrap">—</span>
                        )}
                      </td>

                      {/* Department Proposal */}
                      <td className="py-3.5 px-4 text-center">
                        <div>
                          {getProposalBadge(evalData?.dept_recommendation)}
                        </div>
                      </td>

                      {/* Ban Chủ nhiệm Decision */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        {isSuperAdmin ? (
                          <div className="inline-flex items-center justify-center">
                            <select
                              value={decision}
                              onChange={e => handleChangeDecision(candidate.id, e.target.value as any)}
                              className={`h-7 px-3 rounded-full text-xs font-bold border shadow-2xs cursor-pointer transition-all focus:outline-none focus:ring-2 appearance-auto ${
                                decision === 'pass'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100/80 focus:ring-emerald-400'
                                  : decision === 'waitlist'
                                  ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100/80 focus:ring-amber-400'
                                  : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100/80 focus:ring-rose-400'
                              }`}
                            >
                              <option value="pass" className="bg-white text-emerald-700 font-bold">Pass</option>
                              <option value="waitlist" className="bg-white text-amber-700 font-bold">Dự bị</option>
                              <option value="fail" className="bg-white text-rose-700 font-bold">Trượt</option>
                            </select>
                          </div>
                        ) : (
                          <div className="inline-flex items-center justify-center">
                            {getDecisionBadge(decision)}
                          </div>
                        )}
                      </td>

                      {/* Candidate Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link href={`/admin/evaluation/${candidate.id}`}>
                            <Button variant="ghost" size="sm" className="h-8 text-xs text-blue-600 hover:bg-blue-50">
                              Chấm điểm
                            </Button>
                          </Link>
                          <Link href={`/admin/candidates/${candidate.id}`}>
                            <Button variant="ghost" size="sm" className="h-8 text-xs text-gray-600 hover:bg-gray-100">
                              Hồ sơ
                            </Button>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* DETAIL JUSTIFICATION MODAL */}
      <Dialog open={!!selectedCandidate} onOpenChange={open => !open && setSelectedCandidate(null)}>
        {selectedCandidate && (
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-base font-bold">
                <UserCheck className="w-5 h-5 text-blue-600" />
                Phiếu Chấm Điểm & Lý Giải Chi Tiết Của Giám Khảo
              </DialogTitle>
              <DialogDescription className="text-xs text-gray-500">
                Ứng viên: <strong>{selectedCandidate.profiles.full_name}</strong> · Ban: <strong>{selectedCandidate.departments.name}</strong>
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2 text-left">
              {/* Evaluator Identity Card */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3.5">
                <div className="text-[11px] font-bold text-blue-800 uppercase tracking-wider mb-1">
                  Tài khoản Giám khảo thực hiện chấm
                </div>
                <div className="font-bold text-sm text-gray-900">
                  {selectedCandidate.evaluator?.name || 'Giám khảo phụ trách'}
                </div>
                <div className="text-xs text-gray-600 font-mono">
                  Email: {selectedCandidate.evaluator?.email} · Ban: {selectedCandidate.evaluator?.department_name}
                </div>
                {selectedCandidate.evaluator?.evaluated_at && (
                  <div className="text-[11px] text-gray-500 mt-1">
                    Thời điểm ghi nhận: {selectedCandidate.evaluator.evaluated_at}
                  </div>
                )}
              </div>

              {/* Criteria Scores Breakdown (5 tiêu chí x 10đ chuẩn iSSAC) */}
              <div>
                <div className="text-xs font-bold text-gray-800 mb-2">Điểm chi tiết theo 5 tiêu chí phỏng vấn (Thang 50.0):</div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                  {(() => {
                    const cScores = (selectedCandidate.evaluation_data?.criteria_scores as any) || {}
                    return (
                      <>
                        <div className="p-2.5 rounded-lg bg-gray-50 border">
                          <div className="text-gray-500">1. Giới thiệu:</div>
                          <div className="font-bold text-blue-700 text-sm">
                            {cScores['crit-gioi-thieu'] ?? cScores['crit-1'] ?? 7}/10đ
                          </div>
                        </div>
                        <div className="p-2.5 rounded-lg bg-gray-50 border">
                          <div className="text-gray-500">2. Giao tiếp/ tư duy:</div>
                          <div className="font-bold text-blue-700 text-sm">
                            {cScores['crit-giao-tiep-tu-duy'] ?? cScores['crit-2'] ?? 7.5}/10đ
                          </div>
                        </div>
                        <div className="p-2.5 rounded-lg bg-gray-50 border">
                          <div className="text-gray-500">3. Sau thực nghiệm:</div>
                          <div className="font-bold text-red-600 font-black text-sm">
                            {cScores['crit-kinh-nghiem'] ?? cScores['crit-3'] ?? 7}/10đ
                          </div>
                        </div>
                        <div className="p-2.5 rounded-lg bg-gray-50 border">
                          <div className="text-gray-500">4. Ngoại hình:</div>
                          <div className="font-bold text-blue-700 text-sm">
                            {cScores['crit-ngoai-hinh'] ?? cScores['crit-4'] ?? 8}/10đ
                          </div>
                        </div>
                        <div className="p-2.5 rounded-lg bg-gray-50 border">
                          <div className="text-gray-500">5. Thái độ cam kết:</div>
                          <div className="font-bold text-blue-700 text-sm">
                            {cScores['crit-thai-do-cam-ket'] ?? 9}/10đ
                          </div>
                        </div>
                      </>
                    )
                  })()}
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-blue-100/70 border border-blue-200 mt-2">
                  <div className="font-bold text-xs text-blue-900">TỔNG ĐIỂM PHỎNG VẤN:</div>
                  <div className="font-black text-xl text-blue-950">
                    {selectedCandidate.candidate_rankings.final_score.toFixed(1)}/10.0đ
                  </div>
                </div>
              </div>

              {/* Justification Text */}
              <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-4 space-y-1.5">
                <div className="text-xs font-bold text-amber-900">
                  Lý giải tại sao đạt điểm số trên (Giải trình của Giám khảo):
                </div>
                <p className="text-xs text-gray-800 leading-relaxed italic">
                  "{selectedCandidate.evaluation_data?.score_justification}"
                </p>
              </div>

              {/* Strengths & Weaknesses */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-200">
                  <div className="font-bold text-emerald-900 mb-1">Điểm mạnh nổi bật:</div>
                  <p className="text-gray-700">{selectedCandidate.evaluation_data?.strengths}</p>
                </div>
                <div className="p-3 rounded-xl bg-gray-50 border border-gray-200">
                  <div className="font-bold text-gray-900 mb-1">Điểm cần cải thiện:</div>
                  <p className="text-gray-700">{selectedCandidate.evaluation_data?.weaknesses}</p>
                </div>
              </div>

              {/* Proposals and Decision Status */}
              <div className="p-3.5 rounded-xl border bg-gray-50 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Đề xuất sơ bộ từ Ban chuyên môn:</span>
                  <span>{getProposalBadge(selectedCandidate.evaluation_data?.dept_recommendation)}</span>
                </div>
                <div className="flex items-center justify-between border-t pt-2">
                  <span className="font-bold text-gray-800">Quyết định phê duyệt của Ban Chủ nhiệm:</span>
                  <span>{getDecisionBadge(selectedCandidate.evaluation_data?.bcn_decision || selectedCandidate.candidate_rankings.result)}</span>
                </div>
                {selectedCandidate.evaluation_data?.bcn_note && (
                  <div className="text-[11px] text-gray-500 pt-1">
                    Ghi chú thẩm định BCN: {selectedCandidate.evaluation_data.bcn_note}
                  </div>
                )}
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setSelectedCandidate(null)}>
                Đóng
              </Button>
              {isSuperAdmin && (
                <Button
                  variant="gold"
                  onClick={() => {
                    handleApproveProposal(selectedCandidate.id)
                    setSelectedCandidate(null)
                  }}
                >
                  <Check className="w-4 h-4 mr-1" />
                  Phê duyệt đề xuất này
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>

      {/* CONFIRM PUBLISH DIALOG */}
      <Dialog open={showPublishModal} onOpenChange={setShowPublishModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Crown className="w-5 h-5 text-amber-500" />
              Xác nhận phê duyệt & công bố danh sách TOP {currentQuota}
            </DialogTitle>
            <DialogDescription asChild>
              <div className="space-y-3 pt-2 text-left text-sm text-gray-500">
                <p className="text-gray-700">
                  Ban Chủ nhiệm đang thực hiện thẩm định và chốt danh sách kết quả tuyển chọn chính thức cho Câu lạc bộ iSSAC:
                </p>
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 text-xs space-y-1.5 text-amber-950 font-medium">
                  <div>• Chỉ tiêu tuyển chọn: <strong className="font-bold">{currentQuota} thành viên chính thức</strong></div>
                  <div>• Số ứng viên Pass: <strong className="text-emerald-700 font-bold">{passCount} ứng viên</strong></div>
                  <div>• Số ứng viên Dự bị: <strong className="text-amber-700 font-bold">{waitlistCount} ứng viên</strong></div>
                  <div>• Thẩm quyền phê duyệt: <strong className="text-blue-900 font-bold">Ban Chủ nhiệm iSSAC</strong></div>
                </div>
                <p className="text-[11px] text-gray-500">
                  Sau khi bấm phê chuẩn, hệ thống sẽ chốt danh sách và công bố kết quả tuyển chọn đến tài khoản của toàn bộ ứng viên.
                </p>
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowPublishModal(false)}>
              Hủy
            </Button>
            <Button onClick={handleConfirmPublish} disabled={publishing} variant="gold">
              {publishing ? 'Đang công bố...' : 'Xác nhận công bố ngay'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
