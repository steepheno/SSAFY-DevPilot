import { JenkinsLogin } from '../types';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { loginJenkins } from '../api';

export function useAuth(password: string | null) {
  const client = useQueryClient();

  const {
    data: isLoggedIn = false,
    isPending: isChecking,
    isError,
    error,
  } = useQuery<boolean, Error>({
    queryKey: ['auth'],
    queryFn: () => loginJenkins({ initialPassword: password! }),
    retry: false,
  });

  const { mutateAsync: login, isPending: isLoggingIn } = useMutation<boolean, Error, JenkinsLogin>({
    mutationFn: (password) => loginJenkins(password),
    onSuccess: (loggedIn) => {
      client.setQueryData(['auth', password], loggedIn);
    },
  });

  return { isLoggedIn, login, isLoggingIn, isChecking, isError, error };
}
