import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useActiveOrganization_DO_NOT_USE_INSTEAD_USE_COOKIE } from '@/providers/active-organization-provider';
import { useTRPC } from '@/utils/trpc';
import { useSuspenseQuery } from '@tanstack/react-query';
import { CheckIcon } from 'lucide-react';
import { Suspense } from 'react';
import { ErrorBoundary } from 'react-error-boundary';

export default function Pricing() {
  return (
    <Suspense fallback='Loading...'>
      <ErrorBoundary fallback='Failed to fetch pricing'>
        <PricingImpl />
      </ErrorBoundary>
    </Suspense>
  );
}

const formatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 0,
});

function PricingImpl() {
  const organization = useActiveOrganization_DO_NOT_USE_INSTEAD_USE_COOKIE();
  const trpc = useTRPC();
  const { data: plans } = useSuspenseQuery(
    trpc.getOrganizationPlansList.queryOptions({
      organizationID: organization.id.toString(),
    })
  );

  const hasAnySubscription = plans.some(p => p.isActive === true);

  const button = hasAnySubscription ? 'Switch to this plan' : 'Subscribe'

  return (
    <div className='grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 max-w-6xl mx-auto mt-6'>
      {plans.map(plan => (
        <div
          className='rounded-xl overflow-hidden bg-white shadow-sm flex flex-col border'
          key={plan.id}
        >
          <div className='flex my-4 px-4 items-start'>
            <div className='flex flex-col gap-1 grow shrink'>
              <h2 className='text-2xl font-bold'>{plan.name}</h2>
              <div className='flex items-center gap-.5 text-muted-foreground text-sm'>
                <span className='text-3xl font-bold text-primary'>
                  {formatter.format(plan.pricePerMonthInPaise / 100)}
                </span>{' '}
                <span> / month</span>
              </div>
            </div>
            {plan.isActive && (
              <div className='shrink-0'>
                <Badge>Active</Badge>
              </div>
            )}
          </div>
          <div className='px-4'>
            <div className='space-y-1'>
              {plan.features.map(feature => (
                <div key={feature.id} className='flex items-center gap-2'>
                  <CheckIcon className='text-muted-foreground size-5' />
                  <span className='block text-base font-medium text-primary max-w-full min-w-0'>
                    {feature.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div className='mt-auto'>
            <div className='grid my-4 self-end px-4'>
              {!plan.isActive && <Button>{button}</Button>}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
