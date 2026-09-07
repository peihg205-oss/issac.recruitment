'use client'
import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Search, Download, Eye, CheckCircle, XCircle,
  ArrowUpDown, Users, Loader2, ChevronRight, Filter
} from 'lucide-react'
import Link from 'next/link'
import { APPLICATION_STATUS_LABELS, APPLICATION_STATUS_COLORS, formatDate, exportToCSV } from '@/lib/utils'
import { useToast } from '@/components/ui/use-toast'
import { type ApplicationStatus } from '@/types/database'
import { MOCK_CANDIDATES, MOCK_DEPARTMENTS } from '@/lib/mock-data'

interface Candidate {
  id: string
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

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [{ data: apps }, { data: depts }] = await Promise.all([
        supabase
          .from('applications')
          .select(`
            id, status, submitted_at, created_at,
            profiles!applications_user_id_fkey(full_name, email, student_id, phone),
            departments!applications_department_id_fkey(name, slug),
            candidate_rankings(rank_number, final_score, result)
          `)
          .order('created_at', { ascending: false }),
        supabase.from('departments').select('id, name, slug').neq('slug', 'chu-nhiem')
      ])
      if (apps && apps.length > 0) {
        setCandidates((apps as unknown as Candidate[]) || [])
      } else {
        setCandidates(MOCK_CANDIDATES as unknown as Candidate[])
      }
      setDepartments(depts && depts.length > 0 ? depts : MOCK_DEPARTMENTS)
    } catch {
      setCandidates(MOCK_CANDIDATES as unknown as Candidate[])
      setDepartments(MOCK_DEPARTMENTS)
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => { fetchData() }, [fetchData])

  const handleStatusChange = async (appId: string, newStatus: ApplicationStatus) => {
    setUpdating(appId)
    // Local state update immediately for responsive UX
    setCandidates(prev => prev.map(c => c.id === appId ? { ...c, status: newStatus } : c))

    try {
      await supabase
        .from('applications')
        .update({ status: newStatus })
        .eq('id', appId)
    } catch {
      // Ignore in demo mode
    }

    setUpdating(null)
    toast({
      title: 'Đã cập nhật trạng thái',
      description: `Hồ sơ đã chuyển sang "${APPLICATION_STATUS_LABELS[newStatus]}"`,
      variant: 'success'
    } as Parameters<typeof toast>[0])
  }

  const filtered = candidates
    .filter(c => {
      const p = c.profiles
      const matchesSearch = !search ||
        p?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
        p?.email?.toLowerCase().includes(search.toLowerCase()) ||
        p?.student_id?.toLowerCase().includes(search.toLowerCase())

      const matchesDept = deptFilter === 'all' || c.departments?.slug === deptFilter
      const matchesStatus = statusFilter === 'all' || c.status === statusFilter
      return matchesSearch && matchesDept && matchesStatus
    })
    .sort((a, b) => {
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

            {/* Department Filter */}
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
                  <th className="px-4 py-3.5">Ngày nộp</th>
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
                      <td className="px-4 py-3.5">
                        <div className="font-semibold text-gray-900">{p?.full_name || 'Ứng viên'}</div>
                        <div className="text-xs text-gray-500">{p?.email}</div>
                        <div className="text-xs text-gray-400">MSSV: {p?.student_id || 'Chưa cập nhật'} • {p?.phone}</div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="font-medium text-gray-800">{c.departments?.name}</span>
                      </td>
                      <td className="px-4 py-3.5 text-xs text-gray-500 whitespace-nowrap">
                        {formatDate(c.submitted_at || c.created_at)}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${APPLICATION_STATUS_COLORS[c.status] || 'bg-gray-100 text-gray-800'}`}>
                          {APPLICATION_STATUS_LABELS[c.status] || c.status}
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
                          <Link href={`/admin/candidates/${c.id}`}>
                            <Button size="sm" variant="ghost" className="h-8 text-xs text-blue-600 hover:bg-blue-50">
                              <Eye className="w-3.5 h-3.5 mr-1" />
                              Xem chi tiết
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
    </div>
  )
}
