"use client"
import { useState, Suspense, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { ForgotPasswordModal } from "@/components/auth/forgot-password-modal"
import { isCandidateDeleted } from "@/lib/candidate-account-manager"
import { useSystemSettings } from "@/lib/system-settings"
import {
  Eye, EyeOff, LogIn, Loader2, Home,
  GraduationCap, ShieldCheck, UserCheck, Calendar,
  FileEdit, Users, Award
} from "lucide-react"

const schema = z.object({
  email: z.string().email("Email không hợp lệ"),
  password: z.string().min(6, "Mật khẩu phải ít nhất 6 ký tự"),
})
type FormData = z.infer<typeof schema>

const SYSTEM_ADMIN_ROLES: Record<string, { role: string; name: string }> = {
  "bcn@issac.vnu.edu.vn": { role: "chu-nhiem", name: "Ban Chủ nhiệm" },
  "truyenthong@issac.vnu.edu.vn": { role: "truyen-thong", name: "Ban Truyền thông" },
  "dinhhai.issac@vnu.edu.vn": { role: "truyen-thong", name: "Ban Truyền thông" },
  "tuvan@issac.vnu.edu.vn": { role: "tu-van", name: "Ban Tư vấn" },
  "haiyen.issac@vnu.edu.vn": { role: "tu-van", name: "Ban Tư vấn" },
  "nhansu@issac.vnu.edu.vn": { role: "nhan-su", name: "Ban Nhân sự" },
  "minhduc.issac@vnu.edu.vn": { role: "nhan-su", name: "Ban Nhân sự" },
}

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const [loginType, setLoginType] = useState<"candidate" | "admin">("candidate")
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showForgotModal, setShowForgotModal] = useState(false)
  const supabase = createClient()
  const { timeline } = useSystemSettings()

  const { register, handleSubmit, formState: { errors }, reset, setValue } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  useEffect(() => {
    const redirectedFrom = searchParams.get("redirectedFrom")
    const roleParam = searchParams.get("role") || searchParams.get("tab")
    if (roleParam === "admin" || (redirectedFrom && redirectedFrom.startsWith("/admin"))) {
      setLoginType("admin")
    } else {
      setLoginType("candidate")
    }
  }, [searchParams])

  const handleTabChange = (type: "candidate" | "admin") => {
    setLoginType(type)
    reset()
  }

  const onSubmit = async (values: FormData) => {
    setLoading(true)

    // XỬ LÝ ĐĂNG NHẬP BAN TUYỂN QUÂN (ADMIN / GIÁM KHẢO)
    if (loginType === "admin") {
      // 1. Kiểm tra tài khoản admin do Ban Chủ nhiệm tạo mới
      if (typeof window !== "undefined") {
        const createdRaw = localStorage.getItem("issac_created_admins")
        if (createdRaw) {
          try {
            const createdList = JSON.parse(createdRaw)
            if (Array.isArray(createdList)) {
              const found = createdList.find((a: any) => a.email.toLowerCase() === values.email.toLowerCase())
              if (found) {
                if (!found.is_active) {
                  setLoading(false)
                  toast({
                    title: "Tài khoản bị tạm khoá",
                    description: "Tài khoản của bạn đã bị vô hiệu hoá. Vui lòng liên hệ Ban Chủ nhiệm CLB.",
                    variant: "destructive"
                  })
                  return
                }
                document.cookie = "issac_admin_role=" + found.admin_role + "; path=/; max-age=2592000"
                toast({
                  title: "Đăng nhập thành công",
                  description: "Chào mừng " + found.full_name + "! Đang chuyển vào cổng quản trị...",
                  variant: "success"
                } as Parameters<typeof toast>[0])
                router.push(searchParams.get("redirectedFrom") || "/admin/dashboard")
                router.refresh()
                return
              }
            }
          } catch {}
        }
      }

      // 2. Kiểm tra tài khoản cán bộ quản trị hệ thống mặc định
      const matchedAdmin = SYSTEM_ADMIN_ROLES[values.email.toLowerCase()]
      if (matchedAdmin) {
        document.cookie = "issac_admin_role=" + matchedAdmin.role + "; path=/; max-age=2592000"
        toast({
          title: "Đăng nhập thành công",
          description: "Đang chuyển vào cổng quản lý với quyền " + matchedAdmin.name + "...",
          variant: "success"
        } as Parameters<typeof toast>[0])
        router.push(searchParams.get("redirectedFrom") || "/admin/dashboard")
        router.refresh()
        return
      }
    }

    // XỬ LÝ ĐĂNG NHẬP ỨNG VIÊN
    if (loginType === "candidate") {
      const isDeleted = isCandidateDeleted("", values.email)
      if (isDeleted) {
        setLoading(false)
        toast({
          title: "Tài khoản không tồn tại",
          description: "Hồ sơ ứng viên này đã bị xoá khỏi hệ thống.",
          variant: "destructive"
        })
        return
      }
    }

    // ĐĂNG NHẬP VỚI SUPABASE AUTH
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

    const isAdmin = profile?.role === "admin" || profile?.role === "super_admin"

    // Kiểm tra đúng tab
    if (loginType === "admin" && !isAdmin) {
      toast({
        title: "Không có quyền quản trị",
        description: "Tài khoản của bạn là Ứng viên. Vui lòng chuyển sang tab Đăng nhập Ứng viên.",
        variant: "destructive"
      })
      return
    }

    if (profile?.admin_role) {
      document.cookie = "issac_admin_role=" + profile.admin_role + "; path=/; max-age=2592000"
    }

    toast({ title: "Đăng nhập thành công", variant: "success" } as Parameters<typeof toast>[0])

    const redirectTo = searchParams.get("redirectedFrom")
    if (redirectTo) {
      router.push(redirectTo)
    } else if (isAdmin) {
      router.push("/admin/dashboard")
    } else {
      router.push("/member/dashboard")
    }
    router.refresh()
  }

  return (
    <div className="min-h-screen flex bg-[#1559c5]">
      {/* Left side - Lịch trình Tuyển quân Gen 3 */}
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
            Hệ Thống Tuyển Quân Câu Lạc Bộ Đại Sứ Sinh Viên
          </h1>

          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/20 text-xs font-bold text-amber-200 mb-6 backdrop-blur-sm shadow-sm">
            <span className="w-2 h-2 rounded-full bg-[#fdc455] animate-ping" />
            <span>iSSAC đang tuyển thành viên Gen 3</span>
          </div>

          {/* Lịch trình Tuyển quân Gen 3 - Đơn giản ngày tháng */}
          <div className="bg-white/10 border border-white/15 rounded-3xl p-5 xl:p-6 backdrop-blur-md text-left shadow-xl space-y-3.5">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <span className="text-xs font-black text-[#fdc455] uppercase tracking-wider flex items-center gap-2">
                <Calendar className="w-4 h-4" /> Lịch Trình Tuyển Quân Gen 3
              </span>
              <span className="text-[10px] bg-amber-400 text-slate-950 font-black px-2.5 py-0.5 rounded-full shadow-xs">
                Khóa 2026
              </span>
            </div>

            <div className="space-y-2.5">
              {/* Mốc 1 */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-[#fdc455]/20 text-[#fdc455] font-black text-xs flex items-center justify-center shrink-0">
                    01
                  </div>
                  <span className="font-bold text-white text-xs">{timeline.round1.name}</span>
                </div>
                <span className="font-mono text-xs font-bold text-amber-300 bg-white/10 px-3 py-1 rounded-xl border border-white/10">
                  {timeline.round1.dateBadge}
                </span>
              </div>

              {/* Mốc 2 */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-blue-400/20 text-blue-200 font-black text-xs flex items-center justify-center shrink-0">
                    02
                  </div>
                  <span className="font-bold text-white text-xs">{timeline.round2.name}</span>
                </div>
                <span className="font-mono text-xs font-bold text-blue-200 bg-white/10 px-3 py-1 rounded-xl border border-white/10">
                  {timeline.round2.dateBadge}
                </span>
              </div>

              {/* Mốc 3 */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-emerald-400/20 text-emerald-300 font-black text-xs flex items-center justify-center shrink-0">
                    03
                  </div>
                  <span className="font-bold text-white text-xs">{timeline.round3.name}</span>
                </div>
                <span className="font-mono text-xs font-bold text-emerald-300 bg-white/10 px-3 py-1 rounded-xl border border-white/10">
                  {timeline.round3.dateBadge}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Login form with Role Tabs */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        <div className="w-full max-w-md py-6">
          <div className="bg-white rounded-[2rem] shadow-2xl p-7 sm:p-9 border border-blue-100">
            {/* Mobile logo */}
            <div className="flex lg:hidden justify-center mb-4">
              <Image src="/issac-logo.png" alt="iSSAC" width={56} height={60} className="object-contain" />
            </div>

            {/* Role Tabs Switcher: Ứng viên vs Ban Tuyển quân */}
            <div className="grid grid-cols-2 p-1 bg-gray-100 rounded-2xl mb-6">
              <button
                type="button"
                onClick={() => handleTabChange("candidate")}
                className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  loginType === "candidate"
                    ? "bg-white text-[#1559c5] shadow-sm font-black"
                    : "text-gray-500 hover:text-gray-900"
                }`}
              >
                <GraduationCap className="w-4 h-4" />
                <span>Ứng viên</span>
              </button>

              <button
                type="button"
                onClick={() => handleTabChange("admin")}
                className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  loginType === "admin"
                    ? "bg-[#1559c5] text-white shadow-sm font-black"
                    : "text-gray-500 hover:text-gray-900"
                }`}
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Ban Tuyển quân</span>
              </button>
            </div>

            {/* Header info based on selected role */}
            <div className="mb-6 text-left">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold mb-2.5 shadow-sm transition-all bg-blue-50 text-[#1559c5] border border-blue-100">
                {loginType === "candidate" ? (
                  <>
                    <UserCheck className="w-3.5 h-3.5 text-[#1559c5]" />
                    <span>CỔNG DÀNH CHO ỨNG VIÊN</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-3.5 h-3.5 text-[#1559c5]" />
                    <span>DÀNH CHO BAN CHỦ NHIỆM & GIÁM KHẢO</span>
                  </>
                )}
              </div>

              <h2 className="text-2xl font-black text-gray-950 mb-1">
                {loginType === "candidate" ? "Đăng nhập Ứng viên" : "Cổng Quản trị Tuyển quân"}
              </h2>
              <p className="text-gray-500 text-xs font-medium leading-relaxed">
                {loginType === "candidate"
                  ? "Tra cứu tiến trình xét duyệt hồ sơ, lịch phỏng vấn & kết quả chính thức."
                  : "Dành cho Ban Chủ nhiệm và Ban Giám khảo chấm điểm, xét duyệt hồ sơ."}
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 text-left">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs font-bold text-gray-700">
                  {loginType === "candidate" ? "Email sinh viên / cá nhân" : "Email cán bộ tuyển quân"}
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder={loginType === "candidate" ? "ungvien@vnu.edu.vn" : "canbo@issac.vnu.edu.vn"}
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
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
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
                className="w-full font-black bg-[#1559c5] hover:bg-[#0f449e] text-white rounded-full h-11 text-sm shadow-md cursor-pointer transition-all"
                disabled={loading}
              >
                {loading ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Đang xác thực...</>
                ) : (
                  <><LogIn className="w-4 h-4 mr-2" /> {loginType === "candidate" ? "Đăng nhập Ứng viên" : "Đăng nhập Ban Tuyển quân"}</>
                )}
              </Button>
            </form>

            {/* Bottom: Only show register link for candidate; Admin note is removed */}
            {loginType === "candidate" && (
              <div className="mt-5 text-center text-xs text-gray-500">
                Chưa có tài khoản sinh viên?{" "}
                <Link href="/register" className="text-[#1559c5] font-bold hover:underline">
                  Đăng ký ứng tuyển
                </Link>
              </div>
            )}

            {/* Về trang chủ - Biểu tượng ngôi nhà */}
            <div className="mt-7 flex justify-center border-t border-gray-100 pt-4">
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

      <ForgotPasswordModal
        open={showForgotModal}
        onOpenChange={setShowForgotModal}
        defaultEmail=""
        onPasswordResetSuccess={(resetEmail) => {
          setValue("email", resetEmail)
        }}
      />
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
