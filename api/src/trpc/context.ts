import type {CreateExpressContextOptions} from '@trpc/server/adapters/express';
import {db} from '../db/index.js';
import {JobListingService} from '../services/job-listing.service.js';

export async function createContext({req}: CreateExpressContextOptions) {
  return {
    session: req.session,
    db,
    jobListingService: new JobListingService(db),
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
