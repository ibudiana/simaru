import { PrismaClient } from '@prisma/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { FileSpreadsheet, Activity, CheckCircle, Clock } from 'lucide-react'
import { ProfessionalReportGenerator } from '@/components/ProfessionalReportGenerator'

const prisma = new PrismaClient()

export default async function AdminReportsPage() {
  const currentMonth = new Date().getMonth()
  const currentYear = new Date().getFullYear()

  // Get start and end of current month for summary stats
  const startDate = new Date(currentYear, currentMonth, 1)
  const endDate = new Date(currentYear, currentMonth + 1, 0)

  // Aggregations for report dashboard overview
  const [totalReservations, approvedReservations, pendingReservations] = await Promise.all([
    prisma.reservation.count({
      where: { schedule: { startTime: { gte: startDate, lte: endDate } } }
    }),
    prisma.reservation.count({
      where: { 
        status: 'APPROVED',
        schedule: { startTime: { gte: startDate, lte: endDate } }
      }
    }),
    prisma.reservation.count({
      where: { 
        status: 'PENDING',
        schedule: { startTime: { gte: startDate, lte: endDate } }
      }
    })
  ])

  return (
    <div className="space-y-10">
      {/* Header section with Stats flavor */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-zinc-900">Analitik & Laporan</h1>
          <p className="text-lg text-muted-foreground mt-2">Hasilkan data utilisasi ruangan yang akurat untuk mendukung pengambilan keputusan.</p>
        </div>
      </div>

      {/* Professional Generator - Now includes internal reactive stats */}
      <ProfessionalReportGenerator 
        initialStats={{
          total: totalReservations,
          approved: approvedReservations,
          pending: pendingReservations
        }} 
      />

      {/* Context info */}
      <div className="p-6 bg-zinc-50 rounded-3xl border border-dashed border-zinc-200">
        <div className="flex items-start gap-4">
          <div className="p-2 bg-white rounded-xl shadow-sm border">
            <FileSpreadsheet className="h-5 w-5 text-zinc-400" />
          </div>
          <div>
            <h3 className="font-bold text-zinc-900">Tentang Format Laporan</h3>
            <p className="text-sm mt-1 leading-relaxed text-zinc-600">
              Laporan yang dihasilkan mencakup rincian lengkap setiap reservasi, termasuk nama pemohon, organisasi, ruangan yang dipinjam, durasi waktu, hingga tujuan penggunaan. Format CSV memungkinkan Anda untuk melakukan analisis lebih lanjut menggunakan fitur Pivot Table atau Chart di Microsoft Excel atau Google Sheets.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
