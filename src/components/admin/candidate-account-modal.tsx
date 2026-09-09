"use client"

import { useState, useEffect } from "react"
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
import { Badge } from "@/components/ui/badge"
import {
  Key,
  Eye,
  EyeOff,
  Copy,
  Check,
  RotateCcw,
  Trash2,
  AlertTriangle,
  Send,
  Lock,
  User,
  ShieldCheck
} from "lucide-react"
import {
  getCandidatePassword,
  setCandidatePassword,
  deleteCandidateAccount,
  DEFAULT_CANDIDATE_PASSWORD
} from "@/lib/candidate-account-manager"
import { useToast } from "@/components/ui/use-toast"

interface CandidateAccountModalProps {
  candidate: {
    id: string
    profiles: {
      full_name: string
      email: string
      student_id?: string | null
      phone?: string | null
    }
    departments?: {
      name: string
    }
  } | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onCandidateDeleted?: (candidateId: string) => void
}

export function CandidateAccountModal({
  candidate,
  open,
  onOpenChange,
  onCandidateDeleted,
}: CandidateAccountModalProps) {
  const { toast } = useToast()
  const [currentPassword, setCurrentPassword] = useState(DEFAULT_CANDIDATE_PASSWORD)
  const [showPassword, setShowPassword] = useState(false)
  const [newPassword, setNewPassword] = useState("")
  const [copiedPass, setCopiedPass] = useState(false)
  const [copiedMsg, setCopiedMsg] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const email = candidate?.profiles?.email || ""
  const fullName = candidate?.profiles?.full_name || "Ứng viên"

  useEffect(() => {
    if (email) {
      setCurrentPassword(getCandidatePassword(email))
      setNewPassword("")
      setShowPassword(false)
      setShowDeleteConfirm(false)
    }
  }, [email, open])

  if (!candidate) return null

  const handleCopyPassword = () => {
    navigator.clipboard.writeText(currentPassword)
    setCopiedPass(true)
    toast({
      title: "Đã sao chép mật khẩu",
      description: "Mật khẩu của ứng viên đã được lưu vào bộ nhớ tạm.",
    })
    setTimeout(() => setCopiedPass(false), 2000)
  }

  const handleGenerateRandomPass = () => {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000)
    setNewPassword("iSSAC#" + randomSuffix)
  }

  const handleSaveNewPassword = () => {
    if (!newPassword.trim() || newPassword.length < 6) {
      toast({
        title: "Mật khẩu quá ngắn",
        description: "Mật khẩu mới phải có tối thiểu 6 ký tự.",
        variant: "destructive",
      })
      return
    }

    setCandidatePassword(email, newPassword.trim())
    setCurrentPassword(newPassword.trim())
    setNewPassword("")
    toast({
      title: "✅ Đã đổi mật khẩu thành công",
      description: "Mật khẩu đăng nhập mới của " + fullName + " đã được cập nhật.",
    })
  }

  const handleCopyMessageForCandidate = () => {
    const message = "Chào bạn " + fullName + ", Ban Tuyển quân CLB Đại sứ Sinh viên iSSAC đã hỗ trợ cấp lại mật khẩu đăng nhập cổng ứng viên cho bạn.\n\n• Email đăng nhập: " + email + "\n• Mật khẩu mới: " + currentPassword + "\n\nBạn vui lòng đăng nhập tại website iSSAC Recruitment để tiếp tục theo dõi tiến trình tuyển quân nhé!"
    navigator.clipboard.writeText(message)
    setCopiedMsg(true)
    toast({
      title: "Đã sao chép mẫu tin nhắn",
      description: "Bạn có thể gửi ngay nội dung này cho ứng viên qua Fanpage.",
    })
    setTimeout(() => setCopiedMsg(false), 2000)
  }

  const handleDelete = () => {
    deleteCandidateAccount(candidate.id, email)
    toast({
      title: "Đã xóa tài khoản ứng viên",
      description: "Hồ sơ và tài khoản của " + fullName + " đã được xóa khỏi hệ thống.",
    })
    setShowDeleteConfirm(false)
    onOpenChange(false)
    if (onCandidateDeleted) {
      onCandidateDeleted(candidate.id)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 overflow-hidden rounded-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-amber-400">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-white">
                Quản lý Tài khoản & Mật khẩu
              </DialogTitle>
              <DialogDescription className="text-xs text-blue-200/90 mt-0.5">
                Ứng viên: <strong>{fullName}</strong> ({candidate.departments?.name || "Ban ứng tuyển"})
              </DialogDescription>
            </div>
          </div>
        </div>

        <div className="p-5 space-y-5 text-left text-sm max-h-[75vh] overflow-y-auto">
          {/* Account info card */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                Email đăng nhập
              </span>
              <Badge className="bg-blue-100 text-[#1657c1] border-blue-200 text-[10px] font-bold">
                Ứng viên Member
              </Badge>
            </div>
            <div className="font-mono text-sm font-semibold text-slate-900 break-all">
              {email}
            </div>
          </div>

          {/* Current Password Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-bold text-slate-700">
                Mật khẩu đăng nhập hiện tại
              </Label>
              <span className="text-[11px] text-slate-500">
                (Khởi tạo/đã cấp)
              </span>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={currentPassword}
                  readOnly
                  className="font-mono text-sm bg-slate-50 font-bold text-slate-900 pr-10 border-slate-300"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  title={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCopyPassword}
                className="h-10 px-3 text-xs gap-1.5 font-semibold shrink-0"
              >
                {copiedPass ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                <span>{copiedPass ? "Đã chép" : "Copy"}</span>
              </Button>
            </div>
          </div>

          {/* Quick Copy Message to send Candidate via Page/Mail */}
          <div className="bg-blue-50/70 border border-blue-200/80 rounded-xl p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#1657c1] flex items-center gap-1.5">
                <Send className="w-3.5 h-3.5" />
                Gửi lại mật khẩu cho Ứng viên
              </span>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Nếu ứng viên liên hệ qua Fanpage để xin cấp lại mật khẩu, bạn có thể sao chép nhanh mẫu tin nhắn đã có sẵn mật khẩu này:
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCopyMessageForCandidate}
              className="w-full h-8 text-xs font-bold bg-white text-[#1657c1] hover:bg-blue-100/60 border-blue-300 gap-1.5"
            >
              {copiedMsg ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedMsg ? "Đã chép tin nhắn mẫu" : "Sao chép tin nhắn gửi qua Fanpage"}
            </Button>
          </div>

          {/* Reset / Change Password Section */}
          <div className="space-y-2.5 pt-2 border-t border-slate-200">
            <Label className="text-xs font-bold text-slate-700 block">
              Đặt lại mật khẩu mới cho ứng viên
            </Label>
            <div className="flex items-center gap-2">
              <Input
                type="text"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="Nhập mật khẩu mới..."
                className="text-sm font-mono"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleGenerateRandomPass}
                className="h-10 text-xs text-slate-600 shrink-0 gap-1"
                title="Tạo mật khẩu ngẫu nhiên"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Tạo ngẫu nhiên</span>
              </Button>
            </div>
            {newPassword && (
              <Button
                type="button"
                size="sm"
                onClick={handleSaveNewPassword}
                className="w-full bg-[#1657c1] hover:bg-blue-800 text-white text-xs font-bold mt-1"
              >
                Lưu & Cập nhật mật khẩu mới
              </Button>
            )}
          </div>

          {/* Danger Zone: Delete Candidate Account */}
          <div className="pt-3 border-t border-red-100">
            {!showDeleteConfirm ? (
              <div className="flex items-center justify-between p-3 rounded-xl bg-red-50/60 border border-red-200/80">
                <div>
                  <div className="font-bold text-xs text-red-900">Xóa tài khoản ứng viên</div>
                  <div className="text-[11px] text-red-700/80">Xóa toàn bộ hồ sơ ứng tuyển & tài khoản</div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="h-8 text-xs font-bold text-red-600 border-red-300 hover:bg-red-100"
                >
                  <Trash2 className="w-3.5 h-3.5 mr-1" />
                  Xóa tài khoản
                </Button>
              </div>
            ) : (
              <div className="p-3.5 rounded-xl bg-red-100 border border-red-300 text-red-950 space-y-2.5 animate-in fade-in">
                <div className="flex items-center gap-2 font-black text-xs text-red-900">
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                  Xác nhận xóa tài khoản của {fullName}?
                </div>
                <p className="text-[11px] text-red-800 leading-relaxed">
                  Hồ sơ ứng tuyển, điểm phỏng vấn và tài khoản của ứng viên này sẽ bị xóa khỏi hệ thống.
                </p>
                <div className="flex items-center justify-end gap-2 pt-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowDeleteConfirm(false)}
                    className="h-7 text-xs bg-white text-slate-700"
                  >
                    Hủy
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleDelete}
                    className="h-7 text-xs font-bold bg-red-600 hover:bg-red-700 text-white"
                  >
                    Đồng ý xóa vĩnh viễn
                  </Button>
                </div>
              </div>
            )}
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
