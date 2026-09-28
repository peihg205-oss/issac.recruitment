// Candidate Account & Password Management for Admin
import { createClient } from './supabase/client'

const CREDENTIALS_STORAGE_KEY = "issac_candidate_credentials"
const DELETED_CANDIDATES_KEY = "issac_deleted_candidates"

// Default password for candidate demo accounts if not yet changed
export const DEFAULT_CANDIDATE_PASSWORD = "issac@2026"

export interface CandidateCredential {
  email: string
  password: string
  updatedAt: string
}

function getStoredCredentials(): Record<string, string> {
  if (typeof window === "undefined") return {}
  try {
    const raw = localStorage.getItem(CREDENTIALS_STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

export function getCandidatePassword(email: string): string {
  if (!email) return DEFAULT_CANDIDATE_PASSWORD
  const stored = getStoredCredentials()
  const key = email.toLowerCase().trim()
  return stored[key] || DEFAULT_CANDIDATE_PASSWORD
}

export function setCandidatePassword(email: string, newPass: string): void {
  if (!email || !newPass || typeof window === "undefined") return
  const stored = getStoredCredentials()
  const key = email.toLowerCase().trim()
  stored[key] = newPass.trim()
  localStorage.setItem(CREDENTIALS_STORAGE_KEY, JSON.stringify(stored))
}

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null
  const match = document.cookie.match(new RegExp("(?:^|;\\s*)" + name + "=([^;]+)"))
  return match ? decodeURIComponent(match[1]) : null
}

function setCookie(name: string, value: string, days = 60) {
  if (typeof document === "undefined") return
  const expires = new Date(Date.now() + days * 864e5).toUTCString()
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; expires=${expires}; SameSite=Lax`
}

/**
 * Get deleted candidate IDs from localStorage + cookie cache.
 * For cross-device sync, use getDeletedCandidateIdsFromDB() or isDeletedInDB().
 */
export function getDeletedCandidateIds(): string[] {
  let list: string[] = []

  // 1. Read from localStorage
  if (typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem(DELETED_CANDIDATES_KEY)
      if (raw) {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed)) list.push(...parsed)
      }
    } catch {}
  }

  // 2. Read from Cookie
  const cookieVal = getCookie(DELETED_CANDIDATES_KEY)
  if (cookieVal) {
    try {
      const parsed = JSON.parse(cookieVal)
      if (Array.isArray(parsed)) list.push(...parsed)
    } catch {}
  }

  return Array.from(new Set(list))
}

export function parseDeletedCandidateIdsFromCookie(cookieString?: string | null): string[] {
  if (!cookieString) return []
  try {
    const match = cookieString.match(new RegExp("(?:^|;\\s*)" + DELETED_CANDIDATES_KEY + "=([^;]+)"))
    if (match) {
      const parsed = JSON.parse(decodeURIComponent(match[1]))
      if (Array.isArray(parsed)) return parsed
    }
  } catch {}
  return []
}

/**
 * Fetch deleted candidate identifiers from Supabase DB (cross-device sync).
 * Checks audit_logs (SYNC_DELETED_CANDIDATES), deleted_accounts, and inactive profiles.
 */
export async function getDeletedCandidateIdsFromDB(): Promise<string[]> {
  const list = new Set<string>(getDeletedCandidateIds())

  try {
    const supabase = createClient()

    // 1. Check inactive profiles in DB
    const { data: inactiveProfiles } = await supabase
      .from('profiles')
      .select('id, email')
      .eq('is_active', false)

    if (inactiveProfiles && inactiveProfiles.length > 0) {
      inactiveProfiles.forEach(p => {
        if (p.id) list.add(p.id)
        if (p.email) list.add(p.email.toLowerCase().trim())
      })
    }

    // 2. Check audit_logs SYNC_DELETED_CANDIDATES (works cross-device without requiring schema migration)
    const { data: syncLogs } = await supabase
      .from('audit_logs')
      .select('description')
      .eq('action', 'SYNC_DELETED_CANDIDATES')
      .order('created_at', { ascending: false })
      .limit(1)

    if (syncLogs && syncLogs.length > 0 && syncLogs[0].description) {
      try {
        const parsed = JSON.parse(syncLogs[0].description)
        if (Array.isArray(parsed)) {
          parsed.forEach((item: string) => list.add(item.toLowerCase().trim()))
        }
      } catch {}
    }

    // 3. Check deleted_accounts table if available
    try {
      const { data: deletedAccs } = await supabase
        .from('deleted_accounts')
        .select('target_id, target_email')
        .eq('account_type', 'candidate')

      if (deletedAccs && deletedAccs.length > 0) {
        deletedAccs.forEach(d => {
          if (d.target_id) list.add(d.target_id)
          if (d.target_email) list.add(d.target_email.toLowerCase().trim())
        })
      }
    } catch {}
  } catch (err) {
    console.warn('Error fetching deleted candidates from DB:', err)
  }

  const result = Array.from(list)

  // Cache to localStorage and cookie for instant next render
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(DELETED_CANDIDATES_KEY, JSON.stringify(result))
      setCookie(DELETED_CANDIDATES_KEY, JSON.stringify(result))
    } catch {}
  }

  return result
}

/**
 * Check if a candidate is deleted by checking Supabase DB first,
 * then falling back to local cache.
 */
export async function isDeletedInDB(
  candidateId?: string | null,
  email?: string | null,
  userId?: string | null
): Promise<boolean> {
  // 1. Quick local check first
  if (isCandidateDeleted(candidateId, email, userId)) return true

  // 2. Check Supabase DB (profiles table)
  try {
    const supabase = createClient()

    if (userId) {
      const { data } = await supabase
        .from('profiles')
        .select('id, is_active')
        .eq('id', userId)
        .maybeSingle()

      if (data && data.is_active === false) return true
    }

    if (email) {
      const emailLower = email.toLowerCase().trim()
      const { data } = await supabase
        .from('profiles')
        .select('id, is_active')
        .eq('email', emailLower)
        .maybeSingle()

      if (data && data.is_active === false) return true
    }

    // 3. Check audit_logs SYNC_DELETED_CANDIDATES
    const { data: syncLogs } = await supabase
      .from('audit_logs')
      .select('description')
      .eq('action', 'SYNC_DELETED_CANDIDATES')
      .order('created_at', { ascending: false })
      .limit(1)

    if (syncLogs && syncLogs.length > 0 && syncLogs[0].description) {
      try {
        const parsed = JSON.parse(syncLogs[0].description)
        if (Array.isArray(parsed)) {
          const emailLower = email?.toLowerCase().trim()
          if (candidateId && parsed.includes(candidateId)) return true
          if (emailLower && parsed.includes(emailLower)) return true
          if (userId && parsed.includes(userId)) return true
        }
      } catch {}
    }

    // 4. Check deleted_accounts table
    if (candidateId || email || userId) {
      const targets = [candidateId, email?.toLowerCase().trim(), userId].filter(Boolean) as string[]
      const { data } = await supabase
        .from('deleted_accounts')
        .select('id')
        .eq('account_type', 'candidate')
        .in('target_id', targets)
        .limit(1)

      if (data && data.length > 0) return true
    }
  } catch {}

  return false
}

export async function deleteCandidateAccount(candidateId?: string | null, email?: string | null, userId?: string | null): Promise<void> {
  const current = getDeletedCandidateIds()
  const newItems: string[] = []

  if (candidateId) newItems.push(candidateId)
  if (email) newItems.push(email.toLowerCase().trim())
  if (userId) newItems.push(userId)

  const updated = Array.from(new Set([...current, ...newItems]))

  // 1. Save to localStorage & Cookie (local cache)
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(DELETED_CANDIDATES_KEY, JSON.stringify(updated))
      setCookie(DELETED_CANDIDATES_KEY, JSON.stringify(updated))
      window.dispatchEvent(new CustomEvent('issac_candidate_deleted', { detail: { candidateId, email, userId } }))
      window.dispatchEvent(new Event('issac_candidates_updated'))
      window.dispatchEvent(new Event('storage'))

      if ('BroadcastChannel' in window) {
        const bc = new BroadcastChannel('issac_candidates_channel')
        bc.postMessage({ type: 'candidate_deleted', candidateId, email, userId })
        bc.close()
      }
    } catch {}
  }

  // 2. Save to Supabase Database (cross-device sync)
  try {
    const supabase = createClient()

    // 2.1 Mark profile as inactive (CRITICAL: Do NOT set role='deleted' as it violates DB constraint)
    if (userId) {
      await supabase.from('applications').delete().eq('user_id', userId)
      await supabase.from('profiles').update({ is_active: false }).eq('id', userId)
    }

    if (email) {
      const emailLower = email.toLowerCase().trim()
      await supabase.from('profiles').update({ is_active: false }).eq('email', emailLower)
    }

    // 2.2 Delete application related tables if application id exists
    if (candidateId && !candidateId.startsWith('reg-')) {
      await supabase.from('application_answers').delete().eq('application_id', candidateId)
      await supabase.from('evaluations').delete().eq('application_id', candidateId)
      await supabase.from('candidate_rankings').delete().eq('application_id', candidateId)
      await supabase.from('interviews').delete().eq('application_id', candidateId)
      await supabase.from('applications').delete().eq('id', candidateId)
    }

    // 2.3 Record in audit_logs for cross-device sync across all phones & laptops
    await supabase.from('audit_logs').insert({
      action: 'SYNC_DELETED_CANDIDATES',
      user_name: 'BCN',
      description: JSON.stringify(updated)
    })

    // 2.4 Record in deleted_accounts table if table exists
    for (const item of newItems) {
      try {
        await supabase.from('deleted_accounts').upsert({
          target_id: item,
          target_email: email?.toLowerCase().trim() || item,
          account_type: 'candidate',
          deleted_by: 'BCN',
        }, { onConflict: 'target_id' })
      } catch {}
    }
  } catch (err) {
    console.warn('Could not complete DB delete for candidate:', err)
  }
}

/**
 * Sync check: local-only, fast, no network. Use for immediate UI blocking.
 * For cross-device accuracy, use isDeletedInDB().
 */
export function isCandidateDeleted(candidateId?: string | null, email?: string | null, userId?: string | null): boolean {
  const deleted = getDeletedCandidateIds()

  if (candidateId && deleted.includes(candidateId)) return true
  if (email && deleted.includes(email.toLowerCase().trim())) return true
  if (userId && deleted.includes(userId)) return true

  return false
}
