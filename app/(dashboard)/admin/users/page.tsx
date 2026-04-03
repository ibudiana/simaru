import { PrismaClient } from '@prisma/client'
import { verifySession } from '@/lib/session'
import { redirect } from 'next/navigation'
import { UserManagementClient } from '@/components/UserManagementClient'

const prisma = new PrismaClient()

export default async function AdminUsersPage() {
  const session = await verifySession()
  if (!session?.userId || session.role !== 'AGGREGATOR') redirect('/login')

  const users = await prisma.user.findMany({
    orderBy: { id: 'asc' },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      organization: true,
      phone: true,
    }
  })

  return <UserManagementClient initialUsers={users} />
}
