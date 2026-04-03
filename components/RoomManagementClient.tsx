"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Building,
  Users,
  Plus,
  Search,
  Edit2,
  Trash2,
  MapPin,
  Loader2,
  Sparkles,
  Check as CheckIcon,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createRoom, updateRoom, deleteRoom } from "@/app/actions/room";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { ConfirmDialog } from "@/components/ConfirmDialog";

type Facility = {
  facilityId: number;
  facility: { id: number; name: string };
};

type Room = {
  id: number;
  name: string;
  location: string;
  capacity: number;
  approverId?: number;
  approver?: { id: number; name: string };
  facilities?: Facility[];
};

export function RoomManagementClient({
  initialRooms,
  approvers,
  allFacilities,
}: {
  initialRooms: Room[];
  approvers: { id: number; name: string }[];
  allFacilities: { id: number; name: string }[];
}) {
  const router = useRouter();
  const [rooms, setRooms] = useState(initialRooms);

  // Sync state with server props when initialRooms changes (e.g. after router.refresh())
  useEffect(() => {
    setRooms(initialRooms);
  }, [initialRooms]);

  const [searchTerm, setSearchTerm] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [currentRoom, setCurrentRoom] = useState<Room | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [roomToDelete, setRoomToDelete] = useState<number | null>(null);
  const [selectedApprover, setSelectedApprover] = useState<string | null>(null);
  const selectedApproverName = approvers.find(
    (a) => a.id.toString() === selectedApprover,
  )?.name;
  const [editApprover, setEditApprover] = useState<string>(
    currentRoom?.approverId?.toString() || "",
  );

  useEffect(() => {
    if (currentRoom) {
      setEditApprover(currentRoom.approverId?.toString() || "");
    }
  }, [currentRoom]);

  const filteredRooms = rooms.filter(
    (room) =>
      room.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      room.location.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const handleAdd = async (formData: FormData) => {
    setIsPending(true);
    try {
      await createRoom(formData);
      toast.success("Ruangan Berhasil Ditambahkan");
      setIsAddOpen(false);
      router.refresh();
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Gagal menambahkan ruangan";
      toast.error(message);
    } finally {
      setIsPending(false);
    }
  };

  const handleUpdate = async (formData: FormData) => {
    setIsPending(true);
    try {
      await updateRoom(formData);
      toast.success("Data Ruangan Diperbarui");
      setIsEditOpen(false);
      router.refresh();
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Gagal memperbarui data";
      toast.error(message);
    } finally {
      setIsPending(false);
    }
  };

  const handleDelete = async () => {
    if (!roomToDelete) return;
    setIsPending(true);
    try {
      await deleteRoom(roomToDelete);
      toast.success("Ruangan Berhasil Dihapus");
      setIsDeleteOpen(false);
      router.refresh();
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Gagal menghapus ruangan";
      toast.error(message);
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="space-y-10">
      {/* Header section with Stats flavor */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-zinc-900">
            Inventaris Ruangan
          </h1>
          <p className="text-lg text-muted-foreground mt-2">
            Kelola aset fisik universitas, laboratorium, dan ruang kelas
            terintegrasi.
          </p>
        </div>

        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger
            render={
              <Button
                size="lg"
                className="rounded-xl px-8 shadow-xl shadow-primary/20 font-bold group"
              >
                <Plus className="mr-2 h-5 w-5 transition-transform group-hover:rotate-90 duration-300" />
                Tambah Aset Baru
              </Button>
            }
          />
          <DialogContent className="sm:max-w-[425px] rounded-3xl border-none shadow-2xl">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold">
                Tambah Ruangan
              </DialogTitle>
              <DialogDescription>
                Rincian aset fisik yang akan didaftarkan ke sistem SIMARU.
              </DialogDescription>
            </DialogHeader>
            <form action={handleAdd} className="space-y-6 pt-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label
                    htmlFor="room-name"
                    className="text-xs font-bold uppercase tracking-widest text-zinc-500 ml-1"
                  >
                    Nama Ruangan
                  </Label>
                  <Input
                    id="room-name"
                    name="name"
                    placeholder="e.g. Lab Komputer Dasar"
                    className="rounded-xl bg-zinc-50 border-zinc-200 py-6"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="room-location"
                    className="text-xs font-bold uppercase tracking-widest text-zinc-500 ml-1"
                  >
                    Lokasi Gedung
                  </Label>
                  <Input
                    id="room-location"
                    name="location"
                    placeholder="e.g. Gedung Sate, Lt. 3"
                    className="rounded-xl bg-zinc-50 border-zinc-200 py-6"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="room-capacity"
                    className="text-xs font-bold uppercase tracking-widest text-zinc-500 ml-1"
                  >
                    Kapasitas Maksimal
                  </Label>
                  <Input
                    id="room-capacity"
                    name="capacity"
                    type="number"
                    defaultValue={30}
                    className="rounded-xl bg-zinc-50 border-zinc-200 py-6"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-widest text-zinc-500 ml-1">
                    Approver (Kaprodi)
                  </Label>
                  <Select
                    name="approverId"
                    value={selectedApprover ?? ""}
                    onValueChange={(value) => setSelectedApprover(value)}
                  >
                    <SelectTrigger className="rounded-xl bg-zinc-50 border-zinc-200 py-6">
                      <SelectValue placeholder="Pilih Kaprodi Bertanggung Jawab">
                        {selectedApproverName ||
                          "Pilih Kaprodi Bertanggung Jawab"}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-none shadow-2xl">
                      {approvers.map((app) => (
                        <SelectItem key={app.id} value={app.id.toString()}>
                          {app.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <Label className="text-xs font-bold uppercase tracking-widest text-zinc-500 ml-1">
                    Fasilitas Ruangan
                  </Label>
                  <div className="grid grid-cols-2 gap-3 bg-zinc-50 p-4 rounded-xl border border-zinc-200">
                    {allFacilities.map((fac) => (
                      <label
                        key={fac.id}
                        className="flex items-center space-x-3 cursor-pointer group"
                      >
                        <div className="relative flex items-center justify-center">
                          <input
                            type="checkbox"
                            name="facilities"
                            value={fac.id}
                            className="peer h-5 w-5 appearance-none rounded-md border-2 border-zinc-300 checked:bg-primary checked:border-primary transition-all duration-200"
                          />
                          <CheckIcon
                            className="absolute h-3.5 w-3.5 text-white opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none"
                            strokeWidth={4}
                          />
                        </div>
                        <span className="text-sm font-medium text-zinc-600 group-hover:text-zinc-900 transition-colors">
                          {fac.name}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
              <DialogFooter className="pt-2">
                <Button
                  type="submit"
                  disabled={isPending}
                  className="w-full rounded-xl py-6 font-bold"
                >
                  {isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="mr-2 h-4 w-4" />
                  )}
                  Finalisasi Registrasi
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
          placeholder="Cari berdasarkan nama ruangan atau lokasi..."
          className="pl-12 pr-4 py-7 bg-white/50 backdrop-blur-md border-none shadow-sm group-focus-within:shadow-md transition-all rounded-2xl text-lg placeholder:text-zinc-400"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Room Grid */}
      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        <AnimatePresence>
          {filteredRooms.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="col-span-full py-24 flex flex-col items-center justify-center text-zinc-400 bg-zinc-50 rounded-3xl border-2 border-dashed border-zinc-200"
            >
              <Building className="h-16 w-16 opacity-30 mb-4" />
              <p className="font-medium">
                Tidak ada aset ruangan yang sesuai pencarian.
              </p>
            </motion.div>
          ) : (
            filteredRooms.map((room, index) => (
              <motion.div
                key={room.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="overflow-hidden flex flex-col border-none shadow-sm hover:shadow-xl transition-all duration-500 bg-white rounded-3xl group h-full">
                  <div className="h-40 bg-zinc-50 flex items-center justify-center relative border-b group-hover:bg-zinc-100/50 transition-colors">
                    <Building className="h-16 w-16 text-zinc-200 group-hover:scale-110 group-hover:text-primary/10 transition-all duration-500" />
                    <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0">
                      <Button
                        size="icon"
                        variant="secondary"
                        className="h-9 w-9 rounded-xl bg-white/90 backdrop-blur-sm shadow-sm border border-zinc-100 hover:bg-white"
                        onClick={() => {
                          setCurrentRoom(room);
                          setIsEditOpen(true);
                        }}
                      >
                        <Edit2 className="h-4 w-4 text-zinc-600" />
                      </Button>
                      <Button
                        size="icon"
                        variant="destructive"
                        className="h-9 w-9 rounded-xl shadow-sm hover:bg-rose-600"
                        onClick={() => {
                          setRoomToDelete(room.id);
                          setIsDeleteOpen(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <CardHeader className="pb-4">
                    <CardTitle className="text-xl font-bold group-hover:text-primary transition-colors">
                      {room.name}
                    </CardTitle>
                    <CardDescription className="flex items-center text-zinc-500">
                      <MapPin className="h-3 w-3 mr-1 text-primary/60" />{" "}
                      {room.location}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center bg-zinc-100 px-3 py-1.5 rounded-xl text-xs font-semibold text-zinc-600">
                        <Users className="mr-2 h-4 w-4 text-zinc-400" />
                        Kapasitas:{" "}
                        <span className="text-zinc-900 ml-1">
                          {room.capacity} Orang
                        </span>
                      </div>
                    </div>
                    {(room.approver?.name ||
                      approvers.find((a) => a.id === room.approverId)
                        ?.name) && (
                      <div className="mt-3 flex items-center text-xs text-zinc-500 bg-blue-50/50 p-2 rounded-lg border border-blue-100/50">
                        <span className="font-bold text-blue-600 mr-2 uppercase tracking-tighter">
                          Kaprodi:
                        </span>
                        <span className="text-zinc-700 font-medium">
                          {room.approver?.name ||
                            approvers.find((a) => a.id === room.approverId)
                              ?.name}
                        </span>
                      </div>
                    )}
                  </CardContent>
                  <CardFooter className="bg-zinc-50/50 border-t border-zinc-100 p-4 min-h-[60px]">
                    <div className="flex flex-wrap gap-1.5">
                      {room.facilities && room.facilities.length > 0 ? (
                        room.facilities.map((rf: Facility) => (
                          <span
                            key={rf.facilityId}
                            className="inline-flex items-center px-2 py-0.5 rounded-lg text-[9px] font-bold uppercase tracking-widest bg-white text-zinc-500 border border-zinc-200"
                          >
                            {rf.facility.name}
                          </span>
                        ))
                      ) : (
                        <span className="text-[10px] text-zinc-400 italic">
                          Tanpa Fasilitas Master
                        </span>
                      )}
                    </div>
                  </CardFooter>
                </Card>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[425px] rounded-3xl border-none shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">
              Update Aset
            </DialogTitle>
            <DialogDescription>
              Perbarui rincian operasional untuk ruangan yang dipilih.
            </DialogDescription>
          </DialogHeader>
          {currentRoom && (
            <form
              key={currentRoom.id}
              action={handleUpdate}
              className="space-y-6 pt-4"
            >
              <input type="hidden" name="id" value={currentRoom.id} />
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label
                    htmlFor="edit-room-name"
                    className="text-xs font-bold uppercase tracking-widest text-zinc-500 ml-1"
                  >
                    Nama Ruangan
                  </Label>
                  <Input
                    id="edit-room-name"
                    name="name"
                    defaultValue={currentRoom.name}
                    className="rounded-xl bg-zinc-50 border-zinc-200 py-6"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="edit-room-location"
                    className="text-xs font-bold uppercase tracking-widest text-zinc-500 ml-1"
                  >
                    Lokasi Gedung
                  </Label>
                  <Input
                    id="edit-room-location"
                    name="location"
                    defaultValue={currentRoom.location}
                    className="rounded-xl bg-zinc-50 border-zinc-200 py-6"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="edit-room-capacity"
                    className="text-xs font-bold uppercase tracking-widest text-zinc-500 ml-1"
                  >
                    Kapasitas Maksimal
                  </Label>
                  <Input
                    id="edit-room-capacity"
                    name="capacity"
                    type="number"
                    defaultValue={currentRoom.capacity}
                    className="rounded-xl bg-zinc-50 border-zinc-200 py-6"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-widest text-zinc-500 ml-1">
                    Approver (Kaprodi)
                  </Label>
                  <Select
                    name="approverId"
                    value={editApprover}
                    onValueChange={(val) => setEditApprover(val || "")}
                    required
                  >
                    <SelectTrigger className="rounded-xl bg-zinc-50 border-zinc-200 py-6">
                      <SelectValue>
                        {approvers.find((a) => a.id.toString() === editApprover)
                          ?.name || "Pilih Kaprodi Bertanggung Jawab"}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-none shadow-2xl">
                      {approvers.map((app) => (
                        <SelectItem key={app.id} value={app.id.toString()}>
                          {app.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <Label className="text-xs font-bold uppercase tracking-widest text-zinc-500 ml-1">
                    Fasilitas Ruangan
                  </Label>
                  <div className="grid grid-cols-2 gap-3 bg-zinc-50 p-4 rounded-xl border border-zinc-200">
                    {allFacilities.map((fac) => {
                      const isChecked = currentRoom.facilities?.some(
                        (rf: Facility) => rf.facilityId === fac.id,
                      );
                      return (
                        <label
                          key={fac.id}
                          className="flex items-center space-x-3 cursor-pointer group"
                        >
                          <div className="relative flex items-center justify-center">
                            <input
                              type="checkbox"
                              name="facilities"
                              value={fac.id}
                              defaultChecked={isChecked}
                              className="peer h-5 w-5 appearance-none rounded-md border-2 border-zinc-300 checked:bg-primary checked:border-primary transition-all duration-200"
                            />
                            <CheckIcon
                              className="absolute h-3.5 w-3.5 text-white opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none"
                              strokeWidth={4}
                            />
                          </div>
                          <span className="text-sm font-medium text-zinc-600 group-hover:text-zinc-900 transition-colors">
                            {fac.name}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>
              <DialogFooter className="pt-2">
                <Button
                  type="submit"
                  disabled={isPending}
                  className="w-full rounded-xl py-6 font-bold"
                >
                  {isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
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
        title="Hapus Aset Ruangan"
        description="Menghapus ruangan akan menghapus seluruh data reservasi, jadwal, dan ketersediaan yang terkait dengannya. Tindakan ini tidak dapat dibatalkan. Lanjutkan?"
        confirmText={isPending ? "Menghapus..." : "Ya, Hapus Aset"}
        variant="destructive"
      />
    </div>
  );
}
