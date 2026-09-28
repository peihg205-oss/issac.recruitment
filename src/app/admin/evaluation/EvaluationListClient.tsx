'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  ClipboardList, CheckCircle, Clock, BarChart3, Eye,
  UserCheck, Trophy, Crown, Megaphone, MessageSquare, Users
} from 'lucide-react'
import Link from 'next/link'
import { EVALUATOR_ACCOUNTS, type AdminRoleType } from '@/lib/permissions'
import { getAdminAccounts } from '@/lib/admin-account-manager'

interface Props {
  initialApps: any[]
  roleConfig: any
  activeRole: AdminRoleType
  isSuperAdmin: boolean
}

export default function EvaluationListClient({
  initialApps,
  roleConfig,
  activeRole,
  isSuperAdmin,
}: Props) {
  const [apps, setApps] = useState<any[]>(initialApps)
  const [currentQuota, setCurrentQuota] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('issac_system_settings')
        if (saved) {
          const parsed = JSON.parse(saved)
          if (parsed.recruitment_quota) return parseInt(parsed.recruitment_quota, 10) || 15
        }
      } catch {}
    }
    return 15
  })

  const refreshApps = useCallback(async () => {
    try {
      const supabase = createClient()
      const { data: rawApps } = await supabase
        .from('applications')
        .select(`
          id, user_id, department_id, status, submitted_at, created_at,
          departments!applications_department_id_fkey(name, slug),
          evaluations(id, status, total_score, interviewer_id, overall_comment, strengths, weaknesses, recommendation, submitted_at),
          candidate_rankings(rank_number, final_score, result)
        `)
        .neq('status', 'draft')
        .order('created_at', { ascending: false })

      if (rawApps && rawApps.length > 0) {
        const candidateUserIds = Array.from(new Set(rawApps.map((a: any) => a.user_id).filter(Boolean)))
        const interviewerIds = Array.from(new Set(
          rawApps.map((a: any) => {
            const ev = Array.isArray(a.evaluations) ? a.evaluations[0] : a.evaluations
            return ev?.interviewer_id
          }).filter(Boolean)
        ))
        const allUserIds = Array.from(new Set([...candidateUserIds, ...interviewerIds]))

        let profilesMap: Record<string, any> = {}
        if (allUserIds.length > 0) {
          const { data: profs } = await supabase
            .from('profiles')
            .select('id, full_name, email, student_id, phone')
            .in('id', allUserIds)
          if (profs) {
            profs.forEach((p: any) => { profilesMap[p.id] = p })
          }
        }

        const accounts = getAdminAccounts()

        const mapped = rawApps.map((a: any) => {
          const ev = Array.isArray(a.evaluations) ? a.evaluations[0] : a.evaluations
          const candidateProfile = profilesMap[a.user_id] || { full_name: 'Ứng viên', email: '', student_id: '' }
          const interviewerProfile = ev?.interviewer_id ? profilesMap[ev.interviewer_id] : null

          let parsedGrader: any = null
          let parsedBcnReviewer: any = null
          if (ev?.overall_comment && typeof ev.overall_comment === 'string' && ev.overall_comment.startsWith('{')) {
            try {
              const pc = JSON.parse(ev.overall_comment)
              if (pc.grader) parsedGrader = pc.grader
              if (pc.bcnReviewer) parsedBcnReviewer = pc.bcnReviewer
            } catch {}
          }

          // Check cached scores in localStorage as well
          if (typeof window !== 'undefined') {
            try {
              const cached = localStorage.getItem(`eval_scores_${a.id}`)
              if (cached) {
                const parsed = JSON.parse(cached)
                if (!parsedGrader && parsed.evaluator) {
                  parsedGrader = typeof parsed.evaluator === 'string'
                    ? { name: parsed.evaluator }
                    : parsed.evaluator
                }
                if (!parsedBcnReviewer && parsed.bcnReviewer) {
                  parsedBcnReviewer = parsed.bcnReviewer
                }
              }
            } catch {}
          }

          const deptSlug = (a.departments?.slug || 'truyen-thong') as AdminRoleType
          const defaultDeptEvaluator = accounts[deptSlug] || EVALUATOR_ACCOUNTS[deptSlug] || EVALUATOR_ACCOUNTS['truyen-thong']

          const hasScore = (ev?.total_score != null) ||
            (Array.isArray(a.candidate_rankings) && a.candidate_rankings[0]?.final_score != null) ||
            (a.candidate_rankings?.final_score != null)

          const evaluator = parsedGrader || (interviewerProfile ? {
            name: interviewerProfile.full_name,
            email: interviewerProfile.email,
          } : (hasScore ? {
            name: defaultDeptEvaluator.name,
            email: defaultDeptEvaluator.email,
          } : null))

          return {
            ...a,
            profiles: candidateProfile,
            candidate_rankings: Array.isArray(a.candidate_rankings) ? a.candidate_rankings[0] : a.candidate_rankings,
            evaluation_data: ev ? {
              dept_recommendation: ev.recommendation,
              bcn_decision: (a.candidate_rankings as any)?.result || 'pending',
              bcn_note: ev.overall_comment,
            } : null,
            evaluator,
            bcnReviewer: parsedBcnReviewer
          }
        })
        setApps(mapped)
      }
    } catch (err) {
      console.warn('Real-time evaluation list refresh:', err)
    }
  }, [])

  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel('evaluation-list-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'evaluations' }, () => {
        refreshApps()
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'candidate_rankings' }, () => {
        refreshApps()
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'applications' }, () => {
        refreshApps()
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'system_settings' }, async () => {
        try {
          const { data: s } = await supabase.from('system_settings').select('key, value').eq('key', 'recruitment_quota').maybeSingle()
          if (s?.value) setCurrentQuota(parseInt(s.value, 10))
        } catch {}
      })
      .subscribe()

    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'issac_last_eval_update' || (e.key && e.key.startsWith('eval_scores_')) || (e.key && e.key.startsWith('eval_submitted_'))) {
        refreshApps()
      }
      if (e.key === 'issac_system_settings' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue)
          if (parsed.recruitment_quota) setCurrentQuota(parseInt(parsed.recruitment_quota, 10))
        } catch {}
      }
    }

    const handleCustom = () => {
      refreshApps()
    }

    const handleSettingsUpdated = (e: any) => {
      const q = e.detail?.recruitment_quota
      if (q) setCurrentQuota(parseInt(q, 10))
    }

    let bc: BroadcastChannel | null = null
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      bc = new BroadcastChannel('issac_eval_channel')
      bc.onmessage = (event) => {
        if (event.data?.type === 'settings_updated' && event.data.values?.recruitment_quota) {
          setCurrentQuota(parseInt(event.data.values.recruitment_quota, 10))
        }
        refreshApps()
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
  }, [refreshApps])

  const scored = apps.filter(a => {
    const final = (a.candidate_rankings as any)?.final_score
    return final != null
  }).length

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto">
      {/* Header - Clean, Sleek */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-950 flex items-center gap-2.5">
            <ClipboardList className="w-6 h-6 text-[#1559c5]" />
            Hội Đồng Đánh Giá & Chấm Điểm Phỏng Vấn
          </h1>
        </div>
        <div className="flex items-center gap-2.5">
          <span className="px-3.5 py-1.5 text-xs font-bold bg-[#fff7e8] text-amber-950 border border-amber-300 rounded-full shadow-sm flex items-center gap-1.5">
            {activeRole === "chu-nhiem" && <Crown className="w-3.5 h-3.5 text-amber-600 shrink-0" />}
            {activeRole === "truyen-thong" && <Megaphone className="w-3.5 h-3.5 text-blue-600 shrink-0" />}
            {activeRole === "tu-van" && <MessageSquare className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
            {activeRole === "nhan-su" && <Users className="w-3.5 h-3.5 text-purple-600 shrink-0" />}
            <span>{roleConfig.label}</span>
            <span className="text-amber-700 font-medium">({roleConfig.shortLabel})</span>
          </span>
          <Link href="/admin/ranking">
            <Button variant="outline" size="sm" className="h-9 text-xs font-bold text-[#1559c5] border-[#1559c5]/30 hover:bg-blue-50 rounded-full px-4 shadow-sm">
              <Trophy className="w-3.5 h-3.5 mr-1.5 text-amber-500" /> Bảng xếp hạng
            </Button>
          </Link>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Ứng viên phân công', value: apps.length, icon: ClipboardList, color: 'bg-blue-50/70 border-blue-200', text: 'text-[#1559c5]' },
          { label: 'Đã hoàn tất chấm điểm', value: scored, icon: CheckCircle, color: 'bg-emerald-50/70 border-emerald-200', text: 'text-emerald-700' },
          { label: 'Chờ phỏng vấn & chấm', value: Math.max(0, apps.length - scored), icon: Clock, color: 'bg-amber-50/70 border-amber-200', text: 'text-amber-700' },
          { label: 'Chỉ tiêu tuyển chọn', value: currentQuota, icon: BarChart3, color: 'bg-purple-50/70 border-purple-200', text: 'text-purple-700' },
        ].map((s, i) => (
          <Card key={i} className={`shadow-sm border rounded-2xl ${s.color}`}>
            <CardContent className="p-4 flex items-center gap-3.5">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm flex-shrink-0">
                <s.icon className={`w-5 h-5 ${s.text}`} />
              </div>
              <div>
                <div className="text-xs text-gray-600 font-medium">{s.label}</div>
                <div className={`text-2xl font-black ${s.text}`}>{s.value}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Table */}
      <Card className="shadow-sm overflow-hidden rounded-2xl border border-gray-200 bg-white">
        <CardHeader className="border-b bg-gray-50/60 py-4 px-6 flex flex-row items-center justify-between">
          <CardTitle className="text-base font-bold text-gray-950">
            Danh sách hồ sơ phỏng vấn ({apps.length} ứng viên)
          </CardTitle>
          <span className="text-xs text-gray-500 font-medium">
            {isSuperAdmin ? 'Hiển thị tất cả 3 ban (Ban Chủ nhiệm có quyền all)' : `Chỉ có quyền chấm ứng viên thuộc ${roleConfig.shortLabel}`}
          </span>
        </CardHeader>
        <CardContent className="p-0">
          {apps.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-semibold text-gray-700">Chưa có ứng viên nào cần chấm điểm.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-gray-600 uppercase text-xs border-b">
                  <tr>
                    <th className="py-3.5 px-4 text-center w-12 whitespace-nowrap">#</th>
                    <th className="py-3.5 px-4 whitespace-nowrap">Ứng viên</th>
                    <th className="py-3.5 px-4 hidden md:table-cell whitespace-nowrap">MSSV</th>
                    <th className="py-3.5 px-4 whitespace-nowrap">Ban</th>
                    <th className="py-3.5 px-4 text-center whitespace-nowrap">Điểm PV (/10)</th>
                    <th className="py-3.5 px-4 whitespace-nowrap">Tài khoản Người chấm</th>
                    <th className="py-3.5 px-4 text-center whitespace-nowrap">Đề xuất của Ban</th>
                    <th className="py-3.5 px-4 text-center whitespace-nowrap">Quyết định BCN</th>
                    <th className="py-3.5 px-4 text-right whitespace-nowrap">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {apps.map((app: any, i) => {
                    const prof = app.profiles
                    const dept = app.departments
                    const ranking = app.candidate_rankings
                    const evalData = app.evaluation_data
                    const evaluator = app.evaluator

                    return (
                      <tr key={app.id} className="hover:bg-blue-50/30 transition-colors">
                        <td className="py-3.5 px-4 text-center text-xs text-gray-400 font-bold">{i + 1}</td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="font-bold text-gray-900">{prof?.full_name || '—'}</div>
                          <div className="text-xs text-gray-500">{prof?.email}</div>
                        </td>
                        <td className="py-3.5 px-4 text-xs text-gray-600 font-medium hidden md:table-cell whitespace-nowrap">
                          {prof?.student_id || '—'}
                        </td>

                        {/* Ban: single line badge */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-[#1559c5] border border-blue-200 whitespace-nowrap">
                            {dept?.name || '—'}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          <span className={`font-black text-sm ${ranking?.final_score != null ? 'text-[#1559c5]' : 'text-gray-300'}`}>
                            {ranking?.final_score != null ? Number(ranking.final_score).toFixed(1) : '—'}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {evaluator ? (
                            <div className="text-xs space-y-1">
                              <div>
                                <div className="font-bold text-gray-900 flex items-center gap-1">
                                  <UserCheck className="w-3.5 h-3.5 text-[#1559c5] flex-shrink-0" />
                                  <span>{evaluator.name}</span>
                                </div>
                                {evaluator.title && (
                                  <div className="text-[11px] text-slate-500 font-medium">
                                    {evaluator.title}
                                  </div>
                                )}
                              </div>
                              {app.bcnReviewer && (
                                <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 border border-amber-300 text-amber-950 text-[10px] font-bold shadow-2xs">
                                  <Crown className="w-3 h-3 text-amber-600 shrink-0" />
                                  <span>BCN: {app.bcnReviewer.name}</span>
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400 italic">Chưa chấm</span>
                          )}
                        </td>

                        {/* Đề xuất của Ban */}
                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          {evalData?.dept_recommendation === 'pass' ? (
                            <span className="inline-flex items-center px-3 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 whitespace-nowrap">
                              Pass
                            </span>
                          ) : evalData?.dept_recommendation === 'waitlist' ? (
                            <span className="inline-flex items-center px-3 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 whitespace-nowrap">
                              Phân vân
                            </span>
                          ) : evalData?.dept_recommendation === 'fail' ? (
                            <span className="inline-flex items-center px-3 py-0.5 rounded-full text-xs font-bold bg-red-50 text-red-700 border border-red-200 whitespace-nowrap">
                              Trượt
                            </span>
                          ) : (
                            <span className="text-xs text-gray-400 italic">—</span>
                          )}
                        </td>

                        {/* Quyết định BCN */}
                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          {evalData?.bcn_decision === 'pass' ? (
                            <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 text-xs font-bold whitespace-nowrap">
                              Pass
                            </Badge>
                          ) : evalData?.bcn_decision === 'waitlist' ? (
                            <Badge className="bg-amber-100 text-amber-800 border-amber-300 text-xs font-bold whitespace-nowrap">
                              Dự bị
                            </Badge>
                          ) : evalData?.bcn_decision === 'fail' ? (
                            <Badge className="bg-gray-100 text-gray-700 border-gray-300 text-xs font-bold whitespace-nowrap">
                              Trượt
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-gray-400 text-xs whitespace-nowrap">
                              Chờ duyệt
                            </Badge>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <Link href={`/admin/candidates/${app.id}`}>
                              <Button variant="ghost" size="sm" className="h-8 text-xs text-gray-600 hover:bg-gray-100 rounded-lg">
                                <Eye className="w-3.5 h-3.5 mr-1" /> Hồ sơ
                              </Button>
                            </Link>
                            {(() => {
                              const canGradeApp = isSuperAdmin || (app.departments as any)?.slug === activeRole
                              return canGradeApp ? (
                                <Link href={`/admin/evaluation/${app.id}`}>
                                  <Button size="sm" className="h-8 text-xs font-bold bg-[#1559c5] hover:bg-[#0f449e] text-white rounded-lg shadow-sm">
                                    <ClipboardList className="w-3.5 h-3.5 mr-1" /> {isSuperAdmin ? 'Chấm / Thẩm định' : 'Chấm điểm'}
                                  </Button>
                                </Link>
                              ) : (
                                <Link href={`/admin/evaluation/${app.id}`}>
                                  <Button variant="outline" size="sm" className="h-8 text-xs font-semibold text-gray-600 hover:text-[#1559c5] hover:bg-blue-50/50 rounded-lg border-gray-200 shadow-sm">
                                    <Eye className="w-3.5 h-3.5 mr-1 text-gray-400" /> Xem điểm
                                  </Button>
                                </Link>
                              )
                            })()}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
