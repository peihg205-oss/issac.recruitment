'use client'
import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Check, CheckCircle2, Clock, FileText, Calendar, Trophy,
  ChevronRight, User, Sparkles, Building2, MapPin,
  ExternalLink, Mail, Eye, Heart, PartyPopper,
  ShieldCheck, Layers, ArrowRight, RefreshCw, AlertCircle,
  Clock3, HelpCircle, FileCheck2
} from 'lucide-react'
import { formatDate, formatFullTimestamp, getCandidateCode } from '@/lib/utils'
import { useToast } from '@/components/ui/use-toast'

export default function MemberDashboardPage() {
  const supabase = createClient()
  const { toast } = useToast()

  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [application, setApplication] = useState<any>(null)
  const [candidateCode, setCandidateCode] = useState<string>('ISSAC-01')
  const [interview, setInterview] = useState<any>(null)
  const [finalResult, setFinalResult] = useState<any>(null)
  const [isResultsPublished, setIsResultsPublished] = useState(false)
  const [showResultModal, setShowResultModal] = useState(false)
  const [hasOpenedEnvelope, setHasOpenedEnvelope] = useState(false)

  const fetchData = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true)
    else setLoading(true)

    try {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      setUser(authUser)

      if (authUser) {
        // Fetch profile
        const { data: prof } = await supabase
          .from('profiles')
          .select('*, departments(name, color)')
          .eq('id', authUser.id)
          .maybeSingle()

        if (prof) setProfile(prof)

        // Fetch application thật của ứng viên
        const { data: app } = await supabase
          .from('applications')
          .select('*, departments!applications_department_id_fkey(name, color, slug)')
          .eq('user_id', authUser.id)
          .maybeSingle()

        // Check local override for application status
        let effectiveApp = app || null
        if (typeof window !== 'undefined' && app?.id) {
          const localAppStatus = localStorage.getItem(`issac_app_status_${app.id}`) || (authUser?.id ? localStorage.getItem(`issac_app_status_user_${authUser.id}`) : null)
          if (localAppStatus) {
            effectiveApp = { ...app, status: localAppStatus }
          }
        }
        setApplication(effectiveApp)

        // Fetch system settings & check local storage overrides
        const { data: settingData } = await supabase
          .from('system_settings')
          .select('value')
          .eq('key', 'results_published')
          .maybeSingle()

        const isLocalPub = typeof window !== 'undefined' && localStorage.getItem('issac_results_published') === 'true'
        const isPub = settingData?.value === 'true' || isLocalPub
        setIsResultsPublished(isPub)

        // Nếu có đơn ứng tuyển, kiểm tra tiếp lịch phỏng vấn, kết quả chung cuộc và mã hồ sơ
        if (app) {
          const [{ data: iv }, { data: fr }, { data: allApps }, { data: cr }] = await Promise.all([
            supabase
              .from('interviews')
              .select('*, interview_slots(*)')
              .eq('application_id', app.id)
              .maybeSingle(),
            supabase
              .from('final_results')
              .select('*')
              .eq('application_id', app.id)
              .maybeSingle(),
            supabase
              .from('applications')
              .select('id, submitted_at, created_at')
              .order('created_at', { ascending: true }),
            supabase
              .from('candidate_rankings')
              .select('result, final_score')
              .eq('application_id', app.id)
              .maybeSingle(),
          ])

          if (allApps && allApps.length > 0) {
            setCandidateCode(getCandidateCode(app.id, allApps))
          }

          let localResult: any = null
          if (typeof window !== 'undefined') {
            const lUser = authUser?.id ? localStorage.getItem(`issac_candidate_result_user_${authUser.id}`) : null
            const lApp = localStorage.getItem(`issac_candidate_result_${app.id}`)
            if (lUser) {
              try { localResult = JSON.parse(lUser) } catch {}
            } else if (lApp) {
              try { localResult = JSON.parse(lApp) } catch {}
            }
          }

          const isCandidateApproved = localResult?.is_published || localResult?.result === 'pass' || (localResult?.result && isPub) || isPub || effectiveApp?.status === 'finalized'

          const effectiveFr = fr || localResult || (cr?.result ? {
            result: cr.result,
            is_published: isCandidateApproved,
            announcement_message: cr.result === 'pass'
              ? 'Chúc mừng bạn đã xuất sắc trở thành Đại sứ Sinh viên CLB iSSAC!'
              : 'Ban Chủ nhiệm đã công bố kết quả đánh giá tuyển quân.'
          } : null)

          setInterview(iv || null)
          setFinalResult(effectiveFr || null)
        } else {
          setInterview(null)
          setFinalResult(null)
        }
      }
    } catch (err) {
      console.error('Lỗi khi tải dữ liệu ứng viên:', err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [supabase])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // LẮNG NGHE REAL-TIME TỪ SUPABASE & BROADCAST CHANNEL:
  // Khi Admin thao tác (duyệt đơn, chấm điểm, công bố TOP...),
  // dữ liệu tự động cập nhật ngay lập tức trên giao diện của Ứng viên!
  useEffect(() => {
    let channel: any = null
    let bc: BroadcastChannel | null = null

    const setupRealtime = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) return

      // Unique channel topic
      const topicName = `member-rt-${authUser.id}-${Date.now()}`
      channel = supabase
        .channel(topicName)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'applications', filter: `user_id=eq.${authUser.id}` },
          () => {
            console.log('[Realtime] Cập nhật ứng tuyển từ Admin...')
            fetchData()
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'interviews', filter: `user_id=eq.${authUser.id}` },
          () => {
            console.log('[Realtime] Cập nhật lịch phỏng vấn từ Admin...')
            fetchData()
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'final_results', filter: `user_id=eq.${authUser.id}` },
          () => {
            console.log('[Realtime] Cập nhật kết quả cuối từ Admin...')
            fetchData()
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'candidate_rankings' },
          () => {
            console.log('[Realtime] Cập nhật xếp hạng tuyển chọn...')
            fetchData()
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'system_settings' },
          () => {
            console.log('[Realtime] Cập nhật cấu hình hệ thống...')
            fetchData()
          }
        )
        .subscribe()
    }

    setupRealtime()

    // BroadcastChannel listener for instant zero-latency cross-tab update
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      bc = new BroadcastChannel('issac_eval_channel')
      bc.onmessage = (event) => {
        const d = event.data
        if (
          d?.type === 'candidate_decision_changed' ||
          d?.type === 'results_published' ||
          d?.type === 'candidate_approved' ||
          d?.type === 'settings_updated' ||
          d?.type === 'candidate_status_changed'
        ) {
          fetchData()
          if (d?.type === 'candidate_approved' || d?.type === 'results_published') {
            toast({
              title: '🎉 Cập nhật kết quả tuyển quân!',
              description: 'Ban Chủ nhiệm vừa phê duyệt và cập nhật kết quả tuyển chọn.',
              variant: 'success'
            } as Parameters<typeof toast>[0])
          }
        }
      }
    }

    const handleStorage = (e: StorageEvent) => {
      if (
        e.key === 'issac_results_published' ||
        e.key === 'issac_last_eval_update' ||
        (e.key && e.key.startsWith('issac_candidate_result_'))
      ) {
        fetchData()
      }
    }

    const handleCustomEvent = () => {
      fetchData()
    }

    window.addEventListener('storage', handleStorage)
    window.addEventListener('issac_candidate_approved' as any, handleCustomEvent)
    window.addEventListener('issac_results_published' as any, handleCustomEvent)
    window.addEventListener('issac_eval_updated' as any, handleCustomEvent)

    return () => {
      if (channel) {
        supabase.removeChannel(channel)
      }
      if (bc) bc.close()
      window.removeEventListener('storage', handleStorage)
      window.removeEventListener('issac_candidate_approved' as any, handleCustomEvent)
      window.removeEventListener('issac_results_published' as any, handleCustomEvent)
      window.removeEventListener('issac_eval_updated' as any, handleCustomEvent)
    }
  }, [supabase, fetchData])

  // Thông tin hiển thị của ứng viên (Lấy thật 100%, không fake mock khi mới đăng ký)
  const candidateName = profile?.full_name || user?.user_metadata?.full_name || 'ỨNG VIÊN'
  const hasApplication = !!application && application.status !== 'draft'

  // XÁC ĐỊNH VÒNG HIỆN TẠI VÀ TRẠNG THÁI THEO THỜI GIAN THỰC
  const getRoundAndStatus = () => {
    if (!hasApplication) {
      return {
        roundNumber: 1,
        roundTotal: 5,
        roundName: 'Nộp hồ sơ ứng tuyển',
        roundTag: 'Vòng 1 / 5',
        statusLabel: 'Chưa nộp đơn',
        statusDesc: 'Vui lòng hoàn thành đơn ứng tuyển',
        themeColor: 'amber',
      }
    }

    const st = application.status

    if (st === 'submitted' || st === 'received') {
      return {
        roundNumber: 2,
        roundTotal: 5,
        roundName: 'Xét duyệt hồ sơ & CV',
        roundTag: 'Vòng 2 / 5',
        statusLabel: 'Đã nộp đơn',
        statusDesc: 'Đang chờ hội đồng xét duyệt',
        themeColor: 'blue',
      }
    }

    if (st === 'reviewing') {
      return {
        roundNumber: 2,
        roundTotal: 5,
        roundName: 'Xét duyệt hồ sơ & CV',
        roundTag: 'Vòng 2 / 5',
        statusLabel: 'Đang xét duyệt',
        statusDesc: 'Hội đồng đang chấm điểm đơn',
        themeColor: 'indigo',
      }
    }

    if (st === 'approved') {
      return {
        roundNumber: 3,
        roundTotal: 5,
        roundName: 'Phỏng vấn trực tiếp',
        roundTag: 'Vòng 3 / 5',
        statusLabel: 'Đạt vòng đơn',
        statusDesc: 'Vui lòng chọn ca phỏng vấn',
        themeColor: 'emerald',
      }
    }

    if (st === 'interview_scheduled') {
      return {
        roundNumber: 3,
        roundTotal: 5,
        roundName: 'Phỏng vấn trực tiếp',
        roundTag: 'Vòng 3 / 5',
        statusLabel: 'Đã xếp lịch phỏng vấn',
        statusDesc: 'Đã xác nhận ca phỏng vấn',
        themeColor: 'purple',
      }
    }

    if (st === 'interviewed') {
      return {
        roundNumber: 4,
        roundTotal: 5,
        roundName: 'Hội đồng đánh giá',
        roundTag: 'Vòng 4 / 5',
        statusLabel: 'Đã phỏng vấn',
        statusDesc: 'Hội đồng đang hoàn tất chấm điểm',
        themeColor: 'teal',
      }
    }

    if (st === 'evaluating' || st === 'evaluated') {
      return {
        roundNumber: 4,
        roundTotal: 5,
        roundName: 'Hội đồng đánh giá',
        roundTag: 'Vòng 4 / 5',
        statusLabel: 'Tổng hợp điểm',
        statusDesc: 'Ban Chủ nhiệm đang tổng hợp kết quả',
        themeColor: 'orange',
      }
    }

    if (st === 'finalized') {
      const isPass = finalResult?.result === 'pass'
      return {
        roundNumber: 5,
        roundTotal: 5,
        roundName: 'Công bố kết quả chính thức',
        roundTag: 'Vòng 5 / 5',
        statusLabel: isPass ? 'Trúng tuyển' : (finalResult?.result === 'fail' ? 'Chưa trúng tuyển' : 'Đã có kết quả'),
        statusDesc: isPass ? 'Chúc mừng bạn gia nhập iSSAC!' : 'Kết quả chính thức đã công bố',
        themeColor: isPass ? 'emerald' : 'slate',
      }
    }

    if (st === 'rejected') {
      return {
        roundNumber: 1,
        roundTotal: 5,
        roundName: 'Vòng đơn',
        roundTag: 'Vòng 1 / 5',
        statusLabel: 'Chưa phù hợp',
        statusDesc: 'Hồ sơ chưa đạt yêu cầu đợt này',
        themeColor: 'rose',
      }
    }

    return {
      roundNumber: 1,
      roundTotal: 5,
      roundName: 'Nộp hồ sơ ứng tuyển',
      roundTag: 'Vòng 1 / 5',
      statusLabel: 'Bản nháp',
      statusDesc: 'Chưa hoàn tất nộp đơn',
      themeColor: 'amber',
    }
  }

  const currentStatus = getRoundAndStatus()
  const deptName = application?.departments?.name || (hasApplication ? 'Chưa xác định' : 'Chưa đăng ký ban')
  const isPassed = finalResult?.result === 'pass'
  const canViewResult = (finalResult && (finalResult.is_published || isResultsPublished)) || application?.status === 'finalized'

  // 5 BƯỚC HÀNH TRÌNH ĐỒNG BỘ THỜI GIAN THỰC
  const journeySteps = [
    {
      id: 1,
      name: 'Hồ sơ',
      desc: 'Thông tin cá nhân',
      status: 'done', // Đã tạo tài khoản thành công
      note: '✓ Hoàn thành',
    },
    {
      id: 2,
      name: 'Đơn',
      desc: 'Câu trả lời & CV',
      status: hasApplication ? 'done' : 'active',
      note: hasApplication ? '✓ Đã nộp' : '● Chưa gửi đơn',
    },
    {
      id: 3,
      name: 'PV',
      desc: 'Phỏng vấn trực tiếp',
      status: ['interviewed', 'evaluating', 'evaluated', 'finalized'].includes(application?.status) || interview?.status === 'completed'
        ? 'done'
        : (application?.status === 'interview_scheduled' || interview ? 'active' : 'pending'),
      note: ['interviewed', 'evaluating', 'evaluated', 'finalized'].includes(application?.status) || interview?.status === 'completed'
        ? '✓ Đã PV'
        : (application?.status === 'interview_scheduled' || interview ? '● Đã có lịch' : '○ Chờ duyệt'),
    },
    {
      id: 4,
      name: 'Đánh giá',
      desc: 'Hội đồng chấm điểm',
      status: ['evaluated', 'finalized'].includes(application?.status)
        ? 'done'
        : (['interviewed', 'evaluating'].includes(application?.status) ? 'active' : 'pending'),
      note: ['evaluated', 'finalized'].includes(application?.status)
        ? '✓ Hoàn tất chấm'
        : (['interviewed', 'evaluating'].includes(application?.status) ? '● Đang chấm' : '○ Chờ đến lượt'),
    },
    {
      id: 5,
      name: 'Kết quả',
      desc: 'Công bố chính thức',
      status: canViewResult
        ? (hasOpenedEnvelope ? 'done' : 'active')
        : 'pending',
      note: canViewResult
        ? (hasOpenedEnvelope ? '✓ Đã xem' : '● Đã mở kết quả')
        : '○ Chưa công bố',
    },
  ]

  const handleOpenResult = () => {
    setShowResultModal(true)
    setHasOpenedEnvelope(true)
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-fade-in pb-12">
      {/* 1. Header & Nút đồng bộ Real-time */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1 border-b border-slate-100 pb-4">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 tracking-tight">
            XIN CHÀO, {candidateName.toUpperCase()}!
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm font-medium">
            {hasApplication
              ? 'Hồ sơ của bạn đang được kết nối trực tiếp với Ban Tuyển quân của CLB'
              : 'Chào mừng bạn đến với Cổng tuyển quân Đại sứ Sinh viên Gen 3'}
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fetchData(true)}
            disabled={refreshing}
            className="text-xs text-slate-600 hover:text-slate-900 border-slate-200 cursor-pointer h-9 px-3"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${refreshing ? 'animate-spin text-blue-600' : ''}`} />
            {refreshing ? 'Đang kiểm tra...' : 'Làm mới trạng thái'}
          </Button>
        </div>
      </div>

      {/* BANNER NHẮC NHỞ NẾU CHƯA NỘP ĐƠN */}
      {!hasApplication && (
        <div className="bg-gradient-to-r from-[#1559c5] via-[#1a66dc] to-[#1249a8] rounded-3xl p-6 sm:p-7 text-white shadow-xl relative overflow-hidden">
          <div className="absolute right-0 top-0 -mt-8 -mr-8 w-48 h-48 rounded-full bg-white/10 blur-2xl pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
            <div className="space-y-2 max-w-xl">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-amber-400 text-slate-950">
                <Sparkles className="w-3.5 h-3.5" /> BƯỚC QUAN TRỌNG
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white">
                Bạn chưa hoàn thành đơn ứng tuyển Gen 3!
              </h2>
              <p className="text-blue-100 text-xs sm:text-sm leading-relaxed">
                Hãy lựa chọn Ban chuyên môn yêu thích (Truyền thông, Tư vấn, Nhân sự) và điền câu hỏi ứng tuyển để Hội đồng tiếp nhận hồ sơ xét duyệt.
              </p>
            </div>
            <Link href="/member/application" className="shrink-0">
              <Button
                size="lg"
                className="bg-[#fdc455] hover:bg-[#f59e0b] text-slate-950 font-black rounded-2xl shadow-lg hover:shadow-xl hover:scale-105 transition-all text-sm px-6 py-6 cursor-pointer"
              >
                Nộp đơn ứng tuyển ngay
                <ChevronRight className="w-4 h-4 ml-1.5" />
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* 2. Bộ 3 thẻ thống kê trên cùng: Style xen kẽ Xanh - Vàng theo Ảnh 2 */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Thẻ 1: XANH - Ban ứng tuyển */}
        <div className="rounded-2xl bg-white border-2 border-[#1657c1] p-5 shadow-xs transition-all hover:shadow-md flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-bold text-white bg-[#1657c1] uppercase tracking-wide px-2.5 py-0.5 rounded shadow-2xs">
              Ban ứng tuyển
            </span>
            <span className="text-xs font-semibold text-[#1657c1]">Nguyện vọng</span>
          </div>

          <div>
            <h4 className="text-lg sm:text-xl font-bold text-slate-900 truncate">
              {deptName}
            </h4>
          </div>

          <div className="pt-1">
            {hasApplication ? (
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center text-xs font-bold text-amber-950 bg-amber-100 border border-amber-300 px-2.5 py-0.5 rounded-md">
                  Nguyện vọng 1 (NV1)
                </span>
                <span className="inline-flex items-center text-xs font-mono font-black text-[#1657c1] bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-md">
                  Mã: {candidateCode}
                </span>
              </div>
            ) : (
              <span className="inline-flex items-center text-xs font-bold text-slate-600 bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded-md">
                Chưa đăng ký ban
              </span>
            )}
          </div>
        </div>

        {/* Thẻ 2: VÀNG - Vòng hiện tại */}
        <div className="rounded-2xl bg-white border-2 border-[#fdc455] p-5 shadow-xs transition-all hover:shadow-md flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-bold text-amber-950 bg-[#fdc455] uppercase tracking-wide px-2.5 py-0.5 rounded shadow-2xs">
              Vòng hiện tại
            </span>
            <span className="text-xs font-semibold text-amber-900">Tiến trình</span>
          </div>

          <div>
            <h4 className="text-lg sm:text-xl font-bold text-slate-900 truncate">
              {currentStatus.roundTag}
            </h4>
          </div>

          <div className="pt-1">
            <span className="inline-flex items-center text-xs font-bold text-amber-950 bg-amber-100 border border-amber-300 px-2.5 py-0.5 rounded-md truncate max-w-full">
              {currentStatus.roundName}
            </span>
          </div>
        </div>

        {/* Thẻ 3: XANH - Trạng thái hồ sơ */}
        <div className="rounded-2xl bg-white border-2 border-[#1657c1] p-5 shadow-xs transition-all hover:shadow-md flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-bold text-white bg-[#1657c1] uppercase tracking-wide px-2.5 py-0.5 rounded shadow-2xs">
              Trạng thái hồ sơ
            </span>
            <span className="text-xs font-semibold text-[#1657c1]">Hệ thống</span>
          </div>

          <div>
            <h4 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-1.5 truncate">
              <span>{currentStatus.statusLabel}</span>
              {hasApplication && (
                <CheckCircle2 className="w-5 h-5 text-[#1657c1] shrink-0 inline-block" />
              )}
            </h4>
          </div>

          <div className="pt-1">
            <span className="inline-flex items-center text-xs font-bold text-[#1657c1] bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-md truncate max-w-full">
              {currentStatus.statusDesc}
            </span>
          </div>
        </div>
      </div>

      {/* 3. Hành trình gia nhập iSSAC (Đồng bộ Real-Time chính xác từng bước) */}
      <div className="bg-white rounded-3xl border-2 border-slate-200 shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-blue-900 to-indigo-900 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-white font-extrabold text-sm sm:text-base tracking-wide">
            <Layers className="w-5 h-5 text-amber-400" />
            <span>HÀNH TRÌNH GIA NHẬP iSSAC</span>
          </div>
          <span className="text-[11px] font-black uppercase tracking-wider text-amber-300 bg-amber-400/20 px-3 py-1 rounded-full border border-amber-400/30">
            Thời gian thực
          </span>
        </div>

        <div className="p-6 sm:p-8">
          <div className="relative">
            {/* Progress bar background line */}
            <div className="hidden sm:block absolute top-5 left-10 right-10 h-1 bg-slate-200 -z-0" />

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-6 sm:gap-2 relative z-10">
              {journeySteps.map((step) => {
                const isDone = step.status === 'done'
                const isActive = step.status === 'active'

                return (
                  <div key={step.id} className="flex flex-col items-center text-center space-y-2">
                    {/* Circle Node */}
                    <div className={`w-11 h-11 rounded-full flex items-center justify-center text-sm font-black transition-all ${
                      isDone
                        ? 'bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-md shadow-blue-200 ring-4 ring-blue-100'
                        : isActive
                        ? 'bg-gradient-to-br from-amber-400 to-amber-500 text-slate-950 font-black shadow-lg shadow-amber-300 ring-4 ring-amber-200 scale-110 animate-pulse'
                        : 'bg-white border-2 border-slate-300 text-slate-400'
                    }`}>
                      {isDone ? (
                        <Check className="w-5 h-5 stroke-[3]" />
                      ) : (
                        <span>{step.id}</span>
                      )}
                    </div>

                    {/* Step Title */}
                    <div>
                      <div className={`text-xs sm:text-sm font-extrabold ${
                        isDone ? 'text-slate-900' : isActive ? 'text-amber-800' : 'text-slate-400'
                      }`}>
                        {step.name}
                      </div>
                      <div className="text-[11px] font-medium text-slate-500 hidden sm:block">
                        {step.desc}
                      </div>
                    </div>

                    {/* Badge trạng thái */}
                    <div>
                      {isDone ? (
                        <span className="inline-flex items-center text-[11px] font-bold text-blue-800 bg-blue-100 px-2.5 py-0.5 rounded-full border border-blue-200 shadow-2xs">
                          {step.note}
                        </span>
                      ) : isActive ? (
                        <span className="inline-flex items-center text-[11px] font-black text-amber-950 bg-amber-200 px-2.5 py-0.5 rounded-full border border-amber-400 shadow-xs">
                          {step.note}
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-[11px] text-slate-400 font-semibold">
                          {step.note}
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* 4. Hai khối thông tin: THÔNG TIN ỨNG TUYỂN & LỊCH PHỎNG VẤN */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {/* Khối Trái: THÔNG TIN ỨNG TUYỂN */}
        <div className="bg-white border-2 border-blue-100 shadow-sm hover:shadow-md transition-all rounded-3xl overflow-hidden flex flex-col justify-between">
          <div>
            <div className="py-3.5 px-5 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100 flex items-center justify-between">
              <div className="text-xs font-bold uppercase tracking-wider text-blue-900">
                THÔNG TIN ỨNG TUYỂN
              </div>
              {hasApplication && (
                <span className="text-[11px] font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-md">
                  Đã ghi nhận
                </span>
              )}
            </div>

            {hasApplication ? (
              <div className="p-5 space-y-3.5 text-xs sm:text-sm">
                <div className="flex items-center justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500 font-semibold">Ban đăng ký:</span>
                  <span className="font-extrabold text-slate-900 text-sm">{deptName}</span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500 font-semibold">Nguyện vọng:</span>
                  <span className="inline-flex items-center bg-amber-100 text-amber-900 border border-amber-300 font-bold text-xs px-2.5 py-0.5 rounded-md">
                    NV1 Chính thức
                  </span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500 font-semibold">Thời gian gửi hồ sơ:</span>
                  <span className="font-bold text-slate-800 text-xs sm:text-sm">
                    {application.submitted_at || application.created_at
                      ? `${formatFullTimestamp(application.submitted_at || application.created_at).timeStr} · ${formatDate(application.submitted_at || application.created_at)}`
                      : 'Đang cập nhật'}
                  </span>
                </div>
                <div className="flex items-center justify-between py-1">
                  <span className="text-slate-500 font-semibold">Hồ sơ đính kèm:</span>
                  <span className="text-emerald-700 font-extrabold flex items-center gap-1 bg-emerald-50 px-2.5 py-0.5 rounded-lg border border-emerald-200">
                    <Check className="w-3.5 h-3.5 stroke-[3]" /> Đã nộp câu trả lời đơn
                  </span>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                  <FileText className="w-6 h-6" />
                </div>
                <div className="text-sm font-bold text-slate-700">Chưa có hồ sơ ứng tuyển nào</div>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">
                  Bạn cần hoàn thiện thông tin ứng tuyển và trả lời câu hỏi chuyên môn để nộp đơn xét duyệt.
                </p>
                <div className="pt-2">
                  <Link href="/member/application">
                    <Button size="sm" className="bg-[#1559c5] text-white hover:bg-blue-700 font-bold text-xs rounded-xl cursor-pointer">
                      Bắt đầu nộp đơn ngay
                    </Button>
                  </Link>
                </div>
              </div>
            )}
          </div>

          {hasApplication && (
            <div className="p-3.5 bg-blue-50/70 border-t border-blue-100 text-right">
              <Link
                href="/member/application"
                className="inline-flex items-center gap-1.5 text-xs font-black text-blue-700 hover:text-blue-900 transition-colors"
              >
                Xem chi tiết đơn ứng tuyển
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}
        </div>

        {/* Khối Phải: LỊCH PHỎNG VẤN */}
        <div className="bg-white border-2 border-amber-100 shadow-sm hover:shadow-md transition-all rounded-3xl overflow-hidden flex flex-col justify-between">
          <div>
            <div className="py-3.5 px-5 bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-100 flex items-center justify-between">
              <div className="text-xs font-bold uppercase tracking-wider text-amber-950">
                LỊCH PHỎNG VẤN
              </div>
              {interview && (
                <span className="text-[11px] font-bold text-amber-900 bg-amber-100 px-2 py-0.5 rounded-md">
                  Đã xếp lịch
                </span>
              )}
            </div>

            {interview?.interview_slots ? (
              <div className="p-5 space-y-3.5 text-xs sm:text-sm">
                <div className="flex items-center justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500 font-semibold">Giờ phỏng vấn:</span>
                  <span className="font-extrabold text-blue-800 text-sm">
                    {interview.interview_slots.start_time} - {interview.interview_slots.end_time}
                  </span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500 font-semibold">Ngày phỏng vấn:</span>
                  <span className="font-extrabold text-slate-900">
                    {formatDate(interview.interview_slots.interview_date)}
                  </span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500 font-semibold">Địa điểm:</span>
                  <span className="text-slate-800 font-medium text-right truncate max-w-[210px]" title={interview.interview_slots.location || interview.interview_slots.meeting_url}>
                    {interview.interview_slots.location || interview.interview_slots.meeting_url || 'Thông báo sau'}
                  </span>
                </div>
                <div className="flex items-center justify-between py-1">
                  <span className="text-slate-500 font-semibold">Hình thức:</span>
                  <span className="text-slate-800 font-extrabold">
                    {interview.interview_slots.format === 'offline' ? 'Phỏng vấn trực tiếp (Offline)' : 'Phỏng vấn trực tuyến (Online)'}
                  </span>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                  <Calendar className="w-6 h-6" />
                </div>
                <div className="text-sm font-bold text-slate-700">Chưa có lịch phỏng vấn</div>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">
                  {application?.status === 'approved'
                    ? 'Chúc mừng bạn đã đạt vòng đơn! Vui lòng truy cập trang Phỏng vấn để chọn ca phỏng vấn phù hợp.'
                    : (hasApplication
                      ? 'Hồ sơ đang trong quá trình đánh giá. Lịch phỏng vấn sẽ mở sau khi hồ sơ đạt yêu cầu.'
                      : 'Vui lòng hoàn thành nộp đơn ứng tuyển để được xét duyệt tham gia phỏng vấn.')}
                </p>
                {application?.status === 'approved' && (
                  <div className="pt-2">
                    <Link href="/member/interview">
                      <Button size="sm" className="bg-[#fdc455] text-slate-950 hover:bg-amber-400 font-bold text-xs rounded-xl cursor-pointer">
                        Chọn ca phỏng vấn ngay
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>

          {interview?.interview_slots && (
            <div className="p-3.5 bg-emerald-50/70 border-t border-emerald-100 text-right">
              <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-emerald-800">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                {interview.status === 'completed' ? 'Đã hoàn thành ca phỏng vấn' : 'Đã xác nhận ca phỏng vấn'}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* 5. THÔNG BÁO TỪ iSSAC & HỘP THƯ KẾT QUẢ: CHỈ MỞ KHI ĐÃ CÓ KẾT QUẢ CHÍNH THỨC */}
      <div className="relative rounded-3xl bg-gradient-to-br from-[#0c326f] via-[#124ba4] to-[#0a2757] text-white p-6 sm:p-8 shadow-xl border-2 border-amber-400/40 overflow-hidden">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-60 h-60 rounded-full bg-amber-400/20 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-10 -mb-10 w-48 h-48 rounded-full bg-blue-400/15 blur-2xl pointer-events-none" />

        <div className="relative z-10 space-y-4">
          <div className="flex items-center justify-between border-b border-white/20 pb-3">
            <div className="text-xs font-bold uppercase tracking-wider text-amber-300">
              THÔNG ĐIỆP TỪ BAN CHỦ NHIỆM CLB iSSAC
            </div>
            <span className="bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 text-[11px] font-black px-3 py-0.5 rounded-full shadow-sm">
              Tuyển quân Gen 3
            </span>
          </div>

          <div className="space-y-3 text-xs sm:text-sm text-blue-50 leading-relaxed w-full">
            <p className="font-bold text-white text-base">
              Thân gửi bạn {candidateName},
            </p>
            <p className="text-blue-100 font-normal leading-relaxed text-justify">
              Câu lạc bộ Đại sứ Sinh viên Trường Quốc tế - ĐHQGHN (iSSAC) xin gửi lời cảm ơn chân thành nhất đến bạn vì đã dành thời gian, sự quan tâm và nhiệt huyết tham gia đợt tuyển quân Gen 3.
            </p>
            <p className="text-blue-100 font-normal leading-relaxed text-justify">
              Mọi cập nhật về trạng thái xét duyệt, lịch phỏng vấn và kết quả chung cuộc đều được hệ thống đồng bộ trực tiếp với Ban Tuyển quân theo thời gian thực.
            </p>
          </div>

          {/* CHỈ HIỂN THỊ NÚT XEM KẾT QUẢ KHI HỘI ĐỒNG ĐÃ CHÍNH THỨC CÔNG BỐ */}
          {canViewResult ? (
            <div className="pt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-5 rounded-2xl bg-white/10 border border-white/20 backdrop-blur-md shadow-inner">
              <div className="flex items-center gap-3">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse shrink-0" />
                <div>
                  <div className="text-sm font-black text-white">
                    Kết quả xét tuyển chính thức đã sẵn sàng!
                  </div>
                  <div className="text-xs text-blue-200 font-medium">
                    Ban Tuyển quân của CLB đã hoàn tất phê duyệt quyết định.
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleOpenResult}
                className="w-full sm:w-auto inline-flex items-center justify-center px-7 py-3 rounded-xl bg-[#fdc455] hover:bg-[#f59e0b] text-slate-950 font-black text-sm shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer shrink-0"
              >
                Ấn để xem kết quả
              </button>
            </div>
          ) : (
            <div className="pt-3 flex items-center gap-3 p-4 rounded-2xl bg-white/5 border border-white/10 text-xs text-blue-200">
              <span className="w-2 h-2 rounded-full bg-blue-400 shrink-0" />
              <span>
                {hasApplication
                  ? 'Hồ sơ của bạn đang được theo dõi theo từng vòng. Kết quả chính thức sẽ được công bố tại đây khi có quyết định từ Ban Tuyển quân của CLB.'
                  : 'Hãy hoàn tất nộp đơn ứng tuyển để bắt đầu hành trình xét tuyển.'}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* 6. MODAL KẾT QUẢ XÉT TUYỂN (Chỉ mở khi có kết quả thật từ Admin) */}
      {canViewResult && (
        <Dialog open={showResultModal} onOpenChange={setShowResultModal}>
          <DialogContent className="max-w-lg p-0 bg-white rounded-3xl border-2 border-[#1657c1]/20 shadow-2xl overflow-hidden font-sans">
            <div className="bg-gradient-to-br from-[#0d3b82] via-[#1657c1] to-[#0a2550] p-6 text-white text-center space-y-2 relative">
              <div className="text-[11px] uppercase tracking-widest text-blue-200 font-bold">
                Câu lạc bộ Đại sứ Sinh viên - Trường Quốc tế, ĐHQGHN
              </div>
              <DialogTitle className="text-xl sm:text-2xl font-black text-white tracking-tight">
                {isPassed ? 'THƯ CHÚC MỪNG TRÚNG TUYỂN' : 'KẾT QUẢ TUYỂN CHỌN GEN 3'}
              </DialogTitle>
              <div className="pt-1">
                <span className={`inline-block px-4 py-1 rounded-full text-xs font-black uppercase tracking-wider shadow-sm ${
                  isPassed ? 'bg-[#fdc455] text-slate-950' : 'bg-slate-200 text-slate-800'
                }`}>
                  {isPassed ? 'Chính thức trúng tuyển' : 'Chưa trúng tuyển'}
                </span>
              </div>
            </div>

            <div className="p-6 sm:p-7 space-y-5 text-slate-800">
              <div className="text-center space-y-1.5">
                <p className="text-xs sm:text-sm text-slate-500 font-medium">
                  Ban Tuyển quân của CLB trân trọng gửi kết quả đến ứng viên
                </p>
                <div className="text-xl sm:text-2xl font-black text-[#1657c1]">
                  {candidateName}
                </div>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-md mx-auto pt-1">
                  {finalResult?.announcement_message || (
                    isPassed
                      ? 'Bạn đã xuất sắc vượt qua các vòng tuyển chọn và chính thức trở thành Đại sứ Sinh viên Gen 3!'
                      : 'Cảm ơn bạn đã tham gia ứng tuyển đợt tuyển quân Gen 3. Chúc bạn luôn nhiệt huyết và thành công trên con đường sắp tới!'
                  )}
                </p>
              </div>

              {isPassed && (
                <div className="rounded-2xl border-2 border-slate-200/90 bg-slate-50/70 p-4 space-y-2.5">
                  <div className="flex items-center justify-between border-b border-slate-200/80 pb-2 text-xs sm:text-sm">
                    <span className="text-slate-500 font-medium">Ban trúng tuyển</span>
                    <strong className="text-[#1657c1] font-bold text-sm sm:text-base">{deptName}</strong>
                  </div>
                  <div className="flex items-center justify-between border-b border-slate-200/80 pb-2 text-xs sm:text-sm">
                    <span className="text-slate-500 font-medium">Tư cách thành viên</span>
                    <strong className="text-slate-900 font-bold">Đại sứ Sinh viên chính thức</strong>
                  </div>
                  <div className="flex items-center justify-between text-xs sm:text-sm">
                    <span className="text-slate-500 font-medium">Nhiệm kỳ hoạt động</span>
                    <span className="text-amber-950 font-black bg-amber-100 border border-amber-300 px-3 py-0.5 rounded-md text-xs">
                      2026 - 2027
                    </span>
                  </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Link href="/member/result" className="flex-1">
                  <button
                    type="button"
                    className="w-full py-3 px-5 rounded-xl bg-[#fdc455] hover:bg-[#f59e0b] text-slate-950 font-black text-xs sm:text-sm shadow-md transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer text-center"
                  >
                    Xem chi tiết thư kết quả
                  </button>
                </Link>
                <button
                  type="button"
                  onClick={() => setShowResultModal(false)}
                  className="py-3 px-6 rounded-xl border-2 border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-xs sm:text-sm transition-all cursor-pointer"
                >
                  Đóng
                </button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
