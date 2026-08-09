"use server"

import { db } from "@/lib/db"
import { invites, user } from "@/lib/db/schema"
import { getUserId } from "@/lib/session"
import { AUTH_DISABLED, DEMO_USER } from "@/lib/auth-config"
import { eq, desc } from "drizzle-orm"

import { revalidatePath } from "next/cache"
import crypto from "crypto"

async function requireAdmin() {
  // In dev/preview bypass mode, skip the DB role check
  if (AUTH_DISABLED) return DEMO_USER.id

  const userId = await getUserId()
  const [u] = await db.select({ role: user.role }).from(user).where(eq(user.id, userId))
  if (!u || u.role !== "admin") throw new Error("Forbidden")
  return userId
}

export async function createInvite(email?: string) {
  const adminId = await requireAdmin()
  const token = crypto.randomBytes(24).toString("hex")
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

  await db.insert(invites).values({
    token,
    email: email || null,
    createdBy: adminId,
    expiresAt,
  })

  revalidatePath("/admin/invites")
  return token
}

export async function revokeInvite(id: number) {
  await requireAdmin()
  // Mark as used immediately so it can't be redeemed
  await db
    .update(invites)
    .set({ usedAt: new Date(), usedBy: "revoked" })
    .where(eq(invites.id, id))
  revalidatePath("/admin/invites")
}

export async function getInvites() {
  await requireAdmin()
  return db.select().from(invites).orderBy(desc(invites.createdAt))
}

export async function getAllUsers() {
  await requireAdmin()
  return db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
    })
    .from(user)
    .orderBy(desc(user.createdAt))
}

/** Called from the sign-up page to validate a token before allowing registration. */
export async function validateInviteToken(token: string) {
  const [invite] = await db
    .select()
    .from(invites)
    .where(eq(invites.token, token))

  if (!invite) return { valid: false, reason: "Invalid invite link." }
  if (invite.usedAt) return { valid: false, reason: "This invite has already been used." }
  if (invite.expiresAt < new Date()) return { valid: false, reason: "This invite has expired." }

  return { valid: true, email: invite.email, inviteId: invite.id }
}

/** Called after successful signup to mark the invite as consumed. */
export async function consumeInviteToken(token: string, newUserId: string) {
  await db
    .update(invites)
    .set({ usedAt: new Date(), usedBy: newUserId })
    .where(eq(invites.token, token))
}
