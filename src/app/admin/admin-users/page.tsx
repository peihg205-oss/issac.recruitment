'use client'
import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useToast } from '@/components/ui/use-toast'
import {
  ShieldCheck, Users, Crown, Megaphone, MessageSquare,
  Plus, Key, Lock, CheckCircle2, AlertCircle, Loader2, Edit3, Trash2,
  Clock, Check, XCircle
} from 'lucide-react'
import {
  getAdminAccounts,
  getAdminRequests,
  approveChangeRequest,
  rejectChangeRequest,
  type AdminChangeRequest
} from "@/lib/admin-account-manager"

interface AdminUser {
  id: string
  full_name: string
  email: string
  role: string
  admin_role: 'chu-nhiem' | 'truyen-thong' | 'tu-van' | 'nhan-su'
  is_active: boolean
  created_at: string
}

const DEPT_INFO = {
  'chu-nhiem': {
    name: 'Ban Chủ nhiệm',
    desc: 'Toàn quyền quản lý hệ thống, duyệt Top 15 và chấm điểm cả 3 ban',
    color: 'bg-amber-50 text-amber-900 border-amber-300',
    icon: Crown,
  },
  'truyen-thong': {
    name: 'Ban Truyền thông',
    desc: 'Chỉ chấm điểm và đặt câu hỏi cho ứng viên Ban Truyền thông',
    color: 'bg-blue-50 text-blue-900 border-blue-300',
    icon: Megaphone,
  },
  'tu-van': {
    name: 'Ban Tư vấn',
    desc: 'Chỉ chấm điểm và đặt câu hỏi cho ứng viên Ban Tư vấn',
    color: 'bg-emerald-50 text-emerald-900 border-emerald-300',
    icon: MessageSquare,
  },
  'nhan-su': {
    name: 'Ban Nhân sự',
    desc: 'Chỉ chấm điểm và đặt câu hỏi cho ứng viên Ban Nhân sự',
    color: 'bg-purple-50 text-purple-900 border-purple-300',
    icon: Users,
  },
}

const INITIAL_ACCOUNTS: AdminUser[] = [
  {
    id: 'adm-1',
    full_name: 'Ban Chủ nhiệm iSSAC',
    email: 'bcn@issac.vnu.edu.vn',
    role: 'super_admin',
    admin_role: 'chu-nhiem',
    is_active: true,
    created_at: '2026-08-15',
  },
  {
    id: 'adm-2',
    full_name: 'Giám khảo Ban Truyền thông',
    email: 'truyenthong@issac.vnu.edu.vn',
    role: 'admin',
    admin_role: 'truyen-thong',
    is_active: true,
    created_at: '2026-08-20',
  },
  {
    id: 'adm-3',
    full_name: 'Giám khảo Ban Tư vấn',
    email: 'tuvan@issac.vnu.edu.vn',
    role: 'admin',
    admin_role: 'tu-van',
    is_active: true,
    created_at: '2026-08-20',
  },
  {
    id: 'adm-4',
    full_name: 'Giám khảo Ban Nhân sự',
    email: 'nhansu@issac.vnu.edu.vn',
    role: 'admin',
    admin_role: 'nhan-su',
    is_active: true,
    created_at: '2026-08-20',
  },
]

export default function AdminUsersPage() {
  const supabase = createClient()
  const { toast } = useToast()

  const [admins, setAdmins] = useState<AdminUser[]>(INITIAL_ACCOUNTS)
  const [loading, setLoading] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [changeRequests, setChangeRequests] = useState<AdminChangeRequest[]>([])

  const loadRequests = () => {
    setChangeRequests(getAdminRequests())
  }

  useEffect(() => {
    loadRequests()
  }, [])

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

  // New account form
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    password: '',
    admin_role: 'truyen-thong' as 'chu-nhiem' | 'truyen-thong' | 'tu-van' | 'nhan-su',
  })

  const fetchData = useCallback(async () => {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('id, full_name, email, role, admin_role, created_at, is_active')
        .in('role', ['admin', 'super_admin'])
        .order('created_at')

      if (data && data.length > 0) {
        setAdmins(data as unknown as AdminUser[])
      }
    } catch {}
  }, [supabase])

  useEffect(() => { fetchData() }, [fetchData])

  const handleCreateAccount = async () => {
    if (!form.full_name || !form.email || !form.password) {
      toast({ title: 'Vui lòng điền đầy đủ thông tin tài khoản', variant: 'destructive' })
      return
    }

    setSaving(true)

    // Simulate creation locally & in database
    const newAdmin: AdminUser = {
      id: `adm-${Date.now()}`,
      full_name: form.full_name,
      email: form.email,
      role: form.admin_role === 'chu-nhiem' ? 'super_admin' : 'admin',
      admin_role: form.admin_role,
      is_active: true,
      created_at: new Date().toISOString().slice(0, 10),
    }

    setAdmins(prev => [...prev, newAdmin])
    setSaving(false)
    setShowCreateModal(false)
    setForm({ full_name: '', email: '', password: '', admin_role: 'truyen-thong' })

    toast({
      title: 'Đã cấp tài khoản thành công',
      description: `Đã tạo tài khoản cho ${DEPT_INFO[form.admin_role].name} (${form.email}).`,
      variant: 'success',
    } as Parameters<typeof toast>[0])
  }

  const handleToggleStatus = (id: string) => {
    setAdmins(prev => prev.map(a => a.id === id ? { ...a, is_active: !a.is_active } : a))
    toast({ title: 'Đã cập nhật trạng thái tài khoản' } as Parameters<typeof toast>[0])
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2.5">
            <ShieldCheck className="w-6 h-6 text-blue-600" />
            Cấp Tài Khoản & Phân Quyền Các Ban
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Quản lý và cấp quyền đăng nhập cho giám khảo Ban Truyền thông, Ban Tư vấn, Ban Nhân sự
          </p>
        </div>

        <Button
          onClick={() => setShowCreateModal(true)}
          className="gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Cấp tài khoản mới cho Ban
        </Button>
      </div>

      {/* Department Account Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Object.entries(DEPT_INFO).map(([key, info]) => {
          const count = admins.filter(a => a.admin_role === key).length
          const Icon = info.icon

          return (
            <Card key={key} className={`border ${info.color} shadow-sm`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center shadow-sm">
                    <Icon className="w-4 h-4" />
                  </div>
                  <Badge variant="outline" className="text-xs font-bold bg-white">
                    {count} tài khoản
                  </Badge>
                </div>
                <div className="font-bold text-sm text-gray-900">{info.name}</div>
                <div className="text-[11px] text-gray-600 mt-1 line-clamp-2">{info.desc}</div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Pending Change Requests Section */}
      {changeRequests.filter(r => r.status === "pending").length > 0 && (
        <Card className="shadow-xs border-amber-200 bg-amber-50/40 overflow-hidden">
          <CardHeader className="py-3 px-5 border-b border-amber-200/80 bg-amber-100/50 flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-700" />
              <CardTitle className="text-sm font-bold text-amber-950">
                Yêu cầu đổi Tên & Chức vụ chờ Ban Chủ nhiệm duyệt ({changeRequests.filter(r => r.status === "pending").length})
              </CardTitle>
            </div>
            <Badge className="bg-amber-500 text-white font-bold text-[10px]">
              Cần xử lý
            </Badge>
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            {changeRequests.filter(r => r.status === "pending").map(req => (
              <div
                key={req.id}
                className="bg-white p-3.5 rounded-xl border border-amber-200/80 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-gray-900">{req.departmentName}</span>
                    <span className="text-gray-300">•</span>
                    <span className="text-[11px] text-gray-500">
                      Yêu cầu lúc: {new Date(req.requestedAt).toLocaleDateString("vi-VN")} {new Date(req.requestedAt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                  <div className="text-xs text-gray-600">
                    Đổi từ: <span className="text-gray-500 font-medium">{req.currentName} ({req.currentTitle})</span>
                    {" ➔ "}
                    Đổi thành: <strong className="text-blue-900 font-bold">{req.requestedName}</strong> - <span className="font-semibold text-blue-700">{req.requestedTitle}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRejectReq(req.id)}
                    className="h-8 text-xs text-red-600 hover:bg-red-50 hover:text-red-700"
                  >
                    <XCircle className="w-3.5 h-3.5 mr-1" />
                    Từ chối
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleApproveReq(req.id)}
                    className="h-8 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    <Check className="w-3.5 h-3.5 mr-1" />
                    Phê duyệt
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Account List Table */}
      <Card className="shadow-sm overflow-hidden">
        <CardHeader className="border-b bg-gray-50/50 py-3.5">
          <CardTitle className="text-base flex items-center justify-between">
            <span>Danh sách tài khoản giám khảo đã cấp ({admins.length})</span>
            <span className="text-xs text-gray-500 font-normal">
              Tài khoản độc lập theo từng ban
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-600 uppercase text-xs border-b">
                <tr>
                  <th className="py-3.5 px-4">Tài khoản / Người đại diện</th>
                  <th className="py-3.5 px-4">Ban được phân công</th>
                  <th className="py-3.5 px-4">Quyền hạn áp dụng</th>
                  <th className="py-3.5 px-4">Trạng thái</th>
                  <th className="py-3.5 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {admins.map((admin) => {
                  const dept = DEPT_INFO[admin.admin_role] || DEPT_INFO['chu-nhiem']
                  const DeptIcon = dept.icon

                  return (
                    <tr key={admin.id} className="hover:bg-blue-50/30 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-gray-900">{admin.full_name}</div>
                        <div className="text-xs text-gray-500 font-mono">{admin.email}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border ${dept.color}`}>
                          <DeptIcon className="w-3.5 h-3.5" />
                          <span>{dept.name}</span>
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-gray-600">
                        {admin.admin_role === 'chu-nhiem' ? (
                          <span className="text-amber-700 font-semibold">
                            Toàn quyền hệ thống, duyệt Top 15, chấm điểm cả 3 ban
                          </span>
                        ) : (
                          <span className="text-gray-700">
                            Chỉ chấm điểm & đặt câu hỏi cho <strong>{dept.name}</strong>
                          </span>
                        )}
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
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleStatus(admin.id)}
                          className="h-8 text-xs text-gray-600 hover:bg-gray-100"
                        >
                          {admin.is_active ? 'Khóa tạm thời' : 'Mở khóa'}
                        </Button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Modal: Create / Grant Account */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-blue-600" />
              Cấp tài khoản giám khảo cho Ban
            </DialogTitle>
            <DialogDescription className="text-xs text-gray-500">
              Tài khoản này sẽ đăng nhập vào cổng Admin và chỉ có quyền hạn trong Ban được chỉ định.
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
                  <SelectItem value="truyen-thong">Ban Truyền thông</SelectItem>
                  <SelectItem value="tu-van">Ban Tư vấn</SelectItem>
                  <SelectItem value="nhan-su">Ban Nhân sự</SelectItem>
                  <SelectItem value="chu-nhiem">Ban Chủ nhiệm (Toàn quyền)</SelectItem>
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
                placeholder="VD: Nguyễn Hải Nam - Trưởng ban"
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
                Mật khẩu khởi tạo <span className="text-red-500">*</span>
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
    </div>
  )
}
