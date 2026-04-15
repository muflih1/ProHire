import {Avatar, AvatarFallback, AvatarImage} from '@/components/ui/avatar';
import {Button} from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {Flexbox} from '@/components/ui/flexbox';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {Input} from '@/components/ui/input';
import {goForceFullPageRedirectTo} from '@/utils/go-force-full-page-redirect-to';
import {useTRPC} from '@/utils/trpc';
import {zodResolver} from '@hookform/resolvers/zod';
import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from '@tanstack/react-query';
import {createFileRoute} from '@tanstack/react-router';
import {ArrowRightIcon, Building2Icon, PlusCircleIcon} from 'lucide-react';
import {useState} from 'react';
import {useForm} from 'react-hook-form';
import {z} from 'zod';

export const Route = createFileRoute('/organization-switcher')({
  beforeLoad: ({context}) => {
    if (!context.session) {
      throw Route.redirect({to: '/sign-in', replace: true});
    }
  },
  component: OrganizationSwitcher,
  loader: ({context}) => {
    void context.queryClient.prefetchQuery(
      context.trpc.organizations.list.queryOptions(),
    );
  },
});

function OrganizationSwitcher() {
  const [createOrganizationDialogOpen, setCreateOrganizationDialogOpen] =
    useState(false);
  const trpc = useTRPC();
  const {data} = useSuspenseQuery(trpc.organizations.list.queryOptions());
  const {mutate: touchSessionMutationSync} = useMutation(
    trpc.sessions.touch.mutationOptions(),
  );

  return (
    <Flexbox
      direction='column'
      alignItems='center'
      justifyContent='center'
      className='h-screen'
    >
      <Card className='max-w-100 w-full'>
        <CardHeader className='place-items-center'>
          <CardTitle className='text-lg font-bold'>
            Choose an organization
          </CardTitle>
          <CardDescription>to continue to Job Board</CardDescription>
        </CardHeader>
        <CardContent className='-mx-4'>
          {data.map(org => (
            <Button
              key={org.id}
              variant='ghost'
              className='rounded-none w-full flex items-center justify-start border-none px-5 py-4 h-[unset] active:translate-y-0 not-first:border-t not-first:border-t-border gap-3 group'
              onClick={() =>
                touchSessionMutationSync(
                  {
                    activeOrganizationID: org.id,
                  },
                  {
                    onSuccess: () => {
                      goForceFullPageRedirectTo('/employer');
                    },
                  },
                )
              }
            >
              <Avatar className='size-9'>
                <AvatarImage src={org.imageURL ?? undefined} alt={org.name} />
                <AvatarFallback className='bg-linear-to-b from-blue-700 to-purple-600 text-white'>
                  <Building2Icon />
                </AvatarFallback>
              </Avatar>
              {org.name}
              <ArrowRightIcon className='text-muted-foreground ml-auto opacity-0 shrink-0 group-hover:opacity-100' />
            </Button>
          ))}
          <Button
            variant='ghost'
            className='rounded-none w-full flex items-center justify-start border-none p-5 h-[unset] active:translate-y-0 not-first:border-t not-first:border-t-border gap-3'
            onClick={() => setCreateOrganizationDialogOpen(true)}
          >
            <PlusCircleIcon size={24} />
            Create Organization
          </Button>
        </CardContent>
      </Card>
      <CreateOrganizationDialog
        open={createOrganizationDialogOpen}
        onOpenChange={setCreateOrganizationDialogOpen}
      />
    </Flexbox>
  );
}

const schema = z.object({
  name: z.string().min(3),
});

type FormData = z.infer<typeof schema>;

function CreateOrganizationDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}) {
  const form = useForm<FormData>({
    defaultValues: {
      name: '',
    },
    resolver: zodResolver(schema),
  });
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const {mutate: createOrganizationMutationSync} = useMutation(
    trpc.organizations.create.mutationOptions(),
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className='text-lg'>Create Organization</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(data => {
              createOrganizationMutationSync(data, {
                onSuccess: data => {
                  queryClient.setQueryData(
                    trpc.organizations.list.queryKey(),
                    list => {
                      const newOrg = {
                        id: data.organization.id,
                        name: data.organization.name,
                        imageURL: data.organization.profileImageStorageKey,
                      };
                      if (!list) return [newOrg];

                      return [...list, newOrg];
                    },
                  );
                  onOpenChange(false);
                },
              });
            })}
          >
            <FormField
              control={form.control}
              name='name'
              render={({field}) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input type='text' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className='flex items-center sm:justify-between mt-4'>
              <DialogClose
                render={
                  <Button
                    type='button'
                    variant='secondary'
                    className='grow shrink'
                  />
                }
              >
                Cancel
              </DialogClose>
              <Button type='submit' className='grow shrink'>
                Create
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
