import { EVALUATOR_ACCOUNTS, type AdminRoleType } from "./permissions"

export interface AdminAccountInfo {
  name: string
  title: string
  avatarInitial: string
  email: string
  updatedAt?: string
}

export interface AdminChangeRequest {
  id: string
  role: AdminRoleType
  departmentName: string
  currentName: string
  currentTitle: string
  requestedName: string
  requestedTitle: string
  requestedAt: string
  status: "pending" | "approved" | "rejected"
  reviewedAt?: string
  reviewNote?: string
}

const ACCOUNTS_COOKIE_NAME = "issac_admin_accounts"
const REQUESTS_COOKIE_NAME = "issac_admin_requests"

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null
  const match = document.cookie.match(new RegExp("(^|;\\s*)" + name + "=([^;]+)"))
  return match ? decodeURIComponent(match[2]) : null
}

function setCookie(name: string, value: string, days = 60) {
  if (typeof document === "undefined") return
  const expires = new Date(Date.now() + days * 864e5).toUTCString()
  document.cookie = name + "=" + encodeURIComponent(value) + "; path=/; expires=" + expires + "; SameSite=Lax"
}

export function getAdminAccounts(): Record<AdminRoleType, AdminAccountInfo> {
  const defaults: Record<AdminRoleType, AdminAccountInfo> = {
    "chu-nhiem": {
      name: EVALUATOR_ACCOUNTS["chu-nhiem"].name,
      title: EVALUATOR_ACCOUNTS["chu-nhiem"].title,
      avatarInitial: EVALUATOR_ACCOUNTS["chu-nhiem"].avatarInitial,
      email: EVALUATOR_ACCOUNTS["chu-nhiem"].email,
    },
    "truyen-thong": {
      name: EVALUATOR_ACCOUNTS["truyen-thong"].name,
      title: EVALUATOR_ACCOUNTS["truyen-thong"].title,
      avatarInitial: EVALUATOR_ACCOUNTS["truyen-thong"].avatarInitial,
      email: EVALUATOR_ACCOUNTS["truyen-thong"].email,
    },
    "tu-van": {
      name: EVALUATOR_ACCOUNTS["tu-van"].name,
      title: EVALUATOR_ACCOUNTS["tu-van"].title,
      avatarInitial: EVALUATOR_ACCOUNTS["tu-van"].avatarInitial,
      email: EVALUATOR_ACCOUNTS["tu-van"].email,
    },
    "nhan-su": {
      name: EVALUATOR_ACCOUNTS["nhan-su"].name,
      title: EVALUATOR_ACCOUNTS["nhan-su"].title,
      avatarInitial: EVALUATOR_ACCOUNTS["nhan-su"].avatarInitial,
      email: EVALUATOR_ACCOUNTS["nhan-su"].email,
    },
  }

  let parsed: any = null
  const cookieVal = getCookie(ACCOUNTS_COOKIE_NAME)
  if (cookieVal) {
    try {
      parsed = JSON.parse(cookieVal)
    } catch {}
  }

  if (!parsed && typeof window !== "undefined") {
    const local = localStorage.getItem(ACCOUNTS_COOKIE_NAME)
    if (local) {
      try {
        parsed = JSON.parse(local)
      } catch {}
    }
  }

  if (parsed && typeof parsed === "object") {
    const merged = { ...defaults, ...parsed }
    // Sanitize any stale dummy emails from previous cookies
    const staleEmails: Record<string, string> = {
      "dinhhai.issac@vnu.edu.vn": "truyenthong@issac.vnu.edu.vn",
      "haiyen.issac@vnu.edu.vn": "tuvan@issac.vnu.edu.vn",
      "minhduc.issac@vnu.edu.vn": "nhansu@issac.vnu.edu.vn",
    }
    for (const key of Object.keys(merged) as AdminRoleType[]) {
      if (merged[key] && staleEmails[merged[key].email]) {
        merged[key].email = staleEmails[merged[key].email]
      }
    }
    return merged
  }

  return defaults
}

export function saveAdminAccounts(accounts: Record<AdminRoleType, AdminAccountInfo>) {
  const json = JSON.stringify(accounts)
  setCookie(ACCOUNTS_COOKIE_NAME, json)
  if (typeof window !== "undefined") {
    localStorage.setItem(ACCOUNTS_COOKIE_NAME, json)
  }
}

export function getAdminRequests(): AdminChangeRequest[] {
  let parsed: any = null
  const cookieVal = getCookie(REQUESTS_COOKIE_NAME)
  if (cookieVal) {
    try {
      parsed = JSON.parse(cookieVal)
    } catch {}
  }

  if (!parsed && typeof window !== "undefined") {
    const local = localStorage.getItem(REQUESTS_COOKIE_NAME)
    if (local) {
      try {
        parsed = JSON.parse(local)
      } catch {}
    }
  }

  if (Array.isArray(parsed)) {
    return parsed
  }

  return []
}

export function saveAdminRequests(requests: AdminChangeRequest[]) {
  const json = JSON.stringify(requests)
  setCookie(REQUESTS_COOKIE_NAME, json)
  if (typeof window !== "undefined") {
    localStorage.setItem(REQUESTS_COOKIE_NAME, json)
  }
}

// BCN or direct update
export function updateAccountDirectly(
  role: AdminRoleType,
  name: string,
  title: string
): Record<AdminRoleType, AdminAccountInfo> {
  const current = getAdminAccounts()
  const trimmedName = name.trim()
  const trimmedTitle = title.trim()
  const initial = trimmedName.charAt(0).toUpperCase() || "A"

  const updated: Record<AdminRoleType, AdminAccountInfo> = {
    ...current,
    [role]: {
      ...current[role],
      name: trimmedName,
      title: trimmedTitle,
      avatarInitial: initial,
      updatedAt: new Date().toISOString(),
    },
  }

  saveAdminAccounts(updated)
  return updated
}

// Department Admin submits a request to BCN
export function submitChangeRequest(
  role: AdminRoleType,
  requestedName: string,
  requestedTitle: string
): AdminChangeRequest {
  const current = getAdminAccounts()
  const account = current[role]
  const requests = getAdminRequests()

  // Remove any previous pending request for this role
  const filtered = requests.filter(r => !(r.role === role && r.status === "pending"))

  const newRequest: AdminChangeRequest = {
    id: "req-" + Date.now(),
    role,
    departmentName: EVALUATOR_ACCOUNTS[role]?.departmentName || role,
    currentName: account.name,
    currentTitle: account.title,
    requestedName: requestedName.trim(),
    requestedTitle: requestedTitle.trim(),
    requestedAt: new Date().toISOString(),
    status: "pending",
  }

  filtered.unshift(newRequest)
  saveAdminRequests(filtered)
  return newRequest
}

// Cancel a pending request
export function cancelChangeRequest(requestId: string): void {
  const requests = getAdminRequests()
  const updated = requests.filter(r => r.id !== requestId)
  saveAdminRequests(updated)
}

// BCN approves a request
export function approveChangeRequest(requestId: string): void {
  const requests = getAdminRequests()
  const req = requests.find(r => r.id === requestId)
  if (!req) return

  req.status = "approved"
  req.reviewedAt = new Date().toISOString()
  saveAdminRequests(requests)

  // Apply the change
  updateAccountDirectly(req.role, req.requestedName, req.requestedTitle)
}

// BCN rejects a request
export function rejectChangeRequest(requestId: string, note?: string): void {
  const requests = getAdminRequests()
  const req = requests.find(r => r.id === requestId)
  if (!req) return

  req.status = "rejected"
  req.reviewedAt = new Date().toISOString()
  if (note) req.reviewNote = note
  saveAdminRequests(requests)
}
