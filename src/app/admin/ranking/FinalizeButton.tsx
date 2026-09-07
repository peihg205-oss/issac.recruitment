'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/components/ui/use-toast'
import { useRouter } from 'next/navigation'
import { Crown, Loader2, CheckCircle } from 'lucide-react'

interface Props {
  quota: number
  published: boolean
  totalRanked: number
}

export default function FinalizeButton({ quota, published, totalRanked }: Props) {
  const [showDialog, setShowDialog] = useState(false)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  const router = useRouter()
  const supabase = createClient()

  const handleFinalize = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()

    // Get all rankings
    const { data: rankings } = await supabase
      .from('candidate_rankings')
      .select('application_id, rank_number, result, applications!inner(user_id)')
      .order('rank_number', { ascending: true, nullsFirst: false })

    if (!rankings) { setLoading(false); return }

    // Create/update final_results
    const finalResults = rankings.map(r => ({
      application_id: r.application_id,
      user_id: (r.applications as any).user_id,
      result: r.result,
      is_published: true,
      finalized_by: user!.id,
      finalized_at: new Date().toISOString(),
      published_at: new Date().toISOString(),
      announcement_message: r.result === 'pass'
        ? 'Chúc mừng! Bạn đã trở thành thành viên chính thức của iSSAC!'
        : r.result === 'waitlist'
        ? 'Bạn đang ở danh sách dự bị. Chúng tôi sẽ liên hệ nếu có vị trí phù hợp.'
        : 'Cảm ơn bạn đã tham gia tuyển thành viên iSSAC. Chúc bạn may mắn trong tương lai!',
    }))

    for (const fr of finalResults) {
      await supabase.from('final_results').upsert(fr, { onConflict: 'application_id' })
    }

    // Update results_published setting
    await supabase.from('system_settings').update({ value: 'true', updated_by: user!.id }).eq('key', 'results_published')

    // Update application statuses
    for (const r of rankings) {
      await supabase.from('applications').update({ status: 'finalized' }).eq('id', r.application_id)
    }

    // Send notifications to all candidates
    for (const r of rankings) {
      const userId = (r.applications as any).user_id
      await supabase.from('notifications').insert({
        user_id: userId,
        title: r.result === 'pass' ? '🎉 Chúc mừng bạn đã đạt!' : 'Kết quả tuyển thành viên iSSAC',
        message: r.result === 'pass'
          ? 'Bạn đã trở thành thành viên chính thức của iSSAC! Vui lòng xem chi tiết trong mục Kết quả.'
          : 'Kết quả tuyển thành viên đã được công bố. Vui lòng xem chi tiết trong mục Kết quả.',
        type: r.result === 'pass' ? 'success' : 'info',
        action_url: '/member/result',
      })
    }

    // Audit log
    await supabase.from('audit_logs').insert({
      user_id: user!.id,
      action: 'FINALIZE_RESULTS',
      description: `Finalized recruitment results for ${rankings.length} candidates (quota: ${quota})`,
    })

    setLoading(false)
    setShowDialog(false)
    toast({ title: '✅ Kết quả đã được công bố!', description: `Đã gửi thông báo đến ${rankings.length} ứng viên.` } as Parameters<typeof toast>[0])
    router.refresh()
  }

  if (published) {
    return (
      <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-4 py-2 text-green-700 text-sm font-semibold">
        <CheckCircle className="w-4 h-4" />
        Kết quả đã công bố
      </div>
    )
  }

  return (
    <>
      <Button onClick={() => setShowDialog(true)} variant="gold" className="gap-2">
        <Crown className="w-4 h-4" />
        Xác nhận & Công bố kết quả
      </Button>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Crown className="w-5 h-5 text-amber-500" />
              Xác nhận công bố kết quả
            </DialogTitle>
            <DialogDescription className="space-y-2 pt-2">
              <p>Bạn đang xác nhận kết quả tuyển thành viên iSSAC 2026.</p>
              <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-sm space-y-1">
                <div>• Chỉ tiêu: <strong>{quota} người</strong></div>
                <div>• Tổng ứng viên được xếp hạng: <strong>{totalRanked}</strong></div>
              </div>
              <p className="text-red-600 font-semibold">
                ⚠️ Sau khi xác nhận, ứng viên sẽ nhận được thông báo và có thể xem kết quả. Hành động này không thể hoàn tác.
              </p>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Huỷ</Button>
            <Button onClick={handleFinalize} disabled={loading} variant="gold">
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Crown className="w-4 h-4 mr-2" />}
              Xác nhận công bố
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
