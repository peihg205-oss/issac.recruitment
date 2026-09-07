import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { ADMIN_ROLE_CONFIGS, type AdminRoleType } from '@/lib/permissions'
import { MOCK_CANDIDATES } from '@/lib/mock-data'
import RankingManager from './RankingManager'

export default async function RankingPage() {
  const supabase = await createClient()
  const cookieStore = await cookies()

  const activeRole = (cookieStore.get('issac_admin_role')?.value as AdminRoleType) || 'chu-nhiem'
  let isSuperAdmin = activeRole === 'chu-nhiem'

  let rankings: any[] | null = null
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
          *,
          applications!inner(
            id, status,
            profiles:user_id(full_name, student_id, email, phone, major, cohort),
            departments!applications_department_id_fkey(name, slug)
          )
        `)
        .order('rank_number', { ascending: true, nullsFirst: false }),
      supabase
        .from('system_settings')
        .select('key, value')
        .in('key', ['recruitment_quota', 'results_published'])
    ])
    rankings = ranksRes.data
    settings = settsRes.data
  } catch {
    // Demo fallback
  }

  const quota = parseInt(settings?.find(s => s.key === 'recruitment_quota')?.value || '15')
  const published = settings?.find(s => s.key === 'results_published')?.value === 'true'

  // Map to RankingCandidate structure
  const candidates = (rankings && rankings.length > 0)
    ? rankings.map(r => {
        const app = r.applications as any
        return {
          id: app.id,
          profiles: app.profiles,
          departments: app.departments,
          candidate_rankings: {
            rank_number: r.rank_number,
            final_score: r.final_score,
            result: r.result,
          }
        }
      })
    : MOCK_CANDIDATES

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
