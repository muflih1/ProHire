import {initTRPC, TRPCError} from '@trpc/server';
import type {Context} from './context.js';
import superjson from 'superjson';
import {
  checkAuthorization,
  CheckAuthorizationParams,
} from '../utils/check-authorization.js';
import {getCurrentOrganization} from '../services/organization.service.js';

const t = initTRPC.context<Context>().create({
  errorFormatter: ({shape, error}) => {
    console.log('[TRPC]', error)
    return {
      ...shape,
      message:
        error.code === 'INTERNAL_SERVER_ERROR'
          ? 'Internal server error'
          : error.message,
    };
  },
  transformer: superjson,
});

export const createTRPCRouter = t.router;
export const createTRPCMiddleware = t.middleware;
export const publicProcedure = t.procedure;
export const protectedProcedure = publicProcedure.use(async ({ctx, next}) => {
  if (!ctx?.session || !ctx?.session?.userID) {
    throw new TRPCError({code: 'UNAUTHORIZED'});
  }

  return next({ctx});
});
export const authorizedProcedure = (
  params: CheckAuthorizationParams,
  message: string,
) =>
  protectedProcedure.use(
    createTRPCMiddleware(async ({ctx, next}) => {
      const orgID = ctx.session.lastActiveOrganizationID;
      if (orgID == null) {
        throw new TRPCError({code: 'UNAUTHORIZED'});
      }

      const organization = await getCurrentOrganization(
        ctx.session.userID,
        orgID,
      );

      if (!organization) {
        throw new TRPCError({code: 'UNAUTHORIZED'});
      }

      if (!checkAuthorization(params, organization)) {
        throw new TRPCError({code: 'FORBIDDEN', message});
      }

      return next({
        ctx: {
          ...ctx,
          organization,
        },
      });
    }),
  );
