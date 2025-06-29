// Company types
export interface Company {
  id: string;
  name: string;
  industry?: string;
  status?: 'Active' | 'Inactive';
  location?: string;
  employees_count?: number;
  established_year?: number;
  contact_person?: string;
  phone?: string;
  email?: string;
  address?: string;
  website?: string;
  description?: string;
  codice_ateco?: string;
  vat_number?: string;
  fiscal_code?: string;
  sdi?: string;
  pec?: string;
  iban?: string;
  city?: string;
  province?: string;
  postal_code?: string;
  notes?: string;
}

// Employee types
export interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  title: string;
  department: string;
  companyId: string;
  status: 'Active' | 'On Leave' | 'Inactive';
  email: string;
  phone: string;
  dateOfBirth: string;
  address: string;
  employeeId?: string;
  startDate?: string;
}

// Course types
export interface Course {
  id: string;
  title: string;
  category: string;
  description: string;
  duration: string;
  status: 'Active' | 'Inactive';
  rating: number;
  enrolled: number;
}

// Medical record types
export interface MedicalRecord {
  id: string;
  employeeId: string;
  date: Date;
  type: string;
  status: 'Scheduled' | 'Completed' | 'Cancelled';
  notes?: string;
  attachments?: string[];
  provider?: string;
}

// Training record types
export interface TrainingRecord {
  id: string;
  employeeId: string;
  courseId: string;
  completionDate?: Date;
  expiryDate?: Date;
  status: 'Enrolled' | 'In Progress' | 'Completed' | 'Expired';
  score?: number;
  certificateUrl?: string;
}

// Assessment types
export interface Assessment {
  id: string;
  employeeId: string;
  type: 'Annual' | 'Pre-employment' | 'Special';
  date: Date;
  status: 'Scheduled' | 'Completed' | 'Cancelled';
  results?: AssessmentResult[];
  recommendations?: string;
  nextAssessmentDate?: Date;
}

export interface AssessmentResult {
  test: string;
  result: string;
  normalRange?: string;
  isNormal: boolean;
}

// Authentication types
export interface User {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  permissions?: string[];
}

export interface AuthResponse {
  user: User;
  token: string;
  permissions?: Record<string, boolean>;
}

export interface AuthVerifyResponse {
  user: User;
  permissions: Record<string, boolean>;
}

export interface LoginRequest {
  identifier: string; // Può essere email, username o codice fiscale
  password: string;
}

// Import template response interface
export interface ImportWithTemplateResponse {
  success: boolean;
  message: string;
  data?: any;
}

export * from './courses';
export * from './gdpr';
export * from './preferences';

// Database types per le interazioni con l'API
export interface Database {
  public: {
    Tables: {
      companies: {
        Row: Company;
        Insert: Omit<Company, 'id'> & { id?: string };
        Update: Partial<Omit<Company, 'id'>>;
      };
      employees: {
        Row: Employee;
        Insert: Omit<Employee, 'id'> & { id?: string };
        Update: Partial<Omit<Employee, 'id'>>;
      };
      courses: {
        Row: Course;
        Insert: Omit<Course, 'id'> & { id?: string };
        Update: Partial<Omit<Course, 'id'>>;
      };
      trainers: {
        Row: {
          id: string;
          firstName: string;
          lastName: string;
          specialties?: string[];
          tariffaOraria?: number;
        };
        Insert: Omit<{ id: string; firstName: string; lastName: string; specialties?: string[]; tariffaOraria?: number }, 'id'> & { id?: string };
        Update: Partial<Omit<{ id: string; firstName: string; lastName: string; specialties?: string[]; tariffaOraria?: number }, 'id'>>;
      };
    };
  };
}