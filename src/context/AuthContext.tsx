import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode
} from 'react';
import authService from '../services/auth';
import { AuthResponse, AuthVerifyResponse } from '../types';

interface AuthContextType {
  user: AuthResponse['user'] | null;
  permissions: Record<string, boolean>;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (identifier: string, password: string) => Promise<void>;
  logout: () => void;
  hasPermission: (resource: string, action: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthResponse['user'] | null>(null);
  const [permissions, setPermissions] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Verifica lo stato di autenticazione all'avvio
  useEffect(() => {
    const verifyAuth = async () => {
      if (authService.isAuthenticated()) {
        try {
          const res = await authService.verifyToken();
          setUser(res.user);
          setPermissions(res.permissions);
        } catch (error) {
          console.error('Error verifying token:', error);
          authService.removeToken();
        }
      }
      setIsLoading(false);
    };

    verifyAuth();
  }, []);

  // Login
  const login = async (identifier: string, password: string) => {
    setIsLoading(true);
    try {
      console.log('Attempting login with credentials:', { identifier, password: '****' });
      // Ora usa l'endpoint v1 che supporta identifier (email, username, codice fiscale)
      const res = await authService.login(identifier, password);
      console.log('Login response received:', res);
      console.log('🔍 FULL RESPONSE STRUCTURE:', JSON.stringify(res, null, 2));
      console.log('🔑 res.accessToken:', res.accessToken);
      console.log('🔑 res.token:', res.token);
      console.log('🔑 res.data:', res.data);
      console.log('🔑 res.data?.accessToken:', res.data?.accessToken);
      console.log('🔑 res.data?.token:', res.data?.token);
      console.log('🔑 Token to save:', res.data?.accessToken);
      
      // CRITICAL: Check if token exists before saving
      const tokenToSave = res.data?.accessToken;
      console.log('🔍 CRITICAL CHECK - tokenToSave:', tokenToSave);
      console.log('🔍 CRITICAL CHECK - tokenToSave type:', typeof tokenToSave);
      console.log('🔍 CRITICAL CHECK - tokenToSave length:', tokenToSave?.length);
      
      if (!tokenToSave) {
        console.error('🚨 CRITICAL ERROR: No token to save! tokenToSave is:', tokenToSave);
        throw new Error('No access token received from login response');
      }
      
      console.log('🔑 About to save token:', tokenToSave.substring(0, 20) + '...');
      authService.saveToken(tokenToSave);
      console.log('🔑 Token saved, checking localStorage:', authService.getToken());
      console.log('🔍 localStorage direct check:', localStorage.getItem('auth_token'));
      setUser(res.user);
      
      // Recupera i permessi dopo il login
      console.log('🔍 Starting verify token call...');
      // Aggiungi un piccolo delay per testare problemi di timing
      await new Promise(resolve => setTimeout(resolve, 100));
      const verifyRes = await authService.verifyToken();
      setPermissions(verifyRes.permissions);
      
      setIsLoading(false);
    } catch (error) {
      console.error('Login error:', error);
      setIsLoading(false);
      throw error;
    }
  };

  // Logout
  const logout = () => {
    authService.removeToken();
    setUser(null);
    setPermissions({});
    window.location.href = '/login'; // Redirect al login
  };

  // Verifica se l'utente ha un permesso specifico
  const hasPermission = (resource: string, action: string): boolean => {
    // Per debug, mostra il permesso che stiamo controllando
    console.log(`Checking permission: ${resource}:${action}`, { user, permissions });
    
    // Admin o Administrator hanno sempre tutti i permessi
    if (user?.role === 'Admin' || user?.role === 'Administrator') {
      console.log('Access granted: user is Admin/Administrator');
      return true;
    }
    
    // Verifica permesso all:* (permesso universale)
    if (permissions['all:' + action] === true) {
      console.log('Access granted: user has all:' + action + ' permission');
      return true;
    }
    
    // Verifica permesso resource:all (permesso per tutte le azioni sulla risorsa)
    if (permissions[resource + ':all'] === true) {
      console.log('Access granted: user has ' + resource + ':all permission');
      return true;
    }
    
    // Verifica dei permessi specifici
    const permissionKey = `${resource}:${action}`;
    const hasSpecificPermission = permissions[permissionKey] === true;
    
    // Concedi accesso se c'è almeno un permesso con quel resource
    if (!hasSpecificPermission && action === 'read') {
      // For 'read' actions, check if the user has any permission for this resource
      const hasAnyPermissionForResource = Object.keys(permissions)
        .some(key => key.startsWith(resource + ':') && permissions[key] === true);
      
      if (hasAnyPermissionForResource) {
        console.log('Access granted: user has some permission for ' + resource);
        return true;
      }
    }
    
    console.log('Permission check result:', hasSpecificPermission);
    return hasSpecificPermission;
  };

  const value = {
    user,
    permissions,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    hasPermission
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Export named per compatibilità Vite Fast Refresh
export { AuthContext };