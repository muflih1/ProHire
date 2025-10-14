import { Outlet } from 'react-router';
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
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowRightIcon, PlusIcon } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Spinner } from './ui/spinner';
import { z } from 'zod';
import { axios } from '@/lib/axios';
import { toast } from 'sonner';
import { MultiPageView } from './multi-page-view';

export default function ProtectedEmployerRouteGuard() {
  const orgID = useCurrentOrganizationID().read();

  if (orgID == null || orgID === '0') {
    return <OrganizationSelect />;
  }

  return <Outlet />;
}

function OrganizationSelect() {
  const trpc = useTRPC();
  const query = useQuery(trpc.listOrganizations.queryOptions());

  if (query.isLoading) {
    return 'loading...';
  }

  if (query.isError) {
    return query.error.message;
  }

  if (query.data?.length === 0) {
    return <CreateOrganizationForm />;
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
                <ChooseOrganization organizations={query.data!} />
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

function ChooseOrganization({ organizations }: { organizations: any[] }) {
  const mutation = useMutation({
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
      disabled={mutation.isPending}
      onClick={() => mutation.mutate(org.id.toString())}
      size={'lg'}
      className='justify-between group'
    >
      {mutation.isPending ? (
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
  const queryClient = useQueryClient();
  const mutation = useMutation(
    trpc.createOrganization.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.listOrganizations.queryKey(),
        });
        if (onReturn) {
          onReturn();
        }
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
            onSubmit={form.handleSubmit(data => mutation.mutate(data))}
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
