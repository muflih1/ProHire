import { t } from "../init.js";
import { db } from "../../db/index.js";
import { membersTable, organizationsTable, permissionsTable, rolePermissionsTable, rolesTable, usersTable } from "../../db/schema.js";
import { and, eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

export const appRouter = t.router({
  viewer: t.procedure.query(async ({ ctx }) => {
    if (!ctx?.session || ctx?.session?.userID == null) {
      return null
    }

    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, ctx.session.userID));

    if (!user) {
      return null
    }

    return user
  }),

  createOrganization: t.procedure.use(({ ctx, next }) => {
    if (!ctx?.session || !ctx?.session?.userID) {
      throw new TRPCError({ code: 'UNAUTHORIZED' })
    }
    return next({ ctx })
  }).input(z.object({ name: z.string().nonempty() })).mutation(async ({ ctx, input }) => {
    return await db.transaction(async tx => {
      const [organization] = await tx.insert(organizationsTable).values({ name: input.name }).returning();
      if (organization == null) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' })
      }
      const [ownerRole, adminRole, memberRole] = await tx.insert(rolesTable).values([
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
      ]).returning();

      if (!ownerRole || !adminRole || !memberRole) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' })
      }

      const [membership] = await tx.insert(membersTable).values({ organizationID: organization.id, roleID: ownerRole.id, userID: ctx.session.userID }).returning()

      if (!membership) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
      }

      const permissions = await tx.select().from(permissionsTable)

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
          .filter((p) => p.name.endsWith('_READ'))
          .map((perm) => ({
            roleID: memberRole.id,
            permissionID: perm.id,
          })),
      ]);

      return { organization, membership }
    })
  }),
  organization: t.procedure.use(({ ctx, next }) => {
    if (!ctx?.session || !ctx?.session?.userID) {
      throw new TRPCError({ code: 'UNAUTHORIZED' })
    }
    return next({ ctx })
  }).query(async ({ ctx }) => {
    return await db
      .select({
        orgId: organizationsTable.id,
        orgName: organizationsTable.name,
        orgCreatedAt: organizationsTable.createdAt,
        userID: usersTable.id,
        userDisplayName: usersTable.displayName,
        roleId: rolesTable.id,
        roleName: rolesTable.name,
        roleDescription: rolesTable.description,
        permissionName: permissionsTable.name
      })
      .from(membersTable)
      .innerJoin(organizationsTable, eq(membersTable.organizationID, organizationsTable.id))
      .innerJoin(usersTable, eq(membersTable.userID, usersTable.id))
      .innerJoin(rolesTable, eq(membersTable.roleID, rolesTable.id))
      .innerJoin(rolePermissionsTable, eq(rolePermissionsTable.roleID, rolesTable.id))
      .innerJoin(permissionsTable, eq(rolePermissionsTable.permissionID, permissionsTable.id))
      .where(eq(membersTable.userID, ctx.session.userID))
  }),

  listOrganizations: t.procedure.use(({ ctx, next }) => {
    if (!ctx?.session || !ctx?.session?.userID) {
      throw new TRPCError({ code: 'UNAUTHORIZED' })
    }
    return next({ ctx })
  }).query(async ({ ctx }) => {
    return await db.select({ id: organizationsTable.id, name: organizationsTable.name, imageURL: organizationsTable.imageURL }).from(membersTable).innerJoin(organizationsTable, eq(membersTable.organizationID, organizationsTable.id)).where(eq(membersTable.userID, ctx.session.userID))
  }),

  userPermissions: t.procedure.use(({ ctx, next }) => {
    if (!ctx?.session || !ctx?.session?.userID) {
      throw new TRPCError({ code: 'UNAUTHORIZED' })
    }
    return next({ ctx })
  }).input(z.object({ organizationID: z.string() })).query(async ({ ctx, input }) => {
    const rows = await db
      .select({ permissionName: permissionsTable.name })
      .from(membersTable)
      .innerJoin(rolesTable, eq(membersTable.roleID, rolesTable.id))
      .innerJoin(rolePermissionsTable, eq(rolesTable.id, rolePermissionsTable.roleID))
      .innerJoin(permissionsTable, eq(rolePermissionsTable.permissionID, permissionsTable.id))
      .where(
        and(
          eq(membersTable.userID, ctx.session.userID),
          eq(membersTable.organizationID, BigInt(input.organizationID))
        )
      )

    return Array.from(new Set(rows.map(row => row.permissionName)))
  }),
  getActiveOrganization: t.procedure.use(({ ctx, next }) => {
    if (!ctx?.session || !ctx?.session?.userID) {
      throw new TRPCError({ code: 'UNAUTHORIZED' })
    }
    return next({ ctx })
  }).input(z.object({ organizationID: z.string() })).query(async ({ ctx, input }) => {
    const rows = await db
      .select({
        roleId: rolesTable.id,
        roleName: rolesTable.name,
        orgId: organizationsTable.id,
        orgName: organizationsTable.name,
        orgImage: organizationsTable.imageURL,
        permissionName: permissionsTable.name,
      })
      .from(membersTable)
      .innerJoin(organizationsTable, eq(membersTable.organizationID, organizationsTable.id))
      .innerJoin(rolesTable, eq(membersTable.roleID, rolesTable.id))
      .innerJoin(rolePermissionsTable, eq(rolesTable.id, rolePermissionsTable.roleID))
      .innerJoin(permissionsTable, eq(rolePermissionsTable.permissionID, permissionsTable.id))
      .where(
        and(
          eq(membersTable.userID, ctx.session.userID),
          eq(membersTable.organizationID, BigInt(input.organizationID))
        )
      )

    const aggregated = rows.reduce((acc, row) => {
      const key = `${row.roleId}$${row.orgId}`
      if (!acc[key]) {
        acc[key] = {
          id: row.orgId,
          name: row.orgName,
          imageURL: row.orgImage,
          role: {
            id: row.roleId,
            name: row.roleName,
            permissions: []
          },
        }
      }
      if (!acc[key].role.permissions.includes(row.permissionName)) {
        acc[key].role.permissions.push(row.permissionName)
      }
      return acc
    }, {} as Record<string, {
      id: bigint; name: string; imageURL: string | null; role: { id: bigint; name: string; permissions: string[] },
    }>)
    return Object.values(aggregated)[0]
  })
})