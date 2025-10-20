import { useCurrentOrganizationID } from '@/providers/current-organization-id-provider';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from './ui/form';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from './ui/card';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTRPC } from '@/utils/trpc';
import { useMutation, useSuspenseQuery } from '@tanstack/react-query';
import { ArrowRightIcon, PlusIcon } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Spinner } from './ui/spinner';
import { z } from 'zod';
import { axios } from '@/lib/axios';
import { toast } from 'sonner';
import { MultiPageView } from './multi-page-view';
import React, { Suspense } from 'react';
import { Skeleton } from './ui/skeleton';
import { ErrorBoundary } from 'react-error-boundary';

export default function ProtectedEmployerRouteGuard({
  children,
}: React.PropsWithChildren) {
  const orgID = useCurrentOrganizationID().read();

  if (orgID == null || orgID === '0') {
    return <OrganizationSelect />;
  }

  return children;
}

function OrganizationSelect() {
  return (
    <Suspense fallback={<OrganizationSelectFallback />}>
      <ErrorBoundary fallback='Failed to fetch organizations.'>
        <OrganizationSelectImpl />
      </ErrorBoundary>
    </Suspense>
  );
}

function OrganizationSelectFallback() {
  return (
    <div className='flex min-h-screen flex-col items-center justify-center'>
      <Card className='w-[500px]'>
        <CardHeader>
          <CardTitle className='flex justify-center'>
            <Skeleton className='w-64 h-7' />
          </CardTitle>
          <CardDescription className='flex justify-center'>
            <Skeleton className='w-56 h-4' />
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-2'>
          {Array.from(new Array(2), (_, i) => i + 1).map((_, i) => (
            <div className='flex items-center space-x-4' key={i}>
              <Skeleton className='size-11 shrink-0 rounded-full' />
              <Skeleton className='h-11 grow shrink' />
            </div>
          ))}
        </CardContent>
        <CardFooter>
          <Skeleton className='h-9 w-full' />
        </CardFooter>
      </Card>
    </div>
  );
}

function OrganizationSelectImpl() {
  const trpc = useTRPC();
  const { data } = useSuspenseQuery(trpc.listOrganizations.queryOptions());

  if (data.length === 0) {
    return (
      <div className='min-h-screen flex flex-col items-center justify-center'>
        <CreateOrganizationForm />;
      </div>
    );
  }

  return (
    <div className='min-h-screen flex flex-col items-center justify-center'>
      <MultiPageView>
        {pushPage => (
          <Card className='w-[500px]'>
            <CardHeader>
              <CardTitle className='text-2xl font-bold text-center'>
                Choose an organization
              </CardTitle>
              <CardDescription className='text-center'>
                to continue to Job Portal
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className='flex flex-col gap-4'>
                <ChooseOrganization organizations={data} />
              </div>
            </CardContent>
            <CardFooter>
              <Button
                type='button'
                variant={'ghost'}
                className='w-full'
                onClick={() =>
                  pushPage(props =>
                    CreateOrganizationForm({ ...props, withBackButton: true })
                  )
                }
              >
                <PlusIcon /> Create organization
              </Button>
            </CardFooter>
          </Card>
        )}
      </MultiPageView>
    </div>
  );
}

function ChooseOrganization({
  organizations,
}: {
  organizations: Array<{
    id: bigint;
    name: string;
    imageURL: string | null;
  }>;
}) {
  const { mutate, isPending } = useMutation({
    mutationKey: ['choose-organization'],
    mutationFn: async (newOrgID: string) => {
      const res = await axios.post('/organizations/select', {
        orgID: newOrgID,
      });
      return res.data;
    },
    onError: (error: any) => {
      toast.error(error.response.data.message);
    },
    onSuccess: () => {
      window.location.reload();
    },
  });

  return organizations.map(org => (
    <Button
      variant={'ghost'}
      key={org.id}
      disabled={isPending}
      onClick={() => mutate(org.id.toString())}
      size={'lg'}
      className='justify-between group'
    >
      {isPending ? (
        <Spinner />
      ) : (
        <>
          <div className='flex items-center gap-4'>
            <Avatar>
              <AvatarImage src={org.imageURL ?? undefined} alt={org.name} />
              <AvatarFallback>{org.name[0].toUpperCase()}</AvatarFallback>
            </Avatar>{' '}
            <span>{org.name}</span>
          </div>
          <ArrowRightIcon className='opacity-0 group-hover:opacity-100' />
        </>
      )}
    </Button>
  ));
}

const schema = z.object({
  name: z.string().nonempty(),
});

let id = 0;

function CreateOrganizationForm({
  onReturn,
  withBackButton = false,
}: {
  withBackButton?: boolean;
  onReturn?: (options?: any) => void;
}) {
  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: { name: '' },
  });
  const trpc = useTRPC();
  const { mutate } = useMutation(
    trpc.createOrganization.mutationOptions({
      onSuccess: () => {
        if (onReturn) {
          onReturn();
        }
      },
      onMutate: async (newOrg, context) => {
        await context.client.cancelQueries({
          queryKey: trpc.listOrganizations.queryKey(),
        });
        const previous = context.client.getQueryData(
          trpc.listOrganizations.queryKey()
        );
        context.client.setQueryData(trpc.listOrganizations.queryKey(), prev => [
          ...(prev || []),
          { ...newOrg, id: BigInt(++id), imageURL: null },
        ]);
        return { previous };
      },
    })
  );

  return (
    <Card className='w-[500px]'>
      <CardHeader>
        <CardTitle className='text-center text-2xl font-bold'>
          Create organization
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(data => mutate(data))}
            noValidate
            className='space-y-6'
          >
            <FormField
              name='name'
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className='flex justify-end gap-2'>
              {withBackButton ? (
                <Button variant={'secondary'} onClick={onReturn}>
                  Cancel
                </Button>
              ) : null}
              <Button type='submit' className='px-10'>
                Create
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
