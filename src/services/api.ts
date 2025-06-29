import axios from 'axios';
import { getToken } from './auth';
import { API_BASE_URL } from '../config/api';

// Definiamo AxiosRequestConfig in base alla documentazione di Axios
interface AxiosRequestConfig {
  headers?: Record<string, string>;
  timeout?: number;
  withCredentials?: boolean;
  url?: string;
  [key: string]: any;
}

// Estensione per aggiungere il campo _requestUrl
interface ExtendedAxiosConfig extends AxiosRequestConfig {
  _requestUrl?: string;
}

// Configurazione per il retry delle richieste - disabilitato completamente
const MAX_RETRIES = 0; // Disabilitati i retry automatici
const RETRY_DELAY = 2000;

// Variabile per rilevare e limitare le richieste eccessive
const pendingRequests = {
  count: 0,
  urls: new Set<string>()
};

// Create base API client with default configuration
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  // Disabilita completamente withCredentials per evitare problemi CORS
  withCredentials: false,
  // Rimuovo timeout globale per permettere timeout specifici per operazione
});

// Request interceptor for API calls
apiClient.interceptors.request.use(
  (config: any) => {
    // Debug: Log della configurazione axios
    console.log('🔍 [AXIOS DEBUG] Request config:', {
      url: config.url,
      baseURL: config.baseURL,
      fullURL: config.baseURL + config.url,
      method: config.method
    });
    
    // Add auth token if available
    const token = getToken();
    console.log('🔑 [API INTERCEPTOR] Token from localStorage:', token);
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
      console.log('🔑 [API INTERCEPTOR] Authorization header set:', config.headers.Authorization);
    } else {
      console.log('🚨 [API INTERCEPTOR] No token found in localStorage!');
    }
    
    // Intercettore per limitare richieste parallele eccessive allo stesso endpoint
    const url = config.url || '';
    
    // Se abbiamo troppe richieste pendenti o abbiamo già una richiesta per questo URL, possiamo rifiutare
    if (pendingRequests.count > 5) {
      throw new Error('Troppe richieste simultanee');
    }
    
    if (pendingRequests.urls.has(url)) {
      console.warn(`Richiesta duplicata per ${url} - ottimizzando`);
    } else {
      pendingRequests.count++;
      pendingRequests.urls.add(url);
      
      // Aggiungiamo una proprietà al config per tracciare l'URL per il cleanup
      config._requestUrl = url;
    }
    
    // Interceptor per convertire i campi numerici prima dell'invio
    if (config.data && config.url && (
      config.url.includes('/courses') || 
      config.url.includes('/bulk-import')
    )) {
      // Tratta i dati come un record generico
      const originalData = config.data as Record<string, any> | Array<Record<string, any>>;
      
      // Funzione di conversione per un singolo oggetto corso - ottimizzata
      const convertCourseFields = (course: Record<string, any>): Record<string, any> => {
        const result = { ...course };
        
        // Ottimizzazione: converti tutti i campi numerici in un'unica iterazione
        const numericFields = {
          validityYears: true, // true = intero
          maxPeople: true,
          price: false, // false = float
          pricePerPerson: false
        };
        
        // Converti tutti i campi numerici in un loop
        Object.entries(numericFields).forEach(([field, isInteger]) => {
          if (result[field] !== undefined && result[field] !== null) {
            // Se è una stringa, pulisci e converti
            if (typeof result[field] === 'string') {
              const cleanValue = (result[field] as string).replace(/[^\d.]/g, '');
              if (cleanValue) {
                const numValue = Number(cleanValue);
                if (!isNaN(numValue)) {
                  result[field] = isInteger ? Math.floor(numValue) : Number(numValue.toFixed(2));
                } else {
                  result[field] = null;
                }
              } else {
                result[field] = null;
              }
            } 
            // Se non è già un numero, imposta null
            else if (typeof result[field] !== 'number') {
              result[field] = null;
            }
            // Se è già un numero, assicurati che sia del tipo corretto
            else if (isInteger && result[field] % 1 !== 0) {
              result[field] = Math.floor(result[field] as number);
            }
          }
        });
        
        // Assicurati che duration rimanga una stringa
        if (result.duration !== undefined && result.duration !== null) {
          result.duration = String(result.duration);
        }
        
        return result;
      };
      
      try {
        // Gestisci sia oggetti singoli che array
        if (Array.isArray(originalData)) {
          // È un array di oggetti (ad es. bulk import)
          const convertedData = originalData.map(convertCourseFields);
          config.data = convertedData;
        } else {
          // È un singolo oggetto
          const convertedData = convertCourseFields(originalData);
          config.data = convertedData;
        }
      } catch (error) {
        // Ignora errori e continua con i dati originali
      }
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for API calls
apiClient.interceptors.response.use(
  (response) => {
    // Cleanup del conteggio richieste
    const config = response.config;
    if (config && config._requestUrl) {
      pendingRequests.count = Math.max(0, pendingRequests.count - 1);
      pendingRequests.urls.delete(config._requestUrl);
    }
    return response;
  },
  async (error) => {
    // Cleanup del conteggio richieste anche in caso di errore
    const config = error?.config;
    if (config && config._requestUrl) {
      pendingRequests.count = Math.max(0, pendingRequests.count - 1);
      pendingRequests.urls.delete(config._requestUrl);
    }
    
    // Nessun retry automatico, riduciamo il debug
    if (process.env.NODE_ENV !== 'production' && error?.config?.url) {
      console.debug(`API Error [${error.config?.url}]: ${error.code || error.name || 'Unknown error'}`);
    }
    
    // Handle auth errors
    if (error.response?.status === 401 || error.response?.status === 403) {
      localStorage.removeItem('auth_token');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

// API utility functions with type assertions for safety
export const apiGet = async <T>(url: string, params = {}): Promise<T> => {
  try {
    // Configurazione speciale per endpoint di autenticazione per evitare cache browser
    const isAuthEndpoint = url.includes('/auth/');
    const config: any = {
      params: {
        ...params,
        // Cache-busting per endpoint auth
        ...(isAuthEndpoint && { _t: Date.now() })
      },
      timeout: 20000, // Timeout ridotto
    };
    
    // Headers no-cache per endpoint di autenticazione
    if (isAuthEndpoint) {
      config.headers = {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      };
      console.log('🚫 [CACHE BYPASS] Adding no-cache headers for auth endpoint:', url);
    }
    
    const response = await apiClient.get(url, config);
    return response.data as T;
  } catch (error) {
    // Errore più descrittivo per ERR_INSUFFICIENT_RESOURCES
    if ((error as any)?.code === 'ERR_INSUFFICIENT_RESOURCES') {
      console.error('Browser resource limit reached - try again in a moment');
    }
    throw error;
  }
};

// Funzione per garantire che i tipi dei campi numerici siano mantenuti
const preserveNumericTypes = (data: any): any => {
  // Se è null, undefined o non è un oggetto, restituisci il valore originale
  if (data === null || data === undefined || typeof data !== 'object') {
    return data;
  }
  
  // Se è un array, applica recursivamente la funzione a ogni elemento
  if (Array.isArray(data)) {
    return data.map(item => preserveNumericTypes(item));
  }
  
  // Clona l'oggetto per non modificare l'originale
  const result = { ...data };
  
  // Campi numerici di interesse
  const integerFields = ['validityYears', 'maxPeople'];
  const floatFields = ['price', 'pricePerPerson'];
  
  // Converti gli interi
  for (const field of integerFields) {
    if (result[field] !== undefined && result[field] !== null) {
      const value = result[field];
      // Se è già un numero, mantienilo tale
      // Se è una stringa, convertila in numero se possibile
      if (typeof value === 'string') {
        const parsedValue = parseInt(value, 10);
        if (!isNaN(parsedValue)) {
          result[field] = parsedValue;
        }
      }
    }
  }
  
  // Converti i float
  for (const field of floatFields) {
    if (result[field] !== undefined && result[field] !== null) {
      const value = result[field];
      // Se è già un numero, mantienilo tale
      // Se è una stringa, convertila in numero se possibile
      if (typeof value === 'string') {
        const parsedValue = parseFloat(value);
        if (!isNaN(parsedValue)) {
          result[field] = parsedValue;
        }
      }
    }
  }
  
  // Processa recursivamente eventuali oggetti annidati
  for (const key in result) {
    if (result[key] !== null && typeof result[key] === 'object') {
      result[key] = preserveNumericTypes(result[key]);
    }
  }
  
  return result;
};

// Funzione di POST API con preservazione di tipi numerici
export async function apiPost<T = any>(
  url: string,
  data?: any,
  config?: AxiosRequestConfig,
  enablePreserveNumericTypes = true
): Promise<T> {
  // Se data è un oggetto e la preservazione dei tipi è abilitata, processa i dati
  let processedData = data;
  
  // Elaboriamo i dati solo se necessario per evitare de/serializzazioni eccessive
  if (enablePreserveNumericTypes && data && typeof data === 'object') {
    try {
      // Funzione semplificata per assicurare tipi corretti
      const ensureCorrectTypes = (obj: any): any => {
        // Se è un array, gestiamolo diversamente
        if (Array.isArray(obj)) {
          return obj.map(item => ensureCorrectTypes(item));
        }
        
        // Se non è un oggetto o è null, restituisci com'è
        if (!obj || typeof obj !== 'object') return obj;
        
        const result: Record<string, any> = {};
        
        // Copia tutte le proprietà, convertendo solo i tipi necessari
        for (const [key, value] of Object.entries(obj)) {
          if (value === undefined || value === null) {
            result[key] = null;
            continue;
          }
          
          // Gestisci specificamente i campi di numeri interi
          if ((key === 'validityYears' || key === 'maxPeople') && value !== undefined) {
            const numValue = Number(value);
            result[key] = !isNaN(numValue) ? Math.round(numValue) : null;
          }
          // Gestisci i campi di numeri decimali
          else if ((key === 'price' || key === 'pricePerPerson') && value !== undefined) {
            const numValue = Number(value);
            result[key] = !isNaN(numValue) ? numValue : null;
          }
          // Per altri oggetti, applica ricorsivamente
          else if (typeof value === 'object' && value !== null) {
            result[key] = ensureCorrectTypes(value);
          }
          // Altrimenti, copia il valore così com'è
          else {
            result[key] = value;
          }
        }
        
        return result;
      };
      
      processedData = ensureCorrectTypes(data);
    } catch (error: any) {
      // In caso di errore, continua con i dati originali
      processedData = data;
    }
  }
  
  try {
    // Determina il timeout in base al tipo di operazione
    const getTimeoutForUrl = (url: string): number => {
      // Timeout per autenticazione (10 secondi)
      if (url.includes('/auth/')) {
        return 10000; // 10 secondi per autenticazione
      }
      // Timeout esteso per generazione documenti (60 secondi)
      if (url.includes('/generate') || url.includes('/documents')) {
        return 60000;
      }
      // Timeout standard per altre operazioni (30 secondi)
      return 30000;
    };

    const timeoutValue = config?.timeout || getTimeoutForUrl(url);
    const withCredentialsValue = url.includes('/auth/'); // Abilita per auth endpoints
    
    // Debug log per le chiamate di autenticazione
    if (url.includes('/auth/')) {
      console.log('🔐 Auth API Call Debug:', {
        url,
        timeout: timeoutValue,
        withCredentials: withCredentialsValue,
        baseURL: API_BASE_URL
      });
    }
    
    const enhancedConfig: AxiosRequestConfig = { 
      ...config,
      timeout: timeoutValue,
      // Abilita withCredentials per le chiamate di autenticazione
      withCredentials: withCredentialsValue,
      // Assicurati che il content-type sia corretto
      headers: {
        ...config?.headers,
        'Content-Type': 'application/json'
      }
    };
    
    const response = await apiClient.post<T>(url, processedData, enhancedConfig);
    return response.data;
  } catch (error: any) {
    throw error;
  }
}

export const apiPut = async <T>(url: string, data = {}): Promise<T> => {
  // Determina il timeout in base al tipo di operazione
  const getTimeoutForUrl = (url: string): number => {
    // Timeout ridotto per operazioni di autenticazione (10 secondi)
    if (url.includes('/auth/')) {
      return 10000;
    }
    // Timeout esteso per generazione documenti (60 secondi)
    if (url.includes('/generate') || url.includes('/documents')) {
      return 60000;
    }
    // Timeout standard per altre operazioni (30 secondi)
    return 30000;
  };

  const response = await apiClient.put(url, data, {
    timeout: getTimeoutForUrl(url),
    withCredentials: url.includes('/auth/') ? true : false
  });
  return response.data as T;
};

export const apiDelete = async <T>(url: string): Promise<T> => {
  const response = await apiClient.delete(url, {
    timeout: 30000 // Timeout esteso anche per DELETE
  });
  return response.data as T;
};

// For DELETE requests with payload
export const apiDeleteWithPayload = async <T>(url: string, data = {}): Promise<T> => {
  const config = {
    method: 'DELETE',
    url,
    data,
    timeout: 30000 // Timeout esteso anche per DELETE with payload
  };
  const response = await apiClient(config);
  return response.data as T;
};

export default apiClient;