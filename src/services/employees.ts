import { createService } from './serviceFactory';
import type { Database } from '../types';

type Employee = Database['public']['Tables']['employees']['Row'];
type EmployeeInsert = Database['public']['Tables']['employees']['Insert'];
type EmployeeUpdate = Database['public']['Tables']['employees']['Update'];

// Creazione del servizio base usando la factory
const baseService = createService<Employee, EmployeeInsert, EmployeeUpdate>('/employees');

// Estensione del servizio con eventuali metodi specifici
const employeeService = baseService.extend({
  // Qui si possono aggiungere metodi specifici se necessario
  getEmployeesByCompany: async (companyId: string): Promise<Employee[]> => {
    const employees = await baseService.getAll();
    return employees.filter(emp => emp.companyId === companyId);
  }
});

// Esportazione dei metodi standard
export const getEmployees = employeeService.getAll;
export const getEmployee = employeeService.getById;
export const createEmployee = employeeService.create;
export const updateEmployee = employeeService.update;
export const deleteEmployee = employeeService.delete;
export const getEmployeesByCompany = employeeService.getEmployeesByCompany;

// Esportazione del servizio completo come default
export default employeeService;