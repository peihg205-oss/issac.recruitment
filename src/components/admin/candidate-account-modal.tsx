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

  const [isEditingCurrentPass, setIsEditingCurrentPass] = useState(false)
  const [editedCurrentPass, setEditedCurrentPass] = useState("")

  const email = candidate?.profiles?.email || ""
  const fullName = candidate?.profiles?.full_name || "Ứng viên"
  const studentId = candidate?.profiles?.student_id || ""

  useEffect(() => {
    if (email) {
      const pass = getCandidatePassword(email)
      setCurrentPassword(pass)
      setEditedCurrentPass(pass)
      setIsEditingCurrentPass(false)
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

  const handleSaveEditedCurrentPassword = () => {
    if (!editedCurrentPass.trim() || editedCurrentPass.length < 6) {
      toast({
        title: "Mật khẩu không hợp lệ",
        description: "Mật khẩu phải có tối thiểu 6 ký tự.",
        variant: "destructive",
      })
      return
    }

    setCandidatePassword(email, editedCurrentPass.trim())
    setCurrentPassword(editedCurrentPass.trim())
    setIsEditingCurrentPass(false)
    toast({
      title: "✅ Đã đồng bộ mật khẩu hiện tại",
      description: `Đã cập nhật mật khẩu hoạt động cho ứng viên ${fullName}.`,
    })
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
    setEditedCurrentPass(newPassword.trim())
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
      <DialogContent className="max-w-md p-0 overflow-hidden rounded-3xl border-slate-200 shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white p-5">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-white/10 flex items-center justify-center text-amber-400 shrink-0 shadow-inner">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-base sm:text-lg font-black text-white tracking-tight">
                Quản lý Tài khoản & Mật khẩu
              </DialogTitle>
              <DialogDescription className="text-xs text-blue-200/90 mt-0.5 font-medium">
                Cấp phát, đặt lại mật khẩu và bảo mật hồ sơ ứng viên
              </DialogDescription>
            </div>
          </div>
        </div>

        <div className="p-5 sm:p-6 space-y-5 text-left text-sm max-h-[75vh] overflow-y-auto">
          {/* Candidate Dossier Info Card - Hiện TÊN ỨNG VIÊN NỔI BẬT */}
          <div className="p-4 bg-gradient-to-br from-slate-50 to-blue-50/50 rounded-2xl border border-slate-200/80 space-y-3 shadow-xs">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#1657c1] to-blue-700 text-white flex items-center justify-center font-black text-lg shadow-sm shrink-0">
                  {fullName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Ứng viên
                  </div>
                  <div className="font-black text-base text-slate-900 leading-tight">
                    {fullName}
                  </div>
                  <div className="text-xs text-slate-600 mt-0.5 flex flex-wrap items-center gap-1.5 font-medium">
                    <span>MSSV: <strong className="font-mono text-slate-800">{studentId || 'Chưa cập nhật'}</strong></span>
                    <span>•</span>
                    <span className="text-[#1657c1] font-semibold">{candidate.departments?.name || "Ban ứng tuyển"}</span>
                  </div>
                </div>
              </div>
              <Badge className="bg-blue-100 text-[#1657c1] border-blue-200 text-[10px] font-black shrink-0 px-2 py-0.5">
                Ứng viên Member
              </Badge>
            </div>

            <div className="pt-2.5 border-t border-slate-200/80 flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium">Email đăng nhập:</span>
              <span className="font-mono font-bold text-slate-900 break-all">{email}</span>
            </div>
          </div>

          {/* Current Password Section - Có chế độ xem & sửa trực tiếp */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-bold text-slate-700">
                Mật khẩu đăng nhập hiện tại
              </Label>
              <button
                type="button"
                onClick={() => {
                  if (isEditingCurrentPass) {
                    setIsEditingCurrentPass(false)
                    setEditedCurrentPass(currentPassword)
                  } else {
                    setIsEditingCurrentPass(true)
                    setEditedCurrentPass(currentPassword)
                  }
                }}
                className="text-[11px] text-[#1657c1] hover:underline font-bold"
              >
                {isEditingCurrentPass ? "Hủy chỉnh sửa" : "Sửa mật khẩu hiện tại"}
              </button>
            </div>

            {isEditingCurrentPass ? (
              <div className="space-y-2 bg-blue-50/60 p-3 rounded-xl border border-blue-200">
                <div className="text-[11px] text-slate-600">
                  Nhập mật khẩu thực tế đang dùng của ứng viên nếu muốn đồng bộ thủ công:
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    type="text"
                    value={editedCurrentPass}
                    onChange={e => setEditedCurrentPass(e.target.value)}
                    className="font-mono text-sm bg-white font-bold text-slate-900"
                    placeholder="Mật khẩu hiện tại..."
                  />
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleSaveEditedCurrentPassword}
                    className="bg-[#1657c1] hover:bg-blue-800 text-white text-xs font-bold shrink-0"
                  >
                    Lưu
                  </Button>
                </div>
              </div>
            ) : (
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
            )}
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
