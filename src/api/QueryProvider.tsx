import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';

import { toast } from '@/ui/toast';

import { AUTH_PATHS } from './auth/const';

const BASE_URL = 'https://mimic-be-production.up.railway.app';

type ApiResponse<T> =
  | { success: true; data: T; message: string }
  | { success: false; data: null; message: string[]; statusCode?: number };

type Session = {
  user: { id: string; name: string; email: string; avatarUrl: string | null };
  accessToken: string;
  refreshToken: string;
};

class Api {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  onAuth: ((session: Session | null) => void) | null = null;

  setAuth(session: Session | null) {
    this.accessToken = session?.accessToken ?? null;
    this.refreshToken = session?.refreshToken ?? null;
  }

  async request<T>(
    path: string,
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' = 'GET',
    body?: unknown,
  ): Promise<T> {
    let payload = await this.call<T>(path, method, body);

    if (
      !payload.success &&
      payload.statusCode === 401 &&
      this.refreshToken &&
      path !== AUTH_PATHS.REFRESH
    ) {
      const next = await this.call<Session>(AUTH_PATHS.REFRESH, 'POST', {
        refreshToken: this.refreshToken,
      });
      if (next.success) {
        this.setAuth(next.data);
        this.onAuth?.(next.data);
        payload = await this.call<T>(path, method, body);
      } else {
        this.setAuth(null);
        this.onAuth?.(null);
        throw new Error(next.message.join('\n'));
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
  }

  private async call<T>(
    path: string,
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
    body?: unknown,
  ): Promise<ApiResponse<T>> {
    const headers: Record<string, string> = { Accept: 'application/json' };
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    if (this.accessToken && path !== AUTH_PATHS.REFRESH) {
      headers.Authorization = `Bearer ${this.accessToken}`;
    }

    try {
      console.log('[api] request', method, path, body ?? '');
      const response = await fetch(`${BASE_URL}${path}`, {
        method,
        headers,
        body: body === undefined ? undefined : JSON.stringify(body),
      });
      const payload = (await response.json()) as ApiResponse<T>;
      console.log('[api] response', response.status, path, payload);
      return payload;
    } catch (error) {
      console.log('[api] error', method, path, error);
      toast.show('error', 'Network request failed');
      throw new Error('Network request failed');
    }
  }
}

export const api = new Api();
export const queryClient = new QueryClient();

export function QueryProvider({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
