'use server'

import prisma from '@/lib/prisma'
import { verifySession } from '@/lib/session'
import { revalidatePath } from 'next/cache'

export async function createRoom(formData: FormData) {
  const session = await verifySession()
  if (!session || session.role !== 'AGGREGATOR') {
    throw new Error('Akses ditolak')
  }

  const name = formData.get('name') as string
  const location = formData.get('location') as string
  const capacity = parseInt(formData.get('capacity') as string, 10)
  const approverId = formData.get('approverId') ? parseInt(formData.get('approverId') as string, 10) : undefined
  const facilityIds = formData.getAll('facilities').map(id => parseInt(id as string, 10))

  await prisma.$transaction(async (tx) => {
    const room = await tx.room.create({
      data: {
        name,
        location,
        capacity,
        approverId,
      },
    })

    if (facilityIds.length > 0) {
      await tx.roomFacility.createMany({
        data: facilityIds.map(fId => ({
          roomId: room.id,
          facilityId: fId,
        }))
      })
    }
  })

  revalidatePath('/admin/rooms')
}

export async function updateRoom(formData: FormData) {
  const session = await verifySession()
  if (!session || session.role !== 'AGGREGATOR') {
    throw new Error('Akses ditolak')
  }

  const id = parseInt(formData.get('id') as string, 10)
  const name = formData.get('name') as string
  const location = formData.get('location') as string
  const capacity = parseInt(formData.get('capacity') as string, 10)
  const approverId = formData.get('approverId') ? parseInt(formData.get('approverId') as string, 10) : undefined
  const facilityIds = formData.getAll('facilities').map(id => parseInt(id as string, 10))

  await prisma.$transaction(async (tx) => {
    await tx.room.update({
      where: { id },
      data: {
        name,
        location,
        capacity,
        approverId,
      },
    })

    // Sync facilities: delete all and re-create
    await tx.roomFacility.deleteMany({
      where: { roomId: id }
    })

    if (facilityIds.length > 0) {
      await tx.roomFacility.createMany({
        data: facilityIds.map(fId => ({
          roomId: id,
          facilityId: fId,
        }))
      })
    }
  })

  revalidatePath('/admin/rooms')
}

export async function deleteRoom(id: number) {
  const session = await verifySession()
  if (!session || session.role !== 'AGGREGATOR') {
    throw new Error('Akses ditolak')
  }

  await prisma.room.delete({
    where: { id },
  })

  revalidatePath('/admin/rooms')
}
