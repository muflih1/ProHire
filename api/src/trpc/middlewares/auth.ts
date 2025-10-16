import { TRPCError } from "@trpc/server";
import { t } from "../init.js";

export const auth = t.middleware(({ ctx, next }) => {
  if (!ctx?.session || !ctx?.session?.userID) {
    throw new TRPCError({ code: 'UNAUTHORIZED' })
  }

  return next({ ctx })
})