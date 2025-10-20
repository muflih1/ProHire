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
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Spinner } from '@/components/ui/spinner';
import TextButton from '@/components/text-button';
import { userLogin } from '@/services/api/auth.service';
import { goForceFullPageRedirectTo } from '@/utils/go-force-full-page-redirect-to';

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

  const { mutate, isPending } = useMutation({
    mutationFn: userLogin,
    onError: (err: any) => toast.error(err.response.data.error.message),
    onSuccess: () => goForceFullPageRedirectTo('/', true),
  });

  const submit: SubmitHandler<FormData> = data => mutate(data);

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

              <Button type='submit' disabled={isPending} className='w-full'>
                {isPending ? <Spinner /> : 'Log in'}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className='flex justify-center'>
          <span className='text-sm max-w-full'>
            Don&apos;t have an account?{' '}
            <TextButton to={'/signup'} underlineOnHover color='blue'>
              Sign up
            </TextButton>
          </span>
        </CardFooter>
      </Card>
    </div>
  );
}
