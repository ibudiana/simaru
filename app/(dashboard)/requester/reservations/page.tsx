import { PrismaClient } from "@prisma/client";
import { verifySession } from "@/lib/session";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Clock,
  CheckCircle2,
  XCircle,
  Info,
  Calendar as CalendarIcon,
  MapPin,
} from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { SuccessToast } from "@/components/SuccessToast";
import { Suspense } from "react";

const prisma = new PrismaClient();

interface PageProps {
  searchParams: Promise<{ success?: string }>;
}

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case "PENDING":
      return (
        <Badge
          variant="outline"
          className="text-yellow-600 border-yellow-600 bg-yellow-50"
        >
          <Clock className="w-3 h-3 mr-1" /> Menunggu
        </Badge>
      );
    case "APPROVED":
      return (
        <Badge
          variant="outline"
          className="text-green-600 border-green-600 bg-green-50"
        >
          <CheckCircle2 className="w-3 h-3 mr-1" /> Disetujui
        </Badge>
      );
    case "REJECTED":
      return (
        <Badge variant="destructive">
          <XCircle className="w-3 h-3 mr-1" /> Ditolak
        </Badge>
      );
    case "CANCELLED":
      return <Badge variant="secondary">Dibatalkan</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

export default async function RequesterReservations({
  searchParams,
}: PageProps) {
  const session = await verifySession();
  if (!session?.userId) redirect("/login");

  await searchParams;

  const reservations = await prisma.reservation.findMany({
    where: { userId: session.userId },
    include: {
      room: true,
      schedule: true,
      approvalStages: {
        include: {
          approver: {
            select: { name: true, role: true },
          },
        },
        orderBy: { id: "asc" },
      },
    },
    orderBy: { id: "desc" },
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
            Riwayat Reservasi
          </h1>
          <p className="text-muted-foreground mt-2">
            Daftar pengajuan ruangan Anda beserta status terkininya.
          </p>
        </div>
        <Link href="/requester">
          <Button variant="outline">Reservasi Baru</Button>
        </Link>
      </div>

      <Suspense fallback={null}>
        <SuccessToast />
      </Suspense>

      {reservations.length === 0 ? (
        <Card className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground border-dashed">
          <CalendarIcon className="h-12 w-12 opacity-20 mb-4" />
          <p>Anda belum pernah mengajukan reservasi ruangan.</p>
        </Card>
      ) : (
        <div className="grid gap-6">
          {reservations.map((res: (typeof reservations)[number]) => (
            <Card key={res.id} className="overflow-hidden">
              <div
                className={`h-2 w-full ${res.status === "APPROVED" ? "bg-green-500" : res.status === "REJECTED" ? "bg-red-500" : "bg-yellow-500"}`}
              />
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                  <CardTitle className="text-xl flex items-center">
                    {res.room.name}
                  </CardTitle>
                  <CardDescription className="flex items-center mt-1">
                    <MapPin className="h-3 w-3 mr-1" />
                    {res.room.location}
                  </CardDescription>
                </div>
                <StatusBadge status={res.status} />
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4 mt-4">
                  <div className="space-y-3 text-sm">
                    <div className="flex items-start">
                      <CalendarIcon className="h-4 w-4 mr-2 text-muted-foreground shrink-0 mt-0.5" />
                      <div>
                        <span className="font-semibold block">Jadwal</span>
                        {formatDate(new Date(res.schedule.startTime))}
                        <br />
                        {formatTime(new Date(res.schedule.startTime))} -{" "}
                        {formatTime(new Date(res.schedule.endTime))}
                      </div>
                    </div>
                    <div className="flex items-start">
                      <Info className="h-4 w-4 mr-2 text-muted-foreground shrink-0 mt-0.5" />
                      <div>
                        <span className="font-semibold block">
                          Tujuan Penggunaan
                        </span>
                        {res.purpose}
                      </div>
                    </div>
                  </div>

                  <div className="bg-muted/50 rounded-lg p-4 text-sm">
                    <span className="font-semibold mb-2 block border-b pb-2">
                      Proses Peninjauan
                    </span>
                    <ul className="space-y-3 mt-3">
                      {res.approvalStages.map(
                        (stage: (typeof res.approvalStages)[number]) => (
                          <li key={stage.id} className="flex relative">
                            <div
                              className={`mt-0.5 w-2 h-2 rounded-full mr-3 shrink-0 ${
                                stage.status === "APPROVED"
                                  ? "bg-green-500"
                                  : stage.status === "REJECTED"
                                    ? "bg-red-500"
                                    : "bg-yellow-500 animate-pulse"
                              }`}
                            />
                            <div>
                              <p className="font-medium text-xs text-muted-foreground uppercase">
                                {stage.stage}
                              </p>
                              <p className="font-medium">
                                {stage.approver.name} ({stage.approver.role})
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                Status: {stage.status}
                              </p>
                              {stage.notes && (
                                <p className="text-xs italic mt-1 bg-yellow-100 p-1.5 rounded-md leading-relaxed text-yellow-800">
                                  &quot;{stage.notes}&quot;
                                </p>
                              )}
                            </div>
                          </li>
                        ),
                      )}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
