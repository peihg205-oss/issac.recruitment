import { createClient } from "@/lib/supabase/client"

export interface CandidateDeadlineStatus {
  isExpired: boolean
  isLocked: boolean
  hasApplication: boolean
  createdAt: Date
  deadlineDate: Date
  remainingMs: number
  remainingDays: number
  remainingHours: number
  remainingMinutes: number
  remainingText: string
  deadlineFormatted: string
  createdFormatted: string
  isExtended?: boolean
  isClampedByGlobalDeadline?: boolean
  isUrgent?: boolean
  closingReason?: string
}

const DEFAULT_DEADLINE_DAYS = 3

/**
 * Mốc thời gian đóng cổng nhận đơn Vòng 1 toàn hệ thống: chính xác 00h00 ngày 29 tháng 9 năm 2026
 */
export const ROUND1_GLOBAL_DEADLINE_ISO = '2026-09-29T00:00:00+07:00'

/**
 * Hạn chót đóng cổng đợt nộp đơn Vòng 1 (00:00 ngày 29/09/2026).
 * Cố định mốc 00:00 ngày 29/09/2026 để bất kỳ tài khoản nào đăng ký trong ngày 28/09/2026
 * cũng sẽ bị giới hạn thời gian nộp đơn trước thời điểm đóng cổng này!
 */
export function getRound1GlobalDeadline(): Date {
  return new Date(ROUND1_GLOBAL_DEADLINE_ISO)
}

/**
 * Format a Date to Vietnamese format: HH:mm ngày DD/MM/YYYY
 */
export function formatVietnameseDateTime(date: Date): string {
  try {
    const hours = date.getHours().toString().padStart(2, '0')
    const minutes = date.getMinutes().toString().padStart(2, '0')
    const day = date.getDate().toString().padStart(2, '0')
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const year = date.getFullYear()
    return `${hours}:${minutes} ngày ${day}/${month}/${year}`
  } catch {
    return date.toLocaleString('vi-VN')
  }
}

/**
 * Get all deadline extensions from localStorage cache & Supabase
 */
export function getLocalExtensionsMap(): Record<string, string> {
  if (typeof window === 'undefined') return {}
  try {
    const raw = localStorage.getItem('issac_candidate_deadline_extensions')
    if (raw) return JSON.parse(raw)
  } catch {}
  return {}
}

/**
 * Save extension map to local cache
 */
export function saveLocalExtensionsMap(map: Record<string, string>) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem('issac_candidate_deadline_extensions', JSON.stringify(map))
  } catch {}
}

/**
 * Compute the deadline status for a candidate.
 * - Quy chế thông thường: tối đa 3 ngày từ khi đăng ký tài khoản.
 * - Tuy nhiên, hạn chót không được vượt quá thời điểm kết thúc đợt nộp đơn Vòng 1 (00:00 ngày 29/09/2026).
 * - Do đó, nếu đăng ký vào ngày 28/09/2026, hạn chót sẽ kết thúc vào 00:00 ngày 29/09/2026 và báo thời gian sắp kết thúc!
 */
export function computeCandidateDeadlineStatus(
  createdAtStr?: string | Date | null,
  hasApplication = false,
  userId?: string | null,
  customExtensionIso?: string | null
): CandidateDeadlineStatus {
  const createdDate = createdAtStr ? new Date(createdAtStr) : new Date()
  const now = new Date()

  // 1. Kiểm tra gia hạn riêng từ Admin (nếu có)
  let extendedIso = customExtensionIso
  if (!extendedIso && userId && typeof window !== 'undefined') {
    const map = getLocalExtensionsMap()
    extendedIso = map[userId] || null
  }

  let deadlineDate: Date
  let isExtended = false
  let isClampedByGlobalDeadline = false

  if (extendedIso) {
    deadlineDate = new Date(extendedIso)
    isExtended = true
  } else {
    // Thời hạn chuẩn: 3 ngày (72 giờ) sau khi đăng ký
    const standard3Days = new Date(createdDate.getTime() + DEFAULT_DEADLINE_DAYS * 24 * 60 * 60 * 1000)
    // Thời điểm đóng cổng đợt tuyển quân Vòng 1 (00h00 ngày 29/09/2026)
    const globalRound1Deadline = getRound1GlobalDeadline()

    if (standard3Days.getTime() > globalRound1Deadline.getTime()) {
      // Bị giới hạn bởi hạn chót đợt tuyển quân Vòng 1
      deadlineDate = globalRound1Deadline
      isClampedByGlobalDeadline = true
    } else {
      deadlineDate = standard3Days
    }
  }

  const remainingMs = deadlineDate.getTime() - now.getTime()
  const isExpired = remainingMs <= 0
  const isLocked = !hasApplication && isExpired

  const totalRemainingSec = Math.max(0, Math.floor(remainingMs / 1000))
  const remainingDays = Math.floor(totalRemainingSec / (24 * 3600))
  const remainingHours = Math.floor((totalRemainingSec % (24 * 3600)) / 3600)
  const remainingMinutes = Math.floor((totalRemainingSec % 3600) / 60)

  let remainingText = ''
  if (isExpired) {
    remainingText = isClampedByGlobalDeadline
      ? 'Đã hết hạn nộp đơn Vòng 1'
      : 'Đã hết hạn 3 ngày'
  } else if (remainingDays > 0) {
    remainingText = `${remainingDays} ngày ${remainingHours} giờ`
  } else if (remainingHours > 0) {
    remainingText = `${remainingHours} giờ ${remainingMinutes} phút`
  } else {
    remainingText = `${Math.max(1, remainingMinutes)} phút`
  }

  // Cảnh báo khẩn cấp nếu sắp hết hạn (dưới 24h hoặc bị giới hạn bởi mốc kết thúc đợt)
  const isUrgent = !isExpired && (remainingMs <= 24 * 60 * 60 * 1000 || isClampedByGlobalDeadline)

  let closingReason = ''
  if (isClampedByGlobalDeadline) {
    closingReason = isExpired
      ? 'Cổng nhận đơn Vòng 1 đã đóng vào lúc 00:00 ngày 29/09/2026.'
      : 'Cổng nhận đơn Vòng 1 sắp chính thức đóng vào lúc 00:00 ngày 29/09/2026. Bạn cần nộp đơn ngay trước thời điểm này!'
  }

  return {
    isExpired,
    isLocked,
    hasApplication,
    createdAt: createdDate,
    deadlineDate,
    remainingMs,
    remainingDays,
    remainingHours,
    remainingMinutes,
    remainingText,
    deadlineFormatted: formatVietnameseDateTime(deadlineDate),
    createdFormatted: formatVietnameseDateTime(createdDate),
    isExtended,
    isClampedByGlobalDeadline,
    isUrgent,
    closingReason,
  }
}

/**
 * Admin action: Grant an extension (e.g. +3 days) or unlock a candidate
 */
export async function grantCandidateExtension(
  userId: string,
  daysToAdd = 3,
  adminName = 'Ban Chủ nhiệm'
): Promise<Date> {
  const newDeadline = new Date(Date.now() + daysToAdd * 24 * 60 * 60 * 1000)
  const isoStr = newDeadline.toISOString()

  // 1. Update local cache
  if (typeof window !== 'undefined') {
    const map = getLocalExtensionsMap()
    map[userId] = isoStr
    saveLocalExtensionsMap(map)
    window.dispatchEvent(new CustomEvent('issac_candidate_extended', { detail: { userId, deadline: isoStr } }))
  }

  // 2. Sync to Supabase system_settings & audit_logs
  try {
    const supabase = createClient()
    const { data: existing } = await supabase
      .from('system_settings')
      .select('value')
      .eq('key', 'candidate_deadline_extensions')
      .maybeSingle()

    let dbMap: Record<string, string> = {}
    if (existing?.value) {
      try { dbMap = JSON.parse(existing.value) } catch {}
    }
    dbMap[userId] = isoStr

    await supabase
      .from('system_settings')
      .upsert({
        key: 'candidate_deadline_extensions',
        value: JSON.stringify(dbMap),
        label: 'Danh sách tài khoản ứng viên được gia hạn',
        description: 'Map userId -> extended_deadline_iso',
        value_type: 'json'
      }, { onConflict: 'key' })

    // Insert notification for the candidate
    await supabase.from('notifications').insert({
      user_id: userId,
      title: 'Tài khoản đã được gia hạn thời gian nộp đơn',
      message: `Ban Chủ nhiệm đã gia hạn thêm ${daysToAdd} ngày để hoàn thành đơn ứng tuyển. Hạn mới: ${formatVietnameseDateTime(newDeadline)}.`,
      type: 'info'
    })

    // Log to audit_logs
    await supabase.from('audit_logs').insert({
      user_id: null,
      action: 'CANDIDATE_EXTENSION',
      target_type: 'candidate',
      target_id: userId,
      metadata: {
        admin_name: adminName,
        days_added: daysToAdd,
        new_deadline: isoStr
      }
    })
  } catch (err) {
    console.warn('Could not sync candidate extension to database:', err)
  }

  return newDeadline
}
