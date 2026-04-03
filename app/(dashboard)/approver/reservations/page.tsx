import { PrismaClient, type Prisma } from "@prisma/client";
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
  CheckCircle,
  User as UserIcon,
  Calendar as CalendarIcon,
  MapPin,
  Building,
} from "lucide-react";
import { redirect } from "next/navigation";
import { processKaprodiApproval } from "@/app/actions/approver";
import { ApprovalActionForm } from "@/components/ApprovalActionForm";

const prisma = new PrismaClient();

type PendingApprovalStage = Prisma.ApprovalWorkflowGetPayload<{
  include: {
    reservation: {
      include: {
        user: true;
        room: true;
        schedule: true;
      };
    };
  };
}>;

export default async function ApproverReservations() {
  const session = await verifySession();
  if (!session?.userId || session.role !== "APPROVER") redirect("/login");

  const pendingApprovals = await prisma.approvalWorkflow.findMany({
    where: {
      approverId: session.userId,
      status: "PENDING",
    },
    include: {
      reservation: {
        include: {
          user: true,
          room: true,
          schedule: true,
        },
      },
    },
    orderBy: { id: "asc" },
  });

  // Format date helper
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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Persetujuan Akhir
          </h1>
          <p className="text-muted-foreground mt-2">
            Daftar reservasi ruangan yang membutuhkan persetujuan Anda sebagai
            Kaprodi/Pimpinan.
          </p>
        </div>
      </div>

      {pendingApprovals.length === 0 ? (
        <Card className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground border-dashed">
          <CheckCircle className="h-12 w-12 opacity-20 mb-4" />
          <p>
            Belum ada permintaan yang masuk ke tahap akhir. Halaman sudah
            bersih!
          </p>
        </Card>
      ) : (
        <div className="grid gap-6">
          {pendingApprovals.map((stage: PendingApprovalStage) => {
            const res = stage.reservation;
            return (
              <Card
                key={stage.id}
                className="overflow-hidden shadow-sm border-blue-200"
              >
                <div className="h-1 w-full bg-blue-500" />
                <CardHeader className="flex flex-row items-center justify-between pb-2 bg-blue-50/30">
                  <div>
                    <CardTitle className="text-xl flex items-center">
                      <Building className="h-5 w-5 mr-2 text-blue-500" />
                      {res.room.name}
                    </CardTitle>
                    <CardDescription className="flex items-center mt-1">
                      <MapPin className="h-3 w-3 mr-1" />
                      {res.room.location}
                    </CardDescription>
                  </div>
                  <Badge
                    variant="outline"
                    className="text-blue-600 border-blue-600 bg-blue-50"
                  >
                    Menunggu Keputusan Anda
                  </Badge>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="flex items-start">
                        <UserIcon className="h-4 w-4 mr-2 text-muted-foreground shrink-0 mt-0.5" />
                        <div>
                          <span className="font-semibold block text-sm">
                            Pemohon
                          </span>
                          <span className="text-sm">{res.user.name}</span>
                          <span className="text-xs text-muted-foreground block">
                            {res.user.organization || "-"}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-start">
                        <CalendarIcon className="h-4 w-4 mr-2 text-muted-foreground shrink-0 mt-0.5" />
                        <div>
                          <span className="font-semibold block text-sm">
                            Jadwal Penggunaan
                          </span>
                          <span className="text-sm max-w-sm block">
                            {formatDate(new Date(res.schedule.startTime))} |{" "}
                            {formatTime(new Date(res.schedule.startTime))} -{" "}
                            {formatTime(new Date(res.schedule.endTime))}
                          </span>
                        </div>
                      </div>

                      <div>
                        <span className="font-semibold block text-sm mb-1">
                          Tujuan:
                        </span>
                        <p className="text-sm bg-muted p-2 rounded-md">
                          {res.purpose}
                        </p>
                      </div>
                    </div>

                    <div className="bg-blue-50/50 rounded-lg p-4 border flex flex-col justify-center space-y-4">
                      <ApprovalActionForm
                        reservationId={res.id}
                        stageId={stage.id}
                        actionFn={processKaprodiApproval}
                        rejectLabel="Tolak Reservasi"
                        approveLabel="Setujui Final"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
