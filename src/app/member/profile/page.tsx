'use client'
import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/components/ui/use-toast'
import { Loader2 } from 'lucide-react'
import Link from 'next/link'

const profileSchema = z.object({
  full_name: z.string().min(2, 'Họ tên phải có ít nhất 2 ký tự'),
  phone: z.string().regex(/^([0-9]{10,11})?$/, 'Số điện thoại không hợp lệ').optional().or(z.literal('')),
  date_of_birth: z.string().optional().or(z.literal('')),
  gender: z.string().optional().or(z.literal('')),
  student_id: z.string().optional().or(z.literal('')),
  university: z.string().optional().or(z.literal('')),
  cohort: z.string().optional().or(z.literal('')),
  major: z.string().optional().or(z.literal('')),
  high_school: z.string().optional().or(z.literal('')),
  address: z.string().optional().or(z.literal('')),
})

type FormData = z.infer<typeof profileSchema>

export default function MemberProfilePage() {
  const supabase = createClient()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [locked, setLocked] = useState(false)
  const [profileComplete, setProfileComplete] = useState(false)

  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(profileSchema)
  })

  const gender = watch('gender')

  const fetchProfile = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      reset({
        full_name: 'Nguyễn Hà Phương',
        phone: '0987123456',
        date_of_birth: '2004-05-15',
        gender: 'Nữ',
        student_id: '22070142',
        university: 'Trường Quốc tế - ĐHQGHN (VNU-IS)',
        cohort: 'K22',
        major: 'Hệ thống thông tin quản lý (MIS)',
        high_school: 'THPT Chuyên Ngoại ngữ',
        address: 'Thanh Xuân, Hà Nội',
      })
      setProfileComplete(true)
      setLoading(false)
      return
    }

    const [{ data: profile }, { data: app }] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).single(),
      supabase.from('applications').select('status').eq('user_id', user.id).limit(1).single()
    ])

    if (profile) {
      reset({
        full_name: profile.full_name || '',
        phone: profile.phone || '',
        date_of_birth: profile.date_of_birth || '',
        gender: profile.gender || '',
        student_id: profile.student_id || '',
        university: profile.university || '',
        cohort: profile.cohort || '',
        major: profile.major || '',
        high_school: profile.high_school || '',
        address: profile.address || '',
      })
      setProfileComplete(!!(profile.full_name && profile.phone && profile.student_id && profile.university))
    }

    if (app && !['draft'].includes(app.status)) {
      setLocked(true)
    }

    setLoading(false)
  }, [supabase, reset])

  useEffect(() => { fetchProfile() }, [fetchProfile])

  const onSubmit = async (data: FormData) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setSaving(true)
      setTimeout(() => {
        setSaving(false)
        toast({ title: 'Đã lưu hồ sơ thành công!', description: 'Thông tin cá nhân của bạn đã được cập nhật.' })
      }, 500)
      return
    }
    setSaving(true)

    const { error } = await supabase.from('profiles').update({
      full_name: data.full_name,
      phone: data.phone || null,
      date_of_birth: data.date_of_birth || null,
      gender: data.gender || null,
      student_id: locked ? undefined : (data.student_id || null),
      university: locked ? undefined : (data.university || null),
      cohort: data.cohort || null,
      major: data.major || null,
      high_school: locked ? undefined : (data.high_school || null),
      address: data.address || null,
    }).eq('id', user.id)

    setSaving(false)
    if (error) {
      toast({ title: 'Lỗi', description: error.message, variant: 'destructive' })
    } else {
      toast({ title: 'Đã lưu hồ sơ thành công!', description: 'Thông tin cá nhân của bạn đã được cập nhật.' })
      fetchProfile()
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-[#1657c1]" />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto animate-fade-in pb-12 font-sans">
      {/* 1. Header: Đồng bộ font chữ & phong cách iSSAC */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 tracking-tight">
            HỒ SƠ CÁ NHÂN iSSAC 2026
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            Cập nhật đầy đủ và chính xác thông tin để hoàn thiện hồ sơ ứng tuyển
          </p>
        </div>
        <Link
          href="/member/dashboard"
          className="px-4 py-2 rounded-xl border-2 border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-xs transition-all"
        >
          Về Tổng quan
        </Link>
      </div>

      {/* Thông báo trạng thái hồ sơ - Tông xanh iSSAC, không icon */}
      {profileComplete && (
        <div className="flex items-center justify-between gap-3 p-4 rounded-2xl bg-blue-50/70 border-2 border-blue-200/80 text-xs sm:text-sm">
          <span className="font-bold text-[#1657c1]">
            Hồ sơ cá nhân đã hoàn thiện. Bạn đã sẵn sàng tham gia các vòng tuyển chọn của CLB.
          </span>
          <Link
            href="/member/application"
            className="px-3.5 py-1.5 rounded-lg bg-[#fdc455] hover:bg-[#f59e0b] text-slate-950 font-black text-xs shrink-0 shadow-xs transition-all"
          >
            Đến trang Đơn ứng tuyển
          </Link>
        </div>
      )}

      {locked && (
        <div className="p-4 rounded-2xl bg-amber-50/70 border-2 border-amber-300 text-xs sm:text-sm text-amber-950 leading-relaxed">
          <strong>Lưu ý:</strong> Một số thông tin định danh (MSSV, Trường, THPT) đã được khóa cố định sau khi nộp đơn ứng tuyển chính thức.
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Phần 1: Thông tin cá nhân */}
        <div className="bg-white border-2 border-slate-200/90 rounded-3xl p-6 sm:p-7 shadow-xs space-y-5">
          <div className="border-b border-slate-100 pb-3.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-md text-xs font-black uppercase tracking-wide bg-[#1657c1] text-white">
                Phần 1
              </span>
              <h2 className="text-base font-bold text-slate-900">
                Thông tin cá nhân
              </h2>
            </div>
            <span className="text-xs text-slate-500 font-medium">Thông tin cơ bản</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="full_name" className="text-xs font-bold text-slate-700">
                Họ và tên <span className="text-red-500">*</span>
              </Label>
              <Input
                id="full_name"
                {...register('full_name')}
                placeholder="Nguyễn Văn A"
                className={`rounded-xl border-slate-200 h-11 text-xs sm:text-sm bg-white focus:border-[#1657c1] focus:ring-2 focus:ring-blue-100 ${errors.full_name ? 'border-red-300 ring-2 ring-red-100' : ''}`}
              />
              {errors.full_name && <p className="text-red-500 text-xs font-medium">{errors.full_name.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="phone" className="text-xs font-bold text-slate-700">
                Số điện thoại
              </Label>
              <Input
                id="phone"
                {...register('phone')}
                placeholder="0987123456"
                className="rounded-xl border-slate-200 h-11 text-xs sm:text-sm bg-white focus:border-[#1657c1] focus:ring-2 focus:ring-blue-100"
              />
              {errors.phone && <p className="text-red-500 text-xs font-medium">{errors.phone.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="dob" className="text-xs font-bold text-slate-700">
                Ngày sinh
              </Label>
              <Input
                id="dob"
                type="date"
                {...register('date_of_birth')}
                className="rounded-xl border-slate-200 h-11 text-xs sm:text-sm bg-white focus:border-[#1657c1] focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700">
                Giới tính
              </Label>
              <Select value={gender} onValueChange={v => setValue('gender', v)}>
                <SelectTrigger className="rounded-xl border-slate-200 h-11 text-xs sm:text-sm bg-white focus:ring-2 focus:ring-blue-100">
                  <SelectValue placeholder="Chọn giới tính" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="Nam">Nam</SelectItem>
                  <SelectItem value="Nữ">Nữ</SelectItem>
                  <SelectItem value="Khác">Khác</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="address" className="text-xs font-bold text-slate-700">
                Địa chỉ hiện tại
              </Label>
              <Input
                id="address"
                {...register('address')}
                placeholder="Hà Nội"
                className="rounded-xl border-slate-200 h-11 text-xs sm:text-sm bg-white focus:border-[#1657c1] focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>
        </div>

        {/* Phần 2: Thông tin học vấn */}
        <div className="bg-white border-2 border-slate-200/90 rounded-3xl p-6 sm:p-7 shadow-xs space-y-5">
          <div className="border-b border-slate-100 pb-3.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-md text-xs font-black uppercase tracking-wide bg-slate-100 text-slate-700 border border-slate-200">
                Phần 2
              </span>
              <h2 className="text-base font-bold text-slate-900">
                Thông tin học vấn
              </h2>
            </div>
            <span className="text-xs text-slate-500 font-medium">Trường & Ngành học</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="student_id" className="text-xs font-bold text-slate-700">
                Mã số sinh viên (MSSV) {locked && '(Đã khóa)'}
              </Label>
              <Input
                id="student_id"
                {...register('student_id')}
                placeholder="22070142"
                disabled={locked}
                className={`rounded-xl border-slate-200 h-11 text-xs sm:text-sm ${locked ? 'bg-slate-100 text-slate-600 cursor-not-allowed' : 'bg-white focus:border-[#1657c1] focus:ring-2 focus:ring-blue-100'}`}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="university" className="text-xs font-bold text-slate-700">
                Trường Đại học {locked && '(Đã khóa)'}
              </Label>
              <Input
                id="university"
                {...register('university')}
                placeholder="Trường Quốc tế - ĐHQGHN"
                disabled={locked}
                className={`rounded-xl border-slate-200 h-11 text-xs sm:text-sm ${locked ? 'bg-slate-100 text-slate-600 cursor-not-allowed' : 'bg-white focus:border-[#1657c1] focus:ring-2 focus:ring-blue-100'}`}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="cohort" className="text-xs font-bold text-slate-700">
                Khóa sinh viên
              </Label>
              <Input
                id="cohort"
                {...register('cohort')}
                placeholder="K22"
                className="rounded-xl border-slate-200 h-11 text-xs sm:text-sm bg-white focus:border-[#1657c1] focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="major" className="text-xs font-bold text-slate-700">
                Ngành học
              </Label>
              <Input
                id="major"
                {...register('major')}
                placeholder="Hệ thống thông tin quản lý (MIS)"
                className="rounded-xl border-slate-200 h-11 text-xs sm:text-sm bg-white focus:border-[#1657c1] focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="high_school" className="text-xs font-bold text-slate-700">
                Trường THPT từng theo học {locked && '(Đã khóa)'}
              </Label>
              <Input
                id="high_school"
                {...register('high_school')}
                placeholder="THPT Chuyên Ngoại ngữ"
                disabled={locked}
                className={`rounded-xl border-slate-200 h-11 text-xs sm:text-sm ${locked ? 'bg-slate-100 text-slate-600 cursor-not-allowed' : 'bg-white focus:border-[#1657c1] focus:ring-2 focus:ring-blue-100'}`}
              />
            </div>
          </div>
        </div>

        {/* Nút hành động màu Vàng Kim iSSAC */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center justify-center px-8 py-3.5 rounded-xl bg-[#fdc455] hover:bg-[#f59e0b] disabled:opacity-50 text-slate-950 font-black text-sm shadow-md transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          >
            {saving ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" /> Đang lưu...
              </span>
            ) : (
              'Lưu thay đổi hồ sơ'
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
