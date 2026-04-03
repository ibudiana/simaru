import prisma from '@/lib/prisma'
import { BookingForm } from '@/components/BookingForm'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface PageProps {
  searchParams: Promise<{ roomId?: string }>
}

export default async function BookRoomPage({ searchParams }: PageProps) {
  const { roomId } = await searchParams

  if (!roomId) {
    redirect('/requester')
  }

  const room = await prisma.room.findUnique({
    where: { id: parseInt(roomId, 10) },
    include: {
      facilities: { include: { facility: true } },
    }
  })

  if (!room) {
    redirect('/requester')
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reservasi: {room.name}</h1>
          <p className="text-muted-foreground mt-2">Lengkapi form berikut untuk mengajukan reservasi ruangan.</p>
        </div>
      </div>

      <Card>
        <CardHeader className="bg-muted/50 border-b">
          <CardTitle className="text-lg">Detail Ruangan</CardTitle>
          <CardDescription>
            {room.location} - Kapasitas: {room.capacity} orang
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <BookingForm roomId={room.id} />
        </CardContent>
      </Card>
      
    </div>
  )
}
