import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { type ApplicationStatus } from '@/types/database'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const VIETNAM_TIMEZONE = 'Asia/Ho_Chi_Minh'

export function formatDate(date: string | null | undefined): string {
  if (!date) return '—'
  return new Intl.DateTimeFormat('vi-VN', {
    timeZone: VIETNAM_TIMEZONE,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(date))
}

export function formatDateTime(date: string | null | undefined): string {
  if (!date) return '—'
  return new Intl.DateTimeFormat('vi-VN', {
    timeZone: VIETNAM_TIMEZONE,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(new Date(date))
}

export function formatFullTimestamp(date: string | null | undefined): { dateStr: string; timeStr: string } {
  if (!date) return { dateStr: '—', timeStr: '—' }
  const d = new Date(date)
  const dateStr = new Intl.DateTimeFormat('vi-VN', {
    timeZone: VIETNAM_TIMEZONE,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(d)
  const timeStr = new Intl.DateTimeFormat('vi-VN', {
    timeZone: VIETNAM_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(d)
  return { dateStr, timeStr }
}

export function formatTime(time: string | null | undefined): string {
  if (!time) return '—'
  return time.slice(0, 5) // HH:MM
}

export const APPLICATION_STATUS_LABELS: Record<ApplicationStatus, string> = {
  draft: 'Chưa làm đơn',
  submitted: 'Đã nộp đơn',
  received: 'Đã nhận đơn',
  reviewing: 'Đang xét duyệt',
  approved: 'Đã duyệt',
  rejected: 'Từ chối',
  interview_scheduled: 'Chờ phỏng vấn',
  interviewed: 'Đã phỏng vấn',
  evaluating: 'Đang đánh giá',
  evaluated: 'Đã đánh giá',
  finalized: 'Đã hoàn tất',
}

export const APPLICATION_STATUS_COLORS: Record<ApplicationStatus, string> = {
  draft: 'bg-amber-50 text-amber-800 border-amber-200/90',
  submitted: 'bg-blue-50 text-blue-700 border-blue-200',
  received: 'bg-blue-50 text-blue-700 border-blue-200',
  reviewing: 'bg-amber-50 text-amber-700 border-amber-200',
  approved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  rejected: 'bg-rose-50 text-rose-700 border-rose-200',
  interview_scheduled: 'bg-purple-50 text-purple-700 border-purple-200',
  interviewed: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  evaluating: 'bg-orange-50 text-orange-700 border-orange-200',
  evaluated: 'bg-teal-50 text-teal-700 border-teal-200',
  finalized: 'bg-emerald-50 text-emerald-700 border-emerald-200',
}

export const DEPARTMENT_COLORS: Record<string, string> = {
  'truyen-thong': 'bg-blue-100 text-blue-700 border-blue-200',
  'tu-van': 'bg-emerald-100 text-emerald-700 border-emerald-200',
  'nhan-su': 'bg-purple-100 text-purple-700 border-purple-200',
  'chu-nhiem': 'bg-red-100 text-red-700 border-red-200',
}

export const RESULT_LABELS: Record<string, string> = {
  pass: 'Pass',
  waitlist: 'Dự bị',
  fail: 'Trượt',
  pending: 'Chờ kết quả',
}

export const RESULT_COLORS: Record<string, string> = {
  pass: 'bg-green-100 text-green-700 border-green-200',
  waitlist: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  fail: 'bg-red-100 text-red-700 border-red-200',
  pending: 'bg-gray-100 text-gray-700 border-gray-200',
}

export function getScoreGrade(score: number, maxScore: number = 100): string {
  const pct = (score / maxScore) * 100
  if (pct >= 90) return 'Xuất sắc'
  if (pct >= 80) return 'Tốt'
  if (pct >= 70) return 'Khá'
  if (pct >= 60) return 'Trung bình'
  return 'Cần cải thiện'
}

export function getScoreGradeColor(score: number, maxScore: number = 100): string {
  const pct = (score / maxScore) * 100
  if (pct >= 90) return 'text-emerald-600'
  if (pct >= 80) return 'text-blue-600'
  if (pct >= 70) return 'text-yellow-600'
  if (pct >= 60) return 'text-orange-600'
  return 'text-red-600'
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
}

export function exportToCSV(data: Record<string, unknown>[], filename: string): void {
  if (data.length === 0) return
  const headers = Object.keys(data[0])
  const csvContent = [
    headers.join(','),
    ...data.map(row =>
      headers.map(h => {
        const val = row[h]
        const str = val == null ? '' : String(val)
        return str.includes(',') ? `"${str}"` : str
      }).join(',')
    )
  ].join('\n')

  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `${filename}_${new Date().toISOString().slice(0,10)}.csv`
  link.click()
}

/**
 * Định dạng mã hồ sơ ứng viên chuẩn: ISSAC-01, ISSAC-02...
 */
export function formatCandidateCode(index: number): string {
  const num = Math.max(1, index)
  return `ISSAC-${num.toString().padStart(2, '0')}`
}

/**
 * Cấp mã hồ sơ ứng viên ISSAC-01, ISSAC-02... lần lượt theo thời gian ứng tuyển (chronological order)
 */
export function buildCandidateCodeMap(
  applications: Array<{ id: string; submitted_at?: string | null; created_at?: string }>
): Record<string, string> {
  if (!applications || applications.length === 0) return {}

  // Sắp xếp tăng dần theo thời gian nộp (nếu không có submitted_at thì lấy created_at)
  const sorted = [...applications].sort((a, b) => {
    const timeA = new Date(a.submitted_at || a.created_at || 0).getTime()
    const timeB = new Date(b.submitted_at || b.created_at || 0).getTime()
    return timeA - timeB
  })

  const map: Record<string, string> = {}
  sorted.forEach((app, idx) => {
    map[app.id] = formatCandidateCode(idx + 1)
  })
  return map
}

/**
 * Lấy mã hồ sơ ISSAC-XX cho một ứng viên cụ thể từ danh sách tổng
 */
export function getCandidateCode(
  applicationId: string,
  allApplications: Array<{ id: string; submitted_at?: string | null; created_at?: string }>
): string {
  if (!allApplications || allApplications.length === 0) return 'ISSAC-01'

  const sorted = [...allApplications].sort((a, b) => {
    const timeA = new Date(a.submitted_at || a.created_at || 0).getTime()
    const timeB = new Date(b.submitted_at || b.created_at || 0).getTime()
    return timeA - timeB
  })

  const index = sorted.findIndex(a => a.id === applicationId)
  if (index === -1) {
    // Nếu ứng viên mới nhất
    return formatCandidateCode(sorted.length + 1)
  }
  return formatCandidateCode(index + 1)
}
