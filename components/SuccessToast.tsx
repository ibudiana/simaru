'use client'

import { useEffect } from 'react'
import { toast } from 'sonner'
import { useRouter, useSearchParams } from 'next/navigation'

export function SuccessToast() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const success = searchParams.get('success')

  useEffect(() => {
    if (success === 'true') {
      toast.success('Reservasi berhasil diajukan! Bagian Sarana Prasarana akan segera meninjau permohonan Anda.', {
        id: 'reservation-success',
        duration: 5000,
      })
      
      // Clean up the URL
      const newParams = new URLSearchParams(searchParams.toString())
      newParams.delete('success')
      const newUrl = window.location.pathname + (newParams.toString() ? `?${newParams.toString()}` : '')
      router.replace(newUrl)
    }
  }, [success, searchParams, router])

  return null
}
