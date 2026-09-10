import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { ADMIN_ROLE_CONFIGS, type AdminRoleType } from '@/lib/permissions'
import RankingManager from './RankingManager'

export default async function RankingPage() {
  const supabase = await createClient()
  const cookieStore = await cookies()

  const activeRole = (cookieStore.get('issac_admin_role')?.value as AdminRoleType) || 'chu-nhiem'
  let isSuperAdmin = activeRole === 'chu-nhiem'

  let candidates: any[] = []
  let settings: any[] | null = null

  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: profile } = await supabase.from('profiles').select('role, admin_role').eq('id', user.id).single()
      isSuperAdmin = profile?.role === 'super_admin' || profile?.role === 'admin' || activeRole === 'chu-nhiem'
    }

    const [ranksRes, settsRes] = await Promise.all([
      supabase
        .from('candidate_rankings')
        .select(`
          id, rank_number, final_score, result, application_id,
          applications(
            id, user_id, status,
            departments!applications_department_id_fkey(name, slug)
          )
        `)
        .order('rank_number', { ascending: true, nullsFirst: false }),
      supabase
        .from('system_settings')
        .select('key, value')
        .in('key', ['recruitment_quota', 'results_published'])
    ])
    
    settings = settsRes.data
    const rankings = ranksRes.data

    if (rankings && rankings.length > 0) {
      const userIds = Array.from(new Set(
        rankings.map((r: any) => (r.applications as any)?.user_id).filter(Boolean)
      ))

      let profilesMap: Record<string, any> = {}
      if (userIds.length > 0) {
        const { data: profs } = await supabase
          .from('profiles')
          .select('id, full_name, student_id, email, phone, major, cohort')
          .in('id', userIds)
        if (profs) {
          profs.forEach((p: any) => { profilesMap[p.id] = p })
        }
      }

      candidates = rankings.map((r: any) => {
        const app = r.applications as any
        const p = app?.user_id ? profilesMap[app.user_id] : null
        return {
          id: app?.id || r.application_id,
          profiles: p || { full_name: 'Ứng viên', email: '', student_id: '' },
          departments: app?.departments,
          candidate_rankings: {
            rank_number: r.rank_number,
            final_score: r.final_score,
            result: r.result,
          }
        }
      })
    }
  } catch (err) {
    console.error('Error fetching rankings:', err)
  }

  const quota = parseInt(settings?.find(s => s.key === 'recruitment_quota')?.value || '15')
  const published = settings?.find(s => s.key === 'results_published')?.value === 'true'

  return (
    <RankingManager
      initialCandidates={candidates as any}
      isSuperAdmin={isSuperAdmin}
      activeRole={activeRole}
      quota={quota}
      initialPublished={published}
    />
  )
}
