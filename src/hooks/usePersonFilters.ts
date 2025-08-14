import { useState, useEffect, useMemo } from 'react';
import { apiGet } from '../services/api';
import { 
  Person, 
  FilterConfig, 
  filterPersonsByRoleLevel, 
  filterEmployees, 
  filterTrainers,
  applyCustomFilter 
} from '../services/roleHierarchyService';

export interface UsePersonFiltersOptions {
  filterConfig?: FilterConfig;
  filterType?: 'all' | 'employees' | 'trainers' | 'custom';
  autoFetch?: boolean;
  includeDeleted?: boolean;
}

export interface UsePersonFiltersReturn {
  persons: Person[];
  filteredPersons: Person[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  setPersons: (persons: Person[]) => void;
  totalCount: number;
  filteredCount: number;
}

/**
 * Hook personalizzato per la gestione delle persone con filtri gerarchici
 * Supporta filtri predefiniti per employees/trainers e filtri personalizzati
 */
export const usePersonFilters = ({
  filterConfig,
  filterType = 'all',
  autoFetch = true,
  includeDeleted = false
}: UsePersonFiltersOptions = {}): UsePersonFiltersReturn => {
  const [persons, setPersons] = useState<Person[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Calcola le persone filtrate in base alla configurazione
  const filteredPersons = useMemo(() => {
    if (!persons.length) return [];

    switch (filterType) {
      case 'employees':
        return filterEmployees(persons);
      
      case 'trainers':
        return filterTrainers(persons);
      
      case 'custom':
        if (filterConfig) {
          return applyCustomFilter(persons, filterConfig);
        }
        return persons;
      
      case 'all':
      default:
        return persons;
    }
  }, [persons, filterType, filterConfig]);

  // Fetch delle persone dal backend
  const fetchPersons = async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      
      // Usa l'endpoint unificato per le persone con parametro includeDeleted
      const params = includeDeleted ? '?includeDeleted=true' : '';
      console.log(`🔍 usePersonFilters - Chiamando API: /api/v1/persons${params}`);
      const data = await apiGet<Person[]>(`/api/v1/persons${params}`);
      console.log(`🔍 usePersonFilters - Ricevuti ${data?.length || 0} elementi dall'API`);
      console.log(`🔍 usePersonFilters - includeDeleted: ${includeDeleted}, filterType: ${filterType}`);
      if (data && data.length > 0) {
        console.log(`🔍 usePersonFilters - Primo elemento:`, data[0]);
      }
      setPersons(data || []);
    } catch (err) {
      console.error('Error fetching persons:', err);
      setError(err instanceof Error ? err.message : 'Errore nel caricamento delle persone');
      setPersons([]);
    } finally {
      setLoading(false);
    }
  };

  // Auto-fetch al mount se richiesto
  useEffect(() => {
    if (autoFetch) {
      fetchPersons();
    }
  }, [autoFetch, includeDeleted]);

  return {
    persons,
    filteredPersons,
    loading,
    error,
    refetch: fetchPersons,
    setPersons,
    totalCount: persons.length,
    filteredCount: filteredPersons.length
  };
};

/**
 * Hook semplificato per employees
 */
export const useEmployees = () => {
  return usePersonFilters({ filterType: 'employees' });
};

/**
 * Hook semplificato per trainers
 */
export const useTrainers = () => {
  return usePersonFilters({ filterType: 'trainers' });
};

/**
 * Hook per tutte le persone senza filtri
 */
export const useAllPersons = () => {
  return usePersonFilters({ filterType: 'all' });
};

/**
 * Hook per tutte le persone inclusi i soft-deleted (per importazione)
 */
export const useAllPersonsForImport = () => {
  return usePersonFilters({ filterType: 'all', includeDeleted: true });
};