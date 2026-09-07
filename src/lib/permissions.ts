export type AdminRoleType = 'chu-nhiem' | 'truyen-thong' | 'tu-van' | 'nhan-su'

export interface AdminRoleConfig {
  slug: AdminRoleType
  label: string
  shortLabel: string
  departmentName: string
  badgeColor: string
  isSuperAdmin: boolean
  canEvaluateAll: boolean
  canManageAllQuestions: boolean
  canPublishFinalResults: boolean
  canManageAdmins: boolean
}

export const ADMIN_ROLE_CONFIGS: Record<AdminRoleType, AdminRoleConfig> = {
  'chu-nhiem': {
    slug: 'chu-nhiem',
    label: 'Ban Chủ nhiệm',
    shortLabel: 'Ban Chủ nhiệm',
    departmentName: 'Toàn bộ các Ban',
    badgeColor: 'bg-amber-100 text-amber-900 border-amber-300',
    isSuperAdmin: true,
    canEvaluateAll: true,
    canManageAllQuestions: true,
    canPublishFinalResults: true,
    canManageAdmins: true,
  },
  'truyen-thong': {
    slug: 'truyen-thong',
    label: 'Ban Truyền thông',
    shortLabel: 'Ban Truyền thông',
    departmentName: 'Ban Truyền thông',
    badgeColor: 'bg-blue-100 text-blue-900 border-blue-300',
    isSuperAdmin: false,
    canEvaluateAll: false,
    canManageAllQuestions: false,
    canPublishFinalResults: false,
    canManageAdmins: false,
  },
  'tu-van': {
    slug: 'tu-van',
    label: 'Ban Tư vấn',
    shortLabel: 'Ban Tư vấn',
    departmentName: 'Ban Tư vấn',
    badgeColor: 'bg-emerald-100 text-emerald-900 border-emerald-300',
    isSuperAdmin: false,
    canEvaluateAll: false,
    canManageAllQuestions: false,
    canPublishFinalResults: false,
    canManageAdmins: false,
  },
  'nhan-su': {
    slug: 'nhan-su',
    label: 'Ban Nhân sự',
    shortLabel: 'Ban Nhân sự',
    departmentName: 'Ban Nhân sự',
    badgeColor: 'bg-purple-100 text-purple-900 border-purple-300',
    isSuperAdmin: false,
    canEvaluateAll: false,
    canManageAllQuestions: false,
    canPublishFinalResults: false,
    canManageAdmins: false,
  },
}

export function getAdminRoleFromCookie(cookieString?: string): AdminRoleType {
  if (!cookieString) return 'chu-nhiem'
  const match = cookieString.match(/issac_admin_role=([^;]+)/)
  if (match && match[1] in ADMIN_ROLE_CONFIGS) {
    return match[1] as AdminRoleType
  }
  return 'chu-nhiem'
}

export function canEvaluateCandidate(adminRole: string | undefined, candidateDeptSlug: string | undefined): boolean {
  if (!adminRole || adminRole === 'chu-nhiem' || adminRole === 'super_admin') return true
  return adminRole === candidateDeptSlug
}

export function canManageQuestion(adminRole: string | undefined, questionDeptSlug: string | null | undefined): boolean {
  if (!adminRole || adminRole === 'chu-nhiem' || adminRole === 'super_admin') return true
  if (!questionDeptSlug) return false
  return adminRole === questionDeptSlug
}
