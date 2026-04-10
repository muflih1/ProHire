import {api} from '@/services/api';
import {useQuery} from '@tanstack/react-query';

export function useSession() {
  const {data, isLoading, isError} = useQuery(api.auth.session.queryOptions());

  return {
    sesssion: data ?? null,
    isLoading,
    isAuthenticated: !isError && !!data,
  };
}
