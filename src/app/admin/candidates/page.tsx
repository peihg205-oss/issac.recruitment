'use client'
import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Search, Download, Eye, CheckCircle, XCircle, Clock,
  ArrowUpDown, Users, Loader2, ChevronRight, Filter, Key, Trash2
} from 'lucide-react'
import { CandidateAccountModal } from "@/components/admin/candidate-account-modal"
import { isCandidateDeleted } from "@/lib/candidate-account-manager"
import Link from 'next/link'
import { APPLICATION_STATUS_LABELS, APPLICATION_STATUS_COLORS, formatDate, formatFullTimestamp, exportToCSV, buildCandidateCodeMap } from '@/lib/utils'
import { useToast } from '@/components/ui/use-toast'
import { type ApplicationStatus } from '@/types/database'
import { MOCK_DEPARTMENTS, MOCK_CANDIDATES } from '@/lib/mock-data'
import { ADMIN_ROLE_CONFIGS, type AdminRoleType } from '@/lib/permissions'

interface Candidate {
  id: string
  user_id?: string
  status: ApplicationStatus
  submitted_at: string | null
  created_at: string
  profiles: { full_name: string; email: string; student_id: string | null; phone: string | null; major?: string; cohort?: string }
  departments: { name: string; slug: string }
  candidate_rankings: { rank_number: number | null; final_score: number | null; result: string } | null
}

export default function CandidatesPage() {
  const supabase = createClient()
  const { toast } = useToast()
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [departments, setDepartments] = useState<{id: string; name: string; slug: string}[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [deptFilter, setDeptFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'score'>('date')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [updating, setUpdating] = useState<string | null>(null)
  const [activeRole, setActiveRole] = useState<AdminRoleType>('chu-nhiem')
  const [accountModalCandidate, setAccountModalCandidate] = useState<any>(null)
  const [showAccountModal, setShowAccountModal] = useState(false)

  useEffect(() => {
    const match = document.cookie.match(/issac_admin_role=([^;]+)/)
    if (match && match[1] in ADMIN_ROLE_CONFIGS) {
      setActiveRole(match[1] as AdminRoleType)
    }
  }, [])

  const isSuperAdmin = activeRole === 'chu-nhiem'
  const userDeptObj = departments.find(d => d.slug === activeRole)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [{ data: apps }, { data: depts }, { data: allProfiles }] = await Promise.all([
        supabase
          .from('applications')
          .select(`
            id, user_id, department_id, status, submitted_at, created_at,
            departments!applications_department_id_fkey(name, slug),
            candidate_rankings(rank_number, final_score, result)
          `)
          .order('created_at', { ascending: false }),
        supabase.from('departments').select('id, name, slug').neq('slug', 'chu-nhiem'),
        supabase.from('profiles').select('id, full_name, email, student_id, phone, major, cohort, role, created_at')
      ])

      let candidateList: Candidate[] = []
      if (apps && apps.length > 0) {
        const userIds = Array.from(new Set(apps.map((a: any) => a.user_id).filter(Boolean)))
        let profilesMap: Record<string, any> = {}
        if (allProfiles && allProfiles.length > 0) {
          allProfiles.forEach((p: any) => { profilesMap[p.id] = p })
        } else if (userIds.length > 0) {
          const { data: profs } = await supabase
            .from('profiles')
            .select('id, full_name, email, student_id, phone, major, cohort')
            .in('id', userIds)
          if (profs) {
            profs.forEach((p: any) => { profilesMap[p.id] = p })
          }
        }
        candidateList = apps.map((a: any) => ({
          ...a,
          profiles: profilesMap[a.user_id] || { full_name: 'Ứng viên', email: '', student_id: '' }
        })) as unknown as Candidate[]

        // Bổ sung tài khoản sinh viên đã đăng ký / đăng nhập nhưng CHƯA làm đơn
        if (allProfiles && allProfiles.length > 0) {
          const appUserIds = new Set(apps.map((a: any) => a.user_id))
          const unsubmittedProfiles = allProfiles.filter((p: any) => !appUserIds.has(p.id) && p.role !== 'admin')
          unsubmittedProfiles.forEach((p: any) => {
            candidateList.push({
              id: `reg-${p.id}`,
              user_id: p.id,
              status: 'draft',
              submitted_at: null,
              created_at: p.created_at || new Date().toISOString(),
              profiles: p,
              departments: { name: 'Chưa chọn ban', slug: 'unassigned' },
              candidate_rankings: null,
            })
          })
        }
      } else {
        // Fallback demo/mock data (bao gồm cả ứng viên đã nộp đơn và người mới đăng ký chưa làm đơn)
        candidateList = MOCK_CANDIDATES as unknown as Candidate[]
      }

      setCandidates(candidateList)
      setDepartments(depts && depts.length > 0 ? depts : MOCK_DEPARTMENTS)
    } catch (err) {
      console.error('Error fetching candidates:', err)
      setCandidates(MOCK_CANDIDATES as unknown as Candidate[])
      setDepartments(MOCK_DEPARTMENTS)
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    fetchData()
    const channel = supabase
      .channel('admin-candidates-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'applications' }, () => {
        fetchData()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchData, supabase])

  const handleStatusChange = async (appId: string, newStatus: ApplicationStatus) => {
    setUpdating(appId)
    // Local state update immediately for responsive UX
    setCandidates(prev => prev.map(c => c.id === appId ? { ...c, status: newStatus } : c))

    try {
      await supabase
        .from('applications')
        .update({ status: newStatus })
        .eq('id', appId)

      const target = candidates.find(c => c.id === appId)
      if (target && target.user_id) {
        let title = 'Cập nhật trạng thái hồ sơ'
        let message = `Hồ sơ ứng tuyển của bạn đã chuyển sang trạng thái "${APPLICATION_STATUS_LABELS[newStatus]}".`
        let action_url = '/member/dashboard'

        if (newStatus === 'approved') {
          title = 'Chúc mừng! Hồ sơ của bạn đã được Duyệt'
          message = 'Hội đồng tuyển quân đã thông qua hồ sơ vòng 1 của bạn. Bạn đã đủ điều kiện tham gia vòng phỏng vấn tiếp theo!'
          action_url = '/member/interview'
        } else if (newStatus === 'interview_scheduled') {
          title = 'Đã có lịch phỏng vấn chính thức'
          message = 'Lịch phỏng vấn của bạn đã được sắp xếp. Vui lòng vào xem thời gian và phòng phỏng vấn.'
          action_url = '/member/interview'
        } else if (newStatus === 'finalized') {
          title = 'Kết quả tuyển quân chính thức'
          message = 'Hội đồng tuyển quân đã công bố kết quả tuyển chọn. Nhấn để tra cứu kết quả của bạn.'
          action_url = '/member/result'
        } else if (newStatus === 'rejected') {
          title = 'Thông báo về hồ sơ ứng tuyển'
          message = 'Cảm ơn bạn đã quan tâm ứng tuyển vào iSSAC. Rất tiếc hồ sơ đợt này chưa phù hợp.'
          action_url = '/member/dashboard'
        }

        await supabase.from('notifications').insert({
          user_id: target.user_id,
          title,
          message,
          type: newStatus === 'approved' || newStatus === 'finalized' ? 'success' : newStatus === 'rejected' ? 'error' : 'info',
          action_url,
          is_read: false,
        })

        if (typeof window !== 'undefined') {
          const notifPayload = {
            id: 'notif-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
            user_id: target.user_id,
            title,
            message,
            type: newStatus === 'approved' || newStatus === 'finalized' ? 'success' : newStatus === 'rejected' ? 'error' : 'info',
            action_url,
            is_read: false,
            created_at: new Date().toISOString()
          }
          const userNotifsKey = `issac_user_notifs_${target.user_id}`
          const existing = JSON.parse(localStorage.getItem(userNotifsKey) || '[]')
          localStorage.setItem(userNotifsKey, JSON.stringify([notifPayload, ...existing]))
        }
      }

      if (typeof window !== 'undefined') {
        localStorage.setItem(`issac_app_status_${appId}`, newStatus)
        if (target && target.user_id) {
          localStorage.setItem(`issac_app_status_user_${target.user_id}`, newStatus)
        }
        localStorage.setItem('issac_last_eval_update', Date.now().toString())

        if ('BroadcastChannel' in window) {
          const bc = new BroadcastChannel('issac_eval_channel')
          bc.postMessage({
            type: 'candidate_status_changed',
            candidateId: appId,
            userId: target?.user_id,
            newStatus,
            timestamp: Date.now()
          })
          bc.close()
        }

        window.dispatchEvent(new CustomEvent('issac_candidate_approved', {
          detail: { candidateId: appId, newStatus }
        }))
        window.dispatchEvent(new CustomEvent('issac_eval_updated'))
      }
    } catch {}

    setUpdating(null)
    toast({
      title: 'Đã cập nhật trạng thái',
      description: `Hồ sơ đã chuyển sang "${APPLICATION_STATUS_LABELS[newStatus]}"`,
      variant: 'success'
    } as Parameters<typeof toast>[0])
  }

  // Tất cả các Ban đều xem được danh sách ứng viên toàn CLB
  const filtered = candidates.filter(c => {
    const p = c.profiles
    const q = search.toLowerCase()
    const matchSearch = !search ||
      p?.full_name?.toLowerCase().includes(q) ||
      p?.email?.toLowerCase().includes(q) ||
      p?.student_id?.toLowerCase().includes(q)
    const matchDept = deptFilter === 'all' || c.departments?.slug === deptFilter
    const matchStatus = statusFilter === 'all' || c.status === statusFilter
    return matchSearch && matchDept && matchStatus
  })

  const codeMap = buildCandidateCodeMap(candidates)
  
  filtered.sort((a, b) => {
      if (sortBy === 'name') {
        const cmp = (a.profiles?.full_name || '').localeCompare(b.profiles?.full_name || '')
        return sortDir === 'asc' ? cmp : -cmp
      }
      if (sortBy === 'score') {
        const sa = a.candidate_rankings?.final_score || 0
        const sb = b.candidate_rankings?.final_score || 0
        return sortDir === 'asc' ? sa - sb : sb - sa
      }
      const da = new Date(a.submitted_at || a.created_at).getTime()
      const db = new Date(b.submitted_at || b.created_at).getTime()
      return sortDir === 'asc' ? da - db : db - da
    })

  const handleExport = () => {
    const rows = filtered.map(c => ({
      'Mã ứng viên': c.id,
      'Họ và tên': c.profiles?.full_name || '',
      'MSSV': c.profiles?.student_id || '',
      'Email': c.profiles?.email || '',
      'Số điện thoại': c.profiles?.phone || '',
      'Ban đăng ký': c.departments?.name || '',
      'Trạng thái': APPLICATION_STATUS_LABELS[c.status] || c.status,
      'Điểm': c.candidate_rankings?.final_score ?? 'Chưa chấm',
      'Xếp hạng': c.candidate_rankings?.rank_number ?? '-',
      'Ngày nộp': formatDate(c.submitted_at || c.created_at),
    }))
    exportToCSV(rows, `danh_sach_ung_vien_issac_${new Date().toISOString().slice(0, 10)}`)
    toast({ title: `Đã xuất ${rows.length} ứng viên ra file CSV` } as Parameters<typeof toast>[0])
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-600" />
            Hồ sơ Ứng viên ({filtered.length})
          </h1>
          <div className="flex items-center gap-2 flex-wrap mt-2.5">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                statusFilter === 'all'
                  ? 'bg-[#1657c1] text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Tất cả: {candidates.length}
            </button>
            <button
              onClick={() => setStatusFilter('submitted')}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                statusFilter === 'submitted'
                  ? 'bg-[#1657c1] text-white shadow-2xs'
                  : 'bg-blue-50 text-[#1657c1] hover:bg-blue-100 border border-blue-200'
              }`}
            >
              Đã nộp đơn: {candidates.filter(c => c.status !== 'draft').length}
            </button>
            <button
              onClick={() => setStatusFilter(statusFilter === 'draft' ? 'all' : 'draft')}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                statusFilter === 'draft'
                  ? 'bg-amber-500 text-white shadow-2xs ring-2 ring-amber-300'
                  : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200/90'
              }`}
            >
              Chưa làm đơn: {candidates.filter(c => c.status === 'draft').length}
            </button>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExport} className="gap-2">
            <Download className="w-4 h-4" />
            Xuất CSV / Excel
          </Button>
        </div>
      </div>

      {/* Filters Card */}
      <Card className="shadow-sm">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Tìm tên, email, MSSV..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Department Filter - Tất cả đều được xem danh sách theo ban */}
            <Select value={deptFilter} onValueChange={setDeptFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Tất cả Ban" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả các Ban</SelectItem>
                {departments.map(d => (
                  <SelectItem key={d.id} value={d.slug}>{d.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Tất cả trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả trạng thái</SelectItem>
                {Object.entries(APPLICATION_STATUS_LABELS).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Sort */}
            <div className="flex gap-2">
              <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
                <SelectTrigger className="flex-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date">Theo ngày nộp</SelectItem>
                  <SelectItem value="name">Theo tên A-Z</SelectItem>
                  <SelectItem value="score">Theo điểm số</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setSortDir(d => d === 'asc' ? 'desc' : 'asc')}
                title="Đổi thứ tự sắp xếp"
              >
                <ArrowUpDown className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Candidates Table */}
      <Card className="shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="py-20 text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600 mb-2" />
              <p className="text-sm text-gray-500">Đang tải danh sách ứng viên...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center text-gray-500">
              <Users className="w-12 h-12 mx-auto text-gray-300 mb-3" />
              <p className="font-semibold text-gray-700">Không tìm thấy ứng viên nào</p>
              <p className="text-xs text-gray-400 mt-1">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
            </div>
          ) : (
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-600 uppercase text-xs border-b">
                <tr>
                  <th className="px-4 py-3.5">Ứng viên</th>
                  <th className="px-4 py-3.5">Ban đăng ký</th>
                  <th className="px-4 py-3.5">Ngày & Giờ gửi</th>
                  <th className="px-4 py-3.5">Trạng thái</th>
                  <th className="px-4 py-3.5 text-center">Điểm PV</th>
                  <th className="px-4 py-3.5 text-center">Xếp hạng</th>
                  <th className="px-4 py-3.5 text-right">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map(c => {
                  const p = c.profiles
                  const score = c.candidate_rankings?.final_score
                  const rank = c.candidate_rankings?.rank_number
                  const isTop15 = rank && rank <= 15

                  return (
                    <tr key={c.id} className="hover:bg-blue-50/40 transition-colors">
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 whitespace-nowrap">
                          <span className="font-semibold text-gray-900 whitespace-nowrap">{p?.full_name || 'Ứng viên'}</span>
                          <span className="text-[11px] font-mono text-slate-400 font-normal whitespace-nowrap">
                            ({codeMap[c.id] || 'ISSAC-01'})
                          </span>
                        </div>
                        <div className="text-xs text-gray-500 whitespace-nowrap">{p?.email}</div>
                        <div className="text-xs text-gray-400 whitespace-nowrap">MSSV: {p?.student_id || 'Chưa cập nhật'} • {p?.phone}</div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="font-medium text-gray-800">{c.departments?.name}</span>
                      </td>
                      <td className="px-4 py-3.5 text-xs whitespace-nowrap">
                        <div className="font-semibold text-gray-900">{formatDate(c.submitted_at || c.created_at)}</div>
                        <div className="text-[11px] text-gray-500 font-mono flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3 text-blue-600" />
                          <span>{formatFullTimestamp(c.submitted_at || c.created_at).timeStr}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap border shadow-2xs ${APPLICATION_STATUS_COLORS[c.status] || 'bg-gray-100 text-gray-800'}`}>
                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${c.status === 'draft' ? 'bg-amber-500' : c.status === 'finalized' || c.status === 'approved' ? 'bg-emerald-500' : 'bg-blue-500'}`} />
                          <span>{APPLICATION_STATUS_LABELS[c.status] || c.status}</span>
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        {score !== null && score !== undefined ? (
                          <span className={`font-black text-sm ${score >= 9 ? 'text-amber-600' : score >= 8 ? 'text-blue-600' : 'text-gray-700'}`}>
                            {score.toFixed(1)}
                          </span>
                        ) : (
                          <span className="text-gray-300 text-xs">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        {rank ? (
                          <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-black ${
                            rank <= 3 ? 'bg-amber-400 text-amber-950 font-bold shadow-sm' :
                            isTop15 ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600'
                          }`}>
                            #{rank}
                          </span>
                        ) : (
                          <span className="text-gray-300 text-xs">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {c.status === 'submitted' && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 text-xs text-green-700 border-green-300 hover:bg-green-50"
                              onClick={() => handleStatusChange(c.id, 'approved')}
                              disabled={updating === c.id}
                            >
                              <CheckCircle className="w-3.5 h-3.5 mr-1 text-green-600" />
                              Duyệt
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 text-xs text-amber-700 hover:text-amber-900 hover:bg-amber-50"
                            onClick={() => {
                              setAccountModalCandidate(c)
                              setShowAccountModal(true)
                            }}
                            title="Kiểm tra mật khẩu & Quản lý tài khoản"
                          >
                            <Key className="w-3.5 h-3.5 mr-1 text-amber-600" />
                            Tài khoản
                          </Button>
                          <Link href={`/admin/candidates/${c.id}`}>
                            <Button size="sm" variant="ghost" className="h-8 text-xs text-blue-600 hover:bg-blue-50">
                              <Eye className="w-3.5 h-3.5 mr-1" />
                              Hồ sơ
                            </Button>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </Card>
      {/* Candidate Account & Password Management Modal */}
      <CandidateAccountModal
        candidate={accountModalCandidate}
        open={showAccountModal}
        onOpenChange={setShowAccountModal}
        onCandidateDeleted={(delId) => {
          setCandidates(prev => prev.filter(x => x.id !== delId))
        }}
      />
    </div>
  )
}
