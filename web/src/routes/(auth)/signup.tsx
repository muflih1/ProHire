import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
import axios from 'axios';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Spinner } from '@/components/ui/spinner';
import TextButton from '@/components/text-button';

const schema = z.object({
  displayName: z.string().nonempty(),
  email: z.email().nonempty(),
  password: z.string().nonempty().min(6),
});

type FormData = z.infer<typeof schema>;

export default function Signup() {
  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      displayName: '',
      email: '',
      password: '',
    },
  });

  const { mutate, isPending } = useMutation({
    mutationFn: async (data: FormData) => {
      const res = await axios.post('/api/auth/register', data);
      return res.data;
    },
    onError: (err: any) => toast.error(err.response.data.error.message),
    onSuccess: () => (window.location.href = '/'),
  });

  const submit: SubmitHandler<FormData> = data => mutate(data);

  return (
    <div className='min-h-screen flex items-center justify-center w-full'>
      <Card className='w-96'>
        <CardHeader className='flex justify-center'>
          <CardTitle className='text-3xl font-bold'>Create account</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(submit)}
              noValidate
              className='space-y-4'
            >
              <FormField
                name='displayName'
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

              <Button type='submit' disabled={isPending} className='w-full'>
                {isPending ? <Spinner /> : 'Sign up'}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className='flex justify-center'>
          <span className='text-sm max-w-full'>
            Have an account?{' '}
            <TextButton to={'/login'} underlineOnHover color='blue'>
              Sign in
            </TextButton>
          </span>
        </CardFooter>
      </Card>
    </div>
  );
}
