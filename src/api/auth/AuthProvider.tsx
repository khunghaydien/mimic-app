import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Component,
  createContext,
  useContext,
  type ReactNode,
} from 'react';

import { api, queryClient, type AuthSession } from '../QueryProvider';

const STORAGE_KEY = 'mimicapp.auth.session';

type AuthUser = AuthSession['user'];

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
  private authValue: AuthValue | null = null;

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
    const user = session?.user ?? null;
    let authValue = this.authValue;
    if (!authValue || authValue.user !== user || authValue.ready !== ready) {
      authValue = {
        user,
        ready,
        setSession: this.setSession,
        logout: this.logout,
      };
      this.authValue = authValue;
    }
    return (
      <AuthContext.Provider value={authValue}>
        {this.props.children}
      </AuthContext.Provider>
    );
  }
}

export const useAuth = () => {
  return useContext(AuthContext);
};
