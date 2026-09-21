import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect, useState, type ReactNode } from 'react';
import { Platform } from 'react-native';

import { LoadingOverlay, toast } from '@/ui';

import { AUTH_PATHS } from './auth/service';

type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

const apiBaseUrl = () => {
  const url = process.env.EXPO_PUBLIC_BASE_URL ?? '';
  if (Platform.OS === 'android') {
    return url.replace('localhost', '10.0.2.2').replace('127.0.0.1', '10.0.2.2');
  }
  return url;
};

const BASE_URL = apiBaseUrl();

type ApiResponse<T> =
  | { success: true; data: T; message: string }
  | { success: false; data: null; message: string[]; statusCode?: number };

export type AuthSession = {
  user: { id: string; name: string; email: string; avatarUrl: string | null };
  accessToken: string;
  refreshToken: string;
};

type MutatingListener = (count: number) => void;

class Api {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private pendingMutationCount = 0;
  private listeners = new Set<MutatingListener>();
  onAuth: ((session: AuthSession | null) => void) | null = null;

  setAuth(session: AuthSession | null) {
    this.accessToken = session?.accessToken ?? null;
    this.refreshToken = session?.refreshToken ?? null;
  }

  onMutating(listener: MutatingListener) {
    this.listeners.add(listener);
    listener(this.pendingMutationCount);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private changePendingMutationCount(delta: number) {
    this.pendingMutationCount = Math.max(0, this.pendingMutationCount + delta);
    this.listeners.forEach((listener) => listener(this.pendingMutationCount));
  }

  async request<T>(
    path: string,
    method: Method = 'GET',
    body?: unknown,
  ): Promise<T> {
    const showLoadingOverlay = method !== 'GET' && path !== AUTH_PATHS.REFRESH;
    if (showLoadingOverlay) this.changePendingMutationCount(1);
    try {
      let payload = await this.send<T>(path, method, body);

      if (
        !payload.success &&
        payload.statusCode === 401 &&
        this.refreshToken &&
        path !== AUTH_PATHS.REFRESH
      ) {
        const refreshPayload = await this.send<AuthSession>(AUTH_PATHS.REFRESH, 'POST', {
          refreshToken: this.refreshToken,
        });
        if (refreshPayload.success) {
          this.setAuth(refreshPayload.data);
          this.onAuth?.(refreshPayload.data);
          payload = await this.send<T>(path, method, body);
        } else {
          this.setAuth(null);
          this.onAuth?.(null);
          throw new Error(refreshPayload.message.join('\n'));
        }
      }

      if (!payload.success) {
        if (payload.statusCode === 401 && this.accessToken) {
          this.setAuth(null);
          this.onAuth?.(null);
        } else {
          toast.show('error', payload.message.join('\n'));
        }
        throw new Error(payload.message.join('\n'));
      }

      if (method !== 'GET') {
        toast.show('success', payload.message);
      }

      return payload.data;
    } finally {
      if (showLoadingOverlay) this.changePendingMutationCount(-1);
    }
  }

  private async send<T>(
    path: string,
    method: Method,
    body?: unknown,
  ): Promise<ApiResponse<T>> {
    const headers: Record<string, string> = { Accept: 'application/json' };
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    if (this.accessToken && path !== AUTH_PATHS.REFRESH) {
      headers.Authorization = `Bearer ${this.accessToken}`;
    }

    try {
      if (__DEV__) console.log('[api] request', method, path, body ?? '');
      const response = await fetch(`${BASE_URL}${path}`, {
        method,
        headers,
        body: body === undefined ? undefined : JSON.stringify(body),
      });
      const payload = (await response.json()) as ApiResponse<T>;
      if (__DEV__) console.log('[api] response', response.status, path, payload);
      return payload;
    } catch (error) {
      if (__DEV__) console.log('[api] error', method, path, error);
      toast.show('error', 'Network request failed');
      throw new Error('Network request failed');
    }
  }
}

export const api = new Api();
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 30 * 60 * 1000,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      retry: 1,
    },
  },
});

const MutationLoadingOverlay = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => api.onMutating((count) => setVisible(count > 0)), []);

  return <LoadingOverlay visible={visible} />;
};

export const QueryProvider = ({ children }: { children: ReactNode }) => {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <MutationLoadingOverlay />
    </QueryClientProvider>
  );
};
