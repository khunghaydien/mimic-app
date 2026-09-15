import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Platform } from 'react-native';
import type { ReactNode } from 'react';

import { toast } from '@/ui/toast';

const BASE_URL =
  Platform.OS === 'android' ? 'http://10.0.2.2:3000' : 'http://localhost:3000';

type ApiResponse<T> =
  | { success: true; data: T; message: string }
  | { success: false; data: null; message: string[] };

class Api {
  private token: string | null = null;

  setToken(token: string | null) {
    this.token = token;
  }

  async request<T>(
    path: string,
    method: 'GET' | 'POST' = 'GET',
    body?: unknown,
  ): Promise<T> {
    const headers: Record<string, string> = { Accept: 'application/json' };
    if (body !== undefined) {
      headers['Content-Type'] = 'application/json';
    }
    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    let payload: ApiResponse<T>;
    try {
      const response = await fetch(`${BASE_URL}${path}`, {
        method,
        headers,
        body: body === undefined ? undefined : JSON.stringify(body),
      });
      payload = (await response.json()) as ApiResponse<T>;
    } catch {
      toast.show('error', 'Network request failed');
      throw new Error('Network request failed');
    }

    if (!payload.success) {
      toast.show('error', payload.message.join('\n'));
      throw new Error(payload.message.join('\n'));
    }

    return payload.data;
  }
}

export const api = new Api();

const queryClient = new QueryClient();

export function QueryProvider({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
