import { verifySession } from '@/lib/session'
import prisma from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { DashboardLayout } from '@/components/DashboardLayout'
import { revalidatePath } from 'next/cache'

export const dynamic = 'force-dynamic'

export default async function Layout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await verifySession()

  if (!session?.userId) {
    redirect('/login')
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      name: true,
      role: true,
      organization: true,
    }
  })

  if (!user) {
    redirect('/login?logout=1')
  }

  const notifications = await prisma.notification.findMany({
    where: { userId: user.id },
    select: {
      id: true,
      message: true,
      link: true,
      timestamp: true,
    },
    orderBy: { timestamp: 'desc' },
    take: 5
  })

  if (!user) return null

  return (
    <DashboardLayout user={user} notifications={notifications}>
      {children}
    </DashboardLayout>
  )
}
