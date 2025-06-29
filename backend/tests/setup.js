const { PrismaClient } = require('@prisma/client');
const bcryptjs = require('bcryptjs');
const dotenv = require('dotenv');

// Load test environment variables
dotenv.config({ path: '.env.test' });

// Set NODE_ENV to test
process.env.NODE_ENV = 'test';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || process.env.TEST_DATABASE_URL
    }
  },
  log: ['error'] // Only log errors during tests
});

// Global test setup
beforeAll(async () => {
  try {
    // Connect to database
    await prisma.$connect();
    
    // Verify database connection
    await prisma.$queryRaw`SELECT 1`;
    
    console.log('✅ Test database connected successfully');
  } catch (error) {
    console.error('❌ Failed to connect to test database:', error);
    throw error;
  }
});

// Global test teardown
afterAll(async () => {
  try {
    // Clean up all test data
    await cleanupTestData();
    
    // Disconnect from database
    await prisma.$disconnect();
    
    console.log('✅ Test database disconnected successfully');
  } catch (error) {
    console.error('❌ Failed to disconnect from test database:', error);
    throw error;
  }
});

// Helper function to clean up test data
async function cleanupTestData() {
  try {
    // Delete in correct order to respect foreign key constraints
    await prisma.courseEnrollment.deleteMany({});
    await prisma.courseSchedule.deleteMany({});
    await prisma.employee.deleteMany({});
    await prisma.course.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.company.deleteMany({});
    
    console.log('✅ Test data cleaned up successfully');
  } catch (error) {
    console.error('❌ Failed to clean up test data:', error);
    // Don't throw here as this is cleanup
  }
}

// Helper function to create test company
async function createTestCompany(data = {}) {
  return await prisma.company.create({
    data: {
      ragione_sociale: 'Test Company',
      mail: 'test@company.com',
      telefono: '1234567890',
      sede_azienda: 'Test Address',
      citta: 'Test City',
      provincia: 'Test Province',
      cap: '12345',
      piva: '12345678901',
      codice_fiscale: 'TSTCMP12345678',
      is_active: true,
      ...data
    }
  });
}

// Helper function to create test user
async function createTestUser(companyId, data = {}) {
  const hashedPassword = await bcryptjs.hash('Admin123!', 12);
  
  return await prisma.user.create({
    data: {
      username: 'admin',
      email: 'admin@example.com',
      password: hashedPassword,
      firstName: 'Admin',
      lastName: 'User',
      isActive: true,
      companyId,
      ...data
    }
  });
}

// Helper function to create test employee
async function createTestEmployee(companyId, data = {}) {
  return await prisma.employee.create({
    data: {
      first_name: 'Test',
      last_name: 'Employee',
      email: 'employee@test.com',
      phone: '1234567890',
      codice_fiscale: 'TSTMPL12345678',
      birth_date: new Date('1990-01-01'),
      residence_address: 'Test Address',
      residence_city: 'Test City',
      province: 'Test Province',
      postal_code: '12345',
      companyId,
      ...data
    }
  });
}

// Helper function to create test course
async function createTestCourse(companyId, data = {}) {
  return await prisma.course.create({
    data: {
      name: 'Test Course',
      description: 'Test Description',
      duration: 8,
      validityYears: 3,
      category: 'safety',
      companyId,
      isActive: true,
      ...data
    }
  });
}

// Export all functions and prisma instance for tests
module.exports = {
  prisma,
  createTestCompany,
  createTestUser,
  createTestEmployee,
  createTestCourse
};

// Mock console methods to reduce test noise
if (process.env.NODE_ENV === 'test') {
  global.console = {
    ...console,
    log: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: console.error // Keep error logging
  };
}