import {and, count, desc, eq} from 'drizzle-orm';
import type {db as client} from '../db/index.js';
import {
  jobListingApplicationsTable,
  jobListingsTable,
  JobListingStatus,
} from '../db/schema.js';
import {getCurrentOrganization} from './organization.service.js';

export class JobListingService {
  constructor(private db: typeof client) {}

  async getJobListing(jobListingID: bigint, orgID: bigint) {
    return (
      (await this.db.query.jobListingsTable.findFirst({
        where: (fields, {and, eq}) =>
          and(eq(fields.id, jobListingID), eq(fields.organizationID, orgID)),
      })) ?? null
    );
  }

  async getMostRecentJobListing(orgID: bigint) {
    return (
      (await this.db.query.jobListingsTable.findFirst({
        where: (fields, {eq}) => eq(fields.organizationID, orgID),
        orderBy: (fields, {desc}) => desc(fields.id),
        columns: {
          id: true,
        },
      })) ?? null
    );
  }

  async getPublishedJobListingCount(orgID: bigint) {
    const [row] = await this.db
      .select({count: count()})
      .from(jobListingsTable)
      .where(
        and(
          eq(jobListingsTable.organizationID, orgID),
          eq(jobListingsTable.status, 'PUBLISHED'),
        ),
      );

    return row?.count ?? 0;
  }

  async getFeaturedJobListingCount(orgID: bigint) {
    const [row] = await this.db
      .select({count: count()})
      .from(jobListingsTable)
      .where(
        and(
          eq(jobListingsTable.organizationID, orgID),
          eq(jobListingsTable.isFeatured, true),
        ),
      );

    return row?.count ?? 0;
  }

  getNextJobListingStatus(status: JobListingStatus) {
    switch (status) {
      case 'DRAFT':
      case 'UNLISTED':
        return 'PUBLISHED';
      case 'PUBLISHED':
        return 'UNLISTED';
      default:
        throw new Error(`Unkown job listing status: ${status satisfies never}`);
    }
  }

  async hasReachedMaxPublishedJobListings(userID: bigint, orgID: bigint) {
    const {organization, has} = await getCurrentOrganization(userID, orgID);

    if (!organization) {
      return true;
    }

    const count = await this.getPublishedJobListingCount(orgID);

    return !(
      (has({feature: 'post_1_job_listing'}) && count < 1) ||
      (has({feature: 'post_3_job_listings'}) && count < 3) ||
      has({feature: 'post_unlimited_job_listings'})
    );
  }

  async hasReachedMaxFeaturedJobListing(userID: bigint, orgID: bigint) {
    const {organization, has} = await getCurrentOrganization(userID, orgID);

    if (!organization) {
      return true;
    }

    const count = await this.getFeaturedJobListingCount(orgID);

    return !(
      (has({feature: '1_featured_job_listing'}) && count < 1) ||
      has({feature: 'unlimited_featured_job_listings'})
    );
  }

  async updateJobListing(
    id: bigint,
    data: Partial<typeof jobListingsTable.$inferInsert>,
  ) {
    const [jobListing] = await this.db
      .update(jobListingsTable)
      .set(data)
      .where(eq(jobListingsTable.id, id))
      .returning();
    return jobListing;
  }

  async deleteJobListing(id: bigint) {
    await this.db.delete(jobListingsTable).where(eq(jobListingsTable.id, id));
  }

  async getJobListings(orgID: bigint) {
    const rows = await this.db
      .select({
        id: jobListingsTable.id,
        title: jobListingsTable.title,
        status: jobListingsTable.status,
        applicationCount: count(jobListingApplicationsTable.userID).as(
          'application_count',
        ),
      })
      .from(jobListingsTable)
      .leftJoin(
        jobListingApplicationsTable,
        eq(jobListingsTable.id, jobListingApplicationsTable.jobListingID),
      )
      .where(eq(jobListingsTable.organizationID, orgID))
      .groupBy(jobListingApplicationsTable.jobListingID, jobListingsTable.id)
      .orderBy(desc(jobListingsTable.id));

    return rows
  }
}
