import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from './ui/form';
import { Input } from './ui/input';
import { Button } from './ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Spinner } from './ui/spinner';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTRPC } from '@/utils/trpc';
import { useActiveOrganization_DO_NOT_USE_INSTEAD_USE_COOKIE } from '@/providers/active-organization-provider';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import RichTextEditor from './rich-text-editor';

const schema = z
  .object({
    title: z.string().nonempty(),
    description: z.string().nonempty(),
    experienceLevel: z.enum(['JUNIOR', 'MID_LEVEL', 'SENIOR']),
    locationRequirement: z.enum(['IN_OFFICE', 'HYBRID', 'REMOTE']),
    streetAddress: z.string(),
    type: z.enum(['INTERNSHIP', 'PART_TIME', 'FULL_TIME']),
    wage: z.number().int().positive().min(1).nullable(),
    wageInterval: z.enum(['HOURLY', 'YEARLY']).nullable(),
    openings: z.number().int().min(1).positive(),
  })
  .refine(
    data => data.locationRequirement === 'REMOTE' || data.streetAddress != null,
    {
      error: 'Street address required for non-remote listing',
      path: ['streetAddress'],
    }
  );

type FormData = z.infer<typeof schema>;

const wageIntervals = [
  { value: 'HOURLY', label: 'Hour' },
  { value: 'YEARLY', label: 'Year' },
];

const locationTypes = [
  { value: 'IN_OFFICE', label: 'In office' },
  { value: 'HYBRID', label: 'Hybrid' },
  { value: 'REMOTE', label: 'Remote' },
];

const jobTypes = [
  { value: 'INTERNSHIP', label: 'Internship' },
  { value: 'PART_TIME', label: 'Part-time' },
  { value: 'FULL_TIME', label: 'Full-time' },
];

const experienceLevels = [
  { value: 'JUNIOR', label: 'Junior' },
  { value: 'MID_LEVEL', label: 'Mid level' },
  { value: 'SENIOR', label: 'Senior' },
];

export default function JobListingForm({ jobListing }: { jobListing?: any }) {
  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: jobListing
      ? {
          ...jobListing,
          wage: jobListing.wageInPaise / 100,
          id: undefined,
        }
      : {
          title: '',
          description: '',
          streetAddress: '',
          wage: null,
          wageInterval: 'YEARLY',
          experienceLevel: 'JUNIOR',
          type: 'FULL_TIME',
          locationRequirement: 'IN_OFFICE',
          openings: 1,
        },
  });
  const navigate = useNavigate();
  const organization = useActiveOrganization_DO_NOT_USE_INSTEAD_USE_COOKIE();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const action =
    jobListing != null ? trpc.updateJobListing : trpc.createJobListing;
  const { mutate, isPending } = useMutation(
    action.mutationOptions({
      onSuccess: jobListing => {
        if (jobListing != null) {
          queryClient.invalidateQueries({
            queryKey: trpc.getJobListingByID.pathKey(),
          });
        }
        navigate(`/employers/job-listings/${jobListing.id}`);
      },
      onError: err => {
        toast.error(err.data?.code);
      },
    })
  );

  function submit(data: FormData) {
    mutate({
      ...data,
      organizationID: organization.id.toString(),
      ...((jobListing != null
        ? { jobListingID: jobListing.id.toString() }
        : undefined) as any),
    });
  }

  return (
    <>
      <Form {...form}>
        <form
          noValidate
          className='space-y-6'
          onSubmit={form.handleSubmit(submit)}
        >
          <FormField
            name='title'
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Job title</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            name='wage'
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Wage</FormLabel>
                <div className='flex'>
                  <FormControl>
                    <Input
                      type='number'
                      value={field.value ?? ''}
                      onChange={e =>
                        field.onChange(
                          isNaN(e.target.valueAsNumber)
                            ? null
                            : e.target.valueAsNumber
                        )
                      }
                      className='rounded-r-none'
                    />
                  </FormControl>
                  <FormField
                    name='wageInterval'
                    control={form.control}
                    render={({ field }) => (
                      <FormItem>
                        <Select
                          value={field.value ?? ''}
                          onValueChange={field.onChange}
                        >
                          <FormControl>
                            <SelectTrigger className='rounded-l-none'>
                              / <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {wageIntervals.map(interval => (
                              <SelectItem
                                value={interval.value}
                                key={interval.value}
                              >
                                {interval.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            name='locationRequirement'
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Job location type</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger className='w-full'>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {locationTypes.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormItem>
            )}
          />
          <FormField
            name='streetAddress'
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Street address</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            name='type'
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Job type</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger className='w-full'>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {jobTypes.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormItem>
            )}
          />
          <FormField
            name='experienceLevel'
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Experience level</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger className='w-full'>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {experienceLevels.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormItem>
            )}
          />
          <FormField
            name='openings'
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Number of openings</FormLabel>
                <FormControl>
                  <Input
                    type='number'
                    {...field}
                    onChange={e => field.onChange(e.target.valueAsNumber)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            name='description'
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Job description</FormLabel>
                <FormControl>
                  <RichTextEditor {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type='submit' className='w-full' disabled={isPending}>
            {jobListing != null ? 'Update job listing' : 'Create job listing'}
          </Button>
        </form>
      </Form>
      {isPending && (
        <div className='absolute flex flex-col items-center justify-center inset-0 bg-white/85 backdrop-blur-md rounded-xl'>
          <div className='flex flex-col items-center space-y-1'>
            <Spinner />
            <span className='text-muted-foreground'>Posting</span>
          </div>
        </div>
      )}
    </>
  );
}

// {
//     title: string;
//     description: string;
//     wage: number;
//     wageInterval: string | null;
//     streetAddress: string | null;
//     locationRequirement: string;
//     experienceLevel: string | null;
//     openings: number;
//     status: string | null;
//     type: string | null;
//   }
