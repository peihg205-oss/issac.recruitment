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
import {
  Eye, EyeOff, LogIn, ArrowLeft, Loader2,
  Crown, Megaphone, MessageSquare, Users, Shield
} from 'lucide-react'

const schema = z.object({
  email: z.string().email('Email không hợp lệ'),
  password: z.string().min(6, 'Mật khẩu phải ít nhất 6 ký tự'),
})
type FormData = z.infer<typeof schema>

const DEMO_ADMIN_ACCOUNTS = [
  {
    role: 'chu-nhiem',
    name: 'Ban Chủ nhiệm',
    email: 'bcn@issac.vnu.edu.vn',
    icon: Crown,
    color: 'text-amber-600 bg-amber-50 border-amber-200',
    desc: 'Toàn quyền duyệt Top 15 và chấm điểm cả 3 ban',
  },
  {
    role: 'truyen-thong',
    name: 'Ban Truyền thông',
    email: 'truyenthong@issac.vnu.edu.vn',
    icon: Megaphone,
    color: 'text-blue-600 bg-blue-50 border-blue-200',
    desc: 'Chỉ chấm điểm và đặt câu hỏi Ban Truyền thông',
  },
  {
    role: 'tu-van',
    name: 'Ban Tư vấn',
    email: 'tuvan@issac.vnu.edu.vn',
    icon: MessageSquare,
    color: 'text-emerald-600 bg-emerald-50 border-emerald-200',
    desc: 'Chỉ chấm điểm và đặt câu hỏi Ban Tư vấn',
  },
  {
    role: 'nhan-su',
    name: 'Ban Nhân sự',
    email: 'nhansu@issac.vnu.edu.vn',
    icon: Users,
    color: 'text-purple-600 bg-purple-50 border-purple-200',
    desc: 'Chỉ chấm điểm và đặt câu hỏi Ban Nhân sự',
  },
]

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    setLoading(true)

    // Check if logging in with demo department account
    const matchedDept = DEMO_ADMIN_ACCOUNTS.find(a => a.email.toLowerCase() === data.email.toLowerCase())
    if (matchedDept) {
      document.cookie = `issac_admin_role=${matchedDept.role}; path=/; max-age=2592000`
      setLoading(false)
      toast({
        title: 'Đăng nhập thành công',
        description: `Chào mừng bạn trở lại với quyền ${matchedDept.name}.`,
        variant: 'success'
      } as Parameters<typeof toast>[0])
      router.push('/admin/dashboard')
      router.refresh()
      return
    }

    const { error, data: authData } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    })
    setLoading(false)

    if (error) {
      toast({
        title: 'Đăng nhập thất bại',
        description: error.message === 'Invalid login credentials'
          ? 'Email hoặc mật khẩu không đúng. Bạn có thể chọn đăng nhập bằng các tài khoản phân quyền bên dưới.'
          : error.message,
        variant: 'destructive'
      })
      return
    }

    if (!authData.user) return

    const { data: profile } = await supabase
      .from('profiles')
      .select('role, admin_role')
      .eq('id', authData.user.id)
      .single()

    toast({ title: 'Đăng nhập thành công', variant: 'success' } as Parameters<typeof toast>[0])

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

  const handleQuickLogin = (role: string, email: string) => {
    setValue('email', email)
    setValue('password', '123456')
    document.cookie = `issac_admin_role=${role}; path=/; max-age=2592000`
    toast({
      title: 'Đăng nhập quản trị viên',
      description: `Đang chuyển vào cổng quản lý với quyền ${DEMO_ADMIN_ACCOUNTS.find(a => a.role === role)?.name}...`,
      variant: 'success'
    } as Parameters<typeof toast>[0])
    router.push('/admin/dashboard')
    router.refresh()
  }

  return (
    <div className="min-h-screen flex" style={{background: 'linear-gradient(135deg, #0f1b4c 0%, #1e3a8a 60%, #1e40af 100%)'}}>
      {/* Left side */}
      <div className="hidden lg:flex lg:flex-1 flex-col items-center justify-center p-12 text-white">
        <div className="max-w-md text-center">
          <div className="flex justify-center mb-6">
            <Image
              src="/issac-logo-full.png"
              alt="iSSAC - Bridge to Success"
              width={300}
              height={90}
              className="object-contain drop-shadow-xl"
              priority
            />
          </div>
          <h1 className="text-2xl font-black mb-3">
            Cổng Quản Lý Tuyển Thành Viên
          </h1>
          <p className="text-blue-200 text-sm mb-8 leading-relaxed">
            Hệ thống quản lý hồ sơ và phân quyền tuyển dụng độc lập cho Ban Chủ nhiệm, Ban Truyền thông, Ban Tư vấn và Ban Nhân sự.
          </p>
          <div className="space-y-3 text-left">
            {[
              'Phân quyền chấm điểm phỏng vấn theo từng Ban',
              'Ngân hàng câu hỏi tuyển sinh độc lập',
              'Tự động tổng hợp điểm và xếp hạng Top 15',
              'Đặt lịch phỏng vấn và gửi thông báo trực tuyến'
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3 text-xs text-blue-100 bg-white/5 border border-white/10 rounded-xl p-3">
                <div className="w-2 h-2 rounded-full bg-amber-400 flex-shrink-0" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right side - Login form */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        <div className="w-full max-w-md py-6">
          <div className="bg-white rounded-3xl shadow-2xl p-8 sm:p-10 animate-slide-up">
            {/* Mobile logo */}
            <div className="flex lg:hidden justify-center mb-6">
              <Image src="/issac-logo.png" alt="iSSAC" width={56} height={60} className="object-contain drop-shadow-sm" />
            </div>

            <div className="mb-6">
              <h2 className="text-2xl font-black text-gray-900 mb-1">Đăng nhập</h2>
              <p className="text-gray-500 text-sm">Đăng nhập tài khoản tuyển sinh iSSAC</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs font-bold text-gray-700">Email đăng nhập</Label>
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
                <Label htmlFor="password" className="text-xs font-bold text-gray-700">Mật khẩu</Label>
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

              <Button type="submit" className="w-full font-bold" size="lg" disabled={loading}>
                {loading ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Đang đăng nhập...</>
                ) : (
                  <><LogIn className="w-4 h-4 mr-2" /> Đăng nhập</>
                )}
              </Button>
            </form>

            <div className="mt-5 text-center text-xs text-gray-500">
              Dành cho ứng viên mới?{' '}
              <Link href="/register" className="text-blue-600 font-bold hover:underline">
                Đăng ký tài khoản
              </Link>
            </div>

            {/* Department Accounts Quick Login Section */}
            <div className="mt-6 pt-5 border-t border-gray-100">
              <div className="text-xs font-bold text-gray-700 mb-2 flex items-center justify-between">
                <span>Tài khoản Giám khảo các Ban</span>
                <span className="text-[10px] text-gray-400 font-normal">Đăng nhập nhanh</span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {DEMO_ADMIN_ACCOUNTS.map((acc) => {
                  const Icon = acc.icon
                  return (
                    <button
                      key={acc.role}
                      type="button"
                      onClick={() => handleQuickLogin(acc.role, acc.email)}
                      className={`p-2.5 rounded-xl border text-left transition-all hover:shadow-sm ${acc.color}`}
                    >
                      <div className="flex items-center gap-1.5 font-bold text-xs">
                        <Icon className="w-3.5 h-3.5" />
                        <span>{acc.name}</span>
                      </div>
                      <div className="text-[10px] opacity-75 font-mono truncate mt-0.5">
                        {acc.email}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="mt-5 text-center">
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
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-[#0f1b4c] text-white text-sm">Đang tải...</div>}>
      <LoginForm />
    </Suspense>
  )
}
