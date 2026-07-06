'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { User } from '@/types';
import {
  changePassword as changePasswordInStore,
  getCurrentUser as readCurrentUser,
  loginWithStaffId,
  logout as logoutInStore,
  switchUser as switchUserInStore,
} from '@/lib/local/auth-store';
import { hydrateStore } from '@/lib/local/store';

/**
 * AuthProvider — supplies the currently signed-in user to the React tree.
 *
 * Lifecycle:
 *  - On mount, hydrates the localStorage store (seeds if empty) and
 *    reads the session key. Until that completes, `ready` is false.
 *  - Pages that need to know the user call `useAuth()`. They should render
 *    a placeholder while `ready` is false to avoid hydration mismatches.
 *  - Login / logout / changePassword mutate the session synchronously.
 */

type AuthContextValue = {
  /** The signed-in user, or null. */
  currentUser: User | null;
  /** False until the first client-side hydration completes. */
  ready: boolean;
  /** Sign in with staff ID + password. Returns ok/error for caller to toast. */
  login: (
    staffId: string,
    password: string
  ) => Promise<{ ok: true; user: User } | { ok: false; message: string }>;
  /** Sign out and clear the session + cookie mirror. */
  logout: () => void;
  /** Change the current user's password. */
  changePassword: (
    currentPassword: string,
    newPassword: string
  ) => Promise<{ ok: true } | { ok: false; message: string }>;
  /** Demo helper — switch to a different seeded user (topbar role-switcher). */
  switchUser: (userId: string) => User | null;
  /** Force a re-read of currentUser from storage (used after a mutation that
   *  could affect the session — e.g. role change by admin). */
  refresh: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  // Hydrate the store and read the session on first mount.
  useEffect(() => {
    hydrateStore();
    setCurrentUser(readCurrentUser());
    setReady(true);
  }, []);

  const login = useCallback<AuthContextValue['login']>(
    async (staffId, password) => {
      const result = loginWithStaffId(staffId, password);
      if (result.ok) {
        setCurrentUser(result.user);
      }
      return result;
    },
    []
  );

  const logout = useCallback(() => {
    logoutInStore();
    setCurrentUser(null);
  }, []);

  const changePassword = useCallback<AuthContextValue['changePassword']>(
    async (currentPassword, newPassword) => {
      if (!currentUser) {
        return { ok: false, message: 'Not signed in.' };
      }
      const r = changePasswordInStore(
        currentUser.id,
        currentPassword,
        newPassword
      );
      return r;
    },
    [currentUser]
  );

  const switchUser = useCallback<AuthContextValue['switchUser']>(
    (userId) => {
      const u = switchUserInStore(userId);
      setCurrentUser(u);
      return u;
    },
    []
  );

  const refresh = useCallback(() => {
    setCurrentUser(readCurrentUser());
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      currentUser,
      ready,
      login,
      logout,
      changePassword,
      switchUser,
      refresh,
    }),
    [currentUser, ready, login, logout, changePassword, switchUser, refresh]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside <AuthProvider>');
  }
  return ctx;
}