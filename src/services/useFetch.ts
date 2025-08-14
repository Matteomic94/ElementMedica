import { useState, useEffect } from 'react';
import { apiGet } from './api';
import { API_BASE_URL } from '../config/api';

// Tipizzazione per i dati mock
interface MockData {
  attestati: any[];
  [key: string]: any[];
}

// Dati mock per vari tipi di entità
const MOCK_DATA: MockData = {
  'attestati': [
    {
      id: "mock-1",
      scheduledCourseId: "mock-course-1",
      partecipanteId: "mock-employee-1",
      nomeFile: "attestato_mock.pdf",
      url: "/uploads/attestati/attestato_mock.pdf",
      dataGenerazione: new Date().toISOString(),
      numeroProgressivo: 1,
      annoProgressivo: 2023,
      partecipante: {
        id: "mock-employee-1",
        first_name: "Mario",
        last_name: "Rossi"
      },
      scheduledCourse: {
        id: "mock-course-1",
        title: "Corso di Sicurezza Base"
      }
    }
  ]
};

/**
 * Trasforma le chiavi in snake_case in camelCase per compatibilità
 */
function normalizeResponseData(data: any): any {
  if (Array.isArray(data)) {
    return data.map(item => normalizeResponseData(item));
  }
  
  if (data !== null && typeof data === 'object') {
    const normalized: Record<string, any> = {};
    
    for (const [key, value] of Object.entries(data)) {
      // Converti da snake_case a camelCase
      const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
      
      // Normalizza anche i valori nidificati
      normalized[camelKey] = normalizeResponseData(value);
      
      // Mantieni anche la chiave originale per retrocompatibilità
      if (camelKey !== key) {
        normalized[key] = normalizeResponseData(value);
      }
    }
    
    return normalized;
  }
  
  return data;
}

/**
 * Custom hook per gestire le chiamate API con caching opzionale
 */
export function useFetch<T>(url: string, options?: { cache?: boolean, defaultValue?: T }) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isMounted = true;
    
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Costruisci l'URL completo se è relativo
        const fullUrl = url.startsWith('http') ? url : url;
        const responseData = await apiGet(fullUrl);
        
        if (isMounted) {
          // Normalizza i dati per gestire sia snake_case che camelCase
          const normalizedData = normalizeResponseData(responseData);
          
          // Cast esplicito a T per evitare errori di tipo
          setData(normalizedData as T);
        }
      } catch (err: any) {
        if (isMounted) {
          console.error("Fetch error:", err);
          setError(new Error(`Error: ${err.message}`));
          
          // Se l'URL contiene un path che corrisponde a uno dei nostri mock data
          // Cerca il path nel MOCK_DATA
          const pathMatch = Object.keys(MOCK_DATA).find(path => url.includes(path));
          if (pathMatch) {
            console.warn(`Utilizzando dati mock per ${pathMatch}`);
            // Cast esplicito a T per evitare errori di tipo
            setData(MOCK_DATA[pathMatch] as unknown as T);
          }
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [url]);

  return { data, loading, error };
}