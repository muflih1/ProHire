import { and, eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { membersTable } from "../db/schema.js";
import catchAsync from "../utils/catch-async.js";

export const selectCurrentOrganizationHandler = catchAsync(async (req, res) => {
  const { orgID } = req.body
  const [membership] = await db.select({ organizationId: membersTable.organizationID }).from(membersTable).where(and(eq(membersTable.organizationID, orgID), eq(membersTable.userID, req.session.userID)))
  if (membership == null) {
    return res.status(403).json({ message: "You don't have permission to set this organization as your current organization." })
  }
  return res
    .cookie('c_org', membership.organizationId, {
      path: '/',
      httpOnly: false,
      expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365)
    })
    .sendStatus(204)
})