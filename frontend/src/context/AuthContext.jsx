import { useState, useCallback } from 'react';
import api from '../api/axios';
import { AuthContext } from './authContextInstance';

const readStoredUser = () => {
  try {
    const raw = localStorage.getItem('elation_user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readStoredUser);
  const [token, setToken] = useState(() => localStorage.getItem('elation_token'));

  const persistSession = (userData, jwt) => {
    localStorage.setItem('elation_token', jwt);
    localStorage.setItem('elation_user', JSON.stringify(userData));
    setUser(userData);
    setToken(jwt);
  };

  const register = useCallback(async ({ fullName, email, mobile, password }) => {
    const res = await api.post('/auth/register', { fullName, email, mobile, password });
    return res.data;
  }, []);

  const login = useCallback(async ({ identifier, password }) => {
    const res = await api.post('/auth/login', { identifier, password });
    const { user: userData, token: jwt } = res.data.data;
    persistSession(userData, jwt);
    return res.data;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('elation_token');
    localStorage.removeItem('elation_user');
    setUser(null);
    setToken(null);
  }, []);

  const value = {
    user,
    token,
    isAuthenticated: !!token,
    register,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}