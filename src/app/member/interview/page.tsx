'use client'
import { MOCK_INTERVIEW_SLOTS } from '@/lib/mock-data'
import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/use-toast'
import { Calendar, Clock, MapPin, Video, CheckCircle, Loader2, Users } from 'lucide-react'
import { formatDate } from '@/lib/utils'

export default function MemberInterviewPage() {
  const supabase = createClient()
  const { toast } = useToast()
  const [slots, setSlots] = useState<any[]>([])
  const [myInterview, setMyInterview] = useState<any>(null)
  const [application, setApplication] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [booking, setBooking] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setApplication({
        id: 'app-01',
        status: 'interview_scheduled',
        department_id: 'dept-1'
      })
      setMyInterview({
        id: 'iv-01',
        status: 'scheduled',
        interview_slots: {
          interview_date: '2026-09-12',
          start_time: '08:30',
          end_time: '10:00',
          format: 'offline',
          location: 'Phòng Hội đồng 302, Nhà C, VNU-IS (Làng Sinh viên HACINCO)',
        }
      })
      setSlots(MOCK_INTERVIEW_SLOTS as any)
      setLoading(false)
      return
    }

    const { data: app } = await supabase
      .from('applications')
      .select('id, status, department_id')
      .eq('user_id', user.id)
      .single()

    setApplication(app)

    if (app) {
      const { data: iv } = await supabase
        .from('interviews')
        .select('*, interview_slots(*)')
        .eq('application_id', app.id)
        .single()
      setMyInterview(iv)

      // Load available slots for their department
      const { data: availableSlots } = await supabase
        .from('interview_slots')
        .select('*')
        .eq('department_id', app.department_id)
        .eq('is_active', true)
        .gt('current_candidates', -1)
        .order('interview_date')
        .order('start_time')
      setSlots(availableSlots || [])
    }
    setLoading(false)
  }, [supabase])

  useEffect(() => { fetchData() }, [fetchData])

  const bookSlot = async (slotId: string) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setBooking(slotId)
      setTimeout(() => {
        setBooking(null)
        toast({
          title: 'Đã đặt ca phỏng vấn thành công (Demo)!',
          description: 'Hệ thống đã ghi nhận lịch phỏng vấn của bạn.',
          variant: 'success'
        } as Parameters<typeof toast>[0])
      }, 600)
      return
    }
    setBooking(slotId)

    // Check if slot still available
    const { data: slot } = await supabase.from('interview_slots').select('current_candidates, max_candidates').eq('id', slotId).single()
    if (!slot || slot.current_candidates >= slot.max_candidates) {
      toast({ title: 'Slot đã đầy', description: 'Vui lòng chọn slot khác.', variant: 'destructive' })
      setBooking(null); return
    }

    // Create interview
    const { error } = await supabase.from('interviews').insert({
      application_id: application.id,
      slot_id: slotId,
      user_id: user.id,
      status: 'scheduled',
      confirmed_at: new Date().toISOString(),
    })

    if (error) {
      toast({ title: 'Lỗi', description: error.message, variant: 'destructive' })
      setBooking(null); return
    }

    // Update slot count
    await supabase.from('interview_slots').update({ current_candidates: slot.current_candidates + 1 }).eq('id', slotId)

    // Update application status
    await supabase.from('applications').update({ status: 'interview_scheduled' }).eq('id', application.id)

    // Send notification
    await supabase.from('notifications').insert({
      user_id: user.id,
      title: '📅 Đã đặt lịch phỏng vấn',
      message: 'Bạn đã đặt lịch phỏng vấn thành công. Vui lòng đến đúng giờ!',
      type: 'success',
    })

    toast({ title: '✅ Đặt lịch thành công!', description: 'Lịch phỏng vấn đã được xác nhận.' } as Parameters<typeof toast>[0])
    setBooking(null)
    fetchData()
  }

  if (loading) return <div className="flex items-center justify-center min-h-[400px]"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>

  if (!application || application.status === 'draft' || application.status === 'submitted' || application.status === 'received' || application.status === 'reviewing') {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-black text-gray-900">Lịch phỏng vấn</h1>
        <Card className="text-center py-12">
          <CardContent>
            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-lg font-bold text-gray-700 mb-2">Chưa đến vòng phỏng vấn</h2>
            <p className="text-gray-500 text-sm">Hồ sơ của bạn đang được xem xét. Sau khi được duyệt, bạn sẽ có thể chọn lịch phỏng vấn tại đây.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (myInterview) {
    const slot = myInterview.interview_slots
    return (
      <div className="space-y-6 animate-fade-in">
        <h1 className="text-2xl font-black text-gray-900">Lịch phỏng vấn</h1>
        <Card className="border-l-4 border-l-green-500">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              Đã đặt lịch phỏng vấn
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-blue-600" />
                <div>
                  <div className="text-xs text-gray-500">Ngày</div>
                  <div className="font-bold">{formatDate(slot?.interview_date)}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-blue-600" />
                <div>
                  <div className="text-xs text-gray-500">Giờ</div>
                  <div className="font-bold">{slot?.start_time?.slice(0,5)} — {slot?.end_time?.slice(0,5)}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {slot?.format === 'online' ? <Video className="w-5 h-5 text-purple-600" /> : <MapPin className="w-5 h-5 text-red-500" />}
                <div>
                  <div className="text-xs text-gray-500">Hình thức</div>
                  <div className="font-bold">{slot?.format === 'online' ? 'Online' : 'Offline'}</div>
                </div>
              </div>
              {slot?.format === 'offline' && slot?.location && (
                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-gray-400" />
                  <div>
                    <div className="text-xs text-gray-500">Địa điểm</div>
                    <div className="font-bold">{slot.location}</div>
                  </div>
                </div>
              )}
            </div>
            {slot?.meeting_url && (
              <div className="mt-4 p-3 bg-purple-50 border border-purple-100 rounded-xl">
                <div className="text-xs text-purple-600 font-semibold mb-1">Link tham gia phỏng vấn</div>
                <a href={slot.meeting_url} target="_blank" rel="noopener noreferrer" className="text-sm text-purple-700 hover:underline break-all">
                  {slot.meeting_url}
                </a>
              </div>
            )}
            <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl p-3 text-amber-800 text-sm">
              ⏰ Vui lòng tham gia đúng giờ. Nếu có vấn đề, hãy liên hệ Ban Nhân sự.
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-black text-gray-900">Chọn lịch phỏng vấn</h1>
        <p className="text-gray-500 text-sm">Chọn một khung giờ phù hợp để tham gia phỏng vấn</p>
      </div>

      {slots.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Chưa có lịch phỏng vấn nào được tạo. Vui lòng liên hệ Ban Nhân sự.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {slots.map(slot => {
            const isFull = slot.current_candidates >= slot.max_candidates
            return (
              <Card key={slot.id} className={`transition-all ${isFull ? 'opacity-60' : 'hover:shadow-md border-blue-100'}`}>
                <CardContent className="py-4 flex items-center gap-4">
                  <div className="w-14 h-14 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
                    {slot.format === 'online' ? <Video className="w-6 h-6 text-blue-600" /> : <MapPin className="w-6 h-6 text-blue-600" />}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-gray-900">{formatDate(slot.interview_date)}</span>
                      <span className="text-blue-700 font-semibold">{slot.start_time?.slice(0,5)} — {slot.end_time?.slice(0,5)}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-gray-500">
                      <Badge variant={slot.format === 'online' ? 'secondary' : 'outline'} className="text-xs">
                        {slot.format === 'online' ? 'Online' : 'Offline'}
                      </Badge>
                      {slot.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{slot.location}</span>}
                      <span className="flex items-center gap-1"><Users className="w-3 h-3" />{slot.current_candidates}/{slot.max_candidates} người</span>
                    </div>
                  </div>
                  <Button
                    onClick={() => bookSlot(slot.id)}
                    disabled={isFull || booking === slot.id}
                    variant={isFull ? 'outline' : 'default'}
                    size="sm"
                  >
                    {booking === slot.id ? <Loader2 className="w-4 h-4 animate-spin" /> : isFull ? 'Đã đầy' : 'Đặt lịch'}
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
