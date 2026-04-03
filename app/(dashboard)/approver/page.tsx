import prisma from '@/lib/prisma'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { ListTodo, CheckCircle2, XCircle, Clock, ArrowRight, ShieldCheck } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { StatsCard } from '@/components/StatsCard'
import { Badge } from '@/components/ui/badge'

import { verifySession } from '@/lib/session'
import { redirect } from 'next/navigation'

export default async function ApproverDashboard() {
  const session = await verifySession()
  if (!session?.userId || session.role !== 'APPROVER') redirect('/login')

  const pendingApprovals = await prisma.approvalWorkflow.count({
    where: { 
      approverId: session.userId,
      status: 'PENDING' 
    }
  })

  const totalApproved = await prisma.approvalWorkflow.count({
    where: { 
      approverId: session.userId,
      status: 'APPROVED' 
    }
  })

  const totalRejected = await prisma.approvalWorkflow.count({
    where: { 
      approverId: session.userId,
      status: 'REJECTED' 
    }
  })

  return (
    <div className="space-y-10">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-zinc-900">Persetujuan Pimpinan</h1>
          <p className="text-lg text-muted-foreground mt-2">Berikan keputusan akhir untuk permintaan penggunaan aset universitas.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/approver/reservations">
            <Button size="lg" className="rounded-xl px-8 shadow-lg shadow-primary/20 font-bold group">
              Tinjau Permintaan
              <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Approver Stats Grid */}
      <div className="grid gap-6 md:grid-cols-3">
        <StatsCard 
          title="Menunggu Keputusan" 
          value={pendingApprovals} 
          icon="clock" 
          description="Aksi tertunda"
        />
        <StatsCard 
          title="Total Disetujui" 
          value={totalApproved} 
          icon="check" 
          description="Bulan ini"
          trend={{ value: "+12%", positive: true }}
        />
        <StatsCard 
          title="Total Ditolak" 
          value={totalRejected} 
          icon="x" 
          description="Permintaan ditampung"
        />
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <Card className="border-none shadow-sm bg-white rounded-3xl overflow-hidden group">
          <CardHeader className="bg-primary/10 border-b border-primary/5 pb-6">
            <div className="h-12 w-12 bg-primary/20 rounded-2xl flex items-center justify-center mb-4 text-primary">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <CardTitle className="text-xl font-bold">Integritas Reservasi</CardTitle>
            <CardDescription className="text-zinc-600">
              Setiap keputusan Anda berdampak pada kelancaran operasional akademik dan organisasi mahasiswa.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <ul className="space-y-4">
              <li className="flex items-start">
                <div className="h-5 w-5 bg-emerald-50 rounded-full flex items-center justify-center mr-3 mt-1 text-emerald-600">
                  <CheckCircle2 className="h-3 w-3" />
                </div>
                <p className="text-sm text-zinc-600">Verifikasi status pemohon sudah dilakukan oleh Admin Sarpras.</p>
              </li>
              <li className="flex items-start">
                <div className="h-5 w-5 bg-emerald-50 rounded-full flex items-center justify-center mr-3 mt-1 text-emerald-600">
                  <CheckCircle2 className="h-3 w-3" />
                </div>
                <p className="text-sm text-zinc-600">Pastikan tujuan penggunaan selaras dengan kebijakan universitas.</p>
              </li>
            </ul>
          </CardContent>
          <CardFooter className="bg-zinc-50 border-t border-zinc-100 p-4">
             <Badge variant="ghost" className="text-[10px] font-bold tracking-widest text-zinc-400 uppercase">
               Authorized Personnel Only
             </Badge>
          </CardFooter>
        </Card>

        {pendingApprovals > 0 ? (
          <div className="flex flex-col items-center justify-center p-12 bg-white rounded-3xl shadow-sm border border-zinc-100">
             <div className="h-20 w-20 bg-yellow-50 rounded-full flex items-center justify-center mb-6 relative">
                <ListTodo className="h-10 w-10 text-yellow-600" />
                <span className="absolute -top-1 -right-1 h-6 w-6 bg-rose-500 rounded-full flex items-center justify-center text-white text-xs font-bold ring-4 ring-white">
                  {pendingApprovals}
                </span>
             </div>
             <h3 className="text-xl font-bold text-zinc-800">Antrian Menunggu</h3>
             <p className="text-zinc-500 text-center mt-2 max-w-xs text-sm">
               Ada {pendingApprovals} permintaan reservasi yang sudah diverifikasi admin dan butuh restu Anda.
             </p>
             <Link href="/approver/reservations" className="mt-8 w-full">
               <Button className="w-full rounded-xl py-6 font-bold">
                 Buka Antrian Sekarang
               </Button>
             </Link>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-12 bg-zinc-50/50 rounded-3xl border-2 border-dashed border-zinc-100">
             <CheckCircle2 className="h-16 w-16 text-zinc-200 mb-4" />
             <p className="text-zinc-400 font-medium">Beban kerja Anda kosong hari ini.</p>
          </div>
        )}
      </div>
    </div>
  )
}
