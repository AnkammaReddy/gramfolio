"use server"

import { headers } from "next/headers"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { communityInsights, insightReactions, user } from "@/lib/db/schema"
import { eq, and, sql } from "drizzle-orm"
import { AUTH_DISABLED, DEMO_USER } from "@/lib/auth-config"

export type InsightWithReactions = {
  id: number
  title: string
  body: string
  weekLabel: string
  likes: number
  dislikes: number
  userReaction: "like" | "dislike" | null
  userHidden: boolean
}

export async function getActiveInsight(): Promise<InsightWithReactions | null> {
  // Get the single active insight
  const [insight] = await db
    .select()
    .from(communityInsights)
    .where(eq(communityInsights.isActive, true))
    .orderBy(communityInsights.createdAt)
    .limit(1)

  if (!insight) return null

  // Get reaction counts
  const counts = await db.execute(sql`
    SELECT
      reaction,
      COUNT(*)::int AS count
    FROM insight_reactions
    WHERE "insightId" = ${insight.id}
    GROUP BY reaction
  `)
  const rows = (Array.isArray(counts) ? counts : (counts as { rows: unknown[] }).rows) as {
    reaction: string
    count: number
  }[]
  const likes = rows.find((r) => r.reaction === "like")?.count ?? 0
  const dislikes = rows.find((r) => r.reaction === "dislike")?.count ?? 0

  // Get current user's reactions (like/dislike/hidden)
  let userReaction: "like" | "dislike" | null = null
  let userHidden = false
  try {
    let userId: string | null = null
    if (AUTH_DISABLED) {
      userId = DEMO_USER.id
    } else {
      const session = await auth.api.getSession({ headers: await headers() })
      userId = session?.user?.id ?? null
    }
    if (userId) {
      const rows = await db
        .select()
        .from(insightReactions)
        .where(
          and(
            eq(insightReactions.insightId, insight.id),
            eq(insightReactions.userId, userId),
          ),
        )
      for (const r of rows) {
        if (r.reaction === "hidden") userHidden = true
        else userReaction = r.reaction as "like" | "dislike"
      }
    }
  } catch {
    // unauthenticated — no user reaction
  }

  // Don't surface the insight if the user has hidden it
  if (userHidden) return null

  return { id: insight.id, title: insight.title, body: insight.body, weekLabel: insight.weekLabel, likes, dislikes, userReaction, userHidden }
}

export async function reactToInsight(insightId: number, reaction: "like" | "dislike"): Promise<{ likes: number; dislikes: number; userReaction: "like" | "dislike" | null }> {
  let userId: string
  if (AUTH_DISABLED) {
    userId = DEMO_USER.id
  } else {
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session?.user) throw new Error("Not authenticated")
    userId = session.user.id
  }

  // Check existing reaction
  const [existing] = await db
    .select()
    .from(insightReactions)
    .where(and(eq(insightReactions.insightId, insightId), eq(insightReactions.userId, userId)))

  let userReaction: "like" | "dislike" | null

  if (existing?.reaction === reaction) {
    // Toggle off — remove reaction
    await db.delete(insightReactions).where(
      and(eq(insightReactions.insightId, insightId), eq(insightReactions.userId, userId)),
    )
    userReaction = null
  } else if (existing) {
    // Switch reaction
    await db
      .update(insightReactions)
      .set({ reaction })
      .where(and(eq(insightReactions.insightId, insightId), eq(insightReactions.userId, userId)))
    userReaction = reaction
  } else {
    // New reaction
    await db.insert(insightReactions).values({ insightId, userId, reaction })
    userReaction = reaction
  }

  // Return updated counts
  const counts = await db.execute(sql`
    SELECT reaction, COUNT(*)::int AS count
    FROM insight_reactions
    WHERE "insightId" = ${insightId}
    GROUP BY reaction
  `)
  const rows = (Array.isArray(counts) ? counts : (counts as { rows: unknown[] }).rows) as { reaction: string; count: number }[]
  return {
    likes: rows.find((r) => r.reaction === "like")?.count ?? 0,
    dislikes: rows.find((r) => r.reaction === "dislike")?.count ?? 0,
    userReaction,
  }
}

// User: hide an insight so it no longer appears on their dashboard
export async function hideInsight(insightId: number): Promise<void> {
  let userId: string
  if (AUTH_DISABLED) {
    userId = DEMO_USER.id
  } else {
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session?.user) throw new Error("Not authenticated")
    userId = session.user.id
  }
  // Upsert a "hidden" reaction row (separate from like/dislike)
  await db
    .insert(insightReactions)
    .values({ insightId, userId, reaction: "hidden" })
    .onConflictDoNothing()
}

// Admin: toggle an insight active/inactive
export async function toggleInsightActive(insightId: number, active: boolean): Promise<void> {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error("Not authenticated")
  const [u] = await db.select({ role: user.role }).from(user).where(eq(user.id, session.user.id))
  if (u?.role !== "admin") throw new Error("Not authorized")

  if (active) {
    // Deactivate all others first
    await db.update(communityInsights).set({ isActive: false }).where(eq(communityInsights.isActive, true))
  }
  await db.update(communityInsights).set({ isActive: active }).where(eq(communityInsights.id, insightId))
}

// Admin: create a new insight (deactivates any existing active insight)
export async function createCommunityInsight(title: string, body: string, weekLabel: string): Promise<void> {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error("Not authenticated")

  const [u] = await db.select({ role: user.role }).from(user).where(eq(user.id, session.user.id))
  if (u?.role !== "admin") throw new Error("Not authorized")

  // Deactivate all existing active insights
  await db.update(communityInsights).set({ isActive: false }).where(eq(communityInsights.isActive, true))

  await db.insert(communityInsights).values({
    title,
    body,
    weekLabel,
    isActive: true,
    createdBy: session.user.id,
  })
}

// Admin: get all insights for management
export async function getAllInsights() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error("Not authenticated")
  const [u] = await db.select({ role: user.role }).from(user).where(eq(user.id, session.user.id))
  if (u?.role !== "admin") throw new Error("Not authorized")

  const insights = await db
    .select()
    .from(communityInsights)
    .orderBy(communityInsights.createdAt)

  // Attach reaction counts
  const withCounts = await Promise.all(
    insights.map(async (ins) => {
      const counts = await db.execute(sql`
        SELECT reaction, COUNT(*)::int AS count
        FROM insight_reactions
        WHERE "insightId" = ${ins.id} AND reaction != 'hidden'
        GROUP BY reaction
      `)
      const rows = (Array.isArray(counts) ? counts : (counts as { rows: unknown[] }).rows) as { reaction: string; count: number }[]
      return {
        ...ins,
        likes: rows.find((r) => r.reaction === "like")?.count ?? 0,
        dislikes: rows.find((r) => r.reaction === "dislike")?.count ?? 0,
      }
    }),
  )

  return withCounts
}
