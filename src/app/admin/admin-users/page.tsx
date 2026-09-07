'use client'
import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/components/ui/use-toast'
import { Shield, Users, Crown, Loader2, Edit2, ChevronDown } from 'lucide-react'

const ADMIN_ROLES = {
  'chu-nhiem': { label: 'Ban Chủ nhiệm', color: 'bg-amber-100 text-amber-800', icon: '👑' },
  'nhan-su': { label: 'Ban Nhân sự', color: 'bg-purple-100 text-purple-800', icon: '👥' },
  'truyen-thong': { label: 'Ban Truyền thông', color: 'bg-blue-100 text-blue-800', icon: '📣' },
  'tu-van': { label: 'Ban Tư vấn', color: 'bg-green-100 text-green-800', icon: '💬' },
}

export default function AdminUsersPage() {
  const supabase = createClient()
  const { toast } = useToast()
  const [admins, setAdmins] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isSuperAdmin, setIsSuperAdmin] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editRole, setEditRole] = useState('')
  const [saving, setSaving] = useState(false)

  const fetchData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: myProfile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
      setIsSuperAdmin(myProfile?.role === 'super_admin')
    }

    const { data } = await supabase
      .from('profiles')
      .select('id, full_name, email, role, admin_role, created_at, is_active')
      .in('role', ['admin', 'super_admin'])
      .order('created_at')

    setAdmins(data || [])
    setLoading(false)
  }, [supabase])

  useEffect(() => { fetchData() }, [fetchData])

  const handleUpdateRole = async (userId: string, newRole: string, newAdminRole: string) => {
    setSaving(true)
    const { error } = await supabase.from('profiles').update({ role: newRole, admin_role: newAdminRole }).eq('id', userId)
    if (error) { toast({ title: 'Lỗi', description: error.message, variant: 'destructive' }); setSaving(false); return }
    toast({ title: '✅ Đã cập nhật quyền!' } as Parameters<typeof toast>[0])
    setEditingId(null)
    fetchData()
    setSaving(false)
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
          <Shield className="w-6 h-6 text-blue-600" />
          Quản lý Thành viên Ban
        </h1>
        <p className="text-gray-500 text-sm mt-1">Danh sách admin và quyền truy cập hệ thống</p>
      </div>

      {!isSuperAdmin && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-amber-800 text-sm">
          ⚠️ Chỉ Ban Chủ nhiệm mới có thể thay đổi quyền truy cập.
        </div>
      )}

      {/* Role summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Object.entries(ADMIN_ROLES).map(([key, role]) => (
          <Card key={key} className="border-0 bg-gray-50">
            <CardContent className="py-4 text-center">
              <div className="text-2xl mb-1">{role.icon}</div>
              <div className="text-lg font-black text-gray-900">
                {admins.filter(a => a.admin_role === key).length}
              </div>
              <div className="text-xs text-gray-500">{role.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="w-4 h-4" />
            Danh sách Admin ({admins.length} người)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500">Thành viên</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500">Role hệ thống</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500">Ban</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500">Trạng thái</th>
                    {isSuperAdmin && <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500">Thao tác</th>}
                  </tr>
                </thead>
                <tbody>
                  {admins.map(admin => {
                    const adminRole = ADMIN_ROLES[admin.admin_role as keyof typeof ADMIN_ROLES]
                    return (
                      <tr key={admin.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center text-white font-bold text-sm">
                              {admin.full_name?.charAt(0) || 'A'}
                            </div>
                            <div>
                              <div className="font-semibold text-gray-900 text-sm">{admin.full_name}</div>
                              <div className="text-xs text-gray-500">{admin.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant={admin.role === 'super_admin' ? 'gold' : 'secondary'} className="text-xs flex items-center gap-1 w-fit">
                            {admin.role === 'super_admin' && <Crown className="w-3 h-3" />}
                            {admin.role === 'super_admin' ? 'Super Admin' : 'Admin'}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          {editingId === admin.id ? (
                            <Select value={editRole} onValueChange={setEditRole}>
                              <SelectTrigger className="w-40 h-8 text-xs"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                {Object.entries(ADMIN_ROLES).map(([k, v]) => (
                                  <SelectItem key={k} value={k} className="text-xs">{v.label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : adminRole ? (
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${adminRole.color}`}>
                              {adminRole.icon} {adminRole.label}
                            </span>
                          ) : <span className="text-gray-400 text-sm">—</span>}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${admin.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                            {admin.is_active ? 'Hoạt động' : 'Vô hiệu'}
                          </span>
                        </td>
                        {isSuperAdmin && (
                          <td className="py-3 px-4 text-right">
                            {editingId === admin.id ? (
                              <div className="flex items-center justify-end gap-2">
                                <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>Huỷ</Button>
                                <Button size="sm" disabled={saving} onClick={() => handleUpdateRole(admin.id, admin.role, editRole)}>
                                  {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Lưu'}
                                </Button>
                              </div>
                            ) : (
                              <Button size="sm" variant="ghost" onClick={() => { setEditingId(admin.id); setEditRole(admin.admin_role || '') }}>
                                <Edit2 className="w-3.5 h-3.5 mr-1" /> Sửa
                              </Button>
                            )}
                          </td>
                        )}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-blue-50 border-blue-100">
        <CardContent className="py-4 text-sm text-blue-700">
          <strong>💡 Lưu ý:</strong> Để thêm admin mới, người đó cần đăng ký tài khoản trước, sau đó Ban Chủ nhiệm cập nhật quyền trong database (Supabase Dashboard → Table profiles → Update role = &apos;admin&apos;).
        </CardContent>
      </Card>
    </div>
  )
}
