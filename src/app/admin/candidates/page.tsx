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
  ArrowUpDown, Users, Loader2, ChevronRight
} from 'lucide-react'
import Link from 'next/link'
import { APPLICATION_STATUS_LABELS, APPLICATION_STATUS_COLORS, formatDate, exportToCSV } from '@/lib/utils'
import { useToast } from '@/components/ui/use-toast'
import { type ApplicationStatus } from '@/types/database'

interface Candidate {
  id: string
  status: ApplicationStatus
  submitted_at: string | null
  created_at: string
  profiles: { full_name: string; email: string; student_id: string | null; phone: string | null }
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
    setCandidates((apps as unknown as Candidate[]) || [])
    setDepartments(depts || [])
    setLoading(false)
  }, [supabase])

  useEffect(() => { fetchData() }, [fetchData])

  const filtered = candidates
    .filter(c => {
      const matchSearch = !search ||
        c.profiles?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
        c.profiles?.email?.toLowerCase().includes(search.toLowerCase()) ||
        c.profiles?.student_id?.includes(search)
      const matchDept = deptFilter === 'all' || c.departments?.slug === deptFilter
      const matchStatus = statusFilter === 'all' || c.status === statusFilter
      return matchSearch && matchDept && matchStatus
    })
    .sort((a, b) => {
      let cmp = 0
      if (sortBy === 'name') cmp = (a.profiles?.full_name || '').localeCompare(b.profiles?.full_name || '')
      else if (sortBy === 'date') cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      else if (sortBy === 'score') cmp = (Number(a.candidate_rankings?.final_score) || 0) - (Number(b.candidate_rankings?.final_score) || 0)
      return sortDir === 'asc' ? cmp : -cmp
    })

  const toggleSort = (field: typeof sortBy) => {
    if (sortBy === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortBy(field); setSortDir('desc') }
  }

  const updateStatus = async (id: string, status: ApplicationStatus) => {
    setUpdating(id)
    const { error } = await supabase.from('applications').update({ status, reviewed_at: new Date().toISOString() }).eq('id', id)
    if (error) toast({ title: 'Lỗi', description: error.message, variant: 'destructive' })
    else { toast({ title: 'Cập nhật thành công', description: `Đã cập nhật trạng thái đơn.` } as Parameters<typeof toast>[0]); fetchData() }
    setUpdating(null)
  }

  const handleExport = () => {
    const data = filtered.map((c, i) => ({
      'STT': i + 1,
      'Họ tên': c.profiles?.full_name || '',
      'Email': c.profiles?.email || '',
      'MSSV': c.profiles?.student_id || '',
      'Ban': c.departments?.name || '',
      'Trạng thái': APPLICATION_STATUS_LABELS[c.status] || c.status,
      'Ngày nộp': formatDate(c.submitted_at),
      'Điểm': c.candidate_rankings?.final_score ?? '',
      'Xếp hạng': c.candidate_rankings?.rank_number ?? '',
      'Kết quả': c.candidate_rankings?.result ?? '',
    }))
    exportToCSV(data, 'candidates')
    toast({ title: 'Xuất CSV thành công!', description: `${filtered.length} ứng viên đã được xuất.` } as Parameters<typeof toast>[0])
  }

  const resultBadge = (result?: string) => {
    if (!result || result === 'pending') return null
    const map = { pass: 'success', waitlist: 'warning', fail: 'destructive' } as const
    const labels = { pass: 'Đạt', waitlist: 'Dự bị', fail: 'Không đạt' }
    return <Badge variant={map[result as keyof typeof map] || 'secondary'}>{labels[result as keyof typeof labels] || result}</Badge>
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Quản lý Ứng viên</h1>
          <p className="text-gray-500 text-sm mt-1">{candidates.length} ứng viên trong hệ thống</p>
        </div>
        <Button onClick={handleExport} variant="outline" className="gap-2">
          <Download className="w-4 h-4" /> Xuất CSV
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input placeholder="Tìm kiếm theo tên, email, MSSV..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Select value={deptFilter} onValueChange={setDeptFilter}>
              <SelectTrigger className="w-full sm:w-44"><SelectValue placeholder="Tất cả ban" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả ban</SelectItem>
                {departments.map(d => <SelectItem key={d.id} value={d.slug}>{d.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48"><SelectValue placeholder="Tất cả trạng thái" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả trạng thái</SelectItem>
                {Object.entries(APPLICATION_STATUS_LABELS).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16">
              <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">Không tìm thấy ứng viên nào.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/50">
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 w-10">#</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500">
                      <button onClick={() => toggleSort('name')} className="flex items-center gap-1 hover:text-gray-700">
                        Ứng viên <ArrowUpDown className="w-3 h-3" />
                      </button>
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 hidden md:table-cell">MSSV</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500">Ban</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500">Trạng thái</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 hidden lg:table-cell">
                      <button onClick={() => toggleSort('score')} className="flex items-center gap-1 hover:text-gray-700">
                        Điểm / Hạng <ArrowUpDown className="w-3 h-3" />
                      </button>
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 hidden lg:table-cell">Kết quả</th>
                    <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((c, i) => (
                    <tr key={c.id} className="border-b border-gray-50 hover:bg-blue-50/30 transition-colors">
                      <td className="py-3 px-4 text-sm text-gray-400">{i + 1}</td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-gray-900 text-sm">{c.profiles?.full_name || '—'}</div>
                        <div className="text-xs text-gray-500">{c.profiles?.email}</div>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600 hidden md:table-cell">{c.profiles?.student_id || '—'}</td>
                      <td className="py-3 px-4 hidden sm:table-cell">
                        <Badge variant="secondary" className="text-xs">{c.departments?.name || '—'}</Badge>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${APPLICATION_STATUS_COLORS[c.status] || 'bg-gray-100 text-gray-700'}`}>
                          {APPLICATION_STATUS_LABELS[c.status] || c.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 hidden lg:table-cell">
                        {c.candidate_rankings ? (
                          <div>
                            <div className="font-bold text-blue-700">{c.candidate_rankings.final_score?.toFixed(1) || '—'}</div>
                            <div className="text-xs text-gray-500">#{c.candidate_rankings.rank_number || '—'}</div>
                          </div>
                        ) : '—'}
                      </td>
                      <td className="py-3 px-4 hidden lg:table-cell">
                        {resultBadge(c.candidate_rankings?.result)}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-end gap-1">
                          {c.status === 'submitted' || c.status === 'received' ? (
                            <>
                              <button
                                onClick={() => updateStatus(c.id, 'approved')}
                                disabled={updating === c.id}
                                className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                title="Duyệt"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => updateStatus(c.id, 'rejected')}
                                disabled={updating === c.id}
                                className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                title="Từ chối"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            </>
                          ) : null}
                          <Link href={`/admin/candidates/${c.id}`}>
                            <button className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Xem chi tiết">
                              <Eye className="w-4 h-4" />
                            </button>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
