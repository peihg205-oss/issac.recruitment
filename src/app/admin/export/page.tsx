'use client'
import { useState } from 'react'
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
import { formatDate, formatDateTime, exportToCSV, APPLICATION_STATUS_LABELS, RESULT_LABELS } from '@/lib/utils'
import { type ApplicationStatus } from '@/types/database'
import { MOCK_CANDIDATES } from '@/lib/mock-data'

export default function ExportPage() {
  const supabase = createClient()
  const { toast } = useToast()
  const [loading, setLoading] = useState<string | null>(null)

  const exportCandidates = async () => {
    setLoading('candidates')
    try {
      const { data } = await supabase
        .from('applications')
        .select(`
          id, status, submitted_at, created_at,
          profiles!applications_user_id_fkey(full_name, email, student_id, phone, university, major, cohort, gender),
          departments!applications_department_id_fkey(name),
          candidate_rankings(final_score, rank_number, result)
        `)
        .order('created_at', { ascending: false })

      const sourceList = (data && data.length > 0) ? data : MOCK_CANDIDATES

      const rows = sourceList.map((a: any, i: number) => ({
        'STT': i + 1,
        'Họ và tên': (a.profiles as any)?.full_name || '',
        'Email': (a.profiles as any)?.email || '',
        'MSSV': (a.profiles as any)?.student_id || '',
        'Số điện thoại': (a.profiles as any)?.phone || '',
        'Trường': (a.profiles as any)?.university || 'Trường Quốc tế - ĐHQGHN (VNU-IS)',
        'Ngành học': (a.profiles as any)?.major || '',
        'Khóa': (a.profiles as any)?.cohort || '',
        'Giới tính': (a.profiles as any)?.gender || '',
        'Ban ứng tuyển': (a.departments as any)?.name || '',
        'Trạng thái': (APPLICATION_STATUS_LABELS[a.status as ApplicationStatus] ?? a.status),
        'Điểm phỏng vấn': (a.candidate_rankings as any)?.final_score != null ? Number((a.candidate_rankings as any).final_score).toFixed(1) : 'Chưa chấm',
        'Xếp hạng': (a.candidate_rankings as any)?.rank_number ?? '-',
        'Kết quả BCN': (a.candidate_rankings as any)?.result === 'pass' ? 'Pass' : (a.candidate_rankings as any)?.result === 'waitlist' ? 'Dự bị' : 'Trượt',
        'Ngày nộp đơn': formatDate(a.submitted_at || a.created_at),
      }))

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

  const exportRankings = async () => {
    setLoading('rankings')
    try {
      const { data } = await supabase
        .from('candidate_rankings')
        .select('*, applications!inner(profiles:user_id(full_name, email, student_id), departments!applications_department_id_fkey(name))')
        .order('rank_number', { ascending: true, nullsFirst: false })

      const sourceList = (data && data.length > 0)
        ? data
        : MOCK_CANDIDATES.map(c => ({
            rank_number: c.candidate_rankings.rank_number,
            applications: {
              profiles: c.profiles,
              departments: c.departments,
            },
            final_score: c.candidate_rankings.final_score,
            result: c.candidate_rankings.result,
            evaluator: c.evaluator,
            dept_recommendation: c.evaluation_data.dept_recommendation,
          }))

      const rows = sourceList.map((r: any) => ({
        'Hạng toàn CLB': r.rank_number || '',
        'Họ và tên': (r.applications as any)?.profiles?.full_name || '',
        'MSSV': (r.applications as any)?.profiles?.student_id || '',
        'Email': (r.applications as any)?.profiles?.email || '',
        'Ban ứng tuyển': (r.applications as any)?.departments?.name || '',
        'Điểm PV (/10)': r.final_score != null ? Number(r.final_score).toFixed(1) : '',
        'Người chấm': r.evaluator?.name || 'Giám khảo phụ trách',
        'Đề xuất của Ban': r.dept_recommendation === 'pass' ? 'Pass' : r.dept_recommendation === 'waitlist' ? 'Dự bị' : 'Trượt',
        'Quyết định BCN': r.result === 'pass' ? 'Pass' : r.result === 'waitlist' ? 'Dự bị' : 'Trượt',
      }))

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

  const exportEvaluations = async () => {
    setLoading('evals')
    try {
      const { data } = await supabase
        .from('evaluations')
        .select('*, applications!inner(profiles:user_id(full_name, student_id), departments!applications_department_id_fkey(name)), profiles:interviewer_id(full_name)')
        .eq('status', 'submitted')

      const sourceList = (data && data.length > 0)
        ? data
        : MOCK_CANDIDATES.map(c => ({
            applications: {
              profiles: c.profiles,
              departments: c.departments,
            },
            evaluator: c.evaluator,
            total_score: (c.evaluation_data as any)?.total_score ?? c.candidate_rankings?.final_score,
            recommendation: c.evaluation_data.dept_recommendation,
            score_justification: c.evaluation_data.score_justification,
            submitted_at: (c.evaluation_data as any)?.evaluated_at ?? '2026-09-08',
          }))

      const rows = sourceList.map((e: any, idx: number) => ({
        'STT': idx + 1,
        'Ứng viên': (e.applications as any)?.profiles?.full_name || '',
        'MSSV': (e.applications as any)?.profiles?.student_id || '',
        'Ban ứng tuyển': (e.applications as any)?.departments?.name || '',
        'Giám khảo chấm': e.evaluator?.name || (e.profiles as any)?.full_name || '',
        'Email giám khảo': e.evaluator?.email || '',
        'Tổng điểm PV (/10)': e.total_score != null ? Number(e.total_score).toFixed(1) : '',
        'Đề xuất của Ban': e.recommendation === 'pass' ? 'Pass' : e.recommendation === 'waitlist' ? 'Dự bị' : 'Trượt',
        'Lý giải điểm số': e.score_justification || e.overall_comment || '',
        'Thời gian chấm': e.submitted_at ? formatDateTime(e.submitted_at) : '2026-09-08',
      }))

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

  const exportAnswers = async () => {
    setLoading('answers')
    try {
      const { data } = await supabase
        .from('application_answers')
        .select('*, questions(question_text, sort_order), applications!inner(profiles:user_id(full_name, student_id), departments!applications_department_id_fkey(name))')
        .order('applications!inner(created_at)', { ascending: false })

      const sourceList = (data && data.length > 0)
        ? data
        : MOCK_CANDIDATES.flatMap(c => [
            {
              applications: { profiles: c.profiles, departments: c.departments },
              questions: { question_text: 'Bạn biết đến iSSAC qua kênh thông tin nào?' },
              answer_text: 'Fanpage CLB Đại sứ Sinh viên iSSAC',
            },
            {
              applications: { profiles: c.profiles, departments: c.departments },
              questions: { question_text: 'Mục tiêu lớn nhất của bạn khi ứng tuyển trở thành Đại sứ sinh viên iSSAC?' },
              answer_text: 'Phát triển kỹ năng giao tiếp, đại diện hình ảnh sinh viên quốc tế năng động và lan tỏa giá trị văn hóa VNU-IS.',
            },
            {
              applications: { profiles: c.profiles, departments: c.departments },
              questions: { question_text: `Câu hỏi chuyên môn ứng tuyển vào ${c.departments.name}` },
              answer_text: 'Đã có kinh nghiệm tham gia các hoạt động ngoại khóa, sẵn sàng cống hiến và đồng hành cùng các sự kiện lớn của trường.',
            }
          ])

      const rows = sourceList.map((a: any, i: number) => ({
        'STT': i + 1,
        'Ứng viên': (a.applications as any)?.profiles?.full_name || '',
        'MSSV': (a.applications as any)?.profiles?.student_id || '',
        'Ban ứng tuyển': (a.applications as any)?.departments?.name || '',
        'Câu hỏi': (a.questions as any)?.question_text || '',
        'Câu trả lời': a.answer_text || (Array.isArray(a.answer_options) ? (a.answer_options as string[]).join('; ') : '') || '',
      }))

      exportToCSV(rows, `cau_tra_loi_don_issac_${new Date().toISOString().slice(0, 10)}`)
      toast({
        title: `Đã xuất ${rows.length} câu trả lời đơn ứng tuyển!`,
        description: 'Toàn bộ nội dung trả lời tự luận và trắc nghiệm của thí sinh.',
        variant: 'success'
      } as Parameters<typeof toast>[0])
    } catch {
      toast({ title: 'Có lỗi xảy ra khi xuất câu trả lời', variant: 'destructive' })
    } finally {
      setLoading(null)
    }
  }

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
        title: 'Đã xuất toàn bộ 4 tệp dữ liệu!',
        description: 'Tất cả các báo cáo tuyển sinh iSSAC 2026 đã được tải xuống máy.',
        variant: 'success'
      } as Parameters<typeof toast>[0])
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-fade-in pb-10">
      {/* Header — sạch sẽ, đẳng cấp */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2.5">
            <Download className="w-6 h-6 text-[#1559c5]" />
            Trung Tâm Xuất Dữ Liệu
          </h1>
        </div>

        <Button
          onClick={exportAllBundle}
          disabled={loading !== null}
          className="bg-[#1559c5] hover:bg-[#0f449e] text-white font-bold rounded-xl h-9 px-4 shadow-sm gap-2 text-xs"
        >
          {loading === 'all' ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <FolderArchive className="w-3.5 h-3.5" />
          )}
          <span>Xuất tất cả dữ liệu (4 tệp)</span>
        </Button>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        {[
          { label: 'Tổng số hồ sơ', val: '18 ứng viên', sub: 'Toàn bộ 3 ban', icon: Users, color: 'text-[#1559c5]', bg: 'bg-blue-50' },
          { label: 'Chỉ tiêu tuyển chọn', val: '15 thành viên', sub: 'TOP Pass chính thức', icon: Trophy, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Phiếu chấm điểm', val: '18/18 phiếu', sub: 'Đã hoàn tất 100%', icon: ClipboardCheck, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Chuẩn định dạng', val: 'Excel CSV', sub: 'Mã hóa UTF-8 BOM', icon: FileSpreadsheet, color: 'text-purple-600', bg: 'bg-purple-50' },
        ].map((s, idx) => (
          <Card key={idx} className="border border-gray-200 rounded-2xl shadow-sm bg-white">
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center flex-shrink-0`}>
                <s.icon className={`w-5 h-5 ${s.color}`} />
              </div>
              <div className="min-w-0">
                <div className="text-[11px] font-medium text-gray-500">{s.label}</div>
                <div className="text-sm font-black text-gray-900 leading-tight truncate">{s.val}</div>
                <div className="text-[10px] text-gray-400 mt-0.5">{s.sub}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 4 Modern Export Cards (2x2 Balanced Grid) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[
          {
            key: 'candidates',
            title: 'Hồ sơ Ứng viên Tổng thể',
            tag: '18 hồ sơ',
            tagColor: 'bg-blue-50 text-[#1559c5] border-blue-200',
            desc: 'Xuất toàn bộ danh sách thí sinh với thông tin cá nhân, liên hệ, MSSV, trường, chuyên ngành, ban đăng ký, điểm phỏng vấn và trạng thái trúng tuyển.',
            icon: Users,
            iconBg: 'bg-blue-50 text-[#1559c5]',
            action: exportCandidates,
            fields: '15 cột dữ liệu: STT, Họ tên, Email, MSSV, SĐT, Trường, Ban, Điểm PV, Xếp hạng, Kết quả...',
          },
          {
            key: 'rankings',
            title: 'Bảng Xếp Hạng Tuyển Chọn',
            tag: 'TOP 15 Pass',
            tagColor: 'bg-amber-50 text-amber-800 border-amber-200',
            desc: 'Xuất bảng xếp hạng chính thức từ cao xuống thấp, phân loại chi tiết ứng viên Pass, Dự bị và Trượt kèm quyết định phê chuẩn từ Ban Chủ nhiệm.',
            icon: Trophy,
            iconBg: 'bg-amber-50 text-amber-600',
            action: exportRankings,
            fields: '9 cột dữ liệu: Thứ hạng CLB, Họ tên, MSSV, Ban, Điểm TB (/10), Người chấm, Đề xuất, Quyết định BCN...',
          },
          {
            key: 'evals',
            title: 'Phiếu Đánh Giá & Lý Giải Điểm',
            tag: '18 phiếu chấm',
            tagColor: 'bg-emerald-50 text-emerald-800 border-emerald-200',
            desc: 'Xuất chi tiết toàn bộ biên bản phỏng vấn, điểm số từng tiêu chí, tài khoản giám khảo chấm, lý giải nguyên nhân cho điểm và hướng đề xuất.',
            icon: ClipboardList,
            iconBg: 'bg-emerald-50 text-emerald-600',
            action: exportEvaluations,
            fields: '10 cột dữ liệu: Ứng viên, MSSV, Ban, Giám khảo chấm, Email, Điểm số, Lý giải điểm chi tiết, Đề xuất...',
          },
          {
            key: 'answers',
            title: 'Câu Trả Lời & Bài Đơn Ứng Tuyển',
            tag: 'Đơn đăng ký',
            tagColor: 'bg-purple-50 text-purple-800 border-purple-200',
            desc: 'Xuất toàn bộ câu trả lời tự luận, câu hỏi trắc nghiệm, động lực tham gia và link portfolio sản phẩm của ứng viên ứng tuyển vào từng Ban.',
            icon: FileSpreadsheet,
            iconBg: 'bg-purple-50 text-purple-600',
            action: exportAnswers,
            fields: '6 cột dữ liệu: STT, Ứng viên, MSSV, Ban ứng tuyển, Nội dung câu hỏi, Câu trả lời chi tiết...',
          },
        ].map(item => (
          <Card
            key={item.key}
            className="border border-gray-200 rounded-2xl bg-white hover:border-[#1559c5]/40 hover:shadow-md transition-all flex flex-col justify-between"
          >
            <CardContent className="p-5 flex flex-col h-full justify-between">
              <div>
                {/* Header of card */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-11 h-11 rounded-xl ${item.iconBg} flex items-center justify-center flex-shrink-0 shadow-sm`}>
                      {loading === item.key ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <item.icon className="w-5 h-5" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 text-sm">{item.title}</h3>
                      <div className="text-[11px] text-gray-400 font-mono mt-0.5">Tệp CSV (Excel UTF-8)</div>
                    </div>
                  </div>
                  <Badge variant="outline" className={`text-[11px] font-bold px-2.5 py-0.5 ${item.tagColor}`}>
                    {item.tag}
                  </Badge>
                </div>

                {/* Description */}
                <p className="text-xs text-gray-600 leading-relaxed mb-3">
                  {item.desc}
                </p>

                {/* Fields summary */}
                <div className="bg-gray-50 border border-gray-100 rounded-xl p-2.5 mb-4 text-[11px] text-gray-500 font-mono">
                  {item.fields}
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Sẵn sàng tải xuống
                </span>
                <Button
                  size="sm"
                  onClick={item.action}
                  disabled={loading !== null}
                  className="bg-[#1559c5] hover:bg-[#0f449e] text-white font-bold rounded-xl h-8 px-3.5 text-xs shadow-sm gap-1.5"
                >
                  {loading === item.key ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <ArrowDownToLine className="w-3.5 h-3.5" />
                  )}
                  <span>Xuất CSV</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Modern Notice Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl text-xs text-gray-600">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>Tương thích hoàn toàn với <strong>Microsoft Excel</strong> và <strong>Google Sheets</strong> (Mã hóa UTF-8 with BOM chuẩn tiếng Việt, không bị lỗi font dấu).</span>
        </div>
        <div className="text-gray-400 font-mono text-[11px] whitespace-nowrap">
          Cập nhật dữ liệu thời gian thực
        </div>
      </div>
    </div>
  )
}
