import { useMutation } from '@tanstack/react-query';

import { api, type AuthSession } from '../QueryProvider';

import { useAuth } from './AuthProvider';

export const AUTH_PATHS = {
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  REFRESH: '/auth/refresh',
};

export function useLogin() {
  const { setSession } = useAuth();
  return useMutation({
    mutationFn: (body: { email: string; password: string }) =>
      api.request<AuthSession>(AUTH_PATHS.LOGIN, 'POST', body),
    onSuccess: setSession,
  });
}

export function useRegister() {
  const { setSession } = useAuth();
  return useMutation({
    mutationFn: (body: { name: string; email: string; password: string }) =>
      api.request<AuthSession>(AUTH_PATHS.REGISTER, 'POST', body),
    onSuccess: setSession,
  });
}
