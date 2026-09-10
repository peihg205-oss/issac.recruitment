import { useState, useEffect, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"

export const DEFAULT_SYSTEM_SETTINGS_MAP: Record<string, string> = {
  recruitment_start: "2026-09-10",
  recruitment_end: "2026-09-20",
  interview_start: "2026-09-22",
  interview_end: "2026-09-25",
  result_announcement: "2026-09-28",
  recruitment_quota: "15",
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
    const local = getStoredSystemSettings()
    setSettings(local)
    setTimeline(computeRecruitmentTimeline(local))

    try {
      const supabase = createClient()
      const { data } = await supabase.from("system_settings").select("key, value")
      if (data && data.length > 0) {
        const remoteMap: Record<string, string> = {}
        data.forEach((s) => {
          if (s.key && s.value !== null && s.value !== undefined) {
            remoteMap[s.key] = s.value
          }
        })
        // Merge: Defaults -> Remote Supabase -> Local Admin Overrides
        const merged = { ...DEFAULT_SYSTEM_SETTINGS_MAP, ...remoteMap, ...local }
        if (typeof window !== "undefined") {
          localStorage.setItem("issac_system_settings", JSON.stringify(merged))
        }
        setSettings(merged)
        setTimeline(computeRecruitmentTimeline(merged))
      }
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

    return () => {
      window.removeEventListener("issac_system_settings_updated", handleUpdate)
      window.removeEventListener("storage", handleUpdate)
    }
  }, [refresh])

  return { settings, timeline, refresh }
}
