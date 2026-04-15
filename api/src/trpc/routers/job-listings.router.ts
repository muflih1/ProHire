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
  getMostRecent: authorizedProcedure(
    {permission: 'org:job_listing:read'},
    "You don't have permmision",
  ).query(async ({ctx}) => {
    const orgID = ctx.session.lastActiveOrganizationID;
    if (!orgID) {
      return null;
    }

    const jobListing =
      await ctx.jobListingService.getMostRecentJobListing(orgID);

    return jobListing;
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
    "You don't have permission to update the job listing",
  )
    .input(
      z.object({
        id: z.bigint(),
        jobListing: jobListingSchema,
      }),
    )
    .mutation(async ({ctx, input}) => {
      const jobListing = await ctx.jobListingService.updateJobListing(
        input.id,
        input.jobListing,
      );

      return jobListing ?? null;
    }),

  getPublishedCount: protectedProcedure.query(async ({ctx}) => {
    const orgID = ctx.session.lastActiveOrganizationID;

    if (orgID == null) {
      throw new TRPCError({code: 'UNAUTHORIZED'});
    }

    const count =
      await ctx.jobListingService.getPublishedJobListingCount(orgID);

    return {count};
  }),

  toggleStatus: authorizedProcedure(
    {permission: 'org:job_listing:change_status'},
    "You don't have permission to update this job listing status",
  )
    .input(z.object({jobListingID: z.bigint()}))
    .mutation(async ({ctx, input}) => {
      const jobListing = await ctx.jobListingService.getJobListing(
        input.jobListingID,
        ctx.organization.id,
      );
      if (!jobListing) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message:
            "You don't have permission to update this job listing status",
        });
      }

      const newStatus = ctx.jobListingService.getNextJobListingStatus(
        jobListing.status,
      );
      if (
        newStatus === 'PUBLISHED' &&
        (await ctx.jobListingService.hasReachedMaxPublishedJobListings(
          ctx.session.userID,
          ctx.organization.id,
        ))
      ) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message:
            "You don't have permission to update this job listing status",
        });
      }

      await ctx.jobListingService.updateJobListing(jobListing.id, {
        status: newStatus,
        postedAt:
          newStatus === 'PUBLISHED' && jobListing.postedAt == null
            ? new Date()
            : undefined,
      });

      return {ok: true, status: newStatus};
    }),

  getFeaturedCount: protectedProcedure.query(async ({ctx}) => {
    const orgID = ctx.session.lastActiveOrganizationID;
    if (orgID == null) {
      throw new TRPCError({code: 'UNAUTHORIZED'});
    }

    const count = await ctx.jobListingService.getFeaturedJobListingCount(orgID);

    return {count};
  }),

  toggleFeatured: authorizedProcedure(
    {permission: 'org:job_listing_application:change_status'},
    "You don't have permission to update this job listing's featured status.",
  )
    .input(z.object({jobListingID: z.bigint()}))
    .mutation(async ({ctx, input}) => {
      const jobListing = await ctx.jobListingService.getJobListing(
        input.jobListingID,
        ctx.organization.id,
      );
      if (!jobListing) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message:
            "You don't have permission to update this job listing's featured status.",
        });
      }

      const newFeaturedStatus = !jobListing.isFeatured;
      if (
        newFeaturedStatus === true &&
        (await ctx.jobListingService.hasReachedMaxFeaturedJobListing(
          ctx.session.userID,
          ctx.organization.id,
        ))
      ) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message:
            "You don't have permission to update this job listing's featured status",
        });
      }

      await ctx.jobListingService.updateJobListing(jobListing.id, {
        isFeatured: newFeaturedStatus,
      });

      return {ok: true, isFeatured: newFeaturedStatus};
    }),

  delete: authorizedProcedure(
    {permission: 'org:job_listing:delete'},
    "You don't have permission to delete this job listing.",
  )
    .input(z.object({id: z.bigint()}))
    .mutation(async ({ctx, input}) => {
      const jobListing = await ctx.jobListingService.getJobListing(
        input.id,
        ctx.organization.id,
      );
      if (!jobListing) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: "You don't have permission to delete this job listing.",
        });
      }

      await ctx.jobListingService.deleteJobListing(input.id);

      return {ok: true};
    }),

  list: authorizedProcedure(
    {permission: 'org:job_listing:read'},
    "You don't have permission",
  ).query(async ({ctx}) => {
    return await ctx.jobListingService.getJobListings(ctx.organization.id);
  }),
});
