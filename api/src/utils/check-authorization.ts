export type OrganizationRoleKey =
  | 'org:owner'
  | 'org:admin'
  | 'org:applicant_manager'
  | 'org:job_listing_manager'
  | 'org:viewer';

export type OrganizationPermissionKey =
  | 'org:profile:manage'
  | 'org:profile:read'
  | 'org:profile:delete'
  | 'org:billing:read'
  | 'org:billing:manage'
  | 'org:memberships:read'
  | 'org:memberships:write'
  | 'org:memberships:delete'
  | 'org:memberships:invite'
  | 'org:job_listing:read'
  | 'org:job_listing:write'
  | 'org:job_listing:delete'
  | 'org:job_listing:update'
  | 'org:job_listing:change_status'
  | 'org:job_listing_application:read'
  | 'org:job_listing_application:change_status'
  | 'org:job_listing_application:change_rating';

export type OrganizationFeatureKey =
  | 'job_listings'
  | 'job_listing_applications'
  | 'create_job_listings'
  | 'manage_applicant_workflow'
  | 'post_1_job_listing'
  | 'post_3_job_listings'
  | '1_featured_job_listing'
  | 'post_unlimited_job_listings'
  | 'unlimited_featured_job_listings';

export type OrganizationPlanKey = 'free_org' | 'bais' | 'growth' | 'enterprise';

export type CheckAuthorizationParams =
  | {
      role: OrganizationRoleKey;
      permission?: never;
      feature?: never;
      plan?: never;
    }
  | {
      role?: never;
      permission: OrganizationPermissionKey;
      feature?: never;
      plan?: never;
    }
  | {
      role?: never;
      permission?: never;
      feature: OrganizationFeatureKey;
      plan?: never;
    }
  | {
      role?: never;
      permission?: never;
      feature?: never;
      plan?: OrganizationPlanKey;
    }
  | {
      role?: never;
      permission?: never;
      feature?: never;
      plan?: never;
    };

interface CurrentOrganizationRsource {
  id: bigint;
  name: string;
  image: {
    uri: string | null;
  };
  role: string;
  roleName: string;
  permissions: string[];
  plan: string;
  planName: string;
  features: string[];
  createdAt: Date;
  updatedAt: Date;
}

export function checkAuthorization(
  params: CheckAuthorizationParams,
  organization: CurrentOrganizationRsource,
) {
  if (params.role) return params.role === organization.role;
  if (params.permission)
    return organization.permissions.includes(params.permission);
  if (params.feature) return organization.features.includes(params.feature);
  if (params.plan) return params.plan === organization.plan;
  return false;
}
