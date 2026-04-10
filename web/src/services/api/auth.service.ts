import {axios} from '@/lib/axios';
import {
  MutationOptions,
  mutationOptions,
  queryOptions,
} from '@tanstack/react-query';

export function signInMutationOptions<
  T = any,
  E = Error,
  P extends {emailAddress: string; password: string} = {
    emailAddress: string;
    password: string;
  },
>(options?: Omit<MutationOptions<T, E, P>, 'mutationFn' | 'mutationKey'>) {
  return mutationOptions<T, E, P>({
    mutationKey: ['auth', 'sign-in'],
    mutationFn: async data => {
      const body = new URLSearchParams({
        email_address: data.emailAddress,
        password: data.password,
      }).toString();
      const res = await axios.post('/auth/sign_in', body);
      return res.data;
    },
    ...options,
  });
}

function sessionQueryOptions() {
  return queryOptions<SessionResource | null>({
    queryKey: ['auth', 'viewer'],
    queryFn: async () => {
      const res = await axios.get('/auth/session?alt=json');
      return res.data;
    },
    staleTime: Infinity,
    refetchOnMount: false,
    retry: false,
    refetchOnReconnect: true,
    refetchOnWindowFocus: false,
  });
}

function signUpMutationOptions(
  options: Omit<
    MutationOptions<
      {
        first_name: string;
        last_name: string;
        email_address: string;
        password: string;
      },
      Error
    >,
    'mutationFn'
  > = {},
) {
  return mutationOptions({
    mutationFn: variables => axios.post('/auth/sign_up', variables),
    ...options,
  });
}

export const auth = {
  session: {
    queryOptions: sessionQueryOptions,
  },
  signUp: {
    mutationOptions: signUpMutationOptions,
  },
  signIn: {
    mutationOptions: signInMutationOptions,
  },
};

export interface SessionResource {
  user: UserResource | null
  activeOrganizationID: string | null
}

export interface UserResource {
  id: string;
  firstName: string;
  lastName: string;
  emailAddress: string;
  profileImage: null | {uri: string};
  createdAt: string;
}
