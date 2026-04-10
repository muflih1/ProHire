import {createFileRoute} from '@tanstack/react-router';
import {Button} from '@/components/ui/button';
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
import {Input} from '@/components/ui/input';
import {useForm, type SubmitHandler} from 'react-hook-form';
import {z} from 'zod';
import {zodResolver} from '@hookform/resolvers/zod';
import {useMutation} from '@tanstack/react-query';
import {toast} from 'sonner';
import {Spinner} from '@/components/ui/spinner';
import {goForceFullPageRedirectTo} from '@/utils/go-force-full-page-redirect-to';
import {api} from '@/services/api';

export const Route = createFileRoute('/(auth)/_layout/sign-in')({
  component: SignIn,
});

const schema = z.object({
  emailAddress: z.email().nonempty(),
  password: z.string().nonempty().min(6),
});

type FormData = z.infer<typeof schema>;

function SignIn() {
  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {emailAddress: '', password: ''},
  });

  const {mutate: signInMutationSync, isPending} = useMutation(
    api.auth.signIn.mutationOptions({
      onError: (err: any) => {
        toast.error(err.response.data.error_message)
      },
      onSuccess: () => goForceFullPageRedirectTo('/', true),
    }),
  );

  const submit: SubmitHandler<FormData> = data => signInMutationSync(data);

  return (
    <Card className='max-w-100 w-full relative gap-y-8 pt-0'>
      <CardHeader className='flex justify-center pt-8 px-10'>
        <CardTitle className='text-xl font-bold'>
          Continue to Job Board
        </CardTitle>
      </CardHeader>
      <CardContent className='px-10'>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(submit)}
            noValidate
            className='space-y-4'
          >
            <FormField
              name='emailAddress'
              control={form.control}
              render={({field}) => (
                <FormItem>
                  <FormLabel>Email address</FormLabel>
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
              render={({field}) => (
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
      <CardFooter className='flex justify-center px-10'>
        <span className='text-sm max-w-full'>
          Don&apos;t have an account? <Route.Link to='/'>Sign up</Route.Link>
        </span>
      </CardFooter>
    </Card>
  );
}
