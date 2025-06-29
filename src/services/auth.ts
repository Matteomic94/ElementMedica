import { apiPost, apiGet } from './api';
import { AuthResponse, AuthVerifyResponse, LoginRequest } from '../types';
import { apiPost, apiGet } from './api';

// Types for permissions
export interface UserPermissions {
  role: string;
  permissions: Array<{
    resource: string;
    action: string;
    scope?: string;
  }>;
}

export const login = async (identifier: string, password: string): Promise<AuthResponse> => {
  return await apiPost<AuthResponse>('/api/v1/auth/login', {
    identifier,
    password,
  });
};

export const verifyToken = async (): Promise<AuthVerifyResponse> => {
  return await apiGet<AuthVerifyResponse>('/api/v1/auth/verify');
};

export const forgotPassword = async (email: string): Promise<{ message: string }> => {
  return await apiPost<{ message: string }>('/api/v1/auth/forgot-password', { email });
};

export const resetPassword = async (token: string, password: string): Promise<{ message: string }> => {
  return await apiPost<{ message: string }>('/api/v1/auth/reset-password', { token, password });
};

export const saveToken = (token: string): void => {
  localStorage.setItem('auth_token', token);
};

export const getToken = (): string | null => {
  return localStorage.getItem('auth_token');
};

export const removeToken = (): void => {
  localStorage.removeItem('auth_token');
};

export const isAuthenticated = (): boolean => {
  return !!getToken();
};

export const getUserPermissions = async (userId: string): Promise<UserPermissions> => {
  try {
    const response = await apiGet<UserPermissions>(`/api/v1/auth/permissions/${userId}`);
    return response;
  } catch (error: any) {
    console.error('Error fetching user permissions:', error);
    throw new Error(error.response?.data?.message || 'Errore nel caricamento dei permessi utente');
  }
};

export default {
  login,
  verifyToken,
  forgotPassword,
  resetPassword,
  saveToken,
  getToken,
  removeToken,
  isAuthenticated
};