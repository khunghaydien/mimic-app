import AsyncStorage from '@react-native-async-storage/async-storage';
import { useMutation } from '@tanstack/react-query';
import {
  Component,
  createContext,
  useContext,
  type ReactNode,
} from 'react';

import { api, queryClient } from '../QueryProvider';
import { AUTH_PATHS } from './const';

const STORAGE_KEY = 'mimicapp.auth.session';

type AuthUser = {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
};

type AuthSession = {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
};

type AuthValue = {
  user: AuthUser | null;
  ready: boolean;
  setSession: (session: AuthSession) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthValue>({
  user: null,
  ready: false,
  setSession: async () => undefined,
  logout: async () => undefined,
});

export class AuthProvider extends Component<
  { children: ReactNode },
  { session: AuthSession | null; ready: boolean }
> {
  state = { session: null as AuthSession | null, ready: false };

  async componentDidMount() {
    api.onAuth = (session) => {
      if (session) void this.setSession(session);
      else void this.logout();
    };
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    let session: AuthSession | null = null;
    try {
      session = raw ? (JSON.parse(raw) as AuthSession) : null;
    } catch {
      await AsyncStorage.removeItem(STORAGE_KEY);
    }
    api.setAuth(session);
    this.setState({ session, ready: true });
  }

  setSession = async (session: AuthSession) => {
    api.setAuth(session);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    this.setState({ session });
  };

  logout = async () => {
    api.setAuth(null);
    queryClient.clear();
    await AsyncStorage.removeItem(STORAGE_KEY);
    this.setState({ session: null });
  };

  componentWillUnmount() {
    api.onAuth = null;
  }

  render() {
    const { session, ready } = this.state;
    return (
      <AuthContext.Provider
        value={{
          user: session?.user ?? null,
          ready,
          setSession: this.setSession,
          logout: this.logout,
        }}
      >
        {this.props.children}
      </AuthContext.Provider>
    );
  }
}

export function useAuth() {
  const auth = useContext(AuthContext);
  const login = useMutation({
    mutationFn: (body: { email: string; password: string }) =>
      api.request<AuthSession>(AUTH_PATHS.LOGIN, 'POST', body),
    onSuccess: auth.setSession,
  });
  const register = useMutation({
    mutationFn: (body: {
      name: string;
      email: string;
      password: string;
      avatarUrl?: string;
    }) => api.request<AuthSession>(AUTH_PATHS.REGISTER, 'POST', body),
    onSuccess: auth.setSession,
  });
  return { ...auth, login, register };
}
