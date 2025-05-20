import { JenkinsLogin } from '../types';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { loginJenkins } from '../api';

export function useAuth(password: string | null) {
  const client = useQueryClient();

  const {
    data: isLoggedIn = false,
    isPending: isChecking,
    isError: isLoginError,
    error: loginError,
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
    onError: (err) => {
      if (err.response?.status === 401) {
        alert('패스워드가 틀렸습니다.');
      } else {
        alert(`로그인 중 오류가 발생했습니다:${err}`);
      }
    },
  });

  return { isLoggedIn, login, isLoggingIn, isChecking, isLoginError, loginError };
}
