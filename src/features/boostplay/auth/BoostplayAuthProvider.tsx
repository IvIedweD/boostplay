import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  type AuthUser,
  type PasswordLoginRequest,
  type PendingEmailVerification,
  type RegistrationRequest,
} from './authAdapter';
import { createAuthAdapter } from './createAuthAdapter';

interface AuthContextValue {
  user: AuthUser | null;
  authenticated: boolean;
  loading: boolean;
  register: (request: RegistrationRequest) => Promise<PendingEmailVerification>;
  signIn: (request: PasswordLoginRequest) => Promise<AuthUser>;
  useLocalDevelopmentUser: () => Promise<void>;
  continueAsGuest: () => Promise<void>;
  updateActivityPoints: (activityPoints: number) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);
const authAdapter = createAuthAdapter();

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => authAdapter.getInitialUser());
  const [loading, setLoading] = useState(Boolean(authAdapter.restoresSession));

  useEffect(() => {
    if (!authAdapter.refreshSession) return;
    let active = true;
    authAdapter.refreshSession()
      .then((nextUser) => { if (active) setUser(nextUser); })
      .catch(() => { if (active) setUser(null); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    authenticated: user !== null,
    loading,
    register: (request) => authAdapter.register(request),
    signIn: async (request) => {
      const nextUser = await authAdapter.signIn(request);
      setUser(nextUser);
      return nextUser;
    },
    useLocalDevelopmentUser: async () => setUser(await authAdapter.signInForDevelopment()),
    continueAsGuest: async () => { await authAdapter.signOut(); setUser(null); },
    updateActivityPoints: (activityPoints) => setUser((current) => current
      ? { ...current, activityPoints: Math.max(0, Math.floor(activityPoints)) }
      : current),
  }), [loading, user]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// The hook intentionally lives beside its provider so consumers have one stable import.
// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('AuthProvider не подключён.');
  return value;
}
