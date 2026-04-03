"use server";

import prisma from "@/lib/prisma";
import { verifySession } from "@/lib/session";
import { revalidatePath } from "next/cache";
import {
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  parseISO,
} from "date-fns";

const RESERVATION_STATUS = {
  PENDING: "PENDING",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
} as const;

const STAGE_STATUS = {
  APPROVED: "APPROVED",
} as const;

export async function processAdminApproval(formData: FormData) {
  const session = await verifySession();
  if (!session || session.role !== "AGGREGATOR") {
    throw new Error("Akses ditolak");
  }

  const reservationId = parseInt(formData.get("reservationId") as string, 10);
  const action = formData.get("action") as string; // 'APPROVE' or 'REJECT'
  const notes = formData.get("notes") as string;

  const reservation = await prisma.reservation.findUnique({
    where: { id: reservationId },
    include: {
      approvalStages: true,
      room: true,
    },
  });

  if (!reservation) throw new Error("Reservasi tidak ditemukan");

  // Update the stage belonging to this Admin
  const adminStage = reservation.approvalStages.find(
    (s) =>
      s.approverId === session.userId &&
      s.status === RESERVATION_STATUS.PENDING,
  );

  if (!adminStage) throw new Error("Tidak ada tugas persetujuan untuk Anda");

  if (action === "REJECT") {
    await prisma.$transaction([
      prisma.approvalWorkflow.update({
        where: { id: adminStage.id },
        data: {
          status: RESERVATION_STATUS.REJECTED,
          notes,
          approvedAt: new Date(),
        },
      }),
      prisma.reservation.update({
        where: { id: reservationId },
        data: { status: RESERVATION_STATUS.REJECTED },
      }),
      prisma.notification.create({
        data: {
          userId: reservation.userId,
          message: `Reservasi #${reservationId} ditolak oleh Admin.`,
          link: "/requester/reservations",
        },
      }),
    ]);
  } else if (action === "APPROVE") {
    // Admin approves -> forward to the specific room approver (Kaprodi)
    const targetApproverId = reservation.room.approverId;
    let finalApproverId: number;

    if (!targetApproverId) {
      // Fallback to first approver if none specifically assigned (though it should be assigned)
      const approvers = await prisma.user.findMany({
        where: { role: "APPROVER" },
      });
      if (approvers.length === 0) {
        throw new Error("Tidak ada Kaprodi di dalam sistem.");
      }
      finalApproverId = approvers[0].id;
    } else {
      finalApproverId = targetApproverId;
    }

    await prisma.$transaction([
      prisma.approvalWorkflow.update({
        where: { id: adminStage.id },
        data: {
          status: RESERVATION_STATUS.APPROVED,
          notes,
          approvedAt: new Date(),
        },
      }),
      // Create next stage
      prisma.approvalWorkflow.create({
        data: {
          reservationId,
          stage: STAGE_STATUS.APPROVED, // next stage after REQUESTED
          approverId: finalApproverId,
          status: RESERVATION_STATUS.PENDING,
          notes: "Menunggu persetujuan final dari Kaprodi / Pimpinan",
        },
      }),
      prisma.notification.create({
        data: {
          userId: reservation.userId,
          message: `Reservasi Anda sedang diteruskan ke Kaprodi untuk persetujuan akhir.`,
          link: "/requester/reservations",
        },
      }),
      prisma.notification.create({
        data: {
          userId: finalApproverId,
          message: `Sebuah reservasi baru (#${reservationId}) telah diverifikasi Admin dan menunggu persetujuan Anda.`,
          link: "/approver",
        },
      }),
    ]);

    // --- Send Emails ---
    const requester = await prisma.user.findUnique({
      where: { id: reservation.userId },
      select: { email: true, name: true },
    });
    const finalApprover = await prisma.user.findUnique({
      where: { id: finalApproverId },
      select: { email: true, name: true },
    });
    const { sendEmail, getEmailTemplate } = await import("@/lib/mail");

    if (requester?.email) {
      sendEmail({
        to: requester.email,
        subject: "Progress Reservasi SIMARU: Diverifikasi Admin",
        html: getEmailTemplate(
          "Reservasi Diverifikasi",
          `Halo ${requester.name}, reservasi Anda (#${reservationId}) telah diverifikasi oleh Admin dan kini diteruskan ke Kaprodi untuk persetujuan akhir.`,
          "/requester/reservations",
          "Cek Status",
        ),
      }).catch((err) =>
        console.error("Background Email Error (Requester):", err),
      );
    }

    if (finalApprover?.email) {
      sendEmail({
        to: finalApprover.email,
        subject: "Menunggu Persetujuan Final - SIMARU",
        html: getEmailTemplate(
          "Persetujuan Final Diperlukan",
          `Halo ${finalApprover.name}, sebuah reservasi (#${reservationId}) telah diverifikasi Admin dan memerlukan persetujuan akhir dari Anda.`,
          "/approver",
          "Review Reservasi",
        ),
      }).catch((err) =>
        console.error("Background Email Error (Approver):", err),
      );
    }
  } else if (action === "REJECT") {
    // If rejected, also send email to requester
    const requester = await prisma.user.findUnique({
      where: { id: reservation.userId },
      select: { email: true, name: true },
    });
    const { sendEmail, getEmailTemplate } = await import("@/lib/mail");

    if (requester?.email) {
      sendEmail({
        to: requester.email,
        subject: "Reservasi SIMARU Ditolak",
        html: getEmailTemplate(
          "Reservasi Ditolak",
          `Halo ${requester.name}, mohon maaf, reservasi Anda (#${reservationId}) ditolak oleh Admin dengan alasan: ${notes || "-"}`,
          "/requester/reservations",
          "Lihat Detail",
        ),
      }).catch((err) =>
        console.error("Background Email Error (Requester):", err),
      );
    }
  }
  // -------------------

  revalidatePath("/", "layout");
  revalidatePath("/admin/reservations");
}

function calculateDateRange(filter: {
  type: "daily" | "weekly" | "monthly" | "yearly" | "custom";
  date?: string;
  month?: number;
  year?: number;
  startDate?: string;
  endDate?: string;
}) {
  let start: Date;
  let end: Date;

  const now = new Date();
  const year = filter.year || now.getFullYear();
  const month = filter.month !== undefined ? filter.month : now.getMonth();

  switch (filter.type) {
    case "daily":
      const d = filter.date ? parseISO(filter.date) : now;
      start = startOfDay(d);
      end = endOfDay(d);
      break;
    case "weekly":
      const w = filter.date ? parseISO(filter.date) : now;
      start = startOfWeek(w, { weekStartsOn: 1 }); // Monday
      end = endOfWeek(w, { weekStartsOn: 1 });
      break;
    case "monthly":
      start = startOfMonth(new Date(year, month));
      end = endOfMonth(new Date(year, month));
      break;
    case "yearly":
      start = startOfYear(new Date(year, 0));
      end = endOfYear(new Date(year, 0));
      break;
    case "custom":
      start = filter.startDate
        ? startOfDay(parseISO(filter.startDate))
        : startOfMonth(now);
      end = filter.endDate
        ? endOfDay(parseISO(filter.endDate))
        : endOfMonth(now);
      break;
    default:
      start = startOfMonth(now);
      end = endOfMonth(now);
  }

  return { start, end };
}

export async function getReportData(filter: {
  type: "daily" | "weekly" | "monthly" | "yearly" | "custom";
  date?: string;
  month?: number;
  year?: number;
  startDate?: string;
  endDate?: string;
}) {
  const session = await verifySession();
  if (!session || session.role !== "AGGREGATOR") {
    throw new Error("Akses ditolak");
  }

  const { start, end } = calculateDateRange(filter);

  const reservations = await prisma.reservation.findMany({
    where: {
      schedule: {
        startTime: { gte: start, lte: end },
      },
    },
    include: {
      user: { select: { name: true, organization: true, email: true } },
      room: { select: { name: true, location: true } },
      schedule: true,
    },
    orderBy: { schedule: { startTime: "desc" } },
  });

  return reservations.map((r) => ({
    "ID Reservasi": r.id,
    "Nama Pemohon": r.user.name,
    Email: r.user.email,
    Organisasi: r.user.organization || "-",
    Ruangan: r.room.name,
    Lokasi: r.room.location,
    Tanggal: new Intl.DateTimeFormat("id-ID", { dateStyle: "long" }).format(
      new Date(r.schedule.startTime),
    ),
    Jam: `${new Intl.DateTimeFormat("id-ID", { timeStyle: "short" }).format(new Date(r.schedule.startTime))} - ${new Intl.DateTimeFormat("id-ID", { timeStyle: "short" }).format(new Date(r.schedule.endTime))}`,
    Tujuan: r.purpose,
    Status: r.status,
  }));
}

export async function getReportStats(filter: {
  type: "daily" | "weekly" | "monthly" | "yearly" | "custom";
  date?: string;
  month?: number;
  year?: number;
  startDate?: string;
  endDate?: string;
}) {
  const session = await verifySession();
  if (!session || session.role !== "AGGREGATOR") {
    throw new Error("Akses ditolak");
  }

  const { start, end } = calculateDateRange(filter);

  const [total, approved, pending] = await Promise.all([
    prisma.reservation.count({
      where: {
        schedule: {
          startTime: { gte: start, lte: end },
        },
      },
    }),
    prisma.reservation.count({
      where: {
        status: "APPROVED",
        schedule: {
          startTime: { gte: start, lte: end },
        },
      },
    }),
    prisma.reservation.count({
      where: {
        status: "PENDING",
        schedule: {
          startTime: { gte: start, lte: end },
        },
      },
    }),
  ]);

  return { total, approved, pending };
}
