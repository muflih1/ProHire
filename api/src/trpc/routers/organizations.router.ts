import {TRPCError} from '@trpc/server';
import {createTRPCRouter, protectedProcedure} from '../init.js';
import {z} from 'zod';
import {
  featuresTable,
  organizationMembershipsTable,
  organizationsTable,
  organizationSubscriptionsTable,
  permissionsTable,
  planFeaturesTable,
  plansTable,
  rolePermissionsTable,
  rolesTable,
} from '../../db/schema.js';
import {and, eq, sql} from 'drizzle-orm';
import slugify from 'slugify';
import {snowflake} from '../../lib/snowflake.js';
import {getCurrentOrganization} from '../../services/organization.service.js';
import {omit} from '../../utils/object.js';

export const organizationsRouter = createTRPCRouter({
  create: protectedProcedure
    .input(z.object({name: z.string().nonempty()}))
    .mutation(async ({ctx, input}) => {
      return await ctx.db.transaction(async tx => {
        const [organization] = await tx
          .insert(organizationsTable)
          .values({
            name: input.name,
            slug: `${slugify(input.name, {lower: true, trim: true})}-${snowflake.nextId().toString()}`,
          })
          .returning();
        if (organization == null) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to insert organization',
          });
        }
        const [freePlan] = await tx
          .select()
          .from(plansTable)
          .where(eq(plansTable.key, 'free_org'));
        if (freePlan == null) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to get free_org plan',
          });
        }
        await tx.insert(organizationSubscriptionsTable).values({
          organizationID: organization.id,
          planID: freePlan.id,
          status: 'active',
          currentPeriodStart: new Date(),
          amount: 0,
          planPeriod: 'annual',
          currency: 'INR',
        });

        const [ownerRole] = await tx
          .select()
          .from(rolesTable)
          .where(eq(rolesTable.key, 'org:owner'));
        if (!ownerRole) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to get owner_role',
          });
        }

        await tx.insert(organizationMembershipsTable).values({
          organizationID: organization.id,
          roleID: ownerRole.id,
          userID: ctx.session.userID,
        });

        return {organization};
      });
    }),

  active: protectedProcedure.query(async ({ctx}) => {
    const orgID = ctx.session.lastActiveOrganizationID;
    if (orgID == null) {
      throw new TRPCError({code: 'UNAUTHORIZED'});
    }

    const {organization} = await getCurrentOrganization(
      ctx.session.userID,
      orgID,
    );

    if (!organization) {
      throw new TRPCError({code: 'NOT_FOUND'});
    }

    return omit(organization, ['_stripeCustomerID']);
  }),

  list: protectedProcedure.query(async ({ctx}) => {
    return await ctx.db
      .select({
        id: organizationsTable.id,
        name: organizationsTable.name,
        imageURL: organizationsTable.profileImageStorageKey,
      })
      .from(organizationMembershipsTable)
      .innerJoin(
        organizationsTable,
        eq(organizationMembershipsTable.organizationID, organizationsTable.id),
      )
      .where(eq(organizationMembershipsTable.userID, ctx.session.userID));
  }),
});

// active: publicProcedure.use(auth).query(async ({ctx, input}) => {
//   if (!ctx.session.lastActiveOrganizationID) {
//     throw new TRPCError({code: 'UNAUTHORIZED'});
//   }
//   const rows = await ctx.db
//     .select({
//       orgId: organizationsTable.id,
//       orgName: organizationsTable.name,
//       orgImage: organizationsTable.profileImageStorageKey,

//       roleId: rolesTable.id,
//       roleName: rolesTable.name,
//       roleDesc: rolesTable.description,
//       permissionName: permissionsTable.key,

//       // planId: plansTable.id,
//       // planName: plansTable.name,
//       // planDescription: plansTable.description,

//       // featureId: featuresTable.id,
//       // featureKey: featuresTable.key,
//       // featureName: featuresTable.name,
//     })
//     .from(organizationMembershipsTable)
//     .innerJoin(
//       organizationsTable,
//       eq(organizationMembershipsTable.organizationID, organizationsTable.id),
//     )
//     .innerJoin(
//       rolesTable,
//       eq(organizationMembershipsTable.roleID, rolesTable.id),
//     )
//     .innerJoin(
//       rolePermissionsTable,
//       eq(rolesTable.id, rolePermissionsTable.roleID),
//     )
//     .innerJoin(
//       permissionsTable,
//       eq(rolePermissionsTable.permissionID, permissionsTable.id),
//     )
//     // .innerJoin(
//     //   plansTable,
//     //   eq(organizationSubscriptionsTable.planID, plansTable.id),
//     // )
//     // .leftJoin(
//     //   planFeaturesTable,
//     //   eq(plansTable.id, planFeaturesTable.planID),
//     // )
//     // .leftJoin(
//     //   featuresTable,
//     //   eq(featuresTable.id, planFeaturesTable.featureID),
//     // )
//     .where(
//       and(
//         eq(organizationMembershipsTable.userID, ctx.session.userID),
//         eq(
//           organizationMembershipsTable.organizationID,
//           ctx.session.lastActiveOrganizationID,
//         ),
//       ),
//     );

//   return rows;
// }),
