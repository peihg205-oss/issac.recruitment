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
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/use-toast'
import { ForgotPasswordModal } from "@/components/auth/forgot-password-modal"
import {
  Eye, EyeOff, LogIn, ArrowLeft, Loader2,
  Crown, Megaphone, MessageSquare, Users, Shield,
  UserCheck, Sparkles, FileText, CheckCircle2
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
    color: 'text-amber-900 bg-amber-50 border-amber-200 hover:bg-amber-100/70',
    desc: 'Toàn quyền duyệt Top 15 và chấm điểm cả 3 ban',
  },
  {
    role: 'truyen-thong',
    name: 'Ban Truyền thông',
    email: 'truyenthong@issac.vnu.edu.vn',
    icon: Megaphone,
    color: 'text-blue-900 bg-blue-50 border-blue-200 hover:bg-blue-100/70',
    desc: 'Chỉ chấm điểm & đặt câu hỏi Ban Truyền thông',
  },
  {
    role: 'tu-van',
    name: 'Ban Tư vấn',
    email: 'tuvan@issac.vnu.edu.vn',
    icon: MessageSquare,
    color: 'text-emerald-900 bg-emerald-50 border-emerald-200 hover:bg-emerald-100/70',
    desc: 'Chỉ chấm điểm & đặt câu hỏi Ban Tư vấn',
  },
  {
    role: 'nhan-su',
    name: 'Ban Nhân sự',
    email: 'nhansu@issac.vnu.edu.vn',
    icon: Users,
    color: 'text-purple-900 bg-purple-50 border-purple-200 hover:bg-purple-100/70',
    desc: 'Chỉ chấm điểm & đặt câu hỏi Ban Nhân sự',
  },
]

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showForgotModal, setShowForgotModal] = useState(false)
  const supabase = createClient()

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (values: FormData) => {
    setLoading(true)

    // Check newly created accounts from BCN
    if (typeof window !== "undefined") {
      const createdRaw = localStorage.getItem("issac_created_admins")
      if (createdRaw) {
        try {
          const createdList = JSON.parse(createdRaw)
          if (Array.isArray(createdList)) {
            const found = createdList.find((a: any) => a.email.toLowerCase() === values.email.toLowerCase())
            if (found && found.is_active) {
              document.cookie = "issac_admin_role=" + found.admin_role + "; path=/; max-age=2592000"
              toast({
                title: "Đăng nhập thành công",
                description: "Chào mừng " + found.full_name + "! Đang chuyển vào cổng quản lý...",
                variant: "success"
              } as Parameters<typeof toast>[0])
              router.push("/admin/dashboard")
              router.refresh()
              return
            }
          }
        } catch {}
      }
    }

    // Demo admin email quick bypass
    const matchedRole = DEMO_ADMIN_ACCOUNTS.find(a => a.email === values.email)?.role
    if (matchedRole) {
      document.cookie = `issac_admin_role=${matchedRole}; path=/; max-age=2592000`
      toast({
        title: 'Đăng nhập thành công',
        description: `Đang chuyển vào cổng quản lý với quyền ${DEMO_ADMIN_ACCOUNTS.find(a => a.role === matchedRole)?.name}...`,
        variant: 'success'
      } as Parameters<typeof toast>[0])
      router.push('/admin/dashboard')
      router.refresh()
      return
    }

    const { data: authData, error } = await supabase.auth.signInWithPassword({
      email: values.email,
      password: values.password,
    })

    setLoading(false)

    if (error) {
      toast({
        title: 'Đăng nhập thất bại',
        description: error.message === 'Invalid login credentials'
          ? 'Email hoặc mật khẩu không chính xác'
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

  const handleCandidateQuickLogin = (mode: 'dashboard' | 'apply') => {
    document.cookie = 'issac_member_demo=true; path=/; max-age=2592000'
    toast({
      title: 'Đăng nhập Demo Ứng Viên',
      description: mode === 'apply' ? 'Đang chuyển đến form nộp đơn ứng tuyển...' : 'Đang chuyển đến Dashboard tiến trình...',
      variant: 'success'
    } as Parameters<typeof toast>[0])
    if (mode === 'apply') {
      router.push('/member/application')
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
    <div className="min-h-screen flex bg-[#1559c5]">
      {/* Left side */}
      <div className="hidden lg:flex lg:flex-1 flex-col items-center justify-center p-12 text-white">
        <div className="max-w-md text-center">
          <div className="flex justify-center mb-6">
            <Image
              src="/issac-logo.png"
              alt="iSSAC - Bridge to Success"
              width={100}
              height={106}
              className="object-contain drop-shadow-2xl"
              priority
            />
          </div>
          <div className="text-xs font-black text-[#fdc455] uppercase tracking-widest mb-1">
            CÂU LẠC BỘ ĐẠI SỨ SINH VIÊN
          </div>
          <h1 className="text-3xl font-black mb-3">
            Cổng Đăng Nhập Hệ Thống
          </h1>
          <p className="text-blue-100 text-sm mb-8 leading-relaxed font-medium">
            Hệ thống phân quyền tuyển chọn thành viên chính thức iSSAC cho Ban Chủ nhiệm và 3 Ban chuyên môn.
          </p>
          <div className="space-y-2.5 text-left">
            {[
              'Chấm điểm phỏng vấn độc lập & giải trình lý do',
              'Xếp hạng tự động theo Ban & Toàn CLB',
              'Ban Chủ nhiệm thẩm định và phê chuẩn Top 15',
              'Theo dõi tiến trình xét tuyển dành cho ứng viên'
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3 text-xs text-blue-50 bg-white/10 border border-white/15 rounded-2xl p-3 backdrop-blur-sm">
                <div className="w-2 h-2 rounded-full bg-[#fdc455] flex-shrink-0" />
                <span className="font-semibold">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right side - Login form */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        <div className="w-full max-w-md py-6">
          <div className="bg-white rounded-[2rem] shadow-2xl p-8 sm:p-10 border border-blue-100">
            {/* Mobile logo */}
            <div className="flex lg:hidden justify-center mb-4">
              <Image src="/issac-logo.png" alt="iSSAC" width={56} height={60} className="object-contain" />
            </div>

            <div className="mb-6 text-left">
              <h2 className="text-2xl font-black text-gray-950 mb-1">Đăng nhập</h2>
              <p className="text-gray-500 text-xs font-medium">Hệ thống quản lý tuyển quân & Cổng ứng viên iSSAC</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 text-left">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs font-bold text-gray-700">Email đăng nhập</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="example@vnu.edu.vn"
                  {...register('email')}
                  className={`text-sm rounded-xl h-11 ${errors.email ? 'border-red-300' : 'border-gray-200'}`}
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
                    className={`pr-10 text-sm rounded-xl h-11 ${errors.password ? 'border-red-300' : 'border-gray-200'}`}
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
                <button
                  type="button"
                  onClick={() => setShowForgotModal(true)}
                  className="text-xs text-[#1559c5] font-semibold hover:underline cursor-pointer"
                >
                  Quên mật khẩu?
                </button>
              </div>

              <Button
                type="submit"
                className="w-full font-black bg-[#1559c5] hover:bg-[#0f449e] text-white rounded-full h-11 text-sm shadow-md"
                disabled={loading}
              >
                {loading ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Đang đăng nhập...</>
                ) : (
                  <><LogIn className="w-4 h-4 mr-2" /> Đăng nhập</>
                )}
              </Button>
            </form>

            <div className="mt-4 text-center text-xs text-gray-500">
              Chưa có tài khoản sinh viên?{' '}
              <Link href="/register" className="text-[#1559c5] font-bold hover:underline">
                Đăng ký ứng tuyển
              </Link>
            </div>

            {/* Candidate Demo Quick Login Section */}
            <div className="mt-6 p-4 rounded-2xl bg-[#fff7e8] border border-[#fed7aa] shadow-sm text-left">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-black text-amber-950 flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-amber-600" />
                  DEMO DÀNH CHO NGƯỜI APPLY (ỨNG VIÊN)
                </span>
                <span className="bg-[#fdc455] text-gray-950 text-[10px] font-black px-2 py-0.5 rounded-full">
                  1-Click
                </span>
              </div>
              <p className="text-[11px] text-gray-700 mb-2.5 leading-relaxed">
                Trải nghiệm tài khoản ứng viên <strong>Nguyễn Hà Phương (K22 - VNU-IS)</strong>:
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleCandidateQuickLogin('dashboard')}
                  className="p-2.5 rounded-xl bg-white border border-amber-300 text-left hover:bg-amber-100/50 transition-all shadow-sm"
                >
                  <div className="font-bold text-xs text-amber-950 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>Xem Tiến độ & Kết quả</span>
                  </div>
                  <div className="text-[10px] text-gray-500 mt-0.5">Lộ trình, ca PV, TOP 15</div>
                </button>
                <button
                  type="button"
                  onClick={() => handleCandidateQuickLogin('apply')}
                  className="p-2.5 rounded-xl bg-white border border-amber-300 text-left hover:bg-amber-100/50 transition-all shadow-sm"
                >
                  <div className="font-bold text-xs text-amber-950 flex items-center gap-1">
                    <FileText className="w-3.5 h-3.5 text-blue-600" />
                    <span>Form Nộp Đơn Mới</span>
                  </div>
                  <div className="text-[10px] text-gray-500 mt-0.5">Chọn ban & trả lời câu hỏi</div>
                </button>
              </div>
            </div>

            {/* Department Accounts Quick Login Section */}
            <div className="mt-5 pt-4 border-t border-gray-100 text-left">
              <div className="text-xs font-bold text-gray-800 mb-2 flex items-center justify-between">
                <span>Tài khoản Giám khảo các Ban</span>
                <span className="text-[10px] text-gray-400 font-normal">1-Click Admin</span>
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

            <div className="mt-6 text-center">
              <Link href="/" className="inline-flex items-center gap-1 text-gray-500 text-xs hover:text-[#1559c5] font-semibold transition-colors">
                <ArrowLeft className="w-3 h-3" /> Về trang chủ iSSAC
              </Link>
            </div>
          </div>
        </div>
      </div>
      <ForgotPasswordModal open={showForgotModal} onOpenChange={setShowForgotModal} />
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-[#1559c5] text-white text-sm">Đang tải...</div>}>
      <LoginForm />
    </Suspense>
  )
}
