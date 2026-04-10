import {z} from 'zod';
import {createTRPCRouter, protectedProcedure} from '../init.js';
import {TRPCError} from '@trpc/server';
import {sessionsTable} from '../../db/schema.js';
import {and, eq} from 'drizzle-orm';

export const sessionsRouter = createTRPCRouter({
  touch: protectedProcedure
    .input(z.object({activeOrganizationID: z.bigint().nullable().optional()}))
    .mutation(async ({ctx, input}) => {
      if (!ctx.session) {
        throw new TRPCError({code: 'UNAUTHORIZED'});
      }
      await ctx.db
        .update(sessionsTable)
        .set({
          lastActiveAt: new Date(),
          lastActiveOrganizationID: input.activeOrganizationID,
        })
        .where(
          and(
            eq(sessionsTable.id, ctx.session.id),
            eq(sessionsTable.userID, ctx.session.userID),
            eq(sessionsTable.created, ctx.session.created),
          ),
        );

      return {ok: true};
    }),
});
