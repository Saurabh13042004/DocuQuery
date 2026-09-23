import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { User, AuthResponse, signup as apiSignup, login as apiLogin, logout as apiLogout, getMe, getMyTeam } from '../services/api';
import { TeamInfo } from '../types';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  team: TeamInfo | null;
  refreshTeam: () => Promise<void>;
  isAuthenticated: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [team, setTeam] = useState<TeamInfo | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (token && userData) {
      try {
        setUser(JSON.parse(userData));
      } catch {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const fresh = await getMe();
      setUser(fresh);
    } catch {
      // token expired or revoked; keep existing state
    }
  }, []);

  const refreshTeam = useCallback(async () => {
    try {
      setTeam((await getMyTeam()).team);
    } catch {
      // not signed in yet or request failed; keep existing state
    }
  }, []);

  useEffect(() => {
    if (user) refreshTeam();
    else setTeam(null);
  }, [user?.id, refreshTeam]);

  const login = async (email: string, password: string) => {
    const response: AuthResponse = await apiLogin(email, password);
    setUser(response.user);
  };

  const signup = async (email: string, password: string, name: string) => {
    const response: AuthResponse = await apiSignup(email, password, name);
    setUser(response.user);
  };

  const logout = () => {
    apiLogout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, refreshUser, team, refreshTeam, isAuthenticated: !!user, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
