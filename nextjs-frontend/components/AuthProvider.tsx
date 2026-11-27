'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState, ReactNode } from 'react';
import { Admin, getMe, login as loginRequest, logout as logoutRequest } from '@/lib/api';

interface AuthContextValue {
  admin: Admin | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<Admin>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      setAdmin(await getMe());
    } catch {
      setAdmin(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    const handleUnauthorized = () => setAdmin(null);
    window.addEventListener('sawmoto:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('sawmoto:unauthorized', handleUnauthorized);
  }, [refresh]);

  const login = useCallback(async (username: string, password: string) => {
    const result = await loginRequest(username, password);
    setAdmin(result);
    return result;
  }, []);

  const logout = useCallback(async () => {
    try {
      await logoutRequest();
    } finally {
      setAdmin(null);
    }
  }, []);

  const value = useMemo(() => ({ admin, loading, login, logout, refresh }), [admin, loading, login, logout, refresh]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
