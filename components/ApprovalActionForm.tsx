'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Check, X, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface ApprovalActionFormProps {
  reservationId: number
  actionFn: (formData: FormData) => Promise<void>
  stageId: number
  rejectLabel?: string
  approveLabel?: string
  onSuccess?: () => void
}

export function ApprovalActionForm({ 
  reservationId, 
  actionFn, 
  stageId,
  rejectLabel = "Tolak",
  approveLabel = "Setujui",
  onSuccess
}: ApprovalActionFormProps) {
  const [isPending, setIsPending] = useState(false)

  const handleSubmit = async (formData: FormData) => {
    const action = formData.get('action') as string
    setIsPending(true)
    
    try {
      await actionFn(formData)
      toast.success(action === 'APPROVE' ? 'Permintaan berhasil disetujui' : 'Permintaan berhasil ditolak')
      if (onSuccess) onSuccess()
      // We don't necessarily need window.location.reload() if revalidatePath works, 
      // but sometimes Next.js cache is stubborn on client side.
      // However, revalidatePath should handle it.
    } catch (error: any) {
      toast.error(error.message || 'Gagal memproses permintaan')
    } finally {
      setIsPending(false)
    }
  }

  return (
    <form action={handleSubmit} className="space-y-4 flex-1">
      <input type="hidden" name="reservationId" value={reservationId} />
      <div className="space-y-2">
        <label htmlFor={`notes-${stageId}`} className="text-xs font-bold text-zinc-500 uppercase tracking-widest pl-1">
          Catatan Keputusan
        </label>
        <Input 
          id={`notes-${stageId}`} 
          name="notes" 
          className="rounded-xl bg-zinc-50/50 border-zinc-200 focus:bg-white transition-colors py-5"
          placeholder="Tuliskan alasan atau catatan tambahan..." 
        />
      </div>
      <div className="flex space-x-4 pt-2">
        <Button 
          type="submit" 
          name="action" 
          value="REJECT" 
          variant="ghost" 
          disabled={isPending}
          className="flex-1 rounded-xl text-rose-600 hover:text-rose-700 hover:bg-rose-50 border border-transparent hover:border-rose-100 font-bold"
        >
          {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4 mr-2" />}
          {rejectLabel}
        </Button>
        <Button 
          type="submit" 
          name="action" 
          value="APPROVE" 
          disabled={isPending}
          className="flex-2 rounded-xl bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 font-bold px-8"
        >
          {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4 mr-2" />}
          {approveLabel}
        </Button>
      </div>
    </form>
  )
}
