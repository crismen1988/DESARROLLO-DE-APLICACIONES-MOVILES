import { useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { authService, RegisterPayload } from '../services/authService';

export function useAuth() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentRole, setCurrentRole] = useState<UserRole>('turista');
  const [token, setToken] = useState<string | null>(authService.getCurrentToken());
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const login = async (credentials: { email?: string; password?: string; role?: string; biometric?: boolean }) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await authService.login(credentials);
      setCurrentUser(response.user);
      setCurrentRole(response.user.role);
      setToken(response.token);
      return response;
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (payload: RegisterPayload) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await authService.register(payload);
      setCurrentUser(response.user);
      setCurrentRole(response.user.role);
      setToken(response.token);
      return response;
    } catch (err: any) {
      setError(err.message || 'Error al registrarse');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    authService.logout();
    setCurrentUser(null);
    setCurrentRole('turista');
    setToken(null);
  };

  return {
    currentUser,
    setCurrentUser,
    currentRole,
    setCurrentRole,
    token,
    isLoading,
    error,
    login,
    register,
    logout,
  };
}
