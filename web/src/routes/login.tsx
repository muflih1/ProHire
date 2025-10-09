import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import axios from 'axios';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';

const schema = z.object({
  email: z.email().nonempty(),
  password: z.string().nonempty().min(6),
});

type FormData = z.infer<typeof schema>;

export default function Login() {
  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
  });

  async function login(data: FormData) {
    const res = await axios.post('/api/auth/login', data);
    return res.data;
  }

  const mutation = useMutation({
    mutationFn: login,
    onError: (err: any) => toast.error(err.response.data.error.message),
    onSuccess: () => (window.location.href = '/'),
  });

  const submit: SubmitHandler<FormData> = data => mutation.mutate(data);

  return (
    <div className='min-h-screen flex items-center justify-center w-full'>
      <Card className='w-96'>
        <CardHeader className='flex justify-center'>
          <CardTitle className='text-3xl font-bold'>Log in</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(submit)}
              noValidate
              className='space-y-4'
            >
              <FormField
                name='email'
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type='email' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                name='password'
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type='password' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                onClick={() => console.log(form.formState)}
                type='submit'
                disabled={
                  form.formState.isSubmitting || !form.formState.isValid
                }
                className='w-full'
              >
                {form.formState.isSubmitting ? <Loader2 /> : 'Log in'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
