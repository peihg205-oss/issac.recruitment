import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { ADMIN_ROLE_CONFIGS, getActiveRoleConfig, EVALUATOR_ACCOUNTS, type AdminRoleType } from '@/lib/permissions'
import EvaluationListClient from './EvaluationListClient'

export default async function EvaluationListPage() {
  const cookieStore = await cookies()
  const activeRoleFromCookie = cookieStore.get('issac_admin_role')?.value as AdminRoleType | undefined
  const activeRole: AdminRoleType = (activeRoleFromCookie && activeRoleFromCookie in ADMIN_ROLE_CONFIGS)
    ? activeRoleFromCookie
    : 'chu-nhiem'

  const roleConfig = getActiveRoleConfig(activeRole, cookieStore.toString())
  const isSuperAdmin = roleConfig.isSuperAdmin

  const supabase = await createClient()
  let apps: any[] = []

  try {
    const { data: rawApps } = await supabase
      .from('applications')
      .select(`
        id, user_id, department_id, status, submitted_at, created_at,
        departments!applications_department_id_fkey(name, slug),
        evaluations(id, status, total_score, interviewer_id, overall_comment, strengths, weaknesses, recommendation, submitted_at),
        candidate_rankings(rank_number, final_score, result)
      `)
      .neq('status', 'draft')
      .order('created_at', { ascending: false })

    if (rawApps && rawApps.length > 0) {
      const candidateUserIds = Array.from(new Set(rawApps.map((a: any) => a.user_id).filter(Boolean)))
      const interviewerIds = Array.from(new Set(
        rawApps.map((a: any) => {
          const ev = Array.isArray(a.evaluations) ? a.evaluations[0] : a.evaluations
          return ev?.interviewer_id
        }).filter(Boolean)
      ))
      const allUserIds = Array.from(new Set([...candidateUserIds, ...interviewerIds]))

      let profilesMap: Record<string, any> = {}
      if (allUserIds.length > 0) {
        const { data: profs } = await supabase
          .from('profiles')
          .select('id, full_name, email, student_id, phone')
          .in('id', allUserIds)
        if (profs) {
          profs.forEach((p: any) => { profilesMap[p.id] = p })
        }
      }

      apps = rawApps.map((a: any) => {
        const ev = Array.isArray(a.evaluations) ? a.evaluations[0] : a.evaluations
        const candidateProfile = profilesMap[a.user_id] || { full_name: 'Ứng viên', email: '', student_id: '' }
        const interviewerProfile = ev?.interviewer_id ? profilesMap[ev.interviewer_id] : null

        let parsedGrader: any = null
        if (ev?.overall_comment && typeof ev.overall_comment === 'string' && ev.overall_comment.startsWith('{')) {
          try {
            const pc = JSON.parse(ev.overall_comment)
            if (pc.grader) parsedGrader = pc.grader
          } catch {}
        }

        const deptSlug = (a.departments?.slug || 'truyen-thong') as AdminRoleType
        const defaultDeptEvaluator = EVALUATOR_ACCOUNTS[deptSlug] || EVALUATOR_ACCOUNTS['truyen-thong']

        const hasScore = (ev?.total_score != null) ||
          (Array.isArray(a.candidate_rankings) && a.candidate_rankings[0]?.final_score != null) ||
          (a.candidate_rankings?.final_score != null)

        const evaluator = parsedGrader || (interviewerProfile ? {
          name: interviewerProfile.full_name,
          email: interviewerProfile.email,
        } : (hasScore ? {
          name: defaultDeptEvaluator.name,
          email: defaultDeptEvaluator.email,
        } : null))

        return {
          ...a,
          profiles: candidateProfile,
          candidate_rankings: Array.isArray(a.candidate_rankings) ? a.candidate_rankings[0] : a.candidate_rankings,
          evaluation_data: ev ? {
            dept_recommendation: ev.recommendation,
            bcn_decision: (a.candidate_rankings as any)?.result || 'pending',
            bcn_note: ev.overall_comment,
          } : null,
          evaluator
        }
      })
    }
  } catch (err) {
    console.error('Error in evaluation page:', err)
  }

  return (
    <EvaluationListClient
      initialApps={apps}
      roleConfig={roleConfig}
      activeRole={activeRole}
      isSuperAdmin={isSuperAdmin}
    />
  )
}
