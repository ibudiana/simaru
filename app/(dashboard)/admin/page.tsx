import prisma from '@/lib/prisma'
import { StatsCard } from '@/components/StatsCard'
import { ArrowRight, LayoutDashboard, History, Settings } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

import { verifySession } from '@/lib/session'
import { redirect } from 'next/navigation'

export default async function AdminDashboard() {
  const session = await verifySession()
  if (!session?.userId || !['AGGREGATOR', 'SUPER_ADMIN'].includes(session.role)) redirect('/login')

  const pendingReservations = await prisma.approvalWorkflow.count({
    where: { 
      approverId: session.userId,
      status: 'PENDING' 
    }
  })
  
  const totalRooms = await prisma.room.count()
  const totalUsers = await prisma.user.count()

  const quickActions = [
    { name: 'Tinjau Reservasi', href: '/admin/reservations', icon: LayoutDashboard, color: 'text-blue-600', bg: 'bg-blue-50' },
    { name: 'Data Master Ruangan', href: '/admin/rooms', icon: Settings, color: 'text-purple-600', bg: 'bg-purple-50' },
    { name: 'Laporan Aktivitas', href: '/admin/reports', icon: History, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  ]

  return (
    <div className="space-y-10">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-zinc-900">Pusat Kendali Admin</h1>
          <p className="text-lg text-muted-foreground mt-2">Monitor seluruh aktivitas aset dan reservasi universitas secara terpadu.</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <StatsCard 
          title="Reservasi Tertunda" 
          value={pendingReservations} 
          icon="clock" 
          description="Menunggu verifikasi"
        />
        <StatsCard 
          title="Total Ruangan" 
          value={totalRooms} 
          icon="building" 
          description="Aset terdaftar"
        />
        <StatsCard 
          title="Total Pengguna" 
          value={totalUsers} 
          icon="users" 
          description="Sivitas aktif"
        />
      </div>

      {/* Quick Access Section */}
      <div className="grid gap-6 md:grid-cols-3">
        {quickActions.map((action) => (
          <Link key={action.href} href={action.href} className="group">
            <Card className="border-none shadow-sm hover:shadow-md transition-all duration-300 bg-white/50 backdrop-blur-sm overflow-hidden group-hover:-translate-y-1">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className={`p-3 rounded-2xl ${action.bg} ${action.color} group-hover:scale-110 transition-transform duration-300`}>
                    <action.icon className="h-6 w-6" />
                  </div>
                  <ArrowRight className="h-5 w-5 text-zinc-300 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                </div>
                <h4 className="mt-4 font-bold text-zinc-900">{action.name}</h4>
                <p className="text-xs text-zinc-500 mt-1">Akses cepat ke modul manajemen</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
