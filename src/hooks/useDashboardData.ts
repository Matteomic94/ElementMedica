import { useState, useCallback, useRef } from 'react';
import { apiGet } from '../services/api';
import { getToken } from '../services/auth';
import { checkConsent, logGdprAction } from '../utils/gdpr';
import { useAuth } from '../context/AuthContext';
import { useTenant } from '../context/TenantContext';

// Types
export interface DashboardCompany {
  id: string;
  ragioneSociale: string;
  name?: string;
}

export interface DashboardTrainer {
  id: string;
  firstName: string;
  lastName: string;
  certifications?: string[];
}

export interface DashboardEmployee {
  id: string;
  firstName: string;
  lastName: string;
  companyId: string;
  company?: { id: string; name: string; ragioneSociale?: string };
}

export interface DashboardSchedule {
  id: string;
  courseId: string;
  title: string;
  startDate: string;
  endDate: string;
  status: string;
  companies?: DashboardCompany[];
  sessions?: {
    id: string;
    start: string;
    end: string;
    date: string;
  }[];
}

export interface DashboardCounters {
  totalCompanies: number;
  totalEmployees: number;
  futureScheduledCourses: number;
  expiringCourses: number;
}

export interface DashboardData {
  companies: DashboardCompany[];
  trainers: DashboardTrainer[];
  employees: DashboardEmployee[];
  schedules: DashboardSchedule[];
  counters: DashboardCounters;
}

export interface FetchOptions {
  useCache?: boolean;
  timeout?: number;
  retries?: number;
}

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const DEFAULT_TIMEOUT = 10000; // 10 seconds
const DEFAULT_RETRIES = 3;

export const useDashboardData = () => {
  const [data, setData] = useState<DashboardData>({
    companies: [],
    trainers: [],
    employees: [],
    schedules: [],
    counters: {
      totalCompanies: 0,
      totalEmployees: 0,
      futureScheduledCourses: 0,
      expiringCourses: 0
    }
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [gdprConsent, setGdprConsent] = useState<boolean | null>(null);
  
  const { user } = useAuth();
  const { tenant } = useTenant();
  const cacheRef = useRef<{ data: DashboardData; timestamp: number } | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Check GDPR consent
  const checkDashboardConsent = useCallback(async (): Promise<boolean> => {
    try {
      const consent = await checkConsent(user?.id || 'anonymous', 'data_processing');
      setGdprConsent(consent.hasConsent);
      return consent.hasConsent;
    } catch (error) {
      console.error('Error checking GDPR consent:', error);
      setGdprConsent(false);
      return false;
    }
  }, []);

  // Enhanced fetch with timeout and retry logic
  const fetchWithTimeout = useCallback(async (
    url: string, 
    options: FetchOptions = {}
  ): Promise<any> => {
    const { timeout = DEFAULT_TIMEOUT, retries = DEFAULT_RETRIES } = options;
    
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const token = getToken();
        if (!token) {
          throw new Error('No authentication token available');
        }

        const controller = new AbortController();
        abortControllerRef.current = controller;
        
        const timeoutId = setTimeout(() => controller.abort(), timeout);
        
        const response = await apiGet(url, {
          signal: controller.signal,
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        clearTimeout(timeoutId);
        return response;
      } catch (error: any) {
        console.warn(`Attempt ${attempt}/${retries} failed for ${url}:`, error.message);
        
        if (attempt === retries) {
          throw error;
        }
        
        // Wait before retry (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }
  }, []);

  // Fetch counters with fallback to dummy data
  const fetchCounters = useCallback(async (): Promise<DashboardCounters> => {
    try {
      const response = await fetchWithTimeout('/api/counters');
      return {
        totalCompanies: response.companies || 0,
        totalEmployees: response.employees || 0,
        futureScheduledCourses: response.futureScheduledCourses || 0,
        expiringCourses: response.expiringCourses || 0
      };
    } catch (error) {
      console.warn('Failed to fetch counters, using fallback data:', error);
      return {
        totalCompanies: 12,
        totalEmployees: 156,
        futureScheduledCourses: 8,
        expiringCourses: 3
      };
    }
  }, [fetchWithTimeout]);

  // Main data fetching function
  const fetchData = useCallback(async (options: FetchOptions = {}) => {
    const { useCache = true } = options;
    
    // Check cache first
    if (useCache && cacheRef.current) {
      const { data: cachedData, timestamp } = cacheRef.current;
      if (Date.now() - timestamp < CACHE_DURATION) {
        setData(cachedData);
        return cachedData;
      }
    }

    setIsLoading(true);
    setError(null);

    try {
      // Check GDPR consent first
      const hasConsent = await checkDashboardConsent();
      if (!hasConsent) {
        throw new Error('GDPR consent required to access dashboard data');
      }

      // Check user permissions
      if (!user?.permissions?.includes('dashboard:read')) {
        throw new Error('Insufficient permissions to access dashboard data');
      }

      // Fetch counters first
      const counters = await fetchCounters();

      // Fetch all data in parallel
      const [coursesResponse, trainersResponse, schedulesResponse] = await Promise.allSettled([
        fetchWithTimeout('/api/courses', options),
        fetchWithTimeout('/api/trainers', options),
        fetchWithTimeout('/api/schedules', options)
      ]);

      // Process results with safety checks
      const courses = coursesResponse.status === 'fulfilled' ? coursesResponse.value : [];
      const trainers = trainersResponse.status === 'fulfilled' ? trainersResponse.value : [];
      const schedules = schedulesResponse.status === 'fulfilled' ? schedulesResponse.value : [];

      // Transform trainer data to match expected format
      const transformedTrainers = Array.isArray(trainers) ? trainers.map((trainer: any) => ({
        id: trainer.id,
        firstName: trainer.firstName || '',
        lastName: trainer.lastName || '',
        certifications: trainer.certifications || []
      })) : [];

      // Extract companies and employees from courses
      const companies: DashboardCompany[] = [];
      const employees: DashboardEmployee[] = [];
      
      if (Array.isArray(courses)) {
        courses.forEach((course: any) => {
          if (course.companies) {
            course.companies.forEach((company: any) => {
              if (!companies.find(c => c.id === company.id)) {
                companies.push({
                  id: company.id,
                  ragioneSociale: company.ragioneSociale || company.name || '',
                  name: company.name
                });
              }
            });
          }
          
          if (course.employees) {
            course.employees.forEach((employee: any) => {
              if (!employees.find(e => e.id === employee.id)) {
                employees.push({
                  id: employee.id,
                  firstName: employee.firstName || '',
                  lastName: employee.lastName || '',
                  companyId: employee.companyId || employee.company_id || '',
                  company: employee.company
                });
              }
            });
          }
        });
      }

      const dashboardData: DashboardData = {
        companies,
        trainers: transformedTrainers,
        employees,
        schedules: Array.isArray(schedules) ? schedules : [],
        counters
      };

      // Update cache
      cacheRef.current = {
        data: dashboardData,
        timestamp: Date.now()
      };

      setData(dashboardData);
      return dashboardData;
    } catch (error: any) {
      console.error('Error fetching dashboard data:', error);
      setError(error.message || 'Failed to fetch dashboard data');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [user, checkDashboardConsent, fetchCounters, fetchWithTimeout]);

  // Load fallback data
  const loadFallbackData = useCallback(() => {
    const fallbackData: DashboardData = {
      companies: [
        { id: '1', ragioneSociale: 'Azienda Demo 1' },
        { id: '2', ragioneSociale: 'Azienda Demo 2' }
      ],
      trainers: [
        { id: '1', firstName: 'Mario', lastName: 'Rossi', certifications: ['Sicurezza'] },
        { id: '2', firstName: 'Luigi', lastName: 'Verdi', certifications: ['Antincendio'] }
      ],
      employees: [
        { id: '1', firstName: 'Giuseppe', lastName: 'Bianchi', companyId: '1' },
        { id: '2', firstName: 'Anna', lastName: 'Neri', companyId: '2' }
      ],
      schedules: [],
      counters: {
        totalCompanies: 12,
        totalEmployees: 156,
        futureScheduledCourses: 8,
        expiringCourses: 3
      }
    };
    
    setData(fallbackData);
    setError(null);
  }, []);

  // Clear cache
  const clearCache = useCallback(() => {
    cacheRef.current = null;
  }, []);

  // Cancel ongoing requests
  const cancelRequests = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  return {
    data,
    isLoading,
    error,
    gdprConsent,
    fetchData,
    loadFallbackData,
    clearCache,
    cancelRequests,
    checkDashboardConsent
  };
};

export default useDashboardData;