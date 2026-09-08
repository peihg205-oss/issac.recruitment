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
  Mail,
  Phone,
  MessageCircle,
  Copy,
  Check,
  ExternalLink,
  Sparkles,
  Send
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
      description: "Bạn có thể dán (Paste) ngay vào tin nhắn Fanpage hoặc gửi Email.",
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
            Nếu bạn quên mật khẩu đăng nhập tài khoản ứng viên, vui lòng liên hệ trực tiếp với Ban Quản trị qua <strong>Fanpage</strong> hoặc <strong>Email chính thức</strong> của CLB để được cấp lại mật khẩu nhanh nhất:
          </p>

          {/* Option 1: Facebook Fanpage */}
          <a
            href="https://www.facebook.com/ambassadorsClub.VNUIS"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between p-3.5 rounded-xl bg-blue-50/80 hover:bg-blue-100/80 border border-blue-200/80 transition-all group"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-full bg-[#1877F2] text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-xs">
                f
              </div>
              <div className="min-w-0">
                <div className="font-bold text-xs text-slate-900 group-hover:text-[#1657c1] transition-colors truncate">
                  Fanpage CLB Đại sứ Sinh viên VNU-IS
                </div>
                <div className="text-[11px] text-slate-500 truncate">
                  Nhắn tin trực tiếp qua Messenger (Khuyên dùng)
                </div>
              </div>
            </div>
            <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-[#1657c1] shrink-0 ml-2" />
          </a>

          {/* Option 2: Email */}
          <a
            href="mailto:ambassadors.club@vnuis.edu.vn?subject=%5BiSSAC%20Gen%203%5D%20Y%C3%AAu%20c%E1%BA%A7u%20c%E1%BA%A5p%20l%E1%BA%A1i%20m%E1%BA%ADt%20kh%E1%BA%A9u%20%E1%BB%A9ng%20vi%C3%AAn"
            className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-all group"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <Mail className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="font-bold text-xs text-slate-900 group-hover:text-emerald-700 transition-colors truncate">
                  ambassadors.club@vnuis.edu.vn
                </div>
                <div className="text-[11px] text-slate-500 truncate">
                  Gửi email tới Hòm thư Ban Tuyển quân
                </div>
              </div>
            </div>
            <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-emerald-700 shrink-0 ml-2" />
          </a>

          {/* Option 3: Phone / Hotline */}
          <div className="flex items-center gap-3 p-3 rounded-xl bg-amber-50/70 border border-amber-200/80">
            <div className="w-9 h-9 rounded-full bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Phone className="w-4 h-4" />
            </div>
            <div className="text-xs">
              <div className="font-bold text-amber-950">Hotline hỗ trợ trực ban</div>
              <div className="text-[11px] text-amber-800 font-semibold mt-0.5">
                0374140705 <span className="font-normal text-amber-700">(PCN - Mr. Hiệp)</span>
              </div>
            </div>
          </div>

          {/* Quick Syntax Copy */}
          <div className="pt-2 border-t border-slate-200 space-y-2">
            <Label className="text-xs font-bold text-slate-700 block">
              Tạo nhanh nội dung tin nhắn gửi Fanpage / Email
            </Label>
            <div className="flex items-center gap-2">
              <Input
                type="email"
                placeholder="Nhập email bạn đã đăng ký..."
                value={candidateEmail}
                onChange={e => setCandidateEmail(e.target.value)}
                className="text-xs h-9"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCopySyntax}
                className="h-9 px-3 text-xs font-semibold gap-1.5 shrink-0 bg-white border-blue-200 text-[#1657c1] hover:bg-blue-50"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? "Đã chép" : "Sao chép"}</span>
              </Button>
            </div>
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
