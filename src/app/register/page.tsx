'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/use-toast'
import { Eye, EyeOff, UserPlus, ArrowLeft, Loader2, CheckCircle } from 'lucide-react'

const schema = z.object({
  full_name: z.string().min(2, 'Họ tên phải ít nhất 2 ký tự'),
  email: z.string().email('Email không hợp lệ'),
  password: z.string().min(8, 'Mật khẩu phải ít nhất 8 ký tự'),
  confirmPassword: z.string(),
}).refine(d => d.password === d.confirmPassword, {
  message: 'Mật khẩu xác nhận không khớp',
  path: ['confirmPassword'],
})
type FormData = z.infer<typeof schema>

export default function RegisterPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const supabase = createClient()

  const { register, handleSubmit, formState: { errors }, watch } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const password = watch('password', '')

  const passwordStrength = () => {
    if (password.length < 6) return { level: 0, label: '', color: '' }
    if (password.length < 8) return { level: 1, label: 'Yếu', color: 'bg-red-400' }
    if (!/[A-Z]/.test(password) || !/[0-9]/.test(password)) return { level: 2, label: 'Trung bình', color: 'bg-yellow-400' }
    return { level: 3, label: 'Mạnh', color: 'bg-green-400' }
  }
  const strength = passwordStrength()

  const onSubmit = async (data: FormData) => {
    setLoading(true)
    const { error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: { full_name: data.full_name },
      },
    })
    setLoading(false)

    if (error) {
      toast({ title: 'Đăng ký thất bại', description: error.message, variant: 'destructive' })
      return
    }

    setSuccess(true)
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{background: 'linear-gradient(135deg, #0f1b4c 0%, #1e3a8a 100%)'}}>
        <div className="bg-white rounded-3xl p-10 max-w-md w-full text-center shadow-2xl animate-slide-up">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-black text-gray-900 mb-3">Đăng ký thành công!</h2>
          <p className="text-gray-600 mb-6 leading-relaxed">
            Tài khoản của bạn đã được tạo. Vui lòng kiểm tra email để xác nhận tài khoản trước khi đăng nhập.
          </p>
          <Link href="/login">
            <Button className="w-full" size="lg">Đăng nhập ngay</Button>
          </Link>
          <p className="text-gray-400 text-xs mt-4">
            Nếu không thấy email, hãy kiểm tra hộp thư Spam.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex" style={{background: 'linear-gradient(135deg, #0f1b4c 0%, #1e3a8a 60%, #1e40af 100%)'}}>
      {/* Left side */}
      <div className="hidden lg:flex lg:flex-1 flex-col items-center justify-center p-12 text-white">
        <div className="max-w-md">
          <div className="flex justify-center mb-8">
            <Image src="/issac-logo.png" alt="iSSAC" width={100} height={100} className="rounded-full border-4 border-white/20" />
          </div>
          <h1 className="text-3xl font-black text-center mb-4">
            Tham gia iSSAC
          </h1>
          <p className="text-blue-200 text-center mb-8 leading-relaxed">
            Mùa tuyển thành viên 2026 đang mở. Hãy đăng ký và bắt đầu hành trình của bạn!
          </p>
          <div className="bg-white/10 rounded-2xl p-6 border border-white/20">
            <div className="text-amber-300 font-bold mb-3 text-center">📅 Lịch tuyển thành viên 2026</div>
            <div className="space-y-2 text-sm text-blue-200">
              <div className="flex justify-between"><span>Mở đơn:</span><span className="text-white font-medium">01/09/2026</span></div>
              <div className="flex justify-between"><span>Đóng đơn:</span><span className="text-white font-medium">15/10/2026</span></div>
              <div className="flex justify-between"><span>Phỏng vấn:</span><span className="text-white font-medium">20-30/10/2026</span></div>
              <div className="flex justify-between"><span>Công bố KQ:</span><span className="text-white font-medium">05/11/2026</span></div>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Register form */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        <div className="w-full max-w-md py-8">
          <div className="bg-white rounded-3xl shadow-2xl p-8 sm:p-10 animate-slide-up">
            <div className="flex lg:hidden justify-center mb-6">
              <Image src="/issac-logo.png" alt="iSSAC" width={64} height={64} className="rounded-full" />
            </div>

            <div className="mb-8">
              <h2 className="text-2xl font-black text-gray-900 mb-1">Tạo tài khoản</h2>
              <p className="text-gray-500 text-sm">Đăng ký để bắt đầu ứng tuyển vào iSSAC</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div className="space-y-1.5">
                <Label htmlFor="full_name">Họ và tên</Label>
                <Input id="full_name" placeholder="Nguyễn Văn A" {...register('full_name')}
                  className={errors.full_name ? 'border-red-300' : ''} />
                {errors.full_name && <p className="text-red-500 text-xs">{errors.full_name.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="reg-email">Email</Label>
                <Input id="reg-email" type="email" placeholder="example@gmail.com" {...register('email')}
                  className={errors.email ? 'border-red-300' : ''} />
                {errors.email && <p className="text-red-500 text-xs">{errors.email.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="reg-password">Mật khẩu</Label>
                <div className="relative">
                  <Input id="reg-password" type={showPw ? 'text' : 'password'} placeholder="Ít nhất 8 ký tự"
                    {...register('password')} className={`pr-10 ${errors.password ? 'border-red-300' : ''}`} />
                  <button type="button" onClick={() => setShowPw(!showPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {password.length > 0 && (
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all ${strength.color}`}
                        style={{width: `${(strength.level / 3) * 100}%`}} />
                    </div>
                    <span className="text-xs text-gray-500">{strength.label}</span>
                  </div>
                )}
                {errors.password && <p className="text-red-500 text-xs">{errors.password.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="confirmPassword">Xác nhận mật khẩu</Label>
                <Input id="confirmPassword" type="password" placeholder="Nhập lại mật khẩu"
                  {...register('confirmPassword')} className={errors.confirmPassword ? 'border-red-300' : ''} />
                {errors.confirmPassword && <p className="text-red-500 text-xs">{errors.confirmPassword.message}</p>}
              </div>

              <Button type="submit" className="w-full" size="lg" disabled={loading}>
                {loading ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Đang tạo tài khoản...</>
                ) : (
                  <><UserPlus className="w-4 h-4 mr-2" /> Tạo tài khoản</>
                )}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm text-gray-500">
              Đã có tài khoản?{' '}
              <Link href="/login" className="text-blue-600 font-semibold hover:underline">Đăng nhập</Link>
            </div>

            <div className="mt-4 text-center">
              <Link href="/" className="inline-flex items-center gap-1 text-gray-400 text-xs hover:text-gray-600">
                <ArrowLeft className="w-3 h-3" /> Về trang chủ
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
