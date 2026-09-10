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
import { setCandidatePassword } from '@/lib/candidate-account-manager'
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
    // Lưu thông tin đăng nhập của ứng viên
    setCandidatePassword(data.email, data.password)

    const supabase = createClient()
    const { data: signUpData, error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: { full_name: data.full_name },
        emailRedirectTo: `${window.location.origin}/login`,
      },
    })
    setLoading(false)

    if (error) {
      const getMsg = (msg: string) => {
        if (msg.includes('already registered') || msg.includes('already been registered')) return 'Email này đã được đăng ký. Vui lòng đăng nhập.'
        if (msg.includes('Password should')) return 'Mật khẩu phải ít nhất 6 ký tự.'
        if (msg.includes('Unable to validate')) return 'Email không hợp lệ.'
        return msg
      }
      toast({ title: 'Đăng ký thất bại', description: getMsg(error.message), variant: 'destructive' })
      return
    }

    // Nếu đã có session (Supabase tắt confirm email) -> tự động vào dashboard luôn!
    if (signUpData?.session) {
      toast({
        title: 'Đăng ký thành công!',
        description: 'Đăng ký thành công. Đang chuyển hướng vào hệ thống ứng viên...',
      })
      setTimeout(() => {
        router.push('/member/dashboard')
        router.refresh()
      }, 1000)
      return
    }

    // Nếu email_confirmed_at đã có nhưng chưa có session -> chuyển sang login
    if (signUpData?.user?.email_confirmed_at) {
      toast({
        title: 'Đăng ký thành công!',
        description: 'Tài khoản đã được tạo. Đang chuyển đến trang đăng nhập...',
      })
      setTimeout(() => router.push('/login'), 1200)
      return
    }

    setSuccess(true)
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-[#1559c5]">
        <div className="bg-white rounded-[2rem] p-8 sm:p-10 max-w-md w-full text-center shadow-2xl animate-slide-up border border-blue-100">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-5 text-emerald-600">
            <CheckCircle className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black text-gray-900 mb-2">Đăng ký thành công!</h2>
          <p className="text-gray-600 text-sm mb-6 leading-relaxed">
            Tài khoản của bạn đã được tạo. Vui lòng kiểm tra email để xác nhận tài khoản trước khi đăng nhập.
          </p>
          <Link href="/login">
            <Button className="w-full h-11 rounded-full font-bold bg-[#1559c5] hover:bg-[#0f449e] text-white shadow-md cursor-pointer transition-all">
              Đăng nhập ngay
            </Button>
          </Link>
          <p className="text-gray-400 text-xs mt-4">
            Nếu không thấy email, hãy kiểm tra hộp thư Spam.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex bg-[#1559c5]">
      {/* Left side */}
      <div className="hidden lg:flex lg:flex-1 flex-col items-center justify-center p-8 xl:p-12 text-white">
        <div className="max-w-md xl:max-w-lg text-center w-full">
          <div className="flex justify-center mb-4">
            <Image
              src="/issac-logo.png"
              alt="iSSAC - Bridge to Success"
              width={90}
              height={96}
              className="object-contain drop-shadow-2xl hover:scale-105 transition-transform duration-300"
              priority
            />
          </div>

          <div className="text-xs font-black text-[#fdc455] uppercase tracking-widest mb-1.5">
            CÂU LẠC BỘ ĐẠI SỨ SINH VIÊN
          </div>

          <h1 className="text-2xl xl:text-3xl font-black mb-2 text-white tracking-tight uppercase leading-snug">
            Gia Nhập Gia Đình iSSAC Gen 3
          </h1>

          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/20 text-xs font-bold text-amber-200 mb-6 backdrop-blur-sm shadow-sm">
            <span className="w-2 h-2 rounded-full bg-[#fdc455] animate-ping" />
            <span>Mùa tuyển thành viên 2026 đang mở</span>
          </div>

          <div className="bg-white/10 border border-white/15 rounded-3xl p-5 xl:p-6 backdrop-blur-md text-left shadow-xl space-y-3.5">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <span className="text-xs font-black text-[#fdc455] uppercase tracking-wider">
                📅 Lộ Trình Tuyển Quân
              </span>
              <span className="text-[10px] bg-amber-400 text-slate-950 font-black px-2.5 py-0.5 rounded-full shadow-xs">
                Khóa 2026
              </span>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/10">
                <span className="text-white font-medium">Vòng 1: Mở cổng nhận đơn</span>
                <span className="font-mono font-bold text-amber-300 bg-white/10 px-2.5 py-1 rounded-lg">01/09 - 15/10</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/10">
                <span className="text-white font-medium">Vòng 2: Phỏng vấn & Thử thách</span>
                <span className="font-mono font-bold text-blue-200 bg-white/10 px-2.5 py-1 rounded-lg">20/10 - 30/10</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/10">
                <span className="text-white font-medium">Công bố kết quả chính thức</span>
                <span className="font-mono font-bold text-emerald-300 bg-white/10 px-2.5 py-1 rounded-lg">05/11/2026</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Register form */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        <div className="w-full max-w-md py-6">
          <div className="bg-white rounded-[2rem] shadow-2xl p-7 sm:p-9 border border-blue-100">
            <div className="flex lg:hidden justify-center mb-4">
              <Image src="/issac-logo.png" alt="iSSAC" width={56} height={60} className="object-contain" />
            </div>

            <div className="mb-6 text-left">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold mb-2.5 shadow-sm bg-blue-50 text-[#1559c5] border border-blue-100">
                <span>CỔNG ĐĂNG KÝ ỨNG VIÊN</span>
              </div>
              <h2 className="text-2xl font-black text-gray-950 mb-1">Tạo tài khoản</h2>
              <p className="text-gray-500 text-xs font-medium leading-relaxed">Đăng ký để bắt đầu ứng tuyển và đồng hành cùng iSSAC</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-1.5 text-left">
                <Label htmlFor="full_name" className="text-xs font-bold text-gray-700">Họ và tên</Label>
                <Input id="full_name" placeholder="Nguyễn Văn A" {...register('full_name')}
                  className={`h-11 rounded-xl bg-gray-50/50 ${errors.full_name ? 'border-red-300' : ''}`} />
                {errors.full_name && <p className="text-red-500 text-xs">{errors.full_name.message}</p>}
              </div>

              <div className="space-y-1.5 text-left">
                <Label htmlFor="reg-email" className="text-xs font-bold text-gray-700">Email</Label>
                <Input id="reg-email" type="email" placeholder="example@gmail.com" {...register('email')}
                  className={`h-11 rounded-xl bg-gray-50/50 ${errors.email ? 'border-red-300' : ''}`} />
                {errors.email && <p className="text-red-500 text-xs">{errors.email.message}</p>}
              </div>

              <div className="space-y-1.5 text-left">
                <Label htmlFor="reg-password" className="text-xs font-bold text-gray-700">Mật khẩu</Label>
                <div className="relative">
                  <Input id="reg-password" type={showPw ? 'text' : 'password'} placeholder="Ít nhất 8 ký tự"
                    {...register('password')} className={`h-11 rounded-xl bg-gray-50/50 pr-10 ${errors.password ? 'border-red-300' : ''}`} />
                  <button type="button" onClick={() => setShowPw(!showPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer">
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

              <div className="space-y-1.5 text-left">
                <Label htmlFor="confirmPassword" className="text-xs font-bold text-gray-700">Xác nhận mật khẩu</Label>
                <Input id="confirmPassword" type="password" placeholder="Nhập lại mật khẩu"
                  {...register('confirmPassword')} className={`h-11 rounded-xl bg-gray-50/50 ${errors.confirmPassword ? 'border-red-300' : ''}`} />
                {errors.confirmPassword && <p className="text-red-500 text-xs">{errors.confirmPassword.message}</p>}
              </div>

              <Button type="submit" className="w-full h-11 font-black bg-[#1559c5] hover:bg-[#0f449e] text-white rounded-full text-sm shadow-md cursor-pointer transition-all mt-2" disabled={loading}>
                {loading ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Đang tạo tài khoản...</>
                ) : (
                  <><UserPlus className="w-4 h-4 mr-2" /> Tạo tài khoản</>
                )}
              </Button>
            </form>

            <div className="mt-5 text-center text-xs text-gray-500">
              Đã có tài khoản?{' '}
              <Link href="/login" className="text-[#1559c5] font-bold hover:underline">Đăng nhập ngay</Link>
            </div>

            <div className="mt-4 text-center">
              <Link href="/" className="inline-flex items-center gap-1 text-gray-400 text-xs hover:text-gray-600 font-medium">
                <ArrowLeft className="w-3 h-3" /> Về trang chủ
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
