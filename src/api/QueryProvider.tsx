import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { File, UploadType } from 'expo-file-system';
import { useEffect, useState, type ReactNode } from 'react';
import { Platform } from 'react-native';

import { LoadingOverlay, toast } from '@/ui';

import { AUTH_PATHS } from './auth/service';

type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

const PUBLIC_AUTH_PATHS = new Set([
  AUTH_PATHS.LOGIN,
  AUTH_PATHS.REGISTER,
  AUTH_PATHS.REFRESH,
]);

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

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AuthSession = {
  user: AuthUser;
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
    return this.run(path, method, () => this.send<T>(path, method, body));
  }

  async upload<T>(
    path: string,
    uri: string,
    options: {
      fieldName: string;
      name?: string;
      mimeType?: string;
      parameters?: Record<string, string>;
    },
  ): Promise<T> {
    if (Platform.OS === 'web') {
      const body = new FormData();
      const blob = await fetch(uri).then((response) => response.blob());
      body.append(options.fieldName, blob, options.name ?? 'file');
      Object.entries(options.parameters ?? {}).forEach(([key, value]) => {
        body.append(key, value);
      });
      return this.request<T>(path, 'POST', body);
    }
    return this.run(path, 'POST', () => this.sendFile<T>(path, uri, options));
  }

  private async run<T>(
    path: string,
    method: Method,
    sendOnce: () => Promise<ApiResponse<T>>,
  ): Promise<T> {
    const showLoadingOverlay = method !== 'GET' && path !== AUTH_PATHS.REFRESH;
    if (showLoadingOverlay) this.changePendingMutationCount(1);
    try {
      let payload = await sendOnce();

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
          payload = await sendOnce();
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

  private headers(path: string, body: unknown) {
    const headers: Record<string, string> = { Accept: 'application/json' };
    if (body !== undefined && !isFormData(body)) {
      headers['Content-Type'] = 'application/json';
    }
    if (!PUBLIC_AUTH_PATHS.has(path)) {
      headers.Date = new Date().toISOString();
      if (this.accessToken) headers.Authorization = `Bearer ${this.accessToken}`;
    }
    return headers;
  }

  private async send<T>(
    path: string,
    method: Method,
    body?: unknown,
  ): Promise<ApiResponse<T>> {
    const headers = this.headers(path, body);
    const payload =
      body === undefined
        ? undefined
        : isFormData(body)
          ? body
          : JSON.stringify(body);

    try {
      if (__DEV__) console.log('[api] request', method, path, isFormData(body) ? '[form-data]' : (body ?? ''));
      const response = await fetch(`${BASE_URL}${path}`, {
        method,
        headers,
        body: payload,
      });
      const data = (await response.json()) as ApiResponse<T>;
      if (__DEV__) console.log('[api] response', response.status, path, data);
      return data;
    } catch (error) {
      if (__DEV__) console.log('[api] error', method, path, error);
      toast.show('error', 'Network request failed');
      throw new Error('Network request failed');
    }
  }

  private async sendFile<T>(
    path: string,
    uri: string,
    options: {
      fieldName: string;
      mimeType?: string;
      parameters?: Record<string, string>;
    },
  ): Promise<ApiResponse<T>> {
    const file = new File(uri);
    console.log('[api] request POST', path, '[file]', file.uri, options.parameters);
    try {
      const result = await file.upload(`${BASE_URL}${path}`, {
        httpMethod: 'POST',
        uploadType: UploadType.MULTIPART,
        fieldName: options.fieldName,
        mimeType: options.mimeType,
        headers: this.headers(path, undefined),
        parameters: options.parameters,
        sessionType: 'foreground',
      });
      console.log('[api] response', result.status, path, result.body);
      try {
        const data = JSON.parse(result.body) as ApiResponse<T>;
        if (!data.success && data.statusCode == null) {
          return { ...data, statusCode: result.status };
        }
        return data;
      } catch {
        return {
          success: false,
          data: null,
          message: [result.body || 'Upload failed'],
          statusCode: result.status,
        };
      }
    } catch (error) {
      console.log('[api] error POST', path, error);
      toast.show('error', 'Network request failed');
      throw new Error('Network request failed');
    }
  }
}

export const api = new Api();

const isFormData = (body: unknown): body is FormData => {
  if (body == null || typeof body !== 'object') return false;
  if (typeof FormData !== 'undefined' && body instanceof FormData) return true;
  return Array.isArray((body as { _parts?: unknown })._parts);
};

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
