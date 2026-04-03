import prisma from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { verifySession } from "@/lib/session";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Check,
  User as UserIcon,
  Calendar as CalendarIcon,
  MapPin,
  Building,
} from "lucide-react";
import { redirect } from "next/navigation";
import { processAdminApproval } from "@/app/actions/admin";
import { StatsCard } from "@/components/StatsCard";
import { ApprovalActionForm } from "@/components/ApprovalActionForm";

type PendingApprovalStage = Prisma.ApprovalWorkflowGetPayload<{
  include: {
    reservation: {
      include: {
        user: true;
        room: {
          include: { approver: true };
        };
        schedule: true;
      };
    };
  };
}>;

export default async function AdminReservations() {
  const session = await verifySession();
  if (!session?.userId || session.role !== "AGGREGATOR") redirect("/login");

  const pendingApprovals = await prisma.approvalWorkflow.findMany({
    where: {
      approverId: session.userId,
      status: "PENDING",
    },
    include: {
      reservation: {
        include: {
          user: true,
          room: {
            include: { approver: true },
          },
          schedule: true,
        },
      },
    },
    orderBy: { id: "asc" },
  });

  // Fetch Admin Stats
  const totalRooms = await prisma.room.count();
  const totalUsers = await prisma.user.count();
  const totalPending = pendingApprovals.length;

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("id-ID", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(date);
  };

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  return (
    <div className="space-y-10">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-zinc-900">
            Verifikasi Reservasi
          </h1>
          <p className="text-lg text-muted-foreground mt-2">
            Kelola dan tinjau seluruh permintaan ketersediaan ruangan secara
            real-time.
          </p>
        </div>
      </div>

      {/* Admin Stats Grid */}
      <div className="grid gap-6 md:grid-cols-3">
        <StatsCard
          title="Menunggu Verifikasi"
          value={totalPending}
          icon="clock"
          description="Perlu tindakan segera"
        />
        <StatsCard
          title="Total Aset Ruangan"
          value={totalRooms}
          icon="building"
          description="Terdaftar di sistem"
          trend={{ value: "+2", positive: true }}
        />
        <StatsCard
          title="Total Pengguna"
          value={totalUsers}
          icon="users"
          description="Sivitas aktif"
        />
      </div>

      {/* Main Content List */}
      <div className="space-y-6">
        <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
          <h2 className="text-xl font-bold text-zinc-800">
            Antrian Tugas Peninjauan
          </h2>
          <Badge
            variant="outline"
            className="bg-yellow-50 text-yellow-700 border-yellow-200 px-3 py-1 animate-pulse"
          >
            <span className="h-1.5 w-1.5 bg-yellow-500 rounded-full mr-2"></span>
            Aktivitas Pending
          </Badge>
        </div>

        {pendingApprovals.length === 0 ? (
          <Card className="flex flex-col items-center justify-center p-20 text-center bg-zinc-50 border-2 border-dashed border-zinc-200 rounded-3xl">
            <div className="h-16 w-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
              <Check className="h-8 w-8 text-emerald-500" />
            </div>
            <h3 className="text-lg font-bold text-zinc-800">Semua Beres!</h3>
            <p className="text-zinc-500 mt-1 max-w-xs mx-auto text-sm">
              Tidak ada permintaan menunggu tinjauan Anda saat ini. Kerja bagus!
            </p>
          </Card>
        ) : (
          <div className="grid gap-8">
            {pendingApprovals.map((stage: PendingApprovalStage) => {
              const res = stage.reservation;
              return (
                <Card
                  key={stage.id}
                  className="overflow-hidden border-none shadow-sm hover:shadow-lg transition-all duration-300 bg-white rounded-2xl group"
                >
                  <div className="h-2 w-full bg-yellow-400 group-hover:bg-yellow-500 transition-colors" />
                  <CardHeader className="flex flex-row items-center justify-between pb-4 bg-zinc-50/30">
                    <div className="flex items-center space-x-4">
                      <div className="h-12 w-12 bg-white rounded-xl shadow-sm flex items-center justify-center text-primary border border-zinc-100">
                        <Building className="h-6 w-6" />
                      </div>
                      <div>
                        <CardTitle className="text-xl font-bold">
                          {res.room.name}
                        </CardTitle>
                        <CardDescription className="flex items-center mt-1">
                          <MapPin className="h-3 w-3 mr-1 text-primary" />
                          {res.room.location}
                        </CardDescription>
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className="text-yellow-600 border-yellow-500 bg-yellow-50 font-bold px-3 py-1"
                    >
                      Verifikasi Lapangan
                    </Badge>
                  </CardHeader>
                  <CardContent className="pt-6 pb-2">
                    <div className="grid lg:grid-cols-2 gap-10">
                      <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-6">
                          <div className="flex items-start">
                            <div className="h-8 w-8 bg-zinc-100 rounded-lg flex items-center justify-center mr-3 shrink-0">
                              <UserIcon className="h-4 w-4 text-zinc-500" />
                            </div>
                            <div>
                              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block">
                                Pemohon
                              </span>
                              <span className="text-sm font-semibold block mt-0.5">
                                {res.user.name}
                              </span>
                              <span className="text-xs text-muted-foreground block">
                                {res.user.organization || "-"}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-start">
                            <div className="h-8 w-8 bg-zinc-100 rounded-lg flex items-center justify-center mr-3 shrink-0">
                              <CalendarIcon className="h-4 w-4 text-zinc-500" />
                            </div>
                            <div>
                              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block">
                                Waktu Penggunaan
                              </span>
                              <span className="text-sm font-semibold block mt-0.5">
                                {formatDate(new Date(res.schedule.startTime))}
                              </span>
                              <span className="text-xs text-muted-foreground block">
                                {formatTime(new Date(res.schedule.startTime))} -{" "}
                                {formatTime(new Date(res.schedule.endTime))}
                              </span>
                            </div>
                          </div>
                        </div>

                        {res.room.approver && (
                          <div className="bg-blue-50/30 p-4 rounded-xl border border-blue-100/50 flex items-center justify-between">
                            <div>
                              <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest block">
                                Target Approver Final
                              </span>
                              <span className="text-sm font-semibold text-blue-900 mt-1 block">
                                {res.room.approver.name}
                              </span>
                              <span className="text-[10px] text-blue-500 font-medium">
                                Kaprodi / Pimpinan Unit
                              </span>
                            </div>
                            <Badge
                              variant="outline"
                              className="bg-white text-blue-600 border-blue-200"
                            >
                              Terjadwal Otomatis
                            </Badge>
                          </div>
                        )}

                        <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-100">
                          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-2">
                            Tujuan Penggunaan
                          </span>
                          <p className="text-sm text-zinc-700 leading-relaxed font-medium">
                            &quot;{res.purpose}&quot;
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-col h-full">
                        <ApprovalActionForm
                          reservationId={res.id}
                          stageId={stage.id}
                          actionFn={processAdminApproval}
                          rejectLabel="Tolak"
                          approveLabel="Verifikasi & Teruskan"
                        />
                      </div>
                    </div>
                  </CardContent>
                  <div className="h-1 bg-zinc-50/50" />
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
