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
  Sparkles
} from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

interface ForgotPasswordModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ForgotPasswordModal({ open, onOpenChange }: ForgotPasswordModalProps) {
  const { toast } = useToast()
  const [candidateEmail, setCandidateEmail] = useState("")
  const [copied, setCopied] = useState(false)

  const handleCopySyntax = () => {
    const emailToUse = candidateEmail.trim() || "[Email của bạn]"
    const text = "Chào Ban Tuyển quân CLB Đại sứ Sinh viên iSSAC, em là ứng viên tham gia đợt tuyển quân Gen 3. Hiện tại em bị quên mật khẩu đăng nhập tài khoản.\n\n• Email đăng ký của em là: " + emailToUse + "\n\nNhờ Ban hỗ trợ kiểm tra và cấp lại mật khẩu giúp em để em tiếp tục theo dõi tiến trình tuyển quân với ạ. Em cảm ơn Ban nhiều ạ!"
    navigator.clipboard.writeText(text)
    setCopied(true)
    toast({
      title: "Đã sao chép cú pháp tin nhắn",
      description: "Bạn có thể dán (Paste) ngay vào tin nhắn gửi Fanpage.",
    })
    setTimeout(() => setCopied(false), 2500)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 overflow-hidden rounded-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#1657c1] to-blue-900 text-white p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-amber-300 shadow-inner">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-white">
                Hỗ trợ Cấp lại Mật khẩu
              </DialogTitle>
              <DialogDescription className="text-xs text-blue-200/90 mt-0.5">
                Cổng Tuyển quân CLB Đại sứ Sinh viên iSSAC
              </DialogDescription>
            </div>
          </div>
        </div>

        <div className="p-5 space-y-4 text-left text-sm max-h-[75vh] overflow-y-auto">
          <p className="text-xs text-slate-600 leading-relaxed">
            Nếu bạn quên mật khẩu đăng nhập tài khoản ứng viên, vui lòng nhắn tin trực tiếp tới <strong>Fanpage chính thức</strong> của CLB để được Ban Quản trị hỗ trợ kiểm tra và cấp lại mật khẩu nhanh nhất:
          </p>

          {/* Facebook Fanpage Button */}
          <a
            href="https://www.facebook.com/ambassadorsClub.VNUIS"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between p-4 rounded-2xl bg-blue-50/90 hover:bg-blue-100 border border-blue-200 transition-all group shadow-2xs hover:shadow-xs"
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-10 h-10 rounded-full bg-[#1877F2] text-white flex items-center justify-center font-bold text-base shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                f
              </div>
              <div className="min-w-0">
                <div className="font-bold text-xs sm:text-sm text-slate-900 group-hover:text-[#1657c1] transition-colors truncate">
                  Fanpage CLB Đại sứ Sinh viên VNU-IS
                </div>
                <div className="text-[11px] text-blue-600 font-medium truncate mt-0.5">
                  Nhắn tin qua Messenger Facebook →
                </div>
              </div>
            </div>
            <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-[#1657c1] shrink-0 ml-2" />
          </a>

          {/* Quick Syntax Copy for Fanpage message */}
          <div className="pt-2 border-t border-slate-200 space-y-2">
            <Label className="text-xs font-bold text-slate-700 block">
              Tạo nhanh tin nhắn gửi Fanpage
            </Label>
            <div className="flex items-center gap-2">
              <Input
                type="email"
                placeholder="Nhập email bạn đã đăng ký..."
                value={candidateEmail}
                onChange={e => setCandidateEmail(e.target.value)}
                className="text-xs h-10"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCopySyntax}
                className="h-10 px-3.5 text-xs font-semibold gap-1.5 shrink-0 bg-white border-blue-200 text-[#1657c1] hover:bg-blue-50"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? "Đã chép" : "Sao chép"}</span>
              </Button>
            </div>
            <p className="text-[11px] text-slate-400">
              Bấm sao chép và dán trực tiếp vào khung chat của Fanpage để được hỗ trợ tức thì.
            </p>
          </div>
        </div>

        <DialogFooter className="p-4 bg-slate-50 border-t border-slate-200">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="w-full text-xs font-bold"
          >
            Đóng
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
