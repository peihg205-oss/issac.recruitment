'use client'
import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
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
import { Eye, EyeOff, LogIn, ArrowLeft, Loader2, Sparkles } from 'lucide-react'

const schema = z.object({
  email: z.string().email('Email không hợp lệ'),
  password: z.string().min(6, 'Mật khẩu phải ít nhất 6 ký tự'),
})
type FormData = z.infer<typeof schema>

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    setLoading(true)
    const { error, data: authData } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    })
    setLoading(false)

    if (error) {
      toast({
        title: 'Đăng nhập thất bại',
        description: error.message === 'Invalid login credentials'
          ? 'Email hoặc mật khẩu không đúng. Nếu bạn chưa liên kết Supabase thật trong .env.local, hãy dùng nút Xem Admin Demo bên dưới!'
          : error.message,
        variant: 'destructive'
      })
      return
    }

    if (!authData.user) return

    // Get user profile to determine role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, admin_role')
      .eq('id', authData.user.id)
      .single()

    toast({ title: 'Đăng nhập thành công!', description: 'Chào mừng bạn trở lại 👋', variant: 'success' } as Parameters<typeof toast>[0])

    const redirectTo = searchParams.get('redirectedFrom')
    if (redirectTo) {
      router.push(redirectTo)
    } else if (profile?.role === 'admin' || profile?.role === 'super_admin') {
      router.push('/admin/dashboard')
    } else {
      router.push('/member/dashboard')
    }
    router.refresh()
  }

  return (
    <div className="min-h-screen flex" style={{background: 'linear-gradient(135deg, #0f1b4c 0%, #1e3a8a 60%, #1e40af 100%)'}}>
      {/* Left side */}
      <div className="hidden lg:flex lg:flex-1 flex-col items-center justify-center p-12 text-white">
        <div className="max-w-md">
          <div className="flex justify-center mb-6"><Image src="/issac-logo-full.png" alt="iSSAC - Bridge to Success" width={280} height={84} className="object-contain drop-shadow-lg" priority /></div>
          <h1 className="text-3xl font-black text-center mb-3">
            iSSAC Portal
          </h1>
          <p className="text-blue-200 text-center mb-8 leading-relaxed">
            Hệ thống quản lý tuyển thành viên chính thức của Câu lạc bộ Đại sứ Sinh viên VNU-IS.
          </p>
          <div className="space-y-4">
            {['Theo dõi trạng thái hồ sơ realtime', 'Chọn lịch phỏng vấn online/offline', 'Nhận thông báo tức thì', 'Xem kết quả sau khi công bố'].map((item, i) => (
              <div key={i} className="flex items-center gap-3 text-blue-100">
                <div className="w-5 h-5 bg-amber-400/30 rounded-full flex items-center justify-center flex-shrink-0">
                  <div className="w-2 h-2 bg-amber-400 rounded-full" />
                </div>
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right side - Login form */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-3xl shadow-2xl p-8 sm:p-10 animate-slide-up">
            {/* Mobile logo */}
            <div className="flex lg:hidden justify-center mb-6">
              <Image src="/issac-logo.png" alt="iSSAC" width={56} height={60} className="object-contain drop-shadow-sm" />
            </div>

            <div className="mb-6">
              <h2 className="text-2xl font-black text-gray-900 mb-1">Đăng nhập</h2>
              <p className="text-gray-500 text-sm">Chào mừng trở lại iSSAC Portal</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="example@vnu.edu.vn"
                  {...register('email')}
                  className={errors.email ? 'border-red-300 focus-visible:ring-red-400' : ''}
                />
                {errors.email && <p className="text-red-500 text-xs">{errors.email.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password">Mật khẩu</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPw ? 'text' : 'password'}
                    placeholder="••••••••"
                    {...register('password')}
                    className={`pr-10 ${errors.password ? 'border-red-300 focus-visible:ring-red-400' : ''}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(!showPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && <p className="text-red-500 text-xs">{errors.password.message}</p>}
              </div>

              <div className="flex justify-end">
                <Link href="/forgot-password" className="text-xs text-blue-600 hover:text-blue-800 hover:underline">
                  Quên mật khẩu?
                </Link>
              </div>

              <Button type="submit" className="w-full" size="lg" disabled={loading}>
                {loading ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Đang đăng nhập...</>
                ) : (
                  <><LogIn className="w-4 h-4 mr-2" /> Đăng nhập</>
                )}
              </Button>
            </form>

            <div className="mt-5 text-center text-sm text-gray-500">
              Chưa có tài khoản?{' '}
              <Link href="/register" className="text-blue-600 font-bold hover:underline">
                Đăng ký ngay
              </Link>
            </div>

            {/* Direct Admin Demo Button */}
            <div className="mt-6 pt-5 border-t border-gray-100">
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-4 text-center">
                <div className="text-xs font-bold text-amber-900 mb-1 flex items-center justify-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  Xem ngay Giao diện Quản trị viên
                </div>
                <p className="text-[11px] text-amber-800 mb-3 leading-relaxed">
                  Khám phá toàn bộ bảng điều khiển Ban Tuyển dụng với dữ liệu mẫu (Danh sách ứng viên, Chấm điểm, Top 15) mà không cần đăng nhập.
                </p>
                <Link href="/admin/dashboard" className="block w-full">
                  <Button variant="gold" size="sm" className="w-full font-black text-xs shadow-md">
                    ⚡ Vào Xem Admin Dashboard (Demo) →
                  </Button>
                </Link>
              </div>
            </div>

            <div className="mt-4 text-center">
              <Link href="/" className="inline-flex items-center gap-1 text-gray-400 text-xs hover:text-gray-600 transition-colors">
                <ArrowLeft className="w-3 h-3" /> Về trang chủ
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-[#0f1b4c] text-white">Đang tải...</div>}>
      <LoginForm />
    </Suspense>
  )
}
