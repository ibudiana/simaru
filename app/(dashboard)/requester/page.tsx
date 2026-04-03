import prisma from '@/lib/prisma'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Building, Users, Info, ArrowRight, CheckCircle2, Clock, Calendar } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { StatsCard } from '@/components/StatsCard'
import { verifySession } from '@/lib/session'

export default async function RequesterDashboard() {
  const session = await verifySession()
  const rooms = await prisma.room.findMany({
    include: {
      facilities: {
        include: { facility: true }
      }
    }
  })

  // Fetch Stats
  const totalRooms = rooms.length
  const myReservations = await prisma.reservation.count({
    where: { userId: session?.userId }
  })
  const pendingReservations = await prisma.reservation.count({
    where: { 
      userId: session?.userId,
      status: 'PENDING'
    }
  })

  return (
    <div className="space-y-10">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-zinc-900">Eksplorasi Ruangan</h1>
          <p className="text-lg text-muted-foreground mt-2">Temukan dan reservasi ruang kerja terbaik untuk aktivitas Anda.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/requester/reservations">
            <Button variant="outline" className="rounded-xl px-6">
              Riwayat Saya
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid gap-6 md:grid-cols-3">
        <StatsCard 
          title="Total Ruangan" 
          value={totalRooms} 
          icon="building" 
          description="Tersedia di seluruh gedung"
        />
        <StatsCard 
          title="Reservasi Saya" 
          value={myReservations} 
          icon="calendar" 
          description="Semua riwayat"
          trend={{ value: "+3", positive: true }}
        />
        <StatsCard 
          title="Status Menunggu" 
          value={pendingReservations} 
          icon="clock" 
          description="Sedang diproses"
        />
      </div>

      {/* Main Grid Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
          <h2 className="text-xl font-bold text-zinc-800">Daftar Ruangan Tersedia</h2>
          <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 px-3 py-1">
            <CheckCircle2 className="w-3 h-3 mr-1.5" />
            Live Update
          </Badge>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {rooms.map((room) => (
            <Card key={room.id} className="group overflow-hidden border-none shadow-sm hover:shadow-xl transition-all duration-300 bg-white rounded-2xl flex flex-col h-full">
              <div className="h-48 bg-zinc-100 flex items-center justify-center relative overflow-hidden">
                <Building className="h-20 w-20 text-zinc-200 group-hover:scale-110 group-hover:text-primary/10 transition-transform duration-500" />
                <div className="absolute inset-0 bg-linear-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <Badge className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm text-zinc-900 border-none shadow-sm font-bold" variant="outline">
                  {room.capacity} Pax
                </Badge>
              </div>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-xl font-bold group-hover:text-primary transition-colors">{room.name}</CardTitle>
                </div>
                <CardDescription className="flex items-center text-zinc-500">
                  <Info className="w-3 h-3 mr-1" />
                  {room.location}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col justify-between pt-0 mt-4">
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-1.5">
                    {room.facilities.map((rf) => (
                      <span key={rf.facilityId} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-zinc-100 text-zinc-600 border border-zinc-200">
                        {rf.facility.name}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="mt-8">
                  <Link href={`/requester/book?roomId=${room.id}`}>
                    <Button className="w-full rounded-xl py-6 font-bold shadow-lg shadow-primary/20 group-hover:translate-y-[-2px] transition-transform">
                      Mulai Reservasi
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}

          {rooms.length === 0 && (
            <div className="col-span-full py-20 flex flex-col items-center justify-center bg-zinc-50 rounded-3xl border-2 border-dashed border-zinc-200">
              <Building className="h-16 w-16 text-zinc-300 mb-4" />
              <p className="text-zinc-500 font-medium">Maaf, saat ini tidak ada ruangan yang dapat ditampilkan.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
