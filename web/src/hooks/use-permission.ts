import { useActiveOrganization_DO_NOT_USE_INSTEAD_USE_COOKIE } from "@/providers/active-organization-provider";
import { useMemo } from "react";

export default function usePermission() {
  const organization = useActiveOrganization_DO_NOT_USE_INSTEAD_USE_COOKIE()

  return useMemo(() =>
    (permission: string) => organization.role.permissions.includes(permission),
    [organization.role.permissions]
  );
}