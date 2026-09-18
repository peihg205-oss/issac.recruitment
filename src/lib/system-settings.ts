import { useState, useEffect, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"

export const DEFAULT_SYSTEM_SETTINGS_MAP: Record<string, string> = {
  recruitment_start: "2026-09-10",
  recruitment_end: "2026-09-20",
  interview_start: "2026-09-22",
  interview_end: "2026-09-25",
  result_announcement: "2026-09-28",
  recruitment_quota: "15",
  interview_min_score: "8.0",
  interview_format: "Online & Offline",
  interview_location: "Trường Quốc tế VNU-IS / Google Meet",
  allow_second_department: "true",
  max_applications_per_user: "1",
  results_published: "false",
  scoring_method: "weighted",
  auto_sync_evaluations: "true",
  questions_published: "true",
}

export function isRecruitmentOpen(settingsMap?: Record<string, string>): {
  isOpen: boolean
  isUpcoming: boolean
  isClosed: boolean
  isQuestionsPublished: boolean
  startDate: string
  endDate: string
  message: string
} {
  const settings = settingsMap || getStoredSystemSettings()
  const rStart = settings.recruitment_start || "2026-09-10"
  const rEnd = settings.recruitment_end || "2026-09-20"
  const isQPub = (settings.questions_published ?? "true") === "true"

  const now = new Date()
  const todayStr = now.toISOString().split("T")[0]

  const isUpcoming = todayStr < rStart
  const isClosed = todayStr > rEnd
  const isDateValid = !isUpcoming && !isClosed

  let message = ""
  if (isUpcoming) {
    message = `Hiện tại ban tuyển quân chưa mở đơn ứng tuyển, vui lòng check lại thông tin và đọc thông tin câu lạc bộ để chọn ban đúng với bản thân, và đừng quên theo dõi trang mạng xã hội để cập nhật thông tin tuyển quân sớm nhất của CLB nha!`
  } else if (isClosed) {
    message = `Kỳ tuyển quân đã kết thúc thời hạn nhận đơn vào ngày ${formatDayMonth(rEnd)}.`
  } else if (!isQPub) {
    message = `Hiện tại ban tuyển quân chưa mở đơn ứng tuyển, vui lòng check lại thông tin và đọc thông tin câu lạc bộ để chọn ban đúng với bản thân, và đừng quên theo dõi trang mạng xã hội để cập nhật thông tin tuyển quân sớm nhất của CLB nha!`
  }

  return {
    isOpen: isDateValid && isQPub,
    isUpcoming,
    isClosed,
    isQuestionsPublished: isQPub,
    startDate: rStart,
    endDate: rEnd,
    message,
  }
}

export function formatDayMonth(dateStr?: string | null): string {
  if (!dateStr) return ""
  try {
    const parts = dateStr.trim().split("-")
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}`
    }
  } catch {}
  return dateStr || ""
}

export function getStoredSystemSettings(): Record<string, string> {
  if (typeof window === "undefined") {
    return { ...DEFAULT_SYSTEM_SETTINGS_MAP }
  }
  try {
    const raw = localStorage.getItem("issac_system_settings")
    if (raw) {
      const parsed = JSON.parse(raw)
      return { ...DEFAULT_SYSTEM_SETTINGS_MAP, ...parsed }
    }
  } catch {}
  return { ...DEFAULT_SYSTEM_SETTINGS_MAP }
}

/**
 * Save system settings to Supabase DB + audit_logs + localStorage cache.
 * Works across all devices (laptop & phone) seamlessly.
 */
export async function saveSystemSettingsToDB(
  settingsMap: Record<string, string>
): Promise<boolean> {
  const supabase = createClient()
  let success = false

  // 1. Try upserting each key-value pair to system_settings table
  for (const [key, value] of Object.entries(settingsMap)) {
    try {
      const { error } = await supabase
        .from("system_settings")
        .upsert({ key, value }, { onConflict: "key" })
      if (!error) success = true
    } catch {}
  }

  // 2. Always save merged settings to audit_logs for guaranteed cross-device sync
  const current = getStoredSystemSettings()
  const merged = { ...current, ...settingsMap }

  try {
    await supabase.from('audit_logs').insert({
      action: 'SYNC_SYSTEM_SETTINGS',
      user_name: 'BCN',
      description: JSON.stringify(merged)
    })
    success = true
  } catch {}

  // 3. Always update localStorage cache
  if (typeof window !== "undefined") {
    localStorage.setItem("issac_system_settings", JSON.stringify(merged))
    window.dispatchEvent(new Event("issac_system_settings_updated"))
  }

  return success
}

/**
 * Fetch all settings from Supabase DB, merge with defaults, cache to localStorage.
 */
export async function fetchSystemSettingsFromDB(): Promise<Record<string, string>> {
  const supabase = createClient()
  try {
    const remoteMap: Record<string, string> = {}

    // 1. Read from system_settings table
    const { data: dbSettings } = await supabase.from("system_settings").select("key, value")
    if (dbSettings && dbSettings.length > 0) {
      dbSettings.forEach((s) => {
        if (s.key && s.value !== null && s.value !== undefined) {
          remoteMap[s.key] = s.value
        }
      })
    }

    // 2. Overlay latest updates from audit_logs SYNC_SYSTEM_SETTINGS
    try {
      const { data: syncLogs } = await supabase
        .from('audit_logs')
        .select('description')
        .eq('action', 'SYNC_SYSTEM_SETTINGS')
        .order('created_at', { ascending: false })
        .limit(1)

      if (syncLogs && syncLogs.length > 0 && syncLogs[0].description) {
        const parsed = JSON.parse(syncLogs[0].description)
        if (parsed && typeof parsed === 'object') {
          Object.assign(remoteMap, parsed)
        }
      }
    } catch {}

    if (Object.keys(remoteMap).length > 0) {
      const merged = { ...DEFAULT_SYSTEM_SETTINGS_MAP, ...remoteMap }
      if (typeof window !== "undefined") {
        localStorage.setItem("issac_system_settings", JSON.stringify(merged))
      }
      return merged
    }
  } catch {}
  return getStoredSystemSettings()
}

export interface RecruitmentTimeline {
  round1: {
    id: number
    name: string
    startDate: string
    endDate: string
    dateBadge: string
    isCurrent: boolean
  }
  round2: {
    id: number
    name: string
    startDate: string
    endDate: string
    dateBadge: string
    isCurrent: boolean
  }
  round3: {
    id: number
    name: string
    date: string
    dateBadge: string
    isCurrent: boolean
  }
}

export function computeRecruitmentTimeline(settingsMap?: Record<string, string>): RecruitmentTimeline {
  const settings = settingsMap || getStoredSystemSettings()

  const r1Start = settings.recruitment_start || "2026-09-10"
  const r1End = settings.recruitment_end || "2026-09-20"
  const r2Start = settings.interview_start || "2026-09-22"
  const r2End = settings.interview_end || "2026-09-25"
  const r3Date = settings.result_announcement || "2026-09-28"

  const now = new Date()
  const todayStr = now.toISOString().split("T")[0]

  const isR1 = todayStr >= r1Start && todayStr <= r1End
  const isR2 = todayStr >= r2Start && todayStr <= r2End
  const isR3 = todayStr >= r3Date

  return {
    round1: {
      id: 1,
      name: "Vòng 1: Mở đơn đăng ký",
      startDate: r1Start,
      endDate: r1End,
      dateBadge: `${formatDayMonth(r1Start)} - ${formatDayMonth(r1End)}`,
      isCurrent: isR1,
    },
    round2: {
      id: 2,
      name: "Vòng 2: Phỏng vấn tuyển chọn",
      startDate: r2Start,
      endDate: r2End,
      dateBadge: `${formatDayMonth(r2Start)} - ${formatDayMonth(r2End)}`,
      isCurrent: isR2,
    },
    round3: {
      id: 3,
      name: "Vòng 3: Công bố kết quả chính thức",
      date: r3Date,
      dateBadge: formatDayMonth(r3Date),
      isCurrent: isR3,
    },
  }
}

export function useSystemSettings() {
  const [settings, setSettings] = useState<Record<string, string>>(() => DEFAULT_SYSTEM_SETTINGS_MAP)
  const [timeline, setTimeline] = useState<RecruitmentTimeline>(() => computeRecruitmentTimeline(DEFAULT_SYSTEM_SETTINGS_MAP))

  const refresh = useCallback(async () => {
    // 1. Show cached data immediately
    const local = getStoredSystemSettings()
    setSettings(local)
    setTimeline(computeRecruitmentTimeline(local))

    // 2. Fetch from Supabase DB (source of truth)
    try {
      const dbSettings = await fetchSystemSettingsFromDB()
      setSettings(dbSettings)
      setTimeline(computeRecruitmentTimeline(dbSettings))
    } catch {}
  }, [])

  useEffect(() => {
    refresh()

    const handleUpdate = () => {
      const updated = getStoredSystemSettings()
      setSettings(updated)
      setTimeline(computeRecruitmentTimeline(updated))
    }

    window.addEventListener("issac_system_settings_updated", handleUpdate)
    window.addEventListener("storage", handleUpdate)

    // Subscribe to realtime changes from Supabase
    const supabase = createClient()
    const channel = supabase
      .channel("system-settings-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "system_settings" }, () => {
        refresh()
      })
      .subscribe()

    return () => {
      window.removeEventListener("issac_system_settings_updated", handleUpdate)
      window.removeEventListener("storage", handleUpdate)
      supabase.removeChannel(channel)
    }
  }, [refresh])

  return { settings, timeline, refresh }
}
