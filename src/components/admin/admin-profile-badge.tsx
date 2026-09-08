"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
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
  Crown,
  Megaphone,
  MessageSquare,
  Users,
  CheckCircle2,
  Clock,
  Edit3,
  ShieldCheck,
  AlertCircle,
  XCircle,
  Check,
  Sparkles,
  Inbox,
  ArrowRight,
  ShieldAlert
} from "lucide-react"
import {
  type AdminRoleType,
  EVALUATOR_ACCOUNTS,
  ADMIN_ROLE_CONFIGS
} from "@/lib/permissions"
import {
  getAdminAccounts,
  getAdminRequests,
  updateAccountDirectly,
  submitChangeRequest,
  cancelChangeRequest,
  approveChangeRequest,
  rejectChangeRequest,
  type AdminAccountInfo,
  type AdminChangeRequest
} from "@/lib/admin-account-manager"

interface AdminProfileBadgeProps {
  role: AdminRoleType
  initialName: string
  initialTitle: string
  initialAvatarInitial: string
}

export function AdminProfileBadge({
  role,
  initialName,
  initialTitle,
  initialAvatarInitial,
}: AdminProfileBadgeProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<"self" | "approvals" | "all">("self")

  // State
  const [accounts, setAccounts] = useState<Record<AdminRoleType, AdminAccountInfo> | null>(null)
  const [requests, setRequests] = useState<AdminChangeRequest[]>([])
  const [nameInput, setNameInput] = useState(initialName)
  const [titleInput, setTitleInput] = useState(initialTitle)

  // Direct edit for other departments (BCN power)
  const [selectedDeptToEdit, setSelectedDeptToEdit] = useState<AdminRoleType>("truyen-thong")
  const [deptNameInput, setDeptNameInput] = useState("")
  const [deptTitleInput, setDeptTitleInput] = useState("")

  const [feedbackMsg, setFeedbackMsg] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null)

  const isBCN = role === "chu-nhiem"

  // Load latest data on mount
  const refreshData = () => {
    const accs = getAdminAccounts()
    const reqs = getAdminRequests()
    setAccounts(accs)
    setRequests(reqs)

    const currentAcc = accs[role]
    if (currentAcc) {
      setNameInput(currentAcc.name)
      setTitleInput(currentAcc.title)
    }

    if (accs[selectedDeptToEdit]) {
      setDeptNameInput(accs[selectedDeptToEdit].name)
      setDeptTitleInput(accs[selectedDeptToEdit].title)
    }
  }

  useEffect(() => {
    refreshData()
  }, [role, selectedDeptToEdit])

  // Current display data
  const currentAcc = accounts ? accounts[role] : {
    name: initialName,
    title: initialTitle,
    avatarInitial: initialAvatarInitial,
    email: EVALUATOR_ACCOUNTS[role]?.email || "",
  }

  // Pending request for this account
  const myPendingRequest = requests.find(r => r.role === role && r.status === "pending")
  // All pending requests (for BCN)
  const pendingRequests = requests.filter(r => r.status === "pending")

  const getRoleIcon = (roleKey: AdminRoleType) => {
    switch (roleKey) {
      case "chu-nhiem":
        return <Crown className="w-3.5 h-3.5 text-amber-600 shrink-0" />
      case "truyen-thong":
        return <Megaphone className="w-3.5 h-3.5 text-blue-600 shrink-0" />
      case "tu-van":
        return <MessageSquare className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
      case "nhan-su":
        return <Users className="w-3.5 h-3.5 text-purple-600 shrink-0" />
      default:
        return <Crown className="w-3.5 h-3.5 text-amber-600 shrink-0" />
    }
  }

  // Handle self-save (BCN direct update)
  const handleSaveSelf = () => {
    if (!nameInput.trim()) {
      setFeedbackMsg({ type: "error", text: "Vui lòng nhập họ và tên hiển thị." })
      return
    }
    if (!titleInput.trim()) {
      setFeedbackMsg({ type: "error", text: "Vui lòng nhập chức vụ hiển thị." })
      return
    }

    if (isBCN) {
      // Ban Chủ nhiệm directly saves
      updateAccountDirectly(role, nameInput, titleInput)
      refreshData()
      setFeedbackMsg({
        type: "success",
        text: "✅ Ban Chủ nhiệm: Đã cập nhật Tên và Chức vụ thành công ngay lập tức!",
      })
      setTimeout(() => {
        router.refresh()
      }, 500)
    } else {
      // Department Admin submits request to BCN
      submitChangeRequest(role, nameInput, titleInput)
      refreshData()
      setFeedbackMsg({
        type: "info",
        text: "📨 Đã gửi yêu cầu đổi tên & chức vụ tới Ban Chủ nhiệm. Vui lòng chờ phê duyệt!",
      })
    }
  }

  // Handle BCN direct edit for another department
  const handleSaveOtherDept = () => {
    if (!deptNameInput.trim() || !deptTitleInput.trim()) {
      setFeedbackMsg({ type: "error", text: "Vui lòng nhập đầy đủ tên và chức vụ cho Ban được chọn." })
      return
    }

    updateAccountDirectly(selectedDeptToEdit, deptNameInput, deptTitleInput)
    refreshData()
    setFeedbackMsg({
      type: "success",
      text: "✅ Đã trực tiếp cập nhật thông tin người đại diện " + EVALUATOR_ACCOUNTS[selectedDeptToEdit].departmentName + "!",
    })
    setTimeout(() => {
      router.refresh()
    }, 500)
  }

  // Handle BCN approve
  const handleApprove = (reqId: string) => {
    approveChangeRequest(reqId)
    refreshData()
    setFeedbackMsg({
      type: "success",
      text: "✅ Đã phê duyệt yêu cầu thành công! Thông tin tài khoản đã được cập nhật.",
    })
    setTimeout(() => {
      router.refresh()
    }, 500)
  }

  // Handle BCN reject
  const handleReject = (reqId: string) => {
    rejectChangeRequest(reqId)
    refreshData()
    setFeedbackMsg({
      type: "info",
      text: "Đã từ chối yêu cầu thay đổi thông tin.",
    })
  }

  // Handle cancel own request
  const handleCancelRequest = (reqId: string) => {
    cancelChangeRequest(reqId)
    refreshData()
    setFeedbackMsg({
      type: "info",
      text: "Đã hủy yêu cầu thay đổi thông tin.",
    })
  }

  return (
    <>
      {/* Clickable Header Badge */}
      <div
        onClick={() => {
          setOpen(true)
          setFeedbackMsg(null)
          refreshData()
        }}
        className="relative flex items-center gap-3 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-50/90 to-amber-100/60 hover:from-amber-100/90 hover:to-amber-200/60 border border-amber-200/90 cursor-pointer transition-all shadow-2xs hover:shadow-xs group select-none"
        title="Nhấp để thay đổi Tên & Chức vụ"
      >
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#1657c1] to-blue-800 flex items-center justify-center text-white font-black text-xs shadow-xs shrink-0 group-hover:scale-105 transition-transform">
          {currentAcc.avatarInitial}
        </div>
        <div className="text-left min-w-0 pr-1">
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-slate-900 text-xs sm:text-sm truncate leading-tight group-hover:text-[#1657c1] transition-colors">
              {currentAcc.name}
            </span>
            <Edit3 className="w-3 h-3 text-slate-400 group-hover:text-[#1657c1] transition-colors shrink-0" />
          </div>
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-amber-800 truncate leading-tight mt-0.5">
            {getRoleIcon(role)}
            <span>{currentAcc.title}</span>
          </div>
        </div>

        {/* Pending Request Indicator for Department Admin */}
        {!isBCN && myPendingRequest && (
          <span className="absolute -top-1.5 -right-1.5 flex h-3.5 w-3.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-amber-500 border border-white"></span>
          </span>
        )}

        {/* Pending Approvals Badge for BCN */}
        {isBCN && pendingRequests.length > 0 && (
          <span className="absolute -top-2 -right-2 px-1.5 py-0.5 rounded-full text-[9px] font-black bg-red-500 text-white border-2 border-white shadow-xs animate-bounce">
            {pendingRequests.length}
          </span>
        )}
      </div>

      {/* Edit & Approval Dialog Modal */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg p-0 overflow-hidden rounded-2xl">
          {/* Header */}
          <div className="bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white p-5 border-b border-white/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-amber-400">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <DialogTitle className="text-base font-black text-white">
                    Thông tin & Chức vụ Quản trị viên
                  </DialogTitle>
                  <DialogDescription className="text-xs text-blue-200/80 mt-0.5">
                    {EVALUATOR_ACCOUNTS[role]?.departmentName || "Ban chuyên môn"} - Cổng Quản trị Tuyển quân
                  </DialogDescription>
                </div>
              </div>
            </div>

            {/* Tabs Navigation */}
            <div className="flex items-center gap-2 mt-4 pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={() => { setActiveTab("self"); setFeedbackMsg(null) }}
                className={"px-3 py-1.5 rounded-lg text-xs font-bold transition-all " + (
                  activeTab === "self"
                    ? "bg-amber-400 text-slate-950 shadow-sm"
                    : "text-blue-200 hover:text-white hover:bg-white/10"
                )}
              >
                Thông tin của bạn
              </button>

              {isBCN && (
                <>
                  <button
                    type="button"
                    onClick={() => { setActiveTab("approvals"); setFeedbackMsg(null) }}
                    className={"relative px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 " + (
                      activeTab === "approvals"
                        ? "bg-amber-400 text-slate-950 shadow-sm"
                        : "text-blue-200 hover:text-white hover:bg-white/10"
                    )}
                  >
                    <span>Duyệt yêu cầu</span>
                    {pendingRequests.length > 0 && (
                      <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-red-500 text-white">
                        {pendingRequests.length}
                      </span>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => { setActiveTab("all"); setFeedbackMsg(null) }}
                    className={"px-3 py-1.5 rounded-lg text-xs font-bold transition-all " + (
                      activeTab === "all"
                        ? "bg-amber-400 text-slate-950 shadow-sm"
                        : "text-blue-200 hover:text-white hover:bg-white/10"
                    )}
                  >
                    Quản lý các Ban
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto text-left">
            {/* Feedback Message */}
            {feedbackMsg && (
              <div
                className={"p-3 rounded-xl text-xs font-medium flex items-center gap-2 animate-in fade-in " + (
                  feedbackMsg.type === "success"
                    ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                    : feedbackMsg.type === "error"
                    ? "bg-red-50 text-red-800 border border-red-200"
                    : "bg-blue-50 text-blue-800 border border-blue-200"
                )}
              >
                {feedbackMsg.type === "success" && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
                {feedbackMsg.type === "error" && <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />}
                {feedbackMsg.type === "info" && <Clock className="w-4 h-4 text-blue-600 shrink-0" />}
                <span>{feedbackMsg.text}</span>
              </div>
            )}

            {/* TAB 1: SELF PROFILE EDIT */}
            {activeTab === "self" && (
              <div className="space-y-4">
                {/* Role Permission Badge Alert */}
                {isBCN ? (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 flex items-start gap-3">
                    <Crown className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div className="text-xs text-emerald-900 leading-relaxed">
                      <strong className="text-emerald-950 font-bold block mb-0.5">
                        Tài khoản Ban Chủ nhiệm (Toàn quyền)
                      </strong>
                      Bạn có quyền thay đổi tên và chức vụ của mình <strong>ngay lập tức không cần xét duyệt</strong>.
                    </div>
                  </div>
                ) : (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 flex items-start gap-3">
                    <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div className="text-xs text-amber-900 leading-relaxed">
                      <strong className="text-amber-950 font-bold block mb-0.5">
                        Tài khoản Ban chuyên môn ({EVALUATOR_ACCOUNTS[role]?.departmentName})
                      </strong>
                      Thay đổi tên và chức vụ sẽ được chuyển đến <strong>Ban Chủ nhiệm phê duyệt</strong> trước khi áp dụng chính thức vào hệ thống.
                    </div>
                  </div>
                )}

                {/* Form Fields */}
                <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200/80">
                  <div>
                    <Label className="text-xs font-bold text-slate-700 block mb-1.5">
                      Họ và tên người đại diện / Giám khảo
                    </Label>
                    <Input
                      value={nameInput}
                      onChange={e => setNameInput(e.target.value)}
                      placeholder="VD: Trần Phương Linh..."
                      className="text-sm bg-white font-medium"
                    />
                  </div>

                  <div>
                    <Label className="text-xs font-bold text-slate-700 block mb-1.5">
                      Chức vụ đảm nhiệm
                    </Label>
                    <Input
                      value={titleInput}
                      onChange={e => setTitleInput(e.target.value)}
                      placeholder="VD: Chủ nhiệm CLB iSSAC, Trưởng Ban, Phó Ban..."
                      className="text-sm bg-white font-medium"
                    />
                  </div>
                </div>

                {/* Status for Department Admin */}
                {!isBCN && myPendingRequest && (
                  <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-900 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold flex items-center gap-1.5 text-blue-950">
                        <Clock className="w-3.5 h-3.5 text-blue-600" />
                        Đang có 1 yêu cầu chờ BCN duyệt
                      </span>
                      <Badge className="bg-amber-100 text-amber-800 border-amber-200 text-[10px] font-bold">
                        Chờ duyệt
                      </Badge>
                    </div>
                    <div className="text-[11px] text-slate-600 bg-white/80 p-2.5 rounded-lg border border-blue-100">
                      Đổi thành: <strong>{myPendingRequest.requestedName}</strong> - <span>{myPendingRequest.requestedTitle}</span>
                    </div>
                    <div className="flex justify-end pt-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCancelRequest(myPendingRequest.id)}
                        className="h-7 text-xs text-red-600 hover:bg-red-50 hover:text-red-700"
                      >
                        Hủy yêu cầu này
                      </Button>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-end gap-2 pt-2">
                  <Button variant="outline" onClick={() => setOpen(false)} className="text-xs">
                    Đóng
                  </Button>
                  <Button
                    onClick={handleSaveSelf}
                    className={"text-xs font-bold gap-1.5 " + (
                      isBCN
                        ? "bg-[#1657c1] hover:bg-blue-800 text-white"
                        : "bg-amber-500 hover:bg-amber-600 text-slate-950"
                    )}
                  >
                    {isBCN ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        Lưu thay đổi ngay
                      </>
                    ) : (
                      <>
                        <Clock className="w-3.5 h-3.5" />
                        Gửi yêu cầu tới BCN
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}

            {/* TAB 2: BCN APPROVALS LIST */}
            {isBCN && activeTab === "approvals" && (
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-1">
                  <span className="text-xs font-bold text-slate-700">
                    Danh sách yêu cầu chờ Ban Chủ nhiệm duyệt ({pendingRequests.length})
                  </span>
                </div>

                {pendingRequests.length === 0 ? (
                  <div className="py-8 text-center text-slate-400 text-xs">
                    <Inbox className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    Hiện không có yêu cầu thay đổi tên & chức vụ nào đang chờ duyệt.
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {pendingRequests.map(req => (
                      <div
                        key={req.id}
                        className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs hover:border-blue-200 transition-all space-y-2.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                            {getRoleIcon(req.role)}
                            {req.departmentName}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {new Date(req.requestedAt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                          <div>
                            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Hiện tại</span>
                            <div className="font-semibold text-slate-700 truncate">{req.currentName}</div>
                            <div className="text-[11px] text-slate-500 truncate">{req.currentTitle}</div>
                          </div>
                          <div className="border-l border-slate-200 pl-2.5">
                            <span className="text-[10px] uppercase font-bold text-amber-700 block mb-0.5">Yêu cầu đổi sang</span>
                            <div className="font-bold text-blue-900 truncate">{req.requestedName}</div>
                            <div className="text-[11px] font-semibold text-blue-700 truncate">{req.requestedTitle}</div>
                          </div>
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleReject(req.id)}
                            className="h-8 text-xs text-red-600 hover:bg-red-50 hover:text-red-700"
                          >
                            <XCircle className="w-3.5 h-3.5 mr-1" />
                            Từ chối
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleApprove(req.id)}
                            className="h-8 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white"
                          >
                            <Check className="w-3.5 h-3.5 mr-1" />
                            Phê duyệt ngay
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: BCN MANAGE ALL DEPARTMENTS DIRECTLY */}
            {isBCN && activeTab === "all" && (
              <div className="space-y-4">
                <div className="text-xs text-slate-600 bg-blue-50/70 p-3 rounded-xl border border-blue-200/70 leading-relaxed">
                  Là Ban Chủ nhiệm, bạn có thể <strong>chỉnh sửa trực tiếp</strong> tên và chức vụ của bất kỳ Ban nào mà không cần gửi yêu cầu phê duyệt.
                </div>

                <div>
                  <Label className="text-xs font-bold text-slate-700 block mb-1.5">
                    Chọn Ban chuyên môn cần sửa
                  </Label>
                  <div className="grid grid-cols-3 gap-2">
                    {(["truyen-thong", "tu-van", "nhan-su"] as AdminRoleType[]).map(deptKey => {
                      const isSel = selectedDeptToEdit === deptKey
                      return (
                        <button
                          key={deptKey}
                          type="button"
                          onClick={() => {
                            setSelectedDeptToEdit(deptKey)
                            if (accounts && accounts[deptKey]) {
                              setDeptNameInput(accounts[deptKey].name)
                              setDeptTitleInput(accounts[deptKey].title)
                            }
                          }}
                          className={"p-2 rounded-xl text-xs font-bold border transition-all flex flex-col items-center gap-1 " + (
                            isSel
                              ? "bg-blue-50 border-[#1657c1] text-[#1657c1] shadow-2xs"
                              : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                          )}
                        >
                          {getRoleIcon(deptKey)}
                          <span className="truncate">{EVALUATOR_ACCOUNTS[deptKey]?.departmentName}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200/80">
                  <div>
                    <Label className="text-xs font-bold text-slate-700 block mb-1.5">
                      Họ và tên người đại diện ({EVALUATOR_ACCOUNTS[selectedDeptToEdit]?.departmentName})
                    </Label>
                    <Input
                      value={deptNameInput}
                      onChange={e => setDeptNameInput(e.target.value)}
                      placeholder="VD: Nguyễn Văn A..."
                      className="text-sm bg-white font-medium"
                    />
                  </div>

                  <div>
                    <Label className="text-xs font-bold text-slate-700 block mb-1.5">
                      Chức vụ đảm nhiệm
                    </Label>
                    <Input
                      value={deptTitleInput}
                      onChange={e => setDeptTitleInput(e.target.value)}
                      placeholder="VD: Trưởng Ban Truyền thông..."
                      className="text-sm bg-white font-medium"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-1">
                  <Button
                    onClick={handleSaveOtherDept}
                    className="text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
                  >
                    <Check className="w-3.5 h-3.5" />
                    Cập nhật cho Ban này
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
