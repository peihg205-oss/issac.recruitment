"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
  HelpCircle,
  Mail,
  Phone,
  Copy,
  Check,
  ExternalLink,
  ArrowLeft,
  Sparkles,
  ShieldCheck
} from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

export default function ForgotPasswordPage() {
  const { toast } = useToast()
  const [email, setEmail] = useState("")
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    const emailToUse = email.trim() || "[Email đăng ký của bạn]"
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
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-900 via-[#0d3d8a] to-[#1559c5]">
      <div className="w-full max-w-lg">
        {/* Brand */}
        <div className="text-center mb-6">
          <Link href="/" className="inline-flex items-center gap-3 text-white">
            <Image
              src="/issac-logo.png"
              alt="iSSAC Logo"
              width={52}
              height={56}
              className="object-contain drop-shadow-xl"
            />
            <div className="text-left">
              <div className="font-black text-xl tracking-tight leading-tight">iSSAC Recruitment</div>
              <div className="text-xs text-blue-200 font-medium">Cổng Tuyển quân Đại sứ Sinh viên Gen 3</div>
            </div>
          </Link>
        </div>

        <Card className="border-0 shadow-2xl rounded-3xl overflow-hidden bg-white/95 backdrop-blur-md">
          <CardHeader className="bg-gradient-to-r from-[#1657c1] to-blue-900 text-white p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-amber-300">
                <HelpCircle className="w-6 h-6" />
              </div>
              <div>
                <CardTitle className="text-lg font-black text-white">
                  Hỗ trợ Cấp lại Mật khẩu
                </CardTitle>
                <CardDescription className="text-xs text-blue-200 mt-1">
                  Dành cho ứng viên quên mật khẩu đăng nhập
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-6 space-y-5 text-left text-sm">
            <p className="text-xs text-slate-600 leading-relaxed">
              Nếu bạn không nhớ mật khẩu đăng nhập tài khoản ứng viên iSSAC, vui lòng liên hệ trực tiếp với Ban Quản trị qua <strong>Fanpage</strong> hoặc <strong>Email chính thức</strong> của CLB để được kiểm tra và cấp lại ngay:
            </p>

            {/* Facebook Fanpage */}
            <a
              href="https://www.facebook.com/ambassadorsClub.VNUIS"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-4 rounded-2xl bg-blue-50 hover:bg-blue-100/80 border border-blue-200 transition-all group"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-10 h-10 rounded-full bg-[#1877F2] text-white flex items-center justify-center font-bold text-base shrink-0 shadow-xs">
                  f
                </div>
                <div className="min-w-0">
                  <div className="font-bold text-xs sm:text-sm text-slate-900 group-hover:text-[#1657c1] transition-colors truncate">
                    Fanpage CLB Đại sứ Sinh viên VNU-IS
                  </div>
                  <div className="text-[11px] text-slate-500 truncate">
                    Nhắn tin trực tiếp qua Messenger (Khuyên dùng - phản hồi nhanh)
                  </div>
                </div>
              </div>
              <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-[#1657c1] shrink-0 ml-2" />
            </a>

            {/* Email */}
            <a
              href="mailto:ambassadors.club@vnuis.edu.vn?subject=%5BiSSAC%20Gen%203%5D%20Y%C3%AAu%20c%E1%BA%A7u%20c%E1%BA%A5p%20l%E1%BA%A1i%20m%E1%BA%ADt%20kh%E1%BA%A9u%20%E1%BB%A9ng%20vi%C3%AAn"
              className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-all group"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Mail className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="font-bold text-xs sm:text-sm text-slate-900 group-hover:text-emerald-700 transition-colors truncate">
                    ambassadors.club@vnuis.edu.vn
                  </div>
                  <div className="text-[11px] text-slate-500 truncate">
                    Gửi email tới Hòm thư Ban Tuyển quân CLB
                  </div>
                </div>
              </div>
              <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-emerald-700 shrink-0 ml-2" />
            </a>

            {/* Hotline */}
            <div className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-amber-50 border border-amber-200/80">
              <div className="w-10 h-10 rounded-full bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                <Phone className="w-4.5 h-4.5" />
              </div>
              <div>
                <div className="font-bold text-xs text-amber-950">Hotline hỗ trợ trực ban</div>
                <div className="text-xs text-amber-800 font-semibold mt-0.5">
                  0374140705 <span className="font-normal text-amber-700">(PCN - Mr. Hiệp)</span>
                </div>
              </div>
            </div>

            {/* Syntax helper */}
            <div className="pt-2 border-t border-slate-200 space-y-2">
              <Label className="text-xs font-bold text-slate-700 block">
                Tạo nhanh nội dung tin nhắn gửi Fanpage / Email
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  type="email"
                  placeholder="Nhập email bạn đã đăng ký..."
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="text-xs h-10"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCopy}
                  className="h-10 px-3.5 text-xs font-semibold gap-1.5 shrink-0 bg-white border-blue-200 text-[#1657c1] hover:bg-blue-50"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? "Đã chép" : "Sao chép"}</span>
                </Button>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#1657c1] hover:underline"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Quay lại Đăng nhập
              </Link>

              <Link
                href="/"
                className="text-xs text-slate-500 hover:text-slate-800"
              >
                Về Trang chủ
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
