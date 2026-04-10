import {and, eq} from 'drizzle-orm';
import {db} from '../db/index.js';
import {sessionsTable, usersTable} from '../db/schema.js';
import {createSession, getSetSessionCookieOptions} from '../lib/session.js';
import catchAsync from '../utils/catch-async.js';
import bcrypt from 'bcryptjs';

export const createAccountHandler = catchAsync(async (req, res) => {
  const {first_name, last_name, email_address, password} = req.body;

  const salt = await bcrypt.genSalt(12);
  const passwordDigest = await bcrypt.hash(password, salt);

  const [user] = await db
    .insert(usersTable)
    .values({
      firstName: first_name,
      lastName: last_name,
      emailAddress: normalizeEmailAddress(email_address),
      passwordDigest,
    })
    .returning();

  if (!user) {
    throw new Error('Inserting using failed this should not reachable.');
  }

  const session = await createSession(user.id, req.get('user-agent'), req.ip);

  return res
    .cookie('uid', user.id, getSetSessionCookieOptions())
    .cookie('sid', session.token, getSetSessionCookieOptions())
    .status(201)
    .json({
      userId: user.id.toString(),
      authenticated: true,
    });
});

export const loginHandler = catchAsync(async (req, res) => {
  const {email_address, password} = req.body;
  const user = await db.query.usersTable.findFirst({
    where: (fields, {eq}) =>
      eq(fields.emailAddress, normalizeEmailAddress(email_address)),
  });
  const passwordDigest = user?.passwordDigest ?? '...';
  const macth = await bcrypt.compare(password, passwordDigest);
  if (!user || !macth) {
    return res.status(401).json({error_message: 'Invalid credentials'});
  }
  const session = await createSession(user.id, req.get('user-agent'), req.ip);

  return res
    .cookie('uid', user.id, getSetSessionCookieOptions())
    .cookie('sid', session.token, getSetSessionCookieOptions())
    .json({userId: user.id.toString()});
});

export const sessionHandler = catchAsync(async (req, res) => {
  const session = req.session;
  const alt = req.query.alt;

  if (!session) {
    return res.json(null);
  }

  const user = await db.query.usersTable.findFirst({
    where: (fields, {eq}) => eq(fields.id, req.session.userID),
    columns: {
      passwordDigest: false,
    },
  });

  if (!user) {
    return res.json(null);
  }

  return res.status(200).json({
    user: {
      id: user.id.toString(),
      firstName: user.firstName,
      lastName: user.lastName,
      emailAddress: user.emailAddress,
      profileImage:
        user.profileImageStorageKey !== null
          ? /** do a presined url */ {uri: ''}
          : null,
      createdAt: user.createdAt,
    },
    activeOrganizationID: session.lastActiveOrganizationID?.toString() ?? null,
  });
});

export const logoutHandler = catchAsync(async (req, res) => {
  const session = req.session;

  if (!session) {
    return res.status(401).json({error_message: 'Unauthorize'});
  }

  const {id, userID, created} = session;

  await db
    .delete(sessionsTable)
    .where(
      and(
        eq(sessionsTable.id, id),
        eq(sessionsTable.userID, userID),
        eq(sessionsTable.created, created),
      ),
    );

  return res
    .clearCookie('uid', getSetSessionCookieOptions())
    .clearCookie('sid', getSetSessionCookieOptions())
    .sendStatus(204);
});

function normalizeEmailAddress(emailAddress: string) {
  return emailAddress.trim().toLowerCase();
}
