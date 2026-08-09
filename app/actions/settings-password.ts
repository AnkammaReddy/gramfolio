'use server'

import { hashPassword } from 'better-auth/crypto'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { account, userSettings } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'

async function getUserId() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error('Unauthorized')
  return session.user.id
}

export async function setPassword(newPassword: string) {
  const userId = await getUserId()

  if (newPassword.length < 8) {
    throw new Error('Password must be at least 8 characters')
  }
  if (!/[A-Z]/.test(newPassword)) {
    throw new Error('Password must contain at least one uppercase letter')
  }
  if (!/[0-9]/.test(newPassword)) {
    throw new Error('Password must contain at least one number')
  }

  // Hash password using Better Auth's crypto (same as admin reset)
  const hashedPassword = await hashPassword(newPassword)

  // Update password and clear temporary flag
  await db
    .update(account)
    .set({ 
      password: hashedPassword,
      passwordIsTemporary: false,
      updatedAt: new Date(),
    })
    .where(eq(account.userId, userId))

  return { success: true }
}

export async function setRecoveryPin(pin: string) {
  const userId = await getUserId()

  // Validate PIN is 4-6 digits
  if (!/^\d{4,6}$/.test(pin)) {
    throw new Error('PIN must be 4-6 digits')
  }

  // Hash the PIN using Better Auth's crypto (same as password)
  const hashedPin = await hashPassword(pin)

  // Update user_settings with PIN (not account table)
  await db
    .update(userSettings)
    .set({ 
      recoveryPin: hashedPin,
      updatedAt: new Date(),
    })
    .where(eq(userSettings.userId, userId))

  revalidatePath("/settings")
  return { success: true }
}


