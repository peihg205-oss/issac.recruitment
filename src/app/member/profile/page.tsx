'use client'
import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/components/ui/use-toast'
import { Loader2, Save, User, CheckCircle } from 'lucide-react'

const schema = z.object({
  full_name: z.string().min(2, 'Họ tên phải ít nhất 2 ký tự'),
  phone: z.string().min(10, 'Số điện thoại không hợp lệ').optional().or(z.literal('')),
  date_of_birth: z.string().optional().or(z.literal('')),
  gender: z.string().optional().or(z.literal('')),
  student_id: z.string().optional().or(z.literal('')),
  university: z.string().optional().or(z.literal('')),
  cohort: z.string().optional().or(z.literal('')),
  major: z.string().optional().or(z.literal('')),
  high_school: z.string().optional().or(z.literal('')),
  address: z.string().optional().or(z.literal('')),
})
type FormData = z.infer<typeof schema>

export default function ProfilePage() {
  const supabase = createClient()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [locked, setLocked] = useState(false)
  const [profileComplete, setProfileComplete] = useState(false)

  const { register, handleSubmit, formState: { errors }, reset, setValue, watch } = useForm<FormData>({
    resolver: zodResolver(schema),
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
      supabase.from('applications').select('status').eq('user_id', user.id).limit(1).single(),
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

    // Lock important fields after submission
    if (app && !['draft'].includes(app.status)) {
      setLocked(true)
    }

    setLoading(false)
  }, [supabase, reset])

  useEffect(() => { fetchProfile() }, [fetchProfile])

  const onSubmit = async (data: FormData) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
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
      toast({ title: '✅ Đã lưu hồ sơ!', description: 'Thông tin cá nhân đã được cập nhật.' } as Parameters<typeof toast>[0])
      fetchProfile()
    }
  }

  if (loading) return <div className="flex items-center justify-center min-h-[400px]"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>

  return (
    <div className="space-y-6 max-w-3xl animate-fade-in">
      <div>
        <h1 className="text-2xl font-black text-gray-900">Hồ sơ cá nhân</h1>
        <p className="text-gray-500 text-sm mt-1">Cập nhật thông tin để hoàn thiện hồ sơ ứng tuyển</p>
      </div>

      {profileComplete && (
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-green-700 text-sm">
          <CheckCircle className="w-4 h-4" />
          Hồ sơ đã hoàn thiện. Bạn có thể ứng tuyển.
        </div>
      )}

      {locked && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-amber-700 text-sm">
          ⚠️ Một số thông tin quan trọng (MSSV, Trường, THPT) đã bị khóa sau khi nộp đơn.
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="space-y-4">
          {/* Personal Info */}
          <Card>
            <CardHeader className="border-b border-gray-100">
              <CardTitle className="text-base flex items-center gap-2">
                <User className="w-4 h-4 text-blue-600" />
                Thông tin cá nhân
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5 md:col-span-2">
                <Label htmlFor="full_name">Họ và tên <span className="text-red-500">*</span></Label>
                <Input id="full_name" {...register('full_name')} placeholder="Nguyễn Văn A" className={errors.full_name ? 'border-red-300' : ''} />
                {errors.full_name && <p className="text-red-500 text-xs">{errors.full_name.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="phone">Số điện thoại</Label>
                <Input id="phone" {...register('phone')} placeholder="0901234567" />
                {errors.phone && <p className="text-red-500 text-xs">{errors.phone.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="dob">Ngày sinh</Label>
                <Input id="dob" type="date" {...register('date_of_birth')} />
              </div>

              <div className="space-y-1.5">
                <Label>Giới tính</Label>
                <Select value={gender} onValueChange={v => setValue('gender', v)}>
                  <SelectTrigger><SelectValue placeholder="Chọn giới tính" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Nam">Nam</SelectItem>
                    <SelectItem value="Nữ">Nữ</SelectItem>
                    <SelectItem value="Khác">Khác</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="address">Địa chỉ</Label>
                <Input id="address" {...register('address')} placeholder="TP. Hồ Chí Minh" />
              </div>
            </CardContent>
          </Card>

          {/* Academic Info */}
          <Card>
            <CardHeader className="border-b border-gray-100">
              <CardTitle className="text-base">Thông tin học vấn</CardTitle>
            </CardHeader>
            <CardContent className="pt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="student_id">MSSV {locked && '(Đã khóa)'}</Label>
                <Input id="student_id" {...register('student_id')} placeholder="22521234" disabled={locked} className={locked ? 'bg-gray-50' : ''} />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="university">Trường {locked && '(Đã khóa)'}</Label>
                <Input id="university" {...register('university')} placeholder="Đại học Công nghệ Thông tin — ĐHQG TP.HCM" disabled={locked} className={locked ? 'bg-gray-50' : ''} />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="cohort">Khóa</Label>
                <Input id="cohort" {...register('cohort')} placeholder="K2022" />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="major">Ngành học</Label>
                <Input id="major" {...register('major')} placeholder="Khoa học Máy tính" />
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <Label htmlFor="high_school">THPT từng học {locked && '(Đã khóa)'}</Label>
                <Input id="high_school" {...register('high_school')} placeholder="THPT Lê Quý Đôn" disabled={locked} className={locked ? 'bg-gray-50' : ''} />
              </div>
            </CardContent>
          </Card>

          <Button type="submit" disabled={saving} className="gap-2 w-full sm:w-auto">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Lưu thông tin
          </Button>
        </div>
      </form>
    </div>
  )
}
