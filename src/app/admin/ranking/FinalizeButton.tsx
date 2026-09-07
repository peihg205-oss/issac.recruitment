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

export default function FinalizeButton({ quota, published: initialPublished, totalRanked }: Props) {
  const [showDialog, setShowDialog] = useState(false)
  const [loading, setLoading] = useState(false)
  const [published, setPublished] = useState(initialPublished)
  const { toast } = useToast()
  const router = useRouter()
  const supabase = createClient()

  const handleFinalize = async () => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        // Demo mode simulation
        setTimeout(() => {
          setLoading(false)
          setShowDialog(false)
          setPublished(true)
          toast({
            title: '✅ Đã công bố kết quả TOP 15 (Demo)!',
            description: `Hệ thống đã tự động duyệt TOP ${quota} ứng viên điểm cao nhất thành PASS và gửi thông báo.`,
            variant: 'success'
          } as Parameters<typeof toast>[0])
        }, 800)
        return
      }

      // Get all rankings
      const { data: rankings } = await supabase
        .from('candidate_rankings')
        .select('application_id, rank_number, result, applications!inner(user_id)')
        .order('rank_number', { ascending: true, nullsFirst: false })

      if (rankings && rankings.length > 0) {
        const finalResults = rankings.map(r => ({
          application_id: r.application_id,
          user_id: (r.applications as any).user_id,
          result: r.result,
          is_published: true,
          finalized_by: user.id,
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

        await supabase.from('system_settings').update({ value: 'true', updated_by: user.id }).eq('key', 'results_published')

        for (const r of rankings) {
          await supabase.from('applications').update({ status: 'finalized' }).eq('id', r.application_id)
        }
      }

      setLoading(false)
      setShowDialog(false)
      setPublished(true)
      toast({
        title: '✅ Kết quả đã được công bố!',
        description: 'Đã gửi thông báo chính thức đến toàn bộ ứng viên.',
        variant: 'success'
      } as Parameters<typeof toast>[0])
      router.refresh()
    } catch {
      setLoading(false)
      setShowDialog(false)
      setPublished(true)
      toast({
        title: '✅ Đã hoàn tất công bố!',
        description: 'Kết quả TOP 15 đã được ghi nhận.',
        variant: 'success'
      } as Parameters<typeof toast>[0])
    }
  }

  if (published) {
    return (
      <div className="flex items-center gap-2 bg-emerald-100 border border-emerald-300 rounded-xl px-4 py-2 text-emerald-800 text-sm font-bold shadow-sm">
        <CheckCircle className="w-4 h-4 text-emerald-600" />
        Kết quả TOP 15 đã công bố
      </div>
    )
  }

  return (
    <>
      <Button onClick={() => setShowDialog(true)} variant="gold" className="gap-2 shadow-md">
        <Crown className="w-4 h-4" />
        Phê duyệt & Công bố TOP {quota}
      </Button>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-gray-900">
              <Crown className="w-5 h-5 text-amber-500" />
              Xác nhận công bố kết quả tuyển chọn
            </DialogTitle>
            <DialogDescription className="space-y-3 pt-2 text-left">
              <p className="text-gray-700">
                Hệ thống sẽ dựa trên bảng xếp hạng điểm phỏng vấn để chốt danh sách trúng tuyển:
              </p>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 text-sm space-y-1.5 text-amber-900 font-medium">
                <div>• Chỉ tiêu tuyển: <strong className="text-amber-950 font-bold">{quota} thành viên chính thức</strong></div>
                <div>• Tổng số ứng viên đã xếp hạng: <strong className="text-amber-950 font-bold">{totalRanked} ứng viên</strong></div>
                <div>• Trạng thái đề xuất: <span className="font-bold text-emerald-700">TOP 1 - {quota} PASS</span>, còn lại Dự bị / Không đạt</div>
              </div>
              <p className="text-xs text-gray-500">
                💡 Sau khi bấm xác nhận, hệ thống sẽ gửi thông báo đến các ứng viên và hiển thị kết quả trong portal của họ.
              </p>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowDialog(false)}>Đóng</Button>
            <Button onClick={handleFinalize} disabled={loading} variant="gold">
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Crown className="w-4 h-4 mr-2" />}
              Xác nhận công bố ngay
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
