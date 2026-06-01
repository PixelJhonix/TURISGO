import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from './mockData';
import { loginApi } from './api/services/authService';
import { setToken } from './api/client';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('turistgo_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const result = await loginApi(email, password);
      setUser(result.user);
      localStorage.setItem('turistgo_user', JSON.stringify(result.user));
      return { success: true, error: result.alert };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Error al iniciar sesión' };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('turistgo_user');
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
