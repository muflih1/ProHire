import { TRPCError } from "@trpc/server";
import { auth } from "./auth.js";
import { getUserPermissions } from "../../lib/get-user-permissions.js";

export const hasPermission = (requiredPermission: string, message?: string) => auth.unstable_pipe(async ({ ctx, next, input }) => {
  console.log({input}, 'first')
  if (typeof input !== 'object' || input === null || !('organizationID' in input) || typeof (input as any).organizationID !== 'string') {
    throw new TRPCError({ code: 'BAD_REQUEST' })
  }
  const orgID = BigInt((input as any).organizationID)
  const permissions = await getUserPermissions(ctx.session.userID, orgID)
  if (!permissions.includes(requiredPermission)) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      ...(message != null ? { message } : undefined)
    })
  }
  return next({ ctx })
})