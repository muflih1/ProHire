import { StatusCodes } from "http-status-codes";
import { db } from "../db/index.js";
import { accountsTable, usersTable } from "../db/schema.js";
import catchAsync from "../utils/catch-async.js";
import bcrypt from "bcryptjs";
import { createSession, deleteSession, setSessionCookie } from "../lib/session.js";
import { eq } from "drizzle-orm";

export const createAccountHandler = catchAsync(async (req, res) => {
  const { displayName, email, password } = req.body
  const salt = await bcrypt.genSalt(12)
  const digest = await bcrypt.hash(password, salt)
  const result = await db.transaction(async tx => {
    const [user] = await tx.insert(usersTable).values({ displayName, email }).returning()
    if (!user) {
      throw new Error("Failed to create user")
    }
    const [account] = await tx.insert(accountsTable).values({ accountID: user.id.toString(), userID: user.id, provider: "local", password: digest }).returning()
    if (!account) {
      throw new Error("Failed to create account")
    }
    const session = await createSession(user.id, req.get("user-agent"), req.ip, tx as any)
    return { user, account, session }
  })
  setSessionCookie(res, result.session.token)
  res.status(StatusCodes.CREATED).json({ success: true })
})

export const loginHandler = catchAsync(async (req, res) => {
  const { email, password } = req.body;
  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email));
  if (!user) {
    throw new Error('Account not found')
  }
  const [account] = await db.select().from(accountsTable).where(eq(accountsTable.userID, user.id))
  const match = await bcrypt.compare(password, account!.password!)
  if (!account || !match) {
    return res.status(StatusCodes.UNAUTHORIZED).json({ error: { message: 'Incorrect password' } })
  }
  const session = await createSession(user.id, req.get('user-agent'), req.ip)
  setSessionCookie(res, session.token)
  res.status(StatusCodes.OK).json({ isLoggedIn: true })
});

export const logoutHandler = catchAsync(async (req, res) => {
  const session = req.session;
  await deleteSession(session.id)
  res.clearCookie('session_secret').sendStatus(204)
})