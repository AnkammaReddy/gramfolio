"use server"

import { db } from "@/lib/db"
import { feedback, user } from "@/lib/db/schema"
import { getUserId } from "@/lib/session"
import { AUTH_DISABLED, DEMO_USER, assertNotDemo } from "@/lib/auth-config"
import { desc, eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { z } from "zod"

// Strip leading formula injection characters used in CSV/spreadsheet attacks
// e.g. =SUM(...), +cmd, -cmd, @SUM, |'/C calc'
function sanitizeMessage(raw: string): string {
  return raw.replace(/^[=+\-@|]+/, "").trim()
}

const feedbackSchema = z.object({
  category: z.enum(["general", "bug", "feature", "praise", "contribute", "service_request"]),
  message: z
    .string()
    .min(10, "Please write at least 10 characters")
    .max(1000)
    .transform(sanitizeMessage)
    .refine((v) => v.length >= 10, "Please write at least 10 characters"),
  rating: z.number().min(1).max(5).optional(),
})

export type FeedbackInput = z.infer<typeof feedbackSchema>

export async function submitFeedback(input: FeedbackInput) {
  const userId = AUTH_DISABLED ? DEMO_USER.id : await getUserId()
  assertNotDemo(userId)
  const parsed = feedbackSchema.parse(input)
  await db.insert(feedback).values({
    userId,
    category: parsed.category,
    message: parsed.message,
    rating: parsed.rating ?? null,
  })
  revalidatePath("/feedback")
}

/** Lightweight click tracking for card-referral contribute links (stored as contribute feedback). */
export async function trackReferralClick(cardId: string) {
  const userId = AUTH_DISABLED ? DEMO_USER.id : await getUserId()
  assertNotDemo(userId)
  const id = z.string().min(1).max(60).parse(cardId)
  await db.insert(feedback).values({
    userId,
    category: "contribute",
    message: `Clicked card referral link: ${id}. Contribute via card referral.`,
    rating: null,
  })
  revalidatePath("/feedback")
  revalidatePath("/admin/feedback")
}

export async function getMyFeedback() {
  const userId = AUTH_DISABLED ? DEMO_USER.id : await getUserId()
  return db
    .select()
    .from(feedback)
    .where(eq(feedback.userId, userId))
    .orderBy(desc(feedback.createdAt))
}

async function requireAdmin() {
  const callerUserId = AUTH_DISABLED ? DEMO_USER.id : await getUserId()
  const [u] = await db.select({ role: user.role }).from(user).where(eq(user.id, callerUserId)).limit(1)
  if (!u || u.role !== "admin") throw new Error("Forbidden")
}

// Admin only — get all feedback with user info
export async function getAllFeedback() {
  await requireAdmin()
  const rows = await db
    .select({
      id: feedback.id,
      userId: feedback.userId,
      category: feedback.category,
      message: feedback.message,
      rating: feedback.rating,
      createdAt: feedback.createdAt,
      readAt: feedback.readAt,
      userName: user.name,
      userEmail: user.email,
    })
    .from(feedback)
    .leftJoin(user, eq(feedback.userId, user.id))
    .orderBy(desc(feedback.createdAt))
  return rows
}

export async function markFeedbackRead(id: number) {
  await requireAdmin()
  await db
    .update(feedback)
    .set({ readAt: new Date() })
    .where(eq(feedback.id, id))
  revalidatePath("/admin/feedback")
}
