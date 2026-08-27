import "server-only"

import { createCipheriv, createDecipheriv, randomBytes } from "crypto"

const ENCRYPTION_VERSION = 1
const IV_LENGTH = 12
const TAG_LENGTH = 16
const KEY_LENGTH = 32

function getEncryptionKey(): Buffer {
  const raw = process.env.MESSAGE_ENCRYPTION_KEY?.trim()
  if (!raw) {
    throw new Error("MESSAGE_ENCRYPTION_KEY is not configured")
  }
  const key = Buffer.from(raw, "base64")
  if (key.length !== KEY_LENGTH) {
    throw new Error("MESSAGE_ENCRYPTION_KEY must be 32 bytes, base64-encoded")
  }
  return key
}

export function encryptMessage(plaintext: string): { ciphertext: string; version: number } {
  const key = getEncryptionKey()
  const iv = randomBytes(IV_LENGTH)
  const cipher = createCipheriv("aes-256-gcm", key, iv)
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()])
  const tag = cipher.getAuthTag()
  const payload = Buffer.concat([iv, tag, encrypted])
  return {
    ciphertext: payload.toString("base64"),
    version: ENCRYPTION_VERSION,
  }
}

export function decryptMessage(ciphertext: string, version: number): string {
  if (version !== ENCRYPTION_VERSION) {
    throw new Error(`Unsupported message encryption version: ${version}`)
  }
  const key = getEncryptionKey()
  const payload = Buffer.from(ciphertext, "base64")
  if (payload.length < IV_LENGTH + TAG_LENGTH + 1) {
    throw new Error("Invalid encrypted message payload")
  }
  const iv = payload.subarray(0, IV_LENGTH)
  const tag = payload.subarray(IV_LENGTH, IV_LENGTH + TAG_LENGTH)
  const encrypted = payload.subarray(IV_LENGTH + TAG_LENGTH)
  const decipher = createDecipheriv("aes-256-gcm", key, iv)
  decipher.setAuthTag(tag)
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8")
}
