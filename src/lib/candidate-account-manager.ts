// Candidate Account & Password Management for Admin

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
  if (!email || typeof window === "undefined") return
  const stored = getStoredCredentials()
  const key = email.toLowerCase().trim()
  stored[key] = newPass.trim()
  localStorage.setItem(CREDENTIALS_STORAGE_KEY, JSON.stringify(stored))
}

export function getDeletedCandidateIds(): string[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(DELETED_CANDIDATES_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function deleteCandidateAccount(candidateId: string, email?: string): void {
  if (typeof window === "undefined") return
  const deleted = getDeletedCandidateIds()
  const updated = Array.from(new Set([...deleted, candidateId, ...(email ? [email.toLowerCase().trim()] : [])]))
  localStorage.setItem(DELETED_CANDIDATES_KEY, JSON.stringify(updated))
}

export function isCandidateDeleted(candidateId: string, email?: string): boolean {
  const deleted = getDeletedCandidateIds()
  if (deleted.includes(candidateId)) return true
  if (email && deleted.includes(email.toLowerCase().trim())) return true
  return false
}
