'use client'

import { useState, useTransition, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  CalendarRange, LogOut, Menu, User,
  CalendarCheck, LayoutDashboard,
  Users, Building, ListTodo, Bell, FileSpreadsheet, Loader2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { logout } from '@/app/actions/auth'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { motion, AnimatePresence } from 'framer-motion'

interface DashboardLayoutProps {
  children: React.ReactNode
  user: {
    id: number
    name: string
    role: string
    organization: string | null
  }
  notifications: Array<{
    id: number
    message: string
    link?: string | null
    timestamp: Date
  }>
}

export function DashboardLayout({ children, user, notifications }: DashboardLayoutProps) {
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 1024
      setIsMobile(mobile)
      // Auto close sidebar when transitioning from mobile to desktop
      if (!mobile) setSidebarOpen(false)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const getNavItems = () => {
    switch(user.role) {
      case 'REQUESTOR':
        return [
          { name: 'Daftar Ruangan', href: '/requester', icon: LayoutDashboard },
          { name: 'Riwayat Reservasi', href: '/requester/reservations', icon: CalendarCheck },
        ]
      case 'AGGREGATOR':
        return [
          { name: 'Tinjau Reservasi', href: '/admin/reservations', icon: ListTodo },
          { name: 'Kelola Ruangan', href: '/admin/rooms', icon: Building },
          { name: 'Kelola Pengguna', href: '/admin/users', icon: Users },
          { name: 'Ekspor Laporan', href: '/admin/reports', icon: FileSpreadsheet },
        ]
      case 'APPROVER':
        return [
          { name: 'Persetujuan Final', href: '/approver', icon: CalendarCheck },
        ]
      default:
        return []
    }
  }

  const navItems = getNavItems()

  const handleLogout = () => {
    startTransition(async () => {
      await logout()
    })
  }

  return (
    <div className="flex h-screen w-full bg-[#f8fafc] overflow-hidden font-sans">
      
      {/* Mobile sidebar backdrop */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden" 
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside 
        initial={false}
        animate={{ 
          x: isMobile ? (sidebarOpen ? 0 : -256) : 0,
          opacity: 1 
        }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white/70 backdrop-blur-xl border-r border-white/20 shadow-xl lg:static lg:translate-x-0 overflow-y-auto ${isMobile ? '' : 'translate-x-0'}`}
      >
        <div className="flex h-20 items-center px-6 border-b border-zinc-100/50">
          <div className="bg-primary/10 p-2 rounded-xl mr-3">
            <CalendarRange className="h-6 w-6 text-primary" />
          </div>
          <span className="text-2xl font-bold tracking-tight bg-linear-to-br from-zinc-900 to-zinc-500 bg-clip-text text-transparent">
            SIMARU
          </span>
        </div>
        
        <div className="flex flex-col flex-1 py-6 overflow-y-auto">
          <nav className="flex-1 space-y-2 px-4">
            {navItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="block group"
                >
                  <motion.div
                    whileHover={{ x: 4 }}
                    whileTap={{ scale: 0.98 }}
                    className={`flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                      isActive 
                        ? 'bg-primary text-white shadow-lg shadow-primary/30 ring-1 ring-primary/50' 
                        : 'text-zinc-500 hover:bg-zinc-100/80 hover:text-zinc-900'
                    }`}
                  >
                    <item.icon className={`mr-3 h-5 w-5 shrink-0 ${isActive ? 'text-white' : 'group-hover:text-primary transition-colors'}`} />
                    {item.name}
                  </motion.div>
                </Link>
              )
            })}
          </nav>
        </div>

        <div className="p-4 border-t border-zinc-100/50 bg-zinc-50/30">
          <div className="flex items-center p-3 rounded-xl bg-white/50 border border-white/20 mb-4 shadow-sm">
            <div className="h-10 w-10 rounded-full bg-linear-to-br from-primary/20 to-primary/5 flex items-center justify-center mr-3 ring-2 ring-white shadow-inner">
              <User className="h-5 w-5 text-primary" />
            </div>
            <div className="flex flex-col truncate">
              <span className="text-sm font-semibold text-zinc-900 truncate">{user.name}</span>
              <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground truncate">{user.role}</span>
            </div>
          </div>
          <form action={handleLogout}>
            <Button 
              type="submit" 
              variant="ghost" 
              disabled={isPending}
              className="w-full justify-start text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition-all duration-200" 
              size="sm"
            >
              {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LogOut className="mr-2 h-4 w-4" />}
              Keluar Sistem
            </Button>
          </form>
        </div>
      </motion.aside>

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden relative">
        <header className="flex h-20 shrink-0 items-center justify-between border-b border-zinc-100/50 bg-white/60 backdrop-blur-md px-6 lg:px-8 shadow-[0_1px_2px_rgba(0,0,0,0.02)] z-10 w-full">
          <div className="flex items-center">
            <button 
              className="text-muted-foreground hover:text-foreground lg:hidden p-2 hover:bg-zinc-100 rounded-xl transition-colors mr-2"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-6 w-6" />
            </button>
            <div className="flex flex-col">
              <h2 className="text-lg font-semibold text-zinc-900 hidden sm:block">
                {pathname === '/requester' ? 'Sistem Manajemen Ruangan' : 
                 pathname === '/admin/reservations' ? 'Pusat Kendali Admin' : 'Dashboard'}
              </h2>
              <p className="text-xs text-muted-foreground hidden sm:block">Panel Terintegrasi</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            {user.organization && (
              <div className="hidden md:flex items-center bg-zinc-100/50 border border-zinc-200/50 px-4 py-1.5 rounded-full text-xs font-semibold text-zinc-600 shadow-sm">
                <span className="h-1.5 w-1.5 bg-emerald-500 rounded-full mr-2"></span>
                {user.organization}
              </div>
            )}

            <Popover>
              <PopoverTrigger
                render={
                  <button className="relative p-2.5 bg-white border border-zinc-200/50 hover:bg-zinc-50 rounded-xl transition-all shadow-sm hover:shadow-md group">
                    <Bell className="h-5 w-5 text-zinc-500 group-hover:text-primary transition-colors" />
                    {notifications.length > 0 && (
                      <span className="absolute top-2.5 right-2.5 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white" />
                    )}
                  </button>
                }
              />
              <PopoverContent className="w-80 p-0 border-none shadow-2xl rounded-2xl overflow-hidden mt-2" align="end">
                <div className="bg-primary px-4 py-4 text-white">
                  <h4 className="font-bold text-sm">Notifikasi</h4>
                  <p className="text-[10px] opacity-80 uppercase tracking-widest mt-0.5">Informasi Aktivitas Terkini</p>
                </div>
                <div className="max-h-[400px] overflow-y-auto bg-white">
                  {notifications.length === 0 ? (
                    <div className="p-8 text-center">
                      <div className="h-12 w-12 bg-zinc-50 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Bell className="h-6 w-6 text-zinc-300" />
                      </div>
                      <p className="text-sm text-zinc-400">Tidak ada notifikasi</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-zinc-50">
                      {notifications.map((n) => (
                        <Link 
                          key={n.id} 
                          href={n.link || '#'} 
                          className="block"
                        >
                           <div className="p-4 hover:bg-zinc-50/80 transition-colors cursor-pointer group">
                             <p className="text-sm text-zinc-700 leading-snug group-hover:text-zinc-900 transition-colors">{n.message}</p>
                             <p className="text-[10px] text-zinc-400 mt-2 font-medium">
                               {new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(n.timestamp))}
                             </p>
                           </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto bg-[#f8fafc] p-6 lg:p-10">
          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {children}
          </motion.div>
        </main>
      </div>

    </div>
  )
}
