import {api} from '@/services/api';
import {useQuery} from '@tanstack/react-query';

export function useUser() {
  const {data, isLoading, isError} = useQuery(api.auth.session.queryOptions());

  return {
    user: data?.user ?? null,
    isLoading,
    isAuthenticated: !isError && !!data,
  };
}
