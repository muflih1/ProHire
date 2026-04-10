import {and, eq, sql} from 'drizzle-orm';
import {db} from '../db/index.js';
import {sessionsTable, usersTable} from '../db/schema.js';
import crypto from 'node:crypto';
import {sqids} from './sqids.js';
import {setCookie} from '../utils/request-response.js';
import catchAsync from '../utils/catch-async.js';
import type {SerializeOptions} from 'cookie';

const inactivityTimeoutSeconds = 60 * 60 * 24 * 10;
const activityCheckIntervalSeconds = 60 * 60 * 24 * 1;

function generateSecureRandomString(): string {
  return 'Ay' + crypto.randomBytes(24).toString('base64url').slice(0, 42);
}

async function getSessionId(userID: bigint) {
  let a = false;
  let id = crypto.randomInt(1, 50);

  do {
    let [check] = await db
      .select({1: sql<number>`1`})
      .from(sessionsTable)
      .where(
        and(
          eq(sessionsTable.id, id),
          eq(sessionsTable.userID, userID),
          eq(sessionsTable.created, Math.floor(Date.now() / 1000)),
        ),
      );
    if (check != null) {
      a = true;
      id += 1;
    } else {
      a = false;
    }
  } while (a);

  return id;
}

async function createSession(
  userID: bigint,
  userAgent?: string | null,
  ipAddress?: string | null,
) {
  const now = new Date();

  const id = await getSessionId(userID);
  const rotatingToken = generateSecureRandomString();
  const rotatingTokenDigest = hashSecret(rotatingToken);
  const created = Math.floor(now.getTime() / 1000);

  const token = `${id}:${sqids.encode([created])}:${rotatingToken}`;

  const session = {
    id,
    userID,
    rotatingTokenDigest,
    userAgent,
    ipAddress,
    created,
    token,
  };

  await db.insert(sessionsTable).values(session);

  return session;
}

function hashSecret(secret: string): Buffer<ArrayBuffer> {
  return crypto.createHash('sha256').update(secret).digest();
}

function constantTimeEqual(
  a: Buffer<ArrayBuffer>,
  b: Buffer<ArrayBuffer>,
): boolean {
  if (a.length !== b.length) {
    return false;
  }
  return crypto.timingSafeEqual(a, b);
}

async function getSession(sessionID: number, userID: bigint, created: number) {
  const now = new Date();

  const [session] = await db
    .select({
      id: sessionsTable.id,
      userID: usersTable.id,
      rotatingTokenDigest: sessionsTable.rotatingTokenDigest,
      lastRotatedAt: sessionsTable.lastRotatedAt,
      created: sessionsTable.created,
      lastActiveOrganizationID: sessionsTable.lastActiveOrganizationID,
    })
    .from(sessionsTable)
    .innerJoin(usersTable, eq(usersTable.id, sessionsTable.userID))
    .where(
      and(
        eq(sessionsTable.id, sessionID),
        eq(sessionsTable.userID, userID),
        eq(sessionsTable.created, created),
      ),
    );
  if (!session) {
    return null;
  }

  if (
    now.getTime() - session.lastRotatedAt.getTime() >=
    inactivityTimeoutSeconds * 1000
  ) {
    await db
      .delete(sessionsTable)
      .where(
        and(
          eq(sessionsTable.id, sessionID),
          eq(sessionsTable.userID, userID),
          eq(sessionsTable.created, created),
        ),
      );
    return null;
  }

  return session;
}

async function validateSessionToken(token: string, userID: bigint) {
  const now = new Date();

  const tokenParts = token.split(':') as [string, string, string];
  if (tokenParts.length !== 3) {
    return null;
  }
  const sessionId = parseInt(tokenParts[0]);
  const [sessionCreatedAt] = sqids.decode(tokenParts[1]);
  const sessionSecret = tokenParts[2];

  if (sessionCreatedAt == null) {
    return null;
  }

  const session = await getSession(sessionId, userID, sessionCreatedAt);
  if (!session) {
    return null;
  }

  const tokenSecretDigest = await hashSecret(sessionSecret);
  const validSecret = constantTimeEqual(
    tokenSecretDigest,
    session.rotatingTokenDigest,
  );
  if (!validSecret) {
    return null;
  }

  if (
    now.getTime() - session.lastRotatedAt.getTime() >=
    activityCheckIntervalSeconds * 1000
  ) {
    const newRotatingToken = generateSecureRandomString();
    const newRotatingTokenDigest = hashSecret(newRotatingToken);

    await db
      .update(sessionsTable)
      .set({rotatingTokenDigest: newRotatingTokenDigest, lastRotatedAt: now})
      .where(
        and(
          eq(sessionsTable.id, sessionId),
          eq(sessionsTable.userID, userID),
          eq(sessionsTable.created, sessionCreatedAt),
        ),
      );

    session.rotatingTokenDigest = newRotatingTokenDigest;
    session.lastRotatedAt = now;

    const newToken = `${session.id}:${sqids.encode([session.created])}:${newRotatingToken}`;
    setCookie('sid', newToken, getSetSessionCookieOptions());
    setCookie('uid', userID.toString(), getSetSessionCookieOptions());
  }

  return session;
}

function getSetSessionCookieOptions(): SerializeOptions {
  return {
    path: '/',
    httpOnly: true,
    expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365),
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  };
}

const deserializeSession = catchAsync(async (req, res, next) => {
  const sessionToken = req.cookies.sid;
  const userID = req.cookies.uid;

  if (sessionToken == null || userID == null) {
    return next();
  }

  const session = await validateSessionToken(sessionToken, userID);
  if (!session) return next();

  req.session = {
    id: session.id,
    userID: session.userID,
    created: session.created,
    lastActiveOrganizationID: session.lastActiveOrganizationID,
  };

  return next();
});

export {deserializeSession, createSession, getSetSessionCookieOptions};

declare global {
  namespace Express {
    interface Request {
      session: {
        id: number;
        userID: bigint;
        created: number;
        lastActiveOrganizationID: bigint | null;
      };
    }
  }
}
