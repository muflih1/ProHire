import { db } from '../db/index.js'
import { membersTable, organizationsTable, rolesTable, rolePermissionsTable, permissionsTable } from '../db/schema.js'
import { eq, and } from 'drizzle-orm'

export async function getUserPermissions(userID: bigint, organizationID: bigint): Promise<string[]> {
  const rows = await db
    .select({
      roleId: rolesTable.id,
      orgId: organizationsTable.id,
      permissionName: permissionsTable.name,
    })
    .from(membersTable)
    .innerJoin(organizationsTable, eq(membersTable.organizationID, organizationsTable.id))
    .innerJoin(rolesTable, eq(membersTable.roleID, rolesTable.id))
    .innerJoin(rolePermissionsTable, eq(rolesTable.id, rolePermissionsTable.roleID))
    .innerJoin(permissionsTable, eq(rolePermissionsTable.permissionID, permissionsTable.id))
    .where(
      and(
        eq(membersTable.userID, userID),
        eq(membersTable.organizationID, organizationID)
      )
    )

  const aggregated = rows.reduce((acc, row) => {
    const key = `${row.roleId}$${row.orgId}`
    if (!acc[key]) acc[key] = []
    if (!acc[key].includes(row.permissionName)) acc[key].push(row.permissionName)
    return acc
  }, {} as Record<string, string[]>)

  const permissions = Object.values(aggregated)[0] ?? []
  return permissions
}
