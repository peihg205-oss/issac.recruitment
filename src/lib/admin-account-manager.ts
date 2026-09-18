import { EVALUATOR_ACCOUNTS, type AdminRoleType } from "./permissions"
import { createClient } from "./supabase/client"

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

// ============================================================
// ADMIN ACCOUNTS (built-in role-based display names)
// ============================================================

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

  // Try reading overrides from localStorage cache (fast path)
  if (typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem("issac_admin_accounts")
      if (raw) {
        const parsed = JSON.parse(raw)
        if (parsed && typeof parsed === "object") {
          return { ...defaults, ...parsed }
        }
      }
    } catch {}
  }

  return defaults
}

export function saveAdminAccounts(accounts: Record<AdminRoleType, AdminAccountInfo>) {
  if (typeof window !== "undefined") {
    localStorage.setItem("issac_admin_accounts", JSON.stringify(accounts))
  }
}

// ============================================================
// CREATED ADMIN ACCOUNTS (BCN-created accounts stored in DB)
// ============================================================

export interface CreatedAdminAccount {
  id?: string
  email: string
  full_name: string
  admin_role: string
  title?: string
  password?: string
  is_active: boolean
  created_at?: string
}

/**
 * Fetch created admin accounts from Supabase DB.
 * Checks admin_accounts table, audit_logs fallback, then localStorage.
 */
export async function getCreatedAdminAccountsFromDB(): Promise<CreatedAdminAccount[]> {
  const supabase = createClient()
  try {
    // 1. Try dedicated admin_accounts table
    const { data, error } = await supabase
      .from("admin_accounts")
      .select("*")
      .order("created_at", { ascending: false })

    if (!error && data && data.length > 0) {
      if (typeof window !== "undefined") {
        localStorage.setItem("issac_created_admins", JSON.stringify(data))
      }
      return data as CreatedAdminAccount[]
    }

    // 2. Fallback: Check audit_logs SYNC_ADMIN_ACCOUNTS (works cross-device without DDL migration)
    const { data: syncLogs } = await supabase
      .from('audit_logs')
      .select('description')
      .eq('action', 'SYNC_ADMIN_ACCOUNTS')
      .order('created_at', { ascending: false })
      .limit(1)

    if (syncLogs && syncLogs.length > 0 && syncLogs[0].description) {
      try {
        const parsed = JSON.parse(syncLogs[0].description)
        if (Array.isArray(parsed) && parsed.length > 0) {
          if (typeof window !== "undefined") {
            localStorage.setItem("issac_created_admins", JSON.stringify(parsed))
          }
          return parsed as CreatedAdminAccount[]
        }
      } catch {}
    }
  } catch {}

  // 3. Fallback: read from localStorage cache
  return getCreatedAdminAccountsLocal()
}

/**
 * Read created admin accounts from localStorage cache (sync, no network).
 */
export function getCreatedAdminAccountsLocal(): CreatedAdminAccount[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem("issac_created_admins")
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) return parsed
    }
  } catch {}

  // Also try cookie fallback
  if (typeof document !== "undefined") {
    try {
      const match = document.cookie.match(/(?:^|;\s*)issac_created_admins=([^;]+)/)
      if (match) {
        const parsed = JSON.parse(decodeURIComponent(match[1]))
        if (Array.isArray(parsed)) return parsed
      }
    } catch {}
  }

  return []
}

/**
 * Fetch deleted admin emails from Supabase DB (cross-device sync).
 */
export async function getDeletedAdminEmailsFromDB(): Promise<string[]> {
  const list = new Set<string>()

  // 1. Read local cache
  if (typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem("issac_deleted_admin_emails")
      if (raw) {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed)) parsed.forEach((em: string) => list.add(em.toLowerCase().trim()))
      }
    } catch {}
  }
  if (typeof document !== "undefined") {
    try {
      const match = document.cookie.match(/(?:^|;\s*)issac_deleted_admin_emails=([^;]+)/)
      if (match) {
        const parsed = JSON.parse(decodeURIComponent(match[1]))
        if (Array.isArray(parsed)) parsed.forEach((em: string) => list.add(em.toLowerCase().trim()))
      }
    } catch {}
  }

  // 2. Read from Supabase audit_logs
  try {
    const supabase = createClient()
    const { data: syncLogs } = await supabase
      .from('audit_logs')
      .select('description')
      .eq('action', 'SYNC_DELETED_ADMINS')
      .order('created_at', { ascending: false })
      .limit(1)

    if (syncLogs && syncLogs.length > 0 && syncLogs[0].description) {
      try {
        const parsed = JSON.parse(syncLogs[0].description)
        if (Array.isArray(parsed)) {
          parsed.forEach((em: string) => list.add(em.toLowerCase().trim()))
        }
      } catch {}
    }

    // 3. Read from deleted_accounts table if available
    try {
      const { data: delRows } = await supabase
        .from('deleted_accounts')
        .select('target_email, target_id')
        .eq('account_type', 'admin')

      if (delRows && delRows.length > 0) {
        delRows.forEach(r => {
          if (r.target_email) list.add(r.target_email.toLowerCase().trim())
          if (r.target_id) list.add(r.target_id.toLowerCase().trim())
        })
      }
    } catch {}
  } catch {}

  const result = Array.from(list)

  // Cache locally
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem("issac_deleted_admin_emails", JSON.stringify(result))
      document.cookie = `issac_deleted_admin_emails=${encodeURIComponent(JSON.stringify(result))}; path=/; max-age=2592000; SameSite=Lax`
    } catch {}
  }

  return result
}

/**
 * Save a new admin account to Supabase DB + audit_logs + localStorage cache.
 */
export async function saveCreatedAdminToDB(account: CreatedAdminAccount): Promise<boolean> {
  const supabase = createClient()
  let success = false

  // 1. Try admin_accounts table
  try {
    const { error } = await supabase
      .from("admin_accounts")
      .upsert({
        email: account.email.toLowerCase().trim(),
        full_name: account.full_name,
        admin_role: account.admin_role,
        title: account.title || null,
        password: account.password || null,
        is_active: account.is_active,
        created_by: account.title || "BCN",
      }, { onConflict: "email" })

    if (!error) success = true
  } catch {}

  // 2. Always update localStorage cache
  const current = getCreatedAdminAccountsLocal()
  const idx = current.findIndex(a => a.email.toLowerCase().trim() === account.email.toLowerCase().trim())
  if (idx >= 0) {
    current[idx] = { ...current[idx], ...account }
  } else {
    current.push(account)
  }

  if (typeof window !== "undefined") {
    const json = JSON.stringify(current)
    localStorage.setItem("issac_created_admins", json)
    document.cookie = "issac_created_admins=" + encodeURIComponent(json) + "; path=/; max-age=2592000; SameSite=Lax"
  }

  // 3. Save to audit_logs for cross-device sync
  try {
    await supabase.from('audit_logs').insert({
      action: 'SYNC_ADMIN_ACCOUNTS',
      user_name: 'BCN',
      description: JSON.stringify(current)
    })
    success = true
  } catch {}

  return success
}

/**
 * Delete an admin account from Supabase DB + localStorage cache + sync across all devices.
 */
export async function deleteCreatedAdminFromDB(email: string): Promise<boolean> {
  const emailLower = email.toLowerCase().trim()
  const supabase = createClient()
  let success = false

  try {
    const { error } = await supabase
      .from("admin_accounts")
      .delete()
      .eq("email", emailLower)

    if (!error) success = true
  } catch {}

  // Update localStorage cache
  const current = getCreatedAdminAccountsLocal()
  const updated = current.filter(a => a.email.toLowerCase().trim() !== emailLower)
  if (typeof window !== "undefined") {
    const json = JSON.stringify(updated)
    localStorage.setItem("issac_created_admins", json)
    document.cookie = "issac_created_admins=" + encodeURIComponent(json) + "; path=/; max-age=2592000; SameSite=Lax"
  }

  // Track in deleted admin emails
  const deletedEmails = await getDeletedAdminEmailsFromDB()
  if (!deletedEmails.includes(emailLower)) {
    deletedEmails.push(emailLower)
  }

  if (typeof window !== "undefined") {
    const dJson = JSON.stringify(deletedEmails)
    localStorage.setItem("issac_deleted_admin_emails", dJson)
    document.cookie = `issac_deleted_admin_emails=${encodeURIComponent(dJson)}; path=/; max-age=2592000; SameSite=Lax`
  }

  // Sync to Supabase audit_logs
  try {
    await supabase.from('audit_logs').insert({
      action: 'SYNC_ADMIN_ACCOUNTS',
      user_name: 'BCN',
      description: JSON.stringify(updated)
    })
    await supabase.from('audit_logs').insert({
      action: 'SYNC_DELETED_ADMINS',
      user_name: 'BCN',
      description: JSON.stringify(deletedEmails)
    })
    success = true
  } catch {}

  // Also try deleted_accounts table
  try {
    await supabase.from("deleted_accounts").upsert({
      target_id: emailLower,
      target_email: emailLower,
      account_type: "admin",
      deleted_by: "BCN",
    }, { onConflict: "target_id" })
  } catch {}

  return success
}

/**
 * Update an existing admin account in DB + cross-device sync.
 */
export async function updateCreatedAdminInDB(
  email: string,
  updates: Partial<CreatedAdminAccount>
): Promise<boolean> {
  const emailLower = email.toLowerCase().trim()
  const supabase = createClient()
  let success = false

  try {
    const { error } = await supabase
      .from("admin_accounts")
      .update({
        ...(updates.full_name !== undefined ? { full_name: updates.full_name } : {}),
        ...(updates.admin_role !== undefined ? { admin_role: updates.admin_role } : {}),
        ...(updates.title !== undefined ? { title: updates.title } : {}),
        ...(updates.password !== undefined ? { password: updates.password } : {}),
        ...(updates.is_active !== undefined ? { is_active: updates.is_active } : {}),
      })
      .eq("email", emailLower)

    if (!error) success = true
  } catch {}

  // Update localStorage cache
  const current = getCreatedAdminAccountsLocal()
  const idx = current.findIndex(a => a.email.toLowerCase().trim() === emailLower)
  if (idx >= 0) {
    current[idx] = { ...current[idx], ...updates }
    if (typeof window !== "undefined") {
      const json = JSON.stringify(current)
      localStorage.setItem("issac_created_admins", json)
      document.cookie = "issac_created_admins=" + encodeURIComponent(json) + "; path=/; max-age=2592000; SameSite=Lax"
    }

    // Sync to Supabase audit_logs
    try {
      await supabase.from('audit_logs').insert({
        action: 'SYNC_ADMIN_ACCOUNTS',
        user_name: 'BCN',
        description: JSON.stringify(current)
      })
      success = true
    } catch {}
  }

  return success
}

// ============================================================
// ADMIN CHANGE REQUESTS (kept in localStorage for now, minor feature)
// ============================================================

export function getAdminRequests(): AdminChangeRequest[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem("issac_admin_requests")
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) return parsed
    }
  } catch {}
  return []
}

export function saveAdminRequests(requests: AdminChangeRequest[]) {
  if (typeof window !== "undefined") {
    localStorage.setItem("issac_admin_requests", JSON.stringify(requests))
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
