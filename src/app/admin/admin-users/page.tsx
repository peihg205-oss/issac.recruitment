"use client"
import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useToast } from "@/components/ui/use-toast"
import {
  ShieldCheck, Users, Crown, Megaphone, MessageSquare,
  Plus, Key, Lock, CheckCircle2, AlertCircle, Loader2, Trash2,
  Clock, Check, XCircle, Eye, EyeOff, Edit3
} from "lucide-react"
import {
  getAdminAccounts,
  getAdminRequests,
  approveChangeRequest,
  rejectChangeRequest,
  type AdminChangeRequest
} from "@/lib/admin-account-manager"
import { ADMIN_ROLE_CONFIGS, type AdminRoleType } from "@/lib/permissions"

interface AdminUser {
  id: string
  full_name: string
  title?: string
  email: string
  password?: string
  role: string
  admin_role: "chu-nhiem" | "truyen-thong" | "tu-van" | "nhan-su"
  is_active: boolean
  is_fixed?: boolean
  created_at: string
}

const DEPT_INFO = {
  "chu-nhiem": {
    name: "Ban Chủ nhiệm",
    desc: "Toàn quyền quản lý hệ thống, phê duyệt kết quả trúng tuyển và chấm điểm cả 3 ban",
    color: "bg-amber-50 text-amber-900 border-amber-300",
    icon: Crown,
  },
  "truyen-thong": {
    name: "Ban Truyền thông",
    desc: "Chỉ chấm điểm và đặt câu hỏi cho ứng viên Ban Truyền thông",
    color: "bg-blue-50 text-blue-900 border-blue-300",
    icon: Megaphone,
  },
  "tu-van": {
    name: "Ban Tư vấn",
    desc: "Chỉ chấm điểm và đặt câu hỏi cho ứng viên Ban Tư vấn",
    color: "bg-emerald-50 text-emerald-900 border-emerald-300",
    icon: MessageSquare,
  },
  "nhan-su": {
    name: "Ban Nhân sự",
    desc: "Chỉ chấm điểm và đặt câu hỏi cho ứng viên Ban Nhân sự",
    color: "bg-purple-50 text-purple-900 border-purple-300",
    icon: Users,
  },
}

const INITIAL_ACCOUNTS: AdminUser[] = [
  {
    id: "adm-fixed-master",
    full_name: "Ban Chủ nhiệm CLB iSSAC",
    title: "Chủ nhiệm CLB iSSAC",
    email: "ambassadors.club@vnuis.edu.vn",
    password: "ISSAC2026@tuyenquan",
    role: "super_admin",
    admin_role: "chu-nhiem",
    is_active: true,
    is_fixed: true,
    created_at: "2026-09-01",
  },
  {
    id: "adm-1",
    full_name: "Ban Chủ nhiệm (Dự phòng)",
    title: "Phó Chủ nhiệm CLB",
    email: "bcn@issac.vnu.edu.vn",
    password: "ISSAC2026@tuyenquan",
    role: "super_admin",
    admin_role: "chu-nhiem",
    is_active: true,
    created_at: "2026-08-15",
  },
  {
    id: "adm-2",
    full_name: "Giám khảo Ban Truyền thông",
    title: "Phó Ban Truyền thông",
    email: "truyenthong@issac.vnu.edu.vn",
    role: "admin",
    admin_role: "truyen-thong",
    is_active: true,
    created_at: "2026-08-20",
  },
  {
    id: "adm-3",
    full_name: "Giám khảo Ban Tư vấn",
    title: "Trưởng Ban Tư vấn",
    email: "tuvan@issac.vnu.edu.vn",
    role: "admin",
    admin_role: "tu-van",
    is_active: true,
    created_at: "2026-08-20",
  },
  {
    id: "adm-4",
    full_name: "Giám khảo Ban Nhân sự",
    title: "Trưởng Ban Nhân sự",
    email: "nhansu@issac.vnu.edu.vn",
    role: "admin",
    admin_role: "nhan-su",
    is_active: true,
    created_at: "2026-08-20",
  },
]

export default function AdminUsersPage() {
  const { toast } = useToast()
  const router = useRouter()

  const [activeRole, setActiveRole] = useState<AdminRoleType>('chu-nhiem')
  const [roleChecked, setRoleChecked] = useState(false)
  const [admins, setAdmins] = useState<AdminUser[]>(INITIAL_ACCOUNTS)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedAdminForEdit, setSelectedAdminForEdit] = useState<AdminUser | null>(null)
  const [editForm, setEditForm] = useState({
    full_name: "",
    title: "",
    admin_role: "tu-van" as "chu-nhiem" | "truyen-thong" | "tu-van" | "nhan-su",
    password: "",
  })
  const [showResetModal, setShowResetModal] = useState(false)
  const [selectedAdminForReset, setSelectedAdminForReset] = useState<AdminUser | null>(null)
  const [newPasswordInput, setNewPasswordInput] = useState("")
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({})
  const [saving, setSaving] = useState(false)
  const [changeRequests, setChangeRequests] = useState<AdminChangeRequest[]>([])

  // Form tạo tài khoản mới
  const [form, setForm] = useState({
    full_name: "",
    title: "",
    email: "",
    password: "",
    admin_role: "truyen-thong" as "chu-nhiem" | "truyen-thong" | "tu-van" | "nhan-su",
  })

  const loadRequests = useCallback(() => {
    setChangeRequests(getAdminRequests())
  }, [])

  const loadAllAdmins = useCallback(async () => {
    let list = [...INITIAL_ACCOUNTS]
    const emailMap = new Map<string, AdminUser>()
    list.forEach(a => emailMap.set(a.email.toLowerCase(), a))

    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("issac_created_admins")
      if (saved) {
        try {
          const parsed = JSON.parse(saved)
          if (Array.isArray(parsed)) {
            parsed.forEach(p => {
              if (p.email) emailMap.set(p.email.toLowerCase(), p)
            })
          }
        } catch {}
      }
    }

    try {
      const supabase = createClient()
      const { data: dbAdmins } = await supabase
        .from("profiles")
        .select("id, email, full_name, role, admin_role, is_active, high_school, created_at")
        .in("role", ["admin", "super_admin"])

      if (dbAdmins && dbAdmins.length > 0) {
        dbAdmins.forEach(p => {
          if (!p.email) return
          const emLower = p.email.toLowerCase()
          const existing = emailMap.get(emLower)

          // Tránh để chuỗi mặc định cũ "Cán bộ Tuyển quân (...)" ghi đè tên đã được BCN chỉ định
          const isGenericDefault = p.full_name?.startsWith("Cán bộ Tuyển quân (")
          const resolvedName = (existing?.full_name && !existing.full_name.startsWith("Cán bộ Tuyển quân ("))
            ? existing.full_name
            : (!isGenericDefault && p.full_name ? p.full_name : (existing?.full_name || p.full_name || p.email))

          const resolvedTitle = p.high_school || existing?.title || ""

          if (existing) {
            emailMap.set(emLower, {
              ...existing,
              id: p.id || existing.id,
              full_name: resolvedName,
              title: resolvedTitle || existing.title,
              role: p.role || existing.role,
              admin_role: (p.admin_role as any) || existing.admin_role,
              is_active: p.is_active !== undefined ? p.is_active : existing.is_active,
            })
          } else {
            emailMap.set(emLower, {
              id: p.id,
              full_name: resolvedName,
              title: resolvedTitle,
              email: p.email,
              role: p.role,
              admin_role: (p.admin_role as any) || "truyen-thong",
              is_active: p.is_active !== false,
              created_at: p.created_at ? p.created_at.slice(0, 10) : new Date().toISOString().slice(0, 10)
            })
          }
        })
      }
    } catch {}

    setAdmins(Array.from(emailMap.values()))
  }, [])

  useEffect(() => {
    const match = document.cookie.match(/issac_admin_role=([^;]+)/)
    const role = (match && match[1] in ADMIN_ROLE_CONFIGS) ? (match[1] as AdminRoleType) : 'chu-nhiem'
    setActiveRole(role)
    setRoleChecked(true)
  }, [])

  useEffect(() => {
    loadRequests()
  }, [loadRequests])

  useEffect(() => {
    loadAllAdmins()
  }, [loadAllAdmins])

  // Chặn truy cập nếu không phải Ban Chủ nhiệm (sau khi tất cả React hooks đã được gọi)
  if (roleChecked && activeRole !== 'chu-nhiem') {
    return (
      <div className="min-h-[500px] flex flex-col items-center justify-center text-center p-6 space-y-4 animate-fade-in">
        <div className="w-16 h-16 rounded-3xl bg-amber-100 text-amber-700 flex items-center justify-center shadow-xs">
          <AlertCircle className="w-8 h-8" />
        </div>
        <div className="space-y-1.5">
          <h2 className="text-xl sm:text-2xl font-black text-slate-900">Giới hạn quyền quản trị Ban Chủ nhiệm</h2>
          <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
            Chức năng <strong>Cấp tài khoản Ban</strong> và quản trị mật khẩu chỉ dành riêng cho Ban Chủ nhiệm CLB iSSAC. Bạn đang đăng nhập với tư cách Ban chuyên môn.
          </p>
        </div>
        <Link href="/admin/dashboard">
          <Button className="bg-[#1559c5] hover:bg-blue-800 text-white font-bold rounded-xl text-xs h-10 px-5 shadow-sm">
            Quay về Dashboard
          </Button>
        </Link>
      </div>
    )
  }

  const handleApproveReq = (id: string) => {
    approveChangeRequest(id)
    loadRequests()
    toast({
      title: "✅ Đã phê duyệt yêu cầu",
      description: "Tên và chức vụ của Ban đã được cập nhật thành công.",
    })
  }

  const handleRejectReq = (id: string) => {
    rejectChangeRequest(id)
    loadRequests()
    toast({
      title: "Đã từ chối yêu cầu",
      description: "Yêu cầu thay đổi thông tin đã bị từ chối.",
    })
  }

  const handleCreateAccount = async () => {
    if (!form.full_name || !form.email || !form.password) {
      toast({ title: "Vui lòng điền đầy đủ thông tin tài khoản", variant: "destructive" })
      return
    }

    setSaving(true)
    const emailClean = form.email.trim().toLowerCase()
    const passClean = form.password.trim()
    const nameClean = form.full_name.trim()
    const titleClean = form.title.trim() || (form.admin_role === "chu-nhiem" ? "Phó Chủ nhiệm CLB" : `Cán bộ Tuyển quân · ${DEPT_INFO[form.admin_role].name}`)
    const roleClean = form.admin_role === "chu-nhiem" ? "super_admin" : "admin"

    // 1. Đồng bộ tài khoản lên Supabase Auth & Database để đăng nhập được trên Điện thoại và mọi thiết bị
    try {
      const tempSupabase = createClient()
      
      // Update trực tiếp vào profiles để DB nhận ngay tên & chức vụ được BCN assign
      await tempSupabase.from("profiles").update({
        full_name: nameClean,
        high_school: titleClean,
        role: roleClean,
        admin_role: form.admin_role,
        is_active: true
      }).ilike("email", emailClean)

      // Thử đăng ký Supabase Auth
      await tempSupabase.auth.signUp({
        email: emailClean,
        password: passClean,
        options: {
          data: {
            full_name: nameClean,
            title: titleClean,
            role: roleClean,
            admin_role: form.admin_role,
          }
        }
      })
    } catch (e) {
      console.warn("Supabase auth sync notice:", e)
    }

    // 2. Lưu vào state và LocalStorage
    const newAdmin: AdminUser = {
      id: `adm-${Date.now()}`,
      full_name: nameClean,
      title: titleClean,
      email: emailClean,
      password: passClean,
      role: roleClean,
      admin_role: form.admin_role,
      is_active: true,
      created_at: new Date().toISOString().slice(0, 10),
    }

    setAdmins(prev => {
      const filtered = prev.filter(a => a.email.toLowerCase() !== emailClean)
      const updated = [...filtered, newAdmin]
      if (typeof window !== "undefined") {
        localStorage.setItem("issac_created_admins", JSON.stringify(updated))
        document.cookie = "issac_created_admins=" + encodeURIComponent(JSON.stringify(updated)) + "; path=/; max-age=2592000; SameSite=Lax"
      }
      return updated
    })

    setSaving(false)
    setShowCreateModal(false)
    setForm({ full_name: "", title: "", email: "", password: "", admin_role: "truyen-thong" })

    toast({
      title: "✅ Đã cấp tài khoản thành công",
      description: `Đã cấp quyền cho ${nameClean} (${titleClean} - ${DEPT_INFO[form.admin_role].name}). Tài khoản đã sẵn sàng đăng nhập trên mọi thiết bị (Điện thoại & Máy tính).`,
      variant: "success",
    } as Parameters<typeof toast>[0])
  }

  const handleOpenEditModal = (admin: AdminUser) => {
    setSelectedAdminForEdit(admin)
    setEditForm({
      full_name: admin.full_name,
      title: admin.title || "",
      admin_role: admin.admin_role,
      password: admin.password || "",
    })
    setShowEditModal(true)
  }

  const handleSaveEditAdmin = async () => {
    if (!selectedAdminForEdit) return
    if (!editForm.full_name.trim()) {
      toast({ title: "Vui lòng nhập họ và tên cán bộ", variant: "destructive" })
      return
    }

    setSaving(true)
    const nameClean = editForm.full_name.trim()
    const titleClean = editForm.title.trim() || (editForm.admin_role === "chu-nhiem" ? "Phó Chủ nhiệm CLB" : `Cán bộ Tuyển quân · ${DEPT_INFO[editForm.admin_role].name}`)
    const roleClean = editForm.admin_role === "chu-nhiem" ? "super_admin" : "admin"
    const passClean = editForm.password.trim()

    // 1. Cập nhật trực tiếp vào Supabase Database
    try {
      const supabase = createClient()
      await supabase.from("profiles").update({
        full_name: nameClean,
        high_school: titleClean,
        role: roleClean,
        admin_role: editForm.admin_role,
        is_active: true
      }).ilike("email", selectedAdminForEdit.email)
    } catch (e) {
      console.warn("Update profile error:", e)
    }

    // 2. Cập nhật state & LocalStorage
    setAdmins(prev => {
      const updated = prev.map(a => {
        if (a.id === selectedAdminForEdit.id || a.email.toLowerCase() === selectedAdminForEdit.email.toLowerCase()) {
          return {
            ...a,
            full_name: nameClean,
            title: titleClean,
            admin_role: editForm.admin_role,
            role: roleClean,
            ...(passClean ? { password: passClean } : {})
          }
        }
        return a
      })
      if (typeof window !== "undefined") {
        localStorage.setItem("issac_created_admins", JSON.stringify(updated))
        document.cookie = "issac_created_admins=" + encodeURIComponent(JSON.stringify(updated)) + "; path=/; max-age=2592000; SameSite=Lax"
      }
      return updated
    })

    setSaving(false)
    setShowEditModal(false)
    toast({
      title: "✅ Đã cập nhật thành công",
      description: `Đã lưu thông tin cho ${nameClean} (${titleClean} - ${DEPT_INFO[editForm.admin_role].name}).`,
      variant: "success",
    } as Parameters<typeof toast>[0])
  }

  const handleToggleStatus = (id: string) => {
    setAdmins(prev => {
      const updated = prev.map(a => {
        if (a.id === id) {
          if (a.is_fixed) {
            toast({
              title: "Tài khoản cố định",
              description: "Tài khoản này là tài khoản master cố định của hệ thống, không thể khoá.",
              variant: "destructive"
            })
            return a
          }
          return { ...a, is_active: !a.is_active }
        }
        return a
      })
      if (typeof window !== "undefined") {
        localStorage.setItem("issac_created_admins", JSON.stringify(updated))
      }
      return updated
    })
  }

  const handleDeleteAccount = (id: string) => {
    setAdmins(prev => {
      const updated = prev.filter(a => a.id !== id)
      if (typeof window !== "undefined") {
        localStorage.setItem("issac_created_admins", JSON.stringify(updated))
        document.cookie = "issac_created_admins=" + encodeURIComponent(JSON.stringify(updated)) + "; path=/; max-age=2592000; SameSite=Lax"
      }
      return updated
    })
    toast({
      title: "Đã xóa tài khoản",
      description: "Tài khoản này đã bị loại bỏ khỏi hệ thống tuyển quân.",
    })
  }

  const handleOpenResetModal = (admin: AdminUser) => {
    setSelectedAdminForReset(admin)
    setNewPasswordInput(admin.password || "")
    setShowResetModal(true)
  }

  const handleSaveResetPassword = () => {
    if (!selectedAdminForReset || !newPasswordInput.trim()) return
    const updatedPass = newPasswordInput.trim()

    setAdmins(prev => {
      const updated = prev.map(a => {
        if (a.id === selectedAdminForReset.id) {
          return { ...a, password: updatedPass }
        }
        return a
      })
      if (typeof window !== "undefined") {
        localStorage.setItem("issac_created_admins", JSON.stringify(updated))
      }
      return updated
    })

    setShowResetModal(false)
    toast({
      title: "✅ Đã cập nhật mật khẩu",
      description: `Mật khẩu mới cho tài khoản ${selectedAdminForReset.email} đã được lưu thành công.`,
      variant: "success"
    } as Parameters<typeof toast>[0])
  }

  const toggleShowPassword = (id: string) => {
    setShowPasswords(prev => ({ ...prev, [id]: !prev[id] }))
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-gray-900 flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-blue-600" />
            Quản trị Tài khoản Ban Tuyển Quân
          </h1>
          <p className="text-gray-500 text-xs sm:text-sm mt-1">
            Ban Chủ nhiệm có toàn quyền cấp tài khoản, đổi mật khẩu và phân quyền cho Ban Chủ nhiệm và các Ban chuyên môn.
          </p>
        </div>

        <Button onClick={() => setShowCreateModal(true)} variant="gold" className="gap-2 font-bold shadow-xs">
          <Plus className="w-4 h-4" />
          Cấp tài khoản mới
        </Button>
      </div>

      {/* Thông báo tài khoản Master cố định */}
      <div className="bg-amber-50 border border-amber-300 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-400/20 text-amber-900 flex items-center justify-center font-bold shrink-0">
            <Crown className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs sm:text-sm font-black text-amber-950 flex items-center gap-2">
              <span>Tài khoản cố định Ban Chủ nhiệm:</span>
              <span className="font-mono bg-white px-2 py-0.5 rounded border border-amber-300 text-blue-900">
                ambassadors.club@vnuis.edu.vn
              </span>
            </div>
            <div className="text-[11px] text-amber-800 mt-0.5">
              Mật khẩu cố định: <strong className="font-mono font-bold">ISSAC2026@tuyenquan</strong> · Toàn quyền quản trị hệ thống, cấp tài khoản cho các Ban.
            </div>
          </div>
        </div>
        <Badge className="bg-amber-400 text-slate-950 font-black text-xs shrink-0">
          Master Account
        </Badge>
      </div>

      {/* Bảng yêu cầu thay đổi Tên/Chức vụ */}
      {changeRequests.filter(r => r.status === "pending").length > 0 && (
        <Card className="border-amber-200 bg-amber-50/50 shadow-xs">
          <CardHeader className="py-3.5 px-5 border-b border-amber-200/80">
            <CardTitle className="text-sm sm:text-base font-bold text-amber-900 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                Yêu cầu cập nhật Tên & Chức vụ chờ duyệt
              </span>
              <Badge className="bg-amber-200 text-amber-900 border-amber-300">
                {changeRequests.filter(r => r.status === "pending").length} yêu cầu
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            {changeRequests.filter(r => r.status === "pending").map(req => (
              <div key={req.id} className="bg-white p-3.5 rounded-xl border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-0.5 text-xs">
                  <div className="font-bold text-gray-900">
                    Ban: <span className="text-blue-700">{DEPT_INFO[req.role]?.name || req.departmentName}</span>
                  </div>
                  <div className="text-gray-600">
                    Đổi thành: <strong>{req.requestedName}</strong> ({req.requestedTitle})
                  </div>
                  {req.reviewNote && <div className="text-gray-400 italic">Ghi chú: {req.reviewNote}</div>}
                </div>
                <div className="flex items-center gap-2 self-end sm:self-center">
                  <Button size="sm" onClick={() => handleApproveReq(req.id)} className="h-8 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs gap-1">
                    <Check className="w-3.5 h-3.5" /> Duyệt
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleRejectReq(req.id)} className="h-8 text-red-600 border-red-200 hover:bg-red-50 text-xs gap-1">
                    <XCircle className="w-3.5 h-3.5" /> Từ chối
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Danh sách tài khoản */}
      <Card className="shadow-xs border overflow-hidden">
        <CardHeader className="py-3.5 px-5 border-b bg-gray-50/80">
          <CardTitle className="text-sm sm:text-base font-bold text-gray-900 flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-600" />
              Danh sách Cán bộ Tuyển quân ({admins.length})
            </span>
            <span className="text-xs text-gray-500 font-normal">
              Bao gồm Ban Chủ nhiệm & các Ban chuyên môn
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-600 uppercase text-xs border-b">
                <tr>
                  <th className="py-3.5 px-4 whitespace-nowrap min-w-[220px]">Tài khoản / Người đại diện</th>
                  <th className="py-3.5 px-4 whitespace-nowrap min-w-[170px]">Ban được phân công</th>
                  <th className="py-3.5 px-4 whitespace-nowrap min-w-[130px]">Mật khẩu</th>
                  <th className="py-3.5 px-4 whitespace-nowrap min-w-[110px]">Trạng thái</th>
                  <th className="py-3.5 px-4 text-right whitespace-nowrap min-w-[260px]">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {admins.map((admin) => {
                  const dept = DEPT_INFO[admin.admin_role] || DEPT_INFO["chu-nhiem"]
                  const DeptIcon = dept.icon
                  const isVisiblePw = showPasswords[admin.id]
                  const displayPass = admin.password || (admin.email === "ambassadors.club@vnuis.edu.vn" || admin.email === "bcn@issac.vnu.edu.vn" ? "ISSAC2026@tuyenquan" : "••••••••")

                  return (
                    <tr key={admin.id} className="hover:bg-blue-50/30 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-gray-900 flex flex-wrap items-center gap-1.5">
                          <span>{admin.full_name}</span>
                          {admin.title && (
                            <span className="text-[11px] font-semibold text-blue-800 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100 whitespace-nowrap">
                              {admin.title}
                            </span>
                          )}
                          {admin.is_fixed && (
                            <Badge className="bg-amber-100 text-amber-900 border-amber-300 text-[10px] px-1.5 py-0 font-bold whitespace-nowrap">
                              Cố định
                            </Badge>
                          )}
                        </div>
                        <div className="text-xs text-gray-500 font-mono">{admin.email}</div>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border whitespace-nowrap shrink-0 ${dept.color}`}>
                          <DeptIcon className="w-3.5 h-3.5 shrink-0" />
                          <span className="whitespace-nowrap">{dept.name}</span>
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-xs font-mono">
                        <div className="flex items-center gap-1.5">
                          <span>{isVisiblePw ? displayPass : "••••••••"}</span>
                          <button
                            type="button"
                            onClick={() => toggleShowPassword(admin.id)}
                            className="text-gray-400 hover:text-gray-600 cursor-pointer"
                            title={isVisiblePw ? "Ẩn" : "Hiện"}
                          >
                            {isVisiblePw ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        {admin.is_active ? (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700">
                            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                            Hoạt động
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-gray-400">
                            <span className="w-2 h-2 rounded-full bg-gray-300"></span>
                            Tạm khóa
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenEditModal(admin)}
                            className="h-8 text-xs text-amber-900 hover:bg-amber-100/60 font-bold border border-amber-200"
                            title="Chỉnh sửa họ tên, chức vụ, ban của tài khoản này"
                          >
                            <Edit3 className="w-3.5 h-3.5 mr-1 text-amber-700" /> Sửa thông tin
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenResetModal(admin)}
                            className="h-8 text-xs text-blue-700 hover:bg-blue-50 font-bold"
                            title="Đổi mật khẩu tài khoản này"
                          >
                            <Lock className="w-3.5 h-3.5 mr-1" /> Đổi mật khẩu
                          </Button>

                          {!admin.is_fixed && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleToggleStatus(admin.id)}
                              className="h-8 text-xs text-gray-600 hover:bg-gray-100"
                            >
                              {admin.is_active ? "Khóa" : "Mở khóa"}
                            </Button>
                          )}

                          {!admin.is_fixed && admin.id.startsWith("adm-") && admin.id.length > 8 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteAccount(admin.id)}
                              className="h-8 text-xs text-red-600 hover:bg-red-50 hover:text-red-700"
                              title="Xóa tài khoản này"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Modal: Tạo tài khoản mới */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-blue-600" />
              Cấp tài khoản Ban Tuyển Quân
            </DialogTitle>
            <DialogDescription className="text-xs text-gray-500">
              Ban Chủ nhiệm có thể tạo thêm tài khoản cho Ban Chủ nhiệm hoặc các Ban chuyên môn.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 text-left">
            <div>
              <Label className="text-xs font-bold text-gray-700 mb-1.5 block">
                Phân quyền vào Ban <span className="text-red-500">*</span>
              </Label>
              <Select
                value={form.admin_role}
                onValueChange={(v: any) => setForm(f => ({ ...f, admin_role: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="chu-nhiem">Ban Chủ nhiệm (Toàn quyền)</SelectItem>
                  <SelectItem value="truyen-thong">Ban Truyền thông</SelectItem>
                  <SelectItem value="tu-van">Ban Tư vấn</SelectItem>
                  <SelectItem value="nhan-su">Ban Nhân sự</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs font-bold text-gray-700 mb-1.5 block">
                Họ và tên người đại diện / Giám khảo <span className="text-red-500">*</span>
              </Label>
              <Input
                value={form.full_name}
                onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
                placeholder="VD: Nguyễn Văn A..."
                className="text-sm"
              />
            </div>

            <div>
              <Label className="text-xs font-bold text-gray-700 mb-1.5 block">
                Chức vụ / Vị trí đảm nhiệm
              </Label>
              <Input
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder={form.admin_role === "chu-nhiem" ? "VD: Phó Chủ nhiệm CLB, Chủ nhiệm CLB..." : "VD: Cán bộ Tuyển quân, Giám khảo..."}
                className="text-sm"
              />
            </div>

            <div>
              <Label className="text-xs font-bold text-gray-700 mb-1.5 block">
                Email đăng nhập <span className="text-red-500">*</span>
              </Label>
              <Input
                type="email"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                placeholder="VD: nam.nguyen@issac.vnu.edu.vn"
                className="text-sm font-mono"
              />
            </div>

            <div>
              <Label className="text-xs font-bold text-gray-700 mb-1.5 block">
                Mật khẩu đăng nhập <span className="text-red-500">*</span>
              </Label>
              <Input
                type="password"
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                placeholder="Tối thiểu 6 ký tự..."
                className="text-sm"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowCreateModal(false)}>
              Hủy
            </Button>
            <Button onClick={handleCreateAccount} disabled={saving} variant="gold" className="font-bold">
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
              Cấp tài khoản
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal: Đổi mật khẩu tài khoản Admin */}
      <Dialog open={showResetModal} onOpenChange={setShowResetModal}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-blue-600" />
              Đổi mật khẩu tài khoản
            </DialogTitle>
            <DialogDescription className="text-xs text-gray-500">
              Đổi mật khẩu cho: <strong className="text-gray-900">{selectedAdminForReset?.email}</strong>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-left">
            <div>
              <Label className="text-xs font-bold text-gray-700 mb-1.5 block">
                Mật khẩu mới
              </Label>
              <Input
                type="text"
                value={newPasswordInput}
                onChange={e => setNewPasswordInput(e.target.value)}
                placeholder="Nhập mật khẩu mới..."
                className="text-sm font-mono"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowResetModal(false)}>
              Hủy
            </Button>
            <Button onClick={handleSaveResetPassword} variant="gold" className="font-bold">
              Lưu mật khẩu
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal: Chỉnh sửa thông tin tài khoản Admin (Họ tên, Chức vụ, Ban) */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit3 className="w-5 h-5 text-amber-600" />
              Chỉnh sửa thông tin Cán bộ
            </DialogTitle>
            <DialogDescription className="text-xs text-gray-500">
              Cập nhật Họ và tên, Chức vụ và Ban phân công cho: <strong className="text-gray-900 font-mono">{selectedAdminForEdit?.email}</strong>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 text-left">
            <div>
              <Label className="text-xs font-bold text-gray-700 mb-1.5 block">
                Ban được phân công <span className="text-red-500">*</span>
              </Label>
              <Select
                value={editForm.admin_role}
                onValueChange={(v: any) => setEditForm(f => ({ ...f, admin_role: v }))}
              >
                <SelectTrigger className="text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="chu-nhiem">Ban Chủ nhiệm (Toàn quyền)</SelectItem>
                  <SelectItem value="truyen-thong">Ban Truyền thông</SelectItem>
                  <SelectItem value="tu-van">Ban Tư vấn</SelectItem>
                  <SelectItem value="nhan-su">Ban Nhân sự</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs font-bold text-gray-700 mb-1.5 block">
                Họ và tên cán bộ <span className="text-red-500">*</span>
              </Label>
              <Input
                value={editForm.full_name}
                onChange={e => setEditForm(f => ({ ...f, full_name: e.target.value }))}
                placeholder="VD: Nguyễn Hải Nam"
                className="text-sm"
              />
            </div>

            <div>
              <Label className="text-xs font-bold text-gray-700 mb-1.5 block">
                Chức vụ / Chức danh cụ thể
              </Label>
              <Input
                value={editForm.title}
                onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))}
                placeholder={editForm.admin_role === "chu-nhiem" ? "VD: Phó Chủ nhiệm CLB, Chủ nhiệm CLB..." : "VD: Phó ban Tư vấn, Trưởng ban, Giám khảo..."}
                className="text-sm font-medium"
              />
            </div>

            <div>
              <Label className="text-xs font-bold text-gray-700 mb-1.5 block">
                Mật khẩu mới (để trống nếu không muốn đổi)
              </Label>
              <Input
                type="text"
                value={editForm.password}
                onChange={e => setEditForm(f => ({ ...f, password: e.target.value }))}
                placeholder="Nhập mật khẩu mới hoặc giữ nguyên..."
                className="text-sm font-mono"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowEditModal(false)}>
              Hủy
            </Button>
            <Button onClick={handleSaveEditAdmin} disabled={saving} variant="gold" className="font-bold">
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
              Lưu thay đổi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
