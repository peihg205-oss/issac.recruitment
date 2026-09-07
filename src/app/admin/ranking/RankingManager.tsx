'use client'

import { useState, useMemo } from 'react'
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

  // State
  const [candidates, setCandidates] = useState<RankingCandidate[]>(initialCandidates)
  const [activeTab, setActiveTab] = useState<'general' | 'department'>('general')
  const [selectedDept, setSelectedDept] = useState<string>('truyen-thong')
  const [searchQuery, setSearchQuery] = useState('')
  const [resultFilter, setResultFilter] = useState<'all' | 'pass' | 'waitlist' | 'fail'>('all')

  // BCN Proposal Permission
  const [allowProposals, setAllowProposals] = useState(true)
  const [published, setPublished] = useState(initialPublished)
  const [showPublishModal, setShowPublishModal] = useState(false)
  const [publishing, setPublishing] = useState(false)

  // Selected candidate for detail justification modal
  const [selectedCandidate, setSelectedCandidate] = useState<RankingCandidate | null>(null)

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
    return sortedGeneral.filter(c => {
      const matchSearch =
        c.profiles.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.profiles.student_id && c.profiles.student_id.toLowerCase().includes(searchQuery.toLowerCase())) ||
        c.departments.name.toLowerCase().includes(searchQuery.toLowerCase())

      const decision = c.evaluation_data?.bcn_decision || c.candidate_rankings.result
      const matchResult = resultFilter === 'all' || decision === resultFilter

      return matchSearch && matchResult
    })
  }, [sortedGeneral, searchQuery, resultFilter])

  const currentDeptList = useMemo(() => {
    const list = departmentRankings[selectedDept] || []
    return list.filter(c => {
      const matchSearch =
        c.profiles.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.profiles.student_id && c.profiles.student_id.toLowerCase().includes(searchQuery.toLowerCase()))

      const decision = c.evaluation_data?.bcn_decision || c.candidate_rankings.result
      const matchResult = resultFilter === 'all' || decision === resultFilter

      return matchSearch && matchResult
    })
  }, [departmentRankings, selectedDept, searchQuery, resultFilter])

  // Stats calculation
  const passCount = sortedGeneral.filter(c => (c.evaluation_data?.bcn_decision || c.candidate_rankings.result) === 'pass').length
  const waitlistCount = sortedGeneral.filter(c => (c.evaluation_data?.bcn_decision || c.candidate_rankings.result) === 'waitlist').length
  const failCount = sortedGeneral.filter(c => (c.evaluation_data?.bcn_decision || c.candidate_rankings.result) === 'fail').length

  // BCN Decision handlers
  const handleApproveProposal = (candidateId: string) => {
    setCandidates(prev =>
      prev.map(c => {
        if (c.id === candidateId) {
          const proposed = c.evaluation_data?.dept_recommendation || 'pass'
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

    toast({
      title: 'Đã chấp thuận đề xuất',
      description: 'Quyết định đã được Ban Chủ nhiệm thông qua.',
      variant: 'success'
    } as Parameters<typeof toast>[0])
  }

  const handleChangeDecision = (candidateId: string, decision: 'pass' | 'waitlist' | 'fail') => {
    setCandidates(prev =>
      prev.map(c => {
        if (c.id === candidateId) {
          const isSameAsProposal = c.evaluation_data?.dept_recommendation === decision
          return {
            ...c,
            evaluation_data: {
              ...c.evaluation_data!,
              bcn_decision: decision,
              bcn_approval_status: isSameAsProposal ? 'approved' : 'modified',
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

    toast({
      title: 'Đã cập nhật quyết định BCN',
      description: `Đã chuyển kết quả ứng viên sang ${decision.toUpperCase()}.`,
      variant: 'success'
    } as Parameters<typeof toast>[0])
  }

  const handleBatchApprove = () => {
    setCandidates(prev =>
      prev.map(c => {
        const proposed = c.evaluation_data?.dept_recommendation || c.candidate_rankings.result
        return {
          ...c,
          evaluation_data: {
            ...c.evaluation_data!,
            bcn_decision: proposed,
            bcn_approval_status: 'approved',
            bcn_note: 'Ban Chủ nhiệm chấp thuận theo đề xuất của Ban chuyên môn.',
          },
          candidate_rankings: {
            ...c.candidate_rankings,
            result: proposed,
          }
        }
      })
    )

    toast({
      title: 'Đã phê duyệt toàn bộ đề xuất',
      description: 'Tất cả đề xuất của các Ban chuyên môn đã được Ban Chủ nhiệm chấp thuận.',
      variant: 'success'
    } as Parameters<typeof toast>[0])
  }

  const handleConfirmPublish = () => {
    setPublishing(true)
    setTimeout(() => {
      setPublishing(false)
      setShowPublishModal(false)
      setPublished(true)
      toast({
        title: 'Đã công bố chính thức danh sách trúng tuyển!',
        description: `Danh sách TOP ${quota} Thành viên chính thức CLB iSSAC đã được phê duyệt và công bố.`,
        variant: 'success'
      } as Parameters<typeof toast>[0])
    }, 800)
  }

  const getDecisionBadge = (decision: string) => {
    switch (decision) {
      case 'pass':
        return <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 font-bold whitespace-nowrap">Pass</Badge>
      case 'waitlist':
        return <Badge className="bg-amber-100 text-amber-800 border-amber-300 font-bold whitespace-nowrap">Dự bị</Badge>
      case 'fail':
        return <Badge className="bg-gray-100 text-gray-700 border-gray-300 font-bold whitespace-nowrap">Trượt</Badge>
      default:
        return <Badge variant="outline" className="text-gray-500 font-medium whitespace-nowrap">Chờ duyệt</Badge>
    }
  }

  const getProposalBadge = (proposal?: string) => {
    switch (proposal) {
      case 'pass':
        return (
          <span className="inline-flex items-center px-3 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 whitespace-nowrap">
            Pass
          </span>
        )
      case 'waitlist':
        return (
          <span className="inline-flex items-center px-3 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 whitespace-nowrap">
            Phân vân
          </span>
        )
      case 'fail':
        return (
          <span className="inline-flex items-center px-3 py-0.5 rounded-full text-xs font-bold bg-red-50 text-red-700 border border-red-200 whitespace-nowrap">
            Trượt
          </span>
        )
      default:
        return <span className="text-xs text-gray-400 italic whitespace-nowrap">—</span>
    }
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2.5">
            <Trophy className="w-6 h-6 text-amber-500" />
            Hệ Thống Xếp Hạng & Phê Duyệt Tuyển Thành Viên iSSAC
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {isSuperAdmin ? (
            <>
              {/* Toggle allow proposals */}
              <button
                type="button"
                onClick={() => {
                  setAllowProposals(!allowProposals)
                  toast({
                    title: !allowProposals ? 'Đã cấp quyền đề xuất' : 'Đã thu hồi quyền đề xuất',
                    description: !allowProposals
                      ? 'Các Ban chuyên môn hiện được phép gửi đề xuất Pass / Phân vân / Trượt lên BCN.'
                      : 'Các Ban chuyên môn hiện chỉ được chấm điểm và giải trình lý do.',
                  })
                }}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-colors shadow-sm ${
                  allowProposals
                    ? 'bg-blue-50 text-blue-800 border-blue-300 hover:bg-blue-100'
                    : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
                }`}
              >
                {allowProposals ? <Unlock className="w-3.5 h-3.5 text-blue-600" /> : <Lock className="w-3.5 h-3.5 text-gray-500" />}
                <span>Quyền đề xuất: {allowProposals ? 'Đang cấp cho các Ban' : 'Chỉ BCN quyết định'}</span>
              </button>

              {/* Batch approve button */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleBatchApprove}
                className="h-9 text-xs font-bold text-gray-700 hover:bg-gray-100 border-gray-300 shadow-sm"
              >
                <Check className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                Duyệt tất cả đề xuất hợp lệ
              </Button>

              {/* Finalize button */}
              {published ? (
                <div className="flex items-center gap-1.5 bg-emerald-100 border border-emerald-300 rounded-xl px-4 py-2 text-emerald-900 text-xs font-bold shadow-sm">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Đã công bố TOP {quota} chính thức
                </div>
              ) : (
                <Button
                  onClick={() => setShowPublishModal(true)}
                  variant="gold"
                  className="gap-2 shadow-md font-bold h-9 text-xs"
                >
                  <Crown className="w-4 h-4" />
                  Phê duyệt & Công bố TOP {quota}
                </Button>
              )}
            </>
          ) : null}
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {[
          { label: 'Tổng số ứng viên xếp hạng', value: sortedGeneral.length, color: 'bg-blue-50 border-blue-200', text: 'text-blue-700' },
          { label: `TOP ${quota} Pass`, value: passCount, color: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-700' },
          { label: 'Dự bị', value: waitlistCount, color: 'bg-amber-50 border-amber-200', text: 'text-amber-700' },
          { label: 'Trượt', value: failCount, color: 'bg-gray-50 border-gray-200', text: 'text-gray-600' },
          { label: 'Chỉ tiêu tuyển chọn', value: quota, color: 'bg-purple-50 border-purple-200', text: 'text-purple-700' },
        ].map((s, i) => (
          <Card key={i} className={`${s.color} border shadow-sm`}>
            <CardContent className="py-3 px-4 text-center">
              <div className={`text-2xl font-black ${s.text}`}>{s.value}</div>
              <div className="text-[11px] font-semibold text-gray-600 mt-0.5">{s.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Mode Switcher Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('general')}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
              activeTab === 'general'
                ? 'bg-blue-600 text-white shadow-sm ring-2 ring-blue-300'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Bảng Xếp Hạng Chung (Toàn CLB)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('department')}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
              activeTab === 'department'
                ? 'bg-blue-600 text-white shadow-sm ring-2 ring-blue-300'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Xếp Hạng Theo Từng Ban
          </button>
        </div>

        {/* Search & Filter */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <Input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Tìm theo tên, MSSV..."
              className="pl-8 h-9 text-xs w-48 bg-white"
            />
          </div>
          <select
            value={resultFilter}
            onChange={e => setResultFilter(e.target.value as any)}
            className="h-9 text-xs rounded-xl border border-gray-300 bg-white px-2.5 font-semibold text-gray-700"
          >
            <option value="all">Tất cả kết quả</option>
            <option value="pass">Pass</option>
            <option value="waitlist">Dự bị</option>
            <option value="fail">Trượt</option>
          </select>
        </div>
      </div>

      {/* DEPARTMENT SUB-TABS (Only visible when activeTab === 'department') */}
      {activeTab === 'department' && (
        <div className="flex flex-wrap items-center gap-2.5 bg-gray-50 p-2 rounded-2xl border border-gray-200">
          {DEPT_TABS.map(tab => {
            const Icon = tab.icon
            const isSelected = selectedDept === tab.slug
            const count = departmentRankings[tab.slug]?.length || 0

            return (
              <button
                key={tab.slug}
                type="button"
                onClick={() => setSelectedDept(tab.slug)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  isSelected
                    ? 'bg-white shadow-sm border-2 border-blue-600 text-blue-900'
                    : 'text-gray-600 hover:bg-gray-100 border border-transparent'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.name}</span>
                <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-gray-200 text-gray-700 font-bold">
                  {count}
                </span>
              </button>
            )
          })}
        </div>
      )}

      {/* Pass Banner in General View */}
      {activeTab === 'general' && passCount > 0 && (
        <div className="bg-gradient-to-r from-emerald-700 via-emerald-600 to-teal-700 rounded-2xl px-6 py-4 flex flex-wrap items-center justify-between gap-3 text-white shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <Crown className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <div className="font-black text-base">
                DANH SÁCH TOP {quota} THÀNH VIÊN CHÍNH THỨC ({passCount} Pass)
              </div>
            </div>
          </div>
          <Badge className="bg-white text-emerald-900 font-bold px-3 py-1 shadow-sm">
            CHỈ TIÊU {passCount}/{quota}
          </Badge>
        </div>
      )}

      {/* RANKINGS TABLE */}
      <Card className="shadow-sm overflow-hidden border border-gray-200">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-700 uppercase text-xs border-b font-bold tracking-wider">
                <tr>
                  <th className="py-3.5 px-4 text-center whitespace-nowrap w-16">
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
                  const decision = evalData?.bcn_decision || candidate.candidate_rankings.result
                  const isPass = decision === 'pass'
                  const rankNum = activeTab === 'general' ? i + 1 : (candidate.candidate_rankings.dept_rank || i + 1)
                  const isWithinTop15 = activeTab === 'general' && rankNum <= quota

                  return (
                    <tr
                      key={candidate.id}
                      className={`transition-colors ${
                        isWithinTop15 ? 'bg-emerald-50/40 hover:bg-emerald-50/70' : 'hover:bg-gray-50'
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
                              : isWithinTop15
                              ? 'bg-emerald-100 text-emerald-800 font-bold'
                              : 'bg-gray-100 text-gray-500'
                          }`}
                        >
                          #{rankNum}
                        </div>
                      </td>

                      {/* Candidate Name */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-gray-900">{prof.full_name}</div>
                        <div className="text-xs text-gray-500">{prof.email}</div>
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
                        <div className="inline-flex items-center justify-center gap-2 whitespace-nowrap">
                          {getDecisionBadge(decision)}

                          {/* BCN Decision Select (Only for BCN) */}
                          {isSuperAdmin && (
                            <div className="inline-flex items-center gap-1.5 whitespace-nowrap">
                              <select
                                value={decision}
                                onChange={e => handleChangeDecision(candidate.id, e.target.value as any)}
                                className="text-xs h-7 rounded-lg border border-gray-300 bg-white font-semibold text-gray-700 px-2 whitespace-nowrap shadow-sm"
                              >
                                <option value="pass">Pass</option>
                                <option value="waitlist">Dự bị</option>
                                <option value="fail">Trượt</option>
                              </select>
                            </div>
                          )}
                        </div>
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

              {/* Criteria Scores Breakdown */}
              <div>
                <div className="text-xs font-bold text-gray-800 mb-2">Điểm chi tiết theo 4 tiêu chí phỏng vấn:</div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-lg bg-gray-50 border">
                    <div className="text-gray-500">1. Thái độ & Tác phong Đại sứ:</div>
                    <div className="font-bold text-blue-700 text-sm">
                      {selectedCandidate.evaluation_data?.criteria_scores['crit-1'] || 2.4}/2.5đ
                    </div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-gray-50 border">
                    <div className="text-gray-500">2. Giao tiếp & Thuyết phục:</div>
                    <div className="font-bold text-blue-700 text-sm">
                      {selectedCandidate.evaluation_data?.criteria_scores['crit-2'] || 2.4}/2.5đ
                    </div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-gray-50 border">
                    <div className="text-gray-500">3. Chuyên môn theo Ban:</div>
                    <div className="font-bold text-blue-700 text-sm">
                      {selectedCandidate.evaluation_data?.criteria_scores['crit-3'] || 2.8}/3.0đ
                    </div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-gray-50 border">
                    <div className="text-gray-500">4. Đồng đội & Cam kết:</div>
                    <div className="font-bold text-blue-700 text-sm">
                      {selectedCandidate.evaluation_data?.criteria_scores['crit-4'] || 1.8}/2.0đ
                    </div>
                  </div>
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
              Xác nhận phê duyệt & công bố danh sách TOP {quota}
            </DialogTitle>
            <DialogDescription className="space-y-3 pt-2 text-left">
              <p className="text-gray-700">
                Ban Chủ nhiệm đang thực hiện thẩm định và chốt danh sách kết quả tuyển chọn chính thức cho Câu lạc bộ iSSAC:
              </p>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 text-xs space-y-1.5 text-amber-950 font-medium">
                <div>• Chỉ tiêu tuyển chọn: <strong className="font-bold">{quota} thành viên chính thức</strong></div>
                <div>• Số ứng viên Pass: <strong className="text-emerald-700 font-bold">{passCount} ứng viên</strong></div>
                <div>• Số ứng viên Dự bị: <strong className="text-amber-700 font-bold">{waitlistCount} ứng viên</strong></div>
                <div>• Thẩm quyền phê duyệt: <strong className="text-blue-900 font-bold">Ban Chủ nhiệm iSSAC</strong></div>
              </div>
              <p className="text-[11px] text-gray-500">
                Sau khi bấm phê chuẩn, hệ thống sẽ chốt danh sách và công bố kết quả tuyển chọn đến tài khoản của toàn bộ ứng viên.
              </p>
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
