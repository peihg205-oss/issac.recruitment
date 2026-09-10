'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/use-toast'
import { 
  Settings, Save, Loader2, Calendar, Users, BarChart3, 
  CheckCircle2, ShieldAlert, Sparkles, Check, FileCheck2,
  Lock, Unlock, Award, Clock
} from 'lucide-react'
import { ADMIN_ROLE_CONFIGS, type AdminRoleType, getAdminRoleFromCookie } from '@/lib/permissions'
import { getAdminAccounts } from '@/lib/admin-account-manager'
import { formatDate } from '@/lib/utils'

interface Setting {
  id: string
  key: string
  value: string | null
  label: string | null
  description: string | null
  value_type: string
}

const DEFAULT_SYSTEM_SETTINGS: Setting[] = [
  // Kỳ tuyển quân
  { id: 'set-1', key: 'recruitment_start', value: '2026-09-10', label: 'Ngày mở đơn', description: 'Thời điểm bắt đầu tiếp nhận hồ sơ ứng tuyển', value_type: 'date' },
  { id: 'set-2', key: 'recruitment_end', value: '2026-09-20', label: 'Ngày đóng đơn', description: 'Hạn cuối cùng tiếp nhận hồ sơ ứng tuyển', value_type: 'date' },
  { id: 'set-12', key: 'questions_published', value: 'true', label: 'Công khai bộ câu hỏi & Cho phép làm đơn', description: 'Khi Bật, ứng viên được mở khóa làm đơn tuyển quân. Khi Tắt, chỉ có thể cập nhật hồ sơ cá nhân.', value_type: 'boolean' },
  { id: 'set-3', key: 'interview_start', value: '2026-09-22', label: 'Ngày bắt đầu phỏng vấn', description: 'Thời gian khởi động các ca phỏng vấn', value_type: 'date' },
  { id: 'set-4', key: 'interview_end', value: '2026-09-25', label: 'Ngày kết thúc phỏng vấn', description: 'Hạn chót hoàn thành các ca phỏng vấn và nhập điểm', value_type: 'date' },
  { id: 'set-5', key: 'result_announcement', value: '2026-09-28', label: 'Ngày công bố kết quả', description: 'Thời gian công bố danh sách trúng tuyển ra ngoài', value_type: 'date' },

  // Chỉ tiêu & Kết quả
  { id: 'set-6', key: 'recruitment_quota', value: '15', label: 'Chỉ tiêu tuyển chọn (Top CLB)', description: 'Số lượng ứng viên chính thức trúng tuyển đợt này theo quy chế', value_type: 'number' },
  { id: 'set-7', key: 'allow_second_department', value: 'true', label: 'Cho phép đăng ký Nguyện vọng 2', description: 'Ứng viên có thể chọn thêm ban phụ trong hồ sơ ứng tuyển', value_type: 'boolean' },
  { id: 'set-8', key: 'max_applications_per_user', value: '1', label: 'Số đơn tối đa mỗi ứng viên', description: 'Số lần ứng tuyển tối đa cho mỗi tài khoản sinh viên', value_type: 'number' },
  { id: 'set-9', key: 'results_published', value: 'false', label: 'Công bố kết quả tuyển quân ra ngoài', description: 'Khi Bật, ứng viên có thể tra cứu kết quả Pass/Dự bị/Trượt tại trang cá nhân', value_type: 'boolean' },

  // Chấm điểm & Quy chế
  { id: 'set-10', key: 'scoring_method', value: 'weighted', label: 'Phương pháp tính điểm phỏng vấn', description: 'Thang điểm 10 chuẩn hóa theo 4 tiêu chí cốt lõi của iSSAC', value_type: 'string' },
  { id: 'set-11', key: 'auto_sync_evaluations', value: 'true', label: 'Tự động đồng bộ sang Bảng xếp hạng', description: 'Cập nhật điểm trung bình ngay khi Giám khảo nộp phiếu chấm', value_type: 'boolean' },
]

const SETTING_GROUPS = [
  {
    key: 'recruitment',
    label: 'Kỳ tuyển quân',
    subLabel: 'Lịch trình nộp đơn, làm bài và tổ chức phỏng vấn',
    icon: Calendar,
    keys: ['recruitment_start', 'recruitment_end', 'questions_published', 'interview_start', 'interview_end', 'result_announcement'],
  },
  {
    key: 'quota',
    label: 'Chỉ tiêu & Kết quả',
    subLabel: 'Chỉ tiêu trúng tuyển Top CLB và chế độ công bố',
    icon: Users,
    keys: ['recruitment_quota', 'allow_second_department', 'max_applications_per_user', 'results_published'],
  },
  {
    key: 'scoring',
    label: 'Chấm điểm & Quy chế',
    subLabel: 'Quy chế tính điểm và đồng bộ dữ liệu xếp hạng',
    icon: BarChart3,
    keys: ['scoring_method', 'auto_sync_evaluations'],
  },
]

export default function SettingsPage() {
  const supabase = createClient()
  const { toast } = useToast()
  const [settings, setSettings] = useState<Setting[]>([])
  const [values, setValues] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeRole, setActiveRole] = useState<AdminRoleType>('chu-nhiem')

  // Sync role from cookie
  useEffect(() => {
    const role = getAdminRoleFromCookie(document.cookie)
    setActiveRole(role)

    const interval = setInterval(() => {
      const currentRole = getAdminRoleFromCookie(document.cookie)
      setActiveRole(prev => (prev !== currentRole ? currentRole : prev))
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  const currentRoleConfig = ADMIN_ROLE_CONFIGS[activeRole] || ADMIN_ROLE_CONFIGS['chu-nhiem']
  const isSuperAdmin = activeRole === 'chu-nhiem' || currentRoleConfig.isSuperAdmin
  const [adminName, setAdminName] = useState<string>('')

  useEffect(() => {
    const updateName = () => {
      const accounts = getAdminAccounts()
      if (accounts[activeRole]?.name) {
        setAdminName(accounts[activeRole].name)
      } else {
        setAdminName(currentRoleConfig.label)
      }
    }
    updateName()
    const interval = setInterval(updateName, 1000)
    return () => clearInterval(interval)
  }, [activeRole, currentRoleConfig.label])

  const fetchSettings = useCallback(async () => {
    setLoading(true)

    // 1. Read existing local overrides first
    let localSavedMap: Record<string, string> = {}
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem('issac_system_settings')
        if (raw) {
          localSavedMap = JSON.parse(raw)
        }
      } catch {}
    }

    // 2. Query Supabase for base settings definitions & metadata
    let remoteSettings: Setting[] = []
    try {
      const { data } = await supabase.from('system_settings').select('*').order('key')
      if (data && data.length > 0) {
        remoteSettings = data as Setting[]
      }
    } catch {
      // Demo fallback
    }

    // 3. Merge: Default Settings -> Remote Settings -> Local Admin Saved Values
    const settingsList: Setting[] = DEFAULT_SYSTEM_SETTINGS.map(def => {
      const remote = remoteSettings.find(r => r.key === def.key)
      const localVal = localSavedMap[def.key]

      const effectiveVal = (localVal !== undefined && localVal !== null)
        ? localVal
        : (remote?.value ?? def.value)

      return {
        id: remote?.id || def.id,
        key: def.key,
        label: remote?.label || def.label,
        description: remote?.description || def.description,
        value_type: remote?.value_type || def.value_type,
        value: effectiveVal,
      }
    })

    // Include any remote settings not in default list
    remoteSettings.forEach(rem => {
      if (!settingsList.some(s => s.key === rem.key)) {
        const localVal = localSavedMap[rem.key]
        settingsList.push({
          ...rem,
          value: (localVal !== undefined && localVal !== null) ? localVal : rem.value
        })
      }
    })

    setSettings(settingsList)
    const valMap: Record<string, string> = {}
    settingsList.forEach(s => { valMap[s.key] = s.value || '' })
    setValues(valMap)

    // Ensure localStorage has the complete updated map
    if (typeof window !== 'undefined') {
      localStorage.setItem('issac_system_settings', JSON.stringify(valMap))
      if (valMap['recruitment_quota']) {
        localStorage.setItem('issac_recruitment_quota', valMap['recruitment_quota'])
      }
      if (valMap['results_published']) {
        localStorage.setItem('issac_results_published', valMap['results_published'])
      }
    }

    setLoading(false)
  }, [supabase])

  useEffect(() => { fetchSettings() }, [fetchSettings])

  const handleSave = async () => {
    if (!isSuperAdmin) {
      toast({
        title: 'Quyền bị từ chối',
        description: 'Chỉ Ban Chủ nhiệm mới có quyền thay đổi cài đặt hệ thống.',
        variant: 'destructive',
      } as Parameters<typeof toast>[0])
      return
    }

    setSaving(true)
    try {
      // 1. Immediately persist to localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('issac_system_settings', JSON.stringify(values))
        if (values['recruitment_quota'] !== undefined) {
          localStorage.setItem('issac_recruitment_quota', values['recruitment_quota'])
        }
        if (values['results_published'] !== undefined) {
          localStorage.setItem('issac_results_published', values['results_published'])
        }
        localStorage.setItem('issac_system_settings_saved_at', Date.now().toString())
        localStorage.setItem('issac_last_eval_update', Date.now().toString())

        // 2. Dispatch events for same-window active listeners
        window.dispatchEvent(new CustomEvent('issac_system_settings_updated', { detail: values }))
        window.dispatchEvent(new CustomEvent('issac_eval_updated'))
        if (values['results_published'] === 'true') {
          window.dispatchEvent(new CustomEvent('issac_results_published'))
        }

        // 3. Broadcast to all open tabs
        if ('BroadcastChannel' in window) {
          const bc = new BroadcastChannel('issac_eval_channel')
          const isPub = values['results_published'] === 'true'
          const quotaNum = values['recruitment_quota'] ? parseInt(values['recruitment_quota'], 10) : undefined
          bc.postMessage({
            type: 'settings_updated',
            values,
            quota: quotaNum,
            published: isPub,
            timestamp: Date.now()
          })
          if (isPub) {
            bc.postMessage({
              type: 'results_published',
              published: true,
              quota: quotaNum,
              timestamp: Date.now()
            })
          }
          bc.close()
        }
      }

      // 4. Update in-memory state so UI immediately reflects it
      setSettings(prev => prev.map(s => ({
        ...s,
        value: values[s.key] !== undefined ? values[s.key] : s.value
      })))

      // 5. Try Supabase update if connected and permitted
      const { data: { user } } = await supabase.auth.getUser()
      for (const key of Object.keys(values)) {
        await supabase
          .from('system_settings')
          .update({ value: values[key], updated_by: user?.id, updated_at: new Date().toISOString() })
          .eq('key', key)
      }
      if (user?.id) {
        await supabase.from('audit_logs').insert({ user_id: user.id, action: 'UPDATE_SETTINGS', description: 'Updated system settings' })
      }
    } catch (err) {
      console.warn('Supabase settings sync warning:', err)
    } finally {
      setSaving(false)
      toast({ 
        title: '✅ Đã lưu cài đặt hệ thống', 
        description: 'Các thay đổi đã được áp dụng thành công cho toàn hệ thống tuyển quân iSSAC.' 
      } as Parameters<typeof toast>[0])
    }
  }

  const renderInput = (setting: Setting) => {
    const key = setting.key
    const val = values[key] ?? ''
    const isDisabled = !isSuperAdmin

    if (setting.value_type === 'boolean') {
      const isChecked = val === 'true'
      return (
        <div className="flex items-center justify-between pt-1">
          <button
            type="button"
            onClick={() => !isDisabled && setValues(prev => ({ ...prev, [key]: isChecked ? 'false' : 'true' }))}
            disabled={isDisabled}
            className={`relative inline-flex h-7 w-13 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden disabled:opacity-50 disabled:cursor-not-allowed ${
              isChecked ? 'bg-[#1657c1]' : 'bg-slate-200'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                isChecked ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
          <span className={`text-xs font-black px-2.5 py-1 rounded-lg ${
            isChecked 
              ? 'bg-blue-50 text-[#1657c1] border border-blue-200' 
              : 'bg-slate-100 text-slate-500 border border-slate-200'
          }`}>
            {isChecked ? 'Đang bật (Active)' : 'Đang tắt (Inactive)'}
          </span>
        </div>
      )
    }

    return (
      <Input
        value={val}
        type={setting.value_type === 'date' ? 'date' : setting.value_type === 'number' ? 'number' : 'text'}
        onChange={e => setValues(prev => ({ ...prev, [key]: e.target.value }))}
        disabled={isDisabled}
        className={`h-11 text-xs sm:text-sm rounded-xl transition-all ${
          isDisabled 
            ? 'bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed' 
            : 'bg-white text-slate-900 border-slate-200 focus:border-[#1657c1] focus:ring-1 focus:ring-[#1657c1] font-semibold'
        }`}
      />
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[350px]">
        <Loader2 className="w-8 h-8 animate-spin text-[#1657c1]" />
      </div>
    )
  }

  // Chặn truy cập nếu không phải Ban Chủ nhiệm
  if (activeRole !== 'chu-nhiem') {
    return (
      <div className="min-h-[500px] flex flex-col items-center justify-center text-center p-6 space-y-4 animate-fade-in">
        <div className="w-16 h-16 rounded-3xl bg-amber-100 text-amber-700 flex items-center justify-center shadow-xs">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <div className="space-y-1.5">
          <h2 className="text-xl sm:text-2xl font-black text-slate-900">Giới hạn quyền quản trị Ban Chủ nhiệm</h2>
          <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
            Chức năng <strong>Cài đặt hệ thống</strong> chỉ dành riêng cho Ban Chủ nhiệm CLB iSSAC. Bạn đang đăng nhập với tư cách Ban chuyên môn.
          </p>
        </div>
        <Link href="/admin/dashboard">
          <Button className="bg-[#1657c1] hover:bg-blue-800 text-white font-bold rounded-xl text-xs h-10 px-5 shadow-sm">
            Quay về Dashboard
          </Button>
        </Link>
      </div>
    )
  }

  // Tính trạng thái nhanh cho các thẻ stats
  const isQuestionOpen = values['questions_published'] === 'true'
  const isResultPublished = values['results_published'] === 'true'
  const quota = values['recruitment_quota'] || '15'

  return (
    <div className="space-y-6 animate-fade-in font-sans pb-12">
      {/* Header chuẩn phong cách các trang quản trị */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 flex items-center gap-3 tracking-tight">
            <Settings className="w-7 h-7 text-[#1657c1]" />
            Cài đặt Hệ thống
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-1 font-medium">
            Thiết lập lịch trình tuyển quân, chỉ tiêu trúng tuyển và quy chế toàn hệ thống
          </p>
        </div>

        {isSuperAdmin ? (
          <Button 
            onClick={handleSave} 
            disabled={saving} 
            className="gap-2 bg-[#fdc455] hover:bg-[#f59e0b] text-slate-950 font-black text-xs sm:text-sm rounded-xl px-5 py-2.5 shadow-sm hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>Lưu cài đặt</span>
          </Button>
        ) : (
          <Badge className="bg-slate-100 text-slate-600 border-slate-300 font-bold text-xs px-3 py-1.5 rounded-xl">
            Chỉ xem (Read-only)
          </Badge>
        )}
      </div>

      {/* Overview Stat Cards - Style viền xen kẽ Vàng - Xanh - Vàng - Xanh (bắt đầu từ Vàng) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Card 1: Vàng - Thời hạn nộp đơn */}
        <div className="p-4 rounded-2xl bg-white border-2 border-[#fdc455] shadow-xs flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-amber-950 bg-[#fdc455] px-2.5 py-0.5 rounded shadow-2xs">
              Cổng nhận đơn
            </span>
            <span className="text-[11px] font-semibold text-amber-800">
              {values['recruitment_end'] ? `Hạn: ${formatDate(values['recruitment_end'])}` : 'Đang thiết lập'}
            </span>
          </div>
          <div className="text-lg sm:text-xl font-black text-slate-900 pt-1 flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-amber-600 shrink-0" />
            <span className="truncate">{values['recruitment_end'] ? formatDate(values['recruitment_end']) : 'Chưa đặt'}</span>
          </div>
        </div>

        {/* Card 2: Xanh - Chỉ tiêu tuyển chọn */}
        <div className="p-4 rounded-2xl bg-white border-2 border-[#1657c1] shadow-xs flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-white bg-[#1657c1] px-2.5 py-0.5 rounded shadow-2xs">
              Chỉ tiêu tuyển chọn
            </span>
            <span className="text-[11px] font-semibold text-blue-800">Top CLB</span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 pt-1 flex items-baseline gap-1">
            {quota} <span className="text-xs font-bold text-slate-400">ứng viên</span>
          </div>
        </div>

        {/* Card 3: Vàng - Bộ câu hỏi & Làm đơn */}
        <div className="p-4 rounded-2xl bg-white border-2 border-[#fdc455] shadow-xs flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-amber-950 bg-[#fdc455] px-2.5 py-0.5 rounded shadow-2xs">
              Bộ câu hỏi
            </span>
            <span className={`text-[11px] font-semibold ${isQuestionOpen ? 'text-emerald-700' : 'text-slate-500'}`}>
              {isQuestionOpen ? 'Đang mở' : 'Đang khóa'}
            </span>
          </div>
          <div className="text-lg sm:text-xl font-black text-slate-900 pt-1 flex items-center gap-1.5">
            {isQuestionOpen ? (
              <>
                <Unlock className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="text-emerald-700 text-sm sm:text-base">Mở làm đơn</span>
              </>
            ) : (
              <>
                <Lock className="w-4 h-4 text-slate-400 shrink-0" />
                <span className="text-slate-600 text-sm sm:text-base">Tạm khóa đơn</span>
              </>
            )}
          </div>
        </div>

        {/* Card 4: Xanh - Công bố kết quả */}
        <div className="p-4 rounded-2xl bg-white border-2 border-[#1657c1] shadow-xs flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-white bg-[#1657c1] px-2.5 py-0.5 rounded shadow-2xs">
              Công bố kết quả
            </span>
            <span className={`text-[11px] font-semibold ${isResultPublished ? 'text-blue-800' : 'text-slate-500'}`}>
              {isResultPublished ? 'Công khai' : 'Đang ẩn'}
            </span>
          </div>
          <div className="text-lg sm:text-xl font-black text-slate-900 pt-1 flex items-center gap-1.5">
            <Award className={`w-4 h-4 shrink-0 ${isResultPublished ? 'text-[#1657c1]' : 'text-slate-400'}`} />
            <span className={`text-sm sm:text-base ${isResultPublished ? 'text-[#1657c1]' : 'text-slate-600'}`}>
              {isResultPublished ? 'Đã công bố' : 'Chưa công bố'}
            </span>
          </div>
        </div>
      </div>

      {/* Role Notice Banner */}
      <div className="bg-emerald-50/80 border-2 border-emerald-200/80 rounded-2xl p-4 text-emerald-950 text-xs sm:text-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-2.5">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>
            Tài khoản quản trị: <strong className="font-bold">{adminName || currentRoleConfig.label}</strong> ({currentRoleConfig.shortLabel}). Bạn có toàn quyền thiết lập lịch trình tuyển quân, chỉ tiêu và quy chế hệ thống.
          </span>
        </div>
        <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-black bg-emerald-600 text-white uppercase tracking-wider shrink-0 self-start sm:self-auto">
          Toàn quyền quản trị
        </span>
      </div>

      {/* Settings Sections - Thiết kế viền xen kẽ Vàng - Xanh - Vàng, bắt đầu từ Vàng trước */}
      <div className="space-y-6">
        {SETTING_GROUPS.map((group, groupIdx) => {
          const groupSettings = settings.filter(s => group.keys.includes(s.key))
          if (groupSettings.length === 0) return null

          // Xen kẽ: Chẵn là Vàng (groupIdx = 0, 2), Lẻ là Xanh (groupIdx = 1)
          const isGold = groupIdx % 2 === 0
          const borderColor = isGold ? 'border-[#fdc455]' : 'border-[#1657c1]'
          const badgeBg = isGold ? 'bg-[#fdc455] text-amber-950' : 'bg-[#1657c1] text-white'
          const iconColor = isGold ? 'text-amber-700' : 'text-[#1657c1]'

          return (
            <div 
              key={group.key} 
              className={`rounded-3xl border-2 ${borderColor} bg-white shadow-xs overflow-hidden transition-all`}
            >
              {/* Card Header */}
              <div className="p-5 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-b from-slate-50/80 to-transparent">
                <div className="flex items-center gap-3">
                  <span className={`text-[11px] sm:text-xs font-black uppercase tracking-wider px-3 py-1 rounded-lg shadow-2xs ${badgeBg}`}>
                    {group.label}
                  </span>
                  <span className="text-xs sm:text-sm font-semibold text-slate-500 hidden sm:inline">
                    {group.subLabel}
                  </span>
                </div>
                <div className={`flex items-center gap-1.5 text-xs font-bold ${iconColor}`}>
                  <group.icon className="w-4 h-4" />
                  <span>Cấu hình {group.label}</span>
                </div>
              </div>

              {/* Card Body - Grid 2 cột */}
              <div className="p-5 sm:p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
                  {groupSettings.map(setting => (
                    <div 
                      key={setting.key} 
                      className={`p-4 rounded-2xl border transition-colors space-y-2 flex flex-col justify-between ${
                        setting.value_type === 'boolean'
                          ? 'bg-slate-50/70 border-slate-200/90'
                          : 'bg-white border-slate-200/80 hover:border-slate-300'
                      }`}
                    >
                      <div className="space-y-1">
                        <Label htmlFor={setting.key} className="text-xs sm:text-sm font-black text-slate-900 block leading-snug">
                          {setting.label || setting.key}
                        </Label>
                        {setting.description && (
                          <p className="text-[11px] text-slate-500 leading-relaxed">
                            {setting.description}
                          </p>
                        )}
                      </div>

                      <div className="pt-1">
                        {renderInput(setting)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Bottom Save Action */}
      {isSuperAdmin && (
        <div className="flex justify-end pt-2">
          <Button 
            onClick={handleSave} 
            disabled={saving} 
            className="w-full sm:w-auto gap-2 bg-[#fdc455] hover:bg-[#f59e0b] text-slate-950 font-black text-sm rounded-xl px-8 py-3.5 shadow-md hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>Lưu toàn bộ cài đặt hệ thống</span>
          </Button>
        </div>
      )}
    </div>
  )
}
