'use client'

import { useActionState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { submitReservation } from '@/app/actions/reservation'
import { CalendarIcon, Clock, Link as LinkIcon, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useEffect } from 'react'
import { toast } from 'sonner'

interface BookingFormProps {
  roomId: number
}

export function BookingForm({ roomId }: BookingFormProps) {
  const [state, action, isPending] = useActionState(submitReservation, null)
  
  useEffect(() => {
    if (state?.error) {
      toast.error(state.error)
    }
  }, [state])

  return (
    <form action={action} className="space-y-6">
      <input type="hidden" name="roomId" value={roomId} />
      
      <input type="hidden" name="roomId" value={roomId} />

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="purpose" className="text-base">Tujuan Penggunaan <span className="text-destructive">*</span></Label>
          <Input 
            id="purpose" 
            name="purpose" 
            placeholder="Misal: Seminar Proposal Skripsi, Rapat HIMA, Kuliah Pengganti" 
            required 
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="date" className="flex items-center">
              <CalendarIcon className="w-4 h-4 mr-2" />
              Tanggal Reservasi <span className="text-destructive ml-1">*</span>
            </Label>
            <Input 
              type="date" 
              id="date" 
              name="date" 
              required 
              min={new Date().toISOString().split('T')[0]} 
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startTime" className="flex items-center">
                <Clock className="w-4 h-4 mr-2" />
                Waktu Mulai <span className="text-destructive ml-1">*</span>
              </Label>
              <Input type="time" id="startTime" name="startTime" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endTime" className="flex items-center">
                <Clock className="w-4 h-4 mr-2" />
                Waktu Selesai <span className="text-destructive ml-1">*</span>
              </Label>
              <Input type="time" id="endTime" name="endTime" required />
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center bg-blue-50 text-blue-800 p-4 rounded-md text-sm">
        <LinkIcon className="h-5 w-5 shrink-0 text-blue-500 mr-2" />
        <p>Pengajuan Anda akan ditinjau oleh Bagian Sarana Prasarana terlebih dahulu sebelum diteruskan ke Kaprodi.</p>
      </div>

      <div className="flex justify-end space-x-4 pt-4">
        <Link href="/requester">
          <Button type="button" variant="outline" disabled={isPending}>Batal</Button>
        </Link>
        <Button type="submit" disabled={isPending}>
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Ajukan Reservasi
        </Button>
      </div>
    </form>
  )
}
