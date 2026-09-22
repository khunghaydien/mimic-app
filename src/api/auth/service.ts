import { useMutation, useQuery } from '@tanstack/react-query';

import { api, type AuthSession, type AuthUser } from '../QueryProvider';

import { useAuth } from './AuthProvider';

export const AUTH_PATHS = {
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  REFRESH: '/auth/refresh',
  ME: '/auth/me',
};

export const useLogin = () => {
  const { setSession } = useAuth();
  return useMutation({
    mutationFn: (body: { email: string; password: string }) =>
      api.request<AuthSession>(AUTH_PATHS.LOGIN, 'POST', body),
    onSuccess: setSession,
  });
};

export const useRegister = () => {
  const { setSession } = useAuth();
  return useMutation({
    mutationFn: (body: {
      name: string;
      email: string;
      password: string;
      avatarUrl?: string;
    }) => api.request<AuthSession>(AUTH_PATHS.REGISTER, 'POST', body),
    onSuccess: setSession,
  });
};

export const useMe = (enabled = true) =>
  useQuery({
    queryKey: ['auth', 'me'],
    queryFn: () => api.request<AuthUser>(AUTH_PATHS.ME),
    enabled,
  });
