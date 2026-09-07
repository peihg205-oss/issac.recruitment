export type AdminRoleType = "chu-nhiem" | "truyen-thong" | "tu-van" | "nhan-su"

export interface EvaluatorAccountInfo {
  id: string
  name: string
  email: string
  title: string
  departmentName: string
  role: AdminRoleType
}

export const EVALUATOR_ACCOUNTS: Record<AdminRoleType, EvaluatorAccountInfo> = {
  "chu-nhiem": {
    id: "adm-bcn",
    name: "Ban Chủ nhiệm CLB iSSAC",
    email: "bcn@issac.vnu.edu.vn",
    title: "Đại diện Thẩm định & Chấp thuận Cuối cùng",
    departmentName: "Toàn bộ CLB",
    role: "chu-nhiem",
  },
  "truyen-thong": {
    id: "adm-tt",
    name: "Trần Hoàng Nam",
    email: "truyenthong@issac.vnu.edu.vn",
    title: "Giám khảo Chuyên môn / Trưởng Ban Truyền thông",
    departmentName: "Ban Truyền thông",
    role: "truyen-thong",
  },
  "tu-van": {
    id: "adm-tv",
    name: "Lê Hải Yến",
    email: "tuvan@issac.vnu.edu.vn",
    title: "Giám khảo Chuyên môn / Trưởng Ban Tư vấn",
    departmentName: "Ban Tư vấn",
    role: "tu-van",
  },
  "nhan-su": {
    id: "adm-ns",
    name: "Phạm Minh Đức",
    email: "nhansu@issac.vnu.edu.vn",
    title: "Giám khảo Chuyên môn / Trưởng Ban Nhân sự",
    departmentName: "Ban Nhân sự",
    role: "nhan-su",
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
  "chu-nhiem": {
    slug: "chu-nhiem",
    label: "Ban Chủ nhiệm",
    shortLabel: "Ban Chủ nhiệm",
    departmentName: "Toàn bộ các Ban",
    badgeColor: "bg-amber-100 text-amber-900 border-amber-300",
    isSuperAdmin: true,
    canEvaluateAll: true,
    canManageAllQuestions: true,
    canPublishFinalResults: true,
    canManageAdmins: true,
    canMakeFinalDecision: true,
    canGrantProposalPermission: true,
  },
  "truyen-thong": {
    slug: "truyen-thong",
    label: "Ban Truyền thông",
    shortLabel: "Ban Truyền thông",
    departmentName: "Ban Truyền thông",
    badgeColor: "bg-blue-100 text-blue-900 border-blue-300",
    isSuperAdmin: false,
    canEvaluateAll: false,
    canManageAllQuestions: false,
    canPublishFinalResults: false,
    canManageAdmins: false,
    canMakeFinalDecision: false,
    canGrantProposalPermission: false,
  },
  "tu-van": {
    slug: "tu-van",
    label: "Ban Tư vấn",
    shortLabel: "Ban Tư vấn",
    departmentName: "Ban Tư vấn",
    badgeColor: "bg-emerald-100 text-emerald-900 border-emerald-300",
    isSuperAdmin: false,
    canEvaluateAll: false,
    canManageAllQuestions: false,
    canPublishFinalResults: false,
    canManageAdmins: false,
    canMakeFinalDecision: false,
    canGrantProposalPermission: false,
  },
  "nhan-su": {
    slug: "nhan-su",
    label: "Ban Nhân sự",
    shortLabel: "Ban Nhân sự",
    departmentName: "Ban Nhân sự",
    badgeColor: "bg-purple-100 text-purple-900 border-purple-300",
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
  if (!cookieString) return "chu-nhiem"
  const match = cookieString.match(/issac_admin_role=([^;]+)/)
  if (match && match[1] in ADMIN_ROLE_CONFIGS) {
    return match[1] as AdminRoleType
  }
  return "chu-nhiem"
}

export function canEvaluateCandidate(adminRole: string | undefined, candidateDeptSlug: string | undefined): boolean {
  if (!adminRole || adminRole === "chu-nhiem" || adminRole === "super_admin") return true
  return adminRole === candidateDeptSlug
}

export function canManageQuestion(adminRole: string | undefined, questionDeptSlug: string | null | undefined): boolean {
  if (!adminRole || adminRole === "chu-nhiem" || adminRole === "super_admin") return true
  if (!questionDeptSlug) return false
  return adminRole === questionDeptSlug
}
