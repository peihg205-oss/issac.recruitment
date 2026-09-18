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
}

const DEFAULT_DEADLINE_DAYS = 3

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
 * Compute the 3-day deadline status for a candidate.
 * If candidate has completed/submitted an application (status !== 'draft'), isLocked is always false.
 * If candidate only created an account without completing an application, deadline is 3 days from created_at.
 */
export function computeCandidateDeadlineStatus(
  createdAtStr?: string | Date | null,
  hasApplication = false,
  userId?: string | null,
  customExtensionIso?: string | null
): CandidateDeadlineStatus {
  const createdDate = createdAtStr ? new Date(createdAtStr) : new Date()
  const now = new Date()

  // 1. Check custom extension for this candidate
  let extendedIso = customExtensionIso
  if (!extendedIso && userId && typeof window !== 'undefined') {
    const map = getLocalExtensionsMap()
    extendedIso = map[userId] || null
  }

  let deadlineDate: Date
  let isExtended = false

  if (extendedIso) {
    deadlineDate = new Date(extendedIso)
    isExtended = true
  } else {
    // Default: exactly 3 days (72 hours) after registration
    deadlineDate = new Date(createdDate.getTime() + DEFAULT_DEADLINE_DAYS * 24 * 60 * 60 * 1000)
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
    remainingText = 'Đã hết hạn 3 ngày'
  } else if (remainingDays > 0) {
    remainingText = `${remainingDays} ngày ${remainingHours} giờ`
  } else if (remainingHours > 0) {
    remainingText = `${remainingHours} giờ ${remainingMinutes} phút`
  } else {
    remainingText = `${remainingMinutes} phút`
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
