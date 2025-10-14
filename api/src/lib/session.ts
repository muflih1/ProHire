import type { NumberLike } from "hashids/util";
import { db } from "../db/index.js";
import { sessionsTable, usersTable } from "../db/schema.js";
import { getEnv } from "../env.js";
import catchAsync from "../utils/catch-async.js";
import crypto from "node:crypto"
import assign from "object-assign"
import { eq, type InferSelectModel } from "drizzle-orm";
import { hashids } from "./hashids.js";
import type { Response } from "express";
import * as cookie from "cookie"

const SESSION_ROTATION_THRESHOLD_IN_SECONDS = 60 * 60 * 24 * 15

function generateSecureRandomString(): string {
  const alphabet = "abcdefghijkmnpqrstuvwxyz23456789";

  const bytes = new Uint8Array(44);
  crypto.getRandomValues(bytes);

  let id = "";
  for (let i = 0; i < bytes.length; i++) {
    id += alphabet[bytes[i]! >> 3];
  }
  return id;
}

export async function createSession(userID: bigint, userAgent?: string, ipAddress?: string, pool = db) {
  const secret = generateSecureRandomString()
  const secretHash = hashSecret(secret)

  const [session] = await pool
    .insert(sessionsTable)
    .values({
      userID,
      secret: secretHash,
      userAgent,
      ipAddress
    })
    .returning();

  if (!session) {
    throw new Error('Failed to create session');
  }

  const token = hashids.encode(session.id) + '.' + secret

  return assign(session, { token })
}

function hashSecret(secret: string) {
  return crypto.createHmac('sha256', getEnv("SESSION_SECRET")).update(secret).digest()
}

async function validateSession(token: string) {
  const tokenParts = token.split('.')
  if (tokenParts.length !== 2) {
    return null
  }
  const [encodedSessionId, sessionSecret] = tokenParts as [string, string]
  let [sessionId] = hashids.decode(encodedSessionId)
  if (!sessionId) {
    return null
  }
  const session = await getSession(sessionId)
  if (!session) {
    return null
  }
  const tokenSecretHash = hashSecret(sessionSecret)
  const validSecret = constantTimeEqual(tokenSecretHash, session.secret)
  if (!validSecret) {
    return null
  }
  return session
}

export async function getSession(sessionId: NumberLike) {
  const now = new Date()
  let [session] = await db
    .select({
      id: sessionsTable.id,
      userID: usersTable.id,
      secret: sessionsTable.secret,
      userAgent: sessionsTable.userAgent,
      ipAddress: sessionsTable.ipAddress,
      expiresAt: sessionsTable.expiresAt,
      createdAt: sessionsTable.createdAt,
      updatedAt: sessionsTable.updatedAt
    })
    .from(sessionsTable)
    .innerJoin(usersTable, eq(usersTable.id, sessionsTable.userID))
    .where(eq(sessionsTable.id, sessionId as bigint));
  if (!session) {
    return null
  }
  if (now.getTime() > session.expiresAt.getTime()) {
    await deleteSession(session.id)
    return null
  }
  if (session.expiresAt.getTime() - now.getTime() <= SESSION_ROTATION_THRESHOLD_IN_SECONDS * 1000) {
    [session] = await db.update(sessionsTable).set({ expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30) }).returning()
    if (!session) {
      return null
    }
  }
  return session
}

export async function deleteSession(sessionId: NumberLike) {
  await db.delete(sessionsTable).where(eq(sessionsTable.id, sessionId as bigint))
}

function constantTimeEqual(a: Buffer<ArrayBufferLike>, b: Buffer<ArrayBufferLike>) {
  return crypto.timingSafeEqual(a, b)
}


export const deserializeSession = catchAsync(async (req, res, next) => {
  const token = req.cookies.session_secret
  if (token) {
    const session = await validateSession(token)
    if (session) {
      req.session = session
    }
  }
  next()
})

export function setSessionCookie(res: Response, value: string) {
  const data = cookie.serialize("session_secret", value, {
    path: '/',
    httpOnly: true,
    expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365),
    secure: false,
  })
  const prev = res.getHeader('set-cookie') || []
  const header = Array.isArray(prev) ? prev.concat(data) : [prev, data]
  res.setHeader('set-cookie', header as readonly string[])
}

declare global {
  namespace Express {
    interface Request {
      session: InferSelectModel<typeof sessionsTable>
    }
  }
}