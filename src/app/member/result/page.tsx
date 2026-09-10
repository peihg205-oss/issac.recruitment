'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import Image from 'next/image'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'
import { Crown, Sparkles, Clock, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react'

interface FinalResultData {
  result: 'pass' | 'waitlist' | 'fail' | string
  announcement_message?: string
  is_published?: boolean
  finalized_at?: string
  published_at?: string
}

export default function MemberResultPage() {
  const supabase = createClient()
  const { toast } = useToast()

  const [loading, setLoading] = useState(true)
  const [published, setPublished] = useState(false)
  const [finalResult, setFinalResult] = useState<FinalResultData | null>(null)
  const [candidateName, setCandidateName] = useState('Ứng viên')
  const [deptName, setDeptName] = useState('Ban Chuyên môn')
  const [hasCelebrated, setHasCelebrated] = useState(false)

  const currentUserIdRef = useRef<string | null>(null)
  const currentAppIdRef = useRef<string | null>(null)

  const fetchResult = useCallback(async (isRealtimeTrigger = false) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        currentUserIdRef.current = user.id

        // Fetch application, settings, final_result, ranking, profile
        const [
          { data: settings },
          { data: app },
          { data: fr },
          { data: rk },
          { data: prof }
        ] = await Promise.all([
          supabase.from('system_settings').select('key, value').eq('key', 'results_published').maybeSingle(),
          supabase.from('applications').select('id, department_id, status, departments:department_id(name)').eq('user_id', user.id).maybeSingle(),
          supabase.from('final_results').select('*').eq('user_id', user.id).maybeSingle(),
          supabase.from('candidate_rankings').select('*, applications!inner(department_id, departments:department_id(name))').eq('applications.user_id', user.id).maybeSingle(),
          supabase.from('profiles').select('full_name').eq('id', user.id).maybeSingle()
        ])

        if (app?.id) {
          currentAppIdRef.current = app.id
        }

        // Check local storage overrides for instant synchronous feedback
        let localPublished = false
        let localCandidateResult: any = null
        if (typeof window !== 'undefined') {
          localPublished = localStorage.getItem('issac_results_published') === 'true'
          const localUserRes = localStorage.getItem(`issac_candidate_result_user_${user.id}`)
          const localAppRes = app?.id ? localStorage.getItem(`issac_candidate_result_${app.id}`) : null
          if (localUserRes) {
            try { localCandidateResult = JSON.parse(localUserRes) } catch {}
          } else if (localAppRes) {
            try { localCandidateResult = JSON.parse(localAppRes) } catch {}
          }
        }

        const isSysPublished = settings?.value === 'true' || localPublished
        const effectiveFr = fr || localCandidateResult
        const rankingResult = rk?.result || localCandidateResult?.result
        const appStatus = app?.status

        // Result is visible if system published OR candidate has finalized status / explicit pass
        const isOfficiallyPublished = isSysPublished || effectiveFr?.is_published || appStatus === 'finalized'

        if (prof?.full_name) {
          setCandidateName(prof.full_name)
        } else if (user.user_metadata?.full_name) {
          setCandidateName(user.user_metadata.full_name)
        }

        const resolvedDept = (app?.departments as any)?.name || (rk?.applications as any)?.departments?.name || localCandidateResult?.department_name
        if (resolvedDept) {
          setDeptName(resolvedDept)
        }

        if (effectiveFr || rankingResult) {
          const dec = effectiveFr?.result || rankingResult
          const defaultMsg = dec === 'pass'
            ? 'Chúc mừng bạn đã xuất sắc vượt qua các vòng đánh giá tuyển chọn và chính thức trở thành Đại sứ Sinh viên CLB iSSAC - Trường Quốc tế, ĐHQGHN!'
            : dec === 'waitlist'
            ? 'Bạn đang ở danh sách dự bị chính thức của CLB iSSAC. Ban Chủ nhiệm sẽ thông báo nếu có chỉ tiêu điều động thêm.'
            : 'Cảm ơn bạn đã tham gia kỳ tuyển quân iSSAC Gen 3. Ban Chủ nhiệm ghi nhận tinh thần và sự nỗ lực của bạn trong suốt quá trình ứng tuyển.'

          setFinalResult({
            result: dec,
            announcement_message: effectiveFr?.announcement_message || defaultMsg,
            is_published: isOfficiallyPublished,
            finalized_at: effectiveFr?.finalized_at,
            published_at: effectiveFr?.published_at,
          })
          setPublished(isOfficiallyPublished)

          if (isRealtimeTrigger && isOfficiallyPublished && dec === 'pass' && !hasCelebrated) {
            setHasCelebrated(true)
            toast({
              title: '🎉 Chúc mừng bạn đã trúng tuyển iSSAC!',
              description: 'Ban Tuyển quân của CLB vừa phê duyệt và chính thức công bố kết quả tuyển chọn.',
              variant: 'success'
            } as Parameters<typeof toast>[0])
          }
        } else {
          setPublished(isOfficiallyPublished)
          if (isOfficiallyPublished) {
            setFinalResult({
              result: 'pass',
              announcement_message: 'Chúc mừng bạn đã xuất sắc vượt qua các vòng đánh giá tuyển chọn và chính thức trở thành Đại sứ Sinh viên CLB iSSAC - Trường Quốc tế, ĐHQGHN!'
            })
          }
        }
      } else {
        // Non-logged in preview mode
        setCandidateName('Nguyễn Hà Phương')
        setDeptName('Ban Truyền thông')
        setPublished(true)
        setFinalResult({
          result: 'pass',
          announcement_message: 'Chúc mừng bạn đã xuất sắc vượt qua các vòng đánh giá tuyển chọn và chính thức trở thành Đại sứ Sinh viên CLB iSSAC - Trường Quốc tế, ĐHQGHN!'
        })
      }
    } catch (err) {
      console.warn('Member result fetch error:', err)
    } finally {
      setLoading(false)
    }
  }, [supabase, toast, hasCelebrated])

  useEffect(() => {
    fetchResult()
  }, [fetchResult])

  // Real-time synchronization
  useEffect(() => {
    const channel = supabase
      .channel(`member-result-realtime-${Date.now()}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'final_results' }, () => {
        fetchResult(true)
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'system_settings' }, () => {
        fetchResult(true)
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'candidate_rankings' }, () => {
        fetchResult(true)
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'applications' }, () => {
        fetchResult(true)
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, () => {
        fetchResult(true)
      })
      .subscribe()

    const handleStorage = (e: StorageEvent) => {
      if (
        e.key === 'issac_results_published' ||
        e.key === 'issac_last_eval_update' ||
        (e.key && e.key.startsWith('issac_candidate_result_'))
      ) {
        fetchResult(true)
      }
    }

    const handleCustomEvent = (e: any) => {
      fetchResult(true)
    }

    let bc: BroadcastChannel | null = null
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      bc = new BroadcastChannel('issac_eval_channel')
      bc.onmessage = (event) => {
        const data = event.data
        if (
          data?.type === 'candidate_decision_changed' ||
          data?.type === 'results_published' ||
          data?.type === 'candidate_approved'
        ) {
          // If targeted or global, immediately trigger update
          fetchResult(true)
        }
      }
    }

    window.addEventListener('storage', handleStorage)
    window.addEventListener('issac_candidate_approved' as any, handleCustomEvent)
    window.addEventListener('issac_results_published' as any, handleCustomEvent)
    window.addEventListener('issac_eval_updated' as any, handleCustomEvent)

    return () => {
      supabase.removeChannel(channel)
      window.removeEventListener('storage', handleStorage)
      window.removeEventListener('issac_candidate_approved' as any, handleCustomEvent)
      window.removeEventListener('issac_results_published' as any, handleCustomEvent)
      window.removeEventListener('issac_eval_updated' as any, handleCustomEvent)
      if (bc) bc.close()
    }
  }, [fetchResult, supabase])

  const isPassed = finalResult?.result === 'pass'
  const isWaitlist = finalResult?.result === 'waitlist'

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-fade-in pb-12 font-sans">
      {/* 1. Header: Đồng bộ tone Xanh - Vàng iSSAC */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 tracking-tight">
            KẾT QUẢ ỨNG TUYỂN iSSAC 2026
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            Cổng thông tin tuyển chọn Đại sứ Sinh viên Gen 3
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => fetchResult(false)}
            title="Đồng bộ kết quả mới nhất"
            className="p-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <Link
            href="/member/dashboard"
            className="px-4 py-2 rounded-xl border-2 border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-xs transition-all"
          >
            Về Tổng quan
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="bg-white border-2 border-slate-200 rounded-3xl p-12 text-center shadow-xs space-y-4">
          <div className="w-8 h-8 mx-auto border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs sm:text-sm text-slate-500 font-medium">Đang tải dữ liệu kết quả tuyển chọn...</p>
        </div>
      ) : !published || !finalResult ? (
        <div className="bg-white border-2 border-[#fdc455] rounded-3xl p-6 sm:p-8 shadow-xs">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            {/* Cột trái: Thông tin thông báo & Thao tác */}
            <div className="space-y-4 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-amber-950 bg-[#fdc455] uppercase tracking-wide px-2.5 py-0.5 rounded shadow-2xs">
                  Thông báo tuyển quân
                </span>
              </div>

              <div className="space-y-2">
                <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900 tracking-tight">
                  Kết quả chưa được công bố
                </h2>
                <p className="text-slate-600 text-xs sm:text-sm leading-relaxed max-w-xl">
                  Ban Tuyển quân của CLB đang hoàn tất quá trình phê duyệt danh sách chính thức theo chỉ tiêu hệ thống. Vui lòng theo dõi các kênh thông tin của CLB để cập nhật sớm nhất nha!
                </p>
              </div>

              <div className="pt-3 flex flex-wrap items-center gap-3 border-t border-amber-100/70">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-950 bg-amber-100 border border-amber-300 px-3 py-1.5 rounded-lg">
                  <span className="w-2 h-2 rounded-full bg-amber-600" />
                  Đang hoàn tất phê duyệt danh sách chính thức
                </span>

                <Link href="/member/about">
                  <Button className="bg-[#1657c1] hover:bg-[#0f449e] text-white font-bold text-xs sm:text-sm rounded-xl px-5 py-2.5 h-auto shadow-2xs cursor-pointer">
                    Tìm hiểu các Ban chuyên môn
                  </Button>
                </Link>
              </div>
            </div>

            {/* Cột phải: Hình ảnh Mascot Học hỏi nè! */}
            <div className="shrink-0 flex items-center justify-center lg:justify-end">
              <Image
                src="/images/isaris-study.png"
                alt="ISARIS - Học hỏi nè!"
                width={299}
                height={375}
                className="w-44 sm:w-52 md:w-60 lg:w-64 h-auto object-contain drop-shadow-sm select-none pointer-events-none"
                priority
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-5 animate-fade-in">
          {/* Main result card: Sang trọng, màu xanh navy & vàng iSSAC, tuyệt đối không lộ điểm */}
          <div className="bg-white border-2 border-[#1657c1]/20 rounded-3xl shadow-md overflow-hidden">
            {/* Top banner */}
            <div className={`p-6 sm:p-8 text-white text-center space-y-2 ${
              isPassed
                ? 'bg-gradient-to-br from-[#0d3b82] via-[#1657c1] to-[#0a2550]'
                : isWaitlist
                ? 'bg-gradient-to-br from-amber-700 via-amber-600 to-yellow-800'
                : 'bg-gradient-to-br from-slate-700 via-slate-600 to-slate-800'
            }`}>
              <div className="text-[11px] uppercase tracking-widest text-blue-200 font-bold">
                Câu lạc bộ Đại sứ Sinh viên - Trường Quốc tế, ĐHQGHN
              </div>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                {isPassed ? 'CHÚC MỪNG TRÚNG TUYỂN!' : isWaitlist ? 'DANH SÁCH DỰ BỊ' : 'KẾT QUẢ TUYỂN CHỌN'}
              </h2>
              <div className="pt-2">
                <span className={
                  isPassed
                    ? 'inline-block px-5 py-1.5 rounded-full text-xs font-black uppercase tracking-wider shadow-xs bg-[#fdc455] text-slate-950 border border-amber-400'
                    : isWaitlist
                    ? 'inline-block px-5 py-1.5 rounded-full text-xs font-black uppercase tracking-wider shadow-xs bg-amber-100 text-amber-950 border border-amber-300'
                    : 'inline-block px-5 py-1.5 rounded-full text-xs font-black uppercase tracking-wider shadow-xs bg-slate-100 text-slate-800'
                }>
                  {isPassed
                    ? 'Trạng thái: Chính thức trúng tuyển'
                    : isWaitlist
                    ? 'Trạng thái: Ứng viên Dự bị'
                    : 'Trạng thái: Chưa trúng tuyển'}
                </span>
              </div>
            </div>

            {/* Card Content */}
            <div className="p-6 sm:p-8 space-y-6">
              <div className="text-center space-y-2 max-w-lg mx-auto">
                <p className="text-xs sm:text-sm text-slate-500 font-medium">
                  Ban Tuyển quân của CLB trân trọng gửi kết quả đến ứng viên
                </p>
                <div className="text-2xl font-black text-[#1657c1]">
                  {candidateName}
                </div>
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed pt-1">
                  {finalResult.announcement_message}
                </p>
              </div>

              {/* Bảng thông tin kết quả: BẢO MẬT TUYỆT ĐỐI - KHÔNG HIỂN THỊ ĐIỂM SỐ VÀ THỨ HẠNG */}
              {isPassed ? (
                <div className="rounded-2xl border-2 border-slate-200/90 bg-slate-50/70 p-5 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-200/80 pb-2.5 text-xs sm:text-sm">
                    <span className="text-slate-500 font-medium">Ban chuyên môn trúng tuyển:</span>
                    <strong className="text-[#1657c1] font-black text-sm sm:text-base">{deptName}</strong>
                  </div>
                  <div className="flex items-center justify-between border-b border-slate-200/80 pb-2.5 text-xs sm:text-sm">
                    <span className="text-slate-500 font-medium">Tư cách thành viên:</span>
                    <strong className="text-slate-900 font-bold">Đại sứ Sinh viên Gen 3</strong>
                  </div>
                  <div className="flex items-center justify-between border-b border-slate-200/80 pb-2.5 text-xs sm:text-sm">
                    <span className="text-slate-500 font-medium">Nhiệm kỳ hoạt động:</span>
                    <span className="text-amber-950 font-black bg-amber-100 border border-amber-300 px-3 py-0.5 rounded-md text-xs">
                      2026 - 2027
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs sm:text-sm pt-0.5">
                    <span className="text-slate-500 font-medium">Đơn vị trực thuộc:</span>
                    <span className="text-slate-800 font-bold">Trường Quốc tế - ĐHQGHN</span>
                  </div>
                </div>
              ) : isWaitlist ? (
                <div className="rounded-2xl border-2 border-amber-200 bg-amber-50/60 p-5 space-y-2 text-xs sm:text-sm text-amber-950">
                  <div className="font-bold text-amber-900">Thông tin danh sách dự bị:</div>
                  <p className="text-slate-700 leading-relaxed">
                    Bạn được xếp vào danh sách dự bị ưu tiên của <strong>{deptName}</strong>. Khi có ứng viên chính thức thay đổi nguyện vọng hoặc chỉ tiêu bổ sung được mở rộng, Ban Tuyển quân của CLB sẽ liên hệ trực tiếp qua số điện thoại và email của bạn.
                  </p>
                </div>
              ) : (
                <div className="rounded-2xl border-2 border-slate-200 bg-slate-50 p-5 text-center text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Cảm ơn bạn đã dành thời gian và sự quan tâm tham gia đợt tuyển chọn Đại sứ Sinh viên iSSAC Gen 3. Rất hy vọng sẽ tiếp tục được đồng hành cùng bạn trong các sự kiện và hoạt động tiếp theo của CLB.
                </div>
              )}
            </div>
          </div>

          {/* Next Steps: Bố cục rõ ràng, màu Xanh & Vàng iSSAC, không icon */}
          {isPassed && (
            <div className="bg-white border-2 border-slate-200/90 rounded-3xl p-6 sm:p-7 shadow-xs space-y-4">
              <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                <div>
                  <div className="text-xs font-black uppercase tracking-wider text-[#1657c1]">
                    Các bước tiếp theo dành cho Tân Đại sứ
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Vui lòng theo dõi các mốc hoạt động quan trọng để hoàn tất thủ tục gia nhập CLB
                  </p>
                </div>
                <span className="text-[11px] font-bold text-amber-950 bg-amber-100 border border-amber-300 px-2.5 py-0.5 rounded-full">
                  Quan trọng
                </span>
              </div>

              <div className="space-y-3 pt-1">
                {[
                  {
                    step: '1',
                    title: 'Kiểm tra hòm thư email sinh viên',
                    desc: 'Nhận thư mời chính thức và thông tin chi tiết về buổi gặp mặt đầu tiên từ Ban Chủ nhiệm CLB.'
                  },
                  {
                    step: '2',
                    title: 'Tham gia buổi Họp mặt Tân Thành viên (Onboarding Day)',
                    desc: 'Gặp gỡ Ban Chủ nhiệm, làm quen với các thành viên trong Ban và tiếp nhận thẻ Đại sứ Sinh viên.'
                  },
                  {
                    step: '3',
                    title: 'Gia nhập nhóm liên lạc nội bộ của Ban chuyên môn',
                    desc: 'Kết nối cùng Trưởng ban và các cộng sự để bắt đầu những dự án và nhiệm vụ đầu tiên của nhiệm kỳ.'
                  }
                ].map(item => (
                  <div key={item.step} className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-slate-50/70 border border-slate-200/80">
                    <span className="w-6 h-6 rounded-full bg-[#1657c1] text-white flex items-center justify-center text-xs font-black shrink-0 mt-0.5">
                      {item.step}
                    </span>
                    <div className="space-y-0.5">
                      <div className="text-xs sm:text-sm font-bold text-slate-900">
                        {item.title}
                      </div>
                      <div className="text-xs text-slate-600 leading-relaxed">
                        {item.desc}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
