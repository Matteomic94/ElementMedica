import React, { useState, useEffect } from 'react';
import employeeService from '../../services/employees';

interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  companyId?: string;
  company?: {
    id: string;
    ragione_sociale: string;
  };
}

// Mock data for fallback when API fails
const MOCK_EMPLOYEES: Employee[] = [
  {
    id: "mock-emp-1",
    first_name: "Mario",
    last_name: "Rossi",
    email: "mario.rossi@example.com",
    phone: "+39 123 456 7890",
    companyId: "mock-company-1",
    company: {
      id: "mock-company-1",
      ragione_sociale: "Azienda Demo SpA"
    }
  },
  {
    id: "mock-emp-2", 
    first_name: "Luigi",
    last_name: "Verdi",
    email: "luigi.verdi@example.com",
    phone: "+39 123 456 7891",
    companyId: "mock-company-1",
    company: {
      id: "mock-company-1",
      ragione_sociale: "Azienda Demo SpA"
    }
  },
  {
    id: "mock-emp-3",
    first_name: "Giulia",
    last_name: "Bianchi",
    email: "giulia.bianchi@example.com",
    phone: "+39 123 456 7892",
    companyId: "mock-company-2",
    company: {
      id: "mock-company-2",
      ragione_sociale: "Test Srl"
    }
  }
];

export function useEmployees() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState('');
  const [usingFallback, setUsingFallback] = useState(false);

  useEffect(() => {
    fetchEmployees();
  }, []);

  useEffect(() => {
    if (filter.trim() === '') {
      setFilteredEmployees(employees);
    } else {
      const lowercaseFilter = filter.toLowerCase();
      const filtered = employees.filter(employee => 
        employee.first_name.toLowerCase().includes(lowercaseFilter) ||
        employee.last_name.toLowerCase().includes(lowercaseFilter) ||
        (employee.email && employee.email.toLowerCase().includes(lowercaseFilter)) ||
        (employee.company?.ragione_sociale && employee.company.ragione_sociale.toLowerCase().includes(lowercaseFilter))
      );
      setFilteredEmployees(filtered);
    }
  }, [filter, employees]);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      setError(null);
      setUsingFallback(false);
      
      // Use timeout to ensure we don't wait too long for API response
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);
      
      const response = await employeeService.getEmployees();
      
      clearTimeout(timeoutId);
      
      if (response && Array.isArray(response)) {
        setEmployees(response);
        setFilteredEmployees(response);
      } else {
        throw new Error('Invalid data format received from API');
      }
    } catch (err: any) {
      console.error('Error fetching employees:', err);
      // Use fallback data
      console.log('Using fallback employee data');
      setEmployees(MOCK_EMPLOYEES);
      setFilteredEmployees(MOCK_EMPLOYEES);
      setError(err.message || 'Failed to fetch employees');
      setUsingFallback(true);
    } finally {
      setLoading(false);
    }
  };

  return {
    employees,
    filteredEmployees,
    loading,
    error,
    filter,
    setFilter,
    fetchEmployees,
    usingFallback
  };
}