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
import { Loader2, CheckCircle2, AlertCircle, ArrowRight, ShieldAlert } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

const profileSchema = z.object({
  // Phần 1: Thông tin cá nhân & Liên hệ
  full_name: z.string().min(2, 'Vui lòng nhập họ và tên (tối thiểu 2 ký tự)'),
  phone: z.string().min(9, 'Số điện thoại không hợp lệ (từ 9-11 số)').regex(/^[0-9]+$/, 'Số điện thoại chỉ gồm chữ số'),
  date_of_birth: z.string().min(1, 'Vui lòng chọn ngày sinh'),
  gender: z.string().min(1, 'Vui lòng chọn giới tính'),
  facebook_url: z.string().optional().or(z.literal('')),

  // Phần 2: Thông tin học vấn
  student_id: z.string().min(1, 'Vui lòng nhập Mã số sinh viên (MSSV)'),
  university: z.string().min(1, 'Vui lòng nhập Trường Đại học'),
  cohort: z.string().min(1, 'Vui lòng nhập Khóa sinh viên (ví dụ: K22, QH-2024...)'),
  major: z.string().min(1, 'Vui lòng nhập Ngành học'),
  high_school: z.string().optional().or(z.literal('')),
})

type FormData = z.infer<typeof profileSchema>

export default function MemberProfilePage() {
  const supabase = createClient()
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [locked, setLocked] = useState(false)
  const [profileComplete, setProfileComplete] = useState(false)

  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(profileSchema)
  })

  const gender = watch('gender')
  const fullName = watch('full_name')
  const phone = watch('phone')
  const dob = watch('date_of_birth')
  const studentId = watch('student_id')
  const university = watch('university')
  const cohort = watch('cohort')
  const major = watch('major')

  const isPart1Complete = !!(fullName?.trim() && phone?.trim() && dob && gender)
  const isPart2Complete = !!(studentId?.trim() && university?.trim() && cohort?.trim() && major?.trim())

  const fetchProfile = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      reset({
        full_name: '',
        phone: '',
        date_of_birth: '',
        gender: '',
        facebook_url: '',
        student_id: '',
        university: 'Trường Quốc tế - ĐHQGHN (VNU-IS)',
        cohort: '',
        major: '',
        high_school: '',
      })
      setProfileComplete(false)
      setLoading(false)
      return
    }

    const [{ data: profile }, { data: app }] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),
      supabase.from('applications').select('status').eq('user_id', user.id).maybeSingle()
    ])

    if (profile) {
      // Address column stores facebook link if provided
      const fb = (profile as any).facebook_url || profile.address || (user.user_metadata?.facebook_url as string) || ''
      reset({
        full_name: profile.full_name || '',
        phone: profile.phone || '',
        date_of_birth: profile.date_of_birth || '',
        gender: profile.gender || '',
        facebook_url: fb,
        student_id: profile.student_id || '',
        university: profile.university || 'Trường Quốc tế - ĐHQGHN',
        cohort: profile.cohort || '',
        major: profile.major || '',
        high_school: profile.high_school || '',
      })

      const p1 = !!(profile.full_name && profile.phone && profile.date_of_birth && profile.gender)
      const p2 = !!(profile.student_id && profile.university && profile.cohort && profile.major)
      setProfileComplete(p1 && p2)
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

    // Save profile data into profiles table without schema cache errors
    const { error } = await supabase.from('profiles').update({
      full_name: data.full_name.trim(),
      phone: data.phone?.trim() || null,
      date_of_birth: data.date_of_birth || null,
      gender: data.gender || null,
      student_id: locked ? undefined : (data.student_id?.trim() || null),
      university: locked ? undefined : (data.university?.trim() || null),
      cohort: data.cohort?.trim() || null,
      major: data.major?.trim() || null,
      high_school: locked ? undefined : (data.high_school?.trim() || null),
      address: data.facebook_url?.trim() || null,
    }).eq('id', user.id)

    // Also persist in auth metadata
    try {
      await supabase.auth.updateUser({
        data: {
          full_name: data.full_name.trim(),
          facebook_url: data.facebook_url?.trim() || null,
        }
      })
    } catch {}

    setSaving(false)
    if (error) {
      toast({ title: 'Lỗi khi lưu', description: error.message, variant: 'destructive' })
    } else {
      toast({
        title: 'Đã lưu hồ sơ thành công!',
        description: 'Thông tin cá nhân & học vấn đã được cập nhật. Bạn đã sẵn sàng nộp đơn ứng tuyển!',
      })
      setProfileComplete(true)
      fetchProfile()
      router.refresh()
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
            Bắt buộc hoàn thành <b>Phần 1 & Phần 2</b> để mở khóa quyền làm đơn trả lời câu hỏi phỏng vấn
          </p>
        </div>
        <Link
          href="/member/dashboard"
          className="px-4 py-2 rounded-xl border-2 border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-xs transition-all"
        >
          Về Tổng quan
        </Link>
      </div>

      {/* Thông báo trạng thái hồ sơ */}
      {profileComplete ? (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-5 rounded-2xl bg-white border border-emerald-200/80 text-xs sm:text-sm shadow-xs animate-slide-up">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-300/40 flex items-center justify-center text-emerald-600 shrink-0">
              <CheckCircle2 className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <span>Hồ sơ đã hoàn thiện</span>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  Đạt chuẩn
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Đã đủ điều kiện mở khóa và hoàn thiện đơn ứng tuyển Gen 3.
              </p>
            </div>
          </div>
          <Link
            href="/member/application"
            className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-full bg-[#1657c1] hover:bg-[#114396] text-white font-bold text-xs shrink-0 shadow-sm transition-all text-center"
          >
            <span>Vào Đơn ứng tuyển</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      ) : (
        <div className="rounded-2xl bg-white border border-amber-200/80 shadow-xs p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-300/40 flex items-center justify-center text-amber-600 shrink-0">
              <AlertCircle className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <span>Hoàn thiện hồ sơ</span>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                  Bắt buộc
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Điền đủ 2 phần bên dưới để mở khóa vòng đơn ứng tuyển.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                isPart1Complete
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 shadow-2xs'
                  : 'bg-amber-50 text-amber-800 border-amber-200'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${isPart1Complete ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`} />
              <span>Phần 1: {isPart1Complete ? 'Đã xong' : 'Còn thiếu'}</span>
            </div>

            <div
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                isPart2Complete
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 shadow-2xs'
                  : 'bg-amber-50 text-amber-800 border-amber-200'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${isPart2Complete ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`} />
              <span>Phần 2: {isPart2Complete ? 'Đã xong' : 'Còn thiếu'}</span>
            </div>
          </div>
        </div>
      )}

      {locked && (
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-center gap-2.5">
          <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
          <span>Thông tin định danh (MSSV, Trường, THPT) đã được khóa cố định sau khi nộp đơn ứng tuyển chính thức.</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Phần 1: Thông tin cá nhân - Style Xanh Thương hiệu theo Ảnh 2 */}
        <div className="bg-white border-2 border-[#1657c1] rounded-3xl p-6 sm:p-7 shadow-xs space-y-5">
          <div className="border-b border-blue-100/70 pb-3.5 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold uppercase tracking-wide text-white bg-[#1657c1] px-2.5 py-0.5 rounded shadow-2xs">
                Phần 1 {isPart1Complete ? '✓' : ''}
              </span>
              <span className="text-xs font-semibold text-[#1657c1]">Bắt buộc</span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900">
              Thông tin cá nhân
            </h2>
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
                Số điện thoại <span className="text-red-500">*</span>
              </Label>
              <Input
                id="phone"
                {...register('phone')}
                placeholder="0987123456"
                className={`rounded-xl border-slate-200 h-11 text-xs sm:text-sm bg-white focus:border-[#1657c1] focus:ring-2 focus:ring-blue-100 ${errors.phone ? 'border-red-300 ring-2 ring-red-100' : ''}`}
              />
              {errors.phone && <p className="text-red-500 text-xs font-medium">{errors.phone.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="dob" className="text-xs font-bold text-slate-700">
                Ngày sinh <span className="text-red-500">*</span>
              </Label>
              <Input
                id="dob"
                type="date"
                {...register('date_of_birth')}
                className={`rounded-xl border-slate-200 h-11 text-xs sm:text-sm bg-white focus:border-[#1657c1] focus:ring-2 focus:ring-blue-100 ${errors.date_of_birth ? 'border-red-300 ring-2 ring-red-100' : ''}`}
              />
              {errors.date_of_birth && <p className="text-red-500 text-xs font-medium">{errors.date_of_birth.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700">
                Giới tính <span className="text-red-500">*</span>
              </Label>
              <Select value={gender || ''} onValueChange={v => setValue('gender', v)}>
                <SelectTrigger className={`rounded-xl border-slate-200 h-11 text-xs sm:text-sm bg-white focus:ring-2 focus:ring-blue-100 ${errors.gender ? 'border-red-300 ring-2 ring-red-100' : ''}`}>
                  <SelectValue placeholder="Chọn giới tính" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="Nam">Nam</SelectItem>
                  <SelectItem value="Nữ">Nữ</SelectItem>
                  <SelectItem value="Khác">Khác</SelectItem>
                </SelectContent>
              </Select>
              {errors.gender && <p className="text-red-500 text-xs font-medium">{errors.gender.message}</p>}
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="facebook_url" className="text-xs font-bold text-slate-700">
                Link Facebook cá nhân
              </Label>
              <Input
                id="facebook_url"
                {...register('facebook_url')}
                placeholder="https://www.facebook.com/username..."
                className="rounded-xl border-slate-200 h-11 text-xs sm:text-sm bg-white focus:border-[#1657c1] focus:ring-2 focus:ring-blue-100"
              />
              <p className="text-[11px] text-slate-400">
                Kênh kết nối chính thức của CLB để trao đổi thông tin và thông báo khi trúng tuyển.
              </p>
            </div>
          </div>
        </div>

        {/* Phần 2: Thông tin học vấn - Style Vàng Hoàng gia theo Ảnh 2 */}
        <div className="bg-white border-2 border-[#fdc455] rounded-3xl p-6 sm:p-7 shadow-xs space-y-5">
          <div className="border-b border-amber-100/70 pb-3.5 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold uppercase tracking-wide text-amber-950 bg-[#fdc455] px-2.5 py-0.5 rounded shadow-2xs">
                Phần 2 {isPart2Complete ? '✓' : ''}
              </span>
              <span className="text-xs font-semibold text-amber-900">Bắt buộc</span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900">
              Thông tin học vấn
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="student_id" className="text-xs font-bold text-slate-700">
                Mã số sinh viên (MSSV) <span className="text-red-500">*</span> {locked && '(Đã khóa)'}
              </Label>
              <Input
                id="student_id"
                {...register('student_id')}
                placeholder="23087833"
                disabled={locked}
                className={`rounded-xl border-slate-200 h-11 text-xs sm:text-sm ${locked ? 'bg-slate-100 text-slate-600 cursor-not-allowed' : 'bg-white focus:border-[#fdc455] focus:ring-2 focus:ring-amber-100'} ${errors.student_id ? 'border-red-300 ring-2 ring-red-100' : ''}`}
              />
              {errors.student_id && <p className="text-red-500 text-xs font-medium">{errors.student_id.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="university" className="text-xs font-bold text-slate-700">
                Trường Đại học <span className="text-red-500">*</span> {locked && '(Đã khóa)'}
              </Label>
              <Input
                id="university"
                {...register('university')}
                placeholder="Trường Quốc tế - ĐHQGHN"
                disabled={locked}
                className={`rounded-xl border-slate-200 h-11 text-xs sm:text-sm ${locked ? 'bg-slate-100 text-slate-600 cursor-not-allowed' : 'bg-white focus:border-[#fdc455] focus:ring-2 focus:ring-amber-100'} ${errors.university ? 'border-red-300 ring-2 ring-red-100' : ''}`}
              />
              {errors.university && <p className="text-red-500 text-xs font-medium">{errors.university.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="cohort" className="text-xs font-bold text-slate-700">
                Khóa sinh viên <span className="text-red-500">*</span>
              </Label>
              <Input
                id="cohort"
                {...register('cohort')}
                placeholder="K22 / K23"
                className={`rounded-xl border-slate-200 h-11 text-xs sm:text-sm bg-white focus:border-[#fdc455] focus:ring-2 focus:ring-amber-100 ${errors.cohort ? 'border-red-300 ring-2 ring-red-100' : ''}`}
              />
              {errors.cohort && <p className="text-red-500 text-xs font-medium">{errors.cohort.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="major" className="text-xs font-bold text-slate-700">
                Ngành học <span className="text-red-500">*</span>
              </Label>
              <Input
                id="major"
                {...register('major')}
                placeholder="Hệ thống thông tin quản lý (MIS)"
                className={`rounded-xl border-slate-200 h-11 text-xs sm:text-sm bg-white focus:border-[#fdc455] focus:ring-2 focus:ring-amber-100 ${errors.major ? 'border-red-300 ring-2 ring-red-100' : ''}`}
              />
              {errors.major && <p className="text-red-500 text-xs font-medium">{errors.major.message}</p>}
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="high_school" className="text-xs font-bold text-slate-700">
                Trường THPT từng theo học {locked && '(Đã khóa)'}
              </Label>
              <Input
                id="high_school"
                {...register('high_school')}
                placeholder="THPT Chuyên / THPT..."
                disabled={locked}
                className={`rounded-xl border-slate-200 h-11 text-xs sm:text-sm ${locked ? 'bg-slate-100 text-slate-600 cursor-not-allowed' : 'bg-white focus:border-[#fdc455] focus:ring-2 focus:ring-amber-100'}`}
              />
            </div>
          </div>
        </div>

        {/* Nút hành động */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
          <p className="text-xs text-slate-500">
            * Sau khi lưu thành công, bạn sẽ được tự động mở khóa quyền làm đơn ứng tuyển.
          </p>
          <button
            type="submit"
            disabled={saving}
            className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-3.5 rounded-xl bg-[#fdc455] hover:bg-[#f59e0b] disabled:opacity-50 text-slate-950 font-black text-sm shadow-md transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          >
            {saving ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" /> Đang lưu...
              </span>
            ) : (
              'Lưu thông tin hồ sơ'
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
