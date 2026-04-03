'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { format, startOfWeek, endOfWeek } from 'date-fns'
import { id } from 'date-fns/locale'
import { CalendarIcon, Download, Loader2, FileSpreadsheet, Activity, CheckCircle, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getReportData, getReportStats } from '@/app/actions/admin'
import { toast } from 'sonner'
import { useEffect } from 'react'

export function ProfessionalReportGenerator({ initialStats }: { 
  initialStats: { total: number, approved: number, pending: number } 
}) {
  const [isDownloading, setIsDownloading] = useState(false)
  const [isStatsLoading, setIsStatsLoading] = useState(false)
  const [stats, setStats] = useState(initialStats)
  const [reportType, setReportType] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('monthly')
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  
  // For monthly/yearly
  const now = new Date()
  const [selectedMonth, setSelectedMonth] = useState<string>(now.getMonth().toString())
  const [selectedYear, setSelectedYear] = useState<string>(now.getFullYear().toString())

  const years = Array.from({ length: 5 }, (_, i) => (now.getFullYear() - i).toString())
  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ]

  // Reactive Stats Fetching
  useEffect(() => {
    const fetchStats = async () => {
      setIsStatsLoading(true)
      try {
        const filters = {
          type: reportType as any,
          date: selectedDate ? selectedDate.toISOString() : undefined,
          month: parseInt(selectedMonth, 10),
          year: parseInt(selectedYear, 10)
        }
        const newStats = await getReportStats(filters)
        setStats(newStats)
      } catch (error) {
        console.error('Failed to fetch stats:', error)
      } finally {
        setIsStatsLoading(false)
      }
    }

    fetchStats()
  }, [reportType, selectedDate, selectedMonth, selectedYear])

  const handleDownload = async () => {
    setIsDownloading(true)
    const toastId = toast.loading('Menyiapkan data laporan...')

    try {
      const filters = {
        type: reportType as any,
        date: selectedDate ? selectedDate.toISOString() : undefined,
        month: parseInt(selectedMonth, 10),
        year: parseInt(selectedYear, 10)
      }

      const data = await getReportData(filters)
      
      if (!data || data.length === 0) {
        toast.error('Tidak ada data reservasi untuk periode yang dipilih', { id: toastId })
        return
      }

      // Generate CSV manually
      const headers = Object.keys(data[0])
      const csvContent = [
        headers.join(','),
        ...data.map(row => 
          headers.map(header => {
            const cell = (row as any)[header]?.toString() || ''
            // Escape double quotes and wrap in quotes if contains comma
            return `"${cell.replace(/"/g, '""')}"`
          }).join(',')
        )
      ].join('\n')

      // Create blob and trigger download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      
      let filename = `Laporan_SIMARU_${reportType}`
      if (reportType === 'daily') filename += `_${format(selectedDate, 'yyyy-MM-dd')}`
      if (reportType === 'monthly') filename += `_${selectedYear}_${parseInt(selectedMonth) + 1}`
      
      link.setAttribute('href', url)
      link.setAttribute('download', `${filename}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      toast.success('Laporan berhasil diunduh!', { id: toastId })
    } catch (error: any) {
      console.error('Download error:', error)
      toast.error(error.message || 'Gagal mengunduh laporan', { id: toastId })
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* Summary Cards Grid - Now Reactive */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className={cn(
          "border-none shadow-sm rounded-3xl bg-white group hover:shadow-md transition-all text-zinc-900",
          isStatsLoading && "opacity-60"
        )}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-bold uppercase tracking-widest text-zinc-500">Total Reservasi</CardTitle>
            {isStatsLoading ? <Loader2 className="h-4 w-4 animate-spin text-zinc-300" /> : <Activity className="h-4 w-4 text-zinc-400 group-hover:text-primary transition-colors" />}
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black">{stats.total}</div>
            <p className="text-xs text-zinc-400 mt-1 uppercase tracking-tighter font-bold">Periode Terpilih</p>
          </CardContent>
        </Card>
        
        <Card className={cn(
          "border-none shadow-sm rounded-3xl bg-white group hover:shadow-md transition-all text-zinc-900",
          isStatsLoading && "opacity-60"
        )}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-bold uppercase tracking-widest text-zinc-500">Disetujui</CardTitle>
            <CheckCircle className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-emerald-600">{stats.approved}</div>
            <p className="text-xs text-zinc-400 mt-1 uppercase tracking-tighter font-bold">Berhasil Terjadwal</p>
          </CardContent>
        </Card>

        <Card className={cn(
          "border-none shadow-sm rounded-3xl bg-white group hover:shadow-md transition-all text-zinc-900",
          isStatsLoading && "opacity-60"
        )}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-bold uppercase tracking-widest text-zinc-500">Menunggu (Pending)</CardTitle>
            <Clock className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-amber-500">{stats.pending}</div>
            <p className="text-xs text-zinc-400 mt-1 uppercase tracking-tighter font-bold">Verifikasi Berjalan</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-xl bg-white rounded-3xl overflow-hidden">
      <CardHeader className="text-zync-900 px-6 pt-6 pb-10 space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-500 rounded-xl">
            <FileSpreadsheet className="h-6 w-6 text-white" />
          </div>

          <CardTitle className="text-2xl font-bold leading-tight">
            Generator Laporan
          </CardTitle>
        </div>

        <CardDescription className="text-zinc-400 text-base leading-relaxed max-w-md">
          Pilih kriteria dan periode laporan yang ingin Anda ekspor ke format Spreadsheet.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-8 space-y-8">
        <div className="grid gap-8 md:grid-cols-2">
          {/* report Type Selection */}
          <div className="space-y-3">
            <label className="text-sm font-bold uppercase tracking-widest text-zinc-500 ml-1">Tipe Laporan</label>
            <Select 
              value={reportType} 
              onValueChange={(val) => val && setReportType(val as any)}
            >
              <SelectTrigger className="rounded-2xl py-7 bg-zinc-50 border-zinc-200 w-full h-auto">
                <SelectValue placeholder="Pilih Tipe" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-none shadow-2xl">
                <SelectItem value="daily">Harian (Spesifik Tanggal)</SelectItem>
                <SelectItem value="weekly">Mingguan (7 Hari)</SelectItem>
                <SelectItem value="monthly">Bulanan</SelectItem>
                <SelectItem value="yearly">Tahunan</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Dynamic Filters */}
          <div className="space-y-3">
            <label className="text-sm font-bold uppercase tracking-widest text-zinc-500 ml-1">Periode Waktu</label>
            
            {(reportType === 'daily' || reportType === 'weekly') && (
              <Popover>
                <PopoverTrigger
                  render={
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full rounded-2xl py-7 justify-start text-left font-medium bg-zinc-50 border-zinc-200 h-auto",
                        !selectedDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-5 w-5 text-zinc-400" />
                      {selectedDate ? (
                        reportType === 'weekly' ? (
                          `Minggu: ${format(startOfWeek(selectedDate, { weekStartsOn: 1 }), 'dd MMM')} - ${format(endOfWeek(selectedDate, { weekStartsOn: 1 }), 'dd MMM yyyy')}`
                        ) : (
                          format(selectedDate, 'PPP', { locale: id })
                        )
                      ) : (
                        <span>Pilih Tanggal</span>
                      )}
                    </Button>
                  }
                />
                <PopoverContent className="w-auto p-0 rounded-3xl border-none shadow-2xl" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => date && setSelectedDate(date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            )}

            {reportType === 'monthly' && (
              <div className="grid grid-cols-2 gap-3">
                <Select 
                  value={selectedMonth} 
                  onValueChange={(val) => val !== null && setSelectedMonth(val)}
                >
                  <SelectTrigger className="rounded-2xl py-7 bg-zinc-50 border-zinc-200 h-auto">
                    <SelectValue placeholder="Bulan" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-none shadow-2xl">
                    {months.map((m, i) => (
                      <SelectItem key={i} value={i.toString()}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select 
                  value={selectedYear} 
                  onValueChange={(val) => val !== null && setSelectedYear(val)}
                >
                  <SelectTrigger className="rounded-2xl py-7 bg-zinc-50 border-zinc-200 h-auto">
                    <SelectValue placeholder="Tahun" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-none shadow-2xl">
                    {years.map(y => (
                      <SelectItem key={y} value={y}>{y}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {reportType === 'yearly' && (
              <Select 
                value={selectedYear} 
                onValueChange={(val) => val !== null && setSelectedYear(val)}
              >
                <SelectTrigger className="rounded-2xl py-7 bg-zinc-50 border-zinc-200 h-auto">
                  <SelectValue placeholder="Pilih Tahun" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-none shadow-2xl">
                  {years.map(y => (
                    <SelectItem key={y} value={y}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>

        <div className="pt-4">
          <Button 
            onClick={handleDownload} 
            disabled={isDownloading}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl py-8 font-bold text-lg shadow-xl shadow-emerald-100 transition-all hover:translate-y-[-2px] active:scale-95"
          >
            {isDownloading ? (
              <Loader2 className="h-6 w-6 mr-3 animate-spin" />
            ) : (
              <Download className="h-6 w-6 mr-3" />
            )}
            Download Laporan Profesional (CSV)
          </Button>
          <p className="text-center text-zinc-400 text-sm mt-6 flex items-center justify-center gap-2">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
            Data akan diekspor dalam format .csv yang kompatibel dengan Excel & Google Sheets.
          </p>
        </div>
      </CardContent>
      </Card>
    </div>
  )
}
