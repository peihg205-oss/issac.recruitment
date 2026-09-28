"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { CheckCircle, XCircle, Loader2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/components/ui/use-toast"
import { type ApplicationStatus } from "@/types/database"

interface CandidateDetailReviewActionsProps {
  applicationId: string
  candidateUserId?: string
  candidateName: string
  initialStatus: ApplicationStatus | string
}

export function CandidateDetailReviewActions({
  applicationId,
  candidateUserId,
  candidateName,
  initialStatus,
}: CandidateDetailReviewActionsProps) {
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()
  const [status, setStatus] = useState<string>(initialStatus)
  const [updating, setUpdating] = useState(false)

  const handleUpdate = async (newStatus: "approved" | "rejected") => {
    setUpdating(true)
    try {
      await supabase
        .from("applications")
        .update({ status: newStatus })
        .eq("id", applicationId)

      setStatus(newStatus)

      if (candidateUserId) {
        const title =
          newStatus === "approved"
            ? "Chúc mừng! Hồ sơ của bạn đã được Duyệt"
            : "Thông báo kết quả Vòng 1: Hồ sơ chưa phù hợp"
        const message =
          newStatus === "approved"
            ? "Hội đồng Tuyển quân đã thông qua hồ sơ vòng 1 của bạn. Bạn đã đủ điều kiện tham gia vòng phỏng vấn tiếp theo!"
            : "Hội đồng Tuyển quân iSSAC rất tiếc phải thông báo hồ sơ của bạn chưa đáp ứng đủ điều kiện để đi tiếp vào Vòng Phỏng vấn."
        const action_url =
          newStatus === "approved" ? "/member/interview" : "/member/dashboard"

        await supabase.from("notifications").insert({
          user_id: candidateUserId,
          title,
          message,
          type: newStatus === "approved" ? "success" : "error",
          action_url,
          is_read: false,
        })

        if (typeof window !== "undefined") {
          localStorage.setItem(`issac_app_status_${applicationId}`, newStatus)
          localStorage.setItem(`issac_app_status_user_${candidateUserId}`, newStatus)
        }
      }

      toast({
        title: newStatus === "approved" ? "Đã duyệt hồ sơ" : "Đã từ chối hồ sơ",
        description:
          newStatus === "approved"
            ? `Ứng viên ${candidateName} đã được duyệt đi tiếp vào Vòng Phỏng vấn.`
            : `Ứng viên ${candidateName} đã được đánh dấu không đạt Vòng 1.`,
      })

      router.refresh()
    } catch (err: any) {
      toast({
        title: "Lỗi cập nhật",
        description: err.message || "Không thể cập nhật trạng thái hồ sơ.",
        variant: "destructive",
      })
    } finally {
      setUpdating(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      {status !== "approved" && (
        <Button
          size="sm"
          variant="outline"
          className="h-9 px-3.5 text-xs font-bold text-green-700 border-green-300 hover:bg-green-50 shadow-2xs cursor-pointer"
          onClick={() => handleUpdate("approved")}
          disabled={updating}
        >
          {updating ? (
            <Loader2 className="w-4 h-4 mr-1.5 animate-spin text-green-600" />
          ) : (
            <CheckCircle className="w-4 h-4 mr-1.5 text-green-600" />
          )}
          <span>{status === "rejected" ? "Duyệt lại" : "Duyệt hồ sơ"}</span>
        </Button>
      )}

      {status !== "rejected" && (
        <Button
          size="sm"
          variant="outline"
          className="h-9 px-3.5 text-xs font-bold text-rose-700 border-rose-300 hover:bg-rose-50 shadow-2xs cursor-pointer"
          onClick={() => handleUpdate("rejected")}
          disabled={updating}
        >
          {updating ? (
            <Loader2 className="w-4 h-4 mr-1.5 animate-spin text-rose-600" />
          ) : (
            <XCircle className="w-4 h-4 mr-1.5 text-rose-600" />
          )}
          <span>Từ chối</span>
        </Button>
      )}
    </div>
  )
}
