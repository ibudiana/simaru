import prisma from '@/lib/prisma'
import { verifySession } from '@/lib/session'
import { redirect } from 'next/navigation'
import { RoomManagementClient } from '@/components/RoomManagementClient'

export default async function AdminRoomsPage() {
  const session = await verifySession()
  if (!session?.userId || session.role !== 'AGGREGATOR') redirect('/login')

  const [rooms, users, allFacilities] = await Promise.all([
    prisma.room.findMany({
      orderBy: { id: 'asc' },
      include: {
        facilities: { include: { facility: true } },
        approver: { select: { name: true } }
      }
    }),
    prisma.user.findMany({
      where: { role: 'APPROVER' },
      select: { id: true, name: true }
    }),
    prisma.facility.findMany({
      orderBy: { name: 'asc' }
    })
  ])

  return <RoomManagementClient initialRooms={rooms} approvers={users} allFacilities={allFacilities} />
}
