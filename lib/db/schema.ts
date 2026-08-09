import {
  pgTable,
  text,
  timestamp,
  boolean,
  serial,
  integer,
  numeric,
  date,
  jsonb,
} from "drizzle-orm/pg-core"

/* ----------------------------- Better Auth tables ----------------------------- */
// Column names are camelCase to match Better Auth defaults. Do not rename.

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("emailVerified").notNull().default(false),
  image: text("image"),
  role: text("role").notNull().default("member"), // "admin" | "member"
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
})

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expiresAt").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
  ipAddress: text("ipAddress"),
  userAgent: text("userAgent"),
  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
})

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("accountId").notNull(),
  providerId: text("providerId").notNull(),
  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("accessToken"),
  refreshToken: text("refreshToken"),
  idToken: text("idToken"),
  accessTokenExpiresAt: timestamp("accessTokenExpiresAt"),
  refreshTokenExpiresAt: timestamp("refreshTokenExpiresAt"),
  scope: text("scope"),
  password: text("password"),
  passwordIsTemporary: boolean("passwordIsTemporary").notNull().default(false),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
})

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
})

/* --------------------------------- App tables --------------------------------- */
// No foreign keys on app tables (per Neon skill) — scope every query by userId.
// `assetType` future-proofs the model for silver / platinum / SGB / ETF without a redesign.

export const purchases = pgTable("purchases", {
  id: serial("id").primaryKey(),
  userId: text("userId").notNull(),
  assetType: text("assetType").notNull().default("gold"),
  purchaseDate: date("purchaseDate").notNull(),
  deliveredDate: date("deliveredDate"),
  website: text("website"),
  merchant: text("merchant"),
  brand: text("brand"),
  category: text("category").notNull().default("Coin"), // Coin | Bar
  purity: text("purity").notNull().default("999"),
  weightGrams: numeric("weightGrams", { precision: 12, scale: 4 }).notNull().default("0"),
  quantity: integer("quantity").notNull().default(1),
  purchasePrice: numeric("purchasePrice", { precision: 14, scale: 2 }).notNull().default("0"),
  pricePerGram: numeric("pricePerGram", { precision: 14, scale: 4 }).notNull().default("0"),
  remarks: text("remarks"),
  // Payment information
  creditCard: text("creditCard"),
  paymentMethod: text("paymentMethod"),
  rewardStrategy: text("rewardStrategy"),
  rewardPercentage: numeric("rewardPercentage", { precision: 8, scale: 4 }).notNull().default("0"),
  rewardPointsExpected: numeric("rewardPointsExpected", { precision: 14, scale: 2 }).notNull().default("0"),
  rewardValue: numeric("rewardValue", { precision: 14, scale: 2 }).notNull().default("0"),
  pointsPerMultiple: numeric("pointsPerMultiple", { precision: 14, scale: 4 }).notNull().default("0"),
  pointsMultiple: numeric("pointsMultiple", { precision: 14, scale: 2 }).notNull().default("100"),
  pointsBaseValue: numeric("pointsBaseValue", { precision: 14, scale: 6 }).notNull().default("0"),
  pointsTransferMultiplier: numeric("pointsTransferMultiplier", { precision: 14, scale: 4 }).notNull().default("1"),
  pointsTransferPartner: text("pointsTransferPartner"),
  pointsReceived: numeric("pointsReceived", { precision: 14, scale: 2 }).notNull().default("0"),
  pointsCreditedDate: date("pointsCreditedDate"),
  pointsStatus: text("pointsStatus").notNull().default("Pending"),
  pointsVerified: boolean("pointsVerified").notNull().default(false),
  giftVoucherSavings: numeric("giftVoucherSavings", { precision: 14, scale: 2 }).notNull().default("0"),
  vouchersJson: text("vouchersJson"),
  superCoinsValue: numeric("superCoinsValue", { precision: 14, scale: 2 }).notNull().default("0"),
  couponSavings: numeric("couponSavings", { precision: 14, scale: 2 }).notNull().default("0"),
  // Purchase Price Breakdown (optional, for tax P&L reference)
  listedPrice: numeric("listedPrice", { precision: 14, scale: 2 }),
  platformDiscount: numeric("platformDiscount", { precision: 14, scale: 2 }),
  bankInstantDiscount: numeric("bankInstantDiscount", { precision: 14, scale: 2 }),
  // Platform Charges (optional, excluded from gold value)
  platformCharges: numeric("platformCharges", { precision: 14, scale: 2 }),
  cashbackExpected: numeric("cashbackExpected", { precision: 14, scale: 2 }).notNull().default("0"),
  cashbackReceived: numeric("cashbackReceived", { precision: 14, scale: 2 }).notNull().default("0"),
  effectiveCost: numeric("effectiveCost", { precision: 14, scale: 2 }).notNull().default("0"),
  effectivePricePerGram: numeric("effectivePricePerGram", { precision: 14, scale: 4 }).notNull().default("0"),
  cashbackCreditedDate: date("cashbackCreditedDate"),
  cashbackStatus: text("cashbackStatus").notNull().default("Pending"), // Pending | Credited | Missing
  verified: boolean("verified").notNull().default(false),
  notes: text("notes"),
  tags: text("tags").array().notNull().default([]),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
})

export const rewardComponents = pgTable("reward_components", {
  id: serial("id").primaryKey(),
  userId: text("userId").notNull(),
  purchaseId: integer("purchaseId").notNull(),
  type: text("type").notNull(), // GiftVoucher | Cashback | RewardPoints | SuperCoins | Coupon
  label: text("label"),
  amount: numeric("amount", { precision: 14, scale: 2 }).notNull().default("0"),
  quantity: numeric("quantity", { precision: 14, scale: 2 }).notNull().default("0"),
  percentage: numeric("percentage", { precision: 8, scale: 4 }).notNull().default("0"),
  expected: numeric("expected", { precision: 14, scale: 2 }).notNull().default("0"),
  received: numeric("received", { precision: 14, scale: 2 }).notNull().default("0"),
  description: text("description"),
  // Voucher-specific
  faceValue: numeric("faceValue", { precision: 14, scale: 2 }).notNull().default("0"),
  amountPaid: numeric("amountPaid", { precision: 14, scale: 2 }).notNull().default("0"),
  cardUsed: text("cardUsed"),
  rewardType: text("rewardType").notNull().default("None"),
  // RewardPoints-specific (when rewardType = "RewardPoints")
  pointsEarned: numeric("pointsEarned", { precision: 14, scale: 2 }).notNull().default("0"),
  pointsPerMultiple: numeric("pointsPerMultiple", { precision: 14, scale: 2 }).notNull().default("0"),
  pointsMultiple: numeric("pointsMultiple", { precision: 14, scale: 2 }).notNull().default("100"),
  basePointValue: numeric("basePointValue", { precision: 14, scale: 4 }).notNull().default("0"),
  transferMultiplier: numeric("transferMultiplier", { precision: 8, scale: 4 }).notNull().default("1"),
  transferPartner: text("transferPartner"),
  pointsStatus: text("pointsStatus").notNull().default("Pending"),
  pointsVerified: boolean("pointsVerified").notNull().default(false),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
})

export const goldPrices = pgTable("gold_prices", {
  id: serial("id").primaryKey(),
  userId: text("userId").notNull(),
  assetType: text("assetType").notNull().default("gold"),
  priceDate: date("priceDate").notNull(),
  purity: text("purity").notNull().default("999"),
  pricePerGram: numeric("pricePerGram", { precision: 14, scale: 4 }).notNull().default("0"),
  source: text("source"),
  remarks: text("remarks"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
})

export const userSettings = pgTable("user_settings", {
  userId: text("userId").primaryKey(),
  currency: text("currency").notNull().default("INR"),
  graphMode: text("graphMode").notNull().default("effective"), // purchase | effective
  defaultDateRange: text("defaultDateRange").notNull().default("1y"),
  theme: text("theme").notNull().default("system"),
  displayName: text("displayName"),
  recoveryPin: text("recoveryPin"), // Hashed PIN for password recovery
  recoveryCodesUsed: jsonb("recoveryCodesUsed").$type<string[]>().default([]), // Used recovery codes
  resetToken: text("resetToken"), // Short-lived token for PIN-based password reset
  resetTokenExpiry: timestamp("resetTokenExpiry"), // Expiry for reset token
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
})

export const invites = pgTable("invites", {
  id: serial("id").primaryKey(),
  token: text("token").notNull().unique(),
  email: text("email"), // optional — pre-fill the signup form if provided
  createdBy: text("createdBy").notNull(),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  expiresAt: timestamp("expiresAt").notNull(),
  usedAt: timestamp("usedAt"),
  usedBy: text("usedBy"),
})

// Global shared brand library — no userId, visible to all users
export const brands = pgTable("brands", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
})

// Global shared card library — no userId, visible to all users
export const creditCards = pgTable("credit_cards", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
})

export const feedback = pgTable("feedback", {
  id: serial("id").primaryKey(),
  userId: text("userId").notNull(),
  category: text("category").notNull().default("general"),
  message: text("message").notNull(),
  rating: integer("rating"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  readAt: timestamp("readAt"),
})

export const signupRateLimit = pgTable("signup_rate_limit", {
  id: serial("id").primaryKey(),
  ip: text("ip").notNull(),
  attempts: integer("attempts").notNull().default(1),
  windowStart: timestamp("windowStart").notNull().defaultNow(),
})

// Community-wide weekly strategy insight — admin-authored, manually rotated
export const communityInsights = pgTable("community_insights", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  body: text("body").notNull(),
  weekLabel: text("weekLabel").notNull(), // e.g. "Week of 28 Jul 2026"
  isActive: boolean("isActive").notNull().default(true),
  createdBy: text("createdBy").notNull(),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
})

// Per-user reaction to a community insight — one row per user per insight per reaction type
// reaction: "like" | "dislike" | "hidden"
// Unique index on (insightId, userId, reaction) allows separate like and hidden rows per user
export const insightReactions = pgTable("insight_reactions", {
  id: serial("id").primaryKey(),
  insightId: integer("insightId").notNull(),
  userId: text("userId").notNull(),
  reaction: text("reaction").notNull(), // "like" | "dislike" | "hidden"
  createdAt: timestamp("createdAt").notNull().defaultNow(),
})

export const securityLogs = pgTable("security_logs", {
  id: serial("id").primaryKey(),
  eventType: text("eventType").notNull(), // recovery_attempt | recovery_success | recovery_failed | rate_limit_exceeded
  email: text("email").notNull(),
  ipAddress: text("ipAddress").notNull(),
  details: jsonb("details").$type<Record<string, string | number>>().default({}),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
})

export type CommunityInsight = typeof communityInsights.$inferSelect
export type InsightReaction = typeof insightReactions.$inferSelect
export type SecurityLog = typeof securityLogs.$inferSelect
export type Purchase = typeof purchases.$inferSelect
export type NewPurchase = typeof purchases.$inferInsert
export type RewardComponent = typeof rewardComponents.$inferSelect
export type GoldPrice = typeof goldPrices.$inferSelect
export type UserSettings = typeof userSettings.$inferSelect
export type Invite = typeof invites.$inferSelect
export type Feedback = typeof feedback.$inferSelect
export type CreditCard = typeof creditCards.$inferSelect
export type Brand = typeof brands.$inferSelect
