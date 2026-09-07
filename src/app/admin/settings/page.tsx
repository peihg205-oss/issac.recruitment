'use client'
import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/use-toast'
import { Settings, Save, Loader2, Calendar, Users, BarChart3 } from 'lucide-react'

interface Setting {
  id: string
  key: string
  value: string | null
  label: string | null
  description: string | null
  value_type: string
}

const SETTING_GROUPS = {
  recruitment: {
    label: 'Kỳ tuyển dụng',
    icon: Calendar,
    keys: ['recruitment_start', 'recruitment_end', 'interview_start', 'interview_end', 'result_announcement'],
  },
  quota: {
    label: 'Chỉ tiêu & Kết quả',
    icon: Users,
    keys: ['recruitment_quota', 'allow_second_department', 'max_applications_per_user', 'results_published'],
  },
  scoring: {
    label: 'Chấm điểm',
    icon: BarChart3,
    keys: ['scoring_method'],
  },
}

export default function SettingsPage() {
  const supabase = createClient()
  const { toast } = useToast()
  const [settings, setSettings] = useState<Setting[]>([])
  const [values, setValues] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isSuperAdmin, setIsSuperAdmin] = useState(false)

  const fetchSettings = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
      setIsSuperAdmin(profile?.role === 'super_admin')
    }

    const { data } = await supabase.from('system_settings').select('*').order('key')
    setSettings(data || [])
    const valMap: Record<string, string> = {}
    data?.forEach(s => { valMap[s.key] = s.value || '' })
    setValues(valMap)
    setLoading(false)
  }, [supabase])

  useEffect(() => { fetchSettings() }, [fetchSettings])

  const handleSave = async () => {
    if (!isSuperAdmin) return
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()

    for (const key of Object.keys(values)) {
      await supabase.from('system_settings').update({ value: values[key], updated_by: user?.id }).eq('key', key)
    }

    // Log
    await supabase.from('audit_logs').insert({ user_id: user?.id, action: 'UPDATE_SETTINGS', description: 'Updated system settings' })

    setSaving(false)
    toast({ title: '✅ Đã lưu cài đặt', description: 'Cài đặt hệ thống đã được cập nhật.' } as Parameters<typeof toast>[0])
  }

  const renderInput = (setting: Setting) => {
    const key = setting.key
    const val = values[key] ?? ''
    const isDisabled = !isSuperAdmin

    if (setting.value_type === 'boolean') {
      return (
        <div className="flex items-center gap-3">
          <button
            onClick={() => !isDisabled && setValues(prev => ({ ...prev, [key]: prev[key] === 'true' ? 'false' : 'true' }))}
            disabled={isDisabled}
            className={`relative w-12 h-6 rounded-full transition-colors ${val === 'true' ? 'bg-blue-600' : 'bg-gray-300'} disabled:opacity-60`}
          >
            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${val === 'true' ? 'translate-x-7' : 'translate-x-1'}`} />
          </button>
          <span className="text-sm text-gray-600">{val === 'true' ? 'Bật' : 'Tắt'}</span>
        </div>
      )
    }

    return (
      <Input
        value={val}
        type={setting.value_type === 'date' ? 'date' : setting.value_type === 'number' ? 'number' : 'text'}
        onChange={e => setValues(prev => ({ ...prev, [key]: e.target.value }))}
        disabled={isDisabled}
        className={isDisabled ? 'bg-gray-50' : ''}
      />
    )
  }

  if (loading) {
    return <div className="flex items-center justify-center min-h-[300px]"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>
  }

  return (
    <div className="space-y-6 max-w-4xl animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
            <Settings className="w-6 h-6 text-blue-600" />
            Cài đặt Hệ thống
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {isSuperAdmin ? 'Bạn có quyền chỉnh sửa cài đặt.' : 'Chỉ Ban Chủ nhiệm mới có thể thay đổi cài đặt.'}
          </p>
        </div>
        {isSuperAdmin && (
          <Button onClick={handleSave} disabled={saving} className="gap-2">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Lưu cài đặt
          </Button>
        )}
      </div>

      {!isSuperAdmin && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-amber-800 text-sm">
          ⚠️ Bạn không có quyền chỉnh sửa cài đặt hệ thống. Chỉ Ban Chủ nhiệm mới có quyền này.
        </div>
      )}

      {Object.entries(SETTING_GROUPS).map(([groupKey, group]) => {
        const groupSettings = settings.filter(s => group.keys.includes(s.key))
        if (groupSettings.length === 0) return null
        return (
          <Card key={groupKey}>
            <CardHeader className="border-b border-gray-100">
              <CardTitle className="text-base flex items-center gap-2">
                <group.icon className="w-4 h-4 text-blue-600" />
                {group.label}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {groupSettings.map(setting => (
                  <div key={setting.key} className="space-y-1.5">
                    <Label htmlFor={setting.key}>{setting.label || setting.key}</Label>
                    {renderInput(setting)}
                    {setting.description && (
                      <p className="text-xs text-gray-400">{setting.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )
      })}

      {/* Raw settings for any additional ones */}
      {settings.filter(s => !Object.values(SETTING_GROUPS).flatMap(g => g.keys).includes(s.key)).length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Cài đặt khác</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {settings.filter(s => !Object.values(SETTING_GROUPS).flatMap(g => g.keys).includes(s.key)).map(setting => (
                <div key={setting.key} className="space-y-1.5">
                  <Label>{setting.label || setting.key}</Label>
                  {renderInput(setting)}
                  {setting.description && <p className="text-xs text-gray-400">{setting.description}</p>}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
