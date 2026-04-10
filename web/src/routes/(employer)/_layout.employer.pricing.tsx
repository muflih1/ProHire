import {useTRPC} from '@/utils/trpc';
import {Button} from '@/components/ui/button';
import {useMutation, useSuspenseQuery} from '@tanstack/react-query';
import {createFileRoute} from '@tanstack/react-router';
import {CheckIcon} from 'lucide-react';
import {Switch} from '@/components/ui/switch';

export const Route = createFileRoute('/(employer)/_layout/employer/pricing')({
  component: PricingRoute,
  loader: ({context}) => {
    void context.queryClient.prefetchQuery(
      context.trpc.billings.listPlans.queryOptions(),
    );
    void context.queryClient.prefetchQuery(
      context.trpc.billings.listSubscriptions.queryOptions(),
    );
  },
});

function PricingRoute() {
  const trpc = useTRPC();

  const {data: plans} = useSuspenseQuery(
    trpc.billings.listPlans.queryOptions(),
  );

  const {data: subscriptions} = useSuspenseQuery(
    trpc.billings.listSubscriptions.queryOptions(),
  );

  const {mutate: subscribeSync} = useMutation(
    trpc.billings.subscribe.mutationOptions(),
  );

  return (
    <div className='grid w-full min-w-0 items-stretch [--grid-min-size:20rem] [--grid-max-columns:999] [--grid-gap:1rem] [--max-column-width:calc(100%/var(--grid-max-columns)-var(--grid-gap))] [--column-width:max(var(--max-column-width),min(var(--grid-min-size),100%))] grid-cols-[repeat(auto-fit,minmax(var(--column-width),1fr))] grid-rows-[auto_1fr] gap-(--grid-gap) p-4'>
      {plans.map(plan => (
        <div
          className='grid gap-0 grid-rows-subgrid row-[span_5] rounded-xl overflow-hidden bg-card shadow-sm border'
          key={plan.id}
        >
          <div className='grid w-full gap-1 grid-rows-subgrid row-[span_3] p-4 items-start bg-secondary'>
            <h2 className='text-lg font-bold'>{plan.name}</h2>
            <div className='flex items-center gap-0.5 mt-0.5'>
              <p className='text-2xl font-bold text-primary'>
                {formatter.format(plan.amount / 100)}
              </p>
              <p className='[&::before]:[content:"/"] before:ml-px text-xs text-muted-foreground font-medium'>
                month
              </p>
            </div>
            <div className='mt-1'>
              <label className='flex flex-row items-center justify-start'>
                <Switch />
                <span className='text-xs font-medium pl-2 cursor-pointer leading-normal select-none tracking-normal text-muted-foreground'>
                  Billied annually
                </span>
              </label>
            </div>
            {/* {plan.isActive && (
              <div className='shrink-0'>
                <Badge>Active</Badge>
              </div>
            )} */}
          </div>
          <div className='grid grid-rows-subgrid row-[span_2] gap-0'>
            <div className='p-4 flex flex-col flex-1 border-t border-t-border'>
              <ul className='flex flex-col items-stretch justify-start gap-y-3'>
                {plan.features.map(feature => (
                  <li key={feature.key} className='flex items-center gap-2'>
                    <span className='size-5 rounded-full bg-green-100 inline-flex items-center justify-center overflow-hidden'>
                      <CheckIcon size={12} className='text-green-800' />
                    </span>
                    <span className='block text-sm font-medium text-primary max-w-full min-w-0 leading-snug tracking-normal'>
                      {feature.name}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <div className='mt-auto border-t border-t-border'>
              <div className='grid p-4 self-end bg-secondary'>
                <Button
                  onClick={() =>
                    subscribeSync(
                      {planID: plan.id, planPeriod: 'annual'},
                      {
                        onSuccess: data => {
                          window.location = data.url as unknown as string &
                            Location;
                        },
                      },
                    )
                  }
                >
                  Subscribe
                </Button>
                {/* {!plan.isActive && <Button>{button}</Button>} */}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

const formatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 0,
});
