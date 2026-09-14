'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp } from 'lucide-react'
import { useSystemSettings } from '@/lib/system-settings'

interface RecruitmentStatsCardProps {
  initialQuota: number
  initialMinScore: string
  initialFormat?: string
  initialLocation?: string
  deptCount: number
  deptNames: string
}

export function RecruitmentStatsCard({
  initialQuota,
  initialMinScore,
  initialFormat = 'Online & Offline',
  initialLocation = 'Trường Quốc tế VNU-IS / Google Meet',
  deptCount,
  deptNames,
}: RecruitmentStatsCardProps) {
  const { settings } = useSystemSettings()
  const [quota, setQuota] = useState<number>(initialQuota)
  const [minScore, setMinScore] = useState<string>(initialMinScore)
  const [format, setFormat] = useState<string>(initialFormat)
  const [location, setLocation] = useState<string>(initialLocation)

  // Đồng bộ khi settings thay đổi từ hook
  useEffect(() => {
    if (settings.recruitment_quota) {
      const q = parseInt(settings.recruitment_quota, 10)
      if (!isNaN(q)) setQuota(q)
    }
    if (settings.interview_min_score) {
      setMinScore(settings.interview_min_score)
    }
    if (settings.interview_format) {
      setFormat(settings.interview_format)
    }
    if (settings.interview_location) {
      setLocation(settings.interview_location)
    }
  }, [settings])

  // Lắng nghe broadcast / event trực tiếp
  useEffect(() => {
    const handleUpdate = (e: any) => {
      const vals = e.detail || {}
      if (vals.recruitment_quota) {
        const q = parseInt(vals.recruitment_quota, 10)
        if (!isNaN(q)) setQuota(q)
      }
      if (vals.interview_min_score) {
        setMinScore(vals.interview_min_score)
      }
      if (vals.interview_format) {
        setFormat(vals.interview_format)
      }
      if (vals.interview_location) {
        setLocation(vals.interview_location)
      }
    }

    window.addEventListener('issac_system_settings_updated', handleUpdate)
    return () => window.removeEventListener('issac_system_settings_updated', handleUpdate)
  }, [])

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-blue-600" />
          Thông số đợt tuyển iSSAC 2026
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              label: 'Chỉ tiêu tuyển chọn',
              value: `${quota} thành viên`,
              desc: `Chỉ tiêu phê duyệt TOP ${quota}`,
            },
            {
              label: 'Số ban tuyển quân',
              value: `${deptCount} Ban chuyên môn`,
              desc: deptNames || 'Ban Truyền thông, Ban Tư vấn, Ban Nhân sự',
            },
            {
              label: 'Điểm sàn phỏng vấn',
              value: `${minScore} / 10.0`,
              desc: `Ngưỡng xét vào Top ${quota}`,
            },
            {
              label: 'Hình thức phỏng vấn',
              value: format,
              desc: location,
            },
          ].map((item, i) => (
            <div key={i} className="bg-gray-50 rounded-xl p-4 border border-gray-100">
              <div className="text-lg font-black text-blue-800">{item.value}</div>
              <div className="text-sm font-semibold text-gray-900 mt-0.5">{item.label}</div>
              <div className="text-xs text-gray-500 mt-1">{item.desc}</div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
