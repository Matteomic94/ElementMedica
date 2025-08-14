import { Company } from '../types';
import { apiService } from './api';

// Types
interface TenantCurrentResponse {
  success: boolean;
  data: {
    tenant: Company;
    statistics?: any;
    billing?: any;
  };
}

export interface TenantCreateDTO {
  name: string;
  slug: string;
  domain?: string;
  settings?: Record<string, any>;
  subscription_plan?: string;
}

export interface TenantUpdateDTO {
  name?: string;
  domain?: string;
  settings?: Record<string, any>;
  subscription_plan?: string;
  is_active?: boolean;
}

export interface TenantUsage {
  userCount: number;
  companyCount: number;
  storageUsed: number;
  apiCallsCount: number;
}

// API Functions
export const getCurrentTenant = async (): Promise<Company> => {
  try {
    const response = await apiService.get<TenantCurrentResponse>('/tenants/current');
    // L'endpoint restituisce { success: true, data: { tenant: {...} } }
    // Estraiamo il tenant dalla struttura annidata
    return response.data.tenant;
  } catch (error: any) {
    console.error('Error fetching current tenant:', error);
    throw new Error(error.response?.data?.message || 'Errore nel caricamento del tenant');
  }
};

export const getTenantById = async (tenantId: string): Promise<Company> => {
  try {
    const response = await apiService.get(`/tenant/${tenantId}`);
    return response;
  } catch (error: any) {
    console.error('Error fetching tenant:', error);
    throw new Error(error.response?.data?.message || 'Errore nel caricamento del tenant');
  }
};

export const getAllTenants = async (): Promise<Company[]> => {
  try {
    const response = await apiService.get('/tenant');
    return response;
  } catch (error: any) {
    console.error('Error fetching tenants:', error);
    throw new Error(error.response?.data?.message || 'Errore nel caricamento dei tenant');
  }
};

export const createTenant = async (tenantData: TenantCreateDTO): Promise<Company> => {
  try {
    const response = await apiService.post('/tenant', tenantData);
    return response;
  } catch (error: any) {
    console.error('Error creating tenant:', error);
    throw new Error(error.response?.data?.message || 'Errore nella creazione del tenant');
  }
};

export const updateTenant = async (tenantId: string, tenantData: TenantUpdateDTO): Promise<Company> => {
  try {
    const response = await apiService.put(`/tenant/${tenantId}`, tenantData);
    return response;
  } catch (error: any) {
    console.error('Error updating tenant:', error);
    throw new Error(error.response?.data?.message || 'Errore nell\'aggiornamento del tenant');
  }
};

export const deleteTenant = async (tenantId: string): Promise<void> => {
  try {
    await apiService.delete(`/tenant/${tenantId}`);
  } catch (error: any) {
    console.error('Error deleting tenant:', error);
    throw new Error(error.response?.data?.message || 'Errore nell\'eliminazione del tenant');
  }
};

export const getTenantUsage = async (tenantId: string): Promise<TenantUsage> => {
  try {
    const response = await apiService.get(`/tenant/${tenantId}/usage`);
    return response as TenantUsage;
  } catch (error: any) {
    console.error('Error fetching tenant usage:', error);
    throw new Error(error.response?.data?.message || 'Errore nel caricamento dell\'utilizzo del tenant');
  }
};

export const switchTenant = async (tenantId: string): Promise<void> => {
  try {
    await apiService.post('/tenant/switch', { tenantId });
  } catch (error: any) {
    console.error('Error switching tenant:', error);
    throw new Error(error.response?.data?.message || 'Errore nel cambio tenant');
  }
};

export const validateTenantDomain = async (domain: string): Promise<{ isValid: boolean; message?: string }> => {
  try {
    const response = await apiService.post('/tenant/validate-domain', { domain });
    return response as { isValid: boolean; message?: string };
  } catch (error: any) {
    console.error('Error validating domain:', error);
    throw new Error(error.response?.data?.message || 'Errore nella validazione del dominio');
  }
};

export const validateTenantSlug = async (slug: string): Promise<{ isValid: boolean; message?: string }> => {
  try {
    const response = await apiService.post('/tenant/validate-slug', { slug });
    return response as { isValid: boolean; message?: string };
  } catch (error: any) {
    console.error('Error validating slug:', error);
    throw new Error(error.response?.data?.message || 'Errore nella validazione dello slug');
  }
};