'use server'

import { createSession, deleteSession } from '@/lib/session'
import prisma from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { redirect } from 'next/navigation'

export async function login(prevState: any, formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !password) {
    return { error: 'Harap isi email dan password' }
  }

  const user = await prisma.user.findUnique({
    where: { email },
  })

  if (!user || !user.password) {
    return { error: 'Kredensial tidak valid' }
  }

  const isValidPassword = await bcrypt.compare(password, user.password)

  if (!isValidPassword) {
    return { error: 'Kredensial tidak valid' }
  }

  // Create JWT session
  await createSession(user.id, user.role)

  // Redirect based on role
  if (user.role === 'REQUESTOR') {
    redirect('/requester')
  } else if (user.role === 'APPROVER') {
    redirect('/approver')
  } else if (['AGGREGATOR', 'SUPER_ADMIN'].includes(user.role)) {
    redirect('/admin')
  } else {
    redirect('/') // Fallback to root for any other roles
  }
}

export async function logout() {
  await deleteSession()
  redirect('/login')
}
