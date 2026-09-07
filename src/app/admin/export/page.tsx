'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/components/ui/use-toast'
import { Download, FileSpreadsheet, Loader2, BarChart3, Users, Trophy, ClipboardList } from 'lucide-react'
import { exportToCSV, formatDate, formatDateTime, APPLICATION_STATUS_LABELS, RESULT_LABELS } from '@/lib/utils'
import { type ApplicationStatus } from '@/types/database'

export default function ExportPage() {
  const supabase = createClient()
  const { toast } = useToast()
  const [loading, setLoading] = useState<string | null>(null)

  const exportCandidates = async () => {
    setLoading('candidates')
    const { data } = await supabase
      .from('applications')
      .select('*, profiles:user_id(full_name, email, student_id, phone, university, major, cohort, gender), departments!applications_department_id_fkey(name), candidate_rankings(final_score, rank_number, result)')
      .order('created_at', { ascending: false })

    const rows = (data || []).map((a, i) => ({
      'STT': i + 1,
      'Họ tên': (a.profiles as any)?.full_name || '',
      'Email': (a.profiles as any)?.email || '',
      'MSSV': (a.profiles as any)?.student_id || '',
      'SĐT': (a.profiles as any)?.phone || '',
      'Trường': (a.profiles as any)?.university || '',
      'Ngành': (a.profiles as any)?.major || '',
      'Khóa': (a.profiles as any)?.cohort || '',
      'Giới tính': (a.profiles as any)?.gender || '',
      'Ban đăng ký': (a.departments as any)?.name || '',
      'Trạng thái': (APPLICATION_STATUS_LABELS[a.status as ApplicationStatus] ?? a.status),
      'Ngày nộp đơn': formatDate(a.submitted_at),
      'Điểm': (a.candidate_rankings as any)?.final_score ?? '',
      'Xếp hạng': (a.candidate_rankings as any)?.rank_number ?? '',
      'Kết quả': RESULT_LABELS[(a.candidate_rankings as any)?.result] || '',
    }))
    exportToCSV(rows, 'danh_sach_ung_vien')
    toast({ title: `✅ Đã xuất ${rows.length} ứng viên!` } as Parameters<typeof toast>[0])
    setLoading(null)
  }

  const exportRankings = async () => {
    setLoading('rankings')
    const { data } = await supabase
      .from('candidate_rankings')
      .select('*, applications!inner(profiles:user_id(full_name, email, student_id), departments!applications_department_id_fkey(name))')
      .order('rank_number', { ascending: true, nullsFirst: false })

    const rows = (data || []).map(r => ({
      'Hạng': r.rank_number || '',
      'Họ tên': (r.applications as any)?.profiles?.full_name || '',
      'Email': (r.applications as any)?.profiles?.email || '',
      'MSSV': (r.applications as any)?.profiles?.student_id || '',
      'Ban': (r.applications as any)?.departments?.name || '',
      'Điểm': r.final_score != null ? Number(r.final_score).toFixed(2) : '',
      'Kết quả': RESULT_LABELS[r.result] || r.result,
      'Tình trạng': r.is_tie ? 'Tie (cần xử lý)' : 'OK',
    }))
    exportToCSV(rows, 'bang_xep_hang')
    toast({ title: `✅ Đã xuất bảng xếp hạng!` } as Parameters<typeof toast>[0])
    setLoading(null)
  }

  const exportEvaluations = async () => {
    setLoading('evals')
    const { data } = await supabase
      .from('evaluations')
      .select('*, applications!inner(profiles:user_id(full_name, student_id), departments!applications_department_id_fkey(name)), profiles:interviewer_id(full_name)')
      .eq('status', 'submitted')

    const rows = (data || []).map(e => ({
      'Ứng viên': (e.applications as any)?.profiles?.full_name || '',
      'MSSV': (e.applications as any)?.profiles?.student_id || '',
      'Ban': (e.applications as any)?.departments?.name || '',
      'Người chấm': (e.profiles as any)?.full_name || '',
      'Tổng điểm': e.total_score != null ? Number(e.total_score).toFixed(2) : '',
      'Đề xuất': e.recommendation ? RESULT_LABELS[e.recommendation] || e.recommendation : '',
      'Điểm mạnh': e.strengths || '',
      'Cần cải thiện': e.weaknesses || '',
      'Nhận xét': e.overall_comment || '',
      'Ngày gửi': formatDateTime(e.submitted_at),
    }))
    exportToCSV(rows, 'phieu_danh_gia')
    toast({ title: `✅ Đã xuất ${rows.length} phiếu đánh giá!` } as Parameters<typeof toast>[0])
    setLoading(null)
  }

  const exportAnswers = async () => {
    setLoading('answers')
    const { data } = await supabase
      .from('application_answers')
      .select('*, questions(question_text, sort_order), applications!inner(profiles:user_id(full_name, student_id), departments!applications_department_id_fkey(name))')
      .order('applications!inner(created_at)', { ascending: false })

    const rows = (data || []).map(a => ({
      'Ứng viên': (a.applications as any)?.profiles?.full_name || '',
      'MSSV': (a.applications as any)?.profiles?.student_id || '',
      'Ban': (a.applications as any)?.departments?.name || '',
      'Câu hỏi': (a.questions as any)?.question_text || '',
      'Trả lời': a.answer_text || (Array.isArray(a.answer_options) ? (a.answer_options as string[]).join('; ') : '') || '',
    }))
    exportToCSV(rows, 'cau_tra_loi')
    toast({ title: `✅ Đã xuất ${rows.length} câu trả lời!` } as Parameters<typeof toast>[0])
    setLoading(null)
  }

  return (
    <div className="space-y-6 max-w-4xl animate-fade-in">
      <div>
        <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
          <Download className="w-6 h-6 text-blue-600" />
          Xuất dữ liệu
        </h1>
        <p className="text-gray-500 text-sm mt-1">Xuất dữ liệu tuyển dụng ra file CSV</p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {[
          {
            key: 'candidates',
            title: 'Danh sách ứng viên',
            desc: 'Xuất toàn bộ danh sách ứng viên với thông tin hồ sơ, trạng thái và kết quả.',
            icon: Users,
            color: 'bg-blue-50 border-blue-200 hover:border-blue-400',
            iconColor: 'text-blue-600',
            action: exportCandidates,
          },
          {
            key: 'rankings',
            title: 'Bảng xếp hạng',
            desc: 'Xuất bảng xếp hạng cuối cùng với điểm số và kết quả đề xuất.',
            icon: Trophy,
            color: 'bg-amber-50 border-amber-200 hover:border-amber-400',
            iconColor: 'text-amber-600',
            action: exportRankings,
          },
          {
            key: 'evals',
            title: 'Phiếu đánh giá',
            desc: 'Xuất tất cả phiếu chấm điểm đã được submit với điểm từng tiêu chí.',
            icon: ClipboardList,
            color: 'bg-purple-50 border-purple-200 hover:border-purple-400',
            iconColor: 'text-purple-600',
            action: exportEvaluations,
          },
          {
            key: 'answers',
            title: 'Câu trả lời đơn ứng tuyển',
            desc: 'Xuất tất cả câu trả lời của ứng viên trong đơn ứng tuyển.',
            icon: FileSpreadsheet,
            color: 'bg-green-50 border-green-200 hover:border-green-400',
            iconColor: 'text-green-600',
            action: exportAnswers,
          },
        ].map(item => (
          <Card key={item.key} className={`border-2 transition-all cursor-pointer ${item.color}`} onClick={loading ? undefined : item.action}>
            <CardContent className="pt-6 pb-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm flex-shrink-0">
                  {loading === item.key ? (
                    <Loader2 className={`w-6 h-6 ${item.iconColor} animate-spin`} />
                  ) : (
                    <item.icon className={`w-6 h-6 ${item.iconColor}`} />
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900 mb-1">{item.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed mb-3">{item.desc}</p>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={loading !== null}
                    className="gap-2"
                  >
                    <Download className="w-3.5 h-3.5" />
                    {loading === item.key ? 'Đang xuất...' : 'Xuất CSV'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-blue-50 border-blue-100">
        <CardContent className="py-4 text-sm text-blue-700">
          <strong>💡 Lưu ý:</strong> File CSV được mã hóa UTF-8 với BOM để mở đúng trên Excel. Dữ liệu được xuất tại thời điểm hiện tại.
        </CardContent>
      </Card>
    </div>
  )
}
