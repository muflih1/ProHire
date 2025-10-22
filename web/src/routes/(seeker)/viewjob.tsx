import JobListingBadges from '@/components/job-listing-badges';
import RichTextEditor from '@/components/rich-text-editor';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/providers/auth-provider';
import { useTRPC } from '@/utils/trpc';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useSuspenseQuery } from '@tanstack/react-query';
import { DateTime } from 'luxon';
import { Suspense } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { useForm } from 'react-hook-form';
import Markdown from 'react-markdown';
import { Link, useLocation, useParams } from 'react-router';
import { toast } from 'sonner';
import { z } from 'zod';

export default function ViewJob() {
  return (
    <Suspense fallback='Loading...'>
      <ErrorBoundary fallback='Failed to fetch job listing.'>
        <ViewJobImpl />
      </ErrorBoundary>
    </Suspense>
  );
}

function ViewJobImpl() {
  const { jobListingID } = useParams<{ jobListingID: string }>();
  const trpc = useTRPC();
  const { data } = useSuspenseQuery(
    trpc.viewJobListing.queryOptions({ jobListingID: jobListingID! })
  );

  return (
    <div className='pb-10'>
      <div className='sticky top-0 bg-white'>
        <h2 className='text-2xl font-bold mb-2 pt-2'>{data.title}</h2>
        <div className='flex gap-4 mb-2'>
          <div className='shrink-0 basis-10'>
            <Avatar className='size-10 select-none'>
              <AvatarImage
                src={data.organization.imageURL ?? undefined}
                alt='Organization avatar'
              />
              <AvatarFallback className='font-medium'>
                {data.organization.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
          </div>
          <div className='grow shrink flex items-center'>
            <p className='text-lg font-medium'>{data.organization.name}</p>
          </div>
        </div>
        {data.streetAddress && <p className='mb-2'>{data.streetAddress}</p>}
        <div className='flex flex-wrap gap-1 mb-4'>
          <JobListingBadges jobListing={data as any} />
        </div>
        <div className='flex'>
          <ApplyButton jobListingID={data.id} />
        </div>
        <Separator className='my-4' />
      </div>
      <div>
        <h3 className='text-xl font-bold mb-2'>Full job description</h3>
        <div className='prose'>
          <Markdown>{data.description}</Markdown>
        </div>
      </div>
    </div>
  );
}

type ApplyButtonProps = { jobListingID: bigint };

function ApplyButton(props: ApplyButtonProps) {
  const user = useAuth();

  if (user == null) {
    return (
      <Popover>
        <PopoverTrigger asChild>
          <Button>Apply</Button>
        </PopoverTrigger>
        <PopoverContent>
          You need to create an account before applying for a job.
          <div className='grid mt-2'>
            <Button asChild>
              <Link to={'/login'}>Sign in</Link>
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <Suspense fallback='Loading...'>
      <ErrorBoundary fallback='Failed to fetch application status'>
        <EnsureNotAppliedGuard {...props} />
      </ErrorBoundary>
    </Suspense>
  );
}

function EnsureNotAppliedGuard({ jobListingID }: ApplyButtonProps) {
  const trpc = useTRPC();
  const { data } = useSuspenseQuery(
    trpc.getJobListingApplication.queryOptions({
      jobListingID: jobListingID.toString(),
    })
  );

  if (data != null) {
    return (
      <Button disabled>
        You applied for this job{' '}
        {DateTime.fromJSDate(data.createdAt).toRelative()}
      </Button>
    );
  }

  return (
    <Suspense fallback='Loading...'>
      <ErrorBoundary fallback='Failed to fetch resume status'>
        <EnsureResumeGuard jobListingID={jobListingID} />
      </ErrorBoundary>
    </Suspense>
  );
}

function EnsureResumeGuard(props: ApplyButtonProps) {
  const location = useLocation();
  const trpc = useTRPC();
  const { data } = useSuspenseQuery(trpc.getUserResume.queryOptions());

  if (data == null) {
    return (
      <Popover>
        <PopoverTrigger asChild>
          <Button>Apply</Button>
        </PopoverTrigger>
        <PopoverContent>
          You need to upload your resume before applying for a job
          <div className='grid mt-2'>
            <Button asChild>
              <Link
                to={'/profile'}
                state={{ from: location.pathname }}
              >
                Upload resume
              </Link>
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    );
  }

  return <ApplyButtonImpl {...props} />;
}

function ApplyButtonImpl(props: ApplyButtonProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Apply</Button>
      </DialogTrigger>
      <DialogContent className='md:max-w-3xl max-[calc(100%_-_2rem)] overflow-hidden flex flex-col'>
        <DialogHeader>
          <DialogTitle>Application</DialogTitle>
          <DialogDescription>
            Applying for a job cannot be undone and is somthing you can only do
            once per job listing.
          </DialogDescription>
        </DialogHeader>
        <div className='flex-1 overflow-y'>
          <NewJobListingApplicationForm {...props} />
        </div>
      </DialogContent>
    </Dialog>
  );
}

const schema = z.object({
  coverLetter: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

function NewJobListingApplicationForm({ jobListingID }: ApplyButtonProps) {
  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      coverLetter: '',
    },
  });
  const trpc = useTRPC();
  const { mutate, isPending } = useMutation(
    trpc.createJobListingApplication.mutationOptions({
      onError: () => {
        toast.error("You don't have permission to apply for this job listing.");
      },
    })
  );

  function submit(data: FormData) {
    mutate({ ...data, jobListingID: jobListingID.toString() });
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(submit)}
        className='space-y-4'
        noValidate
      >
        <FormField
          name='coverLetter'
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cover letter</FormLabel>
              <FormControl>
                <RichTextEditor {...(field as any)} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type='submit' className='w-full' disabled={isPending}>
          Apply
        </Button>
      </form>
    </Form>
  );
}
