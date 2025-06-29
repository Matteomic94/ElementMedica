export interface Course {
  id: string;
  title: string;
  category?: string;
  description?: string;
  duration?: string | number; // Può essere sia string che number
  status?: string;
  created_at: string;
  updated_at: string;
  code?: string;
  validityYears?: number; // Int in the Prisma schema
  renewalDuration?: string;
  pricePerPerson?: number; // Float in the Prisma schema
  certifications?: string;
  maxPeople?: number; // Int in the Prisma schema
  regulation?: string;
  contents?: string;
  price?: number; // Float in the Prisma schema
}

export interface CourseSchedule {
  id: string;
  courseId: string;
  start_date: string;
  end_date: string;
  location?: string;
  max_participants?: number;
  status?: string;
  created_at: string;
  updated_at: string;
}

export interface CourseEnrollment {
  id: string;
  scheduleId: string;
  employeeId: string;
  status?: string;
  created_at: string;
  updated_at: string;
  employee?: {
    id: string;
    first_name: string;
    last_name: string;
    email?: string;
    company?: {
      id: string;
      name: string;
    };
  };
}

export interface CourseFormProps {
  course?: Course;
  onSubmit: () => void;
  onCancel: () => void;
} 