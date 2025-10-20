import { useActiveOrganization_DO_NOT_USE_INSTEAD_USE_COOKIE } from "@/providers/active-organization-provider";
import { useMemo } from "react";

export default function useHasFeature() {
  const organization = useActiveOrganization_DO_NOT_USE_INSTEAD_USE_COOKIE()

  return useMemo(() => (feature: string): boolean => organization.plan.features.includes(feature), [organization.plan.features])
}