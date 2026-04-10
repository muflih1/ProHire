import {and, eq, sql} from 'drizzle-orm';
import {db} from '../db/index.js';
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
} from '../db/schema.js';

export async function getCurrentOrganization(
  userID: bigint,
  organizationID: bigint,
) {
  const permissionsSubquery = db
    .select({
      roleID: rolesTable.id,
      permissions: sql<string[]>`
            json_agg(
              ${permissionsTable.key}
            )
          `.as('permissions'),
    })
    .from(rolesTable)
    .innerJoin(
      rolePermissionsTable,
      eq(rolePermissionsTable.roleID, rolesTable.id),
    )
    .innerJoin(
      permissionsTable,
      eq(permissionsTable.id, rolePermissionsTable.permissionID),
    )
    .groupBy(rolesTable.id)
    .as('permissions_subquery');

  const planFeaturesSubquery = db
    .select({
      planID: planFeaturesTable.planID,
      features: sql<string[]>`
            json_agg(${featuresTable.key})
          `.as('features'),
    })
    .from(planFeaturesTable)
    .innerJoin(featuresTable, eq(featuresTable.id, planFeaturesTable.featureID))
    .groupBy(planFeaturesTable.planID)
    .as('plan_features_subquery');

  const [organization] = await db
    .select({
      id: organizationsTable.id,
      name: organizationsTable.name,
      image: {
        uri: organizationsTable.profileImageStorageKey,
      },
      role: rolesTable.key,
      roleName: rolesTable.name,
      permissions: sql<
        string[]
      >`coalesce(${permissionsSubquery.permissions}, '[]')`,
      plan: plansTable.key,
      planName: plansTable.name,
      _stripeCustomerID: organizationsTable.stripeCustomerID,
      features: sql<string[]>`coalesce(${planFeaturesSubquery.features}, '[]')`,
      createdAt: organizationsTable.createdAt,
      updatedAt: organizationsTable.updatedAt,
    })
    .from(organizationMembershipsTable)
    .innerJoin(
      organizationsTable,
      eq(organizationsTable.id, organizationMembershipsTable.organizationID),
    )
    .innerJoin(
      rolesTable,
      eq(rolesTable.id, organizationMembershipsTable.roleID),
    )
    .innerJoin(
      organizationSubscriptionsTable,
      and(
        eq(
          organizationSubscriptionsTable.organizationID,
          organizationsTable.id,
        ),
        eq(organizationSubscriptionsTable.status, 'active'),
      ),
    )
    .innerJoin(
      plansTable,
      eq(plansTable.id, organizationSubscriptionsTable.planID),
    )
    .leftJoin(
      permissionsSubquery,
      eq(permissionsSubquery.roleID, rolesTable.id),
    )
    .leftJoin(
      planFeaturesSubquery,
      eq(planFeaturesSubquery.planID, plansTable.id),
    )
    .where(
      and(
        eq(organizationMembershipsTable.userID, userID),
        eq(organizationMembershipsTable.organizationID, organizationID),
      ),
    )
    .limit(1);

  return organization ?? null;
}
