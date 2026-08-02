'use client';

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { authApi, usersApi } from '@/lib/api/endpoints';
import { clearTokens, setTokens, getAccessToken, clearApiCache } from '@/lib/api/client';
import { disposeChatSocket } from '@/lib/chat/socket';
import type { AuthResponse, UserProfile } from '@/lib/api/types';

interface AuthContextValue {
  user: UserProfile | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ twoFactor: boolean; user?: UserProfile }>;
  registerClient: (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone: string;
    cityId: string;
  }) => Promise<void>;
  registerMaster: (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone: string;
    cityId: string;
    displayName: string;
    timezone: string;
    bio?: string;
    yearsOfExperience?: number;
  }) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function dashboardPathFor(role: string): string {
  if (role === 'ADMIN') return '/dashboard/admin';
  if (role === 'MASTER') return '/dashboard/master';
  return '/dashboard/client';
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    if (!getAccessToken()) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const me = await usersApi.me();
      setUser(me);
    } catch {
      clearTokens();
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const applyAuthResponse = async (res: AuthResponse) => {
    clearApiCache();
    setTokens(res.accessToken, res.refreshToken);
    const me = await usersApi.me();
    setUser(me);
    return me;
  };

  const login = async (email: string, password: string) => {
    const res = await authApi.login({ email, password });
    if ('challengeToken' in res) {
      return { twoFactor: true };
    }
    const me = await applyAuthResponse(res);
    return { twoFactor: false, user: me };
  };

  const registerClient: AuthContextValue['registerClient'] = async (data) => {
    const res = await authApi.registerClient(data);
    await applyAuthResponse(res);
  };

  const registerMaster: AuthContextValue['registerMaster'] = async (data) => {
    const res = await authApi.registerMaster(data);
    await applyAuthResponse(res);
  };

  const logout = async () => {
    const refreshToken = typeof window !== 'undefined' ? localStorage.getItem('ustogo-refresh-token') : null;
    try {
      if (refreshToken) await authApi.logout(refreshToken);
    } catch {
      // ignore — we clear local state regardless
    }
    clearTokens();
    clearApiCache();
    disposeChatSocket();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, registerClient, registerMaster, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export { dashboardPathFor };
