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
import { Eye, EyeOff, LogIn, ArrowLeft, Loader2 } from 'lucide-react'

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
      toast({ title: 'Đăng nhập thất bại', description: error.message === 'Invalid login credentials' ? 'Email hoặc mật khẩu không đúng.' : error.message, variant: 'destructive' })
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
          <div className="flex justify-center mb-8">
            <div className="relative">
              <div className="absolute inset-0 bg-amber-400/20 rounded-full blur-2xl scale-150" />
              <Image src="/issac-logo.png" alt="iSSAC" width={100} height={100} className="relative rounded-full border-4 border-white/20" />
            </div>
          </div>
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
              <Image src="/issac-logo.png" alt="iSSAC" width={64} height={64} className="rounded-full" />
            </div>

            <div className="mb-8">
              <h2 className="text-2xl font-black text-gray-900 mb-1">Đăng nhập</h2>
              <p className="text-gray-500 text-sm">Chào mừng trở lại iSSAC Portal</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="example@email.com"
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
                <Link href="/forgot-password" className="text-sm text-blue-600 hover:text-blue-800 hover:underline">
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

            <div className="mt-6 text-center text-sm text-gray-500">
              Chưa có tài khoản?{' '}
              <Link href="/register" className="text-blue-600 font-semibold hover:underline">
                Đăng ký ngay
              </Link>
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
