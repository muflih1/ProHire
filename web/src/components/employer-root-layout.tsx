import { CurrentOrganizationIDProvider } from '@/providers/current-organization-id-provider';
import ProtectedEmployerRouteGuard from './protected-employer-route-guard';
import { ActiveOrganizationProvider } from '@/providers/active-organization-provider';
import { Outlet } from 'react-router';

export default function EmployerRootLayout() {
  return (
    <CurrentOrganizationIDProvider readonly>
      <ProtectedEmployerRouteGuard>
        <ActiveOrganizationProvider>
          <Outlet />
        </ActiveOrganizationProvider>
      </ProtectedEmployerRouteGuard>
    </CurrentOrganizationIDProvider>
  );
}
