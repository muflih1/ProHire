import 'dotenv/config';
import {db} from '../db/index.js';
import {
  permissionsTable,
  rolePermissionsTable,
  rolesTable,
} from '../db/schema.js';

const RBAC = {
  'org:owner': {
    name: 'Owner',
    description: 'Owner of the organization',
    permissions: [
      'org:profile:manage',
      'org:profile:read',
      'org:profile:delete',
      'org:billing:read',
      'org:billing:manage',
      'org:memberships:read',
      'org:memberships:write',
      'org:memberships:delete',
      'org:memberships:invite',
      'org:job_listing:read',
      'org:job_listing:write',
      'org:job_listing:delete',
      'org:job_listing:update',
      'org:job_listing:change_status',
      'org:job_listing_application:read',
      'org:job_listing_application:change_status',
      'org:job_listing_application:change_rating',
    ] as const,
  },
  'org:admin': {
    name: 'Admin',
    description: 'Role with elevated permissions in the organization.',
    permissions: [
      'org:profile:manage',
      'org:profile:read',
      'org:billing:read',
      'org:billing:manage',
      'org:memberships:read',
      'org:memberships:write',
      'org:memberships:delete',
      'org:memberships:invite',
      'org:job_listing:read',
      'org:job_listing:write',
      'org:job_listing:delete',
      'org:job_listing:update',
      'org:job_listing:change_status',
      'org:job_listing_application:read',
      'org:job_listing_application:change_status',
      'org:job_listing_application:change_rating',
    ] as const,
  },
  'org:applicant_manager': {
    name: 'Applicant Manager',
    description:
      'A user who can approve/deny applicants and update applicant details for all job listings.',
    permissions: [
      'org:profile:read',
      'org:billing:read',
      'org:memberships:read',
      'org:job_listing_application:read',
      'org:job_listing_application:change_status',
      'org:job_listing_application:change_rating',
    ] as const,
  },
  'org:job_listing_manager': {
    name: 'Job Listing Manager',
    description:
      'A user who can create, update, delete and update the status of job listing.',
    permissions: [
      'org:profile:read',
      'org:billing:read',
      'org:memberships:read',
      'org:job_listing:read',
      'org:job_listing:write',
      'org:job_listing:delete',
      'org:job_listing:update',
      'org:job_listing:change_status',
    ] as const,
  },
  'org:viewer': {
    name: 'Viewer',
    description: 'Role with non-privileged permissions in the organization.',
    permissions: [
      'org:profile:read',
      'org:billing:read',
      'org:memberships:read',
      'org:job_listing:read',
      'org:job_listing_application:read',
    ] as const,
  },
};

type RBACKKey = keyof typeof RBAC;

const roles = Object.keys(RBAC).map(key => ({
  key,
  name: RBAC[key as RBACKKey].name,
  description: RBAC[key as RBACKKey].description,
}));

const rolePermissions = Object.fromEntries(
  Object.keys(RBAC).map(key => [key, RBAC[key as RBACKKey].permissions]),
);

const permissionKeys = [
  ...new Set(
    Object.values(RBAC)
      .map(v => v.permissions)
      .flat(),
  ),
];

export type Permission = typeof RBAC[keyof typeof RBAC]['permissions'][number]

async function seedRBAC() {
  console.log('SEEDING RBAC...');
  await db.transaction(async tx => {
    await tx.insert(rolesTable).values(roles).onConflictDoNothing();
    await tx
      .insert(permissionsTable)
      .values(permissionKeys.map(key => ({key})));

    const roleRows = await tx.select().from(rolesTable);
    const permissionRows = await tx.select().from(permissionsTable);

    const roleMap = new Map(roleRows.map(r => [r.key, r.id]));
    const permissionMap = new Map(permissionRows.map(p => [p.key, p]));

    const relations: {roleID: bigint; permissionID: bigint}[] = [];

    for (const [roleKey, perms] of Object.entries(rolePermissions)) {
      const roleId = roleMap.get(roleKey);
      if (!roleId) continue;

      for (const permKey of perms) {
        const perm = permissionMap.get(permKey);
        if (!perm) continue;

        relations.push({
          roleID: roleId,
          permissionID: perm.id,
        });
      }
    }

    await tx.insert(rolePermissionsTable).values(relations);
  });
  console.log('RBAC SEEDED SUCCESSFULLY');
}

seedRBAC()
  .then(() => {
    process.exit(0);
  })
  .catch(err => {
    console.log('SEEDING RBAC OCCURED ERROR:', err);
    process.exit(1);
  });
