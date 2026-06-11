import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { api } from '@/lib/api';

interface User {
  id: number;
  email: string;
  name: string;
  phone?: string;
  is_partner?: boolean;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ error?: string }>;
  register: (email: string, password: string, name: string) => Promise<{ error?: string }>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    const sid = localStorage.getItem('session_id');
    if (!sid) { setLoading(false); return; }
    const data = await api.auth.me();
    if (data.id) setUser(data);
    else { localStorage.removeItem('session_id'); setUser(null); }
    setLoading(false);
  };

  useEffect(() => { refresh(); }, []);

  const login = async (email: string, password: string) => {
    const data = await api.auth.login(email, password);
    if (data.error) return { error: data.error };
    localStorage.setItem('session_id', data.session_id);
    setUser(data.user);
    return {};
  };

  const register = async (email: string, password: string, name: string) => {
    const data = await api.auth.register(email, password, name);
    if (data.error) return { error: data.error };
    localStorage.setItem('session_id', data.session_id);
    setUser(data.user);
    return {};
  };

  const logout = async () => {
    await api.auth.logout();
    localStorage.removeItem('session_id');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}