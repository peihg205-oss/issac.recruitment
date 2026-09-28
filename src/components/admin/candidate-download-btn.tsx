'use client'

import { Download } from 'lucide-react'
import { exportToCSV, formatDateTime, APPLICATION_STATUS_LABELS } from '@/lib/utils'
import { type ApplicationStatus } from '@/types/database'
import { useToast } from '@/components/ui/use-toast'
import { resolveCandidateProfileInfo } from '@/lib/candidate-profile-resolver'

interface CandidateDownloadBtnProps {
  candidate: any
  profile: any
  dept: any
  ranking: any
  candidateAnswers: any[]
  candidateCode: string
}

export function CandidateDownloadBtn({
  candidate,
  profile,
  dept,
  ranking,
  candidateAnswers,
  candidateCode,
}: CandidateDownloadBtnProps) {
  const { toast } = useToast()

  const handleDownload = () => {
    try {
      const resolved = resolveCandidateProfileInfo(candidate, profile)
      const row: Record<string, unknown> = {
        'Mã hồ sơ': candidateCode,
        'Họ và tên': resolved.full_name,
        'MSSV': resolved.student_id,
        'Email': resolved.email,
        'Số điện thoại': resolved.phone,
        'Ngày sinh': resolved.date_of_birth,
        'Trường THPT': resolved.high_school,
        'Ngành học': resolved.major,
        'Khóa': resolved.cohort,
        'Trường Đại học': resolved.university,
        'Giới tính': resolved.gender,
        'Link Facebook': resolved.address,
        'Ban ứng tuyển (NV1)': dept?.name || '',
        'Trạng thái hồ sơ': APPLICATION_STATUS_LABELS[candidate?.status as ApplicationStatus] ?? candidate?.status,
        'Điểm phỏng vấn (/10)': ranking?.final_score != null ? Number(ranking.final_score).toFixed(1) : 'Chưa chấm',
        'Xếp hạng CLB': ranking?.rank_number ? `#${ranking.rank_number}` : 'Đang xét',
        'Kết quả BCN': ranking?.result === 'pass' ? 'Pass' : ranking?.result === 'waitlist' ? 'Dự bị' : ranking?.result === 'fail' ? 'Trượt' : 'Đang xét',
        'Thời gian nộp đơn': formatDateTime(candidate?.submitted_at || candidate?.created_at),
      }

      // Thêm toàn bộ các câu hỏi và câu trả lời của ứng viên vào file
      if (Array.isArray(candidateAnswers) && candidateAnswers.length > 0) {
        candidateAnswers.forEach((ans, idx) => {
          const colHeader = `Câu ${idx + 1}: ${ans.question_text || `Câu hỏi ${idx + 1}`}`
          const val = ans.answer_text || ans.selected_option || (Array.isArray(ans.answer_options) ? ans.answer_options.join(', ') : '') || ''
          row[colHeader] = val
        })
      }

      const fileName = `ho_so_${candidateCode}_${(profile?.full_name || 'ung_vien').replace(/[^a-zA-Z0-9]/g, '_')}`
      exportToCSV([row], fileName)

      toast({
        title: 'Tải hồ sơ thành công!',
        description: `Tệp ${fileName}.csv đã sẵn sàng mở trên Microsoft Excel.`,
      })
    } catch (err) {
      console.error(err)
      toast({
        title: 'Không thể tải file',
        description: 'Có lỗi xảy ra khi tạo tệp tải về.',
        variant: 'destructive',
      })
    }
  }

  return (
    <button
      type="button"
      onClick={handleDownload}
      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs active:scale-95 cursor-pointer"
      title="Tải tệp hồ sơ cá nhân và toàn bộ câu trả lời dạng CSV"
    >
      <Download className="w-3.5 h-3.5" />
      <span>Tải hồ sơ (CSV)</span>
    </button>
  )
}
