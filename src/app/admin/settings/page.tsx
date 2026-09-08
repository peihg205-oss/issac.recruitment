'use client'
import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/use-toast'
import { 
  Settings, Save, Loader2, Calendar, Users, BarChart3, 
  CheckCircle2, ShieldAlert, Sparkles, Sliders 
} from 'lucide-react'
import { ADMIN_ROLE_CONFIGS, type AdminRoleType, getAdminRoleFromCookie } from '@/lib/permissions'

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
  { id: 'set-1', key: 'recruitment_start', value: '2026-09-01', label: 'Ngày mở cổng nhận đơn', description: 'Thời điểm bắt đầu mở form đăng ký cho ứng viên', value_type: 'date' },
  { id: 'set-2', key: 'recruitment_end', value: '2026-10-15', label: 'Ngày đóng cổng nhận đơn', description: 'Hạn cuối cùng tiếp nhận hồ sơ ứng tuyển', value_type: 'date' },
  { id: 'set-3', key: 'interview_start', value: '2026-10-20', label: 'Ngày bắt đầu phỏng vấn', description: 'Thời gian khởi động các ca phỏng vấn Vòng 2', value_type: 'date' },
  { id: 'set-4', key: 'interview_end', value: '2026-10-30', label: 'Ngày kết thúc phỏng vấn', description: 'Hạn chót hoàn thành các ca phỏng vấn và nhập điểm', value_type: 'date' },
  { id: 'set-5', key: 'result_announcement', value: '2026-11-05', label: 'Ngày công bố kết quả tuyển quân', description: 'Ngày gửi email và mở tra cứu kết quả cho ứng viên', value_type: 'date' },

  // Chỉ tiêu & Kết quả
  { id: 'set-6', key: 'recruitment_quota', value: '15', label: 'Chỉ tiêu tuyển chọn (Top CLB)', description: 'Số lượng ứng viên chính thức trúng tuyển đợt này (Top 15)', value_type: 'number' },
  { id: 'set-7', key: 'allow_second_department', value: 'true', label: 'Cho phép đăng ký Nguyện vọng 2', description: 'Ứng viên có thể chọn thêm ban phụ trong đơn ứng tuyển', value_type: 'boolean' },
  { id: 'set-8', key: 'max_applications_per_user', value: '1', label: 'Số đơn tối đa mỗi ứng viên', description: 'Số lần ứng tuyển tối đa của một tài khoản sinh viên', value_type: 'number' },
  { id: 'set-9', key: 'results_published', value: 'false', label: 'Công bố kết quả tuyển quân ra ngoài', description: 'Khi Bật, ứng viên có thể tra cứu kết quả Pass/Dự bị/Trượt tại trang cá nhân', value_type: 'boolean' },

  // Chấm điểm & Quy chế
  { id: 'set-10', key: 'scoring_method', value: 'weighted', label: 'Phương pháp tính điểm phỏng vấn', description: 'Thang điểm 10 chuẩn hóa theo 4 tiêu chí cốt lõi của iSSAC', value_type: 'string' },
  { id: 'set-11', key: 'auto_sync_evaluations', value: 'true', label: 'Tự động đồng bộ điểm số sang Bảng xếp hạng', description: 'Cập nhật điểm trung bình ngay khi Giám khảo nộp phiếu chấm', value_type: 'boolean' },
]

const SETTING_GROUPS = {
  recruitment: {
    label: 'Kỳ tuyển quân',
    icon: Calendar,
    keys: ['recruitment_start', 'recruitment_end', 'interview_start', 'interview_end', 'result_announcement'],
  },
  quota: {
    label: 'Chỉ tiêu & Kết quả',
    icon: Users,
    keys: ['recruitment_quota', 'allow_second_department', 'max_applications_per_user', 'results_published'],
  },
  scoring: {
    label: 'Chấm điểm & Quy chế',
    icon: BarChart3,
    keys: ['scoring_method', 'auto_sync_evaluations'],
  },
}

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

  const fetchSettings = useCallback(async () => {
    setLoading(true)
    let loadedSettings: Setting[] = []

    try {
      const { data } = await supabase.from('system_settings').select('*').order('key')
      if (data && data.length > 0) {
        loadedSettings = data as Setting[]
      }
    } catch {
      // Demo fallback
    }

    // If supabase returned empty or error, use local storage or defaults
    if (loadedSettings.length === 0) {
      const savedLocal = typeof window !== 'undefined' ? localStorage.getItem('issac_system_settings') : null
      if (savedLocal) {
        try {
          const parsed = JSON.parse(savedLocal)
          loadedSettings = DEFAULT_SYSTEM_SETTINGS.map(s => ({
            ...s,
            value: parsed[s.key] !== undefined ? parsed[s.key] : s.value
          }))
        } catch {
          loadedSettings = DEFAULT_SYSTEM_SETTINGS
        }
      } else {
        loadedSettings = DEFAULT_SYSTEM_SETTINGS
      }
    }

    setSettings(loadedSettings)
    const valMap: Record<string, string> = {}
    loadedSettings.forEach(s => { valMap[s.key] = s.value || '' })
    setValues(valMap)
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
      // Save to localStorage so demo persists instantly
      if (typeof window !== 'undefined') {
        localStorage.setItem('issac_system_settings', JSON.stringify(values))
      }

      // Try Supabase if connected
      const { data: { user } } = await supabase.auth.getUser()
      for (const key of Object.keys(values)) {
        await supabase.from('system_settings').update({ value: values[key], updated_by: user?.id }).eq('key', key)
      }
      await supabase.from('audit_logs').insert({ user_id: user?.id, action: 'UPDATE_SETTINGS', description: 'Updated system settings' })
    } catch {
      // Demo fallback
    } finally {
      setSaving(false)
      toast({ 
        title: '✅ Đã lưu cài đặt hệ thống', 
        description: 'Các thay đổi đã được áp dụng thành công cho toàn CLB iSSAC.' 
      } as Parameters<typeof toast>[0])
    }
  }

  const renderInput = (setting: Setting) => {
    const key = setting.key
    const val = values[key] ?? ''
    const isDisabled = !isSuperAdmin

    if (setting.value_type === 'boolean') {
      return (
        <div className="flex items-center gap-3 pt-1">
          <button
            type="button"
            onClick={() => !isDisabled && setValues(prev => ({ ...prev, [key]: prev[key] === 'true' ? 'false' : 'true' }))}
            disabled={isDisabled}
            className={`relative w-12 h-6 rounded-full transition-colors ${val === 'true' ? 'bg-blue-600' : 'bg-gray-300'} disabled:opacity-60 cursor-pointer disabled:cursor-not-allowed`}
          >
            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${val === 'true' ? 'translate-x-7' : 'translate-x-1'}`} />
          </button>
          <span className={`text-xs font-bold ${val === 'true' ? 'text-blue-700' : 'text-gray-500'}`}>
            {val === 'true' ? 'Đang bật (Active)' : 'Đang tắt (Inactive)'}
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
        className={`text-xs sm:text-sm ${isDisabled ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : 'bg-white font-medium'}`}
      />
    )
  }

  if (loading) {
    return <div className="flex items-center justify-center min-h-[300px]"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-gray-900 flex items-center gap-2">
            <Settings className="w-6 h-6 text-blue-600" />
            Cài đặt Hệ thống
          </h1>
          <p className="text-gray-500 text-xs sm:text-sm mt-1">
            Vai trò hiện tại: <strong className="text-gray-900 font-bold">{currentRoleConfig.label}</strong> ({currentRoleConfig.shortLabel})
          </p>
        </div>

        {isSuperAdmin ? (
          <Button onClick={handleSave} disabled={saving} variant="gold" className="gap-2 font-bold shadow-xs">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Lưu cài đặt
          </Button>
        ) : (
          <Badge className="bg-gray-100 text-gray-700 border-gray-300 font-medium text-xs px-3 py-1">
            Chỉ xem (Read-only)
          </Badge>
        )}
      </div>

      {/* Role Notice Banner */}
      {isSuperAdmin ? (
        <div className="bg-emerald-50/80 border border-emerald-200 rounded-xl p-4 text-emerald-900 text-xs sm:text-sm flex items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>
              Bạn đang ở tài khoản <strong>Ban Chủ nhiệm</strong>. Bạn có toàn quyền thiết lập lịch trình tuyển quân, chỉ tiêu và quy chế hệ thống.
            </span>
          </div>
          <Badge className="bg-emerald-600 text-white font-bold text-[11px] shrink-0 hidden sm:inline-flex">
            Toàn quyền quản trị
          </Badge>
        </div>
      ) : (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-amber-900 text-xs sm:text-sm flex items-center gap-2.5 shadow-2xs">
          <ShieldAlert className="w-5 h-5 text-amber-700 shrink-0" />
          <span>
            Bạn đang đăng nhập với vai trò <strong>{currentRoleConfig.shortLabel}</strong> ({currentRoleConfig.label}). Bạn có thể xem các thông số nhưng chỉ Ban Chủ nhiệm mới có quyền thay đổi cài đặt hệ thống.
          </span>
        </div>
      )}

      {/* Settings Sections */}
      {Object.entries(SETTING_GROUPS).map(([groupKey, group]) => {
        const groupSettings = settings.filter(s => group.keys.includes(s.key))
        if (groupSettings.length === 0) return null
        return (
          <Card key={groupKey} className="shadow-xs border overflow-hidden">
            <CardHeader className="py-3.5 px-5 border-b bg-gray-50/80">
              <CardTitle className="text-sm sm:text-base font-bold text-gray-900 flex items-center gap-2">
                <group.icon className="w-4 h-4 text-blue-600" />
                {group.label}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {groupSettings.map(setting => (
                  <div key={setting.key} className="space-y-1.5 p-3 rounded-xl bg-gray-50/50 border border-gray-100">
                    <Label htmlFor={setting.key} className="text-xs font-bold text-gray-800 block">
                      {setting.label || setting.key}
                    </Label>
                    {renderInput(setting)}
                    {setting.description && (
                      <p className="text-[11px] text-gray-500 leading-snug pt-0.5">{setting.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )
      })}

      {/* Bottom Save Action */}
      {isSuperAdmin && (
        <div className="flex justify-end pt-2">
          <Button onClick={handleSave} disabled={saving} variant="gold" size="lg" className="gap-2 font-black shadow-xs">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Lưu toàn bộ cài đặt hệ thống
          </Button>
        </div>
      )}
    </div>
  )
}
