'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { 
  MoreHorizontal, 
  Plus, 
  Search, 
  User as UserIcon, 
  ShieldCheck, 
  ShieldAlert, 
  Trash2,
  Edit2,
  Mail,
  Phone,
  Building2,
  Loader2
} from 'lucide-react'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu'
import { createUser, updateUser, deleteUser } from '@/app/actions/user'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import { ConfirmDialog } from '@/components/ConfirmDialog'

export function UserManagementClient({ initialUsers }: { initialUsers: any[] }) {
  const router = useRouter()
  const [users, setUsers] = useState(initialUsers)
  const [searchTerm, setSearchTerm] = useState('')
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [isPending, setIsPending] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [userToDelete, setUserToDelete] = useState<number | null>(null)

  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.organization && user.organization.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const handleAddUser = async (formData: FormData) => {
    setIsPending(true)
    try {
      await createUser(formData)
      toast.success('Pengguna berhasil ditambahkan')
      setIsAddOpen(false)
      router.refresh()
    } catch (error: any) {
      toast.error(error.message || 'Gagal menambahkan pengguna')
    } finally {
      setIsPending(false)
    }
  }

  const handleUpdateUser = async (formData: FormData) => {
    setIsPending(true)
    try {
      await updateUser(formData)
      toast.success('Informasi pengguna diperbarui')
      setIsEditOpen(false)
      router.refresh()
    } catch (error: any) {
      toast.error(error.message || 'Gagal memperbarui pengguna')
    } finally {
      setIsPending(false)
    }
  }

  const handleDelete = async () => {
    if (!userToDelete) return
    setIsPending(true)
    try {
      await deleteUser(userToDelete)
      toast.success('Pengguna berhasil dihapus')
      setIsDeleteOpen(false)
      router.refresh()
    } catch (error: any) {
      toast.error(error.message || 'Gagal menghapus pengguna')
    } finally {
      setIsPending(false)
    }
  }

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return <Badge className="bg-rose-50 text-rose-600 border-rose-100 px-2.5 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider">System Admin</Badge>
      case 'AGGREGATOR':
        return <Badge className="bg-blue-50 text-blue-600 border-blue-100 px-2.5 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider">Admin Sarpras</Badge>
      case 'APPROVER':
        return <Badge className="bg-purple-50 text-purple-600 border-purple-100 px-2.5 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider">Kaprodi</Badge>
      case 'REQUESTOR':
        return <Badge className="bg-zinc-50 text-zinc-600 border-zinc-100 px-2.5 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider">Pemohon</Badge>
      default:
        return <Badge variant="outline" className="px-2.5 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider">{role}</Badge>
    }
  }

  return (
    <div className="space-y-10">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-zinc-900">Manajemen Pengguna</h1>
          <p className="text-lg text-muted-foreground mt-2">Daftar sivitas akademika dengan hak akses terkelola.</p>
        </div>
        
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger
            render={
              <Button size="lg" className="rounded-xl px-8 shadow-xl shadow-primary/20 font-bold group">
                <Plus className="mr-2 h-5 w-5 transition-transform group-hover:rotate-90 duration-300" />
                Daftarkan User
              </Button>
            }
          />
          <DialogContent className="sm:max-w-[450px] rounded-3xl border-none shadow-2xl overflow-hidden p-0">
            <div className="bg-primary px-8 py-6 text-white">
              <DialogTitle className="text-2xl font-bold">Identitas Baru</DialogTitle>
              <DialogDescription className="text-white/80">
                Pendaftaran akun baru untuk sivitas akademika SIMARU.
              </DialogDescription>
            </div>
            <form action={handleAddUser} className="px-8 py-6 space-y-6 bg-white">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="add-name" className="text-xs font-bold uppercase tracking-widest text-zinc-500 ml-1">Nama Lengkap</Label>
                    <Input id="add-name" name="name" className="rounded-xl bg-zinc-50 border-zinc-200 py-6" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="add-email" className="text-xs font-bold uppercase tracking-widest text-zinc-500 ml-1">Email Instansi</Label>
                    <Input id="add-email" name="email" type="email" className="rounded-xl bg-zinc-50 border-zinc-200 py-6" required />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="add-password" className="text-xs font-bold uppercase tracking-widest text-zinc-500 ml-1">Password Awal</Label>
                  <Input id="add-password" name="password" type="password" placeholder="Min. 8 karakter" className="rounded-xl bg-zinc-50 border-zinc-200 py-6" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="add-role" className="text-xs font-bold uppercase tracking-widest text-zinc-500 ml-1">Peranan</Label>
                    <Select name="role" defaultValue="REQUESTOR">
                      <SelectTrigger className="rounded-xl bg-zinc-50 border-zinc-200 py-6">
                        <SelectValue placeholder="Pilih Role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="REQUESTOR">Pemohon (Dosen/Mhs)</SelectItem>
                        <SelectItem value="AGGREGATOR">Admin Sarpras</SelectItem>
                        <SelectItem value="APPROVER">Kaprodi / Pimpinan</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="add-phone" className="text-xs font-bold uppercase tracking-widest text-zinc-500 ml-1">Nomor HP</Label>
                    <Input id="add-phone" name="phone" className="rounded-xl bg-zinc-50 border-zinc-200 py-6" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="add-org" className="text-xs font-bold uppercase tracking-widest text-zinc-500 ml-1">Departemen / Organisasi</Label>
                  <Input id="add-org" name="organization" placeholder="e.g. Fakultas Kedokteran" className="rounded-xl bg-zinc-50 border-zinc-200 py-6" />
                </div>
              </div>
              <DialogFooter className="pt-2">
                <Button type="submit" disabled={isPending} className="w-full rounded-xl py-6 font-bold">
                  {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
                  Finalisasi Akun
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Modern Search Bar */}
      <div className="relative group max-w-2xl">
        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-zinc-400 group-focus-within:text-primary transition-colors" />
        </div>
        <Input 
          placeholder="Cari berdasarkan nama, email, atau organisasi..." 
          className="pl-12 pr-4 py-7 bg-white/50 backdrop-blur-md border-none shadow-sm group-focus-within:shadow-md transition-all rounded-2xl text-lg placeholder:text-zinc-400" 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Custom Table Layout */}
      <div className="bg-white rounded-3xl border border-zinc-100 shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-zinc-50/50">
            <TableRow className="border-zinc-100/50 hover:bg-transparent">
              <TableHead className="w-[300px] h-14 px-6 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Personal Info</TableHead>
              <TableHead className="h-14 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Hak Akses</TableHead>
              <TableHead className="h-14 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Departemen</TableHead>
              <TableHead className="h-14 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Kontak</TableHead>
              <TableHead className="text-right h-14 px-6 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Tindakan</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <AnimatePresence>
              {filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-48 text-center">
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex flex-col items-center justify-center text-zinc-400"
                    >
                      <UserIcon className="h-12 w-12 opacity-30 mb-3" />
                      <p className="font-medium">Sivitas tidak ditemukan dalam daftar.</p>
                    </motion.div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user, index) => (
                  <motion.tr 
                    key={user.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className="group border-none hover:bg-zinc-50 transition-colors"
                  >
                    <TableCell className="px-6 py-4">
                      <div className="flex items-center space-x-4">
                        <div className="h-10 w-10 rounded-xl bg-primary/5 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all duration-300">
                          <UserIcon className="h-5 w-5" />
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-zinc-900 group-hover:text-primary transition-colors">{user.name}</span>
                          <div className="flex items-center text-[11px] text-zinc-500 mt-0.5">
                            <Mail className="h-2.5 w-2.5 mr-1" />
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{getRoleBadge(user.role)}</TableCell>
                    <TableCell>
                      <div className="flex items-center text-sm text-zinc-600 font-medium">
                        <Building2 className="h-3 w-3 mr-2 text-zinc-400" />
                        {user.organization || '-'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center text-sm text-zinc-600 font-mono">
                        <Phone className="h-3 w-3 mr-2 text-zinc-400" />
                        {user.phone || '-'}
                      </div>
                    </TableCell>
                    <TableCell className="text-right px-6">
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          render={
                            <Button variant="ghost" size="sm" className="h-9 w-9 rounded-xl hover:bg-zinc-100">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          }
                        />
                        <DropdownMenuContent align="end" className="w-[180px] rounded-2xl border-zinc-100 shadow-xl p-1 bg-white/80 backdrop-blur-md">
                          <DropdownMenuItem className="rounded-xl px-4 py-2 text-sm font-medium focus:bg-primary focus:text-white transition-colors" onClick={() => {
                            setCurrentUser(user)
                            setIsEditOpen(true)
                          }}>
                            <Edit2 className="mr-3 h-4 w-4" /> Perbarui Data
                          </DropdownMenuItem>
                          {user.role !== 'SUPER_ADMIN' && (
                            <DropdownMenuItem className="rounded-xl px-4 py-2 text-sm font-medium text-rose-600 focus:bg-rose-50 focus:text-rose-700 transition-colors mt-1" onClick={() => {
                              setUserToDelete(user.id)
                              setIsDeleteOpen(true)
                            }}>
                              <Trash2 className="mr-3 h-4 w-4" /> Hapus Akses
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </motion.tr>
                ))
              )}
            </AnimatePresence>
          </TableBody>
        </Table>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[450px] rounded-3xl border-none shadow-2xl overflow-hidden p-0">
          <div className="bg-zinc-900 px-8 py-6 text-white">
            <DialogTitle className="text-2xl font-bold">Edit Profil</DialogTitle>
            <DialogDescription className="text-zinc-400">
              Sinkronisasi data sivitas akademika {currentUser?.name}.
            </DialogDescription>
          </div>
          {currentUser && (
            <form key={currentUser.id} action={handleUpdateUser} className="px-8 py-6 space-y-6 bg-white">
              <input type="hidden" name="id" value={currentUser.id} />
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-name" className="text-xs font-bold uppercase tracking-widest text-zinc-500 ml-1">Nama Lengkap</Label>
                    <Input id="edit-name" name="name" defaultValue={currentUser.name} className="rounded-xl bg-zinc-50 border-zinc-200 py-6" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-email" className="text-xs font-bold uppercase tracking-widest text-zinc-500 ml-1">Email Instansi</Label>
                    <Input id="edit-email" name="email" defaultValue={currentUser.email} type="email" className="rounded-xl bg-zinc-50 border-zinc-200 py-6" required />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-role" className="text-xs font-bold uppercase tracking-widest text-zinc-500 ml-1">Hak Akses</Label>
                    <Select name="role" defaultValue={currentUser.role}>
                      <SelectTrigger className="rounded-xl bg-zinc-50 border-zinc-200 py-6">
                        <SelectValue placeholder="Pilih Role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="REQUESTOR">Pemohon (Dosen/Mhs)</SelectItem>
                        <SelectItem value="AGGREGATOR">Admin Sarpras</SelectItem>
                        <SelectItem value="APPROVER">Kaprodi / Pimpinan</SelectItem>
                        <SelectItem value="SUPER_ADMIN">System Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-phone" className="text-xs font-bold uppercase tracking-widest text-zinc-500 ml-1">Kontak Person</Label>
                    <Input id="edit-phone" name="phone" defaultValue={currentUser.phone || ''} className="rounded-xl bg-zinc-50 border-zinc-200 py-6" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-org" className="text-xs font-bold uppercase tracking-widest text-zinc-500 ml-1">Departemen / Organisasi</Label>
                  <Input id="edit-org" name="organization" defaultValue={currentUser.organization || ''} className="rounded-xl bg-zinc-50 border-zinc-200 py-6" />
                </div>
              </div>
              <DialogFooter className="pt-2">
                <Button type="submit" disabled={isPending} className="w-full rounded-xl py-6 font-bold bg-zinc-900 hover:bg-black transition-colors">
                  {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Simpan Perubahan
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDialog 
        isOpen={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        onConfirm={handleDelete}
        title="Hapus Akses Pengguna"
        description="Tindakan ini akan mencabut seluruh hak akses pengguna ini secara permanen dari sistem SIMARU. Lanjutkan?"
        confirmText={isPending ? "Menghapus..." : "Ya, Hapus Akses"}
        variant="destructive"
      />
    </div>
  )
}
