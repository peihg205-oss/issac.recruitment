"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  HelpCircle,
  Copy,
  Check,
  ExternalLink,
  MessageCircle,
  ShieldAlert
} from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

interface ForgotPasswordModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultEmail?: string
  onPasswordResetSuccess?: (email: string) => void
}

export function ForgotPasswordModal({ open, onOpenChange, defaultEmail = "" }: ForgotPasswordModalProps) {
  const { toast } = useToast()
  const [candidateEmail, setCandidateEmail] = useState(defaultEmail)
  const [copied, setCopied] = useState(false)

  const handleCopySyntax = () => {
    const emailToUse = candidateEmail.trim() || "[Email đăng ký của bạn]"
    const text = `Chào Ban Tuyển quân CLB Đại sứ Sinh viên iSSAC, em là ứng viên tham gia đợt tuyển quân Gen 3. Hiện tại em bị quên mật khẩu đăng nhập tài khoản.\n\n• Email đăng ký của em là: ${emailToUse}\n\nNhờ Admin Page hỗ trợ kiểm tra và cấp lại mật khẩu giúp em để em tiếp tục theo dõi tiến trình tuyển quân với ạ. Em cảm ơn Admin nhiều ạ!`
    navigator.clipboard.writeText(text)
    setCopied(true)
    toast({
      title: "Đã sao chép cú pháp tin nhắn",
      description: "Bạn có thể dán (Paste) ngay vào khung chat gửi Fanpage iSSAC.",
    })
    setTimeout(() => setCopied(false), 2500)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 overflow-hidden rounded-3xl border-0 shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#1657c1] via-[#104499] to-[#0a2e6b] text-white p-6">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-[#fdc455] shadow-inner shrink-0">
              <MessageCircle className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-black text-white">
                Cấp Lại Mật Khẩu Qua Fanpage
              </DialogTitle>
              <DialogDescription className="text-xs text-blue-200 mt-0.5 font-medium">
                Liên hệ Fanpage Facebook CLB iSSAC để Admin Page hỗ trợ cấp lại
              </DialogDescription>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-4 text-left text-sm max-h-[75vh] overflow-y-auto">
          <p className="text-xs text-slate-600 leading-relaxed">
            Để đảm bảo tính chính xác và an toàn cho hồ sơ ứng tuyển, mật khẩu tài khoản sẽ được <strong>Admin Page iSSAC xác thực và cấp lại trực tiếp</strong> qua Fanpage chính thức:
          </p>

          {/* Facebook Fanpage Direct Button */}
          <a
            href="https://www.facebook.com/ambassadorsClub.VNUIS"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between p-4 rounded-2xl bg-blue-50/90 hover:bg-blue-100 border-2 border-blue-200 transition-all group shadow-xs hover:shadow-md"
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-11 h-11 rounded-2xl bg-[#1877F2] text-white flex items-center justify-center font-black text-lg shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                f
              </div>
              <div className="min-w-0">
                <div className="font-black text-xs sm:text-sm text-slate-900 group-hover:text-[#1657c1] transition-colors truncate">
                  Fanpage CLB Đại sứ Sinh viên VNU-IS
                </div>
                <div className="text-[11px] text-blue-700 font-bold truncate mt-0.5 flex items-center gap-1">
                  <span>Nhắn tin đến Admin Page qua Messenger</span>
                  <span>→</span>
                </div>
              </div>
            </div>
            <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-[#1657c1] shrink-0 ml-2" />
          </a>

          {/* Quick Syntax Copy */}
          <div className="pt-3 border-t border-slate-200 space-y-2.5">
            <Label className="text-xs font-bold text-slate-800 block">
              Tạo nhanh mẫu tin nhắn gửi Admin Page
            </Label>
            <div className="flex items-center gap-2">
              <Input
                type="email"
                placeholder="Nhập email bạn đã đăng ký..."
                value={candidateEmail}
                onChange={(e) => setCandidateEmail(e.target.value)}
                className="text-xs h-10 rounded-xl"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCopySyntax}
                className="h-10 px-3.5 text-xs font-bold gap-1.5 shrink-0 bg-white border-blue-200 text-[#1657c1] hover:bg-blue-50 rounded-xl cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? "Đã chép" : "Sao chép"}</span>
              </Button>
            </div>
            <p className="text-[11px] text-slate-500 leading-snug">
              Bấm sao chép và dán trực tiếp vào khung chat của Fanpage để Admin Page kiểm tra và gửi lại mật khẩu nhanh nhất cho bạn.
            </p>
          </div>
        </div>

        <DialogFooter className="p-4 bg-slate-50 border-t border-slate-200">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="w-full text-xs font-bold rounded-xl h-10 cursor-pointer"
          >
            Đóng
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
