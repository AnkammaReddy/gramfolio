"use server"

import { db } from "@/lib/db"
import { conversations, messages, user } from "@/lib/db/schema"
import { getUserId } from "@/lib/session"
import { AUTH_DISABLED, DEMO_USER, assertNotDemo } from "@/lib/auth-config"
import { encryptMessage, decryptMessage } from "@/lib/message-crypto"
import { messageBodySchema, conversationIdSchema } from "@/lib/validation"
import {
  assertUserCanUseMessages,
  checkMessageSendRateLimit,
  logMessageSent,
} from "@/lib/message-security"
import type { ConversationDTO, MessageDTO, MessageSenderRole } from "@/lib/types"
import { getMessageTopic } from "@/lib/message-topics"
import { and, desc, eq, isNull, sql } from "drizzle-orm"
import { revalidatePath } from "next/cache"

const MESSAGE_LIMIT = 100

async function requireAdminUserId(): Promise<string> {
  const callerUserId = AUTH_DISABLED ? DEMO_USER.id : await getUserId()
  const [u] = await db.select({ role: user.role }).from(user).where(eq(user.id, callerUserId)).limit(1)
  if (!u || u.role !== "admin") throw new Error("Forbidden")
  return callerUserId
}

async function isAdminUser(userId: string): Promise<boolean> {
  const [u] = await db.select({ role: user.role }).from(user).where(eq(user.id, userId)).limit(1)
  return u?.role === "admin"
}

function mapMessageRow(
  row: {
    id: number
    conversationId: number
    senderId: string
    senderRole: string
    bodyCiphertext: string
    encryptionVersion: number
    createdAt: Date
    readAt: Date | null
  },
  viewerId: string,
): MessageDTO {
  return {
    id: row.id,
    conversationId: row.conversationId,
    senderRole: row.senderRole as MessageSenderRole,
    body: decryptMessage(row.bodyCiphertext, row.encryptionVersion),
    createdAt: row.createdAt.toISOString(),
    readAt: row.readAt?.toISOString() ?? null,
    isMine: row.senderId === viewerId,
  }
}

async function getConversationForMember(userId: string) {
  const [row] = await db
    .select()
    .from(conversations)
    .where(eq(conversations.userId, userId))
    .limit(1)
  return row ?? null
}

async function getOrCreateConversation(userId: string) {
  const existing = await getConversationForMember(userId)
  if (existing) return existing

  const [created] = await db
    .insert(conversations)
    .values({ userId })
    .returning()
  return created
}

async function assertCanAccessConversation(
  conversationId: number,
  userId: string,
): Promise<{ conversation: typeof conversations.$inferSelect; isAdmin: boolean }> {
  const [conversation] = await db
    .select()
    .from(conversations)
    .where(eq(conversations.id, conversationId))
    .limit(1)
  if (!conversation) throw new Error("Conversation not found")

  const admin = await isAdminUser(userId)
  if (!admin && conversation.userId !== userId) {
    throw new Error("Forbidden")
  }
  return { conversation, isAdmin: admin }
}

async function fetchMessages(conversationId: number, viewerId: string): Promise<MessageDTO[]> {
  const rows = await db
    .select()
    .from(messages)
    .where(eq(messages.conversationId, conversationId))
    .orderBy(desc(messages.createdAt))
    .limit(MESSAGE_LIMIT)

  return rows.reverse().map((row) => mapMessageRow(row, viewerId))
}

export async function getMyConversationMessages(): Promise<{
  conversationId: number | null
  messages: MessageDTO[]
}> {
  const userId = AUTH_DISABLED ? DEMO_USER.id : await getUserId()
  await assertUserCanUseMessages(userId)
  const conversation = await getConversationForMember(userId)
  if (!conversation) {
    return { conversationId: null, messages: [] }
  }

  const list = await fetchMessages(conversation.id, userId)
  await markConversationReadInternal(conversation.id, userId)
  return { conversationId: conversation.id, messages: list }
}

export async function sendMemberMessage(body: string) {
  const userId = AUTH_DISABLED ? DEMO_USER.id : await getUserId()
  assertNotDemo(userId)
  await assertUserCanUseMessages(userId)
  await checkMessageSendRateLimit(userId, "member")
  const parsed = messageBodySchema.parse(body)
  const conversation = await getOrCreateConversation(userId)
  const { ciphertext, version } = encryptMessage(parsed)
  const now = new Date()

  await db.insert(messages).values({
    conversationId: conversation.id,
    senderId: userId,
    senderRole: "member",
    bodyCiphertext: ciphertext,
    encryptionVersion: version,
  })

  await db
    .update(conversations)
    .set({ lastMessageAt: now, updatedAt: now })
    .where(eq(conversations.id, conversation.id))

  await logMessageSent(userId, "member", conversation.id)
  revalidatePath("/messages")
  revalidatePath("/admin/messages")
}

/** Notify admin when a member clicks a card referral apply link on the dashboard. */
export async function notifyAdminCardReferralInterest() {
  const topic = getMessageTopic("card-referrals")
  await sendMemberMessage(topic.draft)
}

export async function listConversationsForAdmin(): Promise<ConversationDTO[]> {
  await requireAdminUserId()

  const rows = await db
    .select({
      id: conversations.id,
      userId: conversations.userId,
      lastMessageAt: conversations.lastMessageAt,
      userName: user.name,
      userEmail: user.email,
      unreadCount: sql<number>`(
        SELECT COUNT(*)::int FROM messages m
        WHERE m."conversationId" = ${conversations.id}
          AND m."senderRole" = 'member'
          AND m."readAt" IS NULL
      )`,
    })
    .from(conversations)
    .leftJoin(user, eq(conversations.userId, user.id))
    .orderBy(desc(conversations.lastMessageAt))

  return rows.map((row) => ({
    id: row.id,
    userId: row.userId,
    userName: row.userName,
    userEmail: row.userEmail,
    lastMessageAt: row.lastMessageAt.toISOString(),
    unreadCount: row.unreadCount ?? 0,
  }))
}

export async function getAdminConversationMessages(
  conversationId: number,
): Promise<MessageDTO[]> {
  const adminId = await requireAdminUserId()
  const id = conversationIdSchema.parse(conversationId)
  await assertCanAccessConversation(id, adminId)
  const list = await fetchMessages(id, adminId)
  await markConversationReadInternal(id, adminId)
  return list
}

export async function sendAdminMessage(conversationId: number, body: string) {
  const adminId = await requireAdminUserId()
  assertNotDemo(adminId)
  const id = conversationIdSchema.parse(conversationId)
  await assertCanAccessConversation(id, adminId)
  await checkMessageSendRateLimit(adminId, "admin")
  const parsed = messageBodySchema.parse(body)
  const { ciphertext, version } = encryptMessage(parsed)
  const now = new Date()

  await db.insert(messages).values({
    conversationId: id,
    senderId: adminId,
    senderRole: "admin",
    bodyCiphertext: ciphertext,
    encryptionVersion: version,
  })

  await db
    .update(conversations)
    .set({ lastMessageAt: now, updatedAt: now })
    .where(eq(conversations.id, id))

  await logMessageSent(adminId, "admin", id)
  revalidatePath("/messages")
  revalidatePath("/admin/messages")
}

async function markConversationReadInternal(conversationId: number, userId: string) {
  const { isAdmin } = await assertCanAccessConversation(conversationId, userId)
  const senderRoleToMark: MessageSenderRole = isAdmin ? "member" : "admin"

  await db
    .update(messages)
    .set({ readAt: new Date() })
    .where(
      and(
        eq(messages.conversationId, conversationId),
        eq(messages.senderRole, senderRoleToMark),
        isNull(messages.readAt),
      ),
    )
}
