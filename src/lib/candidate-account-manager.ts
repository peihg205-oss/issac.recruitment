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

export async function deleteCandidateAccount(candidateId?: string | null, email?: string | null, userId?: string | null): Promise<void> {
  const current = getDeletedCandidateIds()
  const newItems: string[] = []

  if (candidateId) newItems.push(candidateId)
  if (email) newItems.push(email.toLowerCase().trim())
  if (userId) newItems.push(userId)

  const updated = Array.from(new Set([...current, ...newItems]))

  // 1. Save to localStorage & Cookie
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

  // 2. Try deleting/deactivating in Supabase Database
  try {
    const supabase = createClient()

    // Delete application related tables if application id exists
    if (candidateId && !candidateId.startsWith('reg-')) {
      await supabase.from('application_answers').delete().eq('application_id', candidateId)
      await supabase.from('evaluations').delete().eq('application_id', candidateId)
      await supabase.from('candidate_rankings').delete().eq('application_id', candidateId)
      await supabase.from('interviews').delete().eq('application_id', candidateId)
      await supabase.from('applications').delete().eq('id', candidateId)
    }

    if (userId) {
      await supabase.from('applications').delete().eq('user_id', userId)
      await supabase.from('profiles').update({ role: 'deleted', is_active: false }).eq('id', userId)
    }

    if (email) {
      const emailLower = email.toLowerCase().trim()
      await supabase.from('profiles').update({ role: 'deleted', is_active: false }).eq('email', emailLower)
    }
  } catch (err) {
    console.warn('Could not complete DB delete for candidate:', err)
  }
}

export function isCandidateDeleted(candidateId?: string | null, email?: string | null, userId?: string | null): boolean {
  const deleted = getDeletedCandidateIds()

  if (candidateId && deleted.includes(candidateId)) return true
  if (email && deleted.includes(email.toLowerCase().trim())) return true
  if (userId && deleted.includes(userId)) return true

  return false
}
