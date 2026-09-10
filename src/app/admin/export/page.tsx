'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/use-toast'
import {
  Download, Users, Trophy, ClipboardList, FileSpreadsheet,
  Loader2, CheckCircle2, FolderArchive, ArrowDownToLine,
  FileCheck, Sparkles, ClipboardCheck
} from 'lucide-react'
import { formatDate, formatDateTime, exportToCSV, APPLICATION_STATUS_LABELS, buildCandidateCodeMap } from '@/lib/utils'
import { getStoredSystemSettings } from '@/lib/system-settings'
import { type ApplicationStatus } from '@/types/database'

export default function ExportPage() {
  const supabase = createClient()
  const { toast } = useToast()
  const [loading, setLoading] = useState<string | null>(null)

  // Real-time statistics state
  const [stats, setStats] = useState({
    totalCandidates: 0,
    totalDepartments: 3,
    quota: 15,
    passCandidates: 0,
    evaluatedCount: 0,
    totalAnswers: 0,
    loading: true,
  })

  const getDynamicQuota = useCallback(() => {
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
            const p = parseInt(parsed.recruitment_quota, 10)
            if (!isNaN(p) && p > 0) return p
          }
        }
      } catch {}
    }
    const s = getStoredSystemSettings()
    if (s.recruitment_quota) {
      const p = parseInt(s.recruitment_quota, 10)
      if (!isNaN(p) && p > 0) return p
    }
    return 15
  }, [])

  const fetchStats = useCallback(async () => {
    try {
      const quotaVal = getDynamicQuota()

      const [
        { count: appCount },
        { count: evalCount },
        { count: answersCount },
        { data: rankingsData },
        { count: deptCount },
        { data: settingsData },
        { data: appsData },
      ] = await Promise.all([
        supabase.from('applications').select('*', { count: 'exact', head: true }),
        supabase.from('evaluations').select('*', { count: 'exact', head: true }),
        supabase.from('application_answers').select('*', { count: 'exact', head: true }),
        supabase.from('candidate_rankings').select('result, final_score, rank_number'),
        supabase.from('departments').select('*', { count: 'exact', head: true }).neq('slug', 'chu-nhiem'),
        supabase.from('system_settings').select('key, value').eq('key', 'recruitment_quota').maybeSingle(),
        supabase.from('applications').select('id, status'),
      ])

      let finalQuota = quotaVal
      if (settingsData && settingsData.value) {
        const p = parseInt(settingsData.value, 10)
        if (!isNaN(p) && p > 0) finalQuota = p
      }

      const totalApps = appCount ?? 0
      
      const approvedFromApps = (appsData || []).filter((a: any) => {
        let st = a.status
        if (typeof window !== 'undefined') {
          const localSt = localStorage.getItem(`issac_app_status_${a.id}`)
          if (localSt) st = localSt
        }
        return st === 'approved' || st === 'finalized'
      }).length

      const passFromRankings = (rankingsData || []).filter((r: any) => r.result === 'pass').length
      const passCount = Math.max(approvedFromApps, passFromRankings)

      setStats({
        totalCandidates: totalApps,
        totalDepartments: deptCount ?? 3,
        quota: finalQuota,
        passCandidates: passCount,
        evaluatedCount: evalCount ?? 0,
        totalAnswers: answersCount ?? 0,
        loading: false,
      })
    } catch (err) {
      console.error('Lỗi tải thống kê xuất dữ liệu:', err)
      setStats(prev => ({ ...prev, loading: false }))
    }
  }, [supabase, getDynamicQuota])

  // Lắng nghe dữ liệu thời gian thực (Real-time) từ Supabase + Local events + BroadcastChannel
  useEffect(() => {
    fetchStats()

    const channel = supabase
      .channel('admin-export-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'applications' }, () => fetchStats())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'evaluations' }, () => fetchStats())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'candidate_rankings' }, () => fetchStats())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'application_answers' }, () => fetchStats())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'system_settings' }, () => fetchStats())
      .subscribe()

    const handleLocalUpdate = () => {
      fetchStats()
    }

    window.addEventListener('issac_system_settings_updated', handleLocalUpdate)
    window.addEventListener('issac_eval_updated', handleLocalUpdate)
    window.addEventListener('issac_candidate_approved', handleLocalUpdate)
    window.addEventListener('issac_results_published', handleLocalUpdate)
    window.addEventListener('storage', handleLocalUpdate)

    let bc: BroadcastChannel | null = null
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      bc = new BroadcastChannel('issac_eval_channel')
      bc.onmessage = () => {
        fetchStats()
      }
    }

    return () => {
      supabase.removeChannel(channel)
      window.removeEventListener('issac_system_settings_updated', handleLocalUpdate)
      window.removeEventListener('issac_eval_updated', handleLocalUpdate)
      window.removeEventListener('issac_candidate_approved', handleLocalUpdate)
      window.removeEventListener('issac_results_published', handleLocalUpdate)
      window.removeEventListener('storage', handleLocalUpdate)
      if (bc) bc.close()
    }
  }, [fetchStats, supabase])

  // 1. XUẤT HỒ SƠ ỨNG VIÊN TỔNG THỂ (DỮ LIỆU THẬT TỪ SUPABASE)
  const exportCandidates = async () => {
    setLoading('candidates')
    try {
      const { data: apps } = await supabase
        .from('applications')
        .select(`
          id, user_id, status, submitted_at, created_at,
          departments!applications_department_id_fkey(name),
          candidate_rankings(final_score, rank_number, result)
        `)
        .order('created_at', { ascending: false })

      if (!apps || apps.length === 0) {
        toast({ title: 'Chưa có dữ liệu', description: 'Hiện tại chưa có hồ sơ ứng viên nào để xuất.', variant: 'destructive' })
        return
      }

      const userIds = Array.from(new Set(apps.map((a: any) => a.user_id).filter(Boolean)))
      let profilesMap: Record<string, any> = {}
      if (userIds.length > 0) {
        const { data: profs } = await supabase
          .from('profiles')
          .select('id, full_name, email, student_id, phone, university, major, cohort, gender, high_school, date_of_birth, address')
          .in('id', userIds)
        if (profs) {
          profs.forEach((p: any) => { profilesMap[p.id] = p })
        }
      }

      const codeMap = buildCandidateCodeMap(apps)

      const rows = apps.map((a: any, i: number) => {
        const p = profilesMap[a.user_id] || {}
        const r = Array.isArray(a.candidate_rankings) ? a.candidate_rankings[0] : a.candidate_rankings
        return {
          'STT': i + 1,
          'Mã hồ sơ': codeMap[a.id] || `ISSAC-${String(i + 1).padStart(2, '0')}`,
          'Họ và tên': p.full_name || '',
          'MSSV': p.student_id || '',
          'Email': p.email || '',
          'Số điện thoại': p.phone || '',
          'Khóa': p.cohort || 'K22',
          'Ngành học': p.major || '',
          'Trường Đại học': p.university || 'Trường Quốc tế - ĐHQGHN',
          'Trường THPT': p.high_school || '',
          'Ngày sinh': p.date_of_birth || '',
          'Giới tính': p.gender || '',
          'Link Facebook': p.address || '',
          'Ban ứng tuyển (NV1)': (a.departments as any)?.name || '',
          'Trạng thái đơn': (APPLICATION_STATUS_LABELS[a.status as ApplicationStatus] ?? a.status),
          'Điểm phỏng vấn (/10)': r?.final_score != null ? Number(r.final_score).toFixed(1) : 'Chưa chấm',
          'Xếp hạng CLB': r?.rank_number ? `#${r.rank_number}` : '-',
          'Kết quả BCN': r?.result === 'pass' ? 'Pass' : r?.result === 'waitlist' ? 'Dự bị' : r?.result === 'fail' ? 'Trượt' : 'Đang xét',
          'Thời gian gửi đơn (Giờ VN)': formatDateTime(a.submitted_at || a.created_at),
        }
      })

      exportToCSV(rows, `danh_sach_ung_vien_issac_${new Date().toISOString().slice(0, 10)}`)
      toast({
        title: `Đã xuất thành công ${rows.length} hồ sơ ứng viên!`,
        description: 'Tệp CSV chuẩn UTF-8 BOM sẵn sàng mở trên Microsoft Excel.',
        variant: 'success'
      } as Parameters<typeof toast>[0])
    } catch {
      toast({ title: 'Có lỗi xảy ra khi xuất dữ liệu', variant: 'destructive' })
    } finally {
      setLoading(null)
    }
  }

  // 2. XUẤT BẢNG XẾP HẠNG TUYỂN CHỌN (DỮ LIỆU THẬT TỪ SUPABASE)
  const exportRankings = async () => {
    setLoading('rankings')
    try {
      const { data: rankings } = await supabase
        .from('candidate_rankings')
        .select(`
          id, rank_number, final_score, result, application_id,
          applications(id, user_id, departments!applications_department_id_fkey(name))
        `)
        .order('final_score', { ascending: false, nullsFirst: false })

      if (!rankings || rankings.length === 0) {
        toast({ title: 'Chưa có dữ liệu', description: 'Hiện tại chưa có bảng xếp hạng nào để xuất.', variant: 'destructive' })
        return
      }

      const userIds = Array.from(new Set(
        rankings.map((r: any) => (r.applications as any)?.user_id).filter(Boolean)
      ))

      let profilesMap: Record<string, any> = {}
      if (userIds.length > 0) {
        const { data: profs } = await supabase
          .from('profiles')
          .select('id, full_name, email, student_id, phone, major, cohort')
          .in('id', userIds)
        if (profs) {
          profs.forEach((p: any) => { profilesMap[p.id] = p })
        }
      }

      const rows = rankings.map((r: any, idx: number) => {
        const app = r.applications as any
        const p = app?.user_id ? profilesMap[app.user_id] : null
        return {
          'Thứ hạng toàn CLB': r.rank_number ? `#${r.rank_number}` : `#${idx + 1}`,
          'Họ và tên': p?.full_name || '',
          'MSSV': p?.student_id || '',
          'Khóa': p?.cohort || 'K22',
          'Ngành học': p?.major || '',
          'Email': p?.email || '',
          'Số điện thoại': p?.phone || '',
          'Ban ứng tuyển': app?.departments?.name || '',
          'Điểm phỏng vấn (/10)': r.final_score != null ? Number(r.final_score).toFixed(1) : '',
          'Quyết định BCN': r.result === 'pass' ? 'Pass (Chính thức)' : r.result === 'waitlist' ? 'Dự bị' : r.result === 'fail' ? 'Trượt' : 'Đang xét',
        }
      })

      exportToCSV(rows, `bang_xep_hang_issac_${new Date().toISOString().slice(0, 10)}`)
      toast({
        title: `Đã xuất bảng xếp hạng (${rows.length} ứng viên)!`,
        description: 'Đã bao gồm điểm số, thứ hạng và quyết định chính thức từ Ban Chủ nhiệm.',
        variant: 'success'
      } as Parameters<typeof toast>[0])
    } catch {
      toast({ title: 'Có lỗi xảy ra khi xuất bảng xếp hạng', variant: 'destructive' })
    } finally {
      setLoading(null)
    }
  }

  // 3. XUẤT PHIẾU ĐÁNH GIÁ & LÝ GIẢI ĐIỂM (DỮ LIỆU THẬT TỪ SUPABASE)
  const exportEvaluations = async () => {
    setLoading('evals')
    try {
      const { data: evals } = await supabase
        .from('evaluations')
        .select(`
          id, total_score, dept_recommendation, score_justification, strengths, weaknesses, submitted_at,
          application_id, interviewer_id,
          applications(user_id, departments!applications_department_id_fkey(name))
        `)
        .order('created_at', { ascending: false })

      if (!evals || evals.length === 0) {
        toast({ title: 'Chưa có dữ liệu', description: 'Hiện tại chưa có phiếu đánh giá nào trong hệ thống.', variant: 'destructive' })
        return
      }

      const candidateUserIds = Array.from(new Set(evals.map((e: any) => (e.applications as any)?.user_id).filter(Boolean)))
      const interviewerIds = Array.from(new Set(evals.map((e: any) => e.interviewer_id).filter(Boolean)))
      const allIds = Array.from(new Set([...candidateUserIds, ...interviewerIds]))

      let profilesMap: Record<string, any> = {}
      if (allIds.length > 0) {
        const { data: profs } = await supabase.from('profiles').select('id, full_name, student_id, email').in('id', allIds)
        if (profs) profs.forEach((p: any) => { profilesMap[p.id] = p })
      }

      const rows = evals.map((e: any, idx: number) => {
        const candidateProfile = (e.applications as any)?.user_id ? profilesMap[(e.applications as any).user_id] : null
        const interviewerProfile = e.interviewer_id ? profilesMap[e.interviewer_id] : null
        return {
          'STT': idx + 1,
          'Ứng viên': candidateProfile?.full_name || '',
          'MSSV': candidateProfile?.student_id || '',
          'Ban ứng tuyển': (e.applications as any)?.departments?.name || '',
          'Giám khảo chấm': interviewerProfile?.full_name || 'Hội đồng phỏng vấn',
          'Email giám khảo': interviewerProfile?.email || '',
          'Tổng điểm phỏng vấn': e.total_score != null ? Number(e.total_score).toFixed(1) : '',
          'Đề xuất của Ban': e.dept_recommendation === 'pass' ? 'Pass' : e.dept_recommendation === 'waitlist' ? 'Dự bị' : e.dept_recommendation === 'fail' ? 'Trượt' : 'Đang đánh giá',
          'Lý giải chi tiết cho điểm': e.score_justification || '',
          'Điểm mạnh nổi bật': e.strengths || '',
          'Điểm cần cải thiện': e.weaknesses || '',
          'Thời gian nộp phiếu': e.submitted_at ? formatDateTime(e.submitted_at) : 'Chưa nộp chính thức',
        }
      })

      exportToCSV(rows, `phieu_danh_gia_pv_issac_${new Date().toISOString().slice(0, 10)}`)
      toast({
        title: `Đã xuất ${rows.length} phiếu đánh giá phỏng vấn!`,
        description: 'Bao gồm đầy đủ tài khoản người chấm, lý giải điểm số và đề xuất.',
        variant: 'success'
      } as Parameters<typeof toast>[0])
    } catch {
      toast({ title: 'Có lỗi xảy ra khi xuất phiếu đánh giá', variant: 'destructive' })
    } finally {
      setLoading(null)
    }
  }

  // 4. XUẤT CÂU TRẢ LỜI & BÀI ĐƠN ỨNG TUYỂN (DỮ LIỆU THẬT TỪ SUPABASE)
  const exportAnswers = async () => {
    setLoading('answers')
    try {
      const { data: answers } = await supabase
        .from('application_answers')
        .select(`
          *,
          questions(question_text, sort_order),
          applications(user_id, departments!applications_department_id_fkey(name))
        `)
        .order('created_at', { ascending: false })

      if (!answers || answers.length === 0) {
        toast({ title: 'Chưa có dữ liệu', description: 'Hiện tại chưa có câu trả lời phỏng vấn nào.', variant: 'destructive' })
        return
      }

      const userIds = Array.from(new Set(answers.map((a: any) => (a.applications as any)?.user_id).filter(Boolean)))
      let profilesMap: Record<string, any> = {}
      if (userIds.length > 0) {
        const { data: profs } = await supabase.from('profiles').select('id, full_name, student_id').in('id', userIds)
        if (profs) profs.forEach((p: any) => { profilesMap[p.id] = p })
      }

      const rows = answers.map((a: any, i: number) => {
        const app = a.applications as any
        const p = app?.user_id ? profilesMap[app.user_id] : null
        return {
          'STT': i + 1,
          'Ứng viên': p?.full_name || '',
          'MSSV': p?.student_id || '',
          'Ban ứng tuyển': app?.departments?.name || '',
          'Nội dung câu hỏi': (a.questions as any)?.question_text || 'Câu hỏi chuyên môn',
          'Câu trả lời chi tiết': a.answer_text || (Array.isArray(a.answer_options) ? a.answer_options.join(', ') : ''),
          'Đường dẫn file đính kèm / Portfolio': a.file_url || '',
        }
      })

      exportToCSV(rows, `cau_tra_loi_ung_vien_issac_${new Date().toISOString().slice(0, 10)}`)
      toast({
        title: `Đã xuất ${rows.length} câu trả lời đơn ứng tuyển!`,
        description: 'Tệp CSV gồm đầy đủ câu trả lời phỏng vấn theo từng ban chuyên môn.',
        variant: 'success'
      } as Parameters<typeof toast>[0])
    } catch {
      toast({ title: 'Có lỗi xảy ra khi xuất câu trả lời', variant: 'destructive' })
    } finally {
      setLoading(null)
    }
  }

  // Xuất trọn bộ 4 tệp cùng lúc
  const exportAllBundle = async () => {
    setLoading('all')
    try {
      await exportCandidates()
      await new Promise(r => setTimeout(r, 400))
      await exportRankings()
      await new Promise(r => setTimeout(r, 400))
      await exportEvaluations()
      await new Promise(r => setTimeout(r, 400))
      await exportAnswers()
      toast({
        title: '✅ Đã xuất toàn bộ 4 tệp dữ liệu!',
        description: 'Tất cả các báo cáo tuyển quân iSSAC 2026 đã được tải xuống máy.',
        variant: 'success'
      } as Parameters<typeof toast>[0])
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-fade-in pb-12 font-sans">
      {/* Header — Hiện đại, chuyên nghiệp */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 flex items-center gap-3 tracking-tight">
            <Download className="w-7 h-7 text-[#1559c5]" />
            Trung Tâm Xuất Dữ Liệu
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
            Trích xuất dữ liệu hồ sơ, điểm số và bảng xếp hạng chuẩn Microsoft Excel & Google Sheets (Real-time)
          </p>
        </div>

        <Button
          onClick={exportAllBundle}
          disabled={loading !== null}
          className="bg-[#1559c5] hover:bg-[#0f449e] text-white font-bold rounded-2xl h-10 px-5 shadow-sm gap-2 text-xs sm:text-sm cursor-pointer"
        >
          {loading === 'all' ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <FolderArchive className="w-4 h-4" />
          )}
          <span>Xuất tất cả dữ liệu (4 tệp)</span>
        </Button>
      </div>

      {/* KPI Overview Cards — DỮ LIỆU THẬT TỪ SUPABASE ĐỒNG BỘ REAL-TIME */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        {[
          {
            label: 'Tổng số hồ sơ',
            val: stats.loading ? 'Đang tải...' : `${stats.totalCandidates} ứng viên`,
            sub: `Toàn bộ ${stats.totalDepartments} ban`,
            icon: Users,
            color: 'text-[#1559c5]',
            bg: 'bg-blue-50'
          },
          {
            label: 'Chỉ tiêu tuyển chọn',
            val: stats.loading ? 'Đang tải...' : `${stats.quota} thành viên`,
            sub: `${stats.passCandidates} ứng viên Pass chính thức`,
            icon: Trophy,
            color: 'text-amber-600',
            bg: 'bg-amber-50'
          },
          {
            label: 'Phiếu chấm điểm',
            val: stats.loading ? 'Đang tải...' : `${stats.evaluatedCount} phiếu`,
            sub: stats.totalCandidates > 0
              ? `${Math.min(100, Math.round((stats.evaluatedCount / stats.totalCandidates) * 100))}% đã đánh giá`
              : 'Chưa có đơn nộp',
            icon: ClipboardCheck,
            color: 'text-emerald-600',
            bg: 'bg-emerald-50'
          },
          {
            label: 'Chuẩn định dạng',
            val: 'Excel CSV',
            sub: 'Mã hóa UTF-8 BOM',
            icon: FileSpreadsheet,
            color: 'text-purple-600',
            bg: 'bg-purple-50'
          },
        ].map((s, idx) => (
          <Card key={idx} className="border border-slate-200/90 rounded-2xl shadow-2xs bg-white">
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`w-11 h-11 rounded-xl ${s.bg} flex items-center justify-center shrink-0`}>
                <s.icon className={`w-5 h-5 ${s.color}`} />
              </div>
              <div className="min-w-0">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{s.label}</div>
                <div className="text-base sm:text-lg font-black text-slate-900 leading-tight truncate mt-0.5">{s.val}</div>
                <div className="text-[10px] text-slate-500 font-medium mt-0.5 truncate">{s.sub}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 4 Thematic Export Cards (2x2 Grid) — Exact style of Image 2 (Blue & Gold dual-tone) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {[
          {
            key: 'candidates',
            tag: 'HỒ SƠ ỨNG VIÊN',
            subtext: `${stats.totalCandidates} hồ sơ`,
            title: 'Hồ sơ Ứng viên Tổng thể',
            desc: 'Danh sách toàn bộ ứng viên kèm thông tin cá nhân, liên hệ, ban NV1, điểm số phỏng vấn và trạng thái xét duyệt.',
            action: exportCandidates,
            theme: 'blue',
          },
          {
            key: 'rankings',
            tag: 'BẢNG XẾP HẠNG',
            subtext: `Chỉ tiêu ${stats.quota} (${stats.passCandidates} Pass)`,
            title: 'Bảng Xếp Hạng Tuyển Chọn',
            desc: 'Xếp hạng điểm phỏng vấn toàn CLB từ cao xuống thấp, phân loại chi tiết Pass, Dự bị và Trượt theo quyết định BCN.',
            action: exportRankings,
            theme: 'gold',
          },
          {
            key: 'evals',
            tag: 'ĐÁNH GIÁ PHỎNG VẤN',
            subtext: `${stats.evaluatedCount} phiếu chấm`,
            title: 'Phiếu Đánh Giá & Lý Giải Điểm',
            desc: 'Biên bản phỏng vấn chi tiết, điểm số từng tiêu chí, tài khoản giám khảo chấm và nhận xét điểm mạnh, điểm cần cải thiện.',
            action: exportEvaluations,
            theme: 'blue',
          },
          {
            key: 'answers',
            tag: 'ĐƠN & CÂU HỎI',
            subtext: `${stats.totalAnswers} câu trả lời`,
            title: 'Câu Trả Lời & Bài Đơn Ứng Tuyển',
            desc: 'Tổng hợp câu trả lời tự luận, câu hỏi trắc nghiệm chuyên môn từng Ban và đường dẫn portfolio sản phẩm ứng viên.',
            action: exportAnswers,
            theme: 'gold',
          },
        ].map(item => {
          const isBlue = item.theme === 'blue'
          return (
            <div
              key={item.key}
              className={`rounded-2xl p-6 transition-all flex flex-col justify-between shadow-2xs hover:shadow-md ${
                isBlue
                  ? 'border-2 border-[#1657c1] bg-white'
                  : 'border-2 border-[#fdc455] bg-[#fffdf5]'
              }`}
            >
              <div>
                {/* Header Tag & Subtext */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span
                    className={`text-xs font-black uppercase tracking-wider px-3 py-1 rounded-md inline-flex items-center ${
                      isBlue
                        ? 'bg-[#1657c1] text-white'
                        : 'bg-[#fdc455] text-amber-950'
                    }`}
                  >
                    {item.tag}
                  </span>
                  <span
                    className={`text-xs font-bold ${
                      isBlue ? 'text-[#1657c1]' : 'text-amber-800'
                    }`}
                  >
                    {item.subtext}
                  </span>
                </div>

                {/* Heading */}
                <h3 className="font-bold text-gray-900 text-lg mb-2">
                  {item.title}
                </h3>

                {/* Description */}
                <p className="text-sm text-slate-600 leading-relaxed">
                  {item.desc}
                </p>
              </div>

              {/* Action Footer */}
              <div className="pt-4 mt-6 border-t border-slate-200/70 flex items-center justify-between">
                <span className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Sẵn sàng kết xuất
                </span>
                <Button
                  size="sm"
                  onClick={item.action}
                  disabled={loading !== null}
                  className={`font-bold rounded-xl h-9 px-4 text-xs shadow-xs gap-1.5 cursor-pointer transition-all ${
                    isBlue
                      ? 'bg-[#1657c1] hover:bg-[#11469e] text-white'
                      : 'bg-[#fdc455] hover:bg-[#f5b83d] text-amber-950'
                  }`}
                >
                  {loading === item.key ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <ArrowDownToLine className="w-3.5 h-3.5" />
                  )}
                  <span>Xuất tệp CSV</span>
                </Button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Modern Notice Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-600">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Tương thích hoàn toàn với <strong>Microsoft Excel</strong> và <strong>Google Sheets</strong> (Mã hóa UTF-8 with BOM chuẩn tiếng Việt, không bị lỗi font dấu).</span>
        </div>
        <div className="text-slate-500 font-mono text-[11px] font-semibold whitespace-nowrap">
          Đồng bộ thời gian thực từ Supabase
        </div>
      </div>
    </div>
  )
}
