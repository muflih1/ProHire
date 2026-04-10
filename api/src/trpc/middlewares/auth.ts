import {TRPCError} from '@trpc/server';
import {createTRPCMiddleware} from '../init.js';

export const auth = createTRPCMiddleware(({ctx, next}) => {
  if (!ctx?.session || !ctx?.session?.userID) {
    throw new TRPCError({code: 'UNAUTHORIZED'});
  }

  return next({ctx});
});
