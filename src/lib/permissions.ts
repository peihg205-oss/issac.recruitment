export type AdminRoleType = 'chu-nhiem' | 'truyen-thong' | 'tu-van' | 'nhan-su'

export interface EvaluatorAccountInfo {
  id: string
  name: string
  email: string
  title: string
  departmentName: string
  role: AdminRoleType
  avatarInitial: string
}

export const EVALUATOR_ACCOUNTS: Record<AdminRoleType, EvaluatorAccountInfo> = {
  'chu-nhiem': {
    id: 'adm-bcn',
    name: 'Trần Phương Linh',
    email: 'ambassadors.club@vnuis.edu.vn',
    title: 'Chủ nhiệm CLB iSSAC',
    departmentName: 'Ban Chủ nhiệm',
    role: 'chu-nhiem',
    avatarInitial: 'L',
  },
  'truyen-thong': {
    id: 'adm-tt',
    name: 'Vũ Đình Hải',
    email: 'dinhhai.issac@vnu.edu.vn',
    title: 'Phó Ban Truyền thông',
    departmentName: 'Ban Truyền thông',
    role: 'truyen-thong',
    avatarInitial: 'H',
  },
  'tu-van': {
    id: 'adm-tv',
    name: 'Lê Hải Yến',
    email: 'haiyen.issac@vnu.edu.vn',
    title: 'Trưởng Ban Tư vấn',
    departmentName: 'Ban Tư vấn',
    role: 'tu-van',
    avatarInitial: 'Y',
  },
  'nhan-su': {
    id: 'adm-ns',
    name: 'Phạm Minh Đức',
    email: 'minhduc.issac@vnu.edu.vn',
    title: 'Trưởng Ban Nhân sự',
    departmentName: 'Ban Nhân sự',
    role: 'nhan-su',
    avatarInitial: 'Đ',
  },
}

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
  canMakeFinalDecision: boolean
  canGrantProposalPermission: boolean
}

export const ADMIN_ROLE_CONFIGS: Record<AdminRoleType, AdminRoleConfig> = {
  'chu-nhiem': {
    slug: 'chu-nhiem',
    label: 'Trần Phương Linh',
    shortLabel: 'Chủ nhiệm CLB iSSAC',
    departmentName: 'Toàn bộ CLB',
    badgeColor: 'bg-amber-100 text-amber-900 border-amber-300',
    isSuperAdmin: true,
    canEvaluateAll: true,
    canManageAllQuestions: true,
    canPublishFinalResults: true,
    canManageAdmins: true,
    canMakeFinalDecision: true,
    canGrantProposalPermission: true,
  },
  'truyen-thong': {
    slug: 'truyen-thong',
    label: 'Vũ Đình Hải',
    shortLabel: 'Phó Ban Truyền thông',
    departmentName: 'Ban Truyền thông',
    badgeColor: 'bg-blue-100 text-blue-900 border-blue-300',
    isSuperAdmin: false,
    canEvaluateAll: false,
    canManageAllQuestions: false,
    canPublishFinalResults: false,
    canManageAdmins: false,
    canMakeFinalDecision: false,
    canGrantProposalPermission: false,
  },
  'tu-van': {
    slug: 'tu-van',
    label: 'Lê Hải Yến',
    shortLabel: 'Trưởng Ban Tư vấn',
    departmentName: 'Ban Tư vấn',
    badgeColor: 'bg-emerald-100 text-emerald-900 border-emerald-300',
    isSuperAdmin: false,
    canEvaluateAll: false,
    canManageAllQuestions: false,
    canPublishFinalResults: false,
    canManageAdmins: false,
    canMakeFinalDecision: false,
    canGrantProposalPermission: false,
  },
  'nhan-su': {
    slug: 'nhan-su',
    label: 'Phạm Minh Đức',
    shortLabel: 'Trưởng Ban Nhân sự',
    departmentName: 'Ban Nhân sự',
    badgeColor: 'bg-purple-100 text-purple-900 border-purple-300',
    isSuperAdmin: false,
    canEvaluateAll: false,
    canManageAllQuestions: false,
    canPublishFinalResults: false,
    canManageAdmins: false,
    canMakeFinalDecision: false,
    canGrantProposalPermission: false,
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

export function getActiveRoleConfig(role: AdminRoleType, cookieString?: string): AdminRoleConfig {
  const base = ADMIN_ROLE_CONFIGS[role] || ADMIN_ROLE_CONFIGS["chu-nhiem"]
  let cookieVal = cookieString
  if (!cookieVal && typeof document !== "undefined") {
    cookieVal = document.cookie
  }
  if (cookieVal) {
    const match = cookieVal.match(/issac_admin_accounts=([^;]+)/)
    if (match) {
      try {
        const parsed = JSON.parse(decodeURIComponent(match[1]))
        if (parsed[role]) {
          return {
            ...base,
            label: parsed[role].name || base.label,
            shortLabel: parsed[role].title || base.shortLabel,
          }
        }
      } catch {}
    }
  }
  return base
}
