'use server'

import prisma from '@/lib/prisma'
import { ReservationStatus } from '@prisma/client'
import { verifySession } from '@/lib/session'
import { revalidatePath } from 'next/cache'

export async function processKaprodiApproval(formData: FormData) {
  const session = await verifySession()
  if (!session || session.role !== 'APPROVER') {
    throw new Error('Akses ditolak')
  }

  const reservationId = parseInt(formData.get('reservationId') as string, 10)
  const action = formData.get('action') as string // 'APPROVE' or 'REJECT'
  const notes = formData.get('notes') as string

  const reservation = await prisma.reservation.findUnique({
    where: { id: reservationId },
    include: { approvalStages: true }
  })

  if (!reservation) throw new Error('Reservasi tidak ditemukan')

  // Update the stage belonging to this Kaprodi
  const kaprodiStage = reservation.approvalStages.find(
    s => s.approverId === session.userId && s.status === ReservationStatus.PENDING
  )

  if (!kaprodiStage) throw new Error('Tidak ada tugas persetujuan untuk Anda')

  if (action === 'REJECT') {
    await prisma.$transaction([
      prisma.approvalWorkflow.update({
        where: { id: kaprodiStage.id },
        data: { status: ReservationStatus.REJECTED, notes, approvedAt: new Date() }
      }),
      prisma.reservation.update({
        where: { id: reservationId },
        data: { status: ReservationStatus.REJECTED }
      }),
      prisma.notification.create({
        data: {
          userId: reservation.userId,
          message: `Persetujuan akhir untuk reservasi #${reservationId} ditolak oleh Kaprodi/Pimpinan.`,
          link: '/requester/reservations',
        }
      })
    ])
  } else if (action === 'APPROVE') {
    // Kaprodi approves -> Final approval!
    await prisma.$transaction([
      prisma.approvalWorkflow.update({
        where: { id: kaprodiStage.id },
        data: { status: ReservationStatus.APPROVED, notes, approvedAt: new Date() }
      }),
      // Finalize the overall reservation
      prisma.reservation.update({
        where: { id: reservationId },
        data: { status: ReservationStatus.APPROVED }
      }),
      // Lock the schedule finally!
      prisma.schedule.update({
        where: { id: reservation.scheduleId },
        data: { isBlocked: true }
      }),
      prisma.notification.create({
        data: {
          userId: reservation.userId,
          message: `Selamat! Reservasi #${reservationId} telah disetujui sepenuhnya oleh Kaprodi. Jadwal kini terkunci.`,
          link: '/requester/reservations',
        }
      })
    ])

    // --- Send Email Final Approval ---
    const requester = await prisma.user.findUnique({ where: { id: reservation.userId }, select: { email: true, name: true } })
    const { sendEmail, getEmailTemplate } = await import('@/lib/mail')

    if (requester?.email) {
      sendEmail({
        to: requester.email,
        subject: 'Reservasi SIMARU Disetujui Sepenuhnya!',
        html: getEmailTemplate(
          'Persetujuan Final Berhasil',
          `Halo ${requester.name}, kabar baik! Reservasi Anda (#${reservationId}) telah disetujui sepenuhnya oleh Kaprodi. Ruangan siap digunakan sesuai jadwal.`,
          '/requester/reservations',
          'Lihat Reservasi'
        )
      }).catch(err => console.error("Background Email Error (Requester):", err));
    }
  } else if (action === 'REJECT') {
    // Already handled rejection notification in transaction
    const requester = await prisma.user.findUnique({ where: { id: reservation.userId }, select: { email: true, name: true } })
    const { sendEmail, getEmailTemplate } = await import('@/lib/mail')

    if (requester?.email) {
      sendEmail({
        to: requester.email,
        subject: 'Reservasi SIMARU Ditolak oleh Kaprodi',
        html: getEmailTemplate(
          'Reservasi Ditolak Kaprodi',
          `Halo ${requester.name}, mohon maaf, reservasi Anda (#${reservationId}) ditolak pada tahap persetujuan final oleh Kaprodi dengan alasan: ${notes || '-'}`,
          '/requester/reservations',
          'Lihat Detail'
        )
      }).catch(err => console.error("Background Email Error (Requester):", err));
    }
  }
  // -------------------


  revalidatePath('/', 'layout')
  revalidatePath('/approver/reservations')
}
