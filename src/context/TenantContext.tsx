import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Company, User, Permission } from '../types';
import { getCurrentTenant } from '../services/tenants';
import { getUserPermissions } from '../services/auth';
import { useAuth } from './AuthContext';

// Types
export interface TenantContextType {
  tenant: Company | null;
  userRole: string;
  permissions: Permission[];
  hasPermission: (resource: string, action: string) => boolean;
  isLoading: boolean;
  error: string | null;
  refreshTenant: () => Promise<void>;
}

export interface Permission {
  resource: string;
  action: string;
  scope?: string;
}

// Context
const TenantContext = createContext<TenantContextType | undefined>(undefined);

// Hook per utilizzare il context
export const useTenant = (): TenantContextType => {
  const context = useContext(TenantContext);
  if (context === undefined) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  return context;
};

// Provider component
export const TenantProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [tenant, setTenant] = useState<Company | null>(null);
  const [userRole, setUserRole] = useState<string>('EMPLOYEE');
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { user, isAuthenticated } = useAuth();

  // Funzione per verificare i permessi
  const hasPermission = useCallback((resource: string, action: string): boolean => {
    if (!permissions || permissions.length === 0) {
      return false;
    }
    
    // Super admin ha tutti i permessi
    if (userRole === 'SUPER_ADMIN') {
      return true;
    }
    
    // Verifica permesso specifico
    return permissions.some(p => 
      p.resource === resource && 
      (p.action === action || p.action === '*')
    );
  }, [permissions, userRole]);

  // Funzione per caricare il contesto tenant
  const loadTenantContext = useCallback(async () => {
    if (!isAuthenticated || !user) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Carica tenant corrente
      const tenantData = await getCurrentTenant();
      setTenant(tenantData);

      // Carica permessi utente
      if (user.id) {
        const userPermissions = await getUserPermissions(user.id);
        setPermissions(userPermissions.permissions || []);
        setUserRole(userPermissions.role || 'EMPLOYEE');
      }
    } catch (err: any) {
      console.error('Error loading tenant context:', err);
      setError(err.message || 'Errore nel caricamento del contesto tenant');
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, user]);

  // Funzione per aggiornare il tenant
  const refreshTenant = useCallback(async () => {
    await loadTenantContext();
  }, [loadTenantContext]);

  // Carica il contesto quando l'utente cambia
  useEffect(() => {
    loadTenantContext();
  }, [loadTenantContext]);

  // Valore del context
  const contextValue: TenantContextType = {
    tenant,
    userRole,
    permissions,
    hasPermission,
    isLoading,
    error,
    refreshTenant
  };

  return (
    <TenantContext.Provider value={contextValue}>
      {children}
    </TenantContext.Provider>
  );
};

// Export named per compatibilità Vite Fast Refresh
export { TenantContext };