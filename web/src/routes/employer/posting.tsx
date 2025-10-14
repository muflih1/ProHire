import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

export default function Posting() {
  return (
    <div className='max-w-5xl mx-auto p-4'>
      <h1 className='text-2xl font-bold mb-6'>New Job Listing</h1>
      <Card>
        <CardContent>
          <JobListingForm />
        </CardContent>
      </Card>
    </div>
  );
}

const schema = z.object({
  title: z.string().nonempty(),
  description: z.string().nonempty(),
  experienceLevel: z.string(),
  locationRequirement: z.string(),
  type: z.string(),
  wage: z.number().int().positive().min(1).nullable(),
  wageInterval: z.string().nullable(),
  stateAbbreviation: z
    .string()
    .transform(val => (val.trim() === '' ? null : val))
    .nullable(),
  city: z
    .string()
    .transform(val => (val.trim() === '' ? null : val))
    .nullable(),
});

type FormData = z.infer<typeof schema>;

function JobListingForm() {
  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: '',
      description: '',
      stateAbbreviation: null,
      city: null,
      wage: null,
      wageInterval: null,
      experienceLevel: '',
      type: '',
      locationRequirement: '',
    },
  });

  return (
    <Form {...form}>
      <form
        noValidate
        className='space-y-6'
        onSubmit={form.handleSubmit(console.log)}
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
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          name='city'
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Street address</FormLabel>
              <FormControl>
                <Input {...field} value={field.value ?? ''} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type='submit'>Create job</Button>
      </form>
    </Form>
  );
}
