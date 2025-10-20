import { t } from "../init.js";
import { db } from "../../db/index.js";
import { featuresTable, jobListingApplicationsTable, jobListingsTable, membersTable, organizationsTable, organizationSubscriptionsTable, permissionsTable, planFeaturesTable, plansTable, rolePermissionsTable, rolesTable, usersTable } from "../../db/schema.js";
import { and, count, desc, eq, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { PERMISSIONS } from "../../constants/permmisions.js";
import { hasPermission } from "../middlewares/has-permission.js";
import { auth } from "../middlewares/auth.js";

export const appRouter = t.router({
  viewer: t.procedure.query(async ({ ctx }) => {
    if (!ctx?.session || ctx?.session?.userID == null) {
      return null
    }

    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, ctx.session.userID));

    if (!user) {
      return null;
    }

    return user;
  }),

  createOrganization: t.procedure
    .input(z.object({ name: z.string().nonempty() }))
    .use(auth)
    .mutation(async ({ ctx, input }) => {
      return await db.transaction(async tx => {
        const [organization] = await tx.insert(organizationsTable).values({ name: input.name }).returning();
        if (organization == null) {
          throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' })
        }
        const [defaultPlan] = await tx.select().from(plansTable).where(eq(plansTable.name, 'Free'));
        if (defaultPlan == null) {
          throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
        }
        await tx.insert(organizationSubscriptionsTable).values({
          organizationID: organization.id,
          planID: defaultPlan.id,
          startDate: new Date(),
          endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 100)),
          status: 'ACTIVE'
        })
        const [[ownerRole, adminRole, memberRole], permissions] = await Promise.all([
          tx.insert(rolesTable)
            .values([
              {
                name: 'Owner',
                organizationID: organization.id,
                description:
                  'Has full control over the organization, including managing billing, settings, roles, and all members.',
              },
              {
                name: 'Admin',
                organizationID: organization.id,
                description:
                  'Can manage users, roles, and organization resources but cannot transfer ownership or delete the organization.',
              },
              {
                name: 'Member',
                organizationID: organization.id,
                description:
                  'Can access and collaborate on organization resources but has limited administrative privileges.',
              },
            ])
            .returning(),
          await tx.select().from(permissionsTable)
        ]);

        if (!ownerRole || !adminRole || !memberRole) {
          throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' })
        }

        const [membership] = await tx.insert(membersTable).values({ organizationID: organization.id, roleID: ownerRole.id, userID: ctx.session.userID }).returning()

        if (!membership) {
          throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
        }

        if (permissions.length === 0) {
          throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' })
        }

        await tx.insert(rolePermissionsTable).values([
          // Owner gets everything
          ...permissions.map((perm) => ({
            roleID: ownerRole.id,
            permissionID: perm.id,
          })),
          // Admin gets most permissions except deleting org
          ...permissions
            .filter((p) => p.name !== 'ORG_DELETE')
            .map((perm) => ({
              roleID: adminRole.id,
              permissionID: perm.id,
            })),
          // Member gets only read permissions
          ...permissions
            .filter((p) => p.name.endsWith('_READ') || p.name.endsWith('_LIST'))
            .map((perm) => ({
              roleID: memberRole.id,
              permissionID: perm.id,
            })),
        ]);

        return { organization, membership }
      })
    }),

  listOrganizations: t.procedure
    .use(auth)
    .query(async ({ ctx }) => {
      return await db.select({ id: organizationsTable.id, name: organizationsTable.name, imageURL: organizationsTable.imageURL }).from(membersTable).innerJoin(organizationsTable, eq(membersTable.organizationID, organizationsTable.id)).where(eq(membersTable.userID, ctx.session.userID))
    }),
  getActiveOrganization: t.procedure
    .input(z.object({ organizationID: z.string() }))
    .use(auth)
    .query(async ({ ctx, input }) => {
      const rows = await db
        .select({
          orgId: organizationsTable.id,
          orgName: organizationsTable.name,
          orgImage: organizationsTable.imageURL,

          roleId: rolesTable.id,
          roleName: rolesTable.name,
          roleDesc: rolesTable.description,
          permissionName: permissionsTable.name,

          planId: plansTable.id,
          planName: plansTable.name,
          planDescription: plansTable.description,

          featureId: featuresTable.id,
          featureKey: featuresTable.key,
          featureName: featuresTable.name,
        })
        .from(membersTable)

        // 👇 Member → Org
        .innerJoin(organizationsTable, eq(membersTable.organizationID, organizationsTable.id))

        // 👇 Member → Role → Permissions
        .innerJoin(rolesTable, eq(membersTable.roleID, rolesTable.id))
        .innerJoin(rolePermissionsTable, eq(rolesTable.id, rolePermissionsTable.roleID))
        .innerJoin(permissionsTable, eq(rolePermissionsTable.permissionID, permissionsTable.id))

        // 👇 Org → Active Subscription
        .innerJoin(
          organizationSubscriptionsTable,
          and(
            eq(organizationSubscriptionsTable.organizationID, organizationsTable.id),
            eq(organizationSubscriptionsTable.status, 'ACTIVE')
          )
        )

        // 👇 Subscription → Plan
        .innerJoin(plansTable, eq(organizationSubscriptionsTable.planID, plansTable.id))

        // 👇 Plan → Features (LEFT join — may have none)
        .leftJoin(planFeaturesTable, eq(plansTable.id, planFeaturesTable.planID))
        .leftJoin(featuresTable, eq(featuresTable.id, planFeaturesTable.featureID))

        // 👇 Restrict to current user + org
        .where(
          and(
            eq(membersTable.userID, ctx.session.userID),
            eq(membersTable.organizationID, BigInt(input.organizationID))
          )
        )


      const aggregated = rows.reduce((acc, row) => {
        const key = `${row.orgId}-${row.roleId}`

        if (!acc[key]) {
          acc[key] = {
            id: row.orgId,
            name: row.orgName,
            imageURL: row.orgImage,
            role: {
              id: row.roleId,
              name: row.roleName,
              description: row.roleDesc,
              permissions: [],
            },
            plan: {
              id: row.planId,
              name: row.planName,
              description: row.planDescription,
              features: [],
            },
          }
        }

        if (row.permissionName && !acc[key].role.permissions.includes(row.permissionName)) {
          acc[key].role.permissions.push(row.permissionName)
        }

        if (
          row.featureKey &&
          !acc[key].plan.features.includes(row.featureKey)
        ) {
          acc[key].plan.features.push(row.featureKey,)
        }

        return acc
      }, {} as Record<string, { id: bigint; name: string; imageURL: string | null; role: { id: bigint; name: string; description: string | null; permissions: string[] }; plan: { id: bigint; name: string; description: string | null; features: string[] } }>)

      return Object.values(aggregated)[0];
    }),
  createJobListing: t.procedure
    .input(z
      .object({
        title: z.string().nonempty(),
        description: z.string().nonempty(),
        experienceLevel: z.enum(['JUNIOR', 'MID_LEVEL', 'SENIOR']),
        locationRequirement: z.enum(['IN_OFFICE', 'HYBRID', 'REMOTE']),
        streetAddress: z.string(),
        type: z.enum(['INTERNSHIP', 'PART_TIME', 'FULL_TIME']),
        wage: z.number().int().positive().min(1),
        wageInterval: z.enum(['HOURLY', 'YEARLY']).nullable(),
        openings: z.number().int().min(1).positive(),
        organizationID: z.string().nonempty("You don't have the permission to create a job listing")
      })
      .refine(
        data => data.locationRequirement === 'REMOTE' && data.streetAddress != null,
        {
          error: 'Street address required for non-remote listing',
          path: ['streetAddress'],
        }
      ))
    .use(hasPermission(PERMISSIONS.ORG_JOB_LISTING_WRITE, "You don't have the permission to create a job listing"))
    .mutation(async ({ input }) => {
      const [jobListing] = await db
        .insert(jobListingsTable)
        .values({
          ...input,
          organizationID: BigInt(input.organizationID),
          wageInPaise: input.wage * 100,
        })
        .returning()

      return jobListing
    }),

  updateJobListing: t.procedure
    .input(z
      .object({
        title: z.string().nonempty(),
        description: z.string().nonempty(),
        experienceLevel: z.enum(['JUNIOR', 'MID_LEVEL', 'SENIOR']),
        locationRequirement: z.enum(['IN_OFFICE', 'HYBRID', 'REMOTE']),
        streetAddress: z.string(),
        type: z.enum(['INTERNSHIP', 'PART_TIME', 'FULL_TIME']),
        wage: z.number().int().positive().min(1),
        wageInterval: z.enum(['HOURLY', 'YEARLY']).nullable(),
        openings: z.number().int().min(1).positive(),
        organizationID: z.string().nonempty("You don't have the permission to create a job listing"),
        jobListingID: z.string().nonempty()
      })
      .refine(
        data => data.locationRequirement === 'REMOTE' || data.streetAddress != null,
        {
          error: 'Street address required for non-remote listing',
          path: ['streetAddress'],
        }
      ))
    .use(hasPermission(PERMISSIONS.ORG_JOB_LISTING_UPDATE, "You don't have the permission to update the job listing"))
    .mutation(async ({ input }) => {
      const [jobListing] = await db
        .update(jobListingsTable)
        .set({
          ...input,
          organizationID: BigInt(input.organizationID),
          wageInPaise: input.wage * 100,
        })
        .where(eq(jobListingsTable.id, BigInt(input.jobListingID)))
        .returning()

      return jobListing
    }),

  getJobListingByID: t.procedure
    .input(z
      .object({
        organizationID: z.string().nonempty(),
        jobListingID: z.string().nonempty()
      })
    )
    .use(hasPermission(PERMISSIONS.ORG_JOB_LISTING_READ, "You don't have the permission to see the job listing"))
    .query(async ({ input }) => {
      const [jobListing] = await db.select().from(jobListingsTable).where(eq(jobListingsTable.id, BigInt(input.jobListingID)))

      return jobListing
    }),
  updateJobListingStatus: t.procedure
    .input(z.object({ jobLisstingID: z.string().nonempty(), organizationID: z.string().nonempty(), newStatus: z.enum(['PUBLISHED', 'UNLISTED']) }))
    .use(hasPermission(PERMISSIONS.ORG_JOB_LISTING_CHANGE_STATUS, "You don't have the permission to update this job listing's status"))
    .mutation(async ({ input }) => {

      const [jobListing] = await db
        .update(jobListingsTable)
        .set({
          status: input.newStatus,
          postedAt: sql`
            CASE 
              WHEN ${input.newStatus} = 'PUBLISHED' AND ${jobListingsTable.postedAt} IS NULL THEN NOW()
              ELSE ${jobListingsTable.postedAt}
            END`,
        })
        .where(eq(jobListingsTable.id, BigInt(input.jobLisstingID)))
        .returning()

      return jobListing
    }),

  deleteJobListing: t.procedure
    .input(z.object({ jobListingID: z.string().nonempty(), organizationID: z.string().nonempty() }))
    .use(hasPermission(PERMISSIONS.ORG_JOB_LISTING_DELETE, "You don't have permission to delete this job listing"))
    .mutation(async ({ input }) => {
      await db
        .delete(jobListingsTable)
        .where(
          eq(jobListingsTable.id, BigInt(input.jobListingID)),
        );
      return { success: true }
    }),

  getJobListingList: t.procedure
    .query(async () => {
      const rows = await db
        .select()
        .from(jobListingsTable)
        .leftJoin(organizationsTable, eq(jobListingsTable.organizationID, organizationsTable.id))
        .where(eq(jobListingsTable.status, 'PUBLISHED'))

      if (rows.length === 0) {
        return []
      }

      const formatted = rows.reduce((acc, jobListings) => {
        const key = `${jobListings.job_listings.id}$${jobListings.organizations?.id}`
        if (!acc[key]) {
          acc[key] = {
            ...jobListings.job_listings,
            organization: jobListings.organizations
          }
        }
        return acc
      }, {} as Record<string, typeof jobListingsTable.$inferSelect & { organization: null | typeof organizationsTable.$inferInsert }>)

      return Object.values(formatted)
    }),

  getOrganizationPlansList: t.procedure.input(z.object({ organizationID: z.string().nonempty() })).use(auth).query(async ({ input }) => {
    const rows = await db
      .select({
        planId: plansTable.id,
        planName: plansTable.name,
        planDesc: plansTable.description,
        planPricePerMonthInPaise: plansTable.pricePerMonthInPaise,
        planPricePerYearInPaise: plansTable.pricePerYearInPaise,
        planFeatureId: featuresTable.id,
        planFeatureName: featuresTable.name,
        planFeatureIsPubliclyVisible: featuresTable.isPubliclyVisible,
        subscriptionId: organizationSubscriptionsTable.id
      })
      .from(plansTable)
      .innerJoin(planFeaturesTable, eq(planFeaturesTable.planID, plansTable.id))
      .innerJoin(featuresTable, eq(planFeaturesTable.featureID, featuresTable.id))
      .leftJoin(
        organizationSubscriptionsTable,
        and(
          eq(organizationSubscriptionsTable.planID, plansTable.id),
          eq(organizationSubscriptionsTable.organizationID, BigInt(input.organizationID)),
          eq(organizationSubscriptionsTable.status, 'ACTIVE'))
      )
      .where(eq(plansTable.isPubliclyVisible, true))

    const aggregated = rows.reduce((acc, row) => {
      const key = row.planId.toString()
      if (!acc[key]) {
        acc[key] = {
          id: row.planId,
          name: row.planName,
          description: row.planDesc,
          pricePerMonthInPaise: row.planPricePerMonthInPaise,
          pricePerYearInPaise: row.planPricePerYearInPaise,
          isActive: !!row.subscriptionId,
          features: []
        }
      }
      if (row.planFeatureIsPubliclyVisible && !acc[key].features.some(f => (f.id === row.planFeatureId))) {
        acc[key].features.push({ id: row.planFeatureId, name: row.planFeatureName })
      }
      return acc
    }, {} as Record<string, { id: bigint; name: string; description: string | null; pricePerMonthInPaise: number; pricePerYearInPaise: number | null; isActive: boolean; features: Array<{ id: bigint; name: string }> }>)

    const plans = Object.values(aggregated).sort((a, b) => (a.pricePerMonthInPaise - b.pricePerMonthInPaise))

    return plans
  }),

  getPublishedJobListingsCount: t.procedure.input(z.object({ organizationID: z.string().nonempty() })).use(auth).query(async ({ input }) => {
    const [jobListingCount] = await db
      .select({ count: count(jobListingsTable.id) })
      .from(jobListingsTable)
      .where(and(
        eq(jobListingsTable.status, 'PUBLISHED'),
        eq(jobListingsTable.organizationID, BigInt(input.organizationID))
      ))
    return jobListingCount
  }),

  jobListingsListEmployer: t.procedure.input(z.object({ organizationID: z.string() })).use(hasPermission(PERMISSIONS.ORG_JOB_LISTING_LIST)).query(async ({ input }) => {
    return await db
      .select({
        id: jobListingsTable.id,
        title: jobListingsTable.title,
        status: jobListingsTable.status,
        postedAt: jobListingsTable.postedAt,
        applicationCount: count(jobListingApplicationsTable.userID)
      })
      .from(jobListingsTable)
      .leftJoin(jobListingApplicationsTable, eq(jobListingsTable.id, jobListingApplicationsTable.jobListingID))
      .where(eq(jobListingsTable.organizationID, BigInt(input.organizationID)))
      .groupBy(jobListingApplicationsTable.jobListingID, jobListingsTable.id)
      .orderBy(desc(jobListingsTable.id))
      .limit(10)
  })
})