'use server'

import { hashPassword, verifyPassword } from 'better-auth/crypto'
import { db, pool } from '@/lib/db'
import { account, userSettings, securityLogs } from '@/lib/db/schema'
import { user as userTable } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { randomBytes } from 'crypto'
import { headers } from 'next/headers'
import { z } from 'zod'

const verifyPinSchema = z.object({
  email: z.string().email().max(254).min(5),
  pin: z.string().min(4).max(16).regex(/^\d+$/, 'PIN must be numeric'),
})

// Security logging function — persists to DB and stderr
async function logSecurityEvent(
  eventType: 'recovery_attempt' | 'recovery_success' | 'recovery_failed' | 'rate_limit_exceeded',
  email: string,
  ipAddress: string,
  details: Record<string, string | number> = {},
): Promise<void> {
  const safeEmail = email.toLowerCase().trim()

  // Always log to stderr (Vercel captures this)
  console.error('[SECURITY_LOG]', JSON.stringify({ eventType, email: safeEmail, ipAddress, details, timestamp: new Date().toISOString() }))

  // Persist to DB so admins can query past events
  try {
    await db.insert(securityLogs).values({ eventType, email: safeEmail, ipAddress, details })
  } catch (err) {
    // Never let a logging failure crash the auth flow
    console.error('[SECURITY_LOG_DB_ERROR]', err)
  }
}

const resetPasswordSchema = z.object({
  token: z.string().length(64).regex(/^[a-f0-9]+$/),
  newPassword: z.string().min(8).max(128),
})

// 5 attempts per 15 minutes per IP
const PIN_MAX_ATTEMPTS = 5
const PIN_WINDOW_MS = 15 * 60 * 1000

async function checkPinRateLimit(email: string): Promise<void> {
  const hdrs = await headers()
  const ip =
    hdrs.get('x-forwarded-for')?.split(',')[0].trim() ||
    hdrs.get('x-real-ip') ||
    'unknown'

  // Skip in local/sandbox
  if (ip === 'unknown' || ip === '::1' || ip === '127.0.0.1') return

  const client = await pool.connect()
  try {
    const windowStart = new Date(Date.now() - PIN_WINDOW_MS).toISOString()
    const key = `pin:${ip}`

    const { rows } = await client.query<{ id: number; attempts: number }>(
      `SELECT id, attempts FROM signup_rate_limit
       WHERE ip = $1 AND window_start > $2
       ORDER BY window_start DESC LIMIT 1`,
      [key, windowStart],
    )

    if (rows.length === 0) {
      try {
        await client.query(
          `INSERT INTO signup_rate_limit (ip, attempts, window_start) VALUES ($1, 1, NOW())`,
          [key],
        )
      } catch (err) {
        // Unique constraint or other DB error — log but don't crash
        console.error('[RATE_LIMIT_INSERT_ERROR]', ip, err)
        await logSecurityEvent('recovery_attempt', email, ip, { error: 'db_insert_failed' })
      }
      return
    }

    if (rows[0].attempts >= PIN_MAX_ATTEMPTS) {
      await logSecurityEvent('rate_limit_exceeded', email, ip, { attempts: rows[0].attempts })
      throw new Error('Too many attempts. Please wait 15 minutes before trying again.')
    }

    try {
      await client.query(
        `UPDATE signup_rate_limit SET attempts = attempts + 1 WHERE id = $1`,
        [rows[0].id],
      )
    } catch (err) {
      console.error('[RATE_LIMIT_UPDATE_ERROR]', ip, err)
      await logSecurityEvent('recovery_attempt', email, ip, { error: 'db_update_failed' })
    }
  } finally {
    client.release()
  }
}

export async function verifyRecoveryPin(email: string, pin: string) {
  const hdrs = await headers()
  const ip =
    hdrs.get('x-forwarded-for')?.split(',')[0].trim() ||
    hdrs.get('x-real-ip') ||
    'unknown'

  try {
    // Validate inputs first — reject malformed data immediately
    const { email: safeEmail, pin: safePin } = verifyPinSchema.parse({ email, pin })

    // Enforce rate limit before doing any DB work
    await checkPinRateLimit(safeEmail)

    // Find user by email
    const [user] = await db
      .select({ id: userTable.id })
      .from(userTable)
      .where(eq(userTable.email, safeEmail.toLowerCase().trim()))
      .limit(1)

    if (!user) {
      await logSecurityEvent('recovery_failed', safeEmail, ip, { reason: 'user_not_found' })
      throw new Error('No account found with that email.')
    }

    // Get recovery PIN from user_settings
    const [settings] = await db
      .select({ recoveryPin: userSettings.recoveryPin })
      .from(userSettings)
      .where(eq(userSettings.userId, user.id))
      .limit(1)

    if (!settings?.recoveryPin) {
      await logSecurityEvent('recovery_failed', safeEmail, ip, { reason: 'no_pin_set' })
      throw new Error('NO_PIN_SET')
    }

    // Verify PIN
    const isValid = await verifyPassword({ hash: settings.recoveryPin, password: safePin })
    if (!isValid) {
      await logSecurityEvent('recovery_failed', safeEmail, ip, { reason: 'invalid_pin' })
      throw new Error('Incorrect PIN. Please try again.')
    }

    // Generate short-lived reset token (expires in 15 minutes)
    const resetToken = randomBytes(32).toString('hex')
    const resetTokenExpiry = new Date(Date.now() + 15 * 60 * 1000)

    await db
      .update(userSettings)
      .set({ resetToken, resetTokenExpiry })
      .where(eq(userSettings.userId, user.id))

    await logSecurityEvent('recovery_success', safeEmail, ip, { userId: user.id })
    return { resetToken }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error'
    // Don't re-log — already logged above or in rate limit function
    if (!errorMsg.includes('Too many attempts') && !errorMsg.includes('No account found')) {
      await logSecurityEvent('recovery_failed', email, ip, { reason: 'exception', error: errorMsg })
    }
    throw error
  }
}

export async function resetPasswordWithToken(token: string, newPassword: string) {
  const { token: safeToken, newPassword: safePassword } = resetPasswordSchema.parse({ token, newPassword })

  // Find user_settings with matching token that hasn't expired
  const [settings] = await db
    .select({ userId: userSettings.userId, resetTokenExpiry: userSettings.resetTokenExpiry })
    .from(userSettings)
    .where(eq(userSettings.resetToken, safeToken))
    .limit(1)

  if (!settings) throw new Error('Invalid or expired reset link.')
  if (!settings.resetTokenExpiry || settings.resetTokenExpiry < new Date()) {
    throw new Error('Reset link has expired. Please start over.')
  }

  // Hash new password
  const hashedPassword = await hashPassword(safePassword)

  // Update password and clear reset token
  await db
    .update(account)
    .set({ password: hashedPassword, passwordIsTemporary: false, updatedAt: new Date() })
    .where(eq(account.userId, settings.userId))

  await db
    .update(userSettings)
    .set({ resetToken: null, resetTokenExpiry: null })
    .where(eq(userSettings.userId, settings.userId))

  return { success: true }
}
