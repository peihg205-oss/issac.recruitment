"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Key } from "lucide-react"
import { CandidateAccountModal } from "./candidate-account-modal"

export function CandidateDetailAccountBtn({ candidate }: { candidate: any }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="h-9 px-3 text-xs font-bold text-amber-800 border-amber-300 bg-amber-50 hover:bg-amber-100/80 gap-1.5 shadow-2xs"
      >
        <Key className="w-4 h-4 text-amber-600" />
        <span>Mật khẩu & Tài khoản</span>
      </Button>

      <CandidateAccountModal
        candidate={candidate}
        open={open}
        onOpenChange={setOpen}
        onCandidateDeleted={() => {
          router.push("/admin/candidates")
          router.refresh()
        }}
      />
    </>
  )
}
