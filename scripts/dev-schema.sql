-- Idempotent dev schema for GramFolio.
--
-- This mirrors lib/db/schema.ts (the canonical Drizzle schema) plus the extra
-- columns/tables the app reaches through raw SQL: the Better Auth admin plugin
-- columns on "user"/"session" and the "demo_logins" table used by the demo flow.
--
-- Safe to run repeatedly. Used to bootstrap a local Postgres for Cloud Agent /
-- local development where there is no Drizzle Kit migration pipeline.

/* ----------------------------- Better Auth tables ----------------------------- */

CREATE TABLE IF NOT EXISTS "user" (
  "id"            text PRIMARY KEY,
  "name"          text NOT NULL,
  "email"         text NOT NULL UNIQUE,
  "emailVerified" boolean NOT NULL DEFAULT false,
  "image"         text,
  "role"          text NOT NULL DEFAULT 'member',
  "createdAt"     timestamp NOT NULL DEFAULT now(),
  "updatedAt"     timestamp NOT NULL DEFAULT now()
);
-- Better Auth admin plugin columns (queried via raw SQL in app/(app)/admin/*).
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "banned"     boolean NOT NULL DEFAULT false;
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "banReason"  text;
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "banExpires" timestamp;

CREATE TABLE IF NOT EXISTS "session" (
  "id"        text PRIMARY KEY,
  "expiresAt" timestamp NOT NULL,
  "token"     text NOT NULL UNIQUE,
  "createdAt" timestamp NOT NULL DEFAULT now(),
  "updatedAt" timestamp NOT NULL DEFAULT now(),
  "ipAddress" text,
  "userAgent" text,
  "userId"    text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE
);
ALTER TABLE "session" ADD COLUMN IF NOT EXISTS "impersonatedBy" text;

CREATE TABLE IF NOT EXISTS "account" (
  "id"                    text PRIMARY KEY,
  "accountId"             text NOT NULL,
  "providerId"            text NOT NULL,
  "userId"                text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "accessToken"           text,
  "refreshToken"          text,
  "idToken"               text,
  "accessTokenExpiresAt"  timestamp,
  "refreshTokenExpiresAt" timestamp,
  "scope"                 text,
  "password"              text,
  "passwordIsTemporary"   boolean NOT NULL DEFAULT false,
  "createdAt"             timestamp NOT NULL DEFAULT now(),
  "updatedAt"             timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "verification" (
  "id"         text PRIMARY KEY,
  "identifier" text NOT NULL,
  "value"      text NOT NULL,
  "expiresAt"  timestamp NOT NULL,
  "createdAt"  timestamp NOT NULL DEFAULT now(),
  "updatedAt"  timestamp NOT NULL DEFAULT now()
);

/* --------------------------------- App tables --------------------------------- */

CREATE TABLE IF NOT EXISTS "purchases" (
  "id"                       serial PRIMARY KEY,
  "userId"                   text NOT NULL,
  "assetType"                text NOT NULL DEFAULT 'gold',
  "purchaseDate"             date NOT NULL,
  "deliveredDate"            date,
  "website"                  text,
  "merchant"                 text,
  "brand"                    text,
  "category"                 text NOT NULL DEFAULT 'Coin',
  "purity"                   text NOT NULL DEFAULT '999',
  "weightGrams"              numeric(12,4) NOT NULL DEFAULT '0',
  "quantity"                 integer NOT NULL DEFAULT 1,
  "purchasePrice"            numeric(14,2) NOT NULL DEFAULT '0',
  "pricePerGram"             numeric(14,4) NOT NULL DEFAULT '0',
  "remarks"                  text,
  "creditCard"               text,
  "paymentMethod"            text,
  "rewardStrategy"           text,
  "rewardPercentage"         numeric(8,4) NOT NULL DEFAULT '0',
  "rewardPointsExpected"     numeric(14,2) NOT NULL DEFAULT '0',
  "rewardValue"              numeric(14,2) NOT NULL DEFAULT '0',
  "pointsPerMultiple"        numeric(14,4) NOT NULL DEFAULT '0',
  "pointsMultiple"           numeric(14,2) NOT NULL DEFAULT '100',
  "pointsBaseValue"          numeric(14,6) NOT NULL DEFAULT '0',
  "pointsTransferMultiplier" numeric(14,4) NOT NULL DEFAULT '1',
  "pointsTransferPartner"    text,
  "pointsReceived"           numeric(14,2) NOT NULL DEFAULT '0',
  "pointsCreditedDate"       date,
  "pointsStatus"             text NOT NULL DEFAULT 'Pending',
  "pointsVerified"           boolean NOT NULL DEFAULT false,
  "giftVoucherSavings"       numeric(14,2) NOT NULL DEFAULT '0',
  "vouchersJson"             text,
  "superCoinsValue"          numeric(14,2) NOT NULL DEFAULT '0',
  "couponSavings"            numeric(14,2) NOT NULL DEFAULT '0',
  "listedPrice"              numeric(14,2),
  "platformDiscount"         numeric(14,2),
  "bankInstantDiscount"      numeric(14,2),
  "platformCharges"          numeric(14,2),
  "cashbackExpected"         numeric(14,2) NOT NULL DEFAULT '0',
  "cashbackReceived"         numeric(14,2) NOT NULL DEFAULT '0',
  "effectiveCost"            numeric(14,2) NOT NULL DEFAULT '0',
  "effectivePricePerGram"    numeric(14,4) NOT NULL DEFAULT '0',
  "cashbackCreditedDate"     date,
  "cashbackStatus"           text NOT NULL DEFAULT 'Pending',
  "verified"                 boolean NOT NULL DEFAULT false,
  "notes"                    text,
  "tags"                     text[] NOT NULL DEFAULT '{}',
  "createdAt"                timestamp NOT NULL DEFAULT now(),
  "updatedAt"                timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "reward_components" (
  "id"                 serial PRIMARY KEY,
  "userId"             text NOT NULL,
  "purchaseId"         integer NOT NULL,
  "type"               text NOT NULL,
  "label"              text,
  "amount"             numeric(14,2) NOT NULL DEFAULT '0',
  "quantity"           numeric(14,2) NOT NULL DEFAULT '0',
  "percentage"         numeric(8,4) NOT NULL DEFAULT '0',
  "expected"           numeric(14,2) NOT NULL DEFAULT '0',
  "received"           numeric(14,2) NOT NULL DEFAULT '0',
  "description"        text,
  "faceValue"          numeric(14,2) NOT NULL DEFAULT '0',
  "amountPaid"         numeric(14,2) NOT NULL DEFAULT '0',
  "cardUsed"           text,
  "rewardType"         text NOT NULL DEFAULT 'None',
  "pointsEarned"       numeric(14,2) NOT NULL DEFAULT '0',
  "pointsPerMultiple"  numeric(14,2) NOT NULL DEFAULT '0',
  "pointsMultiple"     numeric(14,2) NOT NULL DEFAULT '100',
  "basePointValue"     numeric(14,4) NOT NULL DEFAULT '0',
  "transferMultiplier" numeric(8,4) NOT NULL DEFAULT '1',
  "transferPartner"    text,
  "pointsStatus"       text NOT NULL DEFAULT 'Pending',
  "pointsVerified"     boolean NOT NULL DEFAULT false,
  "createdAt"          timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "gold_prices" (
  "id"           serial PRIMARY KEY,
  "userId"       text NOT NULL,
  "assetType"    text NOT NULL DEFAULT 'gold',
  "priceDate"    date NOT NULL,
  "purity"       text NOT NULL DEFAULT '999',
  "pricePerGram" numeric(14,4) NOT NULL DEFAULT '0',
  "source"       text,
  "remarks"      text,
  "createdAt"    timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "user_settings" (
  "userId"           text PRIMARY KEY,
  "currency"         text NOT NULL DEFAULT 'INR',
  "graphMode"        text NOT NULL DEFAULT 'effective',
  "defaultDateRange" text NOT NULL DEFAULT '1y',
  "theme"            text NOT NULL DEFAULT 'system',
  "displayName"      text,
  "recoveryPin"      text,
  "recoveryCodesUsed" jsonb DEFAULT '[]'::jsonb,
  "resetToken"       text,
  "resetTokenExpiry" timestamp,
  "updatedAt"        timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "invites" (
  "id"        serial PRIMARY KEY,
  "token"     text NOT NULL UNIQUE,
  "email"     text,
  "createdBy" text NOT NULL,
  "createdAt" timestamp NOT NULL DEFAULT now(),
  "expiresAt" timestamp NOT NULL,
  "usedAt"    timestamp,
  "usedBy"    text
);

CREATE TABLE IF NOT EXISTS "brands" (
  "id"        serial PRIMARY KEY,
  "name"      text NOT NULL UNIQUE,
  "createdAt" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "credit_cards" (
  "id"        serial PRIMARY KEY,
  "name"      text NOT NULL UNIQUE,
  "createdAt" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "feedback" (
  "id"        serial PRIMARY KEY,
  "userId"    text NOT NULL,
  "category"  text NOT NULL DEFAULT 'general',
  "message"   text NOT NULL,
  "rating"    integer,
  "createdAt" timestamp NOT NULL DEFAULT now(),
  "readAt"    timestamp
);

CREATE TABLE IF NOT EXISTS "signup_rate_limit" (
  "id"          serial PRIMARY KEY,
  "ip"          text NOT NULL,
  "attempts"    integer NOT NULL DEFAULT 1,
  "windowStart" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "community_insights" (
  "id"        serial PRIMARY KEY,
  "title"     text NOT NULL,
  "body"      text NOT NULL,
  "weekLabel" text NOT NULL,
  "isActive"  boolean NOT NULL DEFAULT true,
  "createdBy" text NOT NULL,
  "createdAt" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "insight_reactions" (
  "id"        serial PRIMARY KEY,
  "insightId" integer NOT NULL,
  "userId"    text NOT NULL,
  "reaction"  text NOT NULL,
  "createdAt" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "security_logs" (
  "id"        serial PRIMARY KEY,
  "eventType" text NOT NULL,
  "email"     text NOT NULL,
  "ipAddress" text NOT NULL,
  "details"   jsonb DEFAULT '{}'::jsonb,
  "createdAt" timestamp NOT NULL DEFAULT now()
);

-- Demo sign-in log (used via raw SQL in app/actions/demo.ts).
CREATE TABLE IF NOT EXISTS "demo_logins" (
  "id"        serial PRIMARY KEY,
  "ip"        text,
  "userAgent" text,
  "createdAt" timestamp NOT NULL DEFAULT now()
);
