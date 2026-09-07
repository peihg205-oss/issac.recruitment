import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Trophy, Lock, Star } from 'lucide-react'
import { RESULT_COLORS, RESULT_LABELS, getScoreGrade, getScoreGradeColor } from '@/lib/utils'

export default async function MemberResultPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: settings } = await supabase
    .from('system_settings')
    .select('key, value')
    .eq('key', 'results_published')

  const published = settings?.find(s => s.key === 'results_published')?.value === 'true'

  const { data: finalResult } = await supabase
    .from('final_results')
    .select('*')
    .eq('user_id', user.id)
    .single()

  const { data: ranking } = await supabase
    .from('candidate_rankings')
    .select('*, applications!inner(department_id, departments:department_id(name))')
    .eq('applications.user_id', user.id)
    .single()

  return (
    <div className="space-y-6 max-w-2xl mx-auto animate-fade-in">
      <div>
        <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
          <Trophy className="w-6 h-6 text-amber-500" />
          Kết quả ứng tuyển
        </h1>
      </div>

      {!published ? (
        <Card className="text-center py-16">
          <CardContent>
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Lock className="w-10 h-10 text-gray-400" />
            </div>
            <h2 className="text-xl font-bold text-gray-700 mb-3">Kết quả chưa được công bố</h2>
            <p className="text-gray-500 max-w-sm mx-auto">
              Ban Chủ nhiệm chưa công bố kết quả. Bạn sẽ nhận được thông báo qua email và hệ thống khi kết quả được công bố.
            </p>
          </CardContent>
        </Card>
      ) : !finalResult ? (
        <Card className="text-center py-16">
          <CardContent>
            <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Trophy className="w-10 h-10 text-blue-400" />
            </div>
            <h2 className="text-xl font-bold text-gray-700 mb-3">Chưa có kết quả cho bạn</h2>
            <p className="text-gray-500">Bạn chưa có đơn ứng tuyển hoặc chưa hoàn thành quá trình tuyển dụng.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {/* Main result card */}
          <Card className={`border-2 overflow-hidden ${
            finalResult.result === 'pass' ? 'border-green-400' :
            finalResult.result === 'waitlist' ? 'border-amber-400' :
            'border-gray-200'
          }`}>
            <div className={`py-12 text-center ${
              finalResult.result === 'pass' ? 'bg-gradient-to-br from-green-500 to-emerald-600' :
              finalResult.result === 'waitlist' ? 'bg-gradient-to-br from-amber-500 to-orange-500' :
              'bg-gradient-to-br from-gray-500 to-gray-600'
            }`}>
              <div className="text-6xl mb-4">
                {finalResult.result === 'pass' ? '🎉' : finalResult.result === 'waitlist' ? '⏳' : '😔'}
              </div>
              <h2 className="text-3xl font-black text-white mb-2">
                {finalResult.result === 'pass' ? 'CHÚC MỪNG!' :
                 finalResult.result === 'waitlist' ? 'DANH SÁCH DỰ BỊ' : 'CHƯA TUYỂN'}
              </h2>
              <div className="inline-flex items-center gap-2 bg-white/20 rounded-full px-5 py-2">
                <span className="text-white font-bold text-lg">{RESULT_LABELS[finalResult.result] || finalResult.result}</span>
              </div>
            </div>

            <CardContent className="py-6 text-center">
              {finalResult.announcement_message && (
                <p className="text-gray-700 mb-6 leading-relaxed max-w-md mx-auto">
                  {finalResult.announcement_message}
                </p>
              )}

              {ranking && ranking.rank_number && (
                <div className="flex justify-center gap-6">
                  <div className="text-center">
                    <div className="text-3xl font-black text-blue-700">#{ranking.rank_number}</div>
                    <div className="text-sm text-gray-500">Xếp hạng</div>
                  </div>
                  {ranking.final_score && (
                    <div className="text-center">
                      <div className={`text-3xl font-black ${getScoreGradeColor(Number(ranking.final_score))}`}>
                        {Number(ranking.final_score).toFixed(1)}
                      </div>
                      <div className="text-sm text-gray-500">Điểm</div>
                    </div>
                  )}
                  {ranking.final_score && (
                    <div className="text-center">
                      <div className="text-xl font-bold text-gray-700">{getScoreGrade(Number(ranking.final_score))}</div>
                      <div className="text-sm text-gray-500">Xếp loại</div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Next steps */}
          {finalResult.result === 'pass' && (
            <Card className="bg-green-50 border-green-200">
              <CardHeader><CardTitle className="text-base text-green-800">Bước tiếp theo</CardTitle></CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-green-700">
                  <li className="flex items-center gap-2">
                    <span className="w-5 h-5 bg-green-600 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">1</span>
                    Chờ email chính thức từ Ban Nhân sự iSSAC.
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-5 h-5 bg-green-600 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">2</span>
                    Tham dự buổi onboarding và nhận nhiệm vụ đầu tiên.
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-5 h-5 bg-green-600 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">3</span>
                    Tham gia nhóm zalo/slack của CLB để cập nhật thông tin.
                  </li>
                </ul>
              </CardContent>
            </Card>
          )}

          {finalResult.result === 'fail' && (
            <Card className="bg-blue-50 border-blue-100">
              <CardContent className="py-5 text-center">
                <Star className="w-8 h-8 text-blue-400 mx-auto mb-3" />
                <p className="text-blue-700 text-sm">
                  Cảm ơn bạn đã tham gia! Đừng bỏ cuộc — iSSAC sẽ mở tuyển thành viên vào mùa tới. Hẹn gặp lại! 💪
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
