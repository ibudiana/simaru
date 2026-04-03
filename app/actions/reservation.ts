"use server";

import prisma from "@/lib/prisma";
import { verifySession } from "@/lib/session";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

const RESERVATION_STATUS = {
  PENDING: "PENDING",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
} as const;

const STAGE_STATUS = {
  REQUESTED: "REQUESTED",
  APPROVED: "APPROVED",
} as const;

export async function submitReservation(
  state: { error: string } | null,
  formData: FormData,
): Promise<{ error: string } | null> {
  const session = await verifySession();
  if (!session || session.role !== "REQUESTOR") {
    return { error: "Tidak memiliki izin akses" };
  }

  const roomId = parseInt(formData.get("roomId") as string, 10);
  const dateStr = formData.get("date") as string;
  const startTimeStr = formData.get("startTime") as string;
  const endTimeStr = formData.get("endTime") as string;
  const purpose = formData.get("purpose") as string;

  if (!roomId || !dateStr || !startTimeStr || !endTimeStr || !purpose) {
    return { error: "Harap lengkapi semua bidang" };
  }

  // Parse local time assumption (for simple Next.js prototype)
  // Format: "YYYY-MM-DD", "HH:mm"
  const startDateTime = new Date(`${dateStr}T${startTimeStr}:00`);
  const endDateTime = new Date(`${dateStr}T${endTimeStr}:00`);

  if (startDateTime >= endDateTime) {
    return { error: "Waktu selesai harus lebih besar dari waktu mulai" };
  }

  if (startDateTime < new Date()) {
    return { error: "Tidak dapat reservasi waktu di masa lalu" };
  }

  // Check for conflict
  const conflict = await prisma.schedule.findFirst({
    where: {
      roomId,
      isBlocked: true,
      OR: [
        {
          startTime: { lt: endDateTime },
          endTime: { gt: startDateTime },
        },
      ],
    },
  });

  if (conflict) {
    return { error: "Ruangan tidak tersedia pada jadwal tersebut" };
  }

  // Create schedule placeholder (not blocked until approved)
  const schedule = await prisma.schedule.create({
    data: {
      roomId,
      startTime: startDateTime,
      endTime: endDateTime,
      isBlocked: false, // will be true upon final approval
    },
  });

  // We need to assign it to an appropriate Aggregator/Admin first
  const aggregators = await prisma.user.findMany({
    where: { role: "AGGREGATOR" },
    select: { id: true },
  });

  if (aggregators.length === 0) {
    return {
      error: "Sistem belum memiliki Admin (Aggregator) untuk meninjau.",
    };
  }

  // Randomly assign or just pick first
  const assignedAdminId = aggregators[0].id;

  // Create reservation
  await prisma.$transaction([
    prisma.reservation.create({
      data: {
        userId: session.userId,
        roomId,
        scheduleId: schedule.id,
        status: RESERVATION_STATUS.PENDING,
        purpose,
        approvalStages: {
          create: {
            stage: STAGE_STATUS.REQUESTED,
            approverId: assignedAdminId,
            status: RESERVATION_STATUS.PENDING,
            notes: "Menunggu ditinjau Admin",
          },
        },
      },
    }),
    prisma.notification.create({
      data: {
        userId: assignedAdminId,
        message:
          "Permintaan reservasi baru membutuhkan tinjauan Anda sebagai Admin.",
        link: "/admin/reservations",
      },
    }),
  ]);

  // --- Send Emails ---
  const requester = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { email: true, name: true },
  });
  const admin = await prisma.user.findUnique({
    where: { id: assignedAdminId },
    select: { email: true, name: true },
  });

  const { sendEmail, getEmailTemplate } = await import("@/lib/mail");

  if (requester?.email) {
    sendEmail({
      to: requester.email,
      subject: "Reservasi Ruangan Berhasil Diajukan - SIMARU",
      html: getEmailTemplate(
        "Reservasi Diajukan",
        `Halo ${requester.name}, reservasi Anda untuk ruangan sedang diproses dan menunggu peninjauan Admin.`,
        "/requester/reservations",
        "Cek Status Reservasi",
      ),
    }).catch((err) =>
      console.error("Background Email Error (Requester):", err),
    );
  }

  if (admin?.email) {
    sendEmail({
      to: admin.email,
      subject: "Permintaan Reservasi Baru - SIMARU",
      html: getEmailTemplate(
        "Review Reservasi Baru",
        `Halo Admin ${admin.name}, sebuah reservasi baru telah diajukan dan memerlukan tinjauan Anda.`,
        "/admin/reservations",
        "Review Sekarang",
      ),
    }).catch((err) => console.error("Background Email Error (Admin):", err));
  }
  // -------------------

  revalidatePath("/", "layout");
  redirect("/requester/reservations?success=true");
}
