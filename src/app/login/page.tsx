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
import { ForgotPasswordModal } from "@/components/auth/forgot-password-modal"
import {
  Eye, EyeOff, LogIn, Loader2,
  CheckCircle2, Trophy, ShieldCheck, Sparkles, Home
} from 'lucide-react'

const schema = z.object({
  email: z.string().email('Email không hợp lệ'),
  password: z.string().min(6, 'Mật khẩu phải ít nhất 6 ký tự'),
})
type FormData = z.infer<typeof schema>

const SYSTEM_ADMIN_ROLES: Record<string, { role: string; name: string }> = {
  'bcn@issac.vnu.edu.vn': { role: 'chu-nhiem', name: 'Ban Chủ nhiệm' },
  'truyenthong@issac.vnu.edu.vn': { role: 'truyen-thong', name: 'Ban Truyền thông' },
  'dinhhai.issac@vnu.edu.vn': { role: 'truyen-thong', name: 'Ban Truyền thông' },
  'tuvan@issac.vnu.edu.vn': { role: 'tu-van', name: 'Ban Tư vấn' },
  'haiyen.issac@vnu.edu.vn': { role: 'tu-van', name: 'Ban Tư vấn' },
  'nhansu@issac.vnu.edu.vn': { role: 'nhan-su', name: 'Ban Nhân sự' },
  'minhduc.issac@vnu.edu.vn': { role: 'nhan-su', name: 'Ban Nhân sự' },
}

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showForgotModal, setShowForgotModal] = useState(false)
  const supabase = createClient()

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (values: FormData) => {
    setLoading(true)

    // 1. Kiểm tra tài khoản admin được Ban Chủ nhiệm cấp quyền
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

    // 2. Kiểm tra tài khoản cán bộ quản trị hệ thống
    const matchedAdmin = SYSTEM_ADMIN_ROLES[values.email.toLowerCase()]
    if (matchedAdmin) {
      document.cookie = "issac_admin_role=" + matchedAdmin.role + "; path=/; max-age=2592000"
      toast({
        title: "Đăng nhập thành công",
        description: "Đang chuyển vào cổng quản lý với quyền " + matchedAdmin.name + "...",
        variant: "success"
      } as Parameters<typeof toast>[0])
      router.push("/admin/dashboard")
      router.refresh()
      return
    }

    // 3. Đăng nhập với Supabase Authentication
    const { data: authData, error } = await supabase.auth.signInWithPassword({
      email: values.email,
      password: values.password,
    })

    setLoading(false)

    if (error) {
      toast({
        title: "Đăng nhập thất bại",
        description: error.message === "Invalid login credentials"
          ? "Email hoặc mật khẩu không chính xác"
          : error.message,
        variant: "destructive"
      })
      return
    }

    if (!authData.user) return

    const { data: profile } = await supabase
      .from("profiles")
      .select("role, admin_role")
      .eq("id", authData.user.id)
      .single()

    if (profile?.admin_role) {
      document.cookie = "issac_admin_role=" + profile.admin_role + "; path=/; max-age=2592000"
    }

    toast({ title: "Đăng nhập thành công", variant: "success" } as Parameters<typeof toast>[0])

    const redirectTo = searchParams.get("redirectedFrom")
    if (redirectTo) {
      router.push(redirectTo)
    } else if (profile?.role === "admin" || profile?.role === "super_admin") {
      router.push("/admin/dashboard")
    } else {
      router.push("/member/dashboard")
    }
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
            Hệ thống phân quyền tuyển chọn thành viên chính thức iSSAC cho Ban Chủ nhiệm và các Ban chuyên môn.
          </p>
          <div className="space-y-3 text-left">
            {[
              {
                title: "Chấm điểm phỏng vấn độc lập & giải trình lý do",
                icon: CheckCircle2,
              },
              {
                title: "Xếp hạng tự động theo Ban & Toàn CLB",
                icon: Trophy,
              },
              {
                title: "Ban Chủ nhiệm thẩm định và phê chuẩn Top 15",
                icon: ShieldCheck,
              },
              {
                title: "Theo dõi tiến trình tuyển quân dành cho ứng viên",
                icon: Sparkles,
              },
            ].map((item, i) => {
              const Icon = item.icon
              return (
                <div
                  key={i}
                  className="flex items-center gap-3.5 text-xs text-blue-50 bg-white/10 border border-white/15 rounded-2xl p-3.5 backdrop-blur-sm shadow-sm hover:bg-white/15 transition-all"
                >
                  <div className="w-8 h-8 rounded-xl bg-[#fdc455]/20 border border-[#fdc455]/40 flex items-center justify-center shrink-0 text-[#fdc455] shadow-inner">
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="font-semibold text-white/95 leading-snug">{item.title}</span>
                </div>
              )
            })}
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
                  {...register("email")}
                  className={`text-sm rounded-xl h-11 ${errors.email ? "border-red-300" : "border-gray-200"}`}
                />
                {errors.email && <p className="text-red-500 text-xs">{errors.email.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-xs font-bold text-gray-700">Mật khẩu</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPw ? "text" : "password"}
                    placeholder="••••••••"
                    {...register("password")}
                    className={`pr-10 text-sm rounded-xl h-11 ${errors.password ? "border-red-300" : "border-gray-200"}`}
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

            <div className="mt-5 text-center text-xs text-gray-500">
              Chưa có tài khoản sinh viên?{" "}
              <Link href="/register" className="text-[#1559c5] font-bold hover:underline">
                Đăng ký ứng tuyển
              </Link>
            </div>

            {/* Về trang chủ - Biểu tượng ngôi nhà */}
            <div className="mt-8 flex justify-center border-t border-gray-100 pt-5">
              <Link
                href="/"
                aria-label="Về trang chủ"
                title="Về trang chủ iSSAC"
                className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center text-gray-400 hover:text-[#1559c5] hover:border-[#1559c5]/40 hover:bg-blue-50/60 transition-all shadow-sm group"
              >
                <Home className="w-5 h-5 transition-transform group-hover:scale-110" />
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
