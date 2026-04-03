'use server'

import prisma from '@/lib/prisma'
import { verifySession } from '@/lib/session'
import { revalidatePath } from 'next/cache'
import bcrypt from 'bcryptjs'

type Role = 'AGGREGATOR' | 'REQUESTOR' | 'APPROVER'

export async function createUser(formData: FormData) {
  const session = await verifySession()
  if (!session || session.role !== 'AGGREGATOR') {
    throw new Error('Akses ditolak')
  }

  const name = formData.get('name') as string
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const role = formData.get('role') as Role
  const organization = formData.get('organization') as string
  const phone = formData.get('phone') as string

  const passwordHash = await bcrypt.hash(password || 'password123', 10)

  await prisma.user.create({
    data: {
      name,
      email,
      password: passwordHash,
      role,
      organization,
      phone,
    },
  })

  revalidatePath('/admin/users')
}

export async function updateUser(formData: FormData) {
  const session = await verifySession()
  if (!session || session.role !== 'AGGREGATOR') {
    throw new Error('Akses ditolak')
  }

  const id = parseInt(formData.get('id') as string, 10)
  const name = formData.get('name') as string
  const email = formData.get('email') as string
  const role = formData.get('role') as Role
  const organization = formData.get('organization') as string
  const phone = formData.get('phone') as string

  await prisma.user.update({
    where: { id },
    data: {
      name,
      email,
      role,
      organization,
      phone,
    },
  })

  revalidatePath('/admin/users')
}

export async function deleteUser(id: number) {
  const session = await verifySession()
  if (!session || session.role !== 'AGGREGATOR') {
    throw new Error('Akses ditolak')
  }

  // Prevent self-deletion
  if (id === session.userId) {
    throw new Error('Tidak dapat menghapus akun sendiri.')
  }

  await prisma.user.delete({
    where: { id },
  })

  revalidatePath('/admin/users')
}
