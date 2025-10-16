import { useActiveOrganization } from "@/providers/active-organization-provider";
import { useMemo } from "react";

export default function usePermission() {
  const organization = useActiveOrganization()

  return useMemo(() =>
    (permission: string) => organization.role.permissions.includes(permission),
    [organization.role.permissions]
  );
}