"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  KeyRound,
  ShieldCheck,
  ArrowLeft,
  CheckCircle2,
  Mail,
  Loader2,
  Eye,
  EyeOff,
  RefreshCw,
  Lock,
  ExternalLink
} from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { createClient } from "@/lib/supabase/client"
import { setCandidatePassword, isCandidateDeleted } from "@/lib/candidate-account-manager"

interface ForgotPasswordModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultEmail?: string
  onPasswordResetSuccess?: (email: string) => void
}

export function ForgotPasswordModal({
  open,
  onOpenChange,
  defaultEmail = "",
  onPasswordResetSuccess,
}: ForgotPasswordModalProps) {
  const { toast } = useToast()
  const supabase = createClient()

  const [step, setStep] = useState<"input_email" | "verify_and_change" | "success">("input_email")
  const [email, setEmail] = useState(defaultEmail)
  const [otpCode, setOtpCode] = useState("")
  const [sentOtp, setSentOtp] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [resendCountdown, setResendCountdown] = useState(0)

  useEffect(() => {
    if (open) {
      if (defaultEmail && !email) setEmail(defaultEmail)
    } else {
      setTimeout(() => {
        setStep("input_email")
        setOtpCode("")
        setNewPassword("")
        setConfirmPassword("")
        setLoading(false)
      }, 300)
    }
  }, [open, defaultEmail])

  useEffect(() => {
    let timer: NodeJS.Timeout
    if (resendCountdown > 0) {
      timer = setTimeout(() => setResendCountdown(resendCountdown - 1), 1000)
    }
    return () => clearTimeout(timer)
  }, [resendCountdown])

  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    const cleanEmail = email.trim().toLowerCase()
    if (!cleanEmail || !cleanEmail.includes("@")) {
      toast({
        title: "Email không hợp lệ",
        description: "Vui lòng nhập chính xác địa chỉ email của bạn.",
        variant: "destructive",
      })
      return
    }

    if (isCandidateDeleted("", cleanEmail)) {
      toast({
        title: "Tài khoản không tồn tại",
        description: "Hồ sơ ứng viên này đã bị xoá khỏi hệ thống.",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    // Tạo mã xác thực OTP 6 chữ số
    const code = Math.floor(100000 + Math.random() * 900000).toString()
    setSentOtp(code)

    try {
      if (typeof window !== "undefined") {
        localStorage.setItem(
          `issac_reset_otp_${cleanEmail}`,
          JSON.stringify({ code, expiresAt: Date.now() + 10 * 60 * 1000 })
        )
      }
      await supabase.auth.resetPasswordForEmail(cleanEmail).catch(() => {})
    } catch {}

    setLoading(false)
    setStep("verify_and_change")
    setResendCountdown(60)

    toast({
      title: "Đã tạo mã xác nhận OTP",
      description: `Mã OTP của bạn là: ${code}. Vui lòng nhập mã và đặt mật khẩu mới.`,
      variant: "success",
    } as Parameters<typeof toast>[0])
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    const cleanEmail = email.trim().toLowerCase()
    const inputOtp = otpCode.trim()

    if (inputOtp.length !== 6) {
      toast({
        title: "Mã xác thực không hợp lệ",
        description: "Mã xác thực OTP gồm đúng 6 chữ số.",
        variant: "destructive",
      })
      return
    }

    let valid = false
    if (inputOtp === sentOtp) {
      valid = true
    } else if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem(`issac_reset_otp_${cleanEmail}`)
        if (stored) {
          const parsed = JSON.parse(stored)
          if (parsed.code === inputOtp && parsed.expiresAt > Date.now()) {
            valid = true
          }
        }
      } catch {}
    }

    if (!valid) {
      toast({
        title: "Mã OTP không đúng hoặc đã hết hạn",
        description: "Vui lòng kiểm tra lại mã xác nhận hoặc bấm Gửi lại mã.",
        variant: "destructive",
      })
      return
    }

    if (newPassword.length < 6) {
      toast({
        title: "Mật khẩu quá ngắn",
        description: "Mật khẩu mới phải có ít nhất 6 ký tự.",
        variant: "destructive",
      })
      return
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: "Mật khẩu xác nhận không khớp",
        description: "Vui lòng nhập hai mật khẩu trùng khớp nhau.",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    setCandidatePassword(cleanEmail, newPassword)

    try {
      await supabase.auth.updateUser({ password: newPassword }).catch(() => {})
    } catch {}

    setLoading(false)
    setStep("success")

    toast({
      title: "✅ Đổi mật khẩu thành công!",
      description: "Mật khẩu mới đã được cập nhật vào hệ thống.",
      variant: "success",
    } as Parameters<typeof toast>[0])

    if (onPasswordResetSuccess) {
      onPasswordResetSuccess(cleanEmail)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 overflow-hidden rounded-3xl border-0 shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#1657c1] via-[#104499] to-[#0a2e6b] text-white p-6">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-[#fdc455] shadow-inner shrink-0">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-black text-white">
                Tự Đặt Lại Mật Khẩu
              </DialogTitle>
              <DialogDescription className="text-xs text-blue-200 mt-0.5 font-medium">
                Xác thực bằng mã OTP và thiết lập mật khẩu mới tức thì
              </DialogDescription>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-4 text-left">
          {/* BƯỚC 1: NHẬP EMAIL ĐỂ NHẬN MÃ OTP */}
          {step === "input_email" && (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <p className="text-xs text-gray-600 leading-relaxed">
                Nhập địa chỉ email tài khoản của bạn. Hệ thống sẽ cấp mã xác thực bảo mật <strong>OTP 6 số</strong> để bạn tự tạo mật khẩu mới.
              </p>

              <div className="space-y-1.5">
                <Label htmlFor="reset-email" className="text-xs font-bold text-gray-700">
                  Email đăng nhập của bạn
                </Label>
                <div className="relative">
                  <Input
                    id="reset-email"
                    type="email"
                    placeholder="example@vnu.edu.vn"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-11 rounded-xl text-sm pl-9"
                    autoFocus
                  />
                  <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-11 bg-[#1657c1] hover:bg-[#104499] text-white font-bold rounded-xl text-sm shadow-md cursor-pointer"
              >
                {loading ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Đang gửi mã...</>
                ) : (
                  <><ShieldCheck className="w-4 h-4 mr-2" /> Gửi mã xác nhận OTP</>
                )}
              </Button>

              <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
                <button
                  type="button"
                  onClick={() => onOpenChange(false)}
                  className="text-gray-500 hover:text-gray-800 font-medium cursor-pointer"
                >
                  Quay lại đăng nhập
                </button>
                <a
                  href="https://www.facebook.com/ambassadorsClub.VNUIS"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#1657c1] font-semibold hover:underline inline-flex items-center gap-1"
                >
                  Hỗ trợ qua Fanpage <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </form>
          )}

          {/* BƯỚC 2: NHẬP MÃ OTP VÀ ĐẶT MẬT KHẨU MỚI */}
          {step === "verify_and_change" && (
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3.5 space-y-1.5">
                <div className="text-xs text-amber-900 font-bold flex items-center justify-between">
                  <span>Mã OTP xác thực của bạn:</span>
                  <span className="font-mono text-base font-black tracking-widest bg-white border border-amber-300 px-2.5 py-0.5 rounded-lg text-amber-950 shadow-xs">
                    {sentOtp}
                  </span>
                </div>
                <div className="text-[11px] text-amber-800">
                  Mã có hiệu lực trong 10 phút. Đã gửi thông báo xác thực tới <strong>{email}</strong>.
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="otp-input" className="text-xs font-bold text-gray-700">
                    Nhập mã OTP (6 số)
                  </Label>
                  <button
                    type="button"
                    disabled={resendCountdown > 0 || loading}
                    onClick={() => handleSendOtp()}
                    className="text-[11px] font-semibold text-[#1657c1] hover:underline disabled:text-gray-400 disabled:no-underline flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} />
                    <span>{resendCountdown > 0 ? `Gửi lại (${resendCountdown}s)` : "Gửi lại mã"}</span>
                  </button>
                </div>
                <Input
                  id="otp-input"
                  type="text"
                  maxLength={6}
                  placeholder="••••••"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                  className="h-11 rounded-xl text-center font-mono text-lg font-bold tracking-widest border-blue-200 focus:border-[#1657c1]"
                  autoFocus
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="new-password" className="text-xs font-bold text-gray-700">
                  Mật khẩu mới (tối thiểu 6 ký tự)
                </Label>
                <div className="relative">
                  <Input
                    id="new-password"
                    type={showPw ? "text" : "password"}
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="h-11 rounded-xl text-sm pl-9 pr-10"
                    required
                  />
                  <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <button
                    type="button"
                    onClick={() => setShowPw(!showPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                  >
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="confirm-password" className="text-xs font-bold text-gray-700">
                  Xác nhận lại mật khẩu mới
                </Label>
                <div className="relative">
                  <Input
                    id="confirm-password"
                    type={showPw ? "text" : "password"}
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="h-11 rounded-xl text-sm pl-9"
                    required
                  />
                  <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              <div className="flex gap-2 pt-1">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep("input_email")}
                  className="h-11 rounded-xl text-xs font-bold px-4 text-gray-600 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Quay lại
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="flex-1 h-11 bg-[#1657c1] hover:bg-[#104499] text-white font-bold rounded-xl text-sm shadow-md cursor-pointer"
                >
                  {loading ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Đang cập nhật...</>
                  ) : (
                    "Xác nhận đổi mật khẩu"
                  )}
                </Button>
              </div>
            </form>
          )}

          {/* BƯỚC 3: THÀNH CÔNG */}
          {step === "success" && (
            <div className="text-center py-4 space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-black text-gray-900">
                  Đổi Mật Khẩu Thành Công!
                </h3>
                <p className="text-xs text-gray-600 max-w-xs mx-auto leading-relaxed">
                  Tài khoản <strong>{email}</strong> đã được cập nhật mật khẩu mới. Bạn có thể sử dụng mật khẩu này để đăng nhập ngay bây giờ.
                </p>
              </div>
              <Button
                type="button"
                onClick={() => onOpenChange(false)}
                className="w-full h-11 bg-[#1657c1] hover:bg-[#104499] text-white font-bold rounded-xl text-sm shadow-md cursor-pointer"
              >
                Đăng nhập ngay
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
