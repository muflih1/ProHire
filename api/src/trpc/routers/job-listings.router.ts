import z from 'zod';
import {
  authorizedProcedure,
  createTRPCRouter,
  protectedProcedure,
} from '../init.js';
import {jobListingsTable} from '../../db/schema.js';
import {and, count, eq} from 'drizzle-orm';
import {jobListingSchema} from '../../validations/job-listing.schema.js';
import {TRPCError} from '@trpc/server';

export const jobListingsRouter = createTRPCRouter({
  mostRecent: protectedProcedure.query(async ({ctx}) => {
    const orgId = ctx.session.lastActiveOrganizationID;
    if (!orgId) {
      return null;
    }

    const jobListing = await ctx.db.query.jobListingsTable.findFirst({
      where: (fields, {eq}) => eq(fields.organizationID, orgId),
      orderBy: (fields, {desc}) => desc(fields.id),
      columns: {
        id: true,
      },
    });

    return jobListing ?? null;
  }),

  create: authorizedProcedure(
    {permission: 'org:job_listing:write'},
    "You don't have the permissions to create a job listing",
  )
    .input(jobListingSchema)
    .mutation(async ({ctx, input}) => {
      const [jobListing] = await ctx.db
        .insert(jobListingsTable)
        .values({
          ...input,
          wageInPaise: input.wage ? input.wage * 100 : null,
          status: 'DRAFT',
          organizationID: ctx.organization.id,
        })
        .returning({
          id: jobListingsTable.id,
        });

      return jobListing;
    }),

  get: authorizedProcedure(
    {permission: 'org:job_listing:read'},
    "You don't have the permission to view the job listing",
  )
    .input(z.object({jobListingID: z.string().min(14)}))
    .query(async ({ctx, input}) => {
      const jobListing = await ctx.db.query.jobListingsTable.findFirst({
        where: (fields, {and, eq}) =>
          and(
            eq(fields.id, BigInt(input.jobListingID)),
            eq(fields.organizationID, ctx.organization.id),
          ),
      });

      return jobListing ?? null;
    }),

  update: authorizedProcedure(
    {permission: 'org:job_listing:update'},
    "You don't have the permission to update the job listing",
  )
    .input(
      z.object({
        id: z.bigint(),
        jobListing: jobListingSchema,
      }),
    )
    .mutation(async ({ctx, input}) => {
      const [jobListing] = await ctx.db
        .update(jobListingsTable)
        .set(input.jobListing)
        .where(eq(jobListingsTable.id, input.id))
        .returning({
          id: jobListingsTable.id,
        });

      return jobListing ?? null;
    }),

  getPublishedCount: protectedProcedure.query(async ({ctx}) => {
    const orgID = ctx.session.lastActiveOrganizationID;
    if (orgID == null) {
      throw new TRPCError({code: 'UNAUTHORIZED'});
    }
    const [row] = await ctx.db
      .select({count: count()})
      .from(jobListingsTable)
      .where(
        and(
          eq(jobListingsTable.organizationID, orgID),
          eq(jobListingsTable.status, 'PUBLISHED'),
        ),
      );
    return {count: row?.count ?? 0};
  }),
});
