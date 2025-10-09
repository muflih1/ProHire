import z from "zod";
import { t } from "../init.js";
import { db } from "../../db/index.js";
import { usersTable } from "../../db/schema.js";
import { eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export const appRouter = t.router({
  viewer: t.procedure.query(async ({ ctx }) => {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, ctx.session.userId));
    if (!user) {
      throw new TRPCError({ code: 'UNAUTHORIZED' })
    }
    return user
  })
})