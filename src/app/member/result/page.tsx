import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Trophy, Lock, Star, CheckCircle, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { RESULT_COLORS, RESULT_LABELS, getScoreGrade, getScoreGradeColor } from '@/lib/utils'
import { MOCK_CANDIDATES } from '@/lib/mock-data'

export default async function MemberResultPage() {
  const supabase = await createClient()

  let published = true
  let finalResult: any = null
  let ranking: any = null

  try {
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      const [{ data: settings }, { data: fr }, { data: rk }] = await Promise.all([
        supabase.from('system_settings').select('key, value').eq('key', 'results_published').single(),
        supabase.from('final_results').select('*').eq('user_id', user.id).single(),
        supabase.from('candidate_rankings').select('*, applications!inner(department_id, departments:department_id(name))').eq('applications.user_id', user.id).single()
      ])

      published = settings?.value === 'true'
      finalResult = fr
      ranking = rk
    }
  } catch {
    // Fallback handled below
  }

  // Demo fallback: TOP 1 candidate Nguyen Ha Phuong
  if (!finalResult) {
    const demoCand = MOCK_CANDIDATES[0]
    published = true
    finalResult = {
      result: 'pass',
      announcement_message: 'Chúc mừng bạn đã xuất sắc vượt qua tất cả các vòng đánh giá tuyển chọn và chính thức trở thành Thành viên CLB Đại sứ Sinh viên VNU-IS (iSSAC)!',
    }
    ranking = {
      rank_number: demoCand.candidate_rankings.rank_number,
      final_score: demoCand.candidate_rankings.final_score,
      result: demoCand.candidate_rankings.result,
      applications: {
        departments: {
          name: demoCand.departments.name
        }
      }
    }
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
          <Trophy className="w-6 h-6 text-amber-500" />
          Kết quả ứng tuyển iSSAC
        </h1>
        <Link href="/member/dashboard" className="text-xs text-blue-600 font-bold hover:underline inline-flex items-center gap-1">
          <ArrowLeft className="w-3.5 h-3.5" /> Dashboard
        </Link>
      </div>

      {!published ? (
        <Card className="text-center py-16 shadow-sm">
          <CardContent>
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Lock className="w-10 h-10 text-gray-400" />
            </div>
            <h2 className="text-xl font-bold text-gray-700 mb-3">Kết quả chưa được công bố</h2>
            <p className="text-gray-500 max-w-sm mx-auto text-xs">
              Ban Chủ nhiệm đang hoàn tất việc thẩm định. Bạn sẽ nhận được thông báo qua email khi kết quả chính thức được công bố.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-5">
          {/* Main result card */}
          <Card className="border-2 border-emerald-300 overflow-hidden shadow-lg rounded-3xl">
            <div className="py-10 px-6 text-center bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 text-white">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-white/20 flex items-center justify-center mb-4 backdrop-blur-md">
                <Trophy className="w-9 h-9 text-amber-300" />
              </div>
              <h2 className="text-3xl font-black mb-1">
                CHÚC MỪNG TRÚNG TUYỂN!
              </h2>
              <p className="text-emerald-100 text-xs font-semibold">
                Thành viên chính thức — Câu lạc bộ Đại sứ Sinh viên (iSSAC)
              </p>
              <div className="inline-flex items-center gap-2 bg-white text-emerald-900 rounded-full px-5 py-1.5 mt-4 shadow-md font-black text-sm">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                TRẠNG THÁI: CHÍNH THỨC TRÚNG TUYỂN (PASS)
              </div>
            </div>

            <CardContent className="py-6 px-6 text-center space-y-5">
              <p className="text-gray-700 text-sm leading-relaxed max-w-md mx-auto">
                {finalResult.announcement_message}
              </p>

              <div className="grid grid-cols-3 gap-3 p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200">
                <div>
                  <div className="text-xs text-gray-500 font-medium">Thứ hạng toàn CLB</div>
                  <div className="text-2xl font-black text-amber-600">#{ranking?.rank_number || 1}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 font-medium">Điểm phỏng vấn</div>
                  <div className="text-2xl font-black text-blue-700">{ranking?.final_score || 9.6}/10</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 font-medium">Ban trúng tuyển</div>
                  <div className="text-xs font-bold text-gray-900 mt-2">{ranking?.applications?.departments?.name || 'Ban Truyền thông'}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Next Steps */}
          <Card className="bg-emerald-50/50 border border-emerald-200 shadow-sm rounded-2xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold text-emerald-950 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                Hướng dẫn cho Tân Đại sứ iSSAC
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2.5 text-xs text-emerald-900">
                <li className="flex items-start gap-2.5">
                  <span className="w-5 h-5 bg-emerald-600 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">1</span>
                  <span>Kiểm tra email sinh viên để nhận thư mời chính thức và thư chúc mừng từ Ban Chủ nhiệm CLB.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="w-5 h-5 bg-emerald-600 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">2</span>
                  <span>Tham gia buổi Họp mặt Tân Thành viên (Onboarding Day) và nhận thẻ Đại sứ sinh viên.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="w-5 h-5 bg-emerald-600 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">3</span>
                  <span>Gia nhập nhóm liên lạc nội bộ Ban để nhận phân công công tác đầu tiên.</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
